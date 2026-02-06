/**
 * Additional Insured Business Rules Service
 *
 * Validates business logic for Additional Insured operations.
 * Ensures data integrity and enforces business constraints before database operations.
 *
 * CRUD Matrix (Permission Enforcement):
 * - OWNER: CRUD (own records only) - Can create, read, update, delete own additional insureds
 * - ADMIN: RU (all in org) - Can read and update all, cannot create or delete
 * - MAIN: Full CRUD - Complete access to all operations
 *
 * Business Rules Validated:
 * 1. Insurance relationship validation
 *    - Insurance must exist
 *    - Insurance must be type GENERAL (Commercial) only
 *    - Insurance must be in ACTIVE status
 * 2. Company name uniqueness per insurance
 * 3. Permission validation based on user role
 * 4. Required field validation
 * 5. Immutable field protection
 *
 * @file additional-insured-business-rules.service.ts
 * @module AdditionalInsuredModule
 * @layer Services - Business Rules
 */

import { Injectable, Logger } from '@nestjs/common';
import { DataverseAdditionalInsuredRepository } from '../repositories';
import { InsuranceLookupService } from '../../insurance/services/insurance-lookup.service';
import { CreateAdditionalInsuredDto } from '../dtos/create-additional-insured.dto';
import { UpdateAdditionalInsuredDto } from '../dtos/update-additional-insured.dto';
import { ADDITIONAL_INSURED_VALIDATION_RULES } from '../constants';
import { InsuranceStatus } from '../../insurance/enum';

/**
 * Validation result interface
 */
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Business Rules Service for Additional Insured
 */
@Injectable()
export class AdditionalInsuredBusinessRulesService {
  private readonly logger = new Logger(
    AdditionalInsuredBusinessRulesService.name,
  );

  constructor(
    private readonly additionalInsuredRepository: DataverseAdditionalInsuredRepository,
    private readonly insuranceLookupService: InsuranceLookupService,
  ) {}

  /**
   * Validate Additional Insured data for creation
   *
   * @param dto - Create Additional Insured DTO
   * @param organizationGuid - Organization GUID for multi-tenant context
   * @param userRole - User role for permission validation
   * @returns Validation result with errors if invalid
   */
  async validateForCreate(
    dto: CreateAdditionalInsuredDto,
    organizationGuid: string,
    userRole: string,
  ): Promise<ValidationResult> {
    const operationId = `validate_create_additional_insured_${Date.now()}`;
    const errors: string[] = [];

    try {
      this.logger.debug(
        `Validating Additional Insured creation - Operation: ${operationId}`,
      );

      // 1. Validate permissions (CRUD Matrix)
      const permissionError = this.validateCreatePermission(userRole);
      if (permissionError) {
        errors.push(permissionError);
      }

      // 2. Validate required fields
      const requiredFieldErrors = this.validateRequiredFieldsForCreate(dto);
      errors.push(...requiredFieldErrors);

      // If basic validations fail, return early
      if (errors.length > 0) {
        return { isValid: false, errors };
      }

      // 3. Validate Insurance relationship
      const insuranceError = await this.validateInsuranceForAdditionalInsured(
        dto.insuranceGuid,
        organizationGuid,
      );
      if (insuranceError) {
        errors.push(insuranceError);
      }

      // 4. Validate company name uniqueness
      const uniquenessError = await this.validateCompanyNameUniqueness(
        dto.osot_company_name,
        dto.insuranceGuid,
        organizationGuid,
      );
      if (uniquenessError) {
        errors.push(uniquenessError);
      }

      // 5. Validate field formats and constraints
      const fieldErrors = this.validateFieldConstraints(dto);
      errors.push(...fieldErrors);

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      this.logger.error(
        `Error during validation - Operation: ${operationId}`,
        error,
      );
      return {
        isValid: false,
        errors: ['Validation failed due to internal error'],
      };
    }
  }

