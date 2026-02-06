import {
  Controller,
  Get,
  UseGuards,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../../../../utils/user.decorator';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { Privilege } from '../../../../common/enums';
import { decryptOrganizationId } from '../../../../utils/organization-crypto.util';

// Services
import { AccountCrudService } from '../services/account-crud.service';

// Mappers
import { mapResponseDtoToPublicDto } from '../mappers/account.mapper';

/**
 * Account API Controller
 *
 * FRONTEND COMPATIBILITY LAYER
 * Provides endpoints for frontend applications using /api/accounts/* paths.
 * Complements the /private/accounts/* architecture for backward compatibility.
 *
 * SUPPORTED ROUTES:
 * - GET /api/accounts/me → Get authenticated user's profile
 *
 * AUTHENTICATION:
 * - JWT required on all routes
 * - User context extracted from JWT payload
 *
 * RESPONSE FORMAT:
 * Returns complete user profile including account_group (for STAFF detection)
 * and privilege level for frontend routing decisions.
 *
 * @see AccountPrivateController for additional account management endpoints
 * @author OSOT Development Team
 * @version 1.0.0 - Frontend Compatibility Layer
 */
@Controller('api/accounts')
@ApiTags('Account API (Legacy)')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
export class AccountApiController {
  private readonly logger = new Logger(AccountApiController.name);

  constructor(private readonly accountCrudService: AccountCrudService) {
    this.logger.log('Account API Controller (Legacy) initialized');
  }

  /**
   * Extract privilege from user object (from JWT payload)
   * Ensures secure privilege extraction with fallback to lowest privilege
   */
  private getUserPrivilege(user: Record<string, unknown>): Privilege {
    const privilege =
      (user?.privilege as number) || (user?.osot_privilege as number);

    return typeof privilege === 'number'
      ? (privilege as Privilege)
      : Privilege.OWNER;
  }

  /**
   * Extract user role string from privilege for service calls
   */
  private getUserRole(privilege: Privilege): string {
    switch (privilege) {
      case Privilege.MAIN:
        return 'main';
      case Privilege.ADMIN:
        return 'admin';
      case Privilege.OWNER:
      default:
        return 'owner';
    }
  }

  /**
   * GET /api/accounts/me
   *
   * Returns complete profile of authenticated user including account_group and privilege.
   * This endpoint is specifically designed for frontend privilege detection (e.g., detecting STAFF users).
   *
   * @param userId - User ID from JWT payload (business ID format: osot-0000001)
   * @param user - Full user object from JWT payload
   * @returns User profile with all fields including account_group and privilege
   */
  @Get('me')
  @ApiOperation({
    summary: 'Get authenticated user profile',
    description:
      'Returns complete profile of authenticated user including account_group (for STAFF detection) and privilege level.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully.',
    schema: {
      type: 'object',
      example: {
        osot_account_id: 'osot-0000001',
        osot_email: 'user@example.com',
        osot_first_name: 'John',
        osot_last_name: 'Doe',
        osot_account_group: 4,
        osot_privilege: 3,
        osot_status: 'Active',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User account not found.',
  })
  @ApiResponse({
    status: 403,
    description: 'Affiliate users must use /api/affiliates/me endpoint.',
  })
  async getMe(
    @User('userId') userId: string,
    @User('organizationId') encryptedOrgId: string,
    @User() user: Record<string, unknown>,
  ) {
    const operationId = `api_get_me_${Date.now()}`;
    const privilege = this.getUserPrivilege(user);
    const userRole = this.getUserRole(privilege);

    // Decrypt organization ID from JWT
    let organizationGuid: string | undefined;
    try {
      if (encryptedOrgId) {
        organizationGuid = decryptOrganizationId(encryptedOrgId);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to decrypt organization ID - Operation: ${operationId}`,
        {
          operation: 'getMe',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      );
    }

    this.logger.log(`GET /api/accounts/me called - Operation: ${operationId}`, {
      operation: 'getMe',
      operationId,
      userId: userId?.substring(0, 8) + '...',
      privilege,
      userRole,
      hasOrganization: !!organizationGuid,
      timestamp: new Date().toISOString(),
    });

    // Check if user is trying to access account endpoint with affiliate credentials
    if (userId?.startsWith('affi-')) {
      this.logger.warn('Affiliate user attempted to access account endpoint', {
        operation: 'getMe',
        operationId,
        userId: userId?.substring(0, 8) + '...',
        timestamp: new Date().toISOString(),
      });
      throw new ForbiddenException(
        'This endpoint is for account users only. Please use /api/affiliates/me endpoint.',
      );
    }

    try {
      // Fetch account using userId (could be business ID or GUID)
      const account = await this.accountCrudService.findById(
        userId,
        organizationGuid,
        userRole,
      );

      if (!account) {
        this.logger.warn(`User account not found - Operation: ${operationId}`, {
          operation: 'getMe',
          operationId,
          userId: userId?.substring(0, 8) + '...',
          timestamp: new Date().toISOString(),
        });

        throw createAppError(ErrorCodes.ACCOUNT_NOT_FOUND, {
          message: 'Account record not found',
          operationId,
          operation: 'getMe',
          resourceId: userId,
        });
      }

      // Map to public DTO (filters internal fields but keeps account_group and privilege)
      const publicAccount = mapResponseDtoToPublicDto(account);

      // Add privilege from JWT to response (ensure frontend has it)
      const response = {
        ...publicAccount,
        privilege, // Ensure privilege is in response for frontend routing
      };

      this.logger.log(
        `User profile retrieved successfully - Operation: ${operationId}`,
        {
          operation: 'getMe',
          operationId,
          accountGroup: account.osot_account_group,
          privilege,
          timestamp: new Date().toISOString(),
        },
      );

      return response;
    } catch (error) {
      this.logger.error(
        `GET /api/accounts/me failed - Operation: ${operationId}`,
        {
          operation: 'getMe',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      );

      // Re-throw if it's already an AppError
      if (error instanceof Error && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to retrieve user profile',
        operationId,
        operation: 'getMe',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
