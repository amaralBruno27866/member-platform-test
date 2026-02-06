/**
 * Additional Insured CRUD Service
 *
 * Lightweight CRUD operations for Additional Insured entity.
 * Handles data transformation and repository interaction.
 *
 * RESPONSIBILITIES:
 * - Map DTOs to internal format and vice versa
 * - Call repository layer for persistence
 * - Validate business rules before operations
 * - Track operations with operationId
 * - Log events for debugging
 *
 * NOT RESPONSIBLE FOR:
 * - Complex orchestration (if needed, create orchestrator service)
 *
 * CRUD MATRIX (Enforced by Business Rules Service):
 * - CREATE: OWNER ✅, ADMIN ❌, MAIN ✅
 * - READ: OWNER (own), ADMIN (all in org), MAIN (all)
 * - UPDATE: OWNER (own), ADMIN (all in org), MAIN (all)
 * - DELETE: OWNER (own), ADMIN ❌, MAIN ✅
 *
 * @file additional-insured-crud.service.ts
 * @module AdditionalInsuredModule
 * @layer Services
 * @since 2026-01-29
 */

import { Injectable, Logger } from '@nestjs/common';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { CacheService } from '../../../../cache/cache.service';
import { DataverseAdditionalInsuredRepository } from '../repositories/dataverse-additional-insured.repository';
import { AdditionalInsuredBusinessRulesService } from './additional-insured-business-rules.service';
import { AdditionalInsuredEventsService } from '../events/additional-insured-events.service';
import { AdditionalInsuredMapper } from '../mappers/additional-insured.mapper';
import { CreateAdditionalInsuredDto } from '../dtos/create-additional-insured.dto';
import { UpdateAdditionalInsuredDto } from '../dtos/update-additional-insured.dto';
import { AdditionalInsuredResponseDto } from '../dtos/additional-insured-response.dto';

/**
 * Additional Insured CRUD Service
 * Pure CRUD operations with business rule validation
 */
@Injectable()
export class AdditionalInsuredCrudService {
  private readonly logger = new Logger(AdditionalInsuredCrudService.name);

  constructor(
    private readonly additionalInsuredRepository: DataverseAdditionalInsuredRepository,
    private readonly businessRulesService: AdditionalInsuredBusinessRulesService,
    private readonly cacheService: CacheService,
    private readonly eventsService: AdditionalInsuredEventsService,
  ) {}

  /**
   * Create a new Additional Insured
   *
   * Validates business rules, then creates in Dataverse.
   *
   * PERMISSION RULES:
   * - OWNER: ✅ Can create
   * - ADMIN: ❌ Cannot create
   * - MAIN: ✅ Can create
   *
   * BUSINESS RULES:
   * - Insurance must exist
   * - Insurance must be type GENERAL (Commercial)
   * - Insurance must be status ACTIVE
   * - Company name must be unique per insurance
   * - All required fields must be provided
   * - Field constraints must be met
   *
   * @param createDto - Additional Insured creation data
   * @param organizationGuid - Organization context for multi-tenancy
   * @param userGuid - User GUID for ownership assignment
   * @param userRole - User role for permission validation (owner/admin/main)
   * @returns Created Additional Insured with generated IDs
   * @throws VALIDATION_ERROR if business rules fail
   * @throws DATAVERSE_SERVICE_ERROR on repository failure
   */
  async create(
    createDto: CreateAdditionalInsuredDto,
    organizationGuid: string,
    userGuid: string,
    userRole: string,
  ): Promise<AdditionalInsuredResponseDto> {
    const operationId = `create_additional_insured_${Date.now()}`;

    try {
      this.logger.log(
        `Creating Additional Insured for operation ${operationId}`,
        {
          companyName: createDto.osot_company_name,
          insuranceGuid: createDto.insuranceGuid,
          userRole,
        },
      );

      // 1. Validate business rules
      const validation = await this.businessRulesService.validateForCreate(
        createDto,
        organizationGuid,
        userRole,
      );

      if (!validation.isValid) {
        this.logger.warn(
          `Validation failed for create operation ${operationId}`,
          {
            errors: validation.errors,
          },
        );

        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'Additional Insured validation failed',
          errors: validation.errors,
          operationId,
        });
      }

      // 2. Map DTO to internal format
      const internalData =
        AdditionalInsuredMapper.createDtoToInternal(createDto);
      internalData.organizationGuid = organizationGuid;

      // 3. Create in repository
      const created = await this.additionalInsuredRepository.create(
        internalData,
        organizationGuid,
      );

      // 4. Map to response DTO
      const response = AdditionalInsuredMapper.internalToResponseDto(created);

