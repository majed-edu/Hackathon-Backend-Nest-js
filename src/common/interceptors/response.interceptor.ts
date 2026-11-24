import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator.js';

interface WrappedResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const handler = context.getHandler();
    const controller = context.getClass();
    const httpStatus = this.reflector.getAllAndOverride<number>(
      HTTP_CODE_METADATA,
      [handler, controller],
    );

    return next.handle().pipe(
      map((data): WrappedResponse<unknown> => {
        const response = context.switchToHttp().getResponse<{
          statusCode: number;
        }>();
        const statusCode =
          httpStatus ?? response.statusCode ?? HttpStatus.OK;
        const message =
          this.reflector.getAllAndOverride<string>(RESPONSE_MESSAGE_KEY, [
            handler,
            controller,
          ]) ?? 'success';

        return {
          statusCode,
          message,
          data,
        };
      }),
    );
  }
}
