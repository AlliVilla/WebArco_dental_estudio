import { Injectable, NotFoundException, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { verifyToken } from '../utils/jwt/verifyToken';

@Injectable()
export class UsuarioService {
  constructor(private prisma: PrismaService) {}

  async validateByLogin(token: string) {
    try {
      const payload = verifyToken(token);
      
      const usuario = await this.prisma.usuario.findUnique({
        where: { id_usuario: payload.sub },
        include: {
          persona: true,
          rol: true,
        },
      });

      if (!usuario || !usuario.activo) {
        throw new UnauthorizedException('Usuario no encontrado o inactivo');
      }

      return {
        id_usuario: usuario.id_usuario,
        username: usuario.username,
        id_rol: usuario.id_rol,
        id_persona: usuario.id_persona,
        persona: usuario.persona,
        rol: usuario.rol,
        activo: usuario.activo,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  async getUserById(id_usuario: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario },
      include: {
        persona: true,
        rol: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id_usuario} no encontrado`);
    }

    return usuario;
  }

  async getUserByUsername(username: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { username },
      include: {
        persona: true,
        rol: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario ${username} no encontrado`);
    }

    return usuario;
  }

  async getAllUsers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [usuarios, total] = await Promise.all([
      this.prisma.usuario.findMany({
        skip,
        take: limit,
        include: {
          persona: true,
          rol: true,
        },
      }),
      this.prisma.usuario.count(),
    ]);

    return {
      data: usuarios,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }
}

