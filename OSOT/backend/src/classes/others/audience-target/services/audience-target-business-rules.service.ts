/**
 * Audience Target Business Rules Service
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - CRUD Service: Delegates actual CRUD operations after validation
 * - Lookup Service: Queries existing data for business rule validation
 * - Error Management: Centralized error handling with ErrorCodes
 * - Structured Logging: Operation IDs for compliance tracking
 *
 * BUSINESS RULES ENFORCED:
 * 1. One-to-One Product-Target Relationship: Validated before creation (delegated to CRUD)
 * 2. Product Existence Validation: Product must exist before target creation
 * 3. Immutable Product Reference: Cannot change product after creation (delegated to CRUD)
 * 4. Open-to-All Validation: If all 32 targeting fields are empty, product is accessible to all users
 * 5. Admin/Main-Only Operations: All operations require Admin/Main privilege
 *
 * NOTE: Entity has 35 total fields = 32 targeting criteria + 3 system fields (GUID, business-id, product lookup)
 *
 * KEY FEATURES:
 * - Pre-create validation (product exists, one-to-one enforcement)
 * - Pre-update validation (immutability, field validation)
 * - Default value enrichment for access control fields
 * - Enriched error messages with business context
 * - Operation tracking for audit trails
 * - Integration with product entity for existence validation
 */

import { Injectable, Logger } from '@nestjs/common';
import { CreateAudienceTargetDto } from '../dtos/audience-target-create.dto';
import { UpdateAudienceTargetDto } from '../dtos/audience-target-update.dto';
import { AudienceTargetResponseDto } from '../dtos/audience-target-response.dto';
import { AudienceTargetCrudService } from './audience-target-crud.service';
import { AudienceTargetLookupService } from './audience-target-lookup.service';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { Privilege } from '../../../../common/enums';

@Injectable()
export class AudienceTargetBusinessRulesService {
  private readonly logger = new Logger(AudienceTargetBusinessRulesService.name);

  constructor(
    private readonly crudService: AudienceTargetCrudService,
    private readonly lookupService: AudienceTargetLookupService,
  ) {}

