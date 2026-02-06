import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Função utilitária para extrair o usuário do contexto.
 */
export function extractUserFromContext(
  data: string | undefined,
  ctx: ExecutionContext,
) {
  const request = ctx.switchToHttp().getRequest<Request>();
  const user = request.user as Record<string, unknown> | undefined;
  if (!user) return undefined;
  if (data) {
    return user[data];
  }
  return user;
}

/**
 * Custom decorator to extract the authenticated user from the request (req.user).
 * Usage: @User() user
 *        @User('role') role
 *        @User('osot_account_id') osot_account_id
 */
export const User = createParamDecorator(extractUserFromContext);
