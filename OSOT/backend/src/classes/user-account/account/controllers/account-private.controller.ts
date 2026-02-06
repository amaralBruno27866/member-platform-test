import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../../../../utils/user.decorator';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { Privilege } from '../../../../common/enums';
import { decryptOrganizationId } from '../../../../utils/organization-crypto.util';

// Services
import { AccountBusinessRulesService } from '../services/account-business-rules.service';
import { AccountCrudService } from '../services/account-crud.service';
import { AccountLookupService } from '../services/account-lookup.service';

// DTOs
import { CreateAccountDto } from '../dtos/create-account.dto';
import { UpdateAccountDto } from '../dtos/update-account.dto';
import { ListAccountsQueryDto } from '../dtos/list-accounts.query.dto';

// Mappers
import { mapResponseDtoToPublicDto } from '../mappers/account.mapper';

/**
 * Account Private Controller
 *
 * HANDLES AUTHENTICATED ROUTES for account management with role-based access control.
 * All routes require JWT authentication and proper user context with privilege validation.
 *
 * USER SELF-MANAGEMENT OPERATIONS:
 * - GET /private/accounts/me → Get my account record
 * - PATCH /private/accounts/me → Update my account record
 *
 * ADMIN OPERATIONS (Privilege-based):
 * - GET /private/accounts → List account records (admin/main only)
 * - GET /private/accounts/{id} → Get specific account record (admin/main only)
 * - PATCH /private/accounts/business/{businessId} → Update account by business ID (admin/main only)
 *
 * SECURITY ARCHITECTURE:
 * - JWT authentication required on all routes (@UseGuards(AuthGuard('jwt')))
 * - Role-based access control using privilege system (OWNER/ADMIN/MAIN)
 * - User context extraction from JWT payload
 * - Permission validation on all operations
 * - Comprehensive logging with security-aware PII redaction
 * - Business rule validation through AccountBusinessRulesService
 *
 * PRIVILEGE LEVELS:
 * - OWNER: Can only access own account data (me routes)
 * - ADMIN: Can access multiple accounts with limited administrative functions
 * - MAIN: Full system access to all account operations
 *
 * BUSINESS RULE INTEGRATION:
 * - Email uniqueness validation on updates
 * - Person uniqueness validation on updates
 * - Password complexity enforcement
 * - Account status transition validation
 * - Field filtering based on user privilege level
 *
 * @follows REST API Standards, OpenAPI Specification
 * @integrates AccountBusinessRulesService for validation
 * @integrates AccountCrudService for data operations
 * @integrates AccountLookupService for search operations
 * @author OSOT Development Team
 * @version 1.0.0 - Account Entity Implementation
 */
@Controller('private/accounts')
@ApiTags('Private Account Operations')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
export class AccountPrivateController {
  private readonly logger = new Logger(AccountPrivateController.name);

  constructor(
    private readonly accountBusinessRulesService: AccountBusinessRulesService,
    private readonly accountCrudService: AccountCrudService,
    private readonly accountLookupService: AccountLookupService,
  ) {
    this.logger.log('Account Private Controller initialized successfully');
  }

