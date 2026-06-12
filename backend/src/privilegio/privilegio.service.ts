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

  async getAllDoctores() {
    const doctores = await this.prismaService.usuario.findMany({
      where: {
        activo: true,
        rol: {
          privilegios: {
            some: {
              id_privilegio: 62,
            },
          },
        },
      },
      select: {
        id_usuario: true,
        username: true,
        firma: true,
        activo: true,
        persona: {
          select: {
            id_persona: true,
            primer_nombre: true,
            segundo_nombre: true,
            primer_apellido: true,
            segundo_apellido: true,
            telefono: true,
            correo_electronico: true,
            sexo: true,
          },
        },
        rol: {
          select: {
            id_rol: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        persona: {
          primer_apellido: 'asc',
        },
      },
    });

    return {
      data: doctores.map((d) => ({
        id_usuario: d.id_usuario,
        username: d.username,
        firma: d.firma,
        rol: d.rol,
        fullName: [
          d.persona.primer_nombre,
          d.persona.segundo_nombre,
          d.persona.primer_apellido,
          d.persona.segundo_apellido,
        ]
          .filter(Boolean)
          .join(' '),
        ...d.persona,
      })),
      total: doctores.length,
    };
  }
}