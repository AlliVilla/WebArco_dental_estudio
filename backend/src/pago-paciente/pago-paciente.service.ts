import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

const paymentInclude = {
  consulta: {
    select: {
      id_consulta: true,
      diagnostico: true,
      tratamiento: true,
      persona: {
        select: {
          primer_nombre: true,
          segundo_nombre: true,
          primer_apellido: true,
          segundo_apellido: true,
        },
      },
      doctor: {
        select: {
          id_usuario: true,
          persona: {
            select: {
              primer_nombre: true,
              primer_apellido: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.PagoPacienteInclude;

type PaymentWithRelations = Prisma.PagoPacienteGetPayload<{
  include: typeof paymentInclude;
}>;

@Injectable()
export class PagoPacienteService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPaymentDto: CreatePaymentDto) {
    await this.assertConsultaExists(createPaymentDto.id_consulta);

    if (createPaymentDto.abono <= 0) {
      throw new BadRequestException('El monto del pago debe ser mayor a 0');
    }

    const pagosPrevios = await this.prisma.pagoPaciente.findMany({
      where: { id_consulta: createPaymentDto.id_consulta },
    });

    const tratamientos = await this.prisma.consulta_Tratamiento.findMany({
      where: { id_consulta: createPaymentDto.id_consulta },
    });

    const subtotalBruto = tratamientos.reduce((sum, t) => sum + Number(t.precio), 0);
    const totalDescuento = tratamientos.reduce((sum, t) => sum + (Number(t.precio) * ((t.descuento || 0) / 100)), 0);
    const subtotalNeto = subtotalBruto - totalDescuento;
    const isv = subtotalNeto * 0.15;
    const totalConsulta = subtotalNeto + isv;

    const totalPagado = pagosPrevios.reduce((sum, p) => sum + Number(p.abono), 0);
    const saldoPendiente = Math.max(0, totalConsulta - totalPagado);

    if (createPaymentDto.metodoPago !== 'Efectivo' && createPaymentDto.abono > saldoPendiente + 0.01) {
      throw new BadRequestException(
        `El pago (L. ${createPaymentDto.abono.toFixed(2)}) excede el saldo pendiente calculado (L. ${saldoPendiente.toFixed(2)})`
      );
    }

    const pago = await this.prisma.pagoPaciente.create({
      data: {
        id_consulta: createPaymentDto.id_consulta,
        fecha: new Date(createPaymentDto.fecha),
        abono: createPaymentDto.abono,
        metodo_pago: createPaymentDto.metodoPago ?? 'Efectivo',
        observacion: createPaymentDto.observacion,
        firma_paciente: createPaymentDto.firma_paciente,
      },
      include: paymentInclude,
    });

    return {
      ...this.mapPayment(pago),
      message: 'Ingreso registrado exitosamente',
    };
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [pagos, total] = await this.prisma.$transaction([
      this.prisma.pagoPaciente.findMany({
        skip,
        take: limit,
        include: paymentInclude,
        orderBy: { fecha: 'desc' },
      }),
      this.prisma.pagoPaciente.count(),
    ]);

    return {
      data: pagos.map((pago) => this.mapPayment(pago)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      message: `Mostrando ${pagos.length} de ${total} ingresos`,
    };
  }

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

  private async assertConsultaExists(idConsulta: number) {
    const consulta = await this.prisma.consulta.findUnique({
      where: { id_consulta: idConsulta },
      select: { id_consulta: true },
    });

    if (!consulta) {
      throw new NotFoundException(`No se encontró la consulta con id ${idConsulta}`);
    }
  }

  async update(id: number, updatePaymentDto: UpdatePaymentDto) {
    const pago = await this.prisma.pagoPaciente.findUnique({
      where: { id_pago: id },
      select: { id_pago: true },
    });

    if (!pago) {
      throw new NotFoundException(`No se encontró el pago con id ${id}`);
    }

    if (updatePaymentDto.id_consulta !== undefined) {
      await this.assertConsultaExists(updatePaymentDto.id_consulta);
    }

    const updatedPayment = await this.prisma.pagoPaciente.update({
      where: { id_pago: id },
      data: {
        ...(updatePaymentDto.id_consulta !== undefined && { id_consulta: updatePaymentDto.id_consulta }),
        ...(updatePaymentDto.fecha !== undefined && { fecha: new Date(updatePaymentDto.fecha) }),
        ...(updatePaymentDto.abono !== undefined && { abono: updatePaymentDto.abono }),
        ...(updatePaymentDto.metodoPago !== undefined && { metodo_pago: updatePaymentDto.metodoPago }),
        ...(updatePaymentDto.observacion !== undefined && { observacion: updatePaymentDto.observacion }),
        ...(updatePaymentDto.firma_paciente !== undefined && { firma_paciente: updatePaymentDto.firma_paciente }),
      },
      include: paymentInclude,
    });

    return {
      ...this.mapPayment(updatedPayment),
      message: 'Pago actualizado exitosamente',
    };
  }

  async remove(id: number) {
    const pago = await this.prisma.pagoPaciente.findUnique({
      where: { id_pago: id },
      select: { id_pago: true },
    });

    if (!pago) {
      throw new NotFoundException(`No se encontró el pago con id ${id}`);
    }

    await this.prisma.pagoPaciente.delete({ where: { id_pago: id } });

    return { message: 'Pago eliminado exitosamente' };
  }

  private mapPayment(pago: PaymentWithRelations) {
    const persona = pago.consulta.persona;

    return {
      id_pago: pago.id_pago,
      id_consulta: pago.id_consulta,
      fecha: pago.fecha.toISOString().split('T')[0],
      abono: Number(pago.abono),
      metodoPago: pago.metodo_pago,
      estado: pago.estado,
      observacion: pago.observacion,
      firma_paciente: pago.firma_paciente,
      consulta: {
        id_consulta: pago.consulta.id_consulta,
        diagnostico: pago.consulta.diagnostico,
        tratamiento: pago.consulta.tratamiento,
        persona: {
          nombre: [persona.primer_nombre, persona.segundo_nombre]
            .filter(Boolean)
            .join(' '),
          apellido: [persona.primer_apellido, persona.segundo_apellido]
            .filter(Boolean)
            .join(' '),
        },
        doctor: pago.consulta.doctor
          ? {
              id_usuario: pago.consulta.doctor.id_usuario,
              nombre: `Dr. ${pago.consulta.doctor.persona.primer_nombre} ${pago.consulta.doctor.persona.primer_apellido}`,
            }
          : null,
      },
    };
  }
}
