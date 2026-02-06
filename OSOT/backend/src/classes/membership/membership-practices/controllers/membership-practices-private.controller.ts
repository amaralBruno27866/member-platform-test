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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../../../../utils/user.decorator';
import { decryptOrganizationId } from '../../../../utils/organization-crypto.util';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { Privilege, AccessModifier } from '../../../../common/enums';
import {
  canCreate,
  canRead,
  canWrite,
} from '../../../../utils/dataverse-app.helper';

// Services
import { MembershipPracticesBusinessRulesService } from '../services/membership-practices-business-rules.service';
import { MembershipPracticesCrudService } from '../services/membership-practices-crud.service';
import { MembershipPracticesLookupService } from '../services/membership-practices-lookup.service';

// External services for year management
import { MembershipCategoryMembershipYearService } from '../../membership-category/utils/membership-category-membership-year.util';

// Repository for internal data access
import {
  DataverseMembershipPracticesRepository,
  MEMBERSHIP_PRACTICES_REPOSITORY,
} from '../repositories/membership-practices.repository';
import { Inject } from '@nestjs/common';

// DTOs
import { CreateMembershipPracticesDto } from '../dtos/membership-practices-create.dto';
import { UpdateMembershipPracticesDto } from '../dtos/membership-practices-update.dto';
import { MembershipPracticesBasicDto } from '../dtos/membership-practices-basic.dto';
import { ListMembershipPracticesQueryDto } from '../dtos/list-membership-practices.query.dto';

// Utils
import { UserGuidResolverUtil } from '../../membership-employment/utils/user-guid-resolver.util';

/**
 * JWT Payload Interface
 * Represents the structure of the JWT token after decoding.
 * Used for type-safe access to user context from the token.
 */
interface JwtPayload {
  userId: string;
  userGuid: string;
  email: string;
  role: string;
  privilege?: number;
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
  userType?: 'account' | 'affiliate';
  accountId?: string;
  affiliateId?: string;
}

/**
 * Internal DTO type for complete practices creation
 * Used internally by controller to build complete DTO with system fields
 */
interface CompleteMembershipPracticesDto extends CreateMembershipPracticesDto {
  osot_membership_year: string;
  'osot_Table_Account@odata.bind'?: string;
  osot_privilege?: Privilege;
  osot_access_modifiers?: AccessModifier;
}

/**
 * Membership Practices Private Controller
 *
 * HANDLES AUTHENTICATED ROUTES for membership practices management with self-service operations.
 * All routes require JWT authentication and proper user context.
 *
 * USER SELF-MANAGEMENT OPERATIONS:
 * - POST /private/membership-practices/me → Create my practices for current year
 * - GET /private/membership-practices/me → Get my practices for current year
 * - PATCH /private/membership-practices/me → Update my practices for current year
 * - DELETE /private/membership-practices/me → Delete my practices for current year (Admin/Main only - DISABLED)
 *
 * ADMIN OPERATIONS (Admin & Main only):
 * - GET /private/membership-practices → List all practices with filtering
 * - GET /private/membership-practices/{id} → Get specific practice by ID
 * - PATCH /private/membership-practices/{id} → Update specific practice by ID
 * - DELETE /private/membership-practices/{id} → Delete specific practice by ID (DISABLED)
 *
 * BUSINESS LOGIC INTEGRATION:
 * - Automatic year determination from membership-settings
 * - Business rules validation through MembershipPracticesBusinessRulesService
 * - One practice per user per year (enforced at service layer)
 * - Clients age required validation (business required array)
 * - Conditional "_Other" fields validation (2 fields)
 *
 * SECURITY ARCHITECTURE:
 * - JWT authentication required on all routes (@UseGuards(AuthGuard('jwt')))
 * - User context extraction from JWT payload
 * - OWNER: Can only access their own practices
 * - ADMIN/MAIN: Can access and manage all practices
 * - Comprehensive logging with security-aware PII redaction
 * - Business rule validation through MembershipPracticesBusinessRulesService
 *
 * ANNUAL PRACTICES WORKFLOW:
 * 1. User creates practices for current year (auto-determined)
 * 2. System validates year exists and is ACTIVE in membership-settings
 * 3. System validates clients_age is provided (business required, minimum 1 value)
 * 4. System validates conditional "_Other" fields
 * 5. User can update practices anytime during the year
 * 6. GET /me always returns practices for current active year
 * 7. DELETE requires Admin/Main privilege (hard delete - DISABLED)
 *
 * @follows REST API Standards, OpenAPI Specification
 * @integrates MembershipPracticesBusinessRulesService for complete business logic
 * @integrates MembershipPracticesCrudService for data operations
 * @author OSOT Development Team
 * @version 1.0.0 - Membership Practices Implementation
 */
