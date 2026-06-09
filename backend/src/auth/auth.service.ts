import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { BrevoService } from '../utils/email/brevo.service';
import { hashPassword } from '../utils/bcrypt/hashPassword';

import { comparePassword } from '../utils/bcrypt/comparePassword';
import { generateToken, generateRefreshToken } from '../utils/jwt/generateToken';
import { decodeToken, verifyResetToken, verifyRefreshToken } from '../utils/jwt/verifyToken';

import { ForgotPasswordDto } from './dto/forgotPassword';
import { LoginDto } from './dto/login';
import { ResetPasswordDto } from './dto/resetPassword';

import { buildResetPasswordEmail } from '../utils/email/html/forgotPassword';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private brevo: BrevoService) {}

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    const userExists = await this.prisma.usuario.findUnique({
      where: { username },
      include: { persona: true },
    });

    if (!userExists) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    const isPasswordValid = await comparePassword(
      password,
      userExists.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    const tokenPayload = {
      sub: userExists.id_usuario,
      username: userExists.username,
      email: userExists.persona?.correo_electronico ?? undefined,
      id_rol: userExists.id_rol,
    };

    const access_token = generateToken(tokenPayload, '24h');
    const refresh_token = generateRefreshToken(tokenPayload, '7d');

    return {
      access_token,
      refresh_token,
      user: userExists,
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto){
    const {email} = forgotPasswordDto;

    const userExists = await this.prisma.usuario.findFirst({
      include: {persona:true},
      where: {
        persona: {
          is: {
            correo_electronico: email,
          },
        },
      },
    });

    if (!userExists) return;

    const resetPayload = {
      sub: userExists.id_usuario,
      username: userExists.username,
      email: userExists.persona?.correo_electronico ?? undefined,
      id_rol: userExists.id_rol,
    };
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET no está configurado');
    }
    const secretKey = process.env.JWT_SECRET + userExists.password;
    
    const resetToken = generateToken(resetPayload, '15m', secretKey);

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    try {
      await this.brevo.sendMail({
        to: email,
        subject: 'Recuperación de contraseña - Dental Center',
        html: buildResetPasswordEmail(resetLink),
      });
    } catch {
      console.error('Error al enviar correo de recuperación');
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto){
    const { token, newPassword } = resetPasswordDto;

    const payload = decodeToken(token);

    if (!payload?.sub) {
      throw new BadRequestException('Token de recuperación inválido o expirado.');
    }

    const user = await this.prisma.usuario.findUnique({
      where: { id_usuario: payload.sub },
    });

    if (!user) {
      throw new BadRequestException('Token de recuperación inválido o expirado.');
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET no está configurado');
    }
    const secretKey = process.env.JWT_SECRET + user.password;
    try {
      verifyResetToken(token, secretKey);
    } catch {
      throw new BadRequestException('Token de recuperación inválido o expirado.');
    }

    const isSamePassword = await comparePassword(newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException('La nueva contraseña no puede ser igual a la anterior.');
    }

    const hashedPassword = await hashPassword(newPassword); 

    await this.prisma.usuario.update({
      where: { id_usuario: payload.sub },
      data: {
        password: hashedPassword,
      },
    });
  }

  async refreshToken(refreshToken: string) {
    let payload: any;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado.');
    }

    const user = await this.prisma.usuario.findUnique({
      where: { id_usuario: payload.sub },
      include: { persona: true },
    });

    if (!user || !user.activo) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo.');
    }

    const tokenPayload = {
      sub: user.id_usuario,
      username: user.username,
      email: user.persona?.correo_electronico ?? undefined,
      id_rol: user.id_rol,
    };

    const access_token = generateToken(tokenPayload, '24h');

    return { access_token };
  }
}

