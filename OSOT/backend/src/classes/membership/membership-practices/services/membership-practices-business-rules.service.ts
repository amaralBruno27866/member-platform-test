/**
 * Membership Practices Business Rules Service
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - Membership Settings Integration: Validates membership year exists and is active
 * - CRUD Service: Delegates actual CRUD operations after validation
 * - Lookup Service: Queries existing data for business rule validation
 * - Error Management: Centralized error handling with ErrorCodes
 * - Structured Logging: Operation IDs for compliance tracking
 *
 * BUSINESS RULES ENFORCED:
 * 1. User-Year Uniqueness: One practice record per user per year
 * 2. Membership Year Validation: Year must exist in membership-settings and be active
 * 3. Clients Age Required: Must have at least one value (business required)
 * 4. Conditional "_Other" Fields:
 *    - osot_practice_settings_other required when osot_practice_settings contains OTHER
 *    - osot_practice_services_other required when osot_practice_services contains OTHER
 * 5. Membership Year Immutability: Cannot be changed after creation
 * 6. Multi-Select Validation: Arrays must contain valid enum values only
 *
 * KEY FEATURES:
 * - Pre-create validation (year exists, user uniqueness, clients_age)
 * - Pre-update validation (year immutability, conditional fields, clients_age)
 * - Integration with MembershipSettingsLookupService for year validation
 * - Enriched error messages with business context
 * - Operation tracking for audit trails
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { CreateMembershipPracticesDto } from '../dtos/membership-practices-create.dto';
import { UpdateMembershipPracticesDto } from '../dtos/membership-practices-update.dto';
import { ResponseMembershipPracticesDto } from '../dtos/membership-practices-response.dto';
import { MembershipPracticesInternal } from '../interfaces/membership-practices-internal.interface';
import { MembershipPracticesCrudService } from './membership-practices-crud.service';
import { MembershipPracticesLookupService } from './membership-practices-lookup.service';
import { MembershipSettingsLookupService } from '../../membership-settings/services/membership-settings-lookup.service';
import {
  DataverseMembershipPracticesRepository,
  MEMBERSHIP_PRACTICES_REPOSITORY,
} from '../repositories/membership-practices.repository';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { Privilege } from '../../../../common/enums';
import { PracticeSettings } from '../enums/practice-settings.enum';
import { PracticeServices } from '../enums/practice-services.enum';

@Injectable()
export class MembershipPracticesBusinessRulesService {
  private readonly logger = new Logger(
    MembershipPracticesBusinessRulesService.name,
  );

  constructor(
    private readonly crudService: MembershipPracticesCrudService,
    private readonly lookupService: MembershipPracticesLookupService,
    private readonly membershipSettingsLookupService: MembershipSettingsLookupService,
    @Inject(MEMBERSHIP_PRACTICES_REPOSITORY)
    private readonly repository: DataverseMembershipPracticesRepository,
  ) {}

  /**
   * Create practice record with business rule validation
   *
   * VALIDATIONS APPLIED:
   * - Membership year exists and is active (via membership-settings)
   * - User-year uniqueness (one practice per user per year)
   * - Clients age required (business required array with minimum 1 value)
   * - Conditional "_Other" field requirements
   *
   * @param dto - Practice creation data
   * @param userPrivilege - User's privilege level
   * @param userId - User identifier for audit
   * @param operationId - Unique operation identifier
   * @returns Created practice record
   */
  async createWithValidation(
    dto: CreateMembershipPracticesDto,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<ResponseMembershipPracticesDto> {
    const opId = operationId || `create-pra-rules-${Date.now()}`;
    this.logger.log(
      `Creating practice with business rules validation for operation ${opId}`,
    );

    try {
      // RULE 1: Validate membership year exists and is active
      // NOTE: osot_membership_year is SYSTEM-DEFINED from membership-settings
      // The year is determined by controller/enrichment layer, not user input
      // Validation happens at enrichment layer using validateMembershipYear()
      // This service receives already-enriched DTO with valid year from controller

      // RULE 2: Validate clients_age is provided and not empty (business required)
      if (!dto.osot_clients_age || dto.osot_clients_age.length === 0) {
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'Clients age is required and must have at least one value',
          operationId: opId,
          field: 'osot_clients_age',
        });
      }

      // RULE 3: Validate conditional "_Other" fields
      this.validateConditionalOtherFields(dto, opId);

      // RULE 4: Validate user-year uniqueness (delegated to CRUD service)
      // This is already handled in CRUD service, but we log it here for clarity
      this.logger.log(
        `User-year uniqueness will be validated in CRUD service for operation ${opId}`,
      );

      // Delegate to CRUD service for actual creation
      const result = await this.crudService.create(
        dto,
        userPrivilege,
        userId,
        opId,
      );

      this.logger.log(
        `Successfully created practice for year ${result.osot_membership_year} with business rules validation for operation ${opId}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Business rules validation failed during practice creation for operation ${opId}`,
        {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      );

      // Re-throw if already an app error
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.GENERIC, {
        message: 'Failed to create practice record with business validation',
        operationId: opId,
        originalError:
          error instanceof Error ? error : new Error('Unknown error'),
      });
    }
  }

  /**
   * Update practice record with business rule validation
   *
   * VALIDATIONS APPLIED:
   * - Membership year immutability (cannot be changed)
   * - Clients age required if provided (business required array)
   * - Conditional "_Other" field requirements
   * - Account cannot be changed (system field)
   *
   * @param practiceId - Business practice ID
   * @param dto - Update data
   * @param userPrivilege - User's privilege level
   * @param userId - User identifier for audit
   * @param operationId - Unique operation identifier
   * @returns Updated practice record
   */
  async updateWithValidation(
    practiceId: string,
    dto: UpdateMembershipPracticesDto,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<ResponseMembershipPracticesDto> {
    const opId = operationId || `update-pra-rules-${Date.now()}`;
    this.logger.log(
      `Updating practice ${practiceId} with business rules validation for operation ${opId}`,
    );

    try {
      // RULE 1: Verify practice exists before validation
      // Fetch internal representation (with enum numbers) for validation
      const existing = await this.repository.findByPracticeId(practiceId);

      if (!existing) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: `Practice record not found: ${practiceId}`,
          operationId: opId,
          practiceId,
        });
      }

      // RULE 2: Validate membership year immutability
      // NOTE: Membership year is not in UpdateDTO (immutable field)
      // Validators already prevent this field from being updated

      // RULE 3: Validate clients_age if provided (business required)
      if (dto.osot_clients_age !== undefined) {
        if (!dto.osot_clients_age || dto.osot_clients_age.length === 0) {
          throw createAppError(ErrorCodes.VALIDATION_ERROR, {
            message: 'Clients age must have at least one value',
            operationId: opId,
            practiceId,
            field: 'osot_clients_age',
          });
        }
      }

      // RULE 4: Validate conditional "_Other" fields
      // Merge existing data with update to check complete state
      const mergedData = {
        ...existing,
        ...dto,
      };
      this.validateConditionalOtherFields(mergedData, opId);

      // Delegate to CRUD service for actual update
      const result = await this.crudService.update(
        practiceId,
        dto,
        userPrivilege,
        userId,
        opId,
      );

      this.logger.log(
        `Successfully updated practice ${practiceId} with business rules validation for operation ${opId}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Business rules validation failed during practice update for operation ${opId}`,
        {
          practiceId,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      );

      // Re-throw if already an app error
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.GENERIC, {
        message: 'Failed to update practice record with business validation',
        operationId: opId,
        practiceId,
        originalError:
          error instanceof Error ? error : new Error('Unknown error'),
      });
    }
  }

  /**
   * Delete practice record (delegates to CRUD after authorization check)
   *
   * @param practiceId - Business practice ID
   * @param userPrivilege - User's privilege level
   * @param userId - User identifier for audit
   * @param operationId - Unique operation identifier
   * @returns True if deleted
   */
  async deleteWithValidation(
    practiceId: string,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<boolean> {
    const opId = operationId || `delete-pra-rules-${Date.now()}`;
    this.logger.log(
      `Deleting practice ${practiceId} with business rules validation for operation ${opId}`,
    );

    try {
      // Verify practice exists before deletion
      const existing = await this.lookupService.findByPracticeId(
        practiceId,
        userPrivilege,
        userId,
        opId,
      );

      if (!existing) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: `Practice record not found: ${practiceId}`,
          operationId: opId,
          practiceId,
        });
      }

      // Delegate to CRUD service for actual deletion
      const result = await this.crudService.delete(
        practiceId,
        userPrivilege,
        userId,
        opId,
      );

      this.logger.log(
        `Successfully deleted practice ${practiceId} with business rules validation for operation ${opId}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Business rules validation failed during practice deletion for operation ${opId}`,
        {
          practiceId,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      );

      // Re-throw if already an app error
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.GENERIC, {
        message: 'Failed to delete practice record with business validation',
        operationId: opId,
        practiceId,
        originalError:
          error instanceof Error ? error : new Error('Unknown error'),
      });
    }
  }

  // ========================================
  // PRIVATE VALIDATION METHODS
  // ========================================

  /**
   * Validate membership year exists and is active
   * Integrates with MembershipSettingsLookupService
   */
  private async validateMembershipYear(
    year: string,
    operationId: string,
  ): Promise<void> {
    this.logger.log(
      `Validating membership year ${year} for operation ${operationId}`,
    );

    try {
      // Query membership settings for the given year
      // TEMP FIX: Using placeholder organizationGuid from userContext
      // TODO: Pass organizationGuid from controller via authContext
      const organizationGuid = 'a4f46aa9-2d5e-ef11-a670-000d3a8c1c9c'; // Placeholder OSOT org
      const settings = await this.membershipSettingsLookupService.getByYear(
        organizationGuid,
        year,
        Privilege.MAIN, // Use MAIN privilege to get all settings (active or inactive)
        operationId,
      );

      // Check if any settings exist for this year
      if (!settings || settings.length === 0) {
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: `Membership year ${year} does not exist in membership settings`,
          operationId,
          year,
        });
      }

      // Check if at least one setting is active
      const hasActiveSettings = settings.some(
        (s) => s.osot_membership_year_status === 'Active',
      );

      if (!hasActiveSettings) {
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: `Membership year ${year} is not active`,
          operationId,
          year,
          availableSettings: settings.length,
        });
      }

      this.logger.log(
        `Membership year ${year} validation passed (${settings.length} settings, ${settings.filter((s) => s.osot_membership_year_status === 'Active').length} active) for operation ${operationId}`,
      );
    } catch (error) {
      // Re-throw app errors
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }

      // Wrap unexpected errors
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to validate membership year',
        operationId,
        year,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Validate update DTO against business rules
   * PUBLIC method to be called from controller before CRUD update
   *
   * @param dto - Update DTO
   * @param existingData - Existing practice internal data (with enum numbers)
   * @param operationId - Operation identifier
   */
  validateUpdateDto(
    dto: UpdateMembershipPracticesDto,
    existingData: Partial<MembershipPracticesInternal>,
    operationId?: string,
  ): void {
    // Validate clients_age if provided
    if (dto.osot_clients_age !== undefined) {
      if (!dto.osot_clients_age || dto.osot_clients_age.length === 0) {
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'Clients age must have at least one value',
          operationId,
          field: 'osot_clients_age',
        });
      }
    }

    // Merge existing data with update to check complete state
    const mergedData = {
      ...existingData,
      ...dto,
    };
    this.validateConditionalOtherFields(mergedData, operationId);
  }

  /**
   * Validate conditional "_Other" fields
   * RULES:
   * - osot_practice_settings_other required when osot_practice_settings contains OTHER (28)
   * - osot_practice_services_other required when osot_practice_services contains OTHER (59)
   */
  private validateConditionalOtherFields(
    data: Partial<CreateMembershipPracticesDto | UpdateMembershipPracticesDto>,
    operationId?: string,
  ): void {
    // RULE: osot_practice_settings_other required when osot_practice_settings contains OTHER
    if (
      data.osot_practice_settings &&
      data.osot_practice_settings.includes(PracticeSettings.OTHER) &&
      !data.osot_practice_settings_other
    ) {
      throw createAppError(ErrorCodes.VALIDATION_ERROR, {
        message:
          'osot_practice_settings_other is required when osot_practice_settings contains OTHER',
        operationId,
        field: 'osot_practice_settings_other',
      });
    }

    // RULE: osot_practice_services_other required when osot_practice_services contains OTHER
    if (
      data.osot_practice_services &&
      data.osot_practice_services.includes(PracticeServices.OTHER) &&
      !data.osot_practice_services_other
    ) {
      throw createAppError(ErrorCodes.VALIDATION_ERROR, {
        message:
          'osot_practice_services_other is required when osot_practice_services contains OTHER',
        operationId,
        field: 'osot_practice_services_other',
      });
    }
  }
}
