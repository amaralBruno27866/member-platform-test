import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { AppError } from './app-error';
import { ErrorMessages } from './error-messages';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    if (exception instanceof AppError) {
      const em = ErrorMessages[exception.code];
      // Log details for maintainers
      this.logger.error({
        code: exception.code,
        context: exception.context,
        message: exception.message,
      });
      return res.status(exception.httpStatus || 400).json({
        code: exception.code,
        message: em?.publicMessage || exception.message,
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      this.logger.error({ status, body });

      // If body is an object, preserve all fields (not just message)
      if (typeof body === 'object' && body !== null) {
        // For structured error responses (like duplicate account errors with maskedEmail, suggestion, etc.)
        // Return the full body with code: 0 added
        return res.status(status).json({
          code: 0,
          ...body,
        });
      }

      // If body is a string, use simple format
      const message = typeof body === 'string' ? body : 'Erro HTTP';
      return res.status(status).json({
        code: 0,
        message,
      });
    }

    // Fallback: unknown error
    this.logger.error(exception as any);
    const fallback = ErrorMessages[0];
    return res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ code: 0, message: fallback?.publicMessage || 'Internal error' });
  }
}