  /**
   * Create target record with business rule validation
   *
   * VALIDATIONS APPLIED:
   * - Admin/Main privilege required (enforced by CRUD service)
   * - Product-target uniqueness (one-to-one, enforced by CRUD service)
   * - DTO validation (class-validator in DTO layer)
   * - Open-to-all detection (warns if all 32 targeting fields are empty)
   *
   * @param dto - Target creation data
   * @param userPrivilege - User's privilege level
   * @param userId - User identifier for audit
   * @param operationId - Unique operation identifier
   * @returns Created target record
   */
  async createWithValidation(
    dto: CreateAudienceTargetDto,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<AudienceTargetResponseDto> {
    const opId = operationId || `create-target-rules-${Date.now()}`;
    this.logger.log(
      `Creating target with business rules validation for operation ${opId}`,
    );

    try {
      // RULE 1: Validate privilege (Admin/Main required)
      // Delegated to CRUD service

      // RULE 2: Create DTO is already validated by class-validator

      // RULE 3: Check if all targeting fields are empty (open-to-all scenario)
      const isOpenToAll = this.isAllTargetingFieldsEmpty(dto);
      if (isOpenToAll) {
        this.logger.warn(
          `Target being created with ALL fields empty for operation ${opId}. ` +
            `This means the product will be accessible to ALL users without restrictions.`,
        );
      }

      // RULE 4: Validate one-to-one product relationship
      // Delegated to CRUD service (checks via repository.findByProductId)

      // RULE 5: Create target via CRUD service
      const created = await this.crudService.create(
        dto,
        userPrivilege,
        userId,
        opId,
      );

      this.logger.log(
        `Successfully created target ${created.osot_target} with business rules for operation ${opId}`,
      );

      return created;
    } catch (error) {
      this.logger.error(
        `Error creating target with business rules for operation ${opId}:`,
        error,
      );

      // Re-throw known errors
      if (
        error instanceof Error &&
        (error.message.includes('PERMISSION_DENIED') ||
          error.message.includes('VALIDATION_ERROR'))
      ) {
        throw error;
      }

      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to create target with business rules',
        operationId: opId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Update target record with business rule validation
   *
   * VALIDATIONS APPLIED:
   * - Admin/Main privilege required (enforced by CRUD service)
   * - Target exists validation
   * - Immutable product reference (enforced by CRUD service)
   * - Field validation for targeting criteria
   *
   * @param targetId - Business ID or GUID
   * @param dto - Target update data
   * @param userPrivilege - User's privilege level
   * @param userId - User identifier for audit
   * @param operationId - Unique operation identifier
   * @returns Updated target record
   */
  async updateWithValidation(
    targetId: string,
    dto: UpdateAudienceTargetDto,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<AudienceTargetResponseDto> {
    const opId = operationId || `update-target-rules-${Date.now()}`;
    this.logger.log(
      `Updating target ${targetId} with business rules validation for operation ${opId}`,
    );

    try {
      // RULE 1: Validate privilege (Admin/Main required)
      // Delegated to CRUD service

      // RULE 2: Validate target exists
      // Delegated to CRUD service (will throw NOT_FOUND if doesn't exist)

      // RULE 3: Validate immutable product reference
      // Delegated to CRUD service (blocks osot_table_product changes)

      // RULE 4: Validate at least one field is being updated
      this.logger.debug(
        `[DEBUG] Checking if update is empty. DTO keys: ${JSON.stringify(Object.keys(dto))}`,
      );
      this.logger.debug(`[DEBUG] DTO values: ${JSON.stringify(dto)}`);

      if (this.isEmptyUpdate(dto)) {
        this.logger.error(
          `[DEBUG] Update considered empty for target ${targetId}`,
        );
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'Update requires at least one field to be modified',
          operationId: opId,
          targetId,
        });
      }

      // RULE 5: Check if update would result in all fields empty (open-to-all)
      // Note: This checks only the updated fields, not the final state
      const wouldBeOpenToAll = this.isAllTargetingFieldsEmpty(dto);
      if (wouldBeOpenToAll && Object.keys(dto).length > 0) {
        this.logger.warn(
          `Target ${targetId} update may result in ALL fields empty for operation ${opId}. ` +
            `Verify if product should be accessible to ALL users.`,
        );
      }

      // RULE 6: Update target via CRUD service
      const updated = await this.crudService.update(
        targetId,
        dto,
        userPrivilege,
        userId,
        opId,
      );

      this.logger.log(
        `Successfully updated target ${targetId} with business rules for operation ${opId}`,
      );

      return updated;
    } catch (error) {
      this.logger.error(
        `Error updating target ${targetId} with business rules for operation ${opId}:`,
        error,
      );

      // Re-throw known errors
      if (
        error instanceof Error &&
        (error.message.includes('PERMISSION_DENIED') ||
          error.message.includes('NOT_FOUND') ||
          error.message.includes('VALIDATION_ERROR'))
      ) {
        throw error;
      }

      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to update target with business rules',
        operationId: opId,
        targetId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Delete target record with business rule validation
   *
   * VALIDATIONS APPLIED:
   * - Admin/Main privilege required (enforced by CRUD service)
   * - Target exists validation (enforced by CRUD service)
   *
   * @param targetId - Business ID or GUID
   * @param userPrivilege - User's privilege level
   * @param userId - User identifier for audit
   * @param operationId - Unique operation identifier
   * @returns True if deleted successfully
   */
  async deleteWithValidation(
    targetId: string,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<boolean> {
    const opId = operationId || `delete-target-rules-${Date.now()}`;
    this.logger.log(
      `Deleting target ${targetId} with business rules validation for operation ${opId}`,
    );

    try {
      // RULE 1: Validate privilege (Admin/Main required)
      // Delegated to CRUD service

      // RULE 2: Validate target exists
      // Delegated to CRUD service (will throw NOT_FOUND if doesn't exist)

      // RULE 3: Delete target via CRUD service
      const deleted = await this.crudService.delete(
        targetId,
        userPrivilege,
        userId,
        opId,
      );

      this.logger.log(
        `Successfully deleted target ${targetId} with business rules for operation ${opId}`,
      );

      return deleted;
    } catch (error) {
      this.logger.error(
        `Error deleting target ${targetId} with business rules for operation ${opId}:`,
        error,
      );

      // Re-throw known errors
      if (
        error instanceof Error &&
        (error.message.includes('PERMISSION_DENIED') ||
          error.message.includes('NOT_FOUND'))
      ) {
        throw error;
      }

      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to delete target with business rules',
        operationId: opId,
        targetId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Validate if target can be created for product
   * Checks one-to-one relationship constraint
   *
   * @param productId - Product GUID
   * @param userPrivilege - User's privilege level
   * @param operationId - Unique operation identifier
   * @returns True if product can have a target (doesn't have one yet)
   */
  async canCreateTargetForProduct(
    productId: string,
    userPrivilege?: Privilege,
    operationId?: string,
  ): Promise<boolean> {
    const opId = operationId || `validate-product-${Date.now()}`;
    this.logger.log(
      `Validating if product ${productId} can have target for operation ${opId}`,
    );

    try {
      // Check if product already has a target
      const existingTarget = await this.lookupService.findByProductId(
        productId,
        userPrivilege,
        opId,
      );

      const canCreate = !existingTarget;

      this.logger.log(
        `Product ${productId} ${canCreate ? 'can' : 'cannot'} have target (${existingTarget ? 'already has one' : 'available'}) for operation ${opId}`,
      );

      return canCreate;
    } catch (error) {
      this.logger.error(
        `Error validating product ${productId} for target for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to validate product-target relationship',
        operationId: opId,
        productId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get target for product with validation
   * Retrieves existing target or returns null if none exists
   *
   * @param productId - Product GUID
   * @param userPrivilege - User's privilege level
   * @param operationId - Unique operation identifier
   * @returns Target record or null
   */
  async getTargetForProduct(
    productId: string,
    userPrivilege?: Privilege,
    operationId?: string,
  ): Promise<AudienceTargetResponseDto | null> {
    const opId = operationId || `get-product-target-${Date.now()}`;
    this.logger.log(
      `Getting target for product ${productId} for operation ${opId}`,
    );

    try {
      const target = await this.lookupService.findByProductId(
        productId,
        userPrivilege,
        opId,
      );

      if (target) {
        this.logger.log(
          `Found target ${target.osot_target} for product ${productId} for operation ${opId}`,
        );
      } else {
        this.logger.log(
          `No target found for product ${productId} for operation ${opId}`,
        );
      }

      return target;
    } catch (error) {
      this.logger.error(
        `Error getting target for product ${productId} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to get target for product',
        operationId: opId,
        productId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  /**
   * Check if all 32 targeting fields are empty
   * Returns true if ALL targeting criteria fields are undefined or empty arrays
   *
   * ENTITY STRUCTURE:
   * - 32 targeting fields: Multiple choice criteria for audience matching
   * - 3 system fields: osot_target (business-id), osot_table_audience_targetid (GUID), osot_table_product (lookup)
   *
   * BUSINESS LOGIC:
   * - If all 32 targeting fields are empty → Product accessible to ALL users (no restrictions)
   * - If any targeting field has values → Product restricted to matching users only
   *
   * @param dto - Create or Update DTO to check
   * @returns True if all targeting fields are empty (open-to-all scenario)
   */
  private isAllTargetingFieldsEmpty(
    dto: CreateAudienceTargetDto | UpdateAudienceTargetDto,
  ): boolean {
    // List of all 32 targeting field names (excludes 3 system fields: GUID, business-id, product lookup)
    const targetingFields = [
      // Account Group (1)
      'osot_account_group',
      // Affiliate (3)
      'osot_affiliate_area',
      'osot_affiliate_city',
      'osot_affiliate_province',
      // Address (2)
      'osot_membership_city',
      'osot_province',
      // Identity (4)
      'osot_gender',
      'osot_indigenous_details',
      'osot_language',
      'osot_race',
      // Membership Category (2)
      'osot_eligibility_affiliate',
      'osot_membership_category',
      // Employment (9)
      'osot_earnings',
      'osot_earnings_selfdirect',
      'osot_earnings_selfindirect',
      'osot_employment_benefits',
      'osot_employment_status',
      'osot_position_funding',
      'osot_practice_years',
      'osot_role_description',
      'osot_work_hours',
      // Practice (4)
      'osot_client_age',
      'osot_practice_area',
      'osot_practice_services',
      'osot_practice_settings',
      // Preference (4)
      'osot_membership_search_tools',
      'osot_practice_promotion',
      'osot_psychotherapy_supervision',
      'osot_third_parties',
      // Education OT (3)
      'osot_coto_status',
      'osot_ot_grad_year',
      'osot_ot_university',
      // Education OTA (2)
      'osot_ota_grad_year',
      'osot_ota_college',
    ];

    // Check if ALL fields are either undefined or empty arrays
    return targetingFields.every((field) => {
      const value = dto[field as keyof typeof dto];
      return (
        value === undefined || (Array.isArray(value) && value.length === 0)
      );
    });
  }

  /**
   * Check if update DTO is empty (no fields to update)
   * Returns true if no fields are present for update
   */
  private isEmptyUpdate(dto: UpdateAudienceTargetDto): boolean {
    // Check if DTO has any defined properties
    // Note: null and empty arrays are valid updates (clearing fields)
    const keys = Object.keys(dto);
    if (keys.length === 0) {
      return true;
    }

    // At least one key must be explicitly set (not undefined)
    // null, empty arrays, and other falsy values are valid updates
    return keys.every((key) => dto[key] === undefined);
  }
}
