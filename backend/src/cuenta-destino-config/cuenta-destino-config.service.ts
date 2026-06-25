import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCuentaDestinoConfigDto } from './dto/create-cuenta-destino-config.dto';
import { UpdateCuentaDestinoConfigDto } from './dto/update-cuenta-destino-config.dto';

@Injectable()
export class CuentaDestinoConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateCuentaDestinoConfigDto) {
    try {
      const item = await this.prisma.cuentaDestinoConfig.create({
        data: {
          tipo: createDto.tipo,
          nombre: createDto.nombre,
          comision: createDto.comision,
        },
      });
      return { message: 'Cuenta destino creada exitosamente', data: item };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Ya existe una cuenta destino "${createDto.nombre}" para el tipo ${createDto.tipo}`);
      }
      throw error;
    }
  }

  async findAll() {
    const items = await this.prisma.cuentaDestinoConfig.findMany({
      orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }],
    });
    return { data: items };
  }

  async findOne(id: number) {
    const item = await this.prisma.cuentaDestinoConfig.findUnique({
      where: { id },
    });
    if (!item) {
      throw new NotFoundException(`La cuenta destino con ID ${id} no existe`);
    }
    return { data: item };
  }

  async update(id: number, updateDto: UpdateCuentaDestinoConfigDto) {
    const existing = await this.prisma.cuentaDestinoConfig.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`La cuenta destino con ID ${id} no existe`);
    }
    try {
      const updated = await this.prisma.cuentaDestinoConfig.update({
        where: { id },
        data: updateDto,
      });
      return { message: 'Cuenta destino actualizada exitosamente', data: updated };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Ya existe una cuenta destino con ese nombre para ese tipo`);
      }
      throw error;
    }
  }

  async remove(id: number) {
    const existing = await this.prisma.cuentaDestinoConfig.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`La cuenta destino con ID ${id} no existe`);
    }
    await this.prisma.cuentaDestinoConfig.delete({ where: { id } });
    return { message: 'Cuenta destino eliminada exitosamente' };
  }
}
