import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrivilegesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPrivileges = this.reflector.get<number[]>(
      'privileges',
      context.getHandler(),
    );

    if (!requiredPrivileges) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const userId = user.id_usuario;

    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario: userId },
      select: { id_rol: true },
    });

    if (!usuario) return false;

    const privilegios = await this.prisma.rolPrivilegio.findMany({
      where: {
        id_rol: usuario.id_rol,
      },
      select: { id_privilegio: true },
    });

    const userPrivileges = privilegios.map(p => p.id_privilegio);

    request.user.privilegios = userPrivileges;

    return requiredPrivileges.some(p =>
      userPrivileges.includes(p),
    );
  }
}