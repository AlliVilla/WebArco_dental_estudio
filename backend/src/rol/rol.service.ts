import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateRoleDto } from './dto/create-rol.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UpdateRoleDto } from './dto/update-rol.dto';
import { AssignPrivilegesRolDto } from './dto/assign-privileges-rol.dto';

@Injectable()
export class RolService {
    constructor (private prismaService: PrismaService) {}
    
    async findAll(
        page: number,
        limit: number,
        search?: string
    ){
        const skip = (page - 1) * limit;
        let where : any = {
          activo : true
        };
        if(search) {
            where = {
                nombre: {
                    contains: search,
                    mode: 'insensitive',
                },
                activo: true
            }
        }

        const [roles, total] = await Promise.all([
            this.prismaService.rol.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    id_rol: 'desc',
                },
                include: {
                    privilegios: {
                        include: {
                            privilegio: true
                        }
                    },
                    _count: {
                        select: {
                            usuarios : true
                        }
                    } 
                }
            }), 
            this.prismaService.rol.count({ where })
        ]);

        return {
          data: roles,
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
          },
        };
    }

    async createRole(body: CreateRoleDto) {
      try {
        const role = await this.prismaService.rol.create({
          data: body,
        });

        return role;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new ConflictException('El nombre del rol ya existe');
        }

        throw error;
      }
    }

    async updateRole(id: number,body: UpdateRoleDto){
       try {
        const role = await this.prismaService.rol.update({
          data: body,
          where: {
            id_rol: id
          }
        });

        return role;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new ConflictException('El nombre del rol ya existe');
        }

        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          throw new NotFoundException('Rol no encontrado');
        }

        throw error;
      } 
    }

  async deleteRole(id: number) {
    // 1. Verificar si el rol existe
    const role = await this.prismaService.rol.findUnique({
      where: { id_rol: id },
    });

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    // 2. Buscar usuarios activos con ese rol
    const usuariosActivos = await this.prismaService.usuario.findMany({
      where: {
        id_rol: id,
        activo: true,
      },
      select: {
        id_usuario: true,
        username: true,
      },
    });

    // 3. Si hay usuarios activos → error 409
    if (usuariosActivos.length > 0) {
      throw new ConflictException({
        message: 'No se puede eliminar el rol porque tiene usuarios activos asignados',
        usuarios: usuariosActivos,
      });
    }

    // 4. Si no hay → desactivar rol
    const updatedRole = await this.prismaService.rol.update({
      where: { id_rol: id },
      data: { activo: false },
    });

    return updatedRole;
  }

  async replacePrivileges(id: number, dto: AssignPrivilegesRolDto) {
    const role = await this.prismaService.rol.findUnique({
      where: { id_rol: id },
    });

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    const privilegios = await this.prismaService.privilegio.findMany({
      where: {
        id_privilegio: { in: dto.id_privilegios },
      },
    });

    if (privilegios.length !== dto.id_privilegios.length) {
      throw new ConflictException('Uno o más privilegios no existen');
    }

    const [, count] = await this.prismaService.$transaction([
      this.prismaService.rolPrivilegio.deleteMany({
        where: { id_rol: id },
      }),
      this.prismaService.rolPrivilegio.createMany({
        data: dto.id_privilegios.map((id_privilegio) => ({
          id_rol: id,
          id_privilegio,
        })),
      }),
    ]);

    return {
      message: 'Privilegios reasignados correctamente',
      count: count.count,
    };
  }
}
