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
        @Res({passthrough: true}) res: Response
    ) {
    const authResponse = await this.authService.login(loginDto);

    res.cookie('auth_token', authResponse.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24,
    });

    res.cookie('refresh_token', authResponse.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return {
      success: true,
      data: {
        access_token: authResponse.access_token,
        refresh_token: authResponse.refresh_token,
        user: authResponse.user,
      },
      message: 'Inicio de sesión exitoso.',
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({summary: 'Log out del usuario', description: 'Se quita de las cookies el usuario que poseia el usuario'})
  async logout(@Res({ passthrough: true }) res: Response){
    res.clearCookie('auth_token');
    res.clearCookie('refresh_token');

    return {
      success: true,
      data : null,
      message: 'Cierre de Sesión con éxito.'
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({summary: 'Olvidar contraseña', description: 'Reenvio de link de recuperación mediante correo'})
  async forgotPassword(@Body() body: ForgotPasswordDto){
    await this.authService.forgotPassword(body);

    return {
      success: true,
      data: null,
      message: 'Si el correo existe, se ha enviado un enlace de recuperación.',
    };
  }

  @Put('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({summary: 'Cambio de Contraseña', description: 'Verifica el token recibido por correo y actualiza la contraseña'})
  async resetPassword(@Body() body: ResetPasswordDto) {
    await this.authService.resetPassword(body);
    
    return {
      success: true,
      message: 'Contraseña actualizada correctamente.',
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refrescar token de acceso', description: 'Obtiene un nuevo access_token usando el refresh_token de la cookie' })
  @ApiUnauthorizedResponse({ description: 'Refresh token inválido o expirado' })
  async refresh(@Req() req: Request) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token no proporcionado.');
    }

    const result = await this.authService.refreshToken(refreshToken);

    return {
      success: true,
      data: result,
      message: 'Token refrescado exitosamente.',
    };
  }
}