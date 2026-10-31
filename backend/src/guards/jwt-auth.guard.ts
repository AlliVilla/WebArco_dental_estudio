import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowed = await super.canActivate(context);
    const req = context.switchToHttp().getRequest();
    const path = req.route?.path;
    if (
      req.user?.must_change_password &&
      ![
        '/usuario/profile',
        '/usuario/profile/change-password',
        '/auth/logout',
      ].includes(path)
    ) {
      throw new ForbiddenException(
        'Debe cambiar su contraseña antes de continuar',
      );
    }
    return Boolean(allowed);
  }
}
