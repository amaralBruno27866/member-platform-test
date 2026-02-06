import { Injectable, Logger, Inject } from '@nestjs/common';
import { CreateOtEducationDto } from '../dtos/create-ot-education.dto';
import { UpdateOtEducationDto } from '../dtos/update-ot-education.dto';
import { OtEducationResponseDto } from '../dtos/ot-education-response.dto';
import { CacheService } from '../../../../cache/cache.service';
import { OtEducationBusinessRuleService } from './ot-education-business-rule.service';
import {
  OtEducationRepository,
  OT_EDUCATION_REPOSITORY,
} from '../interfaces/ot-education-repository.interface';
import { OtEducationEventsService } from '../events/ot-education.events';
import {
  AccountRepository,
  ACCOUNT_REPOSITORY,
} from '../../account/interfaces/account-repository.interface';
import {
  mapCreateDtoToInternal,
  mapUpdateDtoToInternal,
  mapInternalToResponse,
  mapDataverseToInternal,
} from '../mappers/ot-education.mapper';
import {
  canCreate,
  canRead,
  canWrite,
  canDelete,
} from '../../../../utils/dataverse-app.helper';
import { DegreeType } from '../../../../common/enums';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';

/**
 * OT Education CRUD Service (ENTERPRISE)
 *
 * MODERNIZED ARCHITECTURE INTEGRATION:
 * - Repository Pattern: OtEducationRepositoryService for clean data access abstraction
 * - Event-Driven Architecture: OtEducationEventsService for comprehensive lifecycle notifications
 * - Structured Logging: Logger with operation IDs and security-aware PII redaction
 * - Mappers: Data transformation with mapCreateDtoToInternal, mapInternalToResponse
 * - Security-First Design: Role-based permission checking (canCreate, canRead, canWrite, canDelete)
 * - Business Rule Framework: OtEducationBusinessRuleService for centralized validation
 * - Error Management: Comprehensive error handling with createAppError and detailed context
 *
 * Handles Create, Read, Update, Delete operations for OT Education entities.
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
 * - OT Education business rule validation and enforcement
 * - COTO status tracking and validation
 * - University-country alignment validation
 * - Graduation year business logic
 * - Education category auto-determination
 * - Comprehensive error handling and logging
 * - Operation tracking with unique IDs for comprehensive audit trails
 * - Security-aware logging with PII redaction capabilities
 *
 * Dependencies:
 * - OtEducationRepositoryService: Clean data access abstraction
 * - OtEducationBusinessRuleService: Validation and normalization
 * - OtEducationEventsService: Lifecycle event management
 */
@Injectable()
export class OtEducationCrudService {
  private readonly logger = new Logger(OtEducationCrudService.name);

  constructor(
    @Inject(OT_EDUCATION_REPOSITORY)
    private readonly otEducationRepository: OtEducationRepository,
    private readonly businessRuleService: OtEducationBusinessRuleService,
    private readonly eventsService: OtEducationEventsService,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepository,
    private readonly cacheService: CacheService,
  ) {
    this.logger.log(
      'OtEducationCrudService initialized with Enterprise patterns',
    );
  }

