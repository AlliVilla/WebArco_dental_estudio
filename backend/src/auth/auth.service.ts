import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login';
import { comparePassword } from '../utils/bcrypt/comparePassword';
import { generateToken, generateRefreshToken } from '../utils/jwt/generateToken';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async login(loginDto: LoginDto) {
    const { user, password } = loginDto;

    const userExists = await this.prisma.usuario.findUnique({
      where: { username: user },
      include: { persona: true },
    });

    if (!userExists) {
      throw new NotFoundException(`No existe el usuario: ${user}`);
    }

    const isPasswordValid = await comparePassword(
      password,
      userExists.password,
    );

    if (!isPasswordValid) {
      throw new ConflictException(
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
}

