import { Injectable, Logger, Inject } from '@nestjs/common';
import { CreateOtaEducationDto } from '../dtos/create-ota-education.dto';
import { CreateOtaEducationForAccountDto } from '../dtos/create-ota-education-for-account.dto';
import { UpdateOtaEducationDto } from '../dtos/update-ota-education.dto';
import { OtaEducationResponseDto } from '../dtos/ota-education-response.dto';
import { CacheService } from '../../../../cache/cache.service';
import { OtaEducationBusinessRuleService } from './ota-education-business-rule.service';
import {
  OtaEducationRepository,
  OTA_EDUCATION_REPOSITORY,
} from '../interfaces/ota-education-repository.interface';
import { OtaEducationEventsService } from '../events/ota-education.events';
import {
  AccountRepository,
  ACCOUNT_REPOSITORY,
} from '../../account/interfaces/account-repository.interface';
import {
  mapCreateDtoToInternal,
  mapUpdateDtoToInternal,
  mapInternalToResponse,
  mapDataverseToInternal,
} from '../mappers/ota-education.mapper';
import {
  canCreate,
  canRead,
  canWrite,
  canDelete,
} from '../../../../utils/dataverse-app.helper';
import {
  DegreeType,
  Country,
  EducationCategory,
} from '../../../../common/enums';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';

/**
 * OTA Education CRUD Service (ENTERPRISE)
 *
 * MODERNIZED ARCHITECTURE INTEGRATION:
 * - Repository Pattern: OtaEducationRepositoryService for clean data access abstraction
 * - Event-Driven Architecture: OtaEducationEventsService for comprehensive lifecycle notifications
 * - Structured Logging: Logger with operation IDs and security-aware PII redaction
 * - Mappers: Data transformation with mapCreateDtoToInternal, mapInternalToResponse
 * - Security-First Design: Role-based permission checking (canCreate, canRead, canWrite, canDelete)
 * - Business Rule Framework: OtaEducationBusinessRuleService for centralized validation
 * - Error Management: Comprehensive error handling with createAppError and detailed context
 *
 * Handles Create, Read, Update, Delete operations for OTA Education entities.
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
 * - OTA Education business rule validation and enforcement
 * - Work declaration validation specific to OTA
 * - College-country alignment validation
 * - International credential verification tracking
 * - Graduation year business logic
 * - Education category auto-determination
 * - Comprehensive error handling and logging
 * - Operation tracking with unique IDs for comprehensive audit trails
 * - Security-aware logging with PII redaction capabilities
 *
 * Dependencies:
 * - OtaEducationRepositoryService: Clean data access abstraction
 * - OtaEducationBusinessRuleService: Validation and normalization
 * - OtaEducationEventsService: Lifecycle event management
 */
@Injectable()
export class OtaEducationCrudService {
  private readonly logger = new Logger(OtaEducationCrudService.name);

  constructor(
    @Inject(OTA_EDUCATION_REPOSITORY)
    private readonly otaEducationRepository: OtaEducationRepository,
    private readonly businessRuleService: OtaEducationBusinessRuleService,
    private readonly eventsService: OtaEducationEventsService,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepository,
    private readonly cacheService: CacheService,
  ) {
    this.logger.log(
      'OtaEducationCrudService initialized with Enterprise patterns',
    );
  }

