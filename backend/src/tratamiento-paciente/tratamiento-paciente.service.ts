import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTratamientoPacienteDto } from './dto/create-tratamiento-paciente.dto';
import { TratamientoEstado } from '@prisma/client';

@Injectable()
export class TratamientoPacienteService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTratamientoPacienteDto) {
    const persona = await this.prisma.persona.findUnique({
      where: { id_persona: dto.pacienteId },
    });
    if (!persona) {
      throw new NotFoundException(`No existe el paciente con id ${dto.pacienteId}`);
    }

    const tratamiento = await this.prisma.tratamientoPaciente.create({
      data: {
        pacienteId: dto.pacienteId,
        nombre: dto.nombre,
        costoTotal: dto.costoTotal,
        fechaInicio: new Date(dto.fechaInicio),
        fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : null,
      },
    });

    return this.toResponse(tratamiento);
  }

  async findByPaciente(pacienteId: number) {
    const tratamientos = await this.prisma.tratamientoPaciente.findMany({
      where: { pacienteId },
      include: {
        consultas: {
          orderBy: { fecha_inicio: 'desc' },
          include: {
            pagosConsulta: true,
          },
        },
        abonos: {
          include: {
            pagoConsulta: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tratamientos.map((t) => this.toResponse(t));
  }

  async findOne(id: number) {
    const t = await this.prisma.tratamientoPaciente.findUnique({
      where: { id },
      include: {
        consultas: {
          orderBy: { fecha_inicio: 'desc' },
          include: {
            doctor: {
              select: {
                id_usuario: true,
                username: true,
                persona: {
                  select: { primer_nombre: true, primer_apellido: true },
                },
              },
            },
            pagosConsulta: true,
          },
        },
        abonos: {
          include: {
            pagoConsulta: {
              include: { consulta: true },
            },
          },
        },
      },
    });

    if (!t) throw new NotFoundException('Tratamiento del paciente no encontrado');
    return this.toResponse(t);
  }

  async updateEstado(id: number, estado: TratamientoEstado) {
    const t = await this.prisma.tratamientoPaciente.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Tratamiento del paciente no encontrado');

    const updated = await this.prisma.tratamientoPaciente.update({
      where: { id },
      data: {
        estado,
        fechaFin: estado === 'COMPLETADO' ? new Date() : t.fechaFin,
      },
    });

    return this.toResponse(updated);
  }

  private toResponse(t: any) {
    const totalAbonado = t.abonos
      ? t.abonos.reduce((sum: number, a: any) => sum + Number(a.montoAbonado), 0)
      : 0;

    return {
      id: t.id,
      pacienteId: t.pacienteId,
      nombre: t.nombre,
      costoTotal: Number(t.costoTotal),
      saldoPendiente: Number(t.costoTotal) - totalAbonado,
      totalAbonado,
      estado: t.estado,
      fechaInicio: t.fechaInicio,
      fechaFin: t.fechaFin,
      consultas: t.consultas || [],
      abonos: t.abonos || [],
    };
  }
}
