import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePreguntaDto } from './dto/create-pregunta.dto';
import { RespuestaItemDto } from './dto/save-respuestas.dto';

const preguntaSelect = {
  id_pregunta: true,
  pregunta: true,
  orden_num: true,
  requiere_explicacion: true,
  categoria: true,
} satisfies Prisma.ConsultaPreguntaSelect;

const respuestaInclude = {
  pregunta: { select: preguntaSelect },
} satisfies Prisma.ConsultaRespuestaInclude;

@Injectable()
export class ConsultaPreguntaService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.consultaPregunta.findMany({
      select: preguntaSelect,
      orderBy: { orden_num: 'asc' },
    });
  }

  create(dto: CreatePreguntaDto) {
    return this.prisma.consultaPregunta.create({
      data: {
        pregunta: dto.pregunta,
        orden_num: dto.orden_num,
        requiere_explicacion: dto.requiere_explicacion ?? false,
        categoria: dto.categoria ?? "Antecedentes Médicos",
      },
      select: preguntaSelect,
    });
  }

  async findRespuestasByConsulta(id_consulta: number) {
    await this.assertConsultaExists(id_consulta);

    return this.prisma.consultaRespuesta.findMany({
      where: { id_consulta },
      include: respuestaInclude,
      orderBy: { pregunta: { orden_num: 'asc' } },
    });
  }

  async saveRespuestas(id_consulta: number, respuestas: RespuestaItemDto[]) {
    await this.assertConsultaExists(id_consulta);
    this.validateRespuestas(respuestas);

    const preguntaIds = respuestas.map((r) => r.id_pregunta);
    const preguntas = await this.prisma.consultaPregunta.findMany({
      where: { id_pregunta: { in: preguntaIds } },
      select: preguntaSelect,
    });

    if (preguntas.length !== preguntaIds.length) {
      const existentesIds = new Set(preguntas.map((p) => p.id_pregunta));
      const inexistentes = preguntaIds.filter((id) => !existentesIds.has(id));
      throw new BadRequestException(
        `Las siguientes preguntas no existen: ${inexistentes.join(', ')}`,
      );
    }

    const preguntasMap = new Map(preguntas.map((p) => [p.id_pregunta, p]));
    for (const r of respuestas) {
      const pregunta = preguntasMap.get(r.id_pregunta);
      if (
        pregunta?.requiere_explicacion &&
        r.respuestaBoolean === true &&
        !r.explanation?.trim()
      ) {
        throw new BadRequestException(
          `La pregunta ${r.id_pregunta} requiere una explicación para respuesta afirmativa`,
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.consultaRespuesta.deleteMany({ where: { id_consulta } });
      if (respuestas.length > 0) {
        await tx.consultaRespuesta.createMany({
          data: respuestas.map((r) => ({
            id_consulta,
            id_pregunta: r.id_pregunta,
            respuesta_boolean: r.respuestaBoolean,
            explanation: r.explanation?.trim() ?? null,
          })),
        });
      }
    });

    return this.prisma.consultaRespuesta.findMany({
      where: { id_consulta },
      include: respuestaInclude,
      orderBy: { pregunta: { orden_num: 'asc' } },
    });
  }

  private async assertConsultaExists(id_consulta: number) {
    const consulta = await this.prisma.consulta.findUnique({
      where: { id_consulta },
      select: { id_consulta: true },
    });
    if (!consulta) {
      throw new NotFoundException(
        `Consulta con id ${id_consulta} no encontrada`,
      );
    }
  }

  private validateRespuestas(respuestas: RespuestaItemDto[]) {
    const ids = respuestas.map((r) => r.id_pregunta);
    const unique = new Set(ids);
    if (unique.size !== ids.length) {
      throw new BadRequestException(
        'No se permiten id_pregunta duplicados en la misma petición',
      );
    }
  }
}
