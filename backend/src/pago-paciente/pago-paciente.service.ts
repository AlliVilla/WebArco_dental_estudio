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
        observacion: createPaymentDto.observacion ?? null,
        firma_paciente: createPaymentDto.firma_paciente ?? null,
      },
      include: paymentInclude,
    });

    return {
      ...this.mapPayment(pago),
      message: 'Ingreso registrado exitosamente',
    };
  }

  async findAll() {
    const pagos = await this.prisma.pagoPaciente.findMany({
      include: paymentInclude,
      orderBy: { fecha: 'desc' },
    });

    return pagos.map((pago) => this.mapPayment(pago));
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

  private mapPayment(pago: PaymentWithRelations) {
    const persona = pago.consulta?.persona;

    return {
      id_pago: pago.id_pago,
      id_consulta: pago.id_consulta,
      fecha: pago.fecha.toISOString().split('T')[0],
      abono: Number(pago.abono),
      observacion: pago.observacion ?? undefined,
      firma_paciente: pago.firma_paciente ?? undefined,
      consulta: pago.consulta
        ? {
            id_consulta: pago.consulta.id_consulta,
            diagnostico: pago.consulta.diagnostico ?? undefined,
            tratamiento: pago.consulta.tratamiento ?? undefined,
            persona: persona
              ? {
                  nombre: [persona.primer_nombre, persona.segundo_nombre]
                    .filter(Boolean)
                    .join(' '),
                  apellido: [persona.primer_apellido, persona.segundo_apellido]
                    .filter(Boolean)
                    .join(' '),
                }
              : undefined,
          }
        : undefined,
    };
  }
}
