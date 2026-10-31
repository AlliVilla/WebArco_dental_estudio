import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { jwtSecret } from '../../utils/jwt/secrets';
import { credentialVersion } from '../../common/security/credential-version';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenPayload } from '../../utils/jwt/generateToken';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => {
          if (req && req.cookies && req.cookies.auth_token) {
            return req.cookies.auth_token;
          }
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret('JWT_SECRET'),
      algorithms: ['HS256'],
    });
  }

  async validate(payload: TokenPayload) {
    if (!Number.isSafeInteger(payload.sub) || !payload.sid || !payload.cv)
      throw new UnauthorizedException();
    const session = await this.prisma.authSession.findUnique({
      where: { id: payload.sid },
      include: { usuario: true },
    });
    const user = session?.usuario;
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      !user?.activo ||
      user.id_usuario !== payload.sub ||
      payload.cv !== credentialVersion(user.password)
    ) {
      throw new UnauthorizedException('Sesión inválida o revocada');
    }
    return {
      id_usuario: payload.sub,
      username: payload.username,
      email: payload.email,
      id_rol: user.id_rol,
      must_change_password: user.must_change_password,
      sid: session.id,
    };
  }
}
