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
import { MembershipEmploymentBusinessRulesService } from '../services/membership-employment-business-rules.service';
import { MembershipEmploymentCrudService } from '../services/membership-employment-crud.service';
import { MembershipEmploymentLookupService } from '../services/membership-employment-lookup.service';

// External services for year management
import { MembershipCategoryMembershipYearService } from '../../membership-category/utils/membership-category-membership-year.util';

// Repository for internal data access
import {
  DataverseMembershipEmploymentRepository,
  MEMBERSHIP_EMPLOYMENT_REPOSITORY,
} from '../repositories/membership-employment.repository';
import { Inject } from '@nestjs/common';

// DTOs
import { CreateMembershipEmploymentDto } from '../dtos/membership-employment-create.dto';
import { UpdateMembershipEmploymentDto } from '../dtos/membership-employment-update.dto';
import { MembershipEmploymentBasicDto } from '../dtos/membership-employment-basic.dto';
import { ListMembershipEmploymentsQueryDto } from '../dtos/list-membership-employments.query.dto';

// Utils
import { UserGuidResolverUtil } from '../utils/user-guid-resolver.util';

/**
 * JWT Payload Interface
 * Represents the decoded JWT token structure
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
 * Internal DTO type for complete employment creation
 * Used internally by controller to build complete DTO with system fields
 */
interface CompleteMembershipEmploymentDto
  extends CreateMembershipEmploymentDto {
  osot_membership_year: string;
  'osot_Table_Account@odata.bind'?: string;
  'osot_Table_Account_Affiliate@odata.bind'?: string;
  osot_privilege?: Privilege;
  osot_access_modifiers?: AccessModifier;
}

/**
 * Membership Employment Private Controller
 *
 * HANDLES AUTHENTICATED ROUTES for membership employment management with self-service operations.
 * All routes require JWT authentication and proper user context.
 *
 * USER SELF-MANAGEMENT OPERATIONS:
 * - POST /private/membership-employments/me → Create my employment for current year
 * - GET /private/membership-employments/me → Get my employment for current year
 * - PATCH /private/membership-employments/me → Update my employment for current year
 * - DELETE /private/membership-employments/me → Delete my employment for current year (Admin/Main only)
 *
 * ADMIN OPERATIONS (Admin & Main only):
 * - GET /private/membership-employments → List all employments with filtering
 * - GET /private/membership-employments/{id} → Get specific employment by ID
 * - PATCH /private/membership-employments/{id} → Update specific employment by ID
 * - DELETE /private/membership-employments/{id} → Delete specific employment by ID
 *
 * BUSINESS LOGIC INTEGRATION:
 * - Automatic year determination from membership-settings
 * - Business rules validation through MembershipEmploymentBusinessRulesService
 * - One employment per user per year (enforced at service layer)
 * - XOR validation: Account OR Affiliate (never both)
 * - Conditional "_Other" fields validation
 *
 * SECURITY ARCHITECTURE:
 * - JWT authentication required on all routes (@UseGuards(AuthGuard('jwt')))
 * - User context extraction from JWT payload
 * - OWNER: Can only access their own employment
 * - ADMIN/MAIN: Can access and manage all employments
 * - Comprehensive logging with security-aware PII redaction
 * - Business rule validation through MembershipEmploymentBusinessRulesService
 *
 * ANNUAL EMPLOYMENT WORKFLOW:
 * 1. User creates employment for current year (auto-determined)
 * 2. System validates year exists and is ACTIVE in membership-settings
 * 3. System validates conditional "_Other" fields
 * 4. User can update employment anytime during the year
 * 5. GET /me always returns employment for current active year
 * 6. DELETE requires Admin/Main privilege (hard delete)
 *
 * @follows REST API Standards, OpenAPI Specification
 * @integrates MembershipEmploymentBusinessRulesService for complete business logic
 * @integrates MembershipEmploymentCrudService for data operations
 * @author OSOT Development Team
 * @version 1.0.0 - Membership Employment Implementation
 */
@Controller('private/membership-employments')
@ApiTags('Private Membership Employment Operations')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
export class MembershipEmploymentPrivateController {
  private readonly logger = new Logger(
    MembershipEmploymentPrivateController.name,
  );

