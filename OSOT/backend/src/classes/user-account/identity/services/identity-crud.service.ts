import { Injectable, Inject, Logger } from '@nestjs/common';
import { IdentityCreateDto } from '../dtos/identity-create.dto';
import { IdentityUpdateDto } from '../dtos/identity-update.dto';
import { IdentityResponseDto } from '../dtos/identity-response.dto';
import { CacheService } from '../../../../cache/cache.service';
import { IdentityBusinessRuleService } from './identity-business-rule.service';
import {
  IdentityRepository,
  IDENTITY_REPOSITORY,
} from '../interfaces/identity-repository.interface';
import { IdentityEventService } from '../events/identity.events';
import { IdentityBusinessLogic } from '../utils/identity-business-logic.util';
import {
  mapDataverseToIdentityResponse,
  mapCreateDtoToInternal,
  mapUpdateDtoToDataversePayload,
  mapCreateIdentityForAccountDtoToInternal,
  mapInternalToIdentityResponse,
  mapDataverseToIdentityInternal,
} from '../mappers/identity.mapper';
import {
  canCreate,
  canRead,
  canWrite,
  canDelete,
} from '../../../../utils/dataverse-app.helper';
import { Privilege } from '../../../../common/enums';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';

/**
 * Identity CRUD Service (ENTERPRISE)
 *
 * MODERNIZED ARCHITECTURE INTEGRATION:
 * - Repository Pattern: IdentityRepository for clean data access abstraction
 * - Event-Driven Architecture: IdentityEventService for comprehensive lifecycle notifications
 * - Structured Logging: Logger with operation IDs and security-aware PII redaction
 * - Mappers: Data transformation with mapCreateDtoToDataversePayload, mapDataverseToIdentityResponse
 * - Security-First Design: Role-based permission checking (canCreate, canRead, canWrite, canDelete)
 * - Business Rule Framework: IdentityBusinessRuleService for centralized validation
 * - Error Management: Comprehensive error handling with createAppError and detailed context
 *
 * Handles Create, Read, Update, Delete operations for Identity entities.
 * Uses repository pattern for data access, mappers for data transformation,
 * and events system for lifecycle notifications.
 *
 * PERMISSION SYSTEM:
 * - main: Full CRUD access to all fields
 * - admin: Read/Write access to all fields, no delete
 * - owner: Create/Read/Write access, sensitive fields filtered
 * - Sensitive fields filtered for 'owner': access_modifiers, privilege, audit fields
 *
 * Key Features:
 * - Full CRUD operations with business rule validation
 * - Role-based permission checking (canCreate, canRead, canWrite, canDelete)
 * - Field-level filtering based on user role
 * - Repository pattern for clean data access abstraction
 * - Event-driven architecture for lifecycle notifications
 * - Automatic data transformation using mappers
 * - User Business ID uniqueness enforcement
 * - Cultural consistency validation and tracking
 * - Language preference management
 * - Comprehensive error handling and logging
 * - Operation tracking with unique IDs for comprehensive audit trails
 * - Security-aware logging with PII redaction capabilities
 *
 * Dependencies:
 * - IdentityRepository: Clean data access abstraction
 * - IdentityBusinessRuleService: Validation and normalization
 * - IdentityEventService: Lifecycle event management
 */
@Injectable()
export class IdentityCrudService {
  private readonly logger = new Logger(IdentityCrudService.name);

  constructor(
    @Inject(IDENTITY_REPOSITORY)
    private readonly identityRepository: IdentityRepository,
    private readonly businessRuleService: IdentityBusinessRuleService,
    private readonly eventsService: IdentityEventService,
    private readonly cacheService: CacheService,
  ) {
    this.logger.log('IdentityCrudService initialized with Enterprise patterns');
  }

