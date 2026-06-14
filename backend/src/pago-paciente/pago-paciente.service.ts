import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePagoPacienteDto } from './dto/create-pago-paciente.dto';

@Injectable()
export class PagoPacienteService {
  constructor(private readonly prisma: PrismaService) {}

  async findByConsulta(consultaId: number) {
    const consulta = await this.prisma.consulta.findUnique({
      where: { id_consulta: consultaId },
    });
    if (!consulta) {
      throw new NotFoundException(`No existe la consulta con id ${consultaId}`);
    }

    const pagos = await this.prisma.pagoPaciente.findMany({
      where: { id_consulta: consultaId },
      orderBy: { fecha: 'desc' },
    });

    // Calcular total de la consulta (suma de precios - descuentos)
    const tratamientos = await this.prisma.consulta_Tratamiento.findMany({
      where: { id_consulta: consultaId },
    });
    const total = tratamientos.reduce(
      (sum, t) => sum + Number(t.precio) - (t.descuento || 0),
      0,
    );
    const totalPagado = pagos.reduce((sum, p) => sum + Number(p.abono), 0);
    const saldoPendiente = Math.max(0, total - totalPagado);

    return {
      consulta: { id_consulta: consultaId, total },
      pagos,
      resumen: {
        total,
        totalPagado,
        saldoPendiente,
        pagadaCompletamente: saldoPendiente <= 0 && total > 0,
      },
    };
  }

  async create(dto: CreatePagoPacienteDto) {
    const consulta = await this.prisma.consulta.findUnique({
      where: { id_consulta: dto.id_consulta },
    });
    if (!consulta) {
      throw new NotFoundException(`No existe la consulta con id ${dto.id_consulta}`);
    }

    if (dto.abono <= 0) {
      throw new BadRequestException('El monto del pago debe ser mayor a 0');
    }

    // Validar que no exceda el saldo pendiente
    const tratamientos = await this.prisma.consulta_Tratamiento.findMany({
      where: { id_consulta: dto.id_consulta },
    });
    const pagosPrevios = await this.prisma.pagoPaciente.findMany({
      where: { id_consulta: dto.id_consulta },
    });
    const total = tratamientos.reduce(
      (sum, t) => sum + Number(t.precio) - (t.descuento || 0),
      0,
    );
    const totalPagado = pagosPrevios.reduce((sum, p) => sum + Number(p.abono), 0);
    const saldoPendiente = Math.max(0, total - totalPagado);

    if (dto.abono > saldoPendiente) {
      throw new BadRequestException(
        `El pago (L. ${dto.abono.toFixed(2)}) excede el saldo pendiente (L. ${saldoPendiente.toFixed(2)})`,
      );
    }

    const pago = await this.prisma.pagoPaciente.create({
      data: {
        id_consulta: dto.id_consulta,
        fecha: new Date(dto.fecha),
        abono: dto.abono,
        observacion: dto.observacion ?? null,
      },
    });

    return pago;
  }
}
