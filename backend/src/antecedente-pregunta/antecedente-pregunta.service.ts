import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RespuestaItemDto } from './dto/save-respuestas.dto';

const preguntaSelect = {
  id_pregunta: true,
  pregunta: true,
  orden_num: true,
  requiere_explicacion: true,
} satisfies Prisma.AntecedentePreguntaSelect;

const respuestaInclude = {
  pregunta: { select: preguntaSelect },
} satisfies Prisma.AntecedenteRespuestaInclude;

@Injectable()
export class AntecedentePreguntaService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.antecedentePregunta.findMany({
      select: preguntaSelect,
      orderBy: { orden_num: 'asc' },
    });
  }

  async findRespuestasByConsulta(id_consulta: number) {
    await this.assertConsultaExists(id_consulta);

    return this.prisma.antecedenteRespuesta.findMany({
      where: { id_consulta },
      include: respuestaInclude,
      orderBy: { pregunta: { orden_num: 'asc' } },
    });
  }

  async saveRespuestas(id_consulta: number, respuestas: RespuestaItemDto[]) {
    await this.assertConsultaExists(id_consulta);
    this.validateRespuestas(respuestas);

    const preguntaIds = respuestas.map((r) => r.id_pregunta);
    const preguntas = await this.prisma.antecedentePregunta.findMany({
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
        r.respuestaBoolean &&
        !r.explanation?.trim()
      ) {
        throw new BadRequestException(
          `La pregunta ${r.id_pregunta} requiere una explicación para respuesta afirmativa`,
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.antecedenteRespuesta.deleteMany({ where: { id_consulta } });
      if (respuestas.length > 0) {
        await tx.antecedenteRespuesta.createMany({
          data: respuestas.map((r) => ({
            id_consulta,
            id_pregunta: r.id_pregunta,
            respuesta_boolean: r.respuestaBoolean,
            explanation: r.explanation?.trim() ?? null,
          })),
        });
      }
    });

    return this.prisma.antecedenteRespuesta.findMany({
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
