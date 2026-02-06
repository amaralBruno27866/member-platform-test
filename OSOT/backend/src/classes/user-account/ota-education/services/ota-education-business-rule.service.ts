import { Injectable, Inject, Logger } from '@nestjs/common';
import { DataverseService } from '../../../../integrations/dataverse.service';
import { CreateOtaEducationDto } from '../dtos/create-ota-education.dto';
import { UpdateOtaEducationDto } from '../dtos/update-ota-education.dto';
import { OtaEducationBusinessLogic } from '../utils/ota-education-business-logic.util';
import {
  DegreeType,
  Country,
  OtaCollege,
  GraduationYear,
  EducationCategory,
} from '../../../../common/enums';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { OTA_EDUCATION_ODATA } from '../constants/ota-education.constants';
import { canRead } from '../../../../utils/dataverse-app.helper';
import {
  getCurrentActiveMembershipExpiresDate,
  MembershipSettingsRepository,
  MEMBERSHIP_SETTINGS_REPOSITORY,
} from '../../../membership/membership-settings';
// Repository and interface imports
import {
  OtaEducationRepository,
  OTA_EDUCATION_REPOSITORY,
} from '../interfaces/ota-education-repository.interface';
import { OtaEducationInternal } from '../interfaces/ota-education-internal.interface';
import { OtaEducationEventsService } from '../events/ota-education.events';

/**
 * Interface for safe access to education data properties
 */
interface EducationDataAccess {
  osot_user_business_id?: string;
  osot_work_declaration?: string | boolean;
  osot_ota_degree_type?: DegreeType;
  osot_ota_college?: OtaCollege;
  osot_ota_country?: Country;
  osot_ota_grad_year?: GraduationYear;
  osot_education_category?: EducationCategory;
  accountBinding?: string;
  [key: string]: unknown;
}

