import { AppError } from './app-error';
import { ErrorCodes } from './error-codes';

export function createAppError(
  code: ErrorCodes,
  context?: Record<string, unknown>,
  httpStatus?: number,
  overrideMessage?: string,
): AppError {
  return new AppError(code, overrideMessage, context, httpStatus);
}
