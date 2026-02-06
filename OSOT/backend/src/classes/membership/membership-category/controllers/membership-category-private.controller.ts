import { Controller, Get, Post, Body, UseGuards, Logger } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../../../../utils/user.decorator';
import { decryptOrganizationId } from '../../../../utils/organization-crypto.util';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { Privilege } from '../../../../common/enums';
import { canCreate, canRead } from '../../../../utils/dataverse-app.helper';

// Services
import { MembershipCategoryBusinessRuleService } from '../services/membership-category-business-rule.service';
import { MembershipCategoryCrudService } from '../services/membership-category-crud.service';
import { MembershipCategoryLookupService } from '../services/membership-category-lookup.service';
import { MembershipCategoryRepositoryService } from '../repositories/membership-category.repository';
import { MembershipCategoryMembershipYearService } from '../utils/membership-category-membership-year.util';

// Mappers
import {
  mapDataverseToInternal,
  mapInternalToResponse,
} from '../mappers/membership-category.mapper';

// DTOs
import { MembershipCategoryRegistrationDto } from '../dtos/membership-category-registration.dto';
import { MembershipCategoryCreateDto } from '../dtos/membership-category-create.dto';
import { MembershipCategoryResponseDto } from '../dtos/membership-category-response.dto';

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
 * Membership Category Private Controller
 *
 * HANDLES AUTHENTICATED ROUTES for membership category management with self-service operations.
 * All routes require JWT authentication and operate on the authenticated user's data.
 *
 * USER SELF-MANAGEMENT OPERATIONS:
 * - POST /private/membership-categories/me → Create/register membership category for current user
 * - GET /private/membership-categories/me → Get my membership category records
 *
 * BUSINESS LOGIC INTEGRATION:
 * - Automatic User Group determination (Step 1) based on authenticated user's account data
 * - Eligibility validation (Step 2) for user-provided eligibility choices
 * - Membership Category calculation (Step 3) using complete business rules
 * - Required date fields validation (parental leave, retirement)
 * - Cross-entity data validation (Account, OT Education, OTA Education)
 *
 * SECURITY ARCHITECTURE:
 * - JWT authentication required on all routes (@UseGuards(AuthGuard('jwt')))
 * - User context extraction from JWT payload
 * - User can only access their own membership category data
 * - Comprehensive logging with security-aware PII redaction
 * - Business rule validation through MembershipCategoryBusinessRuleService
 *
 * THREE-STEP MEMBERSHIP CATEGORY PROCESS:
 * 1. User Group Determination: Account Group + Education Category → User Group (automatic)
 * 2. Eligibility Options: User provides eligibility choice if required by user group
 * 3. Category Calculation: User Group + Eligibility → Final Membership Category (automatic)
 *
 * REGISTRATION FLOW:
 * - System determines user group automatically from account and education data
 * - User selects eligibility option (if required)
 * - User provides additional date fields (if required by eligibility)
 * - System calculates final membership category
 * - System validates all business rules and creates record
 *
 * @follows REST API Standards, OpenAPI Specification
 * @integrates MembershipCategoryBusinessRuleService for complete business logic
 * @integrates MembershipCategoryCrudService for data operations
 * @author OSOT Development Team
 * @version 1.0.0 - Membership Category Implementation
 */
@Controller('private/membership-categories')
@ApiTags('Private Membership Category Operations')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
export class MembershipCategoryPrivateController {
  private readonly logger = new Logger(
    MembershipCategoryPrivateController.name,
  );

  constructor(
    private readonly membershipCategoryBusinessRuleService: MembershipCategoryBusinessRuleService,
    private readonly membershipCategoryCrudService: MembershipCategoryCrudService,
    private readonly membershipCategoryLookupService: MembershipCategoryLookupService,
    private readonly membershipCategoryRepository: MembershipCategoryRepositoryService,
    private readonly membershipYearService: MembershipCategoryMembershipYearService,
  ) {
    this.logger.log(
      'Membership Category Private Controller initialized successfully',
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
    // SECURITY: Always use the userType from JWT token (set during authentication)
    // This is the authoritative source and prevents tampering
    const userType = user?.userType as string;

    if (userType === 'affiliate') {
      return 'affiliate';
    } else if (userType === 'account') {
      return 'account';
    } else {
      // Default to account for backward compatibility, but log the issue
      this.logger.warn(
        `Unknown userType in JWT: ${userType}, defaulting to account`,
      );
      return 'account';
    }
  }

  /**
   * Convert business ID to GUID for correct Dataverse lookup
   * Uses existing business rule service to fetch the correct GUID
   * @private
   */
  private async getUserGuidFromBusinessId(
    businessId: string,
    userType: 'account' | 'affiliate',
  ): Promise<string> {
    try {
      // Use the business rule service to collect user data, which includes GUID
      const userData =
        await this.membershipCategoryBusinessRuleService.collectUserCreationData(
          businessId,
          userType,
        );

      if (!userData) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: `${userType === 'account' ? 'Account' : 'Affiliate'} not found with business ID: ${businessId}`,
        });
      }