  /**
   * Validate Additional Insured data for update
   *
   * @param id - Additional Insured GUID
   * @param dto - Update Additional Insured DTO
   * @param organizationGuid - Organization GUID for multi-tenant context
   * @param userGuid - User GUID for ownership validation
   * @param userRole - User role for permission validation
   * @returns Validation result with errors if invalid
   */
  async validateForUpdate(
    id: string,
    dto: UpdateAdditionalInsuredDto,
    organizationGuid: string,
    userGuid: string,
    userRole: string,
  ): Promise<ValidationResult> {
    const operationId = `validate_update_additional_insured_${Date.now()}`;
    const errors: string[] = [];

    try {
      this.logger.debug(
        `Validating Additional Insured update for ID: ${id} - Operation: ${operationId}`,
      );

      // 1. Verify record exists
      const existing = await this.additionalInsuredRepository.findById(
        id,
        organizationGuid,
      );

      if (!existing) {
        errors.push('Additional Insured not found');
        return { isValid: false, errors };
      }

      // 2. Validate permissions (CRUD Matrix)
      const permissionError = this.validateUpdatePermission(
        userRole,
        userGuid,
        existing.ownerid || '',
      );
      if (permissionError) {
        errors.push(permissionError);
      }

      // 3. Validate company name uniqueness if changing
      if (
        dto.osot_company_name &&
        dto.osot_company_name !== existing.osot_company_name
      ) {
        const uniquenessError = await this.validateCompanyNameUniqueness(
          dto.osot_company_name,
          existing.insuranceGuid || '',
          organizationGuid,
          id, // Exclude current record from uniqueness check
        );
        if (uniquenessError) {
          errors.push(uniquenessError);
        }
      }

      // 4. Validate immutable fields are not being changed
      const immutableError = this.validateImmutableFields(dto);
      if (immutableError) {
        errors.push(immutableError);
      }

      // 5. Validate field constraints
      const fieldErrors = this.validateFieldConstraints(dto);
      errors.push(...fieldErrors);

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      this.logger.error(
        `Error during update validation - Operation: ${operationId}`,
        error,
      );
      return {
        isValid: false,
        errors: ['Validation failed due to internal error'],
      };
    }
  }