      // 5. Publish created event
      this.eventsService.publishAdditionalInsuredCreated({
        additionalInsuredId: created.osot_table_additional_insuredid,
        insuranceId: created.insuranceGuid,
        organizationGuid,
        companyName: created.osot_company_name,
        userGuid,
        timestamp: new Date(),
      });

      // Invalidate cache
      await this.cacheService.invalidatePattern('additional-insured:*');

      this.logger.log(
        `Additional Insured created successfully for operation ${operationId}`,
        {
          additionalInsuredId: created.osot_table_additional_insuredid,
          companyName: created.osot_company_name,
        },
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Error creating Additional Insured for operation ${operationId}`,
        error,
      );

      // Re-throw if already an AppError
      if (error instanceof Error && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to create Additional Insured',
        operationId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Find Additional Insured by ID
   *
   * PERMISSION RULES:
   * - OWNER: ✅ Can read own records only
   * - ADMIN: ✅ Can read all in organization
   * - MAIN: ✅ Can read all records
   *
   * @param id - Additional Insured GUID (osot_table_additional_insuredid)
   * @param organizationGuid - Organization context for multi-tenancy
   * @param userGuid - User GUID for ownership validation
   * @param userRole - User role for permission validation (owner/admin/main)
   * @returns Additional Insured or null if not found
   * @throws PERMISSION_DENIED if user doesn't have access to this record
   */
  async findById(
    id: string,
    organizationGuid: string,
    userGuid: string,
    userRole: string,
  ): Promise<AdditionalInsuredResponseDto | null> {
    const operationId = `find_additional_insured_${Date.now()}`;

    try {
      this.logger.debug(
        `Finding Additional Insured ${id} for operation ${operationId}`,
        {
          userRole,
        },
      );

      // 1. Find in repository
      const found = await this.additionalInsuredRepository.findById(
        id,
        organizationGuid,
      );

      if (!found) {
        this.logger.debug(
          `Additional Insured ${id} not found for operation ${operationId}`,
        );
        return null;
      }

      // 2. Validate READ permission (OWNER can only read own records)
      const normalizedRole = userRole.toLowerCase();
      if (normalizedRole === 'owner') {
        const recordOwnerGuid = found.ownerid;
        if (userGuid !== recordOwnerGuid) {
          this.logger.warn(
            `Permission denied: OWNER ${userGuid} tried to read Additional Insured ${id} owned by ${recordOwnerGuid}`,
          );

          throw createAppError(ErrorCodes.PERMISSION_DENIED, {
            message: 'You do not have permission to access this record',
            operationId,
            recordId: id,
          });
        }
      }

      // 3. Map to response DTO
      const response = AdditionalInsuredMapper.internalToResponseDto(found);

      this.logger.debug(
        `Additional Insured ${id} retrieved successfully for operation ${operationId}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Error finding Additional Insured ${id} for operation ${operationId}`,
        error,
      );

      // Re-throw if already an AppError
      if (error instanceof Error && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to find Additional Insured',
        operationId,
        recordId: id,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Update an existing Additional Insured
   *
   * Validates business rules, then updates in Dataverse.
   *
   * PERMISSION RULES:
   * - OWNER: ✅ Can update own records only
   * - ADMIN: ✅ Can update all in organization
   * - MAIN: ✅ Can update all records
   *
   * BUSINESS RULES:
   * - Record must exist
   * - User must have permission to update (ownership check for OWNER)
   * - Company name must be unique per insurance (if changed)
   * - Immutable fields cannot be modified
   * - Field constraints must be met
   *
   * @param id - Additional Insured GUID (osot_table_additional_insuredid)
   * @param updateDto - Additional Insured update data
   * @param organizationGuid - Organization context for multi-tenancy
   * @param userGuid - User GUID for ownership validation
   * @param userRole - User role for permission validation (owner/admin/main)
   * @returns Updated Additional Insured
   * @throws VALIDATION_ERROR if business rules fail
   * @throws DATAVERSE_SERVICE_ERROR on repository failure
   */
  async update(
    id: string,
    updateDto: UpdateAdditionalInsuredDto,
    organizationGuid: string,
    userGuid: string,
    userRole: string,
  ): Promise<AdditionalInsuredResponseDto> {
    const operationId = `update_additional_insured_${Date.now()}`;

    try {
      this.logger.log(
        `Updating Additional Insured ${id} for operation ${operationId}`,
        {
          companyName: updateDto.osot_company_name,
          userRole,
        },
      );

      // 1. Validate business rules
      const validation = await this.businessRulesService.validateForUpdate(
        id,
        updateDto,
        organizationGuid,
        userGuid,
        userRole,
      );

      if (!validation.isValid) {
        this.logger.warn(
          `Validation failed for update operation ${operationId}`,
          {
            errors: validation.errors,
          },
        );

        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'Additional Insured validation failed',
          errors: validation.errors,
          operationId,
          recordId: id,
        });
      }

      // 2. Map DTO to internal format
      const updateData = AdditionalInsuredMapper.updateDtoToInternal(updateDto);

      // 3. Update in repository
      const updated = await this.additionalInsuredRepository.update(
        id,
        updateData,
        organizationGuid,
      );

      // 4. Map to response DTO
      const response = AdditionalInsuredMapper.internalToResponseDto(updated);

      // 5. Publish updated event (track changed fields)
      const changedFields: string[] = [];
      if (
        updateDto.osot_company_name &&
        updateDto.osot_company_name !== updated.osot_company_name
      ) {
        changedFields.push('osot_company_name');
      }

      if (changedFields.length > 0) {
        this.eventsService.publishAdditionalInsuredUpdated({
          additionalInsuredId: updated.osot_table_additional_insuredid,
          insuranceId: updated.insuranceGuid,
          organizationGuid,
          changes: {
            new: updateData,
            old: { osot_company_name: updated.osot_company_name },
          },
          changedFields,
          userGuid,
          timestamp: new Date(),
        });
      }

      // Invalidate cache
      await this.cacheService.invalidate(`additional-insured:${id}`);
      await this.cacheService.invalidatePattern('additional-insured:*');

      this.logger.log(
        `Additional Insured ${id} updated successfully for operation ${operationId}`,
        {
          companyName: updated.osot_company_name,
        },
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Error updating Additional Insured ${id} for operation ${operationId}`,
        error,
      );

