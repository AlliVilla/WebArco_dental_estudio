import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateRoleDto } from './dto/createRole.dto';
import { ConflictException} from '@nestjs/common';
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
        let where = {};
        if(search) {
            const searchLower = search.toLowerCase();
            where = {
                nombre: {
                    contains: searchLower,
                    mode: 'insensitive',
                }
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
}
