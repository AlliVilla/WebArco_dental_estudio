import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

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
}
