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
import { MembershipPreferenceBusinessRulesService } from '../services/membership-preference-business-rules.service';
import { MembershipPreferenceCrudService } from '../services/membership-preference-crud.service';
import { MembershipPreferenceLookupService } from '../services/membership-preference-lookup.service';

// External services for category lookup and year management
import { MembershipCategoryLookupService } from '../../membership-category/services/membership-category-lookup.service';
import { MembershipCategoryMembershipYearService } from '../../membership-category/utils/membership-category-membership-year.util';
import { MembershipCategoryRepositoryService } from '../../membership-category/repositories/membership-category.repository';
import { mapDataverseToInternal as mapCategoryDataverseToInternal } from '../../membership-category/mappers/membership-category.mapper';

// Repository for internal data access
import {
  DataverseMembershipPreferenceRepository,
  MEMBERSHIP_PREFERENCE_REPOSITORY,
} from '../repositories/membership-preference.repository';
import { Inject } from '@nestjs/common';

// DTOs
import { CreateMembershipPreferenceDto } from '../dtos/membership-preference-create.dto';
import { UpdateMembershipPreferenceDto } from '../dtos/membership-preference-update.dto';
import { MembershipPreferenceResponseDto } from '../dtos/membership-preference-response.dto';
import { ListMembershipPreferencesQueryDto } from '../dtos/list-membership-preferences.query.dto';

// Utils
import { UserGuidResolverUtil } from '../utils/user-guid-resolver.util';

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
 * Internal DTO type for complete preference creation
 * Used internally by controller to build complete DTO with system fields
 */
interface CompleteMembershipPreferenceDto
  extends CreateMembershipPreferenceDto {
  osot_membership_year: string;
  'osot_Table_Membership_Category@odata.bind'?: string;
  'osot_Table_Account@odata.bind'?: string;
  'osot_Table_Account_Affiliate@odata.bind'?: string;
  osot_privilege?: Privilege;
  osot_access_modifiers?: AccessModifier;
  osot_members_search_tools?: any[];
}

/**
 * Membership Preferences Private Controller
 *
 * HANDLES AUTHENTICATED ROUTES for membership preferences management with self-service operations.
 * All routes require JWT authentication and proper user context.
 *
 * USER SELF-MANAGEMENT OPERATIONS:
 * - POST /private/membership-preferences/me → Create my preference for current year
 * - GET /private/membership-preferences/me → Get my preference for current year
 * - PATCH /private/membership-preferences/me → Update my preference for current year
 *
 * ADMIN OPERATIONS (Admin & Main only):
 * - GET /private/membership-preferences → List all preferences with filtering
 * - GET /private/membership-preferences/{id} → Get specific preference by ID
 * - PATCH /private/membership-preferences/{id} → Update specific preference by ID
 *
 * BUSINESS LOGIC INTEGRATION:
 * - Automatic category determination from membership-category records
 * - Category-based field validation through MembershipPreferenceBusinessRulesService
 * - One preference per user per year (enforced at service layer)
 * - Field availability validation based on membership category
 * - Search tools validation based on category-specific allowed options
 *
 * SECURITY ARCHITECTURE:
 * - JWT authentication required on all routes (@UseGuards(AuthGuard('jwt')))
 * - User context extraction from JWT payload
 * - OWNER: Can only access their own preferences
 * - ADMIN/MAIN: Can access and manage all preferences
 * - Comprehensive logging with security-aware PII redaction
 * - Business rule validation through MembershipPreferenceBusinessRulesService
 *
 * ANNUAL PREFERENCE WORKFLOW:
 * 1. User creates preference for current year (auto-determined)
 * 2. System validates category from membership-category records
 * 3. System validates field availability based on category
 * 4. User can update preference anytime during the year
 * 5. GET /me always returns preference for current active year
 *
 * @follows REST API Standards, OpenAPI Specification
 * @integrates MembershipPreferenceBusinessRulesService for complete business logic
 * @integrates MembershipPreferenceCrudService for data operations
 * @integrates MembershipCategoryLookupService for category determination
 * @author OSOT Development Team
 * @version 1.0.0 - Membership Preferences Implementation
 */