      // Return the GUID from the collected data
      return userData.userGuid;
    } catch (error) {
      this.logger.error(
        `Failed to get GUID for ${userType} with business ID ${businessId}`,
        error as Error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: `Failed to retrieve ${userType} GUID`,
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ========================================
  // MEMBERSHIP CATEGORY REGISTRATION
  // ========================================

  /**
   * Create/register membership category for current user
   *
   * Implements the complete three-step membership category determination process:
   * 1. Auto-determine User Group from authenticated user's account/education data
   * 2. Validate user-provided eligibility choice (if required)
   * 3. Calculate final membership category and create record
   *
   * @param userId - User ID from JWT payload
   * @param user - Full user object from JWT payload
   * @param registrationDto - Membership category registration data
   * @returns Promise<MembershipCategoryResponseDto>
   */
  @Post('me')
  @ApiOperation({
    summary: 'Register membership category for current user',
    description: `
      Creates a new membership category record for the authenticated user using the three-step process:
      
      **Step 1 (Automatic):** System determines User Group based on:
      - Account Group from user's account record
      - Education Category from user's education records (OT/OTA)
      
      **Step 2 (User Input):** User provides eligibility choice:
      - Required for OT and OTA user groups
      - Not required for Student, Vendor, Other groups
      - Affiliate users use separate eligibility field
      
      **Step 3 (Automatic):** System calculates final Membership Category:
      - Direct mapping for student/vendor groups
      - Eligibility-based mapping for OT/OTA groups
      - Special handling for parental leave and retirement eligibilities
      
      **Required Fields by User Group:**
      - All: membership_declaration (must be true)
      - OT/OTA: eligibility choice from available options
      - Affiliate: eligibility_affiliate (1=Primary, 2=Premium)
      - Parental Leave (eligibility 6): parental_leave_from, parental_leave_to
      - Retirement (eligibility 5): retirement_start
      
      **Automatic Fields (populated by backend):**
      - osot_membership_year: Determined from active membership settings
    `,
  })
  @ApiBody({ type: MembershipCategoryRegistrationDto })
  @ApiResponse({
    status: 201,
    description: 'Membership category registered successfully.',
    type: MembershipCategoryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid registration data or business rule violation.',
  })
  @ApiResponse({
    status: 409,
    description: 'Membership category already exists for this year.',
  })
  async registerMembershipCategory(
    @User('userId') userId: string,
    @User() user: Record<string, unknown>,
    @Body() registrationDto: MembershipCategoryRegistrationDto,
  ) {
    const operationId = `register_membership_category_${Date.now()}`;
    const privilege = this.getUserPrivilege(user);
    const userRole = this.getUserRole(privilege);
    const userType = this.getUserType(user);

    // DEBUG: Log complete JWT payload and request body
    this.logger.debug(`[MEMBERSHIP_CATEGORY_REGISTER] JWT Payload received`, {
      userId,
      userEmail: user?.email,
      userType,
      privilege,
      userRole,
      fullUser: user,
    });

    this.logger.debug(`[MEMBERSHIP_CATEGORY_REGISTER] Request Body received`, {
      registrationDto,
      hasEligibility: !!registrationDto.osot_eligibility,
      eligibilityValue: registrationDto.osot_eligibility,
      hasAffiliateEligibility: !!registrationDto.osot_eligibility_affiliate,
      affiliateEligibilityValue: registrationDto.osot_eligibility_affiliate,
    });

    // Verify user has permission to create membership categories
    if (!canCreate(userRole)) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: `Insufficient permissions to create membership category. Required: OWNER, ADMIN, or MAIN. Current: ${userRole}`,
        operationId,
        operation: 'registerMembershipCategory',
        userRole,
        requiredPermissions: ['OWNER', 'ADMIN', 'MAIN'],
      });
    }

    // Step 1: Determine current membership year automatically
    const organizationGuid = decryptOrganizationId(
      (user as unknown as JwtPayload).organizationId,
    );
    const membershipYear =
      await this.membershipYearService.getCurrentMembershipYear(
        organizationGuid,
      );

    this.logger.log(
      `Registering membership category for user - Operation: ${operationId}`,
      {
        operation: 'registerMembershipCategory',
        operationId,
        userId: userId?.substring(0, 8) + '...', // PII redaction
        userType,
        privilege,
        membershipYear,
        hasEligibility: !!registrationDto.osot_eligibility,
        hasAffiliateEligibility: !!registrationDto.osot_eligibility_affiliate,
        timestamp: new Date().toISOString(),
      },
    );

    try {
      // Step 1.5: Convert business ID to GUID early for validation
      const userGuid = await this.getUserGuidFromBusinessId(userId, userType);

      // Step 1.6: PREVENTIVE CHECK - Verify uniqueness BEFORE processing
      // Business Rule: One membership category per user per year
      const exists =
        await this.membershipCategoryBusinessRuleService.checkMembershipCategoryExists(
          userGuid,
          userType,
          membershipYear,
        );

      if (exists) {
        this.logger.warn(
          `Membership category already exists for user in year ${membershipYear} - Operation: ${operationId}`,
          {
            operation: 'registerMembershipCategory',
            operationId,
            userId: userId?.substring(0, 8) + '...',
            userType,
            membershipYear,
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.CONFLICT, {
          message: `Membership category already exists for this user in year ${membershipYear}`,
          operationId,
          operation: 'registerMembershipCategory',
          details: {
            userType,
            membershipYear,
            reason: 'Business rule: One membership category per user per year',
          },
        });
      }

      // Step 2: Run complete membership category determination with validation
      // Create temporary object with membership year for validation
      const dtoWithYear = {
        ...registrationDto,
        osot_membership_year: membershipYear,
      };

      const membershipResult =
        await this.membershipCategoryBusinessRuleService.determineMembershipCategoryComplete(
          userId,
          userType,
          registrationDto.osot_eligibility,
          registrationDto.osot_eligibility_affiliate,
          dtoWithYear as MembershipCategoryCreateDto, // Pass DTO with year for validation
        );

      // Check if validation passed
      if (!membershipResult.validation.isValid) {
        const validationErrors = Array.isArray(
          membershipResult.validation.errors,
        )
          ? membershipResult.validation.errors
          : ['Validation failed'];

        this.logger.warn(
          `Membership category registration validation failed - Operation: ${operationId}`,
          {
            operation: 'registerMembershipCategory',
            operationId,
            userId: userId?.substring(0, 8) + '...',
            validationErrors,
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'Membership category registration validation failed',
          operationId,
          operation: 'registerMembershipCategory',
          validationErrors,
        });
      }

      // Step 3: Create the membership category record with auto-determined year
      const membershipCategoryData: MembershipCategoryCreateDto = {
        ...registrationDto,
        osot_membership_year: membershipYear, // Automatically determined
        osot_membership_category: membershipResult.membershipCategory,
        osot_users_group: membershipResult.userGroup,
        // Set user reference based on type using OData bind format with CORRECT GUID
        ...(userType === 'account'
          ? {
              'osot_Table_Account@odata.bind': `/osot_table_accounts(${userGuid})`,
            }
          : {
              'osot_Table_Account_Affiliate@odata.bind': `/osot_table_account_affiliates(${userGuid})`,
            }),
      } as MembershipCategoryCreateDto;

      const createdRecord: MembershipCategoryResponseDto =
        await this.membershipCategoryCrudService.create(
          membershipCategoryData,
          privilege,
        );

      this.logger.log(
        `Membership category registered successfully - Operation: ${operationId}`,
        {
          operation: 'registerMembershipCategory',
          operationId,
          membershipCategoryId:
            createdRecord?.osot_table_membership_categoryid || 'unknown',
          userGroup: membershipResult.userGroup,
          membershipCategory: membershipResult.membershipCategory,
          timestamp: new Date().toISOString(),
        },
      );

      return {
        success: true,
        data: createdRecord || {},
        message: 'Membership category registered successfully',
        membershipProcess: {
          userGroup: membershipResult.userGroup,
          membershipCategory: membershipResult.membershipCategory,
          requiresEligibility: membershipResult.requiresEligibility,
          requiredDateFields: membershipResult.requiresDateFields,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Register membership category failed - Operation: ${operationId}`,
        {
          operation: 'registerMembershipCategory',
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
        message: 'Failed to register membership category',
        operationId,
        operation: 'registerMembershipCategory',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ========================================
  // MEMBERSHIP CATEGORY RETRIEVAL
  // ========================================

  /**
   * Get available parental leave expected options for current user
   *
   * Returns which parental leave options (FULL_YEAR, SIX_MONTHS) are still available
   * for the authenticated user based on their usage history.
   *
   * **BUSINESS RULES:**
   * - Only available for Account users (NOT affiliates)
   * - Each option can only be used ONCE in user's lifetime
   * - Returns both available and used options
   *
   * **USE CASE:**
   * Frontend calls this before displaying the parental leave form to:
   * - Show/hide options based on availability
   * - Disable already-used options
   * - Display helpful messages about option usage
   *
   * @param userId - User ID from JWT payload
   * @param user - Full user object from JWT payload
   * @returns Object with available and used parental leave options
   */
  @Get('me/parental-leave-options')
  @ApiOperation({
    summary: 'Get available parental leave expected options',
    description: `
      Returns available parental leave expected options for the authenticated user.
      
      **Returns:**
      - \`available\`: Array of option values still available (e.g., [1, 2] or [2] or [])
      - \`used\`: Array of option values already used (e.g., [] or [1] or [1, 2])
      
      **Option Values:**
      - 1 = FULL_YEAR (12 months parental leave)
      - 2 = SIX_MONTHS (6 months parental leave)
      
      **Business Context:**
      - Each option can only be used ONCE for insurance coverage purposes
      - NOT available for Affiliate users (companies don't take parental leave)
      - Only applicable when eligibility = 6 (On Parental Leave)
      
      **Frontend Integration:**
      Use this endpoint to pre-validate form options before user submission.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Parental leave options retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            available: {
              type: 'array',
              items: { type: 'number' },
              example: [2],
              description: 'Options still available for use',
            },
            used: {
              type: 'array',
              items: { type: 'number' },
              example: [1],
              description: 'Options already used in history',
            },
          },
        },
        message: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required.',
  })
  async getMyParentalLeaveOptions(
    @User('userId') userId: string,
    @User() user: Record<string, unknown>,
  ) {
    const operationId = `get_parental_leave_options_${Date.now()}`;
    const userType = this.getUserType(user);

    this.logger.log(
      `Getting parental leave options for user ${userId}, type ${userType} - Operation: ${operationId}`,
    );

    try {
      const options =
        await this.membershipCategoryLookupService.getAvailableParentalLeaveOptions(
          userId,
          userType,
          operationId,
        );

      this.logger.log(
        `Parental leave options retrieved: Available=[${options.available.join(', ')}], Used=[${options.used.join(', ')}] - Operation: ${operationId}`,
      );

      return {
        success: true,
        data: options,
        message: 'Parental leave options retrieved successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get parental leave options - Operation: ${operationId}`,
        {
          operation: 'getMyParentalLeaveOptions',
          operationId,
          userId,
          userType,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      );

      // Re-throw if it's already an AppError
      if (error instanceof Error && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to retrieve parental leave options',
        operationId,
        operation: 'getMyParentalLeaveOptions',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get my membership category records
   *
   * Returns all membership category records for the authenticated user,
   * including computed fields and business logic information.
   *
   * @param userId - User ID from JWT payload
   * @param user - Full user object from JWT payload
   * @returns Promise<MembershipCategoryResponseDto[]>
   */
  @Get('me')
  @ApiOperation({
    summary: 'Get my membership category records',
    description: `
      Returns all membership category records for the authenticated user.
      
      **Includes:**
      - All membership categories across different years
      - Computed status fields (active, eligible, etc.)
      - User Group and Membership Category information
      - Eligibility options and requirements
      - Required date fields status
      
      **Business Logic Context:**
      - Shows which eligibility options were selected
      - Indicates if additional date fields are required/provided
      - Displays membership status for each year
      - Provides user group classification information
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Membership category records retrieved successfully.',
    type: [MembershipCategoryResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'No membership category records found.',
  })
  async getMyMembershipCategories(
    @User('userId') userId: string,
    @User() user: Record<string, unknown>,
  ) {
    const operationId = `get_my_membership_categories_${Date.now()}`;
    const privilege = this.getUserPrivilege(user);
    const userRole = this.getUserRole(privilege);
    const userType = this.getUserType(user);

    // Verify user has permission to read membership categories
    if (!canRead(userRole)) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: `Insufficient permissions to read membership categories. Required: OWNER, ADMIN, or MAIN. Current: ${userRole}`,
        operationId,
        operation: 'getMyMembershipCategories',
        userRole,
        requiredPermissions: ['OWNER', 'ADMIN', 'MAIN'],
      });
    }

    try {
      // Use existing repository method to find membership categories by user
      const membershipCategories =
        await this.membershipCategoryRepository.findByUser(userId, userType);

      if (!membershipCategories || membershipCategories.length === 0) {
        return {
          success: true,
          data: [],
          total: 0,
          message: 'No membership category records found',
          timestamp: new Date().toISOString(),
        };
      }

      // Map Dataverse entities to Internal, then to Response DTOs with human-readable labels
      const responseDtos = membershipCategories.map((dataverseEntity) => {
        const internal = mapDataverseToInternal(dataverseEntity);
        return mapInternalToResponse(internal);
      });

      return {
        success: true,
        data: responseDtos,
        total: responseDtos.length,
        message: 'Membership category records retrieved successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Get my membership categories failed - Operation: ${operationId}`,
        {
          operation: 'getMyMembershipCategories',
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
        message: 'Failed to retrieve membership category records',
        operationId,
        operation: 'getMyMembershipCategories',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