  constructor(
    private readonly businessRulesService: MembershipEmploymentBusinessRulesService,
    private readonly crudService: MembershipEmploymentCrudService,
    private readonly lookupService: MembershipEmploymentLookupService,
    private readonly membershipYearService: MembershipCategoryMembershipYearService,
    private readonly userGuidResolver: UserGuidResolverUtil,
    @Inject(MEMBERSHIP_EMPLOYMENT_REPOSITORY)
    private readonly repository: DataverseMembershipEmploymentRepository,
  ) {
    this.logger.log(
      'Membership Employment Private Controller initialized successfully',
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
   * Determine user type from JWT payload
   * @private
   */
  private getUserType(user: Record<string, unknown>): 'account' | 'affiliate' {
    const userType = user?.userType as string;

    if (userType === 'affiliate') {
      return 'affiliate';
    } else if (userType === 'account') {
      return 'account';
    } else {
      this.logger.warn(
        `Unknown userType in JWT: ${userType}, defaulting to account`,
      );
      return 'account';
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
   * POST /private/membership-employment/me
   * Create membership employment for authenticated user for current year
   *
   * BUSINESS LOGIC:
   * - Automatically determines membership year (current year)
   * - Enforces one employment per user per year
   * - Validates XOR: Account OR Affiliate (never both)
   * - Validates conditional "_Other" fields
   * - Validates year exists and is ACTIVE
   *
   * SECURITY:
   * - User can only create their own employment
   * - Requires OWNER, ADMIN, or MAIN privilege
   */
  @Post('me')
  @ApiOperation({
    summary: 'Create my membership employment',
    description: `
      Creates a membership employment record for the authenticated user for the current active membership year.
      
      **System-Determined Fields (not provided by user):**
      - Membership Year: Automatically determined from active membership-settings
      - Account/Affiliate Reference: Extracted from JWT token
      - Privilege: Default OWNER
      - Access Modifiers: Default PRIVATE
      
      **User-Provided Fields:**
      - Employment Status: Required (EMPLOYEE, SELF_EMPLOYED, etc.)
      - Role Descriptor: Required (PSYCHOTHERAPIST, SUPERVISOR, etc.)
      - Organization Name: Optional
      - Practice Years: Optional
      - Work Hours: Optional
      - Hourly Earnings: Optional
      - Funding: Optional
      - Benefits: Optional
      - Conditional "_Other" fields when applicable
      
      **Business Rules:**
      - Only one employment per user per year
      - Account OR Affiliate (never both - enforced by JWT)
      - "_Other" fields required when enum value is OTHER
      - Year must exist and be ACTIVE in membership-settings
    `,
  })
  @ApiBody({ type: CreateMembershipEmploymentDto })
  @ApiResponse({
    status: 201,
    description: 'Membership employment created successfully.',
    type: MembershipEmploymentBasicDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid employment data or business rule violation.',
  })
  @ApiResponse({
    status: 409,
    description: 'Employment already exists for this year.',
  })
  async createMyEmployment(
    @User('userId') userId: string,
    @User() user: Record<string, unknown>,
    @Body() createDto: CreateMembershipEmploymentDto,
  ) {
    const operationId = `create_my_employment_${Date.now()}`;
    const privilege = this.getUserPrivilege(user);
    const userRole = this.getUserRole(privilege);
    const userType = this.getUserType(user);

    this.logger.log(
      `Creating employment for user - Operation: ${operationId}`,
      {
        operation: 'createMyEmployment',
        operationId,
        userId: userId?.substring(0, 8) + '...',
        userType,
        privilege,
        timestamp: new Date().toISOString(),
      },
    );

    // Verify user has permission to create
    if (!canCreate(userRole)) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: `Insufficient permissions to create employment. Required: OWNER, ADMIN, or MAIN. Current: ${userRole}`,
        operationId,
        operation: 'createMyEmployment',
        userRole,
      });
    }

    // Determine current membership year
    const organizationGuid = decryptOrganizationId(
      (user as unknown as JwtPayload).organizationId,
    );
    const membershipYear =
      await this.getCurrentMembershipYear(organizationGuid);

    // Get user GUID from business ID
    const userGuid = await this.userGuidResolver.resolveUserGuid(
      userId,
      userType,
    );

    // Build complete DTO with system-determined fields including OData binds
    const completeDto: CompleteMembershipEmploymentDto = {
      ...createDto,
      osot_membership_year: membershipYear,
      // Add user OData bind based on type (XOR enforced by JWT)
      ...(userType === 'account'
        ? {
            'osot_Table_Account@odata.bind': `/osot_table_accounts(${userGuid})`,
          }
        : {
            'osot_Table_Account_Affiliate@odata.bind': `/osot_table_account_affiliates(${userGuid})`,
          }),
      osot_privilege: Privilege.OWNER,
      osot_access_modifiers: AccessModifier.PRIVATE,
    };

    // Validate and create through business rules service
    const employment = await this.businessRulesService.createWithValidation(
      completeDto,
      privilege,
      userId,
      operationId,
    );

    this.logger.log('Employment created successfully for current year');

    return {
      success: true,
      data: employment,
      message: 'Membership employment created successfully',
    };
  }

  /**
   * GET /private/membership-employment/me
   * Get authenticated user's employment for current year
   *
   * BUSINESS LOGIC:
   * - Returns employment for current active year only
   * - Returns 404 if no employment exists for current year
   *
   * SECURITY:
   * - User can only read their own employment
   */
  @Get('me')
  @ApiOperation({
    summary: 'Get my membership employment',
    description: `
      Returns the membership employment record for the authenticated user for the current active year.
      
      **Returns only employment-related fields:**
      - Membership year
      - Employment status
      - Role descriptor
      - Organization details
      - Practice years
      - Work hours
      - Hourly earnings
      - Funding type
      - Benefits
      
      **Note:** System fields, lookups, and metadata are excluded from this endpoint.
      For complete employment data, use the admin route GET /{id}
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Employment found.',
    type: MembershipEmploymentBasicDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Employment not found for current year.',
  })
  async getMyEmployment(
    @User('userId') userId: string,
    @User() user: Record<string, unknown>,
  ) {
    const operationId = `get_my_employment_${Date.now()}`;
    const privilege = this.getUserPrivilege(user);
    const userRole = this.getUserRole(privilege);
    const userType = this.getUserType(user);

    // Verify user has permission to read
    if (!canRead(userRole)) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: `Insufficient permissions to read employment. Required: OWNER, ADMIN, or MAIN. Current: ${userRole}`,
        operationId,
        operation: 'getMyEmployment',
        userRole,
      });
    }

    // Determine current membership year
    const organizationGuid = decryptOrganizationId(
      (user as unknown as JwtPayload).organizationId,
    );
    const membershipYear =
      await this.getCurrentMembershipYear(organizationGuid);

    // Find employment by user ID and year
    const employment = await this.lookupService.findByUserAndYear(
      userId,
      membershipYear,
      userType,
      privilege,
      userId,
      operationId,
    );

    if (!employment) {
      throw createAppError(ErrorCodes.NOT_FOUND, {
        message: `No employment found for year ${membershipYear}`,
        operationId,
        userId,
        membershipYear,
      });
    }

    return {
      success: true,
      data: employment,
      message: 'Membership employment retrieved successfully',
    };
  }

  /**
   * PATCH /private/membership-employment/me
   * Update authenticated user's employment for current year
   *
   * BUSINESS LOGIC:
   * - Updates employment for current year only
   * - Validates business rules (conditional "_Other" fields)
   * - Partial updates supported (only provided fields updated)
   * - Cannot change membership year
   *
   * SECURITY:
   * - User can only update their own employment
   */
  @Patch('me')
  @ApiOperation({
    summary: 'Update my membership employment',
    description: `
      Updates the membership employment record for the authenticated user for the current year.
      
      **Business Rules:**
      - "_Other" fields validated when enum value is OTHER
      - Partial updates supported (only provided fields are updated)
      - Cannot change membership year via this route
      
      **Note:** Cannot change Account/Affiliate reference
    `,
  })
  @ApiBody({ type: UpdateMembershipEmploymentDto })
  @ApiResponse({
    status: 200,
    description: 'Employment updated successfully.',
    type: MembershipEmploymentBasicDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid employment data or business rule violation.',
  })
  @ApiResponse({
    status: 404,
    description: 'Employment not found for current year.',
  })
  async updateMyEmployment(
    @User('userId') userId: string,
    @User() user: Record<string, unknown>,
    @Body() updateDto: UpdateMembershipEmploymentDto,
  ) {
    const operationId = `update_my_employment_${Date.now()}`;
    const privilege = this.getUserPrivilege(user);
    const userRole = this.getUserRole(privilege);
    const userType = this.getUserType(user);

    this.logger.log(`Updating employment for user - Operation: ${operationId}`);

    // Verify user has permission to update
    if (!canWrite(userRole)) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: `Insufficient permissions to update employment. Required: OWNER, ADMIN, or MAIN. Current: ${userRole}`,
        operationId,
        operation: 'updateMyEmployment',
        userRole,
      });
    }

    // Determine current membership year
    const organizationGuid = decryptOrganizationId(
      (user as unknown as JwtPayload).organizationId,
    );
    const membershipYear =
      await this.getCurrentMembershipYear(organizationGuid);

    // Find employment by user ID and year (Internal with ID)
    // Repository expects Business ID and converts internally
    const employmentInternal = await this.repository.findByUserAndYear(
      userId,
      membershipYear,
      userType,
    );

    if (!employmentInternal) {
      throw createAppError(ErrorCodes.NOT_FOUND, {
        message: `No employment found for year ${membershipYear}`,
        operationId,
        userId,
        membershipYear,
      });
    }

    // Validate business rules before update
    this.businessRulesService.validateUpdateDto(
      updateDto,
      employmentInternal,
      operationId,
    );

    // Update employment through CRUD service using the employment Business ID
    const updatedEmployment = await this.crudService.update(
      employmentInternal.osot_employment_id,
      updateDto,
      privilege,
      userId,
      operationId,
    );

    this.logger.log('Employment updated successfully for current year');

    return {
      success: true,
      data: updatedEmployment,
      message: 'Membership employment updated successfully',
    };
  }

  /**
   * DELETE /private/membership-employment/me
   * Delete authenticated user's employment for current year
   *
   * BUSINESS LOGIC:
   * - Deletes employment for current year only (hard delete)
   * - Permanent deletion - cannot be undone
   *
   * SECURITY:
   * - Requires ADMIN or MAIN privilege (OWNER cannot delete)
   *
   * STATUS: TEMPORARILY DISABLED - Route commented out until deletion permissions are finalized
   */
  // @Delete('me')
  // @ApiOperation({
  //   summary: 'Delete my membership employment (Admin/Main only)',
  //   description: `
  //     Permanently deletes the membership employment record for the authenticated user for the current year.
  //
  //     **Access:** Admin and Main only (OWNER cannot delete their own employment)
  //
  //     **Warning:** This is a hard delete operation and cannot be undone.
  //   `,
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Employment deleted successfully.',
  // })
  // @ApiResponse({
  //   status: 403,
  //   description: 'Access denied - Admin or Main privilege required.',
  // })
  // @ApiResponse({
  //   status: 404,
  //   description: 'Employment not found for current year.',
  // })
  // async deleteMyEmployment(
  //   @User('userId') userId: string,
  //   @User() user: Record<string, unknown>,
  // ) {
  //   const operationId = `delete_my_employment_${Date.now()}`;
  //   const privilege = this.getUserPrivilege(user);
  //   const userRole = this.getUserRole(privilege);
  //   const userType = this.getUserType(user);

  //   this.logger.log(`Deleting employment for user - Operation: ${operationId}`);

  //   // Verify user has permission to delete (Admin/Main only)
  //   if (!canDelete(userRole)) {
  //     throw createAppError(ErrorCodes.PERMISSION_DENIED, {
  //       message: `Insufficient permissions to delete employment. Required: ADMIN or MAIN. Current: ${userRole}`,
  //       operationId,
  //       operation: 'deleteMyEmployment',
  //       userRole,
  //       requiredPermissions: ['ADMIN', 'MAIN'],
  //     });
  //   }

  //   // Determine current membership year
  //   const membershipYear = await this.getCurrentMembershipYear();

  //   // Find employment by user ID and year
  //   const employmentInternal = await this.repository.findByUserAndYear(
  //     userId,
  //     membershipYear,
  //     userType,
  //   );

  //   if (!employmentInternal) {
  //     throw createAppError(ErrorCodes.NOT_FOUND, {
  //       message: `No employment found for year ${membershipYear}`,
  //       operationId,
  //       userId,
  //       membershipYear,
  //     });
  //   }

  //   // Delete employment through CRUD service
  //   await this.crudService.delete(
  //     employmentInternal.osot_table_membership_employmentid,
  //     privilege,
  //     userId,
  //     operationId,
  //   );

  //   this.logger.log('Employment deleted successfully for current year');

  //   return {
  //     success: true,
  //     message: 'Membership employment deleted successfully',
  //   };
  // }

  // ========================================
  // ADMIN OPERATIONS (Admin & Main only)
  // ========================================

  /**
   * GET /private/membership-employment
   * List all membership employments with filtering (Admin/Main only)
   *
   * SECURITY:
   * - Requires ADMIN or MAIN privilege
   * - Returns all employments across all users
   *
   * FILTERING:
   * - Filter by year, account, affiliate, employment status
   * - Filter by specific employment values
   * - Pagination support
   */
  @Get()
  @ApiOperation({
    summary: 'List all membership employments (Admin/Main only)',
    description: `
      Returns a list of all membership employments with optional filtering.
      
      **Access:** Admin and Main only
      
      **Filtering Options:**
      - membershipYear: Filter by year (e.g., "2026")
      - accountId: Filter by account GUID
      - affiliateId: Filter by affiliate GUID
      - employmentStatus: Filter by status
      - Plus additional employment-specific filters
      
      **Pagination:**
      - page: Page number (default: 1)
      - pageSize: Results per page (default: 50, max: 100)
    `,
  })
  @ApiQuery({ type: ListMembershipEmploymentsQueryDto })
  @ApiResponse({
    status: 200,
    description: 'List of employments retrieved successfully.',
    type: [MembershipEmploymentBasicDto],
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - Admin or Main privilege required.',
  })
  async listEmployments(
    @User() user: Record<string, unknown>,
    @Query() queryDto: ListMembershipEmploymentsQueryDto,
  ) {
    const operationId = `list_employments_${Date.now()}`;
    const privilege = this.getUserPrivilege(user);
    const userRole = this.getUserRole(privilege);
    const userId = (user?.accountId || user?.affiliateId) as string;

    this.logger.log(`Listing employments - Operation: ${operationId}`);

    // Verify user has admin/main privilege
    if (privilege !== Privilege.ADMIN && privilege !== Privilege.MAIN) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: `Access denied. Admin or Main privilege required. Current: ${userRole}`,
        operationId,
        operation: 'listEmployments',
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
      `Successfully listed ${result.data.length} employments (total: ${result.total}) - Operation: ${operationId}`,
    );

    return {
      success: true,
      data: result.data,
      message: 'Employments retrieved successfully',
      metadata: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * GET /private/membership-employment/{id}
   * Get specific employment by ID (Admin/Main only)
   *
   * SECURITY:
   * - Requires ADMIN or MAIN privilege
   * - Can access any user's employment
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get employment by ID (Admin/Main only)',
    description: `
      Returns a specific membership employment by employment ID.
      
      **Access:** Admin and Main only
      
      **Note:** Regular users should use GET /me to access their own employment
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Employment ID (GUID)',
    example: '12345678-1234-1234-1234-123456789012',
  })
  @ApiResponse({
    status: 200,
    description: 'Employment found.',
    type: MembershipEmploymentBasicDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - Admin or Main privilege required.',
  })
  @ApiResponse({
    status: 404,
    description: 'Employment not found.',
  })
  async getEmploymentById(
    @User() user: Record<string, unknown>,
    @Param('id') employmentId: string,
  ) {
    const operationId = `get_employment_${Date.now()}`;
    const privilege = this.getUserPrivilege(user);
    const userRole = this.getUserRole(privilege);

    this.logger.log(
      `Getting employment by ID - Operation: ${operationId}, ID: ${employmentId}`,
    );

    // Verify user has admin/main privilege
    if (privilege !== Privilege.ADMIN && privilege !== Privilege.MAIN) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: `Access denied. Admin or Main privilege required. Current: ${userRole}`,
        operationId,
        operation: 'getEmploymentById',
        userRole,
        requiredPermissions: ['ADMIN', 'MAIN'],
      });
    }

    // Find employment by ID
    const employment =
      await this.lookupService.findByEmploymentId(employmentId);

    return {
      success: true,
      data: employment,
      message: 'Employment retrieved successfully',
    };
  }

  /**
   * PATCH /private/membership-employment/{id}
   * Update specific employment by ID (Admin/Main only)
   *
   * SECURITY:
   * - Requires ADMIN or MAIN privilege
   * - Can update any user's employment
   *
   * BUSINESS LOGIC:
   * - Validates business rules (conditional "_Other" fields)
   * - Partial updates supported
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update employment by ID (Admin/Main only)',
    description: `
      Updates a specific membership employment by employment ID.
      
      **Access:** Admin and Main only
      
      **Business Rules:**
      - "_Other" fields validated when enum value is OTHER
      - Partial updates supported (only provided fields are updated)
      - Cannot change membership year
      
      **Note:** Regular users should use PATCH /me to update their own employment
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Employment ID (GUID)',
    example: '12345678-1234-1234-1234-123456789012',
  })
  @ApiBody({ type: UpdateMembershipEmploymentDto })
  @ApiResponse({
    status: 200,
    description: 'Employment updated successfully.',
    type: MembershipEmploymentBasicDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid employment data or business rule violation.',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - Admin or Main privilege required.',
  })
  @ApiResponse({
    status: 404,
    description: 'Employment not found.',
  })
  async updateEmploymentById(
    @User('userId') userId: string,
    @User() user: Record<string, unknown>,
    @Param('id') employmentId: string,
    @Body() updateDto: UpdateMembershipEmploymentDto,
  ) {
    const operationId = `update_employment_${Date.now()}`;
    const privilege = this.getUserPrivilege(user);
    const userRole = this.getUserRole(privilege);

    this.logger.log(
      `Updating employment by ID - Operation: ${operationId}, ID: ${employmentId}`,
    );

    // Verify user has admin/main privilege
    if (privilege !== Privilege.ADMIN && privilege !== Privilege.MAIN) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: `Access denied. Admin or Main privilege required. Current: ${userRole}`,
        operationId,
        operation: 'updateEmploymentById',
        userRole,
        requiredPermissions: ['ADMIN', 'MAIN'],
      });
    }