@Controller('private/membership-preferences')
@ApiTags('Private Membership Preferences Operations')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
export class MembershipPreferencePrivateController {
  private readonly logger = new Logger(
    MembershipPreferencePrivateController.name,
  );

  constructor(
    private readonly businessRulesService: MembershipPreferenceBusinessRulesService,
    private readonly crudService: MembershipPreferenceCrudService,
    private readonly lookupService: MembershipPreferenceLookupService,
    private readonly membershipCategoryLookupService: MembershipCategoryLookupService,
    private readonly membershipYearService: MembershipCategoryMembershipYearService,
    private readonly userGuidResolver: UserGuidResolverUtil,
    private readonly membershipCategoryRepository: MembershipCategoryRepositoryService,
    @Inject(MEMBERSHIP_PREFERENCE_REPOSITORY)
    private readonly repository: DataverseMembershipPreferenceRepository,
  ) {
    this.logger.log(
      'Membership Preferences Private Controller initialized successfully',
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

  /**
   * Get category from user's membership-category record for current year
   * Uses repository directly to get Internal type with enum value
   * @private
   */
  private async getUserCategory(
    userId: string,
    userType: 'account' | 'affiliate',
    membershipYear: string,
    _operationId?: string,
  ): Promise<number> {
    try {
      // Use repository to get Dataverse entities
      const userCategories = await this.membershipCategoryRepository.findByUser(
        userId,
        userType,
      );

      if (!userCategories || userCategories.length === 0) {
        this.logger.warn(
          `No category found for user ${userId}, year ${membershipYear} - Using default category OT_PR`,
        );
        return 1; // Category.OT_PR as fallback
      }

      // Filter by membership year
      const categoryForYear = userCategories.find(
        (cat) => cat.osot_membership_year === membershipYear,
      );

      if (!categoryForYear) {
        this.logger.warn(
          `No category found for user ${userId}, year ${membershipYear} - Using default category OT_PR`,
        );
        return 1; // Category.OT_PR as fallback
      }

      // Map to Internal type to get enum value
      const categoryInternal = mapCategoryDataverseToInternal(categoryForYear);
      return categoryInternal.osot_membership_category ?? 1; // Default to OT_PR if undefined
    } catch (error) {
      this.logger.error(
        `Error getting category for user ${userId}, year ${membershipYear}:`,
        error,
      );
      // Return fallback category on error
      return 1; // Category.OT_PR
    }
  }

  // ========================================
  // USER SELF-MANAGEMENT ROUTES (/me)
  // ========================================

  /**
   * POST /private/membership-preferences/me
   * Create membership preference for authenticated user for current year
   *
   * BUSINESS LOGIC:
   * - Automatically determines membership year (current year)
   * - Fetches user's category from membership-category records
   * - Validates field availability based on category
   * - Enforces one preference per user per year
   * - Validates business rules for category-specific fields
   *
   * SECURITY:
   * - User can only create their own preferences
   * - Requires OWNER, ADMIN, or MAIN privilege
   */
  @Post('me')
  @ApiOperation({
    summary: 'Create my membership preference',
    description: `
      Creates a membership preference record for the authenticated user for the current active membership year.
      
      **System-Determined Fields (not provided by user):**
      - Membership Year: Automatically determined from active membership-settings
      - Category: Looked up from user's membership-category record
      - Account/Affiliate Reference: Extracted from JWT token
      
      **User-Provided Fields:**
      - Auto Renewal: Required boolean for next year renewal preference
      - Third Parties: Optional multi-select for contact sharing
      - Practice Promotion: Optional multi-select (category-dependent: OT_LIFE, OT_NG, OT_PR)
      - Search Tools: Optional multi-select (category-dependent: 5-tier matrix)
      - Psychotherapy Supervision: Optional multi-select (category-dependent: OT_LIFE, OT_PR)
      - Shadowing: Optional boolean (category-dependent: OT categories only)
      
      **Business Rules:**
      - Only one preference per user per year
      - Field availability validated based on membership category
      - Search tools validated based on category-specific allowed options
      - Invalid field combinations rejected with descriptive errors
    `,
  })
  @ApiBody({ type: CreateMembershipPreferenceDto })
  @ApiResponse({
    status: 201,
    description: 'Membership preference created successfully.',
    type: MembershipPreferenceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid preference data or business rule violation.',
  })
  @ApiResponse({
    status: 409,
    description: 'Preference already exists for this year.',
  })
  async createMyPreference(
    @User('userId') userId: string,
    @User() user: Record<string, unknown>,
    @Body() createDto: CreateMembershipPreferenceDto,
  ) {
    const operationId = `create_my_preference_${Date.now()}`;
    const privilege = this.getUserPrivilege(user);
    const userRole = this.getUserRole(privilege);
    const userType = this.getUserType(user);

    this.logger.log(
      `Creating preference for user - Operation: ${operationId}`,
      {
        operation: 'createMyPreference',
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
        message: `Insufficient permissions to create preference. Required: OWNER, ADMIN, or MAIN. Current: ${userRole}`,
        operationId,
        operation: 'createMyPreference',
        userRole,
      });
    }

    // Determine current membership year
    const organizationGuid = decryptOrganizationId(
      (user as unknown as JwtPayload).organizationId,
    );
    const membershipYear =
      await this.getCurrentMembershipYear(organizationGuid);

    // Get user's category for business rule validation
    const categoryRecord = await this.getUserCategory(
      userId,
      userType,
      membershipYear,
      operationId,
    );

    // Get user GUID and category GUID for OData binds
    const userGuid = await this.userGuidResolver.resolveUserGuid(
      userId,
      userType,
    );

    // Get category GUID from repository (Dataverse raw format includes GUID)
    // Note: We already have categoryRecord for validation, but it's ResponseDto without GUID
    // So we need to fetch from repository again to get the Dataverse format with GUID
    const categoryDataverseRecords = await this.membershipCategoryLookupService[
      'repository'
    ].findByUser(userId, userType);

    const categoryDataverseRecord = categoryDataverseRecords?.find(
      (cat) => cat.osot_membership_year === membershipYear,
    );

    if (!categoryDataverseRecord?.osot_table_membership_categoryid) {
      throw createAppError(ErrorCodes.NOT_FOUND, {
        message: `No category GUID found for user in year ${membershipYear}`,
        operationId,
        userId,
        membershipYear,
      });
    }

    const categoryGuid: string =
      categoryDataverseRecord.osot_table_membership_categoryid;

    // Build complete DTO with system-determined fields including OData binds
    const completeDto: CompleteMembershipPreferenceDto = {
      ...createDto,
      osot_membership_year: membershipYear,
      osot_members_search_tools: createDto.osot_search_tools,
      // Add category OData bind
      'osot_Table_Membership_Category@odata.bind': `/osot_table_membership_categories(${categoryGuid})`,
      // Add user OData bind based on type
      ...(userType === 'account'
        ? {
            'osot_Table_Account@odata.bind': `/osot_table_accounts(${userGuid})`,
          }
        : {
            'osot_Table_Account_Affiliate@odata.bind': `/osot_table_account_affiliates(${userGuid})`,
          }),
    } as CompleteMembershipPreferenceDto;

    // Validate business rules before creation
    this.businessRulesService.validateCreateDto(createDto, categoryRecord);

    // Create preference through CRUD service
    const preference = await this.crudService.create(
      completeDto,
      privilege,
      userId,
      operationId,
    );

    this.logger.log('Preference created successfully for current year');

    return {
      success: true,
      data: preference,
      message: 'Membership preference created successfully',
    };
  }

  /**
   * GET /private/membership-preferences/me
   * Get authenticated user's preference for current year
   *
   * BUSINESS LOGIC:
   * - Returns preference for current active year only
   * - Returns 404 if no preference exists for current year
   *
   * SECURITY:
   * - User can only read their own preferences
   */
  @Get('me')
  @ApiOperation({
    summary: 'Get my membership preference',
    description: `
      Returns the membership preference record for the authenticated user for the current active year.
      
      **Returns only preference-related fields:**
      - Membership year
      - Auto renewal setting
      - Third parties communication preferences
      - Practice promotion preferences
      - Search tools visibility preferences
      - Psychotherapy supervision types
      - Shadowing acceptance
      
      **Note:** System fields, lookups, and metadata are excluded from this endpoint.
      For complete preference data, use the admin route GET /{id}
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Preference found.',
    type: MembershipPreferenceResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Preference not found for current year.',
  })
  async getMyPreference(
    @User('userId') userId: string,
    @User() user: Record<string, unknown>,
  ): Promise<{
    success: boolean;
    data: MembershipPreferenceResponseDto;
    message: string;
  }> {
    const operationId = `get_my_preference_${Date.now()}`;
    const privilege = this.getUserPrivilege(user);
    const userRole = this.getUserRole(privilege);
    const userType = this.getUserType(user);

    // Verify user has permission to read
    if (!canRead(userRole)) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: `Insufficient permissions to read preference. Required: OWNER, ADMIN, or MAIN. Current: ${userRole}`,
        operationId,
        operation: 'getMyPreference',
        userRole,
      });
    }

    // Determine current membership year
    const organizationGuid = decryptOrganizationId(
      (user as unknown as JwtPayload).organizationId,
    );
    const membershipYear =
      await this.getCurrentMembershipYear(organizationGuid);

    // Find preference by user ID and year
    const preference = await this.lookupService.findByUserAndYear(
      userId,
      membershipYear,
      userType,
      privilege,
      userId,
      operationId,
    );

    if (!preference) {
      throw createAppError(ErrorCodes.NOT_FOUND, {
        message: `No preference found for year ${membershipYear}`,
        operationId,
        userId,
        membershipYear,
      });
    }

    // Response already in simplified format from mapper (7 fields only)
    return {
      success: true,
      data: preference,
      message: 'Membership preference retrieved successfully',
    };
  }

  /**
   * PATCH /private/membership-preferences/me
   * Update authenticated user's preference for current year
   *
   * BUSINESS LOGIC:
   * - Updates preference for current year only
   * - Validates business rules based on category
   * - Partial updates supported (only provided fields updated)
   *
   * SECURITY:
   * - User can only update their own preferences
   */
  @Patch('me')
  @ApiOperation({
    summary: 'Update my membership preference',
    description: `
      Updates the membership preference record for the authenticated user for the current year.
      
      **Business Rules:**
      - Field availability validated based on membership category
      - Search tools validated based on category-specific allowed options
      - Partial updates supported (only provided fields are updated)
      
      **Note:** Cannot change membership year via this route
    `,
  })
  @ApiBody({ type: UpdateMembershipPreferenceDto })
  @ApiResponse({
    status: 200,
    description: 'Preference updated successfully.',
    type: MembershipPreferenceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid preference data or business rule violation.',
  })
  @ApiResponse({
    status: 404,
    description: 'Preference not found for current year.',
  })
  async updateMyPreference(
    @User('userId') userId: string,
    @User() user: Record<string, unknown>,
    @Body() updateDto: UpdateMembershipPreferenceDto,
  ) {
    const operationId = `update_my_preference_${Date.now()}`;
    const privilege = this.getUserPrivilege(user);
    const userRole = this.getUserRole(privilege);
    const userType = this.getUserType(user);

    this.logger.log(`Updating preference for user - Operation: ${operationId}`);

    // Verify user has permission to update
    if (!canWrite(userRole)) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: `Insufficient permissions to update preference. Required: OWNER, ADMIN, or MAIN. Current: ${userRole}`,
        operationId,
        operation: 'updateMyPreference',
        userRole,
      });
    }

    // Determine current membership year
    const organizationGuid = decryptOrganizationId(
      (user as unknown as JwtPayload).organizationId,
    );
    const membershipYear =
      await this.getCurrentMembershipYear(organizationGuid);

    // Find preference by user ID and year (Internal with ID)
    const preferenceInternal = await this.repository.findByUserAndYear(
      userId,
      membershipYear,
      userType,
    );

    if (!preferenceInternal) {
      throw createAppError(ErrorCodes.NOT_FOUND, {
        message: `No preference found for year ${membershipYear}`,
        operationId,
        userId,
        membershipYear,
      });
    }

    // Get user's category for business rule validation
    const category = await this.getUserCategory(
      userId,
      userType,
      membershipYear,
      operationId,
    );

    // Validate business rules before update
    this.businessRulesService.validateUpdateDto(updateDto, category);

    // Update preference through CRUD service using the preference ID
    const updatedPreference = await this.crudService.update(
      preferenceInternal.osot_preference_id,
      updateDto,
      privilege,
      userId,
      operationId,
    );

    this.logger.log('Preference updated successfully for current year');

    return {
      success: true,
      data: updatedPreference,
      message: 'Membership preference updated successfully',
    };
  }

  // ========================================
  // ADMIN OPERATIONS (Admin & Main only)
  // ========================================

  /**
   * GET /private/membership-preferences
   * List all membership preferences with filtering (Admin/Main only)
   *
   * SECURITY:
   * - Requires ADMIN or MAIN privilege
   * - Returns all preferences across all users
   *
   * FILTERING:
   * - Filter by year, category, account, affiliate
   * - Filter by specific preference values
   * - Pagination support
   */
  @Get()
  @ApiOperation({
    summary: 'List all membership preferences (Admin/Main only)',
    description: `
      Returns a list of all membership preferences with optional filtering.
      
      **Access:** Admin and Main only
      
      **Filtering Options:**
      - membershipYear: Filter by year (e.g., "2025")
      - membershipCategoryId: Filter by category GUID
      - accountId: Filter by account GUID
      - affiliateId: Filter by affiliate GUID
      - Plus additional preference-specific filters
      
      **Pagination:**
      - page: Page number (default: 1)
      - pageSize: Results per page (default: 50, max: 100)
    `,
  })
  @ApiQuery({ type: ListMembershipPreferencesQueryDto })
  @ApiResponse({
    status: 200,
    description: 'List of preferences retrieved successfully.',
    type: [MembershipPreferenceResponseDto],
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - Admin or Main privilege required.',
  })
  async listPreferences(
    @User() user: Record<string, unknown>,
    @Query() queryDto: ListMembershipPreferencesQueryDto,
  ) {
    const operationId = `list_preferences_${Date.now()}`;
    const privilege = this.getUserPrivilege(user);
    const userRole = this.getUserRole(privilege);
    const userId = (user?.accountId || user?.affiliateId) as string;

    this.logger.log(`Listing preferences - Operation: ${operationId}`);

    // Verify user has admin/main privilege
    if (privilege !== Privilege.ADMIN && privilege !== Privilege.MAIN) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: `Access denied. Admin or Main privilege required. Current: ${userRole}`,
        operationId,
        operation: 'listPreferences',
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
      `Successfully listed ${result.data.length} preferences (total: ${result.total}) - Operation: ${operationId}`,
    );

    return {
      success: true,
      data: result.data,
      message: 'Preferences retrieved successfully',
      metadata: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * GET /private/membership-preferences/{id}
   * Get specific preference by ID (Admin/Main only)
   *
   * SECURITY:
   * - Requires ADMIN or MAIN privilege
   * - Can access any user's preference
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get preference by ID (Admin/Main only)',
    description: `
      Returns a specific membership preference by preference ID.
      
      **Access:** Admin and Main only
      
      **Note:** Regular users should use GET /me to access their own preferences
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Preference ID (business ID: osot-pref-NNNNNNN)',
    example: 'osot-pref-0000001',
  })
  @ApiResponse({
    status: 200,
    description: 'Preference found.',
    type: MembershipPreferenceResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - Admin or Main privilege required.',
  })
  @ApiResponse({
    status: 404,
    description: 'Preference not found.',
  })
  async getPreferenceById(
    @User() user: Record<string, unknown>,
    @Param('id') preferenceId: string,
  ) {
    const operationId = `get_preference_${Date.now()}`;
    const privilege = this.getUserPrivilege(user);
    const userRole = this.getUserRole(privilege);

    this.logger.log(
      `Getting preference by ID - Operation: ${operationId}, ID: ${preferenceId}`,
    );

    // Verify user has admin/main privilege
    if (privilege !== Privilege.ADMIN && privilege !== Privilege.MAIN) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: `Access denied. Admin or Main privilege required. Current: ${userRole}`,
        operationId,
        operation: 'getPreferenceById',
        userRole,
        requiredPermissions: ['ADMIN', 'MAIN'],
      });
    }

    // Find preference by ID
    const preference =
      await this.lookupService.findByPreferenceId(preferenceId);

    return {
      success: true,
      data: preference,
      message: 'Preference retrieved successfully',
    };
  }

  /**
   * PATCH /private/membership-preferences/{id}
   * Update specific preference by ID (Admin/Main only)
   *
   * SECURITY:
   * - Requires ADMIN or MAIN privilege
   * - Can update any user's preference
   *
   * BUSINESS LOGIC:
   * - Validates business rules based on user's category
   * - Partial updates supported
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update preference by ID (Admin/Main only)',
    description: `
      Updates a specific membership preference by preference ID.
      
      **Access:** Admin and Main only
      
      **Business Rules:**
      - Field availability validated based on user's membership category
      - Search tools validated based on category-specific allowed options
      - Partial updates supported (only provided fields are updated)
      
      **Note:** Regular users should use PATCH /me to update their own preferences
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Preference ID (business ID: osot-pref-NNNNNNN)',
    example: 'osot-pref-0000001',
  })
  @ApiBody({ type: UpdateMembershipPreferenceDto })
  @ApiResponse({
    status: 200,
    description: 'Preference updated successfully.',
    type: MembershipPreferenceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid preference data or business rule violation.',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - Admin or Main privilege required.',
  })
  @ApiResponse({
    status: 404,
    description: 'Preference not found.',
  })
  async updatePreferenceById(
    @User('userId') userId: string,
    @User() user: Record<string, unknown>,
    @Param('id') preferenceId: string,
    @Body() updateDto: UpdateMembershipPreferenceDto,
  ) {
    const operationId = `update_preference_${Date.now()}`;
    const privilege = this.getUserPrivilege(user);
    const userRole = this.getUserRole(privilege);

    this.logger.log(
      `Updating preference by ID - Operation: ${operationId}, ID: ${preferenceId}`,
    );

    // Verify user has admin/main privilege
    if (privilege !== Privilege.ADMIN && privilege !== Privilege.MAIN) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: `Access denied. Admin or Main privilege required. Current: ${userRole}`,
        operationId,
        operation: 'updatePreferenceById',
        userRole,
        requiredPermissions: ['ADMIN', 'MAIN'],
      });
    }

    // Find existing preference to get category for validation (use repository for Internal)
    const existingPreferenceInternal =
      await this.repository.findById(preferenceId);

    if (!existingPreferenceInternal) {
      throw createAppError(ErrorCodes.NOT_FOUND, {
        message: 'Preference not found',
        operationId,
        preferenceId,
      });
    }

    // Get category GUID from existing preference's linked category record
    const categoryGuid =
      existingPreferenceInternal.osot_table_membership_category;
    if (!categoryGuid) {
      throw createAppError(ErrorCodes.NOT_FOUND, {
        message: 'Preference has no linked category',
        operationId,
        preferenceId,
      });
    }

    // Get category from repository and map to Internal type to get enum value
    const categoryDataverse =
      await this.membershipCategoryRepository.findByCategoryId(categoryGuid);

    if (!categoryDataverse) {
      throw createAppError(ErrorCodes.NOT_FOUND, {
        message: `Category not found: ${categoryGuid}`,
        operationId,
        preferenceId,
      });
    }

    const categoryInternal = mapCategoryDataverseToInternal(categoryDataverse);
    const category = categoryInternal.osot_membership_category;

    if (!category) {
      throw createAppError(ErrorCodes.VALIDATION_ERROR, {
        message: `Category ${categoryGuid} is missing osot_membership_category field`,
        operationId,
        preferenceId,
      });
    }

    // Validate business rules before update using category enum value
    this.businessRulesService.validateUpdateDto(updateDto, category);

    // Update preference through CRUD service
    const updatedPreference = await this.crudService.update(
      preferenceId,
      updateDto,
      privilege,
      userId,
      operationId,
    );

    this.logger.log('Preference updated successfully by admin');

    return {
      success: true,
      data: updatedPreference,
      message: 'Preference updated successfully',
    };
  }
}
