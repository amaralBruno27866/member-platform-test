import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { createAppError } from '../common/errors/error.factory';
import { ErrorCodes } from '../common/errors/error-codes';

/**
 * Custom decorator to extract user business ID from the authenticated user
 * Similar to the User decorator but specifically for business_id extraction
 * Usage: @UserBusinessId() businessId: string
 */
export const UserBusinessId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as Record<string, unknown> | undefined;

    if (!user || !user.osot_user_business_id) {
      // Throw centralized AppError so global filter formats consistently
      throw createAppError(
        ErrorCodes.PERMISSION_DENIED,
        { reason: 'missing_user_business_id' },
        401,
        'Missing business id in user context',
      );
    }

    return user.osot_user_business_id as string;
  },
);

/**
 * Custom decorator to extract user role from the authenticated user
 * Usage: @UserRole() role: string
 */
export const UserRole = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as Record<string, unknown> | undefined;

    if (!user || !user.role) {
      throw createAppError(
        ErrorCodes.PERMISSION_DENIED,
        { reason: 'missing_user_role' },
        401,
        'Missing role in user context',
      );
    }

    return user.role as string;
  },
);

/**
 * Custom decorator to extract user privilege from the authenticated user
 * Usage: @UserPrivilege() privilege: number
 */
export const UserPrivilege = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as Record<string, unknown> | undefined;

    if (!user || user.osot_privilege === undefined) {
      throw createAppError(
        ErrorCodes.PERMISSION_DENIED,
        { reason: 'missing_user_privilege' },
        401,
        'Missing privilege in user context',
      );
    }

    return user.osot_privilege as number;
  },
);