    // Validate and update through business rules service
    const updatedEmployment =
      await this.businessRulesService.updateWithValidation(
        employmentId,
        updateDto,
        privilege,
        userId,
        operationId,
      );

    this.logger.log('Employment updated successfully by admin');

    return {
      success: true,
      data: updatedEmployment,
      message: 'Employment updated successfully',
    };
  }

  /**
   * DELETE /private/membership-employment/{id}
   * Delete specific employment by ID (Admin/Main only)
   *
   * SECURITY:
   * - Requires ADMIN or MAIN privilege
   * - Can delete any user's employment
   *
   * BUSINESS LOGIC:
   * - Hard delete operation
   * - Permanent deletion - cannot be undone
   *
   * STATUS: TEMPORARILY DISABLED - Route commented out until deletion permissions are finalized
   */
  // @Delete(':id')
  // @ApiOperation({
  //   summary: 'Delete employment by ID (Admin/Main only)',
  //   description: `
  //     Permanently deletes a specific membership employment by employment ID.
  //
  //     **Access:** Admin and Main only
  //
  //     **Warning:** This is a hard delete operation and cannot be undone.
  //
  //     **Note:** Regular users cannot delete employment records (not even their own)
  //   `,
  // })
  // @ApiParam({
  //   name: 'id',
  //   description: 'Employment ID (GUID)',
  //   example: '12345678-1234-1234-1234-123456789012',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Employment deleted successfully.',
  // })
  // @ApiResponse({
  //   status: 403,
  //   description: 'Access denied - Admin or Main privilege required.',
  // })
  // @ApiResponse({
  //   status: 404,
  //   description: 'Employment not found.',
  // })
  // async deleteEmploymentById(
  //   @User('userId') userId: string,
  //   @User() user: Record<string, unknown>,
  //   @Param('id') employmentId: string,
  // ) {
  //   const operationId = `delete_employment_${Date.now()}`;
  //   const privilege = this.getUserPrivilege(user);
  //   const userRole = this.getUserRole(privilege);

  //   this.logger.log(
  //     `Deleting employment by ID - Operation: ${operationId}, ID: ${employmentId}`,
  //   );

  //   // Verify user has admin/main privilege
  //   if (privilege !== Privilege.ADMIN && privilege !== Privilege.MAIN) {
  //     throw createAppError(ErrorCodes.PERMISSION_DENIED, {
  //       message: `Access denied. Admin or Main privilege required. Current: ${userRole}`,
  //       operationId,
  //       operation: 'deleteEmploymentById',
  //       userRole,
  //       requiredPermissions: ['ADMIN', 'MAIN'],
  //     });
  //   }

  //   // Delete employment through CRUD service
  //   await this.crudService.delete(employmentId, privilege, userId, operationId);

  //   this.logger.log('Employment deleted successfully by admin');

  //   return {
  //     success: true,
  //     message: 'Employment deleted successfully',
  //   };
  // }
}
