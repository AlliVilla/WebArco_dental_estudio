import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateRoleDto } from './dto/createRole.dto';
import { ConflictException, NotFoundException} from '@nestjs/common';
import { UpdateRoleDto } from './dto/updateRole.dto';

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
            const searchLower = search.toLowerCase();
            where = {
                nombre: {
                    contains: searchLower,
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
                    privilegios: true,
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
}
