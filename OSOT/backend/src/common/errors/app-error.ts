import { ErrorCodes } from './error-codes';

export class AppError extends Error {
  code: ErrorCodes;
  context?: Record<string, unknown>;
  httpStatus: number;

  constructor(
    code: ErrorCodes,
    message?: string,
    context?: Record<string, unknown>,
    httpStatus = 400,
  ) {
    super(message || 'Application error');
    this.code = code;
    this.context = context;
    this.httpStatus = httpStatus;
    // maintain proper prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
