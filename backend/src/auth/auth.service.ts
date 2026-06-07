import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnauthorizedException
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { BrevoService } from '../utils/email/brevo.service';
import { hashPassword } from '../utils/bcrypt/hashPassword';

import { comparePassword } from '../utils/bcrypt/comparePassword';
import { generateToken, generateRefreshToken } from '../utils/jwt/generateToken';
import { decodeToken, verifyResetToken } from '../utils/jwt/verifyToken';

import { ForgotPasswordDto } from './dto/forgotPassword';
import { LoginDto } from './dto/login';
import { ResetPasswordDto } from './dto/resetPassword';

import { buildResetPasswordEmail } from '../utils/email/html/forgotPassword';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private brevo: BrevoService) {}

  async login(loginDto: LoginDto) {
    const { user, password } = loginDto;

    const userExists = await this.prisma.usuario.findUnique({
      where: { username: user },
      include: { persona: true },
    });

    if (!userExists) {
      throw new UnauthorizedException(`No existe el usuario: ${user}`);
    }

    const isPasswordValid = await comparePassword(
      password,
      userExists.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        `Credenciales incorrectas para usuario: ${user}`,
      );
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

    if (!userExists) {
      return {
        success: true,
        message: 'Si el correo existe, se ha enviado un enlace de recuperación',
      };
    }

    const resetPayload = {
      sub: userExists.id_usuario,
      username: userExists.username,
      email: userExists.persona?.correo_electronico ?? undefined,
      id_rol: userExists.id_rol,
    };
    const secretKey = (process.env.JWT_SECRET || 'your-secret-key') + userExists.password;
    
    const resetToken = generateToken(resetPayload, '15m', secretKey);

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    await this.brevo.sendMail({
      to: email,
      subject: 'Recuperación de contraseña - Dental Center',
      html: buildResetPasswordEmail(resetLink),
    })

    return {
      success: true,
      data: null,
      message: 'Si el correo existe, se ha enviado un enlace de recuperación.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto){
    const { token, newPassword } = resetPasswordDto;

    let payload: any;
    try {
      payload = decodeToken(token);
    } catch (error) {
      throw new BadRequestException('El token es inválido o ha expirado.');
    }

    const userId = payload?.sub;

    if (!userId) {
      throw new BadRequestException('Token malformado.');
    }

    const user = await this.prisma.usuario.findUnique({
      where: { id_usuario: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const secretKey = (process.env.JWT_SECRET || 'your-secret-key') + user.password;
    try {
      verifyResetToken(token, secretKey);
    } catch (error) {
      throw new BadRequestException('El token es inválido, ha expirado o ya fue usado.');
    }

    const isSamePassword = await comparePassword(newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException('La nueva contraseña no puede ser igual a la antigua.');
    }

    const hashedPassword = await hashPassword(newPassword); 

    await this.prisma.usuario.update({
      where: { id_usuario: userId },
      data: {
        password: hashedPassword,
      },
    });

    return {
      success: true,
      data: null,
      message: 'Contraseña actualizada correctamente.',
    };
  }
}

