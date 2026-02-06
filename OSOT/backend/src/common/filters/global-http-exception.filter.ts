import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error: string | undefined = undefined;
    const extraFields: Record<string, unknown> = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        // Type guard for known structure
        if (
          'message' in res &&
          typeof (res as { message: unknown }).message === 'string'
        ) {
          message = (res as { message: string }).message;
        } else if (
          'message' in res &&
          Array.isArray((res as { message: unknown }).message)
        ) {
          const messageArray = (res as { message: unknown[] }).message;
          message = messageArray
            .map((item) => {
              if (typeof item === 'string') {
                return item;
              }
              if (typeof item === 'number' || typeof item === 'boolean') {
                return String(item);
              }
              if (item === null) {
                return 'null';
              }
              if (item === undefined) {
                return 'undefined';
              }
              if (typeof item === 'object') {
                // Try to get a meaningful string representation
                if ('message' in item && typeof item.message === 'string') {
                  return item.message;
                }
                try {
                  return JSON.stringify(item);
                } catch {
                  return '[object Object]';
                }
              }
              // For any other types, return a safe fallback
              return '[Unknown Error]';
            })
            .join(', ');
        }
        if (
          'error' in res &&
          typeof (res as { error: unknown }).error === 'string'
        ) {
          error = (res as { error: string }).error;
        }

        // Extract all extra fields (excluding message and error which we handle separately)
        const knownFields = ['message', 'error', 'statusCode'];
        Object.keys(res).forEach((key) => {
          if (!knownFields.includes(key)) {
            extraFields[key] = (res as Record<string, unknown>)[key];
          }
        });
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      error,
      ...extraFields, // Include extra fields like maskedEmail, suggestion, etc.
    });
  }
}
