import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartamentoService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const items = await this.prisma.departamento.findMany({
      orderBy: { nombre: 'asc' },
    });
    return { message: 'Departamentos obtenidos exitosamente', items };
  }
}
