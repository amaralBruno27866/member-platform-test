import { Request } from 'express';

/**
 * Extracts the Bearer token from the Authorization header of a request.
 * @param req Express request
 * @returns The JWT token string or null if not present
 */
export function extractBearerToken(req: Request): string | null {
  if (
    req.headers?.authorization &&
    typeof req.headers.authorization === 'string' &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    return req.headers.authorization.slice(7);
  }
  return null;
}