  /**
   * Create a new OTA Education record with full business rule validation
   * - Validates work declaration requirements
   * - Ensures college-country alignment
   * - Validates graduation year business logic
   * - Auto-determines education category if not provided
   * - Creates the record using repository
   * - Emits OTA education created event for tracking
   */
  async create(
    createDto: CreateOtaEducationDto,
    userRole?: string,
  ): Promise<OtaEducationResponseDto> {
    const operationId = `ota_education_create_${Date.now()}`;

    this.logger.log(
      `Starting OTA education creation - Operation: ${operationId}`,
      {
        operation: 'create_ota_education',
        operationId,
        userRole: userRole || 'undefined',
        hasWorkDeclaration: !!createDto.osot_work_declaration,
        hasCollege: !!createDto.osot_ota_college,
        timestamp: new Date().toISOString(),
      },
    );

    // Check create permissions
    if (!canCreate(userRole)) {
      this.logger.warn(
        `OTA education creation denied - insufficient privileges - Operation: ${operationId}`,
        {
          operation: 'create_ota_education',
          operationId,
          requiredPrivilege: 'CREATE',
          userRole: userRole || 'undefined',
          error: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        operation: 'create_ota_education',
        operationId,
        message: 'Insufficient permissions to create OTA education',
        requiredRole: 'main or owner',
        currentRole: userRole,
      });
    }

    try {
      // Business rule validation
      const validation =
        await this.businessRuleService.validateEducationRecord(createDto);
      if (!validation.isValid) {
        this.logger.error(
          `OTA education creation validation failed - Operation: ${operationId}`,
          {
            operation: 'create_ota_education_validation',
            operationId,
            errors: validation.errors,
            userRole: userRole || 'undefined',
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
          operation: 'create_ota_education_validation',
          operationId,
          message: `Validation failed: ${validation.errors.join(', ')}`,
          errors: validation.errors,
          dto: createDto,
        });
      }

      // Always auto-determine education category based on business rules
      let determinedCategory: EducationCategory | undefined = undefined;
      if (createDto.osot_ota_grad_year) {
        determinedCategory =
          await this.businessRuleService.determineEducationCategory(
            createDto.osot_ota_grad_year,
          );

        this.logger.log(
          `Education category calculated automatically - Operation: ${operationId}`,
          {
            operation: 'auto_determine_category',
            operationId,
            graduationYear: createDto.osot_ota_grad_year,
            determinedCategory: String(determinedCategory),
            message:
              'Education category calculated automatically based on business rules',
            timestamp: new Date().toISOString(),
          },
        );
      }

      // Create enriched DTO with auto-determined category
      const enrichedDto = {
        ...createDto,
        osot_education_category: determinedCategory,
      };

      // Transform enriched DTO to internal format
      const internalData = mapCreateDtoToInternal(enrichedDto);

      // Create record through repository
      const createdRecord =
        await this.otaEducationRepository.create(internalData);

      // Transform Dataverse response to Internal (standardized pattern)
      const internalResult = mapDataverseToInternal(
        createdRecord as unknown as import('../interfaces/ota-education-dataverse.interface').DataverseOtaEducation,
      );

      // Transform Internal to Response DTO
      const responseDto = mapInternalToResponse(internalResult);

      this.logger.log(
        `OTA education created successfully - Operation: ${operationId}`,
        {
          operation: 'create_ota_education',
          operationId,
          otaEducationId:
            internalResult.osot_ota_education_id?.substring(0, 8) + '...',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      // Fire creation event
      this.eventsService.publishOtaEducationCreated({
        otaEducationId: internalResult.osot_ota_education_id || '',
        accountId: '', // Account ID no longer available - handled via @odata.bind
        userBusinessId: internalResult.osot_user_business_id,
        workDeclaration: internalResult.osot_work_declaration,
        degreeType:
          internalResult.osot_ota_degree_type || DegreeType.DIPLOMA_CREDENTIAL,
        college: internalResult.osot_ota_college,
        graduationYear: internalResult.osot_ota_grad_year,
        country: internalResult.osot_ota_country,
        educationCategory: internalResult.osot_education_category,
        createdBy: 'system',
        timestamp: new Date(),
      });

      return responseDto;
    } catch (error) {
      this.logger.error(
        `OTA education creation failed - Operation: ${operationId}`,
        {
          operation: 'create_ota_education',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      if (error && typeof error === 'object' && 'code' in error) {
        throw error; // Re-throw app errors as-is
      }
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        operation: 'create_ota_education',
        operationId,
        message: 'Failed to create OTA education record',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find OTA Education record by its unique identifier
   * Returns detailed OTA education information using repository and mapper
   */
  async findOne(
    id: string,
    userRole?: string,
  ): Promise<OtaEducationResponseDto> {
    const operationId = Math.random().toString(36).substring(2, 15);

    // Check read permissions
    if (!canRead(userRole || '')) {
      this.logger.warn(
        `OTA education findOne permission denied - Operation: ${operationId}`,
        {
          operation: 'find_ota_education',
          operationId,
          userRole: userRole || 'undefined',
          requiredPermission: 'canRead',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        operation: 'find_ota_education',
        message: 'Insufficient permissions to read OTA education',
        requiredRole: 'main, admin, or owner',
        currentRole: userRole,
      });
    }

    try {
      this.logger.log(
        `OTA education findOne initiated - Operation: ${operationId}`,
        {
          operation: 'find_ota_education',
          operationId,
          otaEducationId: id?.substring(0, 8) + '...',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      const record = await this.otaEducationRepository.findById(id);

      if (!record) {
        this.logger.log(`OTA education not found - Operation: ${operationId}`, {
          operation: 'find_ota_education',
          operationId,
          otaEducationId: id?.substring(0, 8) + '...',
          userRole: userRole || 'undefined',
          found: false,
          timestamp: new Date().toISOString(),
        });

        throw createAppError(ErrorCodes.NOT_FOUND, {
          operation: 'find_ota_education',
          operationId,
          entityId: id,
          entityType: 'OtaEducation',
        });
      }

      this.logger.log(
        `OTA education found successfully - Operation: ${operationId}`,
        {
          operation: 'find_ota_education',
          operationId,
          otaEducationId: id?.substring(0, 8) + '...',
          userRole: userRole || 'undefined',
          found: true,
          timestamp: new Date().toISOString(),
        },
      );

      return mapInternalToResponse(record);
    } catch (error) {
      this.logger.error(
        `OTA education findOne failed - Operation: ${operationId}`,
        {
          operation: 'find_ota_education',
          operationId,
          otaEducationId: id?.substring(0, 8) + '...',
          error: error instanceof Error ? error.message : 'Unknown error',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      if (error && typeof error === 'object' && 'code' in error) {
        throw error; // Re-throw app errors as-is
      }
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        operation: 'find_ota_education',
        operationId,
        entityId: id,
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find all OTA Education records associated with a specific account
   * Accepts Business ID and converts to GUID for Dataverse lookup
   * Returns array of OTA education DTOs for display
   */
  async findByAccount(
    accountBusinessId: string,
    userRole?: string,
  ): Promise<OtaEducationResponseDto[]> {
    // Check read permissions
    if (!canRead(userRole || '')) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        operation: 'find_ota_education_by_account',
        message: 'Insufficient permissions to read OTA education records',
        requiredRole: 'main, admin, or owner',
        currentRole: userRole,
      });
    }

    try {
      // Convert Business ID to GUID for Dataverse lookup
      const account =
        await this.accountRepository.findByBusinessId(accountBusinessId);

      if (!account) {
        throw createAppError(ErrorCodes.ACCOUNT_NOT_FOUND, {
          operation: 'find_ota_education_by_account',
          message: `Account not found: ${accountBusinessId}`,
          accountBusinessId,
        });
      }

      const accountGuid = account.osot_table_accountid;

      // Check cache first
      const cacheKey = this.cacheService.buildOtaEducationKey(accountGuid);
      const cached =
        await this.cacheService.get<OtaEducationResponseDto[]>(cacheKey);

      if (cached) {
        return cached;
      }

      // Query Dataverse if cache miss
      const records =
        await this.otaEducationRepository.findByAccountId(accountGuid);
      const result = records.map((record) => mapInternalToResponse(record));

      // Cache the result
      await this.cacheService.set(cacheKey, result);

      return result;
    } catch (error) {
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        operation: 'find_ota_education_by_account',
        accountId: accountBusinessId,
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find OTA Education record by User Business ID
   * User Business ID is unique across the system (20 characters max)
   */
  async findByUserBusinessId(
    userBusinessId: string,
    userRole?: string,
  ): Promise<OtaEducationResponseDto | null> {
    const operationId = Math.random().toString(36).substring(2, 15);

    // Check read permissions
    if (!canRead(userRole || '')) {
      this.logger.warn(
        `OTA education findByUserBusinessId permission denied - Operation: ${operationId}`,
        {
          operation: 'find_ota_education_by_business_id',
          operationId,
          userRole: userRole || 'undefined',
          requiredPermission: 'canRead',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        operation: 'find_ota_education_by_business_id',
        message: 'Insufficient permissions to read OTA education',
        requiredRole: 'main, admin, or owner',
        currentRole: userRole,
      });
    }

    try {
      // Redact sensitive data from logs (show only first 4 chars)
      const redactedBusinessId = userBusinessId?.substring(0, 4) + '...';

      this.logger.log(
        `OTA education findByUserBusinessId initiated - Operation: ${operationId}`,
        {
          operation: 'find_ota_education_by_business_id',
          operationId,
          userBusinessId: redactedBusinessId,
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      // Use findByAccountId and filter by userBusinessId locally
      // Since findByUserBusinessId doesn't exist in repository
      const records =
        await this.otaEducationRepository.findByAccountId(userBusinessId);
      const record = records.find(
        (r) => r.osot_user_business_id === userBusinessId,
      );

      if (!record) {
        this.logger.log(
          `OTA education not found by business ID - Operation: ${operationId}`,
          {
            operation: 'find_ota_education_by_business_id',
            operationId,
            userBusinessId: redactedBusinessId,
            userRole: userRole || 'undefined',
            found: false,
            timestamp: new Date().toISOString(),
          },
        );
        return null;
      }

      this.logger.log(
        `OTA education found by business ID - Operation: ${operationId}`,
        {
          operation: 'find_ota_education_by_business_id',
          operationId,
          userBusinessId: redactedBusinessId,
          userRole: userRole || 'undefined',
          found: true,
          timestamp: new Date().toISOString(),
        },
      );

      return mapInternalToResponse(record);
    } catch (error) {
      this.logger.error(
        `OTA education findByUserBusinessId failed - Operation: ${operationId}`,
        {
          operation: 'find_ota_education_by_business_id',
          operationId,
          userBusinessId: userBusinessId?.substring(0, 4) + '...',
          error: error instanceof Error ? error.message : 'Unknown error',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        operation: 'find_ota_education_by_business_id',
        operationId,
        userBusinessId: userBusinessId?.substring(0, 4) + '...',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update an existing OTA Education record with full validation
   * - Validates work declaration and business rules
   * - Ensures college-country alignment is maintained
   * - Auto-updates education category if graduation year changed
   * - Updates using repository pattern
   * - Emits update events for tracking
   */
  async update(
    id: string,
    updateDto: UpdateOtaEducationDto,
    userRole?: string,
  ): Promise<OtaEducationResponseDto> {
    // Generate operation ID for tracking
    const operationId = `ota-education-update-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    this.logger.log(
      `Starting OTA education update - Operation: ${operationId}`,
      {
        operation: 'update',
        operationId,
        otaEducationId: id,
        userRole,
        timestamp: new Date().toISOString(),
      },
    );

    try {
      // Check write permissions
      if (!canWrite(userRole || '')) {
        this.logger.warn(
          `Permission denied for OTA education update - Operation: ${operationId}`,
          {
            operation: 'update',
            operationId,
            otaEducationId: id,
            requiredRole: 'main, admin, or owner',
            currentRole: userRole,
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          operation: 'update',
          operationId,
          message: 'Insufficient permissions to update OTA education',
          requiredRole: 'main, admin, or owner',
          currentRole: userRole,
        });
      }

      // ID Resolution: Convert Business ID → GUID if needed
      const isBusinessId = /^osot-ota-ed-\d{7}$/.test(id);
      const isGuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          id,
        );

      let targetOtaEducationId = id;

      if (isBusinessId) {
        // Find the OTA education by business ID to get its GUID
        const otaEducation =
          await this.otaEducationRepository.findByBusinessId(id);
        if (!otaEducation) {
          this.logger.error(
            `OTA education not found for update - Operation: ${operationId}`,
            {
              operation: 'update',
              operationId,
              otaEducationId: id,
              idType: 'businessId',
              error: 'OTA_EDUCATION_NOT_FOUND',
              timestamp: new Date().toISOString(),
            },
          );

          throw createAppError(ErrorCodes.NOT_FOUND, {
            message: 'OTA education not found for update',
            operationId,
            operation: 'update',
            resourceId: id,
          });
        }
        targetOtaEducationId = otaEducation.osot_table_ota_educationid;
        this.logger.debug(
          `Resolved business ID to GUID - Operation: ${operationId}`,
          {
            businessId: id,
            guid: targetOtaEducationId,
            timestamp: new Date().toISOString(),
          },
        );
      } else if (!isGuid) {
        // Try to find by business ID first
        const otaEducationByBusinessId =
          await this.otaEducationRepository.findByBusinessId(id);
        if (otaEducationByBusinessId) {
          targetOtaEducationId =
            otaEducationByBusinessId.osot_table_ota_educationid;
        } else {
          targetOtaEducationId = id;
        }
      }

      this.logger.debug(
        `Fetching existing OTA education record - Operation: ${operationId}`,
        {
          operation: 'update',
          operationId,
          otaEducationId: targetOtaEducationId,
          timestamp: new Date().toISOString(),
        },
      );

      // Verify record exists using resolved GUID
      const existingRecord =
        await this.otaEducationRepository.findById(targetOtaEducationId);
      if (!existingRecord) {
        this.logger.warn(
          `OTA education not found for update - Operation: ${operationId}`,
          {
            operation: 'update',
            operationId,
            otaEducationId: id,
            targetOtaEducationId,
            error: 'RECORD_NOT_FOUND',
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.NOT_FOUND, {
          operation: 'update',
          operationId,
          entityId: targetOtaEducationId,
          entityType: 'OtaEducation',
        });
      }

      this.logger.debug(
        `Validating OTA education update data - Operation: ${operationId}`,
        {
          operation: 'update',
          operationId,
          otaEducationId: targetOtaEducationId,
          hasDegreeType: updateDto.osot_ota_degree_type !== undefined,
          hasCollege: !!updateDto.osot_ota_college,
          timestamp: new Date().toISOString(),
        },
      );

      // Business rule validation
      const validation =
        await this.businessRuleService.validateEducationRecord(updateDto);
      if (!validation.isValid) {
        this.logger.warn(
          `OTA education update validation failed - Operation: ${operationId}`,
          {
            operation: 'update',
            operationId,
            otaEducationId: id,
            validationErrors: validation.errors,
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
          operation: 'update',
          operationId,
          message: `Validation failed: ${validation.errors.join(', ')}`,
          errors: validation.errors,
          dto: updateDto,
        });
      }

      // Note: osot_ota_grad_year and osot_education_category are read-only fields
      // managed by the system scheduler and cannot be updated via this endpoint

      // Transform DTO to internal format
      const internalData = mapUpdateDtoToInternal(updateDto);

      this.logger.debug(
        `Updating OTA education record - Operation: ${operationId}`,
        {
          operation: 'update',
          operationId,
          otaEducationId: targetOtaEducationId,
          timestamp: new Date().toISOString(),
        },
      );

      // Update record through repository
      const updatedRecord = await this.otaEducationRepository.update(
        targetOtaEducationId,
        internalData,
      );

      // Phase 7: Invalidate cache after successful update
      if (updatedRecord && existingRecord.osot_user_business_id) {
        const cacheKey = this.cacheService.buildOtaEducationKey(
          existingRecord.osot_user_business_id,
        );
        await this.cacheService.invalidate(cacheKey);
      }

      if (!updatedRecord) {
        this.logger.error(
          `OTA education update failed - Repository returned null - Operation: ${operationId}`,
          {
            operation: 'update',
            operationId,
            otaEducationId: targetOtaEducationId,
            error: 'REPOSITORY_NULL_RESPONSE',
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.GENERIC, {
          message: 'Failed to update OTA education - no data returned',
          operationId,
          otaEducationId: targetOtaEducationId,
          operation: 'update',
        });
      }

      // Success logging
      this.logger.log(
        `OTA education updated successfully - Operation: ${operationId}`,
        {
          operation: 'update',
          operationId,
          otaEducationId: targetOtaEducationId,
          timestamp: new Date().toISOString(),
        },
      );

      // Fire update event
      this.eventsService.publishOtaEducationUpdated({
        otaEducationId: targetOtaEducationId,
        accountId: '', // Account ID no longer available - handled via @odata.bind
        changes: {
          old: {
            userBusinessId: existingRecord.osot_user_business_id,
            workDeclaration: existingRecord.osot_work_declaration,
            degreeType:
              existingRecord.osot_ota_degree_type ||
              DegreeType.DIPLOMA_CREDENTIAL,
            college: existingRecord.osot_ota_college,
            graduationYear: existingRecord.osot_ota_grad_year,
            country: existingRecord.osot_ota_country,
            educationCategory: existingRecord.osot_education_category,
          },
          new: {
            userBusinessId: updatedRecord.osot_user_business_id,
            workDeclaration: updatedRecord.osot_work_declaration,
            degreeType:
              updatedRecord.osot_ota_degree_type ||
              DegreeType.DIPLOMA_CREDENTIAL,
            college: updatedRecord.osot_ota_college,
            graduationYear: updatedRecord.osot_ota_grad_year,
            country: updatedRecord.osot_ota_country,
            educationCategory: updatedRecord.osot_education_category,
          },
        },
        updatedBy: 'system',
        timestamp: new Date(),
      });

      // Transform and return response
      return mapInternalToResponse(updatedRecord);
    } catch (error) {
      this.logger.error(
        `OTA education update failed - Operation: ${operationId}`,
        {
          operation: 'update',
          operationId,
          otaEducationId: id,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
        },
      );

      if (error && typeof error === 'object' && 'code' in error) {
        throw error; // Re-throw app errors as-is
      }
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        operation: 'update',
        operationId,
        entityId: id,
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Delete an OTA Education record
   */
  async remove(
    id: string,
    userPrivilege: string = 'main',
  ): Promise<{ success: boolean; message: string }> {
    // Check permissions - only main users can delete
    if (!canDelete(userPrivilege)) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        operation: 'delete',
        privilege: userPrivilege,
      });
    }

    try {
      // Verify record exists
      const existingRecord = await this.otaEducationRepository.findById(id);
      if (!existingRecord) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          entityId: id,
          entityType: 'OtaEducation',
        });
      }

      // Delete record through repository
      await this.otaEducationRepository.delete(id);

      // Fire deletion event
      this.eventsService.publishOtaEducationDeleted({
        otaEducationId: id,
        accountId: '', // Account ID no longer available - handled via @odata.bind
        userBusinessId: existingRecord.osot_user_business_id,
        college: existingRecord.osot_ota_college,
        graduationYear: existingRecord.osot_ota_grad_year,
        reason: 'Administrative deletion',
        deletedBy: 'system',
        timestamp: new Date(),
      });

      return {
        success: true,
        message: `OTA Education record ${id} successfully deleted`,
      };
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error; // Re-throw app errors as-is
      }
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        operation: 'delete',
        entityId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Validate education record data completeness
   */
  async validateDataCompleteness(
    id: string,
    scenario: 'registration' | 'profile_completion' = 'registration',
    userPrivilege: string = 'owner',
  ): Promise<{ isComplete: boolean; missingFields: string[] }> {
    // Check permissions
    if (!canRead(userPrivilege)) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        operation: 'validate',
        privilege: userPrivilege,
      });
    }

    try {
      const record = await this.otaEducationRepository.findById(id);
      if (!record) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          entityId: id,
          entityType: 'OtaEducation',
        });
      }

      return this.businessRuleService.validateDataCompleteness(
        record,
        scenario,
      );
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error; // Re-throw app errors as-is
      }
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        operation: 'validateDataCompleteness',
        entityId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check if international verification is required for education record
   */
  async checkInternationalVerificationRequired(
    id: string,
    userPrivilege: string = 'owner',
  ): Promise<{ required: boolean; reason?: string }> {
    // Check permissions
    if (!canRead(userPrivilege)) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        operation: 'check_verification',
        privilege: userPrivilege,
      });
    }

    try {
      const record = await this.otaEducationRepository.findById(id);
      if (!record) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          entityId: id,
          entityType: 'OtaEducation',
        });
      }

      const required =
        this.businessRuleService.checkInternationalVerificationRequired(
          record.osot_ota_country,
          record.osot_ota_college,
        );

      let reason: string | undefined;
      if (required) {
        if (record.osot_ota_country !== Country.CANADA) {
          reason = 'International education requires credential verification';
        } else {
          reason = 'Other college selection requires manual verification';
        }
      }

      return { required, reason };
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error; // Re-throw app errors as-is
      }
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        operation: 'checkInternationalVerificationRequired',
        entityId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Generate education summary for display
   */
  async generateEducationSummary(
    id: string,
    userPrivilege: string = 'owner',
  ): Promise<{ summary: string }> {
    // Check permissions
    if (!canRead(userPrivilege)) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        operation: 'generate_summary',
        privilege: userPrivilege,
      });
    }

    try {
      const record = await this.otaEducationRepository.findById(id);
      if (!record) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          entityId: id,
          entityType: 'OtaEducation',
        });
      }

      const summary = this.businessRuleService.generateEducationSummary(record);
      return { summary };
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error; // Re-throw app errors as-is
      }
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        operation: 'generateEducationSummary',
        entityId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Calculate professional experience years for education record
   */
  async calculateExperienceYears(
    id: string,
    userPrivilege: string = 'owner',
  ): Promise<{ experienceYears: number }> {
    // Check permissions
    if (!canRead(userPrivilege)) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        operation: 'calculate_experience',
        privilege: userPrivilege,
      });
    }

    try {
      const record = await this.otaEducationRepository.findById(id);
      if (!record) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          entityId: id,
          entityType: 'OtaEducation',
        });
      }

      const experienceYears = this.businessRuleService.calculateExperienceYears(
        record.osot_ota_grad_year,
      );

      return { experienceYears };
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error; // Re-throw app errors as-is
      }
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        operation: 'calculateExperienceYears',
        entityId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ========================================
  // ACCOUNT INTEGRATION METHODS
  // ========================================

  /**
   * Create OTA education record for account integration
   * Simplified creation process with secure defaults and minimal validation
   *
   * This method is specifically designed for Account creation workflow:
   * - Bypasses complex business rule validation for faster account setup
   * - Uses safe defaults for all optional fields
   * - Fast execution for high-volume account registration
   * - Minimal required data (only essential OTA education fields)
   *
   * @param dto - Simplified DTO with minimal required fields
   * @returns Created OTA education record as response DTO
   */
  async createForAccountIntegration(
    dto: CreateOtaEducationForAccountDto,
  ): Promise<OtaEducationResponseDto> {
    const operationId = `create_ota_education_for_account_${Date.now()}`;

    this.logger.log(
      `Creating OTA education record for account integration - Operation: ${operationId}`,
      {
        operation: 'createForAccountIntegration',
        operationId,
        hasWorkDeclaration: !!dto.osot_work_declaration,
        hasCollege: !!dto.osot_ota_college,
        hasGradYear: !!dto.osot_ota_grad_year,
        timestamp: new Date().toISOString(),
      },
    );

    try {
      // Always auto-determine education category based on business rules
      let determinedCategory: EducationCategory | undefined = undefined;
      if (dto.osot_ota_grad_year) {
        determinedCategory =
          await this.businessRuleService.determineEducationCategory(
            dto.osot_ota_grad_year,
          );

        this.logger.log(
          `Education category calculated automatically - Operation: ${operationId}`,
          {
            operationId,
            graduationYear: dto.osot_ota_grad_year,
            determinedCategory: String(determinedCategory),
            message:
              'Education category calculated automatically based on business rules',
          },
        );
      }

      // Create enriched DTO with auto-determined category
      const enrichedDto = {
        ...dto,
        osot_education_category: determinedCategory,
      };

      // Transform enriched DTO to internal format using the create mapper
      const internalData = mapCreateDtoToInternal(enrichedDto);

      // Create the OTA education record using repository
      const createdRecord =
        await this.otaEducationRepository.create(internalData);

      // Transform response using mapper
      const responseDto = mapInternalToResponse(createdRecord);

      if (!responseDto) {
        throw createAppError(ErrorCodes.INTERNAL_ERROR, {
          message: 'Failed to create OTA education record for account',
          operationId,
        });
      }

      this.logger.log(
        `OTA education record created successfully for account integration - Operation: ${operationId}`,
        {
          operation: 'createForAccountIntegration',
          operationId,
          otaEducationId: responseDto.osot_ota_education_id,
          timestamp: new Date().toISOString(),
        },
      );

      return responseDto;
    } catch (error) {
      this.logger.error(
        `OTA education creation failed for account integration - Operation: ${operationId}`,
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
        message: 'Failed to create OTA education record for account',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get OTA education data completeness assessment
   * Returns analysis of how complete an OTA education record is
   */
  async getDataCompletenessAssessment(id: string): Promise<{
    completenessScore: number;
    missingFields: string[];
    recommendations: string[];
  } | null> {
    const record = await this.otaEducationRepository.findById(id);
    if (!record) {
      return null;
    }

    const assessment = this.businessRuleService.validateDataCompleteness(
      record,
      'profile_completion',
    );

    return {
      completenessScore: assessment.isComplete ? 100 : 50, // Simplified scoring
      missingFields: assessment.missingFields,
      recommendations: assessment.missingFields.map(
        (field) =>
          `Please provide ${field} for complete OTA education information`,
      ),
    };
  }
}
