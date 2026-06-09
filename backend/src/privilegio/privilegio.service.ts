import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InsertRolePrivilegeDto } from './dto/insert-role-privilege.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrivilegioService {
  constructor(private prismaService: PrismaService) {}

  async findAll() {
    return this.prismaService.privilegio.findMany({
      orderBy: {
        id_privilegio: 'asc',
      },
    });
  }

  async insertRolePrivilege(body: InsertRolePrivilegeDto) {
    const { id_rol, id_privilegios } = body;

    try {
      const privilegios = await this.prismaService.privilegio.findMany({
        where: {
          id_privilegio: {
            in: id_privilegios,
          },
        },
      });

      if (privilegios.length !== id_privilegios.length) {
        throw new ConflictException('Uno o más privilegios no existen');
      }

      const data = id_privilegios.map((id_privilegio) => ({
        id_rol,
        id_privilegio,
      }));

      const result = await this.prismaService.rolPrivilegio.createMany({
        data,
        skipDuplicates: true,
      });

      return {
        message: 'Privilegios asignados correctamente',
        count: result.count,
      };
    } catch (error) {
      throw error;
    }
  }
}