  /**
   * Validate delete permission
   *
   * @param id - Additional Insured GUID
   * @param organizationGuid - Organization GUID
   * @param userGuid - User GUID
   * @param userRole - User role
   * @returns Validation result with errors if invalid
   */
  async validateForDelete(
    id: string,
    organizationGuid: string,
    userGuid: string,
    userRole: string,
  ): Promise<ValidationResult> {
    const operationId = `validate_delete_additional_insured_${Date.now()}`;
    const errors: string[] = [];

    try {
      this.logger.debug(
        `Validating Additional Insured deletion for ID: ${id} - Operation: ${operationId}`,
      );

      // 1. Verify record exists
      const existing = await this.additionalInsuredRepository.findById(
        id,
        organizationGuid,
      );

      if (!existing) {
        errors.push('Additional Insured not found');
        return { isValid: false, errors };
      }

      // 2. Validate permissions (CRUD Matrix)
      const permissionError = this.validateDeletePermission(
        userRole,
        userGuid,
        existing.ownerid || '',
      );
      if (permissionError) {
        errors.push(permissionError);
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      this.logger.error(
        `Error during delete validation - Operation: ${operationId}`,
        error,
      );
      return {
        isValid: false,
        errors: ['Validation failed due to internal error'],
      };
    }
  }

  // ========================================
  // PERMISSION VALIDATION (CRUD MATRIX)
  // ========================================

  /**
   * Validate CREATE permission
   * - OWNER: Can create ✅
   * - ADMIN: Cannot create ❌
   * - MAIN: Can create ✅
   */
  private validateCreatePermission(userRole: string): string | null {
    const normalizedRole = userRole.toLowerCase();

    if (normalizedRole === 'admin') {
      return 'ADMIN role cannot create Additional Insureds. Only OWNER and MAIN can create.';
    }

    if (!['owner', 'main'].includes(normalizedRole)) {
      return `Role '${userRole}' does not have permission to create Additional Insureds.`;
    }

    return null;
  }

  /**
   * Validate UPDATE permission
   * - OWNER: Can update own records only ✅
   * - ADMIN: Can update all in org ✅
   * - MAIN: Can update all ✅
   */
  private validateUpdatePermission(
    userRole: string,
    userGuid: string,
    recordOwnerGuid: string,
  ): string | null {
    const normalizedRole = userRole.toLowerCase();

    // OWNER: Can only update own records
    if (normalizedRole === 'owner') {
      if (userGuid !== recordOwnerGuid) {
        return 'OWNER role can only update their own Additional Insureds.';
      }
    }

    // ADMIN and MAIN: Can update all
    if (!['owner', 'admin', 'main'].includes(normalizedRole)) {
      return `Role '${userRole}' does not have permission to update Additional Insureds.`;
    }

    return null;
  }

  /**
   * Validate DELETE permission
   * - OWNER: Can delete own records only ✅
   * - ADMIN: Cannot delete ❌
   * - MAIN: Can delete all ✅
   */
  private validateDeletePermission(
    userRole: string,
    userGuid: string,
    recordOwnerGuid: string,
  ): string | null {
    const normalizedRole = userRole.toLowerCase();

    // ADMIN: Cannot delete
    if (normalizedRole === 'admin') {
      return 'ADMIN role cannot delete Additional Insureds. Only OWNER (own records) and MAIN can delete.';
    }

    // OWNER: Can only delete own records
    if (normalizedRole === 'owner') {
      if (userGuid !== recordOwnerGuid) {
        return 'OWNER role can only delete their own Additional Insureds.';
      }
    }

    // MAIN: Can delete all
    if (!['owner', 'main'].includes(normalizedRole)) {
      return `Role '${userRole}' does not have permission to delete Additional Insureds.`;
    }

    return null;
  }

  // ========================================
  // BUSINESS LOGIC VALIDATION
  // ========================================

  /**
   * Validate Insurance relationship
   * - Insurance must exist
   * - Must be type GENERAL (Commercial)
   * - Must be ACTIVE status
   */
  private async validateInsuranceForAdditionalInsured(
    insuranceGuid: string,
    organizationGuid: string,
  ): Promise<string | null> {
    try {
      // Find insurance
      const insurance = await this.insuranceLookupService.findById(
        insuranceGuid,
        organizationGuid,
      );

      if (!insurance) {
        return 'Insurance not found. Additional Insureds can only be created for existing insurance certificates.';
      }

      // Validate insurance type (must be GENERAL/Commercial)
      // Insurance stores type as string, but we compare with enum display name
      const insuranceType = String(insurance.osot_insurance_type);
      const generalTypeName = 'General'; // From Dataverse choice
      if (insuranceType !== generalTypeName) {
        return `Additional Insureds can only be created for GENERAL (Commercial) insurance. Current type: ${insuranceType}`;
      }

      // Validate insurance status (must be ACTIVE)
      if (insurance.osot_insurance_status !== InsuranceStatus.ACTIVE) {
        return `Additional Insureds can only be created for ACTIVE insurance. Current status: ${insurance.osot_insurance_status}`;
      }

      return null;
    } catch (error) {
      this.logger.error(`Error validating insurance ${insuranceGuid}`, error);
      return 'Failed to validate insurance relationship';
    }
  }

  /**
   * Validate company name uniqueness per insurance
   */
  private async validateCompanyNameUniqueness(
    companyName: string,
    insuranceGuid: string,
    organizationGuid: string,
    excludeId?: string,
  ): Promise<string | null> {
    try {
      // Normalize to UPPERCASE for comparison
      const normalizedName = companyName.trim().toUpperCase();

      // Check if company name already exists for this insurance
      const existing = await this.additionalInsuredRepository.findByCompanyName(
        normalizedName,
        insuranceGuid,
        organizationGuid,
      );

      if (existing && existing.osot_table_additional_insuredid !== excludeId) {
        return `Company name '${companyName}' already exists for this insurance. Company names must be unique per insurance certificate.`;
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Error checking company name uniqueness: ${companyName}`,
        error,
      );
      return 'Failed to validate company name uniqueness';
    }
  }

  /**
   * Validate required fields for creation
   */
  private validateRequiredFieldsForCreate(
    dto: CreateAdditionalInsuredDto,
  ): string[] {
    const errors: string[] = [];

    if (!dto.insuranceGuid) {
      errors.push('Insurance GUID is required');
    }

    if (!dto.osot_company_name) {
      errors.push('Company name is required');
    }

    if (!dto.osot_address) {
      errors.push('Address is required');
    }

    if (!dto.osot_city) {
      errors.push('City is required');
    }

    if (!dto.osot_province) {
      errors.push('Province is required');
    }

    if (!dto.osot_postal_code) {
      errors.push('Postal code is required');
    }

    return errors;
  }

  /**
   * Validate field constraints (length, format, etc.)
   */
  private validateFieldConstraints(
    dto: CreateAdditionalInsuredDto | UpdateAdditionalInsuredDto,
  ): string[] {
    const errors: string[] = [];

    // Company name validation
    if (dto.osot_company_name) {
      const rules = ADDITIONAL_INSURED_VALIDATION_RULES.COMPANY_NAME;
      if (dto.osot_company_name.length < rules.MIN_LENGTH) {
        errors.push(
          `Company name must be at least ${rules.MIN_LENGTH} characters`,
        );
      }
      if (dto.osot_company_name.length > rules.MAX_LENGTH) {
        errors.push(
          `Company name must not exceed ${rules.MAX_LENGTH} characters`,
        );
      }
      if (!rules.PATTERN.test(dto.osot_company_name)) {
        errors.push(rules.ERROR_MESSAGE);
      }
    }

    // Address validation
    if (dto.osot_address) {
      const rules = ADDITIONAL_INSURED_VALIDATION_RULES.ADDRESS;
      if (dto.osot_address.length < rules.MIN_LENGTH) {
        errors.push(`Address must be at least ${rules.MIN_LENGTH} characters`);
      }
      if (dto.osot_address.length > rules.MAX_LENGTH) {
        errors.push(`Address must not exceed ${rules.MAX_LENGTH} characters`);
      }
    }

    // Postal code validation
    if (dto.osot_postal_code) {
      const rules = ADDITIONAL_INSURED_VALIDATION_RULES.POSTAL_CODE;
      const normalized = dto.osot_postal_code.replace(/\s/g, '');
      if (!rules.PATTERN.test(normalized)) {
        errors.push(rules.ERROR_MESSAGE);
      }
    }

    return errors;
  }

  /**
   * Validate immutable fields are not being changed
   */
  private validateImmutableFields(
    dto: UpdateAdditionalInsuredDto,
  ): string | null {
    // Check if DTO contains any immutable fields
    // In UpdateAdditionalInsuredDto, insuranceGuid should not be changeable
    const immutableFields = [
      'insuranceGuid',
      'osot_table_additional_insuredid',
      'osot_additionalinsuredid',
      'createdon',
      'createdBy',
      'organizationGuid',
    ];

    const dtoKeys = Object.keys(dto);
    const attemptedImmutableChanges = dtoKeys.filter((key) =>
      immutableFields.includes(key),
    );

    if (attemptedImmutableChanges.length > 0) {
      return `Cannot modify immutable fields: ${attemptedImmutableChanges.join(', ')}`;
    }

    return null;
  }
}
