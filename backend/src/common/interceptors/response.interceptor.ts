import { safeOutput } from '../security/safe-output';
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from '../dto/api-response.dto';

const DEFAULT_MESSAGES: Record<number, string> = {
  200: 'Operación exitosa',
  201: 'Recurso creado exitosamente',
  204: 'Recurso eliminado exitosamente',
};

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponseDto<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponseDto<T>> {
    const statusCode = context.switchToHttp().getResponse().statusCode;

    return next
      .handle()
      .pipe(
        map(
          (data) =>
            this.wrapResponse(
              safeOutput(data),
              statusCode,
            ) as ApiResponseDto<T>,
        ),
      );
  }

  private wrapResponse(
    data: unknown,
    statusCode: number,
  ): ApiResponseDto<unknown> {
    if (data === null || data === undefined) {
      return {
        success: true,
        data: null,
        message: DEFAULT_MESSAGES[statusCode] ?? 'Operación exitosa',
      };
    }

    if (Array.isArray(data)) {
      return {
        success: true,
        data,
        message: DEFAULT_MESSAGES[statusCode] ?? 'Operación exitosa',
      };
    }

    if (typeof data !== 'object') {
      return {
        success: true,
        data,
        message: DEFAULT_MESSAGES[statusCode] ?? 'Operación exitosa',
      };
    }

    const extracted = data as Record<string, unknown>;

    const message =
      (extracted['message'] as string | undefined) ??
      (extracted['mensaje'] as string | undefined) ??
      DEFAULT_MESSAGES[statusCode] ??
      'Operación exitosa';

    const { message: _m, mensaje: _mj, ...rest } = extracted;

    const hasSignificantKeys = Object.keys(rest).length > 0;

    return {
      success: true,
      data: hasSignificantKeys ? rest : null,
      message,
    } as ApiResponseDto<unknown>;
  }
}
