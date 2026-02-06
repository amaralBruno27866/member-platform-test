import { Injectable, Logger, Inject } from '@nestjs/common';
import { DataverseService } from '../../../../integrations/dataverse.service';
import { CreateOtEducationDto } from '../dtos/create-ot-education.dto';
import { UpdateOtEducationDto } from '../dtos/update-ot-education.dto';
import { OtEducationBusinessLogic } from '../utils/ot-education-business-logic.util';
import {
  CotoStatus,
  Country,
  OtUniversity,
  GraduationYear,
  EducationCategory,
} from '../../../../common/enums';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { OT_EDUCATION_ODATA } from '../constants/ot-education.constants';
import { canRead } from '../../../../utils/dataverse-app.helper';
import { EducationMembershipIntegrationService } from '../../../../common/services/education-membership-integration.service';
// Repository and interface imports
import {
  OtEducationRepository,
  OT_EDUCATION_REPOSITORY,
} from '../interfaces/ot-education-repository.interface';
import { OtEducationInternal } from '../interfaces/ot-education-internal.interface';
import { OtEducationEventsService } from '../events/ot-education.events';

/**
 * Interface for safe access to education data properties
 */
interface EducationDataAccess {
  osot_user_business_id?: string;
  osot_coto_status?: CotoStatus;
  osot_coto_registration?: string;
  osot_ot_university?: OtUniversity;
  osot_ot_country?: Country;
  osot_ot_grad_year?: GraduationYear;
  osot_ot_degree_type?: string;
  osot_education_category?: EducationCategory;
  accountBinding?: string;
  [key: string]: unknown;
}

/**
 * OT Education Business Rule Service (ENTERPRISE)
 *
 * MODERNIZED ARCHITECTURE INTEGRATION:
 * - Repository Pattern: OtEducationRepository for data abstraction and modern data access
 * - Event-Driven Architecture: OtEducationEventsService for comprehensive audit trails
 * - Structured Logging: Logger with operation IDs and security-aware PII redaction
 * - Security-First Design: Permission-based access control with comprehensive validation
 * - Business Rule Framework: Centralized validation logic with detailed error context
 * - Hybrid Architecture: Modern Repository + Legacy DataverseService for migration compatibility
 *
 * Key Business Rules for OT Education:
 * - User Business ID: Must be unique across all OT education records
 * - COTO Registration: Must align with COTO status (required for PROVISIONAL_TEMPORARY/GENERAL)
 * - University-Country: University must be geographically aligned with country
 * - Graduation Year: Must be within valid constraints and business rules
 * - Education Category: Auto-determined based on graduation year and membership
 * - Account Uniqueness: One OT education record per account
 * - Data Completeness: All required fields based on scenario and COTO status
 *
 * Enterprise Features:
 * - Operation tracking with unique IDs for comprehensive audit trails
 * - Event-driven validation result notifications with detailed context
 * - Security-aware logging with PII redaction capabilities
 * - Repository Pattern integration for modern data access patterns
 * - Hybrid architecture supporting gradual migration from legacy systems
 * - Permission-based access control for all validation operations
 */
@Injectable()
export class OtEducationBusinessRuleService {
  private readonly logger = new Logger(OtEducationBusinessRuleService.name);

  constructor(
    private readonly dataverseService: DataverseService,
    private readonly educationMembershipService: EducationMembershipIntegrationService,
    @Inject(OT_EDUCATION_REPOSITORY)
    private readonly otEducationRepository: OtEducationRepository,
    private readonly eventsService: OtEducationEventsService,
  ) {}

  /**
   * Safely cast education data to typed interface
   */
  private getEducationData(
    data: CreateOtEducationDto | UpdateOtEducationDto,
  ): EducationDataAccess {
    return data as unknown as EducationDataAccess;
  }

