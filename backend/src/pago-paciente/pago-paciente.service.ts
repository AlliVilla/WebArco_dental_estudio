import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

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

  private async assertConsultaExists(idConsulta: number) {
    const consulta = await this.prisma.consulta.findUnique({
      where: { id_consulta: idConsulta },
      select: { id_consulta: true },
    });

    if (!consulta) {
      throw new NotFoundException(`No se encontró la consulta con id ${idConsulta}`);
    }
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
