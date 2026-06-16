import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MunicipioService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const items = await this.prisma.municipio.findMany({
      orderBy: { nombre: 'asc' },
    });
    return { message: 'Municipios obtenidos exitosamente', items };
  }

  async findByDepartamento(idDepartamento: number) {
    const departamento = await this.prisma.departamento.findUnique({
      where: { id_departamento: idDepartamento },
    });
    if (!departamento) {
      throw new NotFoundException(`El departamento con ID ${idDepartamento} no existe`);
    }
    const items = await this.prisma.municipio.findMany({
      where: { id_departamento: idDepartamento },
      orderBy: { nombre: 'asc' },
    });
    return { message: 'Municipios obtenidos exitosamente', items };
  }
}
