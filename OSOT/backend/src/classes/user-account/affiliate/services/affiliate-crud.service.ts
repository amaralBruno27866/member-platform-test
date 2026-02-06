import { Injectable, Logger, Inject } from '@nestjs/common';

// External Dependencies - Core Platform
import { DataverseService } from '../../../../integrations/dataverse.service';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { Privilege } from '../../../../common/enums';
import { getAppForOperation } from '../../../../utils/dataverse-app.helper';
import { hashPassword } from '../../../../common/keys/password-hash.util';

// Internal Module Dependencies
import { CreateAffiliateDto } from '../dtos/create-affiliate.dto';
import { UpdateAffiliateDto } from '../dtos/update-affiliate.dto';
import { AffiliateResponseDto } from '../dtos/affiliate-response.dto';
import { AffiliateBusinessRuleService } from './affiliate-business-rule.service';
import { UserLookupService } from '../../../../auth/user-lookup.service';
import {
  AffiliateRepository,
  AFFILIATE_REPOSITORY,
} from '../interfaces/affiliate-repository.interface';
import {
  mapCreateDtoToInternal,
  mapUpdateDtoToInternal,
  mapInternalToResponseDto,
} from '../mappers/affiliate.mapper';

// Interfaces and Types
import { AffiliateInternal } from '../interfaces/affiliate-internal.interface';

// Type definitions for Dataverse responses
interface DataverseResponse {
  value?: unknown[];
  '@odata.count'?: number;
}

/**
 * Affiliate CRUD Service
 *
 * CRUD OPERATION RESPONSIBILITIES:
 * - Secure Create operations with password hashing and business rule validation
 * - Read operations with privilege-based field filtering and access control
 * - Update operations with data consistency validation and security checks
 * - Delete operations with soft/hard delete logic and cascade considerations
 *
 * INTEGRATION PATTERNS:
 * - Business Logic: Integrates AffiliateBusinessRuleService for validation
 * - Security: Implements privilege-based access control and field filtering
 * - Error Handling: Uses centralized error factory with structured context
 *
 * SECURITY FEATURES:
 * - Password hashing with bcrypt before storage (SALT_ROUNDS = 10)
 * - Privilege-based access control (OWNER > ADMIN > MAIN)
 * - Input sanitization and validation for all operations
 * - Response filtering based on user privilege level
 * - Business rule validation before data persistence
 *
 * PERMISSION SYSTEM:
 * - OWNER: Full CRUD access to all affiliate records and fields
 * - ADMIN: Create/Read/Update access with restricted field visibility
 * - MAIN: Read-only access with limited field visibility
 *
 * @version 1.0.0 (Initial Implementation)
 * @author NestJS Development Team
 * @since 2024
 */
@Injectable()
export class AffiliateCrudService {
  private readonly logger = new Logger(AffiliateCrudService.name);

  constructor(
    @Inject(AFFILIATE_REPOSITORY)
    private readonly affiliateRepository: AffiliateRepository,
    private readonly dataverseService: DataverseService,
    private readonly businessRuleService: AffiliateBusinessRuleService,
    private readonly userLookupService: UserLookupService,
  ) {
    this.logger.log(
      'AffiliateCrudService initialized with enterprise patterns',
    );
  }

  /**
   * Type guard to check if response is a valid Dataverse response
   * @private
   */
  private isDataverseResponse(
    response: unknown,
  ): response is DataverseResponse {
    return (
      typeof response === 'object' &&
      response !== null &&
      (Array.isArray((response as DataverseResponse).value) ||
        typeof (response as DataverseResponse)['@odata.count'] === 'number')
    );
  }

