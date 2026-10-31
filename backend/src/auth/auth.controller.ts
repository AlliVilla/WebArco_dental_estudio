import { Public } from './decorators/public.decorator';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from '../guards/privileges.guard';
import { Privileges } from './decorators/privileges.decorator';
import {
  Controller,
  Post,
  Put,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login';
import { ForgotPasswordDto } from './dto/forgotPassword';
import { ResetPasswordDto } from './dto/resetPassword';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Inicio de sesión de usuario',
    description:
      'Verifica si el usuario y contraseña pertenecen a algún usuario registrado',
  })
  @ApiOkResponse({
    description: 'Login exitoso',
    schema: {
      properties: {
        access_token: { type: 'string' },
        refresh_token: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            username: { type: 'string' },
            email: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Credenciales incorrectas' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const authResponse = await this.authService.login(loginDto);

    res.cookie('auth_token', authResponse.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 15 * 60000,
    });

    res.cookie('refresh_token', authResponse.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    const { refresh_token: _refreshToken, ...publicResponse } = authResponse;
    return { ...publicResponse, message: 'Inicio de sesión exitoso.' };
  }

  @UseGuards(JwtAuthGuard, PrivilegesGuard)
  @Privileges(9)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Log out del usuario',
    description: 'Se quita de las cookies el usuario que poseia el usuario',
  })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout((req.user as any).sid);
    res.clearCookie('auth_token');
    res.clearCookie('refresh_token');

    return { message: 'Cierre de Sesión con éxito.' };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Olvidar contraseña',
    description: 'Reenvio de link de recuperación mediante correo',
  })
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    await this.authService.forgotPassword(body);

    return {
      message: 'Si el correo existe, se ha enviado un enlace de recuperación.',
    };
  }

  @Public()
  @Put('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cambio de Contraseña',
    description:
      'Verifica el token recibido por correo y actualiza la contraseña',
  })
  async resetPassword(@Body() body: ResetPasswordDto) {
    await this.authService.resetPassword(body);

    return { message: 'Contraseña actualizada correctamente.' };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refrescar token de acceso',
    description:
      'Obtiene un nuevo access_token usando el refresh_token de la cookie',
  })
  @ApiUnauthorizedResponse({ description: 'Refresh token inválido o expirado' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token no proporcionado.');
    }

    const result = await this.authService.refreshToken(refreshToken);

    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 86400000,
    });
    res.cookie('auth_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 15 * 60000,
    });
    return {
      access_token: result.access_token,
      message: 'Token refrescado exitosamente.',
    };
  }
}
