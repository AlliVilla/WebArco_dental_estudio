import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EspecialidadService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const items = await this.prisma.especialidad.findMany({
      orderBy: { nombre: 'asc' },
    });
    return items.map((e) => ({
      id: e.id_especialidad,
      nombre: e.nombre,
    }));
  }
}