@Controller('private/membership-practices')
@ApiTags('Private Membership Practices Operations')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
export class MembershipPracticesPrivateController {
  private readonly logger = new Logger(
    MembershipPracticesPrivateController.name,
  );

  constructor(
    private readonly businessRulesService: MembershipPracticesBusinessRulesService,
    private readonly crudService: MembershipPracticesCrudService,
    private readonly lookupService: MembershipPracticesLookupService,
    private readonly membershipYearService: MembershipCategoryMembershipYearService,
    private readonly userGuidResolver: UserGuidResolverUtil,
    @Inject(MEMBERSHIP_PRACTICES_REPOSITORY)
    private readonly repository: DataverseMembershipPracticesRepository,
  ) {
    this.logger.log(
      'Membership Practices Private Controller initialized successfully',
    );
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
      : Privilege.OWNER; // Default to OWNER for security
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
   * Get current active membership year from membership-settings
   * Queries active membership settings to determine the correct year
   * @private
   */
  private async getCurrentMembershipYear(
    organizationGuid: string,
  ): Promise<string> {
    return await this.membershipYearService.getCurrentMembershipYear(
      organizationGuid,
    );
  }

  // ========================================
  // USER SELF-MANAGEMENT ROUTES (/me)
  // ========================================

  /**
   * POST /private/membership-practices/me
   * Create membership practices for authenticated user for current year
   *
   * BUSINESS LOGIC:
   * - Automatically determines membership year (current year)
   * - Enforces one practice per user per year (if account provided)
   * - Validates clients_age required (minimum 1 value)
   * - Validates conditional "_Other" fields (2 fields)
   * - Validates year exists and is ACTIVE
   *
   * SECURITY:
   * - User can only create their own practices
   * - Requires OWNER, ADMIN, or MAIN privilege
   */
  @Post('me')
  @ApiOperation({
    summary: 'Create my membership practices',
    description: `
      Creates a membership practices record for the authenticated user for the current active membership year.
      
      **System-Determined Fields (not provided by user):**
      - Membership Year: Automatically determined from active membership-settings
      - Account Reference: Extracted from JWT token (optional for practices)
      - Privilege: Default OWNER
      - Access Modifiers: Default PRIVATE
      
      **User-Provided Fields:**
      - Clients Age: **REQUIRED** array with minimum 1 value (e.g., [1, 2, 3])
      - Practice Area: Optional array (e.g., [1, 5, 10])
      - Practice Settings: Optional array (e.g., [1, 2])
      - Practice Services: Optional array (e.g., [1, 3, 5])
      - Practice Settings Other: Required if PracticeSettings.OTHER (28) selected
      - Practice Services Other: Required if PracticeServices.OTHER (59) selected
      - Preceptor Declaration: Optional boolean
      
      **Business Rules:**
      - One practice per user per year (if account provided)
      - Clients age required (minimum 1 value) - BUSINESS REQUIRED
      - "_Other" fields required when enum value is OTHER
      - Year must exist and be ACTIVE in membership-settings
    `,
  })
  @ApiBody({ type: CreateMembershipPracticesDto })
  @ApiResponse({
    status: 201,
    description: 'Membership practices created successfully.',
    type: MembershipPracticesBasicDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid practices data or business rule violation.',
  })
  @ApiResponse({
    status: 409,
    description: 'Practices already exists for this year.',
  })
  async createMyPractices(
    @User('userId') userId: string,
    @User() user: Record<string, unknown>,
    @Body() createDto: CreateMembershipPracticesDto,
  ) {
    const operationId = `create_my_practices_${Date.now()}`;
    const privilege = this.getUserPrivilege(user);
    const userRole = this.getUserRole(privilege);

    this.logger.log(`Creating practices for user - Operation: ${operationId}`, {
      operation: 'createMyPractices',
      operationId,
      userId: userId?.substring(0, 8) + '...',
      privilege,
      timestamp: new Date().toISOString(),
    });

    // Verify user has permission to create
    if (!canCreate(userRole)) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: `Insufficient permissions to create practices. Required: OWNER, ADMIN, or MAIN. Current: ${userRole}`,
        operationId,
        operation: 'createMyPractices',
        userRole,
      });
    }

    // Determine current membership year
    const organizationGuid = decryptOrganizationId(
      (user as unknown as JwtPayload).organizationId,
    );
    const membershipYear =
      await this.getCurrentMembershipYear(organizationGuid);

    // Get user GUID from business ID (account only for practices)
    const userGuid = await this.userGuidResolver.resolveUserGuid(
      userId,
      'account',
    );

    // Build complete DTO with system-determined fields including OData bind
    const completeDto: CompleteMembershipPracticesDto = {
      ...createDto,
      osot_membership_year: membershipYear,
      // Add account OData bind (optional for practices)
      'osot_Table_Account@odata.bind': `/osot_table_accounts(${userGuid})`,
      osot_privilege: Privilege.OWNER,
      osot_access_modifiers: AccessModifier.PRIVATE,
    };

    // Validate and create through business rules service
    const practices = await this.businessRulesService.createWithValidation(
      completeDto,
      privilege,
      userId,
      operationId,
    );

    this.logger.log('Practices created successfully for current year');

    return {
      success: true,
      data: practices,
      message: 'Membership practices created successfully',
    };
  }

  /**
   * GET /private/membership-practices/me
   * Get authenticated user's practices for current year
   *
   * BUSINESS LOGIC:
   * - Returns practices for current active year only
   * - Returns 404 if no practices exists for current year
   *
   * SECURITY:
   * - User can only read their own practices
   */
  @Get('me')
  @ApiOperation({
    summary: 'Get my membership practices',
    description: `
      Returns the membership practices record for the authenticated user for the current active year.
      
      **Returns only practices-related fields:**
      - Membership year
      - Clients age groups (BUSINESS REQUIRED)
      - Practice areas
      - Practice settings
      - Practice services
      - Other descriptions (conditional)
      - Preceptor declaration
      
      **Note:** System fields, lookups, and metadata are excluded from this endpoint.
      For complete practices data, use the admin route GET /{id}
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Practices found.',
    type: MembershipPracticesBasicDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Practices not found for current year.',
  })
  async getMyPractices(
    @User('userId') userId: string,
    @User() user: Record<string, unknown>,
  ) {
    const operationId = `get_my_practices_${Date.now()}`;
    const privilege = this.getUserPrivilege(user);
    const userRole = this.getUserRole(privilege);

    // Verify user has permission to read
    if (!canRead(userRole)) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: `Insufficient permissions to read practices. Required: OWNER, ADMIN, or MAIN. Current: ${userRole}`,
        operationId,
        operation: 'getMyPractices',
        userRole,
      });
    }

    // Determine current membership year
    const organizationGuid = decryptOrganizationId(
      (user as unknown as JwtPayload).organizationId,
    );
    const membershipYear =
      await this.getCurrentMembershipYear(organizationGuid);

    // Find practices by user ID and year
    const practices = await this.lookupService.findByUserAndYear(
      userId,
      membershipYear,
      privilege,
      userId,
      operationId,
    );

    if (!practices) {
      throw createAppError(ErrorCodes.NOT_FOUND, {
        message: `No practices found for year ${membershipYear}`,
        operationId,
        userId,
        membershipYear,
      });
    }

    return {
      success: true,
      data: practices,
      message: 'Membership practices retrieved successfully',
    };
  }

  /**
   * PATCH /private/membership-practices/me
   * Update authenticated user's practices for current year
   *
   * BUSINESS LOGIC:
   * - Updates practices for current year only
   * - Validates business rules (clients_age, conditional "_Other" fields)
   * - Partial updates supported (only provided fields updated)
   * - Cannot change membership year
   *
   * SECURITY:
   * - User can only update their own practices
   */
  @Patch('me')
  @ApiOperation({
    summary: 'Update my membership practices',
    description: `
      Updates the membership practices record for the authenticated user for the current year.
      
      **Business Rules:**
      - Clients age validated if provided (minimum 1 value)
      - "_Other" fields validated when enum value is OTHER (2 fields)
      - Partial updates supported (only provided fields are updated)
      - Cannot change membership year via this route
      
      **Note:** Cannot change Account reference
    `,
  })
  @ApiBody({ type: UpdateMembershipPracticesDto })
  @ApiResponse({
    status: 200,
    description: 'Practices updated successfully.',
    type: MembershipPracticesBasicDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid practices data or business rule violation.',
  })
  @ApiResponse({
    status: 404,
    description: 'Practices not found for current year.',
  })
  async updateMyPractices(
    @User('userId') userId: string,
    @User() user: Record<string, unknown>,
    @Body() updateDto: UpdateMembershipPracticesDto,
  ) {
    const operationId = `update_my_practices_${Date.now()}`;
    const privilege = this.getUserPrivilege(user);
    const userRole = this.getUserRole(privilege);

    this.logger.log(`Updating practices for user - Operation: ${operationId}`);

    // Verify user has permission to update
    if (!canWrite(userRole)) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: `Insufficient permissions to update practices. Required: OWNER, ADMIN, or MAIN. Current: ${userRole}`,
        operationId,
        operation: 'updateMyPractices',
        userRole,
      });
    }

    // Determine current membership year
    const organizationGuid = decryptOrganizationId(
      (user as unknown as JwtPayload).organizationId,
    );
    const membershipYear =
      await this.getCurrentMembershipYear(organizationGuid);

    // Find practices by user ID and year (Internal with ID)
    const practicesInternal = await this.repository.findByUserAndYear(
      userId,
      membershipYear,
    );

    if (!practicesInternal) {
      throw createAppError(ErrorCodes.NOT_FOUND, {
        message: `No practices found for year ${membershipYear}`,
        operationId,
        userId,
        membershipYear,
      });
    }

    // Validate business rules before update
    this.businessRulesService.validateUpdateDto(
      updateDto,
      practicesInternal,
      operationId,
    );

    // Update practices through CRUD service using the practices Business ID
    const updatedPractices = await this.crudService.update(
      practicesInternal.osot_practice_id,
      updateDto,
      privilege,
      userId,
      operationId,
    );

    this.logger.log('Practices updated successfully for current year');

    return {
      success: true,
      data: updatedPractices,
      message: 'Membership practices updated successfully',
    };
  }

  /**
   * DELETE /private/membership-practices/me
   * Delete authenticated user's practices for current year
   *
   * BUSINESS LOGIC:
   * - Deletes practices for current year only (hard delete)
   * - Permanent deletion - cannot be undone
   *
   * SECURITY:
   * - Requires ADMIN or MAIN privilege (OWNER cannot delete)
   *
   * STATUS: TEMPORARILY DISABLED - Route commented out until deletion permissions are finalized
   */
  // @Delete('me')
  // @ApiOperation({
  //   summary: 'Delete my membership practices (Admin/Main only)',
  //   description: `
  //     Permanently deletes the membership practices record for the authenticated user for the current year.
  //
  //     **Access:** Admin and Main only (OWNER cannot delete their own practices)
  //
  //     **Warning:** This is a hard delete operation and cannot be undone.
  //   `,
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Practices deleted successfully.',
  // })
  // @ApiResponse({
  //   status: 403,
  //   description: 'Access denied - Admin or Main privilege required.',
  // })
  // @ApiResponse({
  //   status: 404,
  //   description: 'Practices not found for current year.',
  // })
  // async deleteMyPractices(
  //   @User('userId') userId: string,
  //   @User() user: Record<string, unknown>,
  // ) {
  //   const operationId = `delete_my_practices_${Date.now()}`;
  //   const privilege = this.getUserPrivilege(user);
  //   const userRole = this.getUserRole(privilege);

  //   this.logger.log(`Deleting practices for user - Operation: ${operationId}`);

  //   // Verify user has permission to delete (Admin/Main only)
  //   if (!canDelete(userRole)) {
  //     throw createAppError(ErrorCodes.PERMISSION_DENIED, {
  //       message: `Insufficient permissions to delete practices. Required: ADMIN or MAIN. Current: ${userRole}`,
  //       operationId,
  //       operation: 'deleteMyPractices',
  //       userRole,
  //       requiredPermissions: ['ADMIN', 'MAIN'],
  //     });
  //   }

  //   // Determine current membership year
  //   const membershipYear = await this.getCurrentMembershipYear();

  //   // Find practices by user ID and year
  //   const practicesInternal = await this.repository.findByUserAndYear(
  //     userId,
  //     membershipYear,
  //   );

  //   if (!practicesInternal) {
  //     throw createAppError(ErrorCodes.NOT_FOUND, {
  //       message: `No practices found for year ${membershipYear}`,
  //       operationId,
  //       userId,
  //       membershipYear,
  //     });
  //   }

  //   // Delete practices through CRUD service
  //   await this.crudService.delete(
  //     practicesInternal.osot_membership_practicesid,
  //     privilege,
  //     userId,
  //     operationId,
  //   );

  //   this.logger.log('Practices deleted successfully for current year');

  //   return {
  //     success: true,
  //     message: 'Membership practices deleted successfully',
  //   };
  // }

  // ========================================
  // ADMIN OPERATIONS (Admin & Main only)
  // ========================================

  /**
   * GET /private/membership-practices
   * List all membership practices with filtering (Admin/Main only)
   *
   * SECURITY:
   * - Requires ADMIN or MAIN privilege
   * - Returns all practices across all users
   *
   * FILTERING:
   * - Filter by year, account, clients age, practice area
   * - Filter by specific practices values
   * - Pagination support
   */
  @Get()
  @ApiOperation({
    summary: 'List all membership practices (Admin/Main only)',
    description: `
      Returns a list of all membership practices with optional filtering.
      
      **Access:** Admin and Main only
      
      **Filtering Options:**
      - membershipYear: Filter by year (e.g., 2026)
      - accountId: Filter by account GUID
      - clientsAge: Filter by client age group
      - practiceArea: Filter by practice area
      - Plus additional practices-specific filters
      
      **Pagination:**
      - skip: Number of records to skip (default: 0)
      - top: Results per page (default: 20, max: 100)
    `,
  })
  @ApiQuery({ type: ListMembershipPracticesQueryDto })
  @ApiResponse({
    status: 200,
    description: 'List of practices retrieved successfully.',
    type: [MembershipPracticesBasicDto],
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - Admin or Main privilege required.',
  })
  async listPractices(
    @User() user: Record<string, unknown>,
    @Query() queryDto: ListMembershipPracticesQueryDto,
  ) {
    const operationId = `list_practices_${Date.now()}`;
    const privilege = this.getUserPrivilege(user);
    const userRole = this.getUserRole(privilege);
    const userId = user?.accountId as string;

    this.logger.log(`Listing practices - Operation: ${operationId}`);

    // Verify user has admin/main privilege
    if (privilege !== Privilege.ADMIN && privilege !== Privilege.MAIN) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: `Access denied. Admin or Main privilege required. Current: ${userRole}`,
        operationId,
        operation: 'listPractices',
        userRole,
        requiredPermissions: ['ADMIN', 'MAIN'],
      });
    }

    // Use lookup service list method with full filtering and pagination
    const result = await this.lookupService.list(
      queryDto,
      privilege,
      userId,
      operationId,
    );

    this.logger.log(
      `Successfully listed ${result.data.length} practices (total: ${result.total}) - Operation: ${operationId}`,
    );

    return {
      success: true,
      data: result.data,
      message: 'Practices retrieved successfully',
      metadata: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * GET /private/membership-practices/{id}
   * Get specific practice by ID (Admin/Main only)
   *
   * SECURITY:
   * - Requires ADMIN or MAIN privilege
   * - Can access any user's practices
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get practices by ID (Admin/Main only)',
    description: `
      Returns a specific membership practices by practice ID.
      
      **Access:** Admin and Main only
      
      **Note:** Regular users should use GET /me to access their own practices
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Practice ID (business ID, not GUID)',
    example: 'PRA-2026-12345',
  })
  @ApiResponse({
    status: 200,
    description: 'Practices found.',
    type: MembershipPracticesBasicDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - Admin or Main privilege required.',
  })
  @ApiResponse({
    status: 404,
    description: 'Practices not found.',
  })
  async getPracticesById(
    @User() user: Record<string, unknown>,
    @Param('id') practiceId: string,
  ) {
    const operationId = `get_practices_${Date.now()}`;
    const privilege = this.getUserPrivilege(user);
    const userRole = this.getUserRole(privilege);

    this.logger.log(
      `Getting practices by ID - Operation: ${operationId}, ID: ${practiceId}`,
    );

    // Verify user has admin/main privilege
    if (privilege !== Privilege.ADMIN && privilege !== Privilege.MAIN) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: `Access denied. Admin or Main privilege required. Current: ${userRole}`,
        operationId,
        operation: 'getPracticesById',
        userRole,
        requiredPermissions: ['ADMIN', 'MAIN'],
      });
    }

    // Find practices by ID
    const practices = await this.lookupService.findByPracticeId(practiceId);

    return {
      success: true,
      data: practices,
      message: 'Practices retrieved successfully',
    };
  }

  /**
   * PATCH /private/membership-practices/{id}
   * Update specific practices by ID (Admin/Main only)
   *
   * SECURITY:
   * - Requires ADMIN or MAIN privilege
   * - Can update any user's practices
   *
   * BUSINESS LOGIC:
   * - Validates business rules (clients_age, conditional "_Other" fields)
   * - Partial updates supported
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update practices by ID (Admin/Main only)',
    description: `
      Updates a specific membership practices by practice ID.
      
      **Access:** Admin and Main only
      
      **Business Rules:**
      - Clients age validated if provided (minimum 1 value)
      - "_Other" fields validated when enum value is OTHER (2 fields)
      - Partial updates supported (only provided fields are updated)
      - Cannot change membership year
      
      **Note:** Regular users should use PATCH /me to update their own practices
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Practice ID (business ID, not GUID)',
    example: 'PRA-2026-12345',
  })
  @ApiBody({ type: UpdateMembershipPracticesDto })
  @ApiResponse({
    status: 200,
    description: 'Practices updated successfully.',
    type: MembershipPracticesBasicDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid practices data or business rule violation.',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - Admin or Main privilege required.',
  })
  @ApiResponse({
    status: 404,
    description: 'Practices not found.',
  })
  async updatePracticesById(
    @User('userId') userId: string,
    @User() user: Record<string, unknown>,
    @Param('id') practiceId: string,
    @Body() updateDto: UpdateMembershipPracticesDto,
  ) {
    const operationId = `update_practices_${Date.now()}`;
    const privilege = this.getUserPrivilege(user);
    const userRole = this.getUserRole(privilege);

    this.logger.log(
      `Updating practices by ID - Operation: ${operationId}, ID: ${practiceId}`,
    );

    // Verify user has admin/main privilege
    if (privilege !== Privilege.ADMIN && privilege !== Privilege.MAIN) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: `Access denied. Admin or Main privilege required. Current: ${userRole}`,
        operationId,
        operation: 'updatePracticesById',
        userRole,
        requiredPermissions: ['ADMIN', 'MAIN'],
      });
    }

    // Validate and update through business rules service
    const updatedPractices =
      await this.businessRulesService.updateWithValidation(
        practiceId,
        updateDto,
        privilege,
        userId,
        operationId,
      );

    this.logger.log('Practices updated successfully by admin');

    return {
      success: true,
      data: updatedPractices,
      message: 'Practices updated successfully',
    };
  }

  /**
   * DELETE /private/membership-practices/{id}
   * Delete specific practices by ID (Admin/Main only)
   *
   * SECURITY:
   * - Requires ADMIN or MAIN privilege
   * - Can delete any user's practices
   *
   * BUSINESS LOGIC:
   * - Hard delete operation
   * - Permanent deletion - cannot be undone
   *
   * STATUS: TEMPORARILY DISABLED - Route commented out until deletion permissions are finalized
   */
  // @Delete(':id')
  // @ApiOperation({
  //   summary: 'Delete practices by ID (Admin/Main only)',
  //   description: `
  //     Permanently deletes a specific membership practices by practice ID.
  //
  //     **Access:** Admin and Main only
  //
  //     **Warning:** This is a hard delete operation and cannot be undone.
  //
  //     **Note:** Regular users cannot delete practices records (not even their own)
  //   `,
  // })
  // @ApiParam({
  //   name: 'id',
  //   description: 'Practice ID (business ID, not GUID)',
  //   example: 'PRA-2026-12345',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Practices deleted successfully.',
  // })
  // @ApiResponse({
  //   status: 403,
  //   description: 'Access denied - Admin or Main privilege required.',
  // })
  // @ApiResponse({
  //   status: 404,
  //   description: 'Practices not found.',
  // })
  // async deletePracticesById(
  //   @User('userId') userId: string,
  //   @User() user: Record<string, unknown>,
  //   @Param('id') practiceId: string,
  // ) {
  //   const operationId = `delete_practices_${Date.now()}`;
  //   const privilege = this.getUserPrivilege(user);
  //   const userRole = this.getUserRole(privilege);

  //   this.logger.log(
  //     `Deleting practices by ID - Operation: ${operationId}, ID: ${practiceId}`,
  //   );

  //   // Verify user has admin/main privilege
  //   if (privilege !== Privilege.ADMIN && privilege !== Privilege.MAIN) {
  //     throw createAppError(ErrorCodes.PERMISSION_DENIED, {
  //       message: `Access denied. Admin or Main privilege required. Current: ${userRole}`,
  //       operationId,
  //       operation: 'deletePracticesById',
  //       userRole,
  //       requiredPermissions: ['ADMIN', 'MAIN'],
  //     });
  //   }

  //   // Delete practices through CRUD service
  //   await this.crudService.delete(practiceId, privilege, userId, operationId);

  //   this.logger.log('Practices deleted successfully by admin');

  //   return {
  //     success: true,
  //     message: 'Practices deleted successfully',
  //   };
  // }
}
