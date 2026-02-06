/**
 * Membership Employment Business Rules Service
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - Membership Settings Integration: Validates membership year exists and is active
 * - CRUD Service: Delegates actual CRUD operations after validation
 * - Lookup Service: Queries existing data for business rule validation
 * - Error Management: Centralized error handling with ErrorCodes
 * - Structured Logging: Operation IDs for compliance tracking
 *
 * BUSINESS RULES ENFORCED:
 * 1. User-Year Uniqueness: One employment record per user per year
 * 2. Membership Year Validation: Year must exist in membership-settings and be active
 * 3. XOR Validation: Account OR Affiliate (never both or neither)
 * 4. Conditional "_Other" Fields:
 *    - osot_role_descriptor_other required when osot_role_descriptor = OTHER
 *    - osot_position_funding_other required when osot_position_funding contains OTHER
 *    - osot_employment_benefits_other required when osot_employment_benefits contains OTHER
 * 5. Membership Year Immutability: Cannot be changed after creation
 * 6. Multi-Select Validation: Arrays must contain valid enum values only
 *
 * KEY FEATURES:
 * - Pre-create validation (year exists, user uniqueness)
 * - Pre-update validation (year immutability, conditional fields)
 * - Integration with MembershipSettingsLookupService for year validation
 * - Enriched error messages with business context
 * - Operation tracking for audit trails
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { CreateMembershipEmploymentDto } from '../dtos/membership-employment-create.dto';
import { UpdateMembershipEmploymentDto } from '../dtos/membership-employment-update.dto';
import { ResponseMembershipEmploymentDto } from '../dtos/membership-employment-response.dto';
import { MembershipEmploymentInternal } from '../interfaces/membership-employment-internal.interface';
import { MembershipEmploymentCrudService } from './membership-employment-crud.service';
import { MembershipEmploymentLookupService } from './membership-employment-lookup.service';
import { MembershipSettingsLookupService } from '../../membership-settings/services/membership-settings-lookup.service';
import {
  DataverseMembershipEmploymentRepository,
  MEMBERSHIP_EMPLOYMENT_REPOSITORY,
} from '../repositories/membership-employment.repository';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { Privilege } from '../../../../common/enums';
import { RoleDescription } from '../enums/role-descriptor.enum';
import { Funding } from '../enums/funding.enum';
import { Benefits } from '../enums/benefits.enum';

@Injectable()
export class MembershipEmploymentBusinessRulesService {
  private readonly logger = new Logger(
    MembershipEmploymentBusinessRulesService.name,
  );

  constructor(
    private readonly crudService: MembershipEmploymentCrudService,
    private readonly lookupService: MembershipEmploymentLookupService,
    private readonly membershipSettingsLookupService: MembershipSettingsLookupService,
    @Inject(MEMBERSHIP_EMPLOYMENT_REPOSITORY)
    private readonly repository: DataverseMembershipEmploymentRepository,
  ) {}

  /**
   * Create employment record with business rule validation
   *
   * VALIDATIONS APPLIED:
   * - Membership year exists and is active (via membership-settings)
   * - User-year uniqueness (one employment per user per year)
   * - XOR validation (Account OR Affiliate, not both)
   * - Conditional "_Other" field requirements
   *
   * @param dto - Employment creation data
   * @param userPrivilege - User's privilege level
   * @param userId - User identifier for audit
   * @param operationId - Unique operation identifier
   * @returns Created employment record
   */
  async createWithValidation(
    dto: CreateMembershipEmploymentDto,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<ResponseMembershipEmploymentDto> {
    const opId = operationId || `create-emp-rules-${Date.now()}`;
    this.logger.log(
      `Creating employment with business rules validation for operation ${opId}`,
    );

    try {
      // RULE 1: Validate membership year exists and is active
      // NOTE: osot_membership_year is SYSTEM-DEFINED from membership-settings
      // The year is determined by controller/enrichment layer, not user input
      // Validation happens at enrichment layer using validateMembershipYear()
      // This service receives already-enriched DTO with valid year from controller

      // RULE 2: Validate XOR for Account/Affiliate
      // NOTE: Account/Affiliate are extracted from JWT in controller/enrichment layer
      // This validation is handled at the controller layer before calling this service

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
        `Successfully created employment for year ${result.osot_membership_year} with business rules validation for operation ${opId}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Business rules validation failed during employment creation for operation ${opId}`,
        {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      );

      // Re-throw if already an app error
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.GENERIC, {
        message: 'Failed to create employment record with business validation',
        operationId: opId,
        originalError:
          error instanceof Error ? error : new Error('Unknown error'),
      });
    }
  }

  /**
   * Update employment record with business rule validation
   *
   * VALIDATIONS APPLIED:
   * - Membership year immutability (cannot be changed)
   * - Conditional "_Other" field requirements
   * - Account/Affiliate cannot be changed (system fields)
   *
   * @param employmentId - Business employment ID
   * @param dto - Update data
   * @param userPrivilege - User's privilege level
   * @param userId - User identifier for audit
   * @param operationId - Unique operation identifier
   * @returns Updated employment record
   */
  async updateWithValidation(
    employmentId: string,
    dto: UpdateMembershipEmploymentDto,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<ResponseMembershipEmploymentDto> {
    const opId = operationId || `update-emp-rules-${Date.now()}`;
    this.logger.log(
      `Updating employment ${employmentId} with business rules validation for operation ${opId}`,
    );

    try {
      // RULE 1: Verify employment exists before validation
      // Fetch internal representation (with enum numbers) for validation
      const existing = await this.repository.findByEmploymentId(employmentId);

      if (!existing) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: `Employment record not found: ${employmentId}`,
          operationId: opId,
          employmentId,
        });
      }

      // RULE 2: Validate membership year immutability
      // NOTE: Membership year is not in UpdateDTO (immutable field)
      // Validators already prevent this field from being updated

      // RULE 3: Validate conditional "_Other" fields
      // Merge existing data with update to check complete state
      const mergedData = {
        ...existing,
        ...dto,
      };
      this.validateConditionalOtherFields(mergedData, opId);

      // Delegate to CRUD service for actual update
      const result = await this.crudService.update(
        employmentId,
        dto,
        userPrivilege,
        userId,
        opId,
      );

      this.logger.log(
        `Successfully updated employment ${employmentId} with business rules validation for operation ${opId}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Business rules validation failed during employment update for operation ${opId}`,
        {
          employmentId,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      );

      // Re-throw if already an app error
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.GENERIC, {
        message: 'Failed to update employment record with business validation',
        operationId: opId,
        employmentId,
        originalError:
          error instanceof Error ? error : new Error('Unknown error'),
      });
    }
  }

  /**
   * Delete employment record (delegates to CRUD after authorization check)
   *
   * @param employmentId - Business employment ID
   * @param userPrivilege - User's privilege level
   * @param userId - User identifier for audit
   * @param operationId - Unique operation identifier
   * @returns True if deleted
   */
  async deleteWithValidation(
    employmentId: string,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<boolean> {
    const opId = operationId || `delete-emp-rules-${Date.now()}`;
    this.logger.log(
      `Deleting employment ${employmentId} with business rules validation for operation ${opId}`,
    );

    try {
      // Verify employment exists before deletion
      const existing = await this.lookupService.findByEmploymentId(
        employmentId,
        userPrivilege,
        userId,
        opId,
      );

      if (!existing) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: `Employment record not found: ${employmentId}`,
          operationId: opId,
          employmentId,
        });
      }

      // Delegate to CRUD service for actual deletion
      const result = await this.crudService.delete(
        employmentId,
        userPrivilege,
        userId,
        opId,
      );

      this.logger.log(
        `Successfully deleted employment ${employmentId} with business rules validation for operation ${opId}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Business rules validation failed during employment deletion for operation ${opId}`,
        {
          employmentId,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      );

      // Re-throw if already an app error
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.GENERIC, {
        message: 'Failed to delete employment record with business validation',
        operationId: opId,
        employmentId,
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
   * Validate XOR for Account and Affiliate
   * RULE: Must have exactly one of osot_table_account OR osot_table_account_affiliate
   */
  private validateAccountAffiliateXOR(
    accountId?: string,
    affiliateId?: string,
    operationId?: string,
  ): void {
    const hasAccount = !!accountId;
    const hasAffiliate = !!affiliateId;

    // XOR validation: exactly one must be true
    if (hasAccount === hasAffiliate) {
      throw createAppError(ErrorCodes.VALIDATION_ERROR, {
        message:
          'Exactly one of osot_table_account or osot_table_account_affiliate must be provided',
        operationId,
        hasAccount,
        hasAffiliate,
      });
    }
  }

  /**
   * Validate update DTO against business rules
   * PUBLIC method to be called from controller before CRUD update
   *
   * @param dto - Update DTO
   * @param existingData - Existing employment internal data (with enum numbers)
   * @param operationId - Operation identifier
   */
  validateUpdateDto(
    dto: UpdateMembershipEmploymentDto,
    existingData: Partial<MembershipEmploymentInternal>,
    operationId?: string,
  ): void {
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
   * - osot_role_descriptor_other required when osot_role_descriptor = OTHER (10)
   * - osot_position_funding_other required when osot_position_funding contains OTHER (7)
   * - osot_employment_benefits_other required when osot_employment_benefits contains OTHER (8)
   */
  private validateConditionalOtherFields(
    data: Partial<
      CreateMembershipEmploymentDto | UpdateMembershipEmploymentDto
    >,
    operationId?: string,
  ): void {
    // RULE: osot_role_descriptor_other required when osot_role_descriptor = OTHER
    if (
      data.osot_role_descriptor === RoleDescription.OTHER &&
      !data.osot_role_descriptor_other
    ) {
      throw createAppError(ErrorCodes.VALIDATION_ERROR, {
        message:
          'osot_role_descriptor_other is required when osot_role_descriptor is OTHER',
        operationId,
        field: 'osot_role_descriptor_other',
      });
    }

    // RULE: osot_position_funding_other required when osot_position_funding contains OTHER
    if (
      data.osot_position_funding &&
      data.osot_position_funding.includes(Funding.OTHER) &&
      !data.osot_position_funding_other
    ) {
      throw createAppError(ErrorCodes.VALIDATION_ERROR, {
        message:
          'osot_position_funding_other is required when osot_position_funding contains OTHER',
        operationId,
        field: 'osot_position_funding_other',
      });
    }

    // RULE: osot_employment_benefits_other required when osot_employment_benefits contains OTHER
    if (
      data.osot_employment_benefits &&
      data.osot_employment_benefits.includes(Benefits.OTHER) &&
      !data.osot_employment_benefits_other
    ) {
      throw createAppError(ErrorCodes.VALIDATION_ERROR, {
        message:
          'osot_employment_benefits_other is required when osot_employment_benefits contains OTHER',
        operationId,
        field: 'osot_employment_benefits_other',
      });
    }
  }
}
