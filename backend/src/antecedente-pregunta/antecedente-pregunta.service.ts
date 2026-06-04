import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RespuestaItemDto } from './dto/save-respuestas.dto';
import { Prisma } from '@prisma/client';

interface AntecedenteRespuestaTx {
  deleteMany(args: {
    where: { id_consulta: number };
  }): Promise<{ count: number }>;
  createMany(args: {
    data: {
      id_consulta: number;
      id_pregunta: number;
      respuesta_boolean: boolean | null;
      explanation: string | null;
    }[];
  }): Promise<{ count: number }>;
}

type PreguntaData = {
  id_pregunta: number;
  pregunta: string;
  orden_num: number;
  requiere_explicacion: boolean;
};

type RespuestaData = {
  id_respuesta: number;
  id_consulta: number;
  id_pregunta: number;
  respuesta_boolean: boolean | null;
  explanation: string | null;
  pregunta: PreguntaData;
};

type ConsultaData = {
  id_consulta: number;
};

@Injectable()
export class AntecedentePreguntaService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<PreguntaData[]> {
    const items = (await this.prisma.antecedentePregunta.findMany({
      orderBy: { orden_num: 'asc' },
    })) as PreguntaData[];
    return items;
  }

  async findRespuestasByConsulta(
    id_consulta: number,
  ): Promise<RespuestaData[]> {
    const consulta = (await this.prisma.consulta.findUnique({
      where: { id_consulta },
    })) as ConsultaData | null;
    if (!consulta) {
      throw new NotFoundException(
        `Consulta con id ${id_consulta} no encontrada`,
      );
    }

    const respuestas = (await this.prisma.antecedenteRespuesta.findMany({
      where: { id_consulta },
      include: {
        pregunta: true,
      },
    })) as RespuestaData[];
    return respuestas;
  }

  async saveRespuestas(
    id_consulta: number,
    respuestas: RespuestaItemDto[],
  ): Promise<RespuestaData[]> {
    const consulta = (await this.prisma.consulta.findUnique({
      where: { id_consulta },
    })) as ConsultaData | null;
    if (!consulta) {
      throw new NotFoundException(
        `Consulta con id ${id_consulta} no encontrada`,
      );
    }

    const preguntaIds = respuestas.map((r) => r.id_pregunta);
    const existentes = (await this.prisma.antecedentePregunta.findMany({
      where: { id_pregunta: { in: preguntaIds } },
    })) as PreguntaData[];

    if (existentes.length !== preguntaIds.length) {
      const existentesIds = new Set(
        existentes.map((p: PreguntaData) => p.id_pregunta),
      );
      const inexistentes = preguntaIds.filter(
        (id: number) => !existentesIds.has(id),
      );
      throw new BadRequestException(
        `Las siguientes preguntas no existen: ${inexistentes.join(', ')}`,
      );
    }

    const preguntasMap = new Map<number, PreguntaData>(
      existentes.map((p: PreguntaData) => [p.id_pregunta, p]),
    );
    for (const r of respuestas) {
      const pregunta = preguntasMap.get(r.id_pregunta);
      if (
        pregunta?.requiere_explicacion &&
        r.respuestaBoolean === true &&
        !r.explanation
      ) {
        throw new BadRequestException(
          `La pregunta ${r.id_pregunta} requiere una explicación para respuesta afirmativa`,
        );
      }
    }

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const client = tx as { antecedenteRespuesta: AntecedenteRespuestaTx };
      await client.antecedenteRespuesta.deleteMany({
        where: { id_consulta },
      });

      await client.antecedenteRespuesta.createMany({
        data: respuestas.map((r) => ({
          id_consulta,
          id_pregunta: r.id_pregunta,
          respuesta_boolean: r.respuestaBoolean ?? null,
          explanation: r.explanation ?? null,
        })),
      });
    });

    const updated = (await this.prisma.antecedenteRespuesta.findMany({
      where: { id_consulta },
      include: { pregunta: true },
    })) as RespuestaData[];
    return updated;
  }
}