  /**
   * Extract privilege from user object (from JWT payload)
   * Ensures secure privilege extraction with fallback to lowest privilege
   */
  private getUserPrivilege(user: Record<string, unknown>): Privilege {
    // Extract privilege from JWT payload
    const privilege =
      (user?.privilege as number) || (user?.osot_privilege as number);

    return typeof privilege === 'number'
      ? (privilege as Privilege)
      : Privilege.OWNER; // Default to OWNER (lowest privilege) for security
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

  // ========================================
  // USER SELF-MANAGEMENT ROUTES
  // ========================================

  /**
   * Get available account groups based on user privilege
   * STAFF group (4) only visible to ADMIN (2) and MAIN (3)
   *
   * @param user - User object from JWT (contains privilege)
   * @returns Array of available account groups
   */
  @Get('available-groups')
  @ApiOperation({
    summary: 'Get available account groups',
    description:
      'Returns account groups available for creation based on user privilege. STAFF group only visible to ADMIN and MAIN.',
  })
  @ApiResponse({
    status: 200,
    description: 'Available account groups retrieved successfully.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          value: { type: 'number', example: 1 },
          label: { type: 'string', example: 'Occupational Therapist' },
        },
      },
    },
  })
  getAvailableAccountGroups(
    @User() user: Record<string, unknown>,
  ): Array<{ value: number; label: string }> {
    const privilege = this.getUserPrivilege(user);

    this.logger.debug(
      `Fetching available account groups for privilege: ${privilege}`,
      {
        operation: 'getAvailableAccountGroups',
        privilege,
        timestamp: new Date().toISOString(),
      },
    );

    // Base groups available to all users
    const baseGroups = [
      {
        value: 0,
        label: 'Other',
      },
      {
        value: 1,
        label: 'Occupational Therapist',
      },
      {
        value: 2,
        label: 'Occupational Therapist Assistant',
      },
      {
        value: 3,
        label: 'Vendor / Advertiser',
      },
    ];

    // STAFF group (4) only visible to ADMIN (2) and MAIN (3)
    if (privilege >= Privilege.ADMIN) {
      baseGroups.push({
        value: 4,
        label: 'Staff',
      });

      this.logger.debug('STAFF group added to available groups', {
        operation: 'getAvailableAccountGroups',
        privilege,
        totalGroups: baseGroups.length,
      });
    }

    return baseGroups;
  }

  /**
   * Get my account record
   *
   * @param userId - User ID from JWT payload
   * @param user - Full user object from JWT payload
   * @returns Promise<AccountResponseDto | null>
   */
  @Get('me')
  @ApiOperation({
    summary: 'Get my account record',
    description: 'Returns the account record for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Account record found.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { type: 'object' },
        message: { type: 'string' },
        timestamp: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Account record not found.',
  })
  async getMyAccount(
    @User('userId') userId: string,
    @User('organizationId') encryptedOrgId: string,
    @User() user: Record<string, unknown>,
  ) {
    const operationId = `get_my_account_${Date.now()}`;
    const privilege = this.getUserPrivilege(user);
    const userRole = this.getUserRole(privilege);

    // Log incoming request
    this.logger.log(`GET /private/accounts/me - Operation: ${operationId}`, {
      operation: 'getMyAccount',
      operationId,
      userId: userId?.substring(0, 8) + '...',
      privilege,
      userRole,
      timestamp: new Date().toISOString(),
    });

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
          operation: 'getMyAccount',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      );
    }

    // Check if user is trying to access account endpoint with affiliate credentials
    if (userId?.startsWith('affi-')) {
      this.logger.warn('Affiliate user attempted to access account endpoint', {
        operation: 'getMyAccount',
        operationId,
        userId: userId?.substring(0, 8) + '...',
        timestamp: new Date().toISOString(),
      });
      throw new ForbiddenException(
        'This endpoint is for account users only. Please use the affiliate endpoints (/private/affiliates/me).',
      );
    }

    // Getting account record

    try {
      const account = await this.accountCrudService.findById(
        userId,
        organizationGuid,
        userRole,
      );

      if (!account) {
        this.logger.warn('User account not found - getMyAccount', {
          operation: 'getMyAccount',
          operationId,
          userId: userId?.substring(0, 8) + '...',
          timestamp: new Date().toISOString(),
        });

        throw createAppError(ErrorCodes.ACCOUNT_NOT_FOUND, {
          message: 'Account record not found',
          operationId,
          operation: 'getMyAccount',
          resourceId: userId,
        });
      }

      // Account retrieved

      // Map to public DTO (filters internal fields)
      const publicAccount = mapResponseDtoToPublicDto(account);

      this.logger.log(
        `Account retrieved successfully - Operation: ${operationId}`,
        {
          operation: 'getMyAccount',
          operationId,
          userId: userId?.substring(0, 8) + '...',
          accountId: account?.osot_account_id,
          accountEmail: account?.osot_email?.substring(0, 5) + '***',
          timestamp: new Date().toISOString(),
        },
      );

      return {
        success: true,
        data: publicAccount,
        message: 'Account record retrieved successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Get my account failed - Operation: ${operationId}`, {
        operation: 'getMyAccount',
        operationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });

      // Re-throw if it's already an AppError
      if (error instanceof Error && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to retrieve account record',
        operationId,
        operation: 'getMyAccount',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update my account record
   *
   * @param userId - User ID from JWT payload
   * @param user - Full user object from JWT payload
   * @param updateAccountDto - Account update data
   * @returns Promise<AccountResponseDto | null>
   */
  @Patch('me')
  @ApiOperation({
    summary: 'Update my account record',
    description:
      'Updates the account record for the authenticated user with business rule validation.',
  })
  @ApiBody({ type: UpdateAccountDto })
  @ApiResponse({
    status: 200,
    description: 'Account record updated successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid account data or business rule violation.',
  })
  @ApiResponse({
    status: 404,
    description: 'Account record not found.',
  })
  async updateMyAccount(
    @User('userId') userId: string,
    @User() user: Record<string, unknown>,
    @Body() updateAccountDto: UpdateAccountDto,
  ) {
    const operationId = `update_my_account_${Date.now()}`;
    const privilege = this.getUserPrivilege(user);
    const userRole = this.getUserRole(privilege);

    this.logger.log(
      `Updating account record for user - Operation: ${operationId}`,
      {
        operation: 'updateMyAccount',
        operationId,
        userId: userId?.substring(0, 8) + '...',
        privilege,
        fieldsToUpdate: Object.keys(updateAccountDto).length,
        timestamp: new Date().toISOString(),
      },
    );

    try {
      const updatedAccount =
        await this.accountBusinessRulesService.updateAccountWithValidation(
          userId,
          updateAccountDto,
          userRole,
        );

      if (!updatedAccount) {
        this.logger.warn(
          `Account update failed - not found - Operation: ${operationId}`,
          {
            operation: 'updateMyAccount',
            operationId,
            userId: userId?.substring(0, 8) + '...',
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.ACCOUNT_NOT_FOUND, {
          message: 'Account record not found',
          operationId,
          operation: 'updateMyAccount',
          resourceId: userId,
        });
      }

      this.logger.log(
        `Account updated successfully - Operation: ${operationId}`,
        {
          operation: 'updateMyAccount',
          operationId,
          accountId: updatedAccount.osot_table_accountid,
          timestamp: new Date().toISOString(),
        },
      );

      // Map to public DTO (filters internal fields)
      const publicAccount = mapResponseDtoToPublicDto(updatedAccount);

      return {
        success: true,
        data: publicAccount,
        message: 'Account record updated successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Update my account failed - Operation: ${operationId}`,
        {
          operation: 'updateMyAccount',
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
        message: 'Failed to update account record',
        operationId,
        operation: 'updateMyAccount',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ========================================
  // ADMIN OPERATIONS (Privilege-based)
  // ========================================

  /**
   * List account records (Admin/Main only)
   *
   * @param user - Full user object from JWT payload
   * @param query - Query parameters for filtering and pagination
   * @returns Promise<{data: AccountResponseDto[], total: number, page: number}>
   */
  @Get()
  @ApiOperation({
    summary: 'List account records',
    description:
      'Returns a paginated list of account records. Requires ADMIN or MAIN privilege.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (1-based)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Records per page',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Account status filter',
  })
  @ApiQuery({
    name: 'group',
    required: false,
    type: String,
    description: 'Account group filter',
  })
  @ApiResponse({
    status: 200,
    description: 'Account records retrieved successfully.',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient privileges to access account list.',
  })
  async listAccounts(
    @User() user: Record<string, unknown>,
    @Query() query: ListAccountsQueryDto,
  ) {
    const operationId = `list_accounts_${Date.now()}`;
    const privilege = this.getUserPrivilege(user);
    const userRole = this.getUserRole(privilege);

    this.logger.log(`Listing accounts - Operation: ${operationId}`, {
      operation: 'listAccounts',
      operationId,
      privilege,
      queryParams: Object.keys(query).length,
      timestamp: new Date().toISOString(),
    });

    // Check admin privilege
    if (privilege < Privilege.ADMIN) {
      this.logger.warn(
        `Insufficient privileges for account list - Operation: ${operationId}`,
        {
          operation: 'listAccounts',
          operationId,
          privilege,
          requiredPrivilege: 'ADMIN',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Insufficient privileges to access account list',
        operationId,
        operation: 'listAccounts',
        requiredPrivilege: 'ADMIN',
        userPrivilege: privilege,
      });
    }

    try {
      const results = await this.accountLookupService.searchByName(
        query.firstName,
        query.lastName,
        userRole,
      );

      this.logger.log(
        `Accounts listed successfully - Operation: ${operationId}`,
        {
          operation: 'listAccounts',
          operationId,
          resultCount: results.length,
          timestamp: new Date().toISOString(),
        },
      );

      return {
        success: true,
        data: results,
        total: results.length,
        page: query.page || 1,
        limit: query.limit || 20,
        message: 'Account records retrieved successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`List accounts failed - Operation: ${operationId}`, {
        operation: 'listAccounts',
        operationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to retrieve account list',
        operationId,
        operation: 'listAccounts',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get specific account record by ID (Admin/Main only)
   *
   * @param accountId - Account ID to retrieve
   * @param user - Full user object from JWT payload
   * @returns Promise<AccountResponseDto | null>
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get specific account record',
    description:
      'Returns a specific account record by ID. Requires ADMIN or MAIN privilege.',
  })
  @ApiParam({ name: 'id', description: 'Account ID (GUID)' })
  @ApiResponse({
    status: 200,
    description: 'Account record found.',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient privileges to access account.',
  })
  @ApiResponse({
    status: 404,
    description: 'Account record not found.',
  })
  async getAccountById(
    @Param('id') accountId: string,
    @User() user: Record<string, unknown>,
  ) {
    const operationId = `get_account_by_id_${Date.now()}`;
    const privilege = this.getUserPrivilege(user);
    const userRole = this.getUserRole(privilege);

    this.logger.log(`Getting account by ID - Operation: ${operationId}`, {
      operation: 'getAccountById',
      operationId,
      accountId: accountId?.substring(0, 8) + '...',
      privilege,
      timestamp: new Date().toISOString(),
    });

    // Check admin privilege
    if (privilege < Privilege.ADMIN) {
      this.logger.warn(
        `Insufficient privileges for account access - Operation: ${operationId}`,
        {
          operation: 'getAccountById',
          operationId,
          privilege,
          requiredPrivilege: 'ADMIN',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Insufficient privileges to access account',
        operationId,
        operation: 'getAccountById',
        requiredPrivilege: 'ADMIN',
        userPrivilege: privilege,
      });
    }

    try {
      const account = await this.accountCrudService.findById(
        accountId,
        userRole,
      );

      if (!account) {
        this.logger.warn(
          `Account not found by ID - Operation: ${operationId}`,
          {
            operation: 'getAccountById',
            operationId,
            accountId: accountId?.substring(0, 8) + '...',
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.ACCOUNT_NOT_FOUND, {
          message: 'Account record not found',
          operationId,
          operation: 'getAccountById',
          resourceId: accountId,
        });
      }

      this.logger.log(
        `Account retrieved successfully - Operation: ${operationId}`,
        {
          operation: 'getAccountById',
          operationId,
          accountId: account.osot_table_accountid,
          timestamp: new Date().toISOString(),
        },
      );

      return {
        success: true,
        data: account,
        message: 'Account record retrieved successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Get account by ID failed - Operation: ${operationId}`,
        {
          operation: 'getAccountById',
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
        message: 'Failed to retrieve account record',
        operationId,
        operation: 'getAccountById',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update account by business ID (Admin/Main only)
   *
   * @param businessId - Account business ID (osot-0000001 format)
   * @param user - Full user object from JWT payload
   * @param updateAccountDto - Account update data
   * @returns Promise<AccountResponseDto | null>
   */
  @Patch('business/:businessId')
  @ApiOperation({
    summary: 'Update account by business ID',
    description:
      'Updates an account record by business ID with business rule validation. Requires ADMIN or MAIN privilege.',
  })
  @ApiParam({
    name: 'businessId',
    description: 'Account business ID (osot-0000001)',
  })
  @ApiBody({ type: UpdateAccountDto })
  @ApiResponse({
    status: 200,
    description: 'Account record updated successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid account data or business rule violation.',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient privileges to update account.',
  })
  @ApiResponse({
    status: 404,
    description: 'Account record not found.',
  })
  async updateAccountByBusinessId(
    @Param('businessId') businessId: string,
    @User() user: Record<string, unknown>,
    @Body() updateAccountDto: UpdateAccountDto,
  ) {
    const operationId = `update_account_by_business_id_${Date.now()}`;
    const privilege = this.getUserPrivilege(user);
    const userRole = this.getUserRole(privilege);

    this.logger.log(
      `Updating account by business ID - Operation: ${operationId}`,
      {
        operation: 'updateAccountByBusinessId',
        operationId,
        businessId,
        privilege,
        fieldsToUpdate: Object.keys(updateAccountDto).length,
        timestamp: new Date().toISOString(),
      },
    );

    // Check admin privilege
    if (privilege < Privilege.ADMIN) {
      this.logger.warn(
        `Insufficient privileges for account update - Operation: ${operationId}`,
        {
          operation: 'updateAccountByBusinessId',
          operationId,
          privilege,
          requiredPrivilege: 'ADMIN',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Insufficient privileges to update account',
        operationId,
        operation: 'updateAccountByBusinessId',
        requiredPrivilege: 'ADMIN',
        userPrivilege: privilege,
      });
    }

    try {
      // First, find the account by business ID
      const account =
        await this.accountLookupService.findByBusinessId(businessId);

      if (!account) {
        this.logger.warn(
          `Account not found by business ID - Operation: ${operationId}`,
          {
            operation: 'updateAccountByBusinessId',
            operationId,
            businessId,
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.ACCOUNT_NOT_FOUND, {
          message: 'Account record not found',
          operationId,
          operation: 'updateAccountByBusinessId',
          resourceId: businessId,
        });
      }

      // Update the account using the found ID
      const updatedAccount =
        await this.accountBusinessRulesService.updateAccountWithValidation(
          account.osot_table_accountid,
          updateAccountDto,
          userRole,
        );

      this.logger.log(
        `Account updated by business ID successfully - Operation: ${operationId}`,
        {
          operation: 'updateAccountByBusinessId',
          operationId,
          businessId,
          accountId: updatedAccount?.osot_table_accountid,
          timestamp: new Date().toISOString(),
        },
      );

      return {
        success: true,
        data: updatedAccount,
        message: 'Account record updated successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Update account by business ID failed - Operation: ${operationId}`,
        {
          operation: 'updateAccountByBusinessId',
          operationId,
          businessId,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      );

      // Re-throw if it's already an AppError
      if (error instanceof Error && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to update account record',
        operationId,
        operation: 'updateAccountByBusinessId',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ========================================
  // STAFF ADMINISTRATIVE ROUTES
  // ========================================

  /**
   * Create new account (STAFF only - MAIN privilege required)
   *
   * Allows STAFF users with MAIN privilege to create accounts for any account group.
   * The new account is automatically associated with the organization from the JWT context.
   *
   * @security Requires MAIN privilege (Privilege.MAIN = 3)
   * @param createDto - Account creation data
   * @param user - User context from JWT (contains organizationId)
   * @returns Promise<AccountResponseDto>
   */
  @Post('staff/create')
  @ApiOperation({
    summary: 'Create account (STAFF only)',
    description:
      'Creates a new account. Requires MAIN privilege. Account is automatically associated with the organization from JWT context.',
  })
  @ApiBody({ type: CreateAccountDto })
  @ApiResponse({
    status: 201,
    description: 'Account created successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { type: 'object' },
        message: { type: 'string' },
        timestamp: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient privilege. MAIN privilege required.',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error (email exists, invalid data, etc).',
  })
  async createAccountStaff(
    @Body() createDto: CreateAccountDto,
    @User() user: Record<string, unknown>,
  ) {
    const operationId = `create_account_staff_${Date.now()}`;

    try {
      this.logger.log(
        `STAFF account creation initiated - Operation: ${operationId}`,
        {
          operation: 'createAccountStaff',
          operationId,
          staffUserId: user?.userId || 'unknown',
          staffEmail: user?.email || 'unknown',
          targetAccountGroup: createDto.osot_account_group,
          timestamp: new Date().toISOString(),
        },
      );

      // Extract privilege and validate MAIN privilege
      const privilege = this.getUserPrivilege(user);
      if (privilege !== Privilege.MAIN) {
        this.logger.warn(
          `Insufficient privilege for STAFF account creation - Operation: ${operationId}`,
          {
            operation: 'createAccountStaff',
            operationId,
            userId: user?.userId || 'unknown',
            requiredPrivilege: 'MAIN',
            actualPrivilege: privilege,
            timestamp: new Date().toISOString(),
          },
        );

        throw new ForbiddenException(
          'Insufficient privilege. MAIN privilege required to create accounts.',
        );
      }

      // Extract organization from JWT (encrypted)
      const organizationId = user?.organizationId as string | undefined;
      if (!organizationId) {
        this.logger.error(
          `Missing organization context in JWT - Operation: ${operationId}`,
          {
            operation: 'createAccountStaff',
            operationId,
            userId: user?.userId || 'unknown',
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'Missing organization context',
          operationId,
        });
      }

      // Decrypt organization GUID
      const organizationGuid = decryptOrganizationId(organizationId);

      this.logger.debug(
        `Organization context resolved - Operation: ${operationId}`,
        {
          operation: 'createAccountStaff',
          operationId,
          organizationSlug: user?.organizationSlug || 'unknown',
          timestamp: new Date().toISOString(),
        },
      );

      // Call CRUD service with organization context
      const userRole = this.getUserRole(privilege);
      const created = await this.accountCrudService.create(
        createDto,
        organizationGuid,
        userRole,
      );

      this.logger.log(
        `STAFF account created successfully - Operation: ${operationId}`,
        {
          operation: 'createAccountStaff',
          operationId,
          accountId: created.osot_account_id,
          accountEmail: created.osot_email,
          accountGroup: created.osot_account_group,
          createdBy: user?.userId || 'unknown',
          timestamp: new Date().toISOString(),
        },
      );

      return {
        success: true,
        data: mapResponseDtoToPublicDto(created),
        message: 'Account created successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to create account via STAFF - Operation: ${operationId}`,
        {
          operation: 'createAccountStaff',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      );

      // Re-throw if it's already an AppError or ForbiddenException
      if (
        error instanceof ForbiddenException ||
        (error instanceof Error && 'code' in error)
      ) {
        throw error;
      }

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to create account',
        operationId,
        operation: 'createAccountStaff',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