  /**
   * Create a new identity with full business rule validation
   * - Validates User Business ID uniqueness and format
   * - Ensures cultural consistency across fields
   * - Validates language preferences and requirements
   * - Creates the identity record using repository
   * - Emits identity created event with cultural tracking
   */
  async create(
    createIdentityDto: IdentityCreateDto,
    userRole?: string,
  ): Promise<IdentityResponseDto | null> {
    const operationId = `identity_create_${Date.now()}`;

    this.logger.log(`Starting identity creation - Operation: ${operationId}`, {
      operation: 'create_identity',
      operationId,
      userRole: userRole || 'undefined',
      hasLanguages: !!createIdentityDto.osot_language?.length,
      timestamp: new Date().toISOString(),
    });

    // Check create permissions
    if (!canCreate(userRole)) {
      this.logger.warn(
        `Identity creation denied - insufficient privileges - Operation: ${operationId}`,
        {
          operation: 'create_identity',
          operationId,
          requiredPrivilege: 'CREATE',
          userRole: userRole || 'undefined',
          error: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        operation: 'create_identity',
        operationId,
        message: 'Insufficient permissions to create identity',
        requiredRole: 'main or owner',
        currentRole: userRole,
      });
    }
    // Apply business rules and get normalized data
    const validation = this.businessRuleService.validateForCreation(
      createIdentityDto,
      'default', // accountId - would come from context in real implementation
      userRole,
    );

    if (!validation.isValid) {
      this.logger.error(
        `Identity creation validation failed - Operation: ${operationId}`,
        {
          operation: 'create_identity_validation',
          operationId,
          errors: validation.errors,
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'create_identity_validation',
        operationId,
        message: `Validation failed: ${validation.errors.join(', ')}`,
        errors: validation.errors,
        dto: createIdentityDto,
      });
    }

    try {
      // Transform DTO to Internal format using mapper
      const identityInternal = mapCreateDtoToInternal(createIdentityDto);

      // Create the identity record using repository
      const createdRecord =
        await this.identityRepository.create(identityInternal);

      // Transform Dataverse response to Internal using mapDataverseToIdentityInternal
      const identityInternalResult =
        mapDataverseToIdentityInternal(createdRecord);

      // Transform Internal to Response DTO
      const responseDto = mapInternalToIdentityResponse(identityInternalResult);

      // Apply field filtering based on user role
      const filteredResponse = responseDto
        ? this.filterIdentityFields(responseDto, userRole)
        : null;

      this.logger.log(
        `Identity created successfully - Operation: ${operationId}`,
        {
          operation: 'create_identity',
          operationId,
          identityId:
            filteredResponse?.osot_identity_id?.substring(0, 8) + '...',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      // Emit identity created event (use internal data with enums, not response with strings)
      if (filteredResponse && identityInternalResult) {
        const languageArray = Array.isArray(
          identityInternalResult.osot_language,
        )
          ? identityInternalResult.osot_language
          : [];
        this.eventsService.emitIdentityCreated({
          identityId: filteredResponse.osot_identity_id || '',
          accountId: 'default',
          userBusinessId: filteredResponse.osot_user_business_id || '',
          language: languageArray,
          privilege: identityInternalResult.osot_privilege || Privilege.OWNER,
          createdBy: 'system', // Would come from user context in real implementation
        });

        // Invalidate identity cache (extract account ID from binding)
        const accountBinding =
          createIdentityDto['osot_Table_Account@odata.bind'] || '';
        const accountIdMatch = accountBinding.match(/\(([a-f0-9-]+)\)/i);
        const accountId = accountIdMatch ? accountIdMatch[1] : null;
        if (accountId) {
          await this.cacheService.invalidateIdentity(accountId);
        }
      }

      return responseDto;
    } catch (error) {
      this.logger.error(
        `Identity creation failed - Operation: ${operationId}`,
        {
          operation: 'create_identity',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );
      throw error;
    }
  }

  /**
   * Find an identity by its unique identifier
   * Returns detailed identity information using repository and mapper
   */
  async findOne(
    id: string,
    userRole?: string,
  ): Promise<IdentityResponseDto | null> {
    const operationId = Math.random().toString(36).substring(2, 15);

    // Check read permissions
    if (!canRead(userRole || '')) {
      this.logger.warn(
        `Identity findOne permission denied - Operation: ${operationId}`,
        {
          operation: 'find_identity',
          operationId,
          userRole: userRole || 'undefined',
          requiredPermission: 'canRead',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        operation: 'find_identity',
        message: 'Insufficient permissions to read identity',
        requiredRole: 'main, admin, or owner',
        currentRole: userRole,
      });
    }

    try {
      this.logger.log(
        `Identity findOne initiated - Operation: ${operationId}`,
        {
          operation: 'find_identity',
          operationId,
          identityId: id?.substring(0, 8) + '...',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      const record = await this.identityRepository.findByGuid(id);

      if (!record) {
        this.logger.log(`Identity not found - Operation: ${operationId}`, {
          operation: 'find_identity',
          operationId,
          identityId: id?.substring(0, 8) + '...',
          userRole: userRole || 'undefined',
          found: false,
          timestamp: new Date().toISOString(),
        });
        return null;
      }

      const responseDto = mapDataverseToIdentityResponse(record);
      const filteredResponse = responseDto
        ? this.filterIdentityFields(responseDto, userRole)
        : null;

      this.logger.log(
        `Identity found successfully - Operation: ${operationId}`,
        {
          operation: 'find_identity',
          operationId,
          identityId: id?.substring(0, 8) + '...',
          userRole: userRole || 'undefined',
          found: true,
          hasFilteredResponse: !!filteredResponse,
          timestamp: new Date().toISOString(),
        },
      );

      return filteredResponse;
    } catch (error) {
      this.logger.error(`Identity findOne failed - Operation: ${operationId}`, {
        operation: 'find_identity',
        operationId,
        identityId: id?.substring(0, 8) + '...',
        error: error instanceof Error ? error.message : 'Unknown error',
        userRole: userRole || 'undefined',
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Find an identity by User Business ID
   * User Business ID is unique across the system (20 characters max)
   */
  async findByUserBusinessId(
    userBusinessId: string,
    userRole?: string,
  ): Promise<IdentityResponseDto | null> {
    const operationId = Math.random().toString(36).substring(2, 15);

    // Check read permissions
    if (!canRead(userRole || '')) {
      this.logger.warn(
        `Identity findByUserBusinessId permission denied - Operation: ${operationId}`,
        {
          operation: 'find_identity_by_business_id',
          operationId,
          userRole: userRole || 'undefined',
          requiredPermission: 'canRead',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        operation: 'find_identity_by_business_id',
        message: 'Insufficient permissions to read identity',
        requiredRole: 'main, admin, or owner',
        currentRole: userRole,
      });
    }

    try {
      // Redact sensitive data from logs (show only first 4 chars)
      const redactedBusinessId = userBusinessId?.substring(0, 4) + '...';

      this.logger.log(
        `Identity findByUserBusinessId initiated - Operation: ${operationId}`,
        {
          operation: 'find_identity_by_business_id',
          operationId,
          userBusinessId: redactedBusinessId,
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      const record =
        await this.identityRepository.findByBusinessId(userBusinessId);

      if (!record) {
        this.logger.log(
          `Identity not found by business ID - Operation: ${operationId}`,
          {
            operation: 'find_identity_by_business_id',
            operationId,
            userBusinessId: redactedBusinessId,
            userRole: userRole || 'undefined',
            found: false,
            timestamp: new Date().toISOString(),
          },
        );
        return null;
      }

      const responseDto = mapDataverseToIdentityResponse(record);
      const filteredResponse = responseDto
        ? this.filterIdentityFields(responseDto, userRole)
        : null;

      this.logger.log(
        `Identity found by business ID - Operation: ${operationId}`,
        {
          operation: 'find_identity_by_business_id',
          operationId,
          userBusinessId: redactedBusinessId,
          userRole: userRole || 'undefined',
          found: true,
          hasFilteredResponse: !!filteredResponse,
          timestamp: new Date().toISOString(),
        },
      );

      return filteredResponse;
    } catch (error) {
      this.logger.error(
        `Identity findByUserBusinessId failed - Operation: ${operationId}`,
        {
          operation: 'find_identity_by_business_id',
          operationId,
          userBusinessId: userBusinessId?.substring(0, 4) + '...',
          error: error instanceof Error ? error.message : 'Unknown error',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );
      throw error;
    }
  }

  /**
   * Find all identities associated with a specific account
   * Returns array of identity DTOs for display
   */
  async findByAccount(
    accountId: string,
    userRole?: string,
  ): Promise<IdentityResponseDto[]> {
    // Check read permissions
    if (!canRead(userRole || '')) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        operation: 'find_identities_by_account',
        message: 'Insufficient permissions to read identities',
        requiredRole: 'main, admin, or owner',
        currentRole: userRole,
      });
    }

    // Check cache first
    const cacheKey = this.cacheService.buildIdentityKey(accountId);
    const cached = await this.cacheService.get<IdentityResponseDto[]>(cacheKey);

    if (cached) {
      return cached;
    }

    // Query Dataverse if cache miss
    const records = await this.identityRepository.findByAccountId(accountId);
    const result = records
      .map((record) => mapDataverseToIdentityResponse(record))
      .filter((dto): dto is IdentityResponseDto => dto !== null)
      .map((dto) => this.filterIdentityFields(dto, userRole));

    // Cache the result
    await this.cacheService.set(cacheKey, result);

    return result;
  }

  /**
   * Find identities by primary language
   * Useful for cultural grouping and analysis
   */
  async findByLanguage(language: number): Promise<IdentityResponseDto[]> {
    const records = await this.identityRepository.findByLanguage(language);
    return records
      .map((record) => mapDataverseToIdentityResponse(record))
      .filter((dto): dto is IdentityResponseDto => dto !== null);
  }

  /**
   * Update an existing identity with full validation
   * - Validates User Business ID changes and uniqueness
   * - Ensures cultural consistency is maintained
   * - Updates using repository pattern
   * - Emits update events for tracking
   */
  async update(
    id: string,
    updateIdentityDto: IdentityUpdateDto,
    userRole?: string,
  ): Promise<IdentityResponseDto | null> {
    // Generate operation ID for tracking
    const operationId = `identity-update-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    this.logger.log(`Starting identity update - Operation: ${operationId}`, {
      operation: 'update',
      operationId,
      identityId: id,
      userRole,
      timestamp: new Date().toISOString(),
    });

    try {
      // Check write permissions
      if (!canWrite(userRole || '')) {
        this.logger.warn(
          `Permission denied for identity update - Operation: ${operationId}`,
          {
            operation: 'update',
            operationId,
            identityId: id,
            requiredRole: 'main, admin, or owner',
            currentRole: userRole,
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          operation: 'update',
          message: 'Insufficient permissions to update identity',
          operationId,
          requiredRole: 'main, admin, or owner',
          currentRole: userRole,
        });
      }

      // ID Resolution: Convert Business ID → GUID if needed
      const isBusinessId = /^osot-\d{7}$/.test(id);
      const isGuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          id,
        );

      let targetIdentityId = id;

      if (isBusinessId) {
        // Find the identity by business ID to get its GUID
        const identity = await this.identityRepository.findByBusinessId(id);
        if (!identity) {
          this.logger.error(
            `Identity not found for update - Operation: ${operationId}`,
            {
              operation: 'update',
              operationId,
              identityId: id,
              idType: 'businessId',
              error: 'IDENTITY_NOT_FOUND',
              timestamp: new Date().toISOString(),
            },
          );

          throw createAppError(ErrorCodes.VALIDATION_ERROR, {
            message: 'Identity not found for update',
            operationId,
            operation: 'update',
            resourceId: id,
          });
        }
        targetIdentityId = identity.osot_table_identityid as string;
        this.logger.debug(
          `Resolved business ID to GUID - Operation: ${operationId}`,
          {
            businessId: id,
            guid: targetIdentityId,
            timestamp: new Date().toISOString(),
          },
        );
      } else if (!isGuid) {
        // Try to find by business ID first
        const identityByBusinessId =
          await this.identityRepository.findByBusinessId(id);
        if (identityByBusinessId) {
          targetIdentityId =
            identityByBusinessId.osot_table_identityid as string;
        } else {
          targetIdentityId = id;
        }
      }

      this.logger.debug(
        `Fetching existing identity for validation - Operation: ${operationId}`,
        {
          operation: 'update',
          operationId,
          identityId: targetIdentityId,
          timestamp: new Date().toISOString(),
        },
      );

      // Get existing identity for validation context
      const existingIdentity =
        await this.identityRepository.findByGuid(targetIdentityId);
      if (!existingIdentity) {
        this.logger.warn(
          `Identity not found for update - Operation: ${operationId}`,
          {
            operation: 'update',
            operationId,
            identityId: id,
            targetIdentityId,
            timestamp: new Date().toISOString(),
          },
        );
        return null;
      }

      this.logger.debug(
        `Validating identity update with business rules - Operation: ${operationId}`,
        {
          operation: 'update',
          operationId,
          identityId: targetIdentityId,
          hasLanguage: !!updateIdentityDto.osot_language,
          hasGender: updateIdentityDto.osot_gender !== undefined,
          timestamp: new Date().toISOString(),
        },
      );

      // Apply business rules with existing context
      const validation = await this.businessRuleService.validateForUpdate(
        updateIdentityDto,
        existingIdentity.osot_table_identityid as string,
        userRole,
      );

      if (!validation.isValid) {
        this.logger.warn(
          `Identity update validation failed - Operation: ${operationId}`,
          {
            operation: 'update',
            operationId,
            identityId: targetIdentityId,
            validationErrors: validation.errors,
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
          operation: 'update',
          operationId,
          message: `Validation failed: ${validation.errors.join(', ')}`,
          errors: validation.errors,
          dto: updateIdentityDto,
        });
      }

      this.logger.debug(
        `Transforming and updating identity - Operation: ${operationId}`,
        {
          operation: 'update',
          operationId,
          identityId: targetIdentityId,
          timestamp: new Date().toISOString(),
        },
      );

      // Transform update DTO to Dataverse format
      const updatePayload = mapUpdateDtoToDataversePayload(updateIdentityDto);

      // Update the identity record
      await this.identityRepository.updateByGuid(
        targetIdentityId,
        updatePayload,
      );

      // Get updated record
      const updatedRecord =
        await this.identityRepository.findByGuid(targetIdentityId);
      if (!updatedRecord) {
        this.logger.error(
          `Updated identity record not found - Operation: ${operationId}`,
          {
            operation: 'update',
            operationId,
            identityId: targetIdentityId,
            error: 'RECORD_NOT_FOUND_AFTER_UPDATE',
            timestamp: new Date().toISOString(),
          },
        );
        return null;
      }

      // Phase 7: Invalidate cache after successful update (use account GUID for key consistency)
      if (updatedRecord) {
        const accountGuidFromUpdated = (
          updatedRecord as {
            _osot_table_account_value?: string;
          }
        )._osot_table_account_value;
        const accountGuidFromExisting = (
          existingIdentity as {
            _osot_table_account_value?: string;
          }
        )._osot_table_account_value;

        const accountGuid = accountGuidFromUpdated || accountGuidFromExisting;

        if (accountGuid) {
          await this.cacheService.invalidateIdentity(accountGuid);
        }
      }

      // Transform response and apply field filtering
      const responseDto = mapDataverseToIdentityResponse(updatedRecord);
      const internalDto = mapDataverseToIdentityInternal(updatedRecord);
      const filteredResponse = responseDto
        ? this.filterIdentityFields(responseDto, userRole)
        : null;

      if (!filteredResponse) {
        this.logger.error(
          `Failed to transform identity response - Operation: ${operationId}`,
          {
            operation: 'update',
            operationId,
            identityId: targetIdentityId,
            error: 'MAPPER_RETURNED_NULL',
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.GENERIC, {
          message: 'Failed to update identity - transformation error',
          operationId,
          identityId: targetIdentityId,
          operation: 'update',
        });
      }

      // Success logging
      this.logger.log(
        `Identity updated successfully - Operation: ${operationId}`,
        {
          operation: 'update',
          operationId,
          identityId: targetIdentityId,
          timestamp: new Date().toISOString(),
        },
      );

      // Emit update events (use internal data with enums, not response with strings)
      const internalLanguageArray = Array.isArray(internalDto.osot_language)
        ? internalDto.osot_language
        : [];

      this.eventsService.emitIdentityUpdated({
        identityId: filteredResponse.osot_identity_id || targetIdentityId,
        accountId: 'default',
        userBusinessId: filteredResponse.osot_user_business_id || '',
        changes: {
          osot_user_business_id:
            (existingIdentity.osot_user_business_id as string) !==
            filteredResponse.osot_user_business_id
              ? filteredResponse.osot_user_business_id
              : undefined,
          osot_language:
            JSON.stringify(existingIdentity.osot_language) !==
            JSON.stringify(internalLanguageArray)
              ? internalLanguageArray
              : undefined,
        },
        updatedBy: userRole || 'system',
      });

      return filteredResponse;
    } catch (error) {
      this.logger.error(`Identity update failed - Operation: ${operationId}`, {
        operation: 'update',
        operationId,
        identityId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Delete an identity record
   * Includes proper cleanup and event emission
   */
  async delete(id: string, userRole?: string): Promise<boolean> {
    const operationId = Math.random().toString(36).substring(2, 15);

    // Check delete permissions
    if (!canDelete(userRole || '')) {
      this.logger.warn(
        `Identity delete permission denied - Operation: ${operationId}`,
        {
          operation: 'delete_identity',
          operationId,
          identityId: id?.substring(0, 8) + '...',
          userRole: userRole || 'undefined',
          requiredPermission: 'canDelete',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        operation: 'delete_identity',
        message: 'Insufficient permissions to delete identity',
        requiredRole: 'main',
        currentRole: userRole,
      });
    }

    try {
      this.logger.log(`Identity delete initiated - Operation: ${operationId}`, {
        operation: 'delete_identity',
        operationId,
        identityId: id?.substring(0, 8) + '...',
        userRole: userRole || 'undefined',
        timestamp: new Date().toISOString(),
      });

      // Get identity before deletion for event context
      const existingIdentity = await this.identityRepository.findByGuid(id);
      if (!existingIdentity) {
        this.logger.log(
          `Identity not found for deletion - Operation: ${operationId}`,
          {
            operation: 'delete_identity',
            operationId,
            identityId: id?.substring(0, 8) + '...',
            userRole: userRole || 'undefined',
            found: false,
            timestamp: new Date().toISOString(),
          },
        );
        return false;
      }

      // Perform deletion
      await this.identityRepository.deleteByGuid(id);

      // Invalidate identity cache after successful deletion (keyed by account GUID)
      const accountGuid = (
        existingIdentity as {
          _osot_table_account_value?: string;
        }
      )._osot_table_account_value;

      if (accountGuid) {
        await this.cacheService.invalidateIdentity(accountGuid);
      }

      // Success logging (with PII redaction)
      this.logger.log(
        `Identity deleted successfully - Operation: ${operationId}`,
        {
          operation: 'delete_identity',
          operationId,
          identityId: id?.substring(0, 8) + '...',
          userRole: userRole || 'undefined',
          userBusinessId:
            (existingIdentity.osot_user_business_id as string)?.substring(
              0,
              4,
            ) + '...',
          timestamp: new Date().toISOString(),
        },
      );

      // Emit deletion event
      this.eventsService.emitIdentityDeleted({
        identityId: id,
        accountId: 'default',
        userBusinessId:
          (existingIdentity.osot_user_business_id as string) || '',
        deletedBy: 'system', // Would come from user context in real implementation
      });

      return true;
    } catch (error) {
      this.logger.error(`Identity delete failed - Operation: ${operationId}`, {
        operation: 'delete_identity',
        operationId,
        identityId: id?.substring(0, 8) + '...',
        error: error instanceof Error ? error.message : 'Unknown error',
        userRole: userRole || 'undefined',
        timestamp: new Date().toISOString(),
      });
      return false;
    }
  }

  // ========================================
  // ACCOUNT INTEGRATION METHODS
  // ========================================

  /**
   * Create identity record for account integration
   * Simplified creation process with secure defaults and minimal validation
   *
   * This method is specifically designed for Account creation workflow:
   * - Bypasses complex business rule validation for faster account setup
   * - Uses safe defaults for all optional fields
   * - Fast execution for high-volume account registration
   * - Minimal required data (only essential identity fields)
   *
   * @param dto - Simplified DTO with minimal required fields
   * @returns Created identity record as response DTO
   */
  async createForAccountIntegration(
    dto: import('../dtos/create-identity-for-account.dto').CreateIdentityForAccountDto,
  ): Promise<IdentityResponseDto> {
    const operationId = `create_identity_for_account_${Date.now()}`;

    this.logger.log(
      `Creating identity record for account integration - Operation: ${operationId}`,
      {
        operation: 'createForAccountIntegration',
        operationId,
        hasChosenName: !!dto.osot_chosen_name,
        languageCount: dto.osot_language?.length || 0,
        hasCulturalInfo: !!(
          dto.osot_gender ||
          dto.osot_race ||
          dto.osot_indigenous
        ),
        timestamp: new Date().toISOString(),
      },
    );

    try {
      // Apply minimal but essential validations (including cultural consistency)
      const culturalData = {
        osot_indigenous: dto.osot_indigenous,
        osot_indigenous_detail: dto.osot_indigenous_detail,
        osot_indigenous_detail_other: dto.osot_indigenous_detail_other,
      };

      try {
        const culturalValidation =
          IdentityBusinessLogic.validateCulturalConsistency(culturalData);

        if (!culturalValidation.isValid) {
          this.logger.error(
            `Cultural consistency validation failed - Operation: ${operationId}`,
            {
              operation: 'createForAccountIntegration',
              operationId,
              errors: culturalValidation.errors,
              timestamp: new Date().toISOString(),
            },
          );

          throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
            operation: 'createForAccountIntegration_validation',
            operationId,
            message: `Cultural validation failed: ${culturalValidation.errors.join(', ')}`,
            errors: culturalValidation.errors,
            dto,
          });
        }
      } catch (validationError) {
        // Re-throw validation errors or wrap unexpected errors
        if (
          validationError &&
          typeof validationError === 'object' &&
          'code' in validationError
        ) {
          throw validationError;
        }
        throw createAppError(ErrorCodes.INTERNAL_ERROR, {
          operation: 'createForAccountIntegration_validation',
          operationId,
          message: 'Unexpected error during cultural validation',
          originalError:
            validationError instanceof Error
              ? validationError.message
              : 'Unknown error',
        });
      }

      // Transform to Internal format using the specific mapper
      const identityInternal = mapCreateIdentityForAccountDtoToInternal(dto);

      // Create the identity record using repository (handles Dataverse transformation internally)
      const createdRecord =
        await this.identityRepository.create(identityInternal);

      // Transform response using mapper
      const responseDto = mapDataverseToIdentityResponse(createdRecord);

      if (!responseDto) {
        throw createAppError(ErrorCodes.INTERNAL_ERROR, {
          message: 'Failed to create identity record for account',
          operationId,
        });
      }

      this.logger.log(
        `Identity record created successfully for account integration - Operation: ${operationId}`,
        {
          operation: 'createForAccountIntegration',
          operationId,
          identityId: responseDto.osot_table_identityid,
          timestamp: new Date().toISOString(),
        },
      );

      return responseDto;
    } catch (error) {
      this.logger.error(
        `Identity creation failed for account integration - Operation: ${operationId}`,
        {
          operation: 'createForAccountIntegration',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        operation: 'createForAccountIntegration',
        operationId,
        message: 'Failed to create identity record for account',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get identity data completeness assessment
   * Returns analysis of how complete an identity record is
   */
  async getDataCompletenessAssessment(id: string): Promise<{
    completenessScore: number;
    missingFields: string[];
    recommendations: string[];
  } | null> {
    const record = await this.identityRepository.findByGuid(id);
    if (!record) {
      return null;
    }

    const assessment = this.businessRuleService.assessDataCompleteness(record);

    return {
      completenessScore: assessment.completenessScore,
      missingFields: assessment.missingFields,
      recommendations: assessment.missingFields.map(
        (field) => `Please provide ${field} for complete identity information`,
      ),
    };
  }

  /**
   * Filter identity fields based on user role permissions
   * - main/admin: Full access to all fields
   * - owner: Limited access, sensitive fields filtered out
   */
  private filterIdentityFields(
    identity: IdentityResponseDto,
    userRole?: string,
  ): IdentityResponseDto {
    // Main and admin have full access
    if (userRole === 'main' || userRole === 'admin') {
      return identity;
    }

    // For owner role, filter out sensitive fields but include all non-sensitive fields
    if (userRole === 'owner') {
      return {
        osot_identity_id: identity.osot_identity_id,
        osot_table_identityid: identity.osot_table_identityid,
        osot_user_business_id: identity.osot_user_business_id,
        osot_chosen_name: identity.osot_chosen_name,
        osot_language: identity.osot_language,
        osot_gender: identity.osot_gender,
        osot_race: identity.osot_race,
        osot_indigenous: identity.osot_indigenous,
        osot_indigenous_detail: identity.osot_indigenous_detail,
        osot_indigenous_detail_other: identity.osot_indigenous_detail_other,
        osot_disability: identity.osot_disability,
        osot_table_account: identity.osot_table_account,
        // Sensitive fields filtered out: osot_access_modifiers, osot_privilege, createdon, modifiedon, ownerid
      } as IdentityResponseDto;
    }

    // Default: return full identity for undefined roles (backward compatibility)
    return identity;
  }
}