  /**
   * Type guard to check if data is a valid affiliate record
   * @private
   */
  private isAffiliateRecord(data: unknown): data is Partial<AffiliateInternal> {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof (data as Partial<AffiliateInternal>).osot_affiliate_name ===
        'string'
    );
  }

  /**
   * Safely extract affiliate ID from unknown response
   * @private
   */
  private extractAffiliateId(response: unknown): string {
    if (this.isAffiliateRecord(response) && response.osot_affiliate_id) {
      return response.osot_affiliate_id;
    }
    return 'ID not available';
  }

  /**
   * Safely extract password from affiliate record
   * @private
   */
  private extractPassword(affiliate: unknown): string {
    if (this.isAffiliateRecord(affiliate) && affiliate.osot_password) {
      return affiliate.osot_password;
    }
    return '';
  }

  /**
   * Create a new affiliate record
   * Implements comprehensive creation workflow with password hashing,
   * business rule validation, and event generation
   * FOLLOWS ENTERPRISE PATTERN: Repository + Mappers + Local Hash + ResponseDto
   *
   * @param dto - Create affiliate data transfer object
   * @param userPrivilege - Current user's privilege level
   * @returns Promise<AffiliateResponseDto> - Created affiliate record
   * @throws AppError - If creation fails or business rules are violated
   */
  async createAffiliate(
    dto: CreateAffiliateDto,
    userPrivilege: Privilege,
  ): Promise<AffiliateResponseDto> {
    const operationId = `affiliate_create_${Date.now()}`;

    this.logger.log(`Starting affiliate creation - Operation: ${operationId}`, {
      operation: 'create_affiliate',
      operationId,
      organizationName: dto.osot_affiliate_name,
      userPrivilege,
      timestamp: new Date().toISOString(),
    });

    try {
      // 1. Validate user privilege for creation
      this.validatePrivilegeForOperation(
        userPrivilege,
        Privilege.ADMIN,
        'create_affiliate',
      );

      // 2. Validate business rules for creation
      await this.businessRuleService.validateAffiliateCreation(
        dto,
        userPrivilege,
      );

      // 3. Transform DTO to internal format using mapper
      const internalAffiliate = mapCreateDtoToInternal(dto);

      // 4. Hash password before saving (LOCAL - not delegated)
      if (internalAffiliate.osot_password) {
        this.logger.debug(
          `Hashing password for affiliate creation - Operation: ${operationId}`,
        );
        this.logger.debug(
          `[PASSWORD_DEBUG] Original password length: ${internalAffiliate.osot_password.length}`,
        );
        internalAffiliate.osot_password = await hashPassword(
          internalAffiliate.osot_password,
        );
        this.logger.debug(
          `[PASSWORD_DEBUG] Hashed password starts with: ${internalAffiliate.osot_password.substring(0, 7)}`,
        );
      }

      // 5. Create affiliate via repository
      const createdAffiliate =
        await this.affiliateRepository.create(internalAffiliate);

      if (!createdAffiliate) {
        this.logger.error(
          `Affiliate creation failed - Repository returned null - Operation: ${operationId}`,
          {
            operation: 'create',
            operationId,
            error: 'REPOSITORY_NULL_RESPONSE',
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
          message: 'Failed to create affiliate - no data returned',
          operationId,
          operation: 'create',
        });
      }

      // 6. Transform to response DTO
      const responseDto = mapInternalToResponseDto(createdAffiliate);

      this.logger.log(
        `Affiliate created successfully - Operation: ${operationId}`,
        {
          operation: 'create',
          operationId,
          affiliateId: createdAffiliate.osot_table_account_affiliateid,
          timestamp: new Date().toISOString(),
        },
      );

      return responseDto;
    } catch (error) {
      this.logger.error(
        `Affiliate creation failed - Operation: ${operationId}`,
        {
          operation: 'create',
          operationId,
          organizationName: dto.osot_affiliate_name,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      );

      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw AppError instances
      }
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to create affiliate',
        operationId,
        operation: 'create',
        organizationName: dto.osot_affiliate_name,
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find affiliate by ID with privilege-based field filtering
   * Implements secure read operations with access control
   *
   * @param affiliateId - Unique identifier for the affiliate
   * @param userPrivilege - Current user's privilege level
   * @returns Promise<AffiliateInternal | null> - Affiliate record or null if not found
   * @throws AppError - If access is denied or operation fails
   */
  async findAffiliateById(
    affiliateId: string,
    userPrivilege: Privilege,
  ): Promise<AffiliateInternal | null> {
    this.logger.debug(`Finding affiliate by ID: ${affiliateId}`);

    try {
      // 1. Validate user privilege for read operation
      this.validatePrivilegeForOperation(
        userPrivilege,
        Privilege.MAIN,
        'read_affiliate',
      );

      // 2. Find affiliate using Dataverse service with appropriate credentials
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const affiliate = await this.dataverseService.request(
        'GET',
        `osot_table_account_affiliates(${affiliateId})`,
        undefined,
        credentials,
        app,
      );

      if (!affiliate) {
        this.logger.debug(`Affiliate not found: ${affiliateId}`);
        return null;
      }

      // 3. Apply privilege-based field filtering
      const filteredAffiliate = this.applyPrivilegeBasedFiltering(
        affiliate as AffiliateInternal,
        userPrivilege,
      );

      this.logger.debug(`Affiliate found and filtered: ${affiliateId}`);
      return filteredAffiliate;
    } catch (error) {
      this.logger.error(
        `Find affiliate by ID failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );

      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw AppError instances
      }
      throw createAppError(ErrorCodes.GENERIC, {
        operation: 'find_affiliate_by_id',
        affiliateId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update affiliate record with business rule validation
   * Implements secure update operations with data consistency checks
   * Follows enterprise pattern: Repository + Mappers + ID Resolution + Cache Management
   *
   * @param affiliateId - Unique identifier for the affiliate (Business ID or GUID)
   * @param dto - Update affiliate data transfer object
   * @param userPrivilege - Current user's privilege level
   * @returns Promise<AffiliateResponseDto> - Updated affiliate record
   * @throws AppError - If update fails or business rules are violated
   */
  async updateAffiliate(
    affiliateId: string,
    dto: UpdateAffiliateDto,
    userPrivilege: Privilege,
  ): Promise<AffiliateResponseDto> {
    const operationId = `affiliate_update_${Date.now()}`;

    this.logger.log(`Starting affiliate update - Operation: ${operationId}`, {
      operation: 'update_affiliate',
      operationId,
      affiliateId,
      userPrivilege,
      timestamp: new Date().toISOString(),
    });

    try {
      // 1. Validate user privilege for update operation
      this.validatePrivilegeForOperation(
        userPrivilege,
        Privilege.ADMIN,
        'update_affiliate',
      );

      // 2. ID Resolution: Convert Business ID → GUID if needed
      const isBusinessId = /^osot-af-\d{7}$/.test(affiliateId);
      const isGuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          affiliateId,
        );

      let targetAffiliateId = affiliateId;

      if (isBusinessId) {
        // Find the affiliate by business ID to get its GUID
        const affiliate =
          await this.affiliateRepository.findByBusinessId(affiliateId);
        if (!affiliate) {
          this.logger.error(
            `Affiliate not found for update - Operation: ${operationId}`,
            {
              operation: 'update',
              operationId,
              affiliateId,
              idType: 'businessId',
              error: 'AFFILIATE_NOT_FOUND',
              timestamp: new Date().toISOString(),
            },
          );

          throw createAppError(ErrorCodes.ACCOUNT_NOT_FOUND, {
            message: 'Affiliate not found for update',
            operationId,
            operation: 'update',
            resourceId: affiliateId,
          });
        }
        targetAffiliateId = affiliate.osot_table_account_affiliateid;
        this.logger.debug(
          `Resolved business ID to GUID - Operation: ${operationId}`,
          {
            businessId: affiliateId,
            guid: targetAffiliateId,
            timestamp: new Date().toISOString(),
          },
        );
      } else if (!isGuid) {
        // Try to find by business ID first, then by GUID
        const affiliateByBusinessId =
          await this.affiliateRepository.findByBusinessId(affiliateId);
        if (affiliateByBusinessId) {
          targetAffiliateId =
            affiliateByBusinessId.osot_table_account_affiliateid;
        } else {
          targetAffiliateId = affiliateId;
        }
      }

      // 3. Validação Prévia: Get existing affiliate using resolved GUID
      const existingAffiliate =
        await this.affiliateRepository.findById(targetAffiliateId);

      if (!existingAffiliate) {
        this.logger.warn(
          `Affiliate not found for update - Operation: ${operationId}`,
          {
            operation: 'update',
            operationId,
            affiliateId,
            targetAffiliateId,
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.ACCOUNT_NOT_FOUND, {
          message: 'Affiliate not found for update',
          operationId,
          affiliateId,
          operation: 'update',
        });
      }

      // 4. Validate business rules for update
      await this.businessRuleService.validateAffiliateUpdate(
        targetAffiliateId,
        dto,
        userPrivilege,
      );

      // 5. Transform update DTO to internal format using mapper
      const updateData = mapUpdateDtoToInternal(dto);

      // 6. Hash password using standard hashPassword() utility
      if (updateData.osot_password) {
        this.logger.debug(
          `Hashing password for affiliate update - Operation: ${operationId}`,
        );
        updateData.osot_password = await hashPassword(updateData.osot_password);
      }

      // 7. Update affiliate via repository
      const updatedAffiliate = await this.affiliateRepository.update(
        targetAffiliateId,
        updateData,
      );

      if (!updatedAffiliate) {
        this.logger.error(
          `Affiliate update failed - Repository returned null - Operation: ${operationId}`,
          {
            operation: 'update',
            operationId,
            affiliateId,
            error: 'REPOSITORY_NULL_RESPONSE',
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
          message: 'Failed to update affiliate - no data returned',
          operationId,
          affiliateId,
          operation: 'update',
        });
      }

      // 8. Cache Management: Clear cache if email was updated
      // Note: Password updates must use dedicated password change endpoint
      if (dto.osot_affiliate_email) {
        try {
          // Clear cache for new email
          this.logger.debug(
            `Clearing cache for new email - Operation: ${operationId}`,
            { email: dto.osot_affiliate_email },
          );
          await this.userLookupService.clearUserCache(dto.osot_affiliate_email);

          // Clear cache for old email
          if (existingAffiliate.osot_affiliate_email) {
            this.logger.debug(
              `Clearing cache for old email - Operation: ${operationId}`,
              { email: existingAffiliate.osot_affiliate_email },
            );
            await this.userLookupService.clearUserCache(
              existingAffiliate.osot_affiliate_email,
            );
          }

          this.logger.debug(
            `Cache cleared successfully - Operation: ${operationId}`,
          );
        } catch (cacheError) {
          // Log cache error but don't fail the operation
          this.logger.warn(`Cache clear failed - Operation: ${operationId}`, {
            affiliateId: targetAffiliateId,
            error:
              cacheError instanceof Error
                ? cacheError.message
                : 'Unknown error',
          });
        }
      }

      // 9. Transform to response DTO using mapper
      const responseDto = mapInternalToResponseDto(updatedAffiliate);

      this.logger.log(
        `Affiliate updated successfully - Operation: ${operationId}`,
        {
          operation: 'update',
          operationId,
          affiliateId: targetAffiliateId,
          timestamp: new Date().toISOString(),
        },
      );

      return responseDto;
    } catch (error) {
      this.logger.error(`Affiliate update failed - Operation: ${operationId}`, {
        operation: 'update',
        operationId,
        affiliateId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });

      // Re-throw if it's already an AppError
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to update affiliate',
        operationId,
        affiliateId,
        operation: 'update',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update affiliate system fields (internal use only)
   * Used for system operations like registration workflow, status changes, etc.
   * Bypasses public DTO validation to allow system field updates
   *
   * @param affiliateId - Unique identifier for the affiliate
   * @param systemUpdates - System fields to update (e.g., status, privileges)
   * @param systemPrivilege - System privilege level (typically ADMIN)
   * @returns Promise<AffiliateInternal> - Updated affiliate record
   * @throws AppError - If update fails
   */
  async updateAffiliateSystemFields(
    affiliateId: string,
    systemUpdates: {
      osot_account_status?: number;
      osot_Privilege?: number;
      osot_Access_Modifiers?: number;
      osot_Active_Member?: boolean;
      [key: string]: any;
    },
    systemPrivilege: Privilege = Privilege.ADMIN,
  ): Promise<AffiliateInternal> {
    this.logger.debug(`Updating affiliate system fields: ${affiliateId}`);

    try {
      // Validate system privilege
      this.validatePrivilegeForOperation(
        systemPrivilege,
        Privilege.ADMIN,
        'update_affiliate_system_fields',
      );

      // Prepare system update payload (direct Dataverse fields)
      const updatePayload: Record<string, any> = {};

      if (systemUpdates.osot_account_status !== undefined) {
        updatePayload.osot_account_status = systemUpdates.osot_account_status;
      }

      if (systemUpdates.osot_Privilege !== undefined) {
        updatePayload.osot_Privilege = systemUpdates.osot_Privilege;
      }

      if (systemUpdates.osot_Access_Modifiers !== undefined) {
        updatePayload.osot_Access_Modifiers =
          systemUpdates.osot_Access_Modifiers;
      }

      if (systemUpdates.osot_Active_Member !== undefined) {
        updatePayload.osot_Active_Member = systemUpdates.osot_Active_Member;
      }

      // Use default app like AccountRepository does (no explicit app/credentials)
      // This ensures proper permissions when updating records
      const updatedAffiliate = await this.dataverseService.request(
        'PATCH',
        `osot_table_account_affiliates(${affiliateId})`,
        updatePayload,
      );

      this.logger.log(
        `Affiliate system fields updated successfully: ${affiliateId}`,
      );
      return updatedAffiliate as AffiliateInternal;
    } catch (error) {
      this.logger.error(
        `Affiliate system fields update failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );

      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw AppError instances
      }
      throw createAppError(ErrorCodes.GENERIC, {
        operation: 'update_affiliate_system_fields',
        affiliateId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Delete affiliate record (soft delete)
   * Implements secure deletion with cascade considerations
   *
   * @param affiliateId - Unique identifier for the affiliate
   * @param userPrivilege - Current user's privilege level
   * @returns Promise<boolean> - True if deletion was successful
   * @throws AppError - If deletion fails or access is denied
   */
  async deleteAffiliate(
    affiliateId: string,
    userPrivilege: Privilege,
  ): Promise<boolean> {
    this.logger.debug(`Deleting affiliate: ${affiliateId}`);

    try {
      // 1. Validate user privilege for delete operation
      this.validatePrivilegeForOperation(
        userPrivilege,
        Privilege.OWNER,
        'delete_affiliate',
      );

      // 2. Perform soft delete by setting status to inactive
      await this.dataverseService.request(
        'PATCH',
        `osot_table_account_affiliates(${affiliateId})`,
        {
          statuscode: 2, // Inactive status
        },
      );

      this.logger.log(`Affiliate deleted successfully: ${affiliateId}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Affiliate deletion failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );

      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw AppError instances
      }
      throw createAppError(ErrorCodes.GENERIC, {
        operation: 'delete_affiliate',
        affiliateId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find all affiliates with pagination and filtering
   * Implements secure listing with privilege-based access control
   *
   * @param options - Query options (pagination, filtering, sorting)
   * @param userPrivilege - Current user's privilege level
   * @returns Promise<{affiliates: AffiliateInternal[], total: number}> - Paginated results
   * @throws AppError - If access is denied or operation fails
   */
  async findAllAffiliates(
    options: {
      page?: number;
      limit?: number;
      affiliateArea?: number;
      searchTerm?: string;
      status?: string;
    },
    userPrivilege: Privilege,
  ): Promise<{ affiliates: AffiliateInternal[]; total: number }> {
    this.logger.debug('Finding all affiliates with pagination and filtering');

    try {
      // 1. Validate user privilege for list operation
      this.validatePrivilegeForOperation(
        userPrivilege,
        Privilege.MAIN,
        'list_affiliates',
      );

      // 2. Set default pagination
      const page = options.page || 1;
      const limit = Math.min(options.limit || 10, 100); // Max 100 per page
      const skip = (page - 1) * limit;

      // 3. Build query filters
      const filter = this.buildQueryFilters(options);

      // 4. Get affiliates from Dataverse using appropriate credentials
      const query = `$filter=${filter}&$top=${limit}&$skip=${skip}&$count=true`;
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const response = await this.dataverseService.request(
        'GET',
        `osot_table_account_affiliates?${query}`,
        undefined,
        credentials,
        app,
      );

      // 5. Apply privilege-based filtering to all results
      const filteredAffiliates: AffiliateInternal[] = [];

      if (this.isDataverseResponse(response) && Array.isArray(response.value)) {
        for (const item of response.value) {
          if (this.isAffiliateRecord(item)) {
            const filteredAffiliate = this.applyPrivilegeBasedFiltering(
              item as AffiliateInternal,
              userPrivilege,
            );
            filteredAffiliates.push(filteredAffiliate);
          }
        }
      }

      const totalCount = this.isDataverseResponse(response)
        ? response['@odata.count'] || 0
        : 0;

      this.logger.debug(
        `Found ${filteredAffiliates.length} affiliates (${totalCount} total)`,
      );

      return {
        affiliates: filteredAffiliates,
        total: totalCount,
      };
    } catch (error) {
      this.logger.error(
        `Find all affiliates failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );

      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw AppError instances
      }
      throw createAppError(ErrorCodes.GENERIC, {
        operation: 'find_all_affiliates',
        options,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Verify affiliate password for authentication
   * Implements secure password verification
   *
   * @param affiliateId - Unique identifier for the affiliate
   * @param password - Plain text password to verify
   * @returns Promise<boolean> - True if password matches
   * @throws AppError - If verification fails or affiliate not found
   */
  async verifyAffiliatePassword(
    affiliateId: string,
    password: string,
  ): Promise<boolean> {
    this.logger.debug(`Verifying password for affiliate: ${affiliateId}`);

    try {
      // 1. Get affiliate record using main app credentials for authentication
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const affiliate = await this.dataverseService.request(
        'GET',
        `osot_table_account_affiliates(${affiliateId})`,
        undefined,
        credentials,
        app,
      );

      if (!affiliate) {
        throw createAppError(ErrorCodes.ACCOUNT_NOT_FOUND, {
          affiliateId,
          operation: 'verify_password',
        });
      }

      // 2. Verify password using business rule service
      const passwordToVerify = this.extractPassword(affiliate);
      const isValid = await this.businessRuleService.verifyAffiliatePassword(
        password,
        passwordToVerify,
      );
      this.logger.debug(
        `Password verification ${isValid ? 'successful' : 'failed'} for: ${affiliateId}`,
      );

      return isValid;
    } catch (error) {
      this.logger.error(
        `Password verification failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );

      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw AppError instances
      }
      throw createAppError(ErrorCodes.GENERIC, {
        operation: 'verify_affiliate_password',
        affiliateId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Validate user privilege for operation
   * Implements privilege hierarchy validation
   *
   * @param userPrivilege - Current user's privilege level
   * @param requiredPrivilege - Required privilege for operation
   * @param operation - Operation being performed
   * @throws AppError - If privilege is insufficient
   */
  private validatePrivilegeForOperation(
    userPrivilege: Privilege,
    requiredPrivilege: Privilege,
    operation: string,
  ): void {
    // Privilege hierarchy: OWNER (1) > ADMIN (2) > MAIN (3)
    if (userPrivilege > requiredPrivilege) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        userPrivilege,
        requiredPrivilege,
        operation,
        message: `Insufficient privilege for ${operation}`,
      });
    }
  }

  /**
   * Apply privilege-based field filtering
   * Implements security-based data filtering
   *
   * @param affiliate - Full affiliate record
   * @param userPrivilege - Current user's privilege level
   * @returns AffiliateInternal - Filtered affiliate record
   */
  private applyPrivilegeBasedFiltering(
    affiliate: AffiliateInternal,
    userPrivilege: Privilege,
  ): AffiliateInternal {
    // Create a copy to avoid mutating original
    const filtered = { ...affiliate };

    // Always remove password from responses
    delete filtered.osot_password;

    // Apply privilege-based field filtering
    if (userPrivilege === Privilege.MAIN) {
      // MAIN users get limited field access - remove sensitive fields
      // Keep only basic information
      const allowedFields = [
        'osot_affiliate_id',
        'osot_affiliate_name',
        'osot_affiliate_area',
        'osot_affiliate_email',
        'osot_affiliate_phone',
        'osot_affiliate_website',
        'osot_representative_first_name',
        'osot_representative_last_name',
        'osot_representative_job_title',
        'osot_representative_email',
        'osot_affiliate_city',
        'osot_affiliate_state',
        'osot_affiliate_country',
      ];

      // Remove all fields not in allowed list
      Object.keys(filtered).forEach((key) => {
        if (!allowedFields.includes(key)) {
          delete filtered[key];
        }
      });
    }

    return filtered;
  }

  /**
   * Build query filters from options
   * Implements secure query building
   *
   * @param options - Query options
   * @returns string - OData filter string
   */
  private buildQueryFilters(options: {
    affiliateArea?: number;
    searchTerm?: string;
    status?: string;
  }): string {
    const filters: string[] = [];

    if (options.affiliateArea) {
      filters.push(`osot_affiliate_area eq ${options.affiliateArea}`);
    }

    if (options.status) {
      filters.push(`osot_account_status eq '${options.status}'`);
    }

    if (options.searchTerm) {
      // Simple search implementation - search in organization name
      filters.push(`contains(osot_affiliate_name, '${options.searchTerm}')`);
    }

    // Default filter to only active records
    filters.push('statuscode eq 1');

    return filters.join(' and ');
  }
}