  /**
   * Check if User Business ID is unique across all OT education records
   * Business Rule: User Business ID must be unique across the platform
   *
   * Enterprise Features:
   * - Operation tracking with unique IDs
   * - Security-aware logging with PII redaction
   * - Permission-based access control
   * - Event emission for audit trails
   */
  async checkUserBusinessIdUniqueness(
    userBusinessId: string,
    excludeEducationId?: string,
    userRole?: string,
  ): Promise<boolean> {
    const operationId = `check_ot_education_business_id_${Date.now()}`;

    // Enhanced permission checking for read operations (part of validation)
    if (!canRead(userRole)) {
      this.logger.warn(
        `Access denied to OT education business ID validation - Operation: ${operationId}`,
        {
          operationId,
          requiredPrivilege: 'READ',
          userRole: userRole || 'undefined',
          operation: 'checkUserBusinessIdUniqueness',
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Access denied to OT education business ID validation',
        operationId,
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'checkUserBusinessIdUniqueness',
      });
    }

    this.logger.log(
      `Starting User Business ID uniqueness check - Operation: ${operationId}`,
      {
        operationId,
        userBusinessId: userBusinessId ? '[REDACTED]' : 'undefined', // PII redaction
        excludeEducationId: excludeEducationId || 'none',
        operation: 'checkUserBusinessIdUniqueness',
      },
    );

    try {
      let filter = `osot_user_business_id eq '${userBusinessId}'`;

      if (excludeEducationId) {
        filter += ` and osot_ot_education_id ne '${excludeEducationId}'`;
      }

      const endpoint = `${OT_EDUCATION_ODATA.TABLE_NAME}?$filter=${filter}&$select=osot_ot_education_id`;
      const response = await this.dataverseService.request('GET', endpoint);

      const dataverseResponse = response as { value?: any[] };
      const isUnique =
        !dataverseResponse?.value || dataverseResponse.value.length === 0;

      this.logger.log(
        `User Business ID uniqueness check completed - Operation: ${operationId}`,
        {
          operationId,
          isUnique,
          existingRecordsCount: dataverseResponse?.value?.length || 0,
          operation: 'checkUserBusinessIdUniqueness',
        },
      );

      // Emit validation event for audit trail
      this.eventsService.publishOtEducationValidation({
        accountId: 'system', // System-level validation
        validationType: 'duplicate_check',
        isValid: isUnique,
        errors: isUnique ? undefined : ['User Business ID already exists'],
        timestamp: new Date(),
      });

      return isUnique;
    } catch (error) {
      this.logger.error(
        `Error during User Business ID uniqueness check - Operation: ${operationId}`,
        {
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          operation: 'checkUserBusinessIdUniqueness',
        },
      );

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        userBusinessId: userBusinessId ? '[REDACTED]' : 'undefined',
        operationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Validate COTO registration alignment with COTO status
   * Business Rule: COTO registration format must align with status
   *
   * Enterprise Features:
   * - Operation tracking and structured logging
   * - Event emission for validation results
   * - Detailed error context
   */
  validateCotoRegistrationAlignment(
    cotoStatus: CotoStatus,
    cotoRegistration?: string,
  ): { isValid: boolean; message?: string } {
    const operationId = `validate_coto_alignment_${Date.now()}`;

    this.logger.log(
      `Starting COTO registration alignment validation - Operation: ${operationId}`,
      {
        operationId,
        cotoStatus,
        hasCotoRegistration: !!cotoRegistration,
        operation: 'validateCotoRegistrationAlignment',
      },
    );

    try {
      const validationResult = OtEducationBusinessLogic.validateCotoAlignment(
        cotoStatus,
        cotoRegistration,
      );

      const result = {
        isValid: validationResult.isValid,
        message:
          validationResult.errors.length > 0
            ? validationResult.errors[0]
            : undefined,
      };

      this.logger.log(
        `COTO registration alignment validation completed - Operation: ${operationId}`,
        {
          operationId,
          isValid: result.isValid,
          errorCount: validationResult.errors.length,
          operation: 'validateCotoRegistrationAlignment',
        },
      );

      // Emit validation event
      this.eventsService.publishOtEducationValidation({
        accountId: 'system',
        validationType: 'coto_registration_format',
        isValid: result.isValid,
        errors:
          validationResult.errors.length > 0
            ? validationResult.errors
            : undefined,
        timestamp: new Date(),
      });

      return result;
    } catch (error) {
      this.logger.error(
        `Error during COTO registration alignment validation - Operation: ${operationId}`,
        {
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          operation: 'validateCotoRegistrationAlignment',
        },
      );

      throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
        cotoStatus,
        cotoRegistration: cotoRegistration ? '[REDACTED]' : 'undefined',
        operationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Validate university and country pairing
   * Business Rule: University must be geographically aligned with country
   *
   * Enterprise Features:
   * - Operation tracking and structured logging
   * - Event emission for validation results
   * - Detailed error context
   */
  validateUniversityCountryAlignment(
    university: OtUniversity,
    country: Country,
  ): { isValid: boolean; message?: string } {
    const operationId = `validate_university_country_${Date.now()}`;

    this.logger.log(
      `Starting university-country alignment validation - Operation: ${operationId}`,
      {
        operationId,
        university,
        country,
        operation: 'validateUniversityCountryAlignment',
      },
    );

    try {
      const validationResult =
        OtEducationBusinessLogic.validateUniversityCountryAlignment(
          university,
          country,
        );

      const result = {
        isValid: validationResult.isValid,
        message:
          validationResult.errors.length > 0
            ? validationResult.errors[0]
            : undefined,
      };

      this.logger.log(
        `University-country alignment validation completed - Operation: ${operationId}`,
        {
          operationId,
          isValid: result.isValid,
          errorCount: validationResult.errors.length,
          operation: 'validateUniversityCountryAlignment',
        },
      );

      // Emit validation event
      this.eventsService.publishOtEducationValidation({
        accountId: 'system',
        validationType: 'university_country_match',
        isValid: result.isValid,
        errors:
          validationResult.errors.length > 0
            ? validationResult.errors
            : undefined,
        timestamp: new Date(),
      });

      return result;
    } catch (error) {
      this.logger.error(
        `Error during university-country alignment validation - Operation: ${operationId}`,
        {
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          operation: 'validateUniversityCountryAlignment',
        },
      );

      throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
        university,
        country,
        operationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Validate graduation year constraints
   */
  validateGraduationYear(
    graduationYear: GraduationYear,
    currentYear?: number,
  ): { isValid: boolean; message?: string } {
    try {
      const validationResult = OtEducationBusinessLogic.validateGraduationYear(
        graduationYear,
        currentYear,
      );

      return {
        isValid: validationResult.isValid,
        message:
          validationResult.errors.length > 0
            ? validationResult.errors[0]
            : undefined,
      };
    } catch (error) {
      throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
        graduationYear,
        currentYear,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Determine education category based on graduation year
   * Uses shared service with membership consideration (year_ends)
   *
   * This method uses the EducationMembershipIntegrationService which automatically
   * retrieves the current active membership year_ends from the membership-settings
   * system to prevent fraud in NEW_GRADUATED classification.
   *
   * @param graduationYear Year of graduation
   * @param currentYear Current year (optional)
   * @returns Calculated education category based on active membership
   */
  async determineEducationCategory(
    graduationYear: GraduationYear,
    currentYear?: number,
  ): Promise<EducationCategory> {
    try {
      // Use shared service for education category determination
      return await this.educationMembershipService.determineEducationCategory(
        graduationYear,
        currentYear,
      );
    } catch (error) {
      throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
        graduationYear,
        currentYear,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Comprehensive education record validation
   */
  async validateEducationRecord(
    educationData: CreateOtEducationDto | UpdateOtEducationDto,
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Safe typed access to education data
      const data = this.getEducationData(educationData);

      // Validate User Business ID uniqueness (for creates)
      if ('accountBinding' in educationData && data.osot_user_business_id) {
        const isUnique = await this.checkUserBusinessIdUniqueness(
          data.osot_user_business_id,
        );
        if (!isUnique) {
          errors.push('User Business ID already exists');
        }
      }

      // Validate COTO alignment
      if (data.osot_coto_status) {
        const cotoValidation = this.validateCotoRegistrationAlignment(
          data.osot_coto_status,
          data.osot_coto_registration,
        );
        if (!cotoValidation.isValid && cotoValidation.message) {
          errors.push(cotoValidation.message);
        }
      }

      // Validate university-country alignment
      if (data.osot_ot_university && data.osot_ot_country) {
        const universityValidation = this.validateUniversityCountryAlignment(
          data.osot_ot_university,
          data.osot_ot_country,
        );
        if (!universityValidation.isValid && universityValidation.message) {
          errors.push(universityValidation.message);
        }
      }

      // Validate graduation year
      if (data.osot_ot_grad_year) {
        const yearValidation = this.validateGraduationYear(
          data.osot_ot_grad_year,
        );
        if (!yearValidation.isValid && yearValidation.message) {
          errors.push(yearValidation.message);
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
        educationData,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check if account already has an OT education record
   * Business Rule: One OT education record per account
   *
   * Enterprise Features:
   * - Repository Pattern for data access
   * - Operation tracking and structured logging
   * - Security-aware PII redaction
   * - Event emission for audit trails
   */
  async checkAccountEducationExists(
    accountId: string,
    excludeEducationId?: string,
    userRole?: string,
  ): Promise<boolean> {
    const operationId = `check_account_education_exists_${Date.now()}`;

    // Enhanced permission checking for read operations
    if (!canRead(userRole)) {
      this.logger.warn(
        `Access denied to account education existence check - Operation: ${operationId}`,
        {
          operationId,
          accountId: accountId ? '[REDACTED]' : 'undefined',
          requiredPrivilege: 'READ',
          userRole: userRole || 'undefined',
          operation: 'checkAccountEducationExists',
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Access denied to account education existence check',
        operationId,
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'checkAccountEducationExists',
      });
    }

    this.logger.log(
      `Starting account education existence check - Operation: ${operationId}`,
      {
        operationId,
        accountId: accountId ? '[REDACTED]' : 'undefined',
        excludeEducationId: excludeEducationId || 'none',
        operation: 'checkAccountEducationExists',
      },
    );

    try {
      // Use Repository Pattern for modern data access
      const records: OtEducationInternal[] =
        await this.otEducationRepository.findByAccountId(accountId);

      let hasExistingEducation = false;

      if (excludeEducationId) {
        hasExistingEducation = records.some(
          (record) => record.osot_ot_education_id !== excludeEducationId,
        );
      } else {
        hasExistingEducation = records.length > 0;
      }

      this.logger.log(
        `Account education existence check completed - Operation: ${operationId}`,
        {
          operationId,
          hasExistingEducation,
          totalRecordsFound: records.length,
          operation: 'checkAccountEducationExists',
        },
      );

      // Emit validation event for audit trail
      this.eventsService.publishOtEducationValidation({
        accountId: accountId ? '[REDACTED]' : 'system',
        validationType: 'duplicate_check',
        isValid: !hasExistingEducation, // Valid when no existing education
        errors: hasExistingEducation
          ? ['Account already has an OT education record']
          : undefined,
        timestamp: new Date(),
      });

      return hasExistingEducation;
    } catch (error) {
      this.logger.error(
        `Error during account education existence check - Operation: ${operationId}`,
        {
          operationId,
          accountId: accountId ? '[REDACTED]' : 'undefined',
          error: error instanceof Error ? error.message : 'Unknown error',
          operation: 'checkAccountEducationExists',
        },
      );

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        accountId: accountId ? '[REDACTED]' : 'undefined',
        operationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Validate data completeness for different scenarios
   */
  validateDataCompleteness(
    educationData: CreateOtEducationDto | UpdateOtEducationDto,
    scenario: 'registration' | 'profile_completion' = 'registration',
  ): { isComplete: boolean; missingFields: string[] } {
    const missingFields: string[] = [];
    const data = this.getEducationData(educationData);

    try {
      // Required fields for all scenarios
      const requiredFields = [
        'osot_user_business_id',
        'osot_coto_status',
        'osot_ot_degree_type',
        'osot_ot_university',
        'osot_ot_grad_year',
        'osot_ot_country',
      ];

      // Additional fields required for profile completion
      if (scenario === 'profile_completion') {
        requiredFields.push('osot_education_category');
      }

      // Check each required field
      for (const field of requiredFields) {
        const fieldValue = data[field];
        if (!fieldValue || fieldValue === '') {
          missingFields.push(field);
        }
      }

      // COTO registration required for certain statuses
      if (
        data.osot_coto_status &&
        [CotoStatus.PROVISIONAL_TEMPORARY, CotoStatus.GENERAL].includes(
          data.osot_coto_status,
        ) &&
        (!data.osot_coto_registration || data.osot_coto_registration === '')
      ) {
        missingFields.push('osot_coto_registration');
      }

      return {
        isComplete: missingFields.length === 0,
        missingFields,
      };
    } catch (error) {
      throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
        educationData,
        scenario,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