/**
 * OTA Education Business Rule Service (ENTERPRISE)
 *
 * MODERNIZED ARCHITECTURE INTEGRATION:
 * - Repository Pattern: OtaEducationRepository for data abstraction and modern data access
 * - Event-Driven Architecture: OtaEducationEventsService for comprehensive audit trails
 * - Structured Logging: Logger with operation IDs and security-aware PII redaction
 * - Security-First Design: Permission-based access control with comprehensive validation
 * - Business Rule Framework: Centralized validation logic with detailed error context
 * - Hybrid Architecture: Modern Repository + Legacy DataverseService for migration compatibility
 *
 * Key Business Rules for OTA Education:
 * - User Business ID: Must be unique across all OTA education records
 * - Work Declaration: Must meet format requirements and business logic validation
 * - College-Country: College must be geographically aligned with country
 * - Graduation Year: Must be within valid constraints and business rules
 * - Education Category: Auto-determined based on graduation year and membership
 * - Account Uniqueness: One OTA education record per account
 * - Data Completeness: All required fields based on scenario and work declaration
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
export class OtaEducationBusinessRuleService {
  private readonly logger = new Logger(OtaEducationBusinessRuleService.name);

  constructor(
    private readonly dataverseService: DataverseService,
    @Inject(MEMBERSHIP_SETTINGS_REPOSITORY)
    private readonly membershipSettingsRepository: MembershipSettingsRepository,
    @Inject(OTA_EDUCATION_REPOSITORY)
    private readonly otaEducationRepository: OtaEducationRepository,
    private readonly eventsService: OtaEducationEventsService,
  ) {}

  /**
   * Safely cast education data to typed interface
   */
  private getEducationData(
    data: CreateOtaEducationDto | UpdateOtaEducationDto,
  ): EducationDataAccess {
    return data as unknown as EducationDataAccess;
  }

  /**
   * Check if User Business ID is unique across all OTA education records
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
    const operationId = `check_ota_education_business_id_${Date.now()}`;

    // Enhanced permission checking for read operations (part of validation)
    if (!canRead(userRole)) {
      this.logger.warn(
        `Access denied to OTA education business ID validation - Operation: ${operationId}`,
        {
          operationId,
          requiredPrivilege: 'READ',
          userRole: userRole || 'undefined',
          operation: 'checkUserBusinessIdUniqueness',
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Access denied to OTA education business ID validation',
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
        filter += ` and osot_ota_education_id ne '${excludeEducationId}'`;
      }

      const endpoint = `${OTA_EDUCATION_ODATA.TABLE_NAME}?$filter=${filter}&$select=osot_ota_education_id`;
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
      this.eventsService.publishOtaEducationValidation({
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
   * Validate work declaration requirements and content
   * Business Rule: Work declaration format must meet business requirements
   *
   * Enterprise Features:
   * - Operation tracking and structured logging
   * - Event emission for validation results
   * - Detailed error context
   */
  validateWorkDeclaration(
    workDeclaration?: string | boolean,
    isRegistration: boolean = false,
  ): { isValid: boolean; message?: string; warnings?: string[] } {
    const operationId = `validate_work_declaration_${Date.now()}`;

    this.logger.log(
      `Starting work declaration validation - Operation: ${operationId}`,
      {
        operationId,
        hasWorkDeclaration: !!workDeclaration,
        isRegistration,
        operation: 'validateWorkDeclaration',
      },
    );

    try {
      const validationResult =
        OtaEducationBusinessLogic.validateWorkDeclaration(
          workDeclaration,
          isRegistration,
        );

      const result = {
        isValid: validationResult.isValid,
        message:
          validationResult.errors.length > 0
            ? validationResult.errors[0]
            : undefined,
        warnings: validationResult.warnings,
      };

      this.logger.log(
        `Work declaration validation completed - Operation: ${operationId}`,
        {
          operationId,
          isValid: result.isValid,
          errorCount: validationResult.errors.length,
          warningCount: validationResult.warnings?.length || 0,
          operation: 'validateWorkDeclaration',
        },
      );

      // Emit validation event
      this.eventsService.publishOtaEducationValidation({
        accountId: 'system',
        validationType: 'work_declaration_required',
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
        `Error during work declaration validation - Operation: ${operationId}`,
        {
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          operation: 'validateWorkDeclaration',
        },
      );

      throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
        workDeclaration: workDeclaration ? '[REDACTED]' : 'undefined',
        isRegistration,
        operationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Validate college and country pairing
   * Business Rule: College must be geographically aligned with country
   *
   * Enterprise Features:
   * - Operation tracking and structured logging
   * - Event emission for validation results
   * - Detailed error context
   */
  validateCollegeCountryAlignment(
    college: OtaCollege,
    country: Country,
  ): { isValid: boolean; message?: string; warnings?: string[] } {
    const operationId = `validate_college_country_${Date.now()}`;

    this.logger.log(
      `Starting college-country alignment validation - Operation: ${operationId}`,
      {
        operationId,
        college,
        country,
        operation: 'validateCollegeCountryAlignment',
      },
    );

    try {
      const validationResult =
        OtaEducationBusinessLogic.validateCollegeCountryAlignment(
          college,
          country,
        );

      const result = {
        isValid: validationResult.isValid,
        message:
          validationResult.errors.length > 0
            ? validationResult.errors[0]
            : undefined,
        warnings: validationResult.warnings,
      };

      this.logger.log(
        `College-country alignment validation completed - Operation: ${operationId}`,
        {
          operationId,
          isValid: result.isValid,
          errorCount: validationResult.errors.length,
          warningCount: validationResult.warnings?.length || 0,
          operation: 'validateCollegeCountryAlignment',
        },
      );

      // Emit validation event
      this.eventsService.publishOtaEducationValidation({
        accountId: 'system',
        validationType: 'college_country_match',
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
        `Error during college-country alignment validation - Operation: ${operationId}`,
        {
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          operation: 'validateCollegeCountryAlignment',
        },
      );

      throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
        college,
        country,
        operationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Validate graduation year constraints
   * Business Rule: Graduation year must be within valid constraints
   *
   * Enterprise Features:
   * - Operation tracking and structured logging
   * - Event emission for validation results
   * - Detailed error context
   */
  validateGraduationYear(
    graduationYear: GraduationYear,
    currentYear?: number,
  ): { isValid: boolean; message?: string; warnings?: string[] } {
    const operationId = `validate_graduation_year_${Date.now()}`;

    this.logger.log(
      `Starting graduation year validation - Operation: ${operationId}`,
      {
        operationId,
        graduationYear,
        currentYear: currentYear || 'auto-detected',
        operation: 'validateGraduationYear',
      },
    );

    try {
      const validationResult = OtaEducationBusinessLogic.validateGraduationYear(
        graduationYear,
        currentYear,
      );

      const result = {
        isValid: validationResult.isValid,
        message:
          validationResult.errors.length > 0
            ? validationResult.errors[0]
            : undefined,
        warnings: validationResult.warnings,
      };

      this.logger.log(
        `Graduation year validation completed - Operation: ${operationId}`,
        {
          operationId,
          isValid: result.isValid,
          errorCount: validationResult.errors.length,
          warningCount: validationResult.warnings?.length || 0,
          operation: 'validateGraduationYear',
        },
      );

      // Emit validation event
      this.eventsService.publishOtaEducationValidation({
        accountId: 'system',
        validationType: 'graduation_year_range',
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
        `Error during graduation year validation - Operation: ${operationId}`,
        {
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          operation: 'validateGraduationYear',
        },
      );

      throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
        graduationYear,
        currentYear,
        operationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Validate degree type requirements and historical context
   */
  validateDegreeType(
    degreeType: DegreeType,
    graduationYear?: GraduationYear,
  ): { isValid: boolean; message?: string; warnings?: string[] } {
    try {
      const validationResult = OtaEducationBusinessLogic.validateDegreeType(
        degreeType,
        graduationYear,
      );

      return {
        isValid: validationResult.isValid,
        message:
          validationResult.errors.length > 0
            ? validationResult.errors[0]
            : undefined,
        warnings: validationResult.warnings,
      };
    } catch (error) {
      throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
        degreeType,
        graduationYear,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Determine education category based on graduation year and active membership year end date
   *
   * This method automatically retrieves the current active membership year_ends
   * from the membership-settings system to prevent fraud in NEW_GRADUATED classification.
   *
   * Process:
   * 1. Automatically fetch current active membership year_ends date
   * 2. Use year_ends + graduation year to determine education category
   * 3. Return calculated education category
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
      // Step 1: Get current active membership expires date
      // Use OSOT master organization for this cross-org lookup
      const organizationGuid = 'a4f46aa9-2d5e-ef11-a670-000d3a8c1c9c'; // OSOT master org
      const membershipExpiresDate = await getCurrentActiveMembershipExpiresDate(
        organizationGuid,
        this.membershipSettingsRepository,
      );

      // Step 2: Use business logic to determine category
      return OtaEducationBusinessLogic.determineEducationCategory(
        graduationYear,
        membershipExpiresDate,
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
   * Check if education record requires international verification
   */
  checkInternationalVerificationRequired(
    country: Country,
    college: OtaCollege,
  ): boolean {
    try {
      return OtaEducationBusinessLogic.requiresInternationalVerification(
        country,
        college,
      );
    } catch (error) {
      throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
        country,
        college,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Calculate professional experience years
   */
  calculateExperienceYears(
    graduationYear: GraduationYear,
    currentYear?: number,
  ): number {
    try {
      return OtaEducationBusinessLogic.calculateExperienceYears(
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
   * Check if education qualifies for membership benefits
   */
  checkMembershipBenefitsEligibility(education: OtaEducationInternal): {
    qualifies: boolean;
    reasons: string[];
  } {
    try {
      return OtaEducationBusinessLogic.qualifiesForMembershipBenefits(
        education,
      );
    } catch (error) {
      throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
        education,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Comprehensive education record validation
   * Business Rule: Complete validation of all education data components
   *
   * Enterprise Features:
   * - Operation tracking with unique IDs
   * - Structured logging with detailed context
   * - Event emission for comprehensive audit trails
   * - Security-aware error handling
   */
  async validateEducationRecord(
    educationData: CreateOtaEducationDto | UpdateOtaEducationDto,
    userRole?: string,
  ): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    const operationId = `validate_education_record_${Date.now()}`;
    const errors: string[] = [];
    const warnings: string[] = [];

    this.logger.log(
      `Starting comprehensive education record validation - Operation: ${operationId}`,
      {
        operationId,
        hasAccountBinding: 'accountBinding' in educationData,
        operation: 'validateEducationRecord',
      },
    );

    try {
      // Safe typed access to education data
      const data = this.getEducationData(educationData);

      // Validate User Business ID uniqueness (for creates)
      if ('accountBinding' in educationData && data.osot_user_business_id) {
        const isUnique = await this.checkUserBusinessIdUniqueness(
          data.osot_user_business_id,
          undefined,
          userRole,
        );
        if (!isUnique) {
          errors.push('User Business ID already exists');
        }
      }

      // Validate work declaration
      if (data.osot_work_declaration !== undefined) {
        const workValidation = this.validateWorkDeclaration(
          data.osot_work_declaration,
          true, // Assume registration context for comprehensive validation
        );
        if (!workValidation.isValid && workValidation.message) {
          errors.push(workValidation.message);
        }
        if (workValidation.warnings) {
          warnings.push(...workValidation.warnings);
        }
      }

      // Validate college-country alignment
      if (data.osot_ota_college && data.osot_ota_country) {
        const collegeValidation = this.validateCollegeCountryAlignment(
          data.osot_ota_college,
          data.osot_ota_country,
        );
        if (!collegeValidation.isValid && collegeValidation.message) {
          errors.push(collegeValidation.message);
        }
        if (collegeValidation.warnings) {
          warnings.push(...collegeValidation.warnings);
        }
      }

      // Validate graduation year
      if (data.osot_ota_grad_year) {
        const yearValidation = this.validateGraduationYear(
          data.osot_ota_grad_year,
        );
        if (!yearValidation.isValid && yearValidation.message) {
          errors.push(yearValidation.message);
        }
        if (yearValidation.warnings) {
          warnings.push(...yearValidation.warnings);
        }
      }

      // Validate degree type
      if (data.osot_ota_degree_type) {
        const degreeValidation = this.validateDegreeType(
          data.osot_ota_degree_type,
          data.osot_ota_grad_year,
        );
        if (!degreeValidation.isValid && degreeValidation.message) {
          errors.push(degreeValidation.message);
        }
        if (degreeValidation.warnings) {
          warnings.push(...degreeValidation.warnings);
        }
      }

      const result = {
        isValid: errors.length === 0,
        errors,
        warnings,
      };

      this.logger.log(
        `Comprehensive education record validation completed - Operation: ${operationId}`,
        {
          operationId,
          isValid: result.isValid,
          errorCount: errors.length,
          warningCount: warnings.length,
          operation: 'validateEducationRecord',
        },
      );

      // Emit comprehensive validation event
      this.eventsService.publishOtaEducationValidation({
        accountId: 'system',
        validationType: 'creation',
        isValid: result.isValid,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: new Date(),
      });

      return result;
    } catch (error) {
      this.logger.error(
        `Error during comprehensive education record validation - Operation: ${operationId}`,
        {
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          operation: 'validateEducationRecord',
        },
      );

      throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
        educationData: '[REDACTED]', // PII protection
        operationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check if account already has an OTA education record
   * Business Rule: One OTA education record per account
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
      const records: OtaEducationInternal[] =
        await this.otaEducationRepository.findByAccountId(accountId);

      let hasExistingEducation = false;

      if (excludeEducationId) {
        hasExistingEducation = records.some(
          (record) => record.osot_ota_education_id !== excludeEducationId,
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
      this.eventsService.publishOtaEducationValidation({
        accountId: accountId ? '[REDACTED]' : 'system',
        validationType: 'duplicate_check',
        isValid: !hasExistingEducation, // Valid when no existing education
        errors: hasExistingEducation
          ? ['Account already has an OTA education record']
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
    educationData: CreateOtaEducationDto | UpdateOtaEducationDto,
    scenario: 'registration' | 'profile_completion' = 'registration',
  ): { isComplete: boolean; missingFields: string[] } {
    const missingFields: string[] = [];
    const data = this.getEducationData(educationData);

    try {
      // Get required fields using business logic
      const hasWorkDeclaration = Boolean(data.osot_work_declaration);
      const requiredFields = OtaEducationBusinessLogic.getRequiredFields(
        scenario === 'registration',
        hasWorkDeclaration,
      );

      // Check each required field
      for (const field of requiredFields) {
        const fieldValue = data[field];
        if (!fieldValue || fieldValue === '') {
          missingFields.push(field);
        }
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

  /**
   * Generate education summary for display purposes
   */
  generateEducationSummary(education: OtaEducationInternal): string {
    try {
      return OtaEducationBusinessLogic.generateEducationSummary(education);
    } catch (error) {
      throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
        education,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Validate complete education record using business logic utility
   */
  validateEducationRecordComprehensive(education: OtaEducationInternal): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    try {
      return OtaEducationBusinessLogic.validateEducationRecord(education);
    } catch (error) {
      throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
        education,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
