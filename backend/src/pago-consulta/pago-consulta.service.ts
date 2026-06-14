import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePagoConsultaDto } from './dto/create-pago-consulta.dto';

@Injectable()
export class PagoConsultaService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePagoConsultaDto) {
    const consulta = await this.prisma.consulta.findUnique({
      where: { id_consulta: dto.consultaId },
      include: { persona: true },
    });
    if (!consulta) {
      throw new NotFoundException(`No existe la consulta con id ${dto.consultaId}`);
    }

    const pacienteId = consulta.id_persona;

    const totalAbonos = dto.abonos.reduce((sum, a) => sum + a.montoAbonado, 0);
    if (Math.abs(totalAbonos - dto.monto) > 0.01) {
      throw new BadRequestException(
        `La suma de los abonos (L. ${totalAbonos.toFixed(2)}) debe ser igual al monto total (L. ${dto.monto.toFixed(2)})`,
      );
    }

    for (const abono of dto.abonos) {
      const tratamiento = await this.prisma.tratamientoPaciente.findUnique({
        where: { id: abono.tratamientoPacienteId },
      });
      if (!tratamiento) {
        throw new NotFoundException(
          `No existe el tratamiento de paciente con id ${abono.tratamientoPacienteId}`,
        );
      }
      if (tratamiento.pacienteId !== pacienteId) {
        throw new BadRequestException(
          `El tratamiento "${tratamiento.nombre}" no pertenece al mismo paciente`,
        );
      }
      if (tratamiento.estado !== 'ACTIVO') {
        throw new BadRequestException(
          `El tratamiento "${tratamiento.nombre}" no está ACTIVO (estado: ${tratamiento.estado})`,
        );
      }
    }

    const pago = await this.prisma.$transaction(async (tx) => {
      const pagoC = await tx.pagoConsulta.create({
        data: {
          consultaId: dto.consultaId,
          monto: dto.monto,
          metodoPago: dto.metodoPago,
          observacion: dto.observacion,
          abonos: {
            create: dto.abonos.map((a) => ({
              tratamientoPacienteId: a.tratamientoPacienteId,
              montoAbonado: a.montoAbonado,
            })),
          },
        },
        include: { abonos: true },
      });

      for (const abono of dto.abonos) {
        await this.checkAndAutoComplete(tx, abono.tratamientoPacienteId);
      }

      return pagoC;
    });

    return pago;
  }

  async findByConsulta(consultaId: number) {
    const consulta = await this.prisma.consulta.findUnique({
      where: { id_consulta: consultaId },
    });
    if (!consulta) {
      throw new NotFoundException(`No existe la consulta con id ${consultaId}`);
    }

    const pagos = await this.prisma.pagoConsulta.findMany({
      where: { consultaId },
      include: {
        abonos: {
          include: {
            tratamientoPaciente: {
              select: { id: true, nombre: true, costoTotal: true },
            },
          },
        },
      },
      orderBy: { fecha: 'desc' },
    });

    return pagos;
  }

  async getEstadoFinanciero(pacienteId: number) {
    const tratamientos = await this.prisma.tratamientoPaciente.findMany({
      where: { pacienteId },
      include: {
        abonos: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return tratamientos.map((t) => {
      const totalPagado = t.abonos.reduce((s, a) => s + Number(a.montoAbonado), 0);
      return {
        id: t.id,
        nombre: t.nombre,
        costoTotal: Number(t.costoTotal),
        totalPagado,
        saldoPendiente: Number(t.costoTotal) - totalPagado,
        estado: t.estado,
        fechaInicio: t.fechaInicio,
        fechaFin: t.fechaFin,
      };
    });
  }

  private async checkAndAutoComplete(tx: any, tratamientoPacienteId: number) {
    const tratamiento = await tx.tratamientoPaciente.findUnique({
      where: { id: tratamientoPacienteId },
      include: { abonos: true },
    });

    if (!tratamiento || tratamiento.estado !== 'ACTIVO') return;

    const totalAbonado = tratamiento.abonos.reduce(
      (sum: number, a: any) => sum + Number(a.montoAbonado),
      0,
    );

    if (totalAbonado >= Number(tratamiento.costoTotal)) {
      await tx.tratamientoPaciente.update({
        where: { id: tratamientoPacienteId },
        data: { estado: 'COMPLETADO', fechaFin: new Date() },
      });
    }
  }
}