      // Re-throw if already an AppError
      if (error instanceof Error && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to update Additional Insured',
        operationId,
        recordId: id,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Delete an Additional Insured (soft delete)
   *
   * Sets osot_status to 'Inactive' to preserve audit trail.
   *
   * PERMISSION RULES:
   * - OWNER: ✅ Can delete own records only
   * - ADMIN: ❌ Cannot delete
   * - MAIN: ✅ Can delete all records
   *
   * BUSINESS RULES:
   * - Record must exist
   * - User must have permission to delete (ownership check for OWNER)
   *
   * @param id - Additional Insured GUID (osot_table_additional_insuredid)
   * @param organizationGuid - Organization context for multi-tenancy
   * @param userGuid - User GUID for ownership validation
   * @param userRole - User role for permission validation (owner/admin/main)
   * @returns Success boolean
   * @throws VALIDATION_ERROR if business rules fail (e.g., ADMIN trying to delete)
   * @throws DATAVERSE_SERVICE_ERROR on repository failure
   */
  async delete(
    id: string,
    organizationGuid: string,
    userGuid: string,
    userRole: string,
  ): Promise<boolean> {
    const operationId = `delete_additional_insured_${Date.now()}`;

    try {
      this.logger.log(
        `Deleting Additional Insured ${id} for operation ${operationId}`,
        {
          userRole,
        },
      );

      // 1. Validate business rules
      const validation = await this.businessRulesService.validateForDelete(
        id,
        organizationGuid,
        userGuid,
        userRole,
      );

      if (!validation.isValid) {
        this.logger.warn(
          `Validation failed for delete operation ${operationId}`,
          {
            errors: validation.errors,
          },
        );

        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'Additional Insured deletion validation failed',
          errors: validation.errors,
          operationId,
          recordId: id,
        });
      }

      // 2. Get record data before soft delete (for audit trail)
      const recordBeforeDelete =
        await this.additionalInsuredRepository.findById(id, organizationGuid);

      // 3. Soft delete in repository
      const success = await this.additionalInsuredRepository.delete(
        id,
        organizationGuid,
      );

      if (!success) {
        throw new Error('Repository returned false');
      }

      // 4. Publish deleted event
      if (recordBeforeDelete) {
        this.eventsService.publishAdditionalInsuredDeleted({
          additionalInsuredId:
            recordBeforeDelete.osot_table_additional_insuredid,
          insuranceId: recordBeforeDelete.insuranceGuid,
          organizationGuid,
          companyName: recordBeforeDelete.osot_company_name,
          userGuid,
          reason: 'Soft delete - status set to Inactive',
          timestamp: new Date(),
        });
      }

      // Invalidate cache
      await this.cacheService.invalidate(`additional-insured:${id}`);
      await this.cacheService.invalidatePattern('additional-insured:*');

      this.logger.log(
        `Additional Insured ${id} deleted successfully for operation ${operationId}`,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Error deleting Additional Insured ${id} for operation ${operationId}`,
        error,
      );

      // Re-throw if already an AppError
      if (error instanceof Error && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to delete Additional Insured',
        operationId,
        recordId: id,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