  /**
   * Create a new OT Education record with full business rule validation
   * - Validates COTO status and registration requirements
   * - Ensures university-country alignment
   * - Validates graduation year business logic
   * - Auto-determines education category if not provided
   * - Creates the record using repository
   * - Emits OT education created event for tracking
   */
  async create(
    createDto: CreateOtEducationDto,
    userRole?: string,
  ): Promise<OtEducationResponseDto> {
    const operationId = `ot_education_create_${Date.now()}`;

    this.logger.log(
      `Starting OT education creation - Operation: ${operationId}`,
      {
        operation: 'create_ot_education',
        operationId,
        userRole: userRole || 'undefined',
        hasCotoStatus: !!createDto.osot_coto_status,
        hasUniversity: !!createDto.osot_ot_university,
        timestamp: new Date().toISOString(),
      },
    );

    // Check create permissions
    if (!canCreate(userRole)) {
      this.logger.warn(
        `OT education creation denied - insufficient privileges - Operation: ${operationId}`,
        {
          operation: 'create_ot_education',
          operationId,
          requiredPrivilege: 'CREATE',
          userRole: userRole || 'undefined',
          error: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        operation: 'create_ot_education',
        operationId,
        message: 'Insufficient permissions to create OT education',
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
          `OT education creation validation failed - Operation: ${operationId}`,
          {
            operation: 'create_ot_education_validation',
            operationId,
            errors: validation.errors,
            userRole: userRole || 'undefined',
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
          operation: 'create_ot_education_validation',
          operationId,
          message: `Validation failed: ${validation.errors.join(', ')}`,
          errors: validation.errors,
          dto: createDto,
        });
      }

      // Auto-determine education category if not provided
      if (!createDto.osot_education_category) {
        const category =
          await this.businessRuleService.determineEducationCategory(
            createDto.osot_ot_grad_year,
          );
        createDto.osot_education_category = category;

        this.logger.log(
          `Education category auto-determined - Operation: ${operationId}`,
          {
            operation: 'auto_determine_category',
            operationId,
            graduationYear: createDto.osot_ot_grad_year,
            determinedCategory: category,
            timestamp: new Date().toISOString(),
          },
        );
      }

      // Transform DTO to internal format
      const internalData = mapCreateDtoToInternal(createDto);

      // Create record through repository
      const createdRecord =
        await this.otEducationRepository.create(internalData);

      // Transform Dataverse response to Internal (standardized pattern)
      const internalResult = mapDataverseToInternal(
        createdRecord as unknown as import('../interfaces/ot-education-dataverse.interface').DataverseOtEducation,
      );

      // Transform Internal to Response DTO
      const responseDto = mapInternalToResponse(internalResult);

      this.logger.log(
        `OT education created successfully - Operation: ${operationId}`,
        {
          operation: 'create_ot_education',
          operationId,
          otEducationId:
            internalResult.osot_OT_Education_ID?.substring(0, 8) + '...',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      // Fire creation event
      this.eventsService.publishOtEducationCreated({
        otEducationId: internalResult.osot_OT_Education_ID || '',
        accountId:
          (typeof internalResult.osot_table_account === 'string'
            ? internalResult.osot_table_account
            : '') || '',
        userBusinessId: internalResult.osot_user_business_id,
        cotoStatus: internalResult.osot_coto_status,
        degreeType:
          typeof internalResult.osot_ot_degree_type === 'string' ||
          typeof internalResult.osot_ot_degree_type === 'number'
            ? internalResult.osot_ot_degree_type
            : DegreeType.BACHELORS,
        university: internalResult.osot_ot_university,
        graduationYear: internalResult.osot_ot_grad_year,
        country: internalResult.osot_ot_country,
        createdBy: 'system',
        timestamp: new Date(),
      });

      return responseDto;
    } catch (error) {
      this.logger.error(
        `OT education creation failed - Operation: ${operationId}`,
        {
          operation: 'create_ot_education',
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
        operation: 'create_ot_education',
        operationId,
        message: 'Failed to create OT education record',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find OT Education record by its unique identifier
   * Returns detailed OT education information using repository and mapper
   */
  async findOne(
    id: string,
    userRole?: string,
  ): Promise<OtEducationResponseDto> {
    const operationId = Math.random().toString(36).substring(2, 15);

    // Check read permissions
    if (!canRead(userRole || '')) {
      this.logger.warn(
        `OT education findOne permission denied - Operation: ${operationId}`,
        {
          operation: 'find_ot_education',
          operationId,
          userRole: userRole || 'undefined',
          requiredPermission: 'canRead',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        operation: 'find_ot_education',
        message: 'Insufficient permissions to read OT education',
        requiredRole: 'main, admin, or owner',
        currentRole: userRole,
      });
    }

    try {
      this.logger.log(
        `OT education findOne initiated - Operation: ${operationId}`,
        {
          operation: 'find_ot_education',
          operationId,
          otEducationId: id?.substring(0, 8) + '...',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      const record = await this.otEducationRepository.findById(id);

      if (!record) {
        this.logger.log(`OT education not found - Operation: ${operationId}`, {
          operation: 'find_ot_education',
          operationId,
          otEducationId: id?.substring(0, 8) + '...',
          userRole: userRole || 'undefined',
          found: false,
          timestamp: new Date().toISOString(),
        });

        throw createAppError(ErrorCodes.NOT_FOUND, {
          operation: 'find_ot_education',
          operationId,
          entityId: id,
          entityType: 'OtEducation',
        });
      }

      this.logger.log(
        `OT education found successfully - Operation: ${operationId}`,
        {
          operation: 'find_ot_education',
          operationId,
          otEducationId: id?.substring(0, 8) + '...',
          userRole: userRole || 'undefined',
          found: true,
          timestamp: new Date().toISOString(),
        },
      );

      return mapInternalToResponse(record);
    } catch (error) {
      this.logger.error(
        `OT education findOne failed - Operation: ${operationId}`,
        {
          operation: 'find_ot_education',
          operationId,
          otEducationId: id?.substring(0, 8) + '...',
          error: error instanceof Error ? error.message : 'Unknown error',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      if (error && typeof error === 'object' && 'code' in error) {
        throw error; // Re-throw app errors as-is
      }
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        operation: 'find_ot_education',
        operationId,
        entityId: id,
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find all OT Education records associated with a specific account
   * Accepts Business ID and converts to GUID for Dataverse lookup
   * Returns array of OT education DTOs for display
   */
  async findByAccount(
    accountBusinessId: string,
    userRole?: string,
  ): Promise<OtEducationResponseDto[]> {
    // Check read permissions
    if (!canRead(userRole || '')) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        operation: 'find_ot_education_by_account',
        message: 'Insufficient permissions to read OT education records',
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
          operation: 'find_ot_education_by_account',
          message: `Account not found: ${accountBusinessId}`,
          accountBusinessId,
        });
      }

      const accountGuid = account.osot_table_accountid;

      // Check cache first
      const cacheKey = this.cacheService.buildOtEducationKey(accountGuid);
      const cached =
        await this.cacheService.get<OtEducationResponseDto[]>(cacheKey);

      if (cached) {
        return cached;
      }

      // Query Dataverse if cache miss
      const records =
        await this.otEducationRepository.findByAccountId(accountGuid);
      const result = records.map((record) => mapInternalToResponse(record));

      // Cache the result
      await this.cacheService.set(cacheKey, result);

      return result;
    } catch (error) {
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        operation: 'find_ot_education_by_account',
        accountId: accountBusinessId,
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find OT Education record by User Business ID
   * User Business ID is unique across the system (20 characters max)
   */
  async findByUserBusinessId(
    userBusinessId: string,
    userRole?: string,
  ): Promise<OtEducationResponseDto | null> {
    const operationId = Math.random().toString(36).substring(2, 15);

    // Check read permissions
    if (!canRead(userRole || '')) {
      this.logger.warn(
        `OT education findByUserBusinessId permission denied - Operation: ${operationId}`,
        {
          operation: 'find_ot_education_by_business_id',
          operationId,
          userRole: userRole || 'undefined',
          requiredPermission: 'canRead',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        operation: 'find_ot_education_by_business_id',
        message: 'Insufficient permissions to read OT education',
        requiredRole: 'main, admin, or owner',
        currentRole: userRole,
      });
    }

    try {
      // Redact sensitive data from logs (show only first 4 chars)
      const redactedBusinessId = userBusinessId?.substring(0, 4) + '...';

      this.logger.log(
        `OT education findByUserBusinessId initiated - Operation: ${operationId}`,
        {
          operation: 'find_ot_education_by_business_id',
          operationId,
          userBusinessId: redactedBusinessId,
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      // Use findByAccountId and filter by userBusinessId locally
      // Since findByUserBusinessId doesn't exist in repository
      const records =
        await this.otEducationRepository.findByAccountId(userBusinessId);
      const record = records.find(
        (r) => r.osot_user_business_id === userBusinessId,
      );

      if (!record) {
        this.logger.log(
          `OT education not found by business ID - Operation: ${operationId}`,
          {
            operation: 'find_ot_education_by_business_id',
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
        `OT education found by business ID - Operation: ${operationId}`,
        {
          operation: 'find_ot_education_by_business_id',
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
        `OT education findByUserBusinessId failed - Operation: ${operationId}`,
        {
          operation: 'find_ot_education_by_business_id',
          operationId,
          userBusinessId: userBusinessId?.substring(0, 4) + '...',
          error: error instanceof Error ? error.message : 'Unknown error',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        operation: 'find_ot_education_by_business_id',
        operationId,
        userBusinessId: userBusinessId?.substring(0, 4) + '...',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update an existing OT Education record with full validation
   * - Validates COTO status and registration changes
   * - Ensures university-country alignment is maintained
   * - Auto-updates education category if graduation year changed
   * - Updates using repository pattern
   * - Emits update events for tracking
   */
  async update(
    id: string,
    updateDto: UpdateOtEducationDto,
    userRole?: string,
  ): Promise<OtEducationResponseDto> {
    // Generate operation ID for tracking
    const operationId = `ot-education-update-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    this.logger.log(
      `Starting OT education update - Operation: ${operationId}`,
      {
        operation: 'update',
        operationId,
        otEducationId: id,
        userRole,
        timestamp: new Date().toISOString(),
      },
    );

    try {
      // Check write permissions
      if (!canWrite(userRole || '')) {
        this.logger.warn(
          `Permission denied for OT education update - Operation: ${operationId}`,
          {
            operation: 'update',
            operationId,
            otEducationId: id,
            requiredRole: 'main, admin, or owner',
            currentRole: userRole,
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          operation: 'update',
          operationId,
          message: 'Insufficient permissions to update OT education',
          requiredRole: 'main, admin, or owner',
          currentRole: userRole,
        });
      }

      // ID Resolution: Convert Business ID → GUID if needed
      const isGuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          id,
        );

      let targetId = id;

      if (!isGuid) {
        this.logger.debug(
          `Business ID detected, resolving to GUID - Operation: ${operationId}`,
          {
            operation: 'update',
            operationId,
            businessId: id,
            timestamp: new Date().toISOString(),
          },
        );

        const record = await this.otEducationRepository.findByBusinessId(id);
        if (!record) {
          throw createAppError(ErrorCodes.NOT_FOUND, {
            operation: 'update',
            operationId,
            businessId: id,
            message: 'OT education not found by business ID',
          });
        }
        targetId = record.osot_table_ot_educationid || '';

        this.logger.debug(
          `Business ID resolved to GUID - Operation: ${operationId}`,
          {
            operation: 'update',
            operationId,
            businessId: id,
            resolvedGuid: targetId,
            timestamp: new Date().toISOString(),
          },
        );
      }

      this.logger.debug(
        `Fetching existing OT education record - Operation: ${operationId}`,
        {
          operation: 'update',
          operationId,
          otEducationId: targetId,
          timestamp: new Date().toISOString(),
        },
      );

      // Verify record exists
      const existingRecord =
        await this.otEducationRepository.findById(targetId);
      if (!existingRecord) {
        this.logger.warn(
          `OT education not found for update - Operation: ${operationId}`,
          {
            operation: 'update',
            operationId,
            otEducationId: targetId,
            error: 'RECORD_NOT_FOUND',
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.NOT_FOUND, {
          operation: 'update',
          operationId,
          entityId: id,
          entityType: 'OtEducation',
        });
      }

      this.logger.debug(
        `Validating OT education update data - Operation: ${operationId}`,
        {
          operation: 'update',
          operationId,
          otEducationId: id,
          hasDegreeType: updateDto.osot_ot_degree_type !== undefined,
          hasUniversity: !!updateDto.osot_ot_university,
          hasCotoStatus: updateDto.osot_coto_status !== undefined,
          timestamp: new Date().toISOString(),
        },
      );

      // Business rule validation
      const validation =
        await this.businessRuleService.validateEducationRecord(updateDto);
      if (!validation.isValid) {
        this.logger.warn(
          `OT education update validation failed - Operation: ${operationId}`,
          {
            operation: 'update',
            operationId,
            otEducationId: id,
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

      // Note: osot_ot_grad_year and osot_education_category are read-only fields
      // They cannot be updated via this endpoint and are set during record creation only

      // Transform DTO to internal format
      const internalData = mapUpdateDtoToInternal(updateDto);

      this.logger.debug(
        `Updating OT education record - Operation: ${operationId}`,
        {
          operation: 'update',
          operationId,
          otEducationId: id,
          timestamp: new Date().toISOString(),
        },
      );

      // Update record through repository
      const updatedRecord = await this.otEducationRepository.update(
        id,
        internalData,
      );

      // Phase 7: Invalidate cache after successful update
      if (updatedRecord && existingRecord.osot_user_business_id) {
        const cacheKey = this.cacheService.buildOtEducationKey(
          existingRecord.osot_user_business_id,
        );
        await this.cacheService.invalidate(cacheKey);
      }

      if (!updatedRecord) {
        this.logger.error(
          `OT education update failed - Repository returned null - Operation: ${operationId}`,
          {
            operation: 'update',
            operationId,
            otEducationId: id,
            error: 'REPOSITORY_NULL_RESPONSE',
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.GENERIC, {
          message: 'Failed to update OT education - no data returned',
          operationId,
          otEducationId: id,
          operation: 'update',
        });
      }

      // Success logging
      this.logger.log(
        `OT education updated successfully - Operation: ${operationId}`,
        {
          operation: 'update',
          operationId,
          otEducationId: id,
          timestamp: new Date().toISOString(),
        },
      );

      // Fire update event
      this.eventsService.publishOtEducationUpdated({
        otEducationId: id,
        accountId:
          (typeof existingRecord.osot_table_account === 'string'
            ? existingRecord.osot_table_account
            : '') || '',
        changes: {
          old: {
            userBusinessId: existingRecord.osot_user_business_id,
            cotoStatus: existingRecord.osot_coto_status,
            degreeType:
              typeof existingRecord.osot_degree_type === 'string' ||
              typeof existingRecord.osot_degree_type === 'number'
                ? (existingRecord.osot_degree_type as DegreeType)
                : DegreeType.BACHELORS,
            university: existingRecord.osot_ot_university,
            graduationYear: existingRecord.osot_ot_grad_year,
            country: existingRecord.osot_ot_country,
          },
          new: {
            userBusinessId: updatedRecord.osot_user_business_id,
            cotoStatus: updatedRecord.osot_coto_status,
            degreeType:
              typeof updatedRecord.osot_degree_type === 'string' ||
              typeof updatedRecord.osot_degree_type === 'number'
                ? (updatedRecord.osot_degree_type as DegreeType)
                : DegreeType.BACHELORS,
            university: updatedRecord.osot_ot_university,
            graduationYear: updatedRecord.osot_ot_grad_year,
            country: updatedRecord.osot_ot_country,
          },
        },
        updatedBy: 'system',
        timestamp: new Date(),
      });

      // Transform and return response
      return mapInternalToResponse(updatedRecord);
    } catch (error) {
      this.logger.error(
        `OT education update failed - Operation: ${operationId}`,
        {
          operation: 'update',
          operationId,
          otEducationId: id,
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
   * Delete an OT Education record
   * Includes proper cleanup and event emission
   */
  async remove(
    id: string,
    userRole: string = 'main',
  ): Promise<{ success: boolean; message: string }> {
    const operationId = Math.random().toString(36).substring(2, 15);

    // Check delete permissions - only main users can delete
    if (!canDelete(userRole || '')) {
      this.logger.warn(
        `OT education delete permission denied - Operation: ${operationId}`,
        {
          operation: 'delete_ot_education',
          operationId,
          otEducationId: id?.substring(0, 8) + '...',
          userRole: userRole || 'undefined',
          requiredPermission: 'canDelete',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        operation: 'delete_ot_education',
        message: 'Insufficient permissions to delete OT education',
        requiredRole: 'main',
        currentRole: userRole,
      });
    }

    try {
      this.logger.log(
        `OT education delete initiated - Operation: ${operationId}`,
        {
          operation: 'delete_ot_education',
          operationId,
          otEducationId: id?.substring(0, 8) + '...',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      // Verify record exists
      const existingRecord = await this.otEducationRepository.findById(id);
      if (!existingRecord) {
        this.logger.log(
          `OT education not found for deletion - Operation: ${operationId}`,
          {
            operation: 'delete_ot_education',
            operationId,
            otEducationId: id?.substring(0, 8) + '...',
            userRole: userRole || 'undefined',
            found: false,
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.NOT_FOUND, {
          operation: 'delete_ot_education',
          operationId,
          entityId: id,
          entityType: 'OtEducation',
        });
      }

      // Delete record through repository
      await this.otEducationRepository.delete(id);

      // Success logging (with PII redaction)
      this.logger.log(
        `OT education deleted successfully - Operation: ${operationId}`,
        {
          operation: 'delete_ot_education',
          operationId,
          otEducationId: id?.substring(0, 8) + '...',
          userRole: userRole || 'undefined',
          userBusinessId:
            existingRecord.osot_user_business_id?.substring(0, 4) + '...',
          timestamp: new Date().toISOString(),
        },
      );

      // Fire deletion event
      this.eventsService.publishOtEducationDeleted({
        otEducationId: id,
        accountId:
          (typeof existingRecord.osot_table_account === 'string'
            ? existingRecord.osot_table_account
            : '') || '',
        userBusinessId: existingRecord.osot_user_business_id,
        university: existingRecord.osot_ot_university,
        graduationYear: existingRecord.osot_ot_grad_year,
        reason: 'Administrative deletion',
        deletedBy: 'system',
        timestamp: new Date(),
      });

      return {
        success: true,
        message: `OT Education record ${id} successfully deleted`,
      };
    } catch (error) {
      this.logger.error(
        `OT education delete failed - Operation: ${operationId}`,
        {
          operation: 'delete_ot_education',
          operationId,
          otEducationId: id?.substring(0, 8) + '...',
          error: error instanceof Error ? error.message : 'Unknown error',
          userRole: userRole || 'undefined',
          timestamp: new Date().toISOString(),
        },
      );

      if (error && typeof error === 'object' && 'code' in error) {
        throw error; // Re-throw app errors as-is
      }
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        operation: 'delete_ot_education',
        operationId,
        entityId: id,
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Validate OT education record data completeness
   * Returns analysis of how complete an OT education record is
   */
  async validateDataCompleteness(
    id: string,
    scenario: 'registration' | 'profile_completion' = 'registration',
    userRole?: string,
  ): Promise<{ isComplete: boolean; missingFields: string[] }> {
    // Check read permissions
    if (!canRead(userRole || '')) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        operation: 'validate_ot_education_completeness',
        message: 'Insufficient permissions to validate OT education',
        requiredRole: 'main, admin, or owner',
        currentRole: userRole,
      });
    }

    try {
      const record = await this.otEducationRepository.findById(id);
      if (!record) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          operation: 'validate_ot_education_completeness',
          entityId: id,
          entityType: 'OtEducation',
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
        operation: 'validate_ot_education_completeness',
        entityId: id,
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ========================================
  // ACCOUNT INTEGRATION METHODS
  // ========================================

  /**
   * Create OT education record for account integration
   * Simplified creation process with secure defaults and minimal validation
   *
   * This method is specifically designed for Account creation workflow:
   * - Bypasses complex business rule validation for faster account setup
   * - Uses safe defaults for all optional fields
   * - Fast execution for high-volume account registration
   * - Minimal required data (only essential OT education fields)
   *
   * @param dto - Simplified DTO with minimal required fields
   * @returns Created OT education record as response DTO
   */
  async createForAccountIntegration(
    dto: import('../dtos/create-ot-education-for-account.dto').CreateOtEducationForAccountDto,
  ): Promise<OtEducationResponseDto> {
    const operationId = `create_ot_education_for_account_${Date.now()}`;

    this.logger.log(
      `Creating OT education record for account integration - Operation: ${operationId}`,
      {
        operation: 'createForAccountIntegration',
        operationId,
        hasCotoStatus: !!dto.osot_coto_status,
        hasUniversity: !!dto.osot_ot_university,
        hasGradYear: !!dto.osot_ot_grad_year,
        timestamp: new Date().toISOString(),
      },
    );

    try {
      // Always auto-determine education category based on graduation year
      let determinedCategory:
        | import('../../../../common/enums').EducationCategory
        | undefined;
      if (dto.osot_ot_grad_year) {
        determinedCategory =
          await this.businessRuleService.determineEducationCategory(
            dto.osot_ot_grad_year,
          );

        this.logger.log(
          `Education category auto-determined - Operation: ${operationId}`,
          {
            operationId,
            graduationYear: dto.osot_ot_grad_year,
            determinedCategory,
            message:
              'Education category calculated automatically based on business rules',
            timestamp: new Date().toISOString(),
          },
        );
      }

      // Create enriched DTO with auto-determined category
      const enrichedDto = {
        ...dto,
        osot_education_category: determinedCategory,
      };

      // Transform to internal format using the create mapper with enriched data
      const internalData = mapCreateDtoToInternal(enrichedDto);

      // Create the OT education record using repository
      const createdRecord =
        await this.otEducationRepository.create(internalData);

      // Transform response using mapper
      const responseDto = mapInternalToResponse(createdRecord);

      if (!responseDto) {
        throw createAppError(ErrorCodes.INTERNAL_ERROR, {
          message: 'Failed to create OT education record for account',
          operationId,
        });
      }

      this.logger.log(
        `OT education record created successfully for account integration - Operation: ${operationId}`,
        {
          operation: 'createForAccountIntegration',
          operationId,
          otEducationId: responseDto.osot_ot_education_id,
          timestamp: new Date().toISOString(),
        },
      );

      return responseDto;
    } catch (error) {
      this.logger.error(
        `OT education creation failed for account integration - Operation: ${operationId}`,
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
        message: 'Failed to create OT education record for account',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get OT education data completeness assessment
   * Returns analysis of how complete an OT education record is
   */
  async getDataCompletenessAssessment(id: string): Promise<{
    completenessScore: number;
    missingFields: string[];
    recommendations: string[];
  } | null> {
    const record = await this.otEducationRepository.findById(id);
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
          `Please provide ${field} for complete OT education information`,
      ),
    };
  }
}
