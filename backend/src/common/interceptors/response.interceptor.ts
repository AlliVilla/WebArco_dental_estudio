import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

function isObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      map((response) => {
        if (isObject(response)) {
          if ('success' in response) return response;
          if ('data' in response) {
            return { success: true, ...response };
          }
        }
        return { success: true, data: response ?? null };
      }),
    );
  }
}
