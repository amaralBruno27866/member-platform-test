/**
 * OTA Education Business Logic Utility
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes for business rule violations
 * - enums: Uses centralized enums for business logic validation
 * - utils: Integrates with global business rule patterns
 *
 * BUSINESS PHILOSOPHY:
 * - Essential OTA education business rules
 * - Work declaration validation and compliance
 * - Education category determination logic
 * - College-country alignment validation
 * - Graduation year business constraints
 * - Privacy and access control validation
 */

import {
  DegreeType,
  GraduationYear,
  OtaCollege,
  EducationCategory,
  Country,
  Privilege,
} from '../../../../common/enums';
import { getGraduationYearDisplayName } from '../../../../common/enums/graduation-year.enum';
import { getOtaCollegeDisplayName } from '../../../../common/enums/ota-college.enum';
import type { OtaEducationInternal } from '../interfaces/ota-education-internal.interface';

/**
 * OTA Education Business Logic Helper
 * Implements business rules and constraints for OTA education operations
 */
export class OtaEducationBusinessLogic {
  /**
   * Check if user can have multiple OTA education records
   * Business rule: Each user should have only one OTA education record
   * @returns Whether multiple education records are allowed
   */
  static canHaveMultipleEducationRecords(): boolean {
    // Business rule: One OTA education record per user
    return false;
  }

  /**
   * Determine required fields based on OTA education context
   * @param isRegistration Whether this is for registration
   * @param hasWorkDeclaration Whether work declaration is provided
   * @returns List of required field names
   */
  static getRequiredFields(
    isRegistration: boolean = false,
    hasWorkDeclaration: boolean = false,
  ): string[] {
    const requiredFields = [
      'osot_user_business_id',
      'osot_work_declaration',
      'osot_ota_degree_type',
      'osot_ota_college',
      'osot_ota_grad_year',
      'osot_ota_country',
    ];

    if (isRegistration) {
      // Additional requirements for registration
      requiredFields.push('osot_table_account'); // Must be linked to account
    }

    // Work declaration required for active registrations
    if (hasWorkDeclaration) {
      requiredFields.push('osot_education_category');
    }

    return requiredFields;
  }

  /**
   * Determine education category based on graduation year and membership expires date
   * This is the core business logic for osot_education_category field
   *
   * BUSINESS RULES:
   * 1. If graduation year > current year → STUDENT (still studying)
   * 2. If graduation year < current year-1 → GRADUATED (already graduated)
   * 3. If graduation year == current year OR current year-1 AND today <= expires_date → NEW_GRADUATED
   *
   * NOTE: This logic prevents fraud by using admin-controlled expires_date instead of
   * user-editable status for NEW_GRADUATED classification (discount eligibility)
   *
   * @param graduationYear Year of graduation (enum - only year value)
   * @param membershipExpiresDate Admin-controlled membership expiration date (ISO string: YYYY-MM-DD)
   * @param currentYear Current year (defaults to current date)
   * @returns Calculated education category
   */
  static determineEducationCategory(
    graduationYear: GraduationYear,
    membershipExpiresDate?: string,
    currentYear: number = new Date().getFullYear(),
  ): EducationCategory {
    const gradYear = this.getGraduationYearValue(graduationYear);
    const today = new Date();

    // Rule 1: If graduation year > current year → STUDENT (still studying)
    if (gradYear > currentYear) {
      return EducationCategory.STUDENT;
    }

    // Rule 3: If graduation year == current year OR current year-1 AND today <= expires_date → NEW_GRADUATED
    if (
      (gradYear === currentYear || gradYear === currentYear - 1) &&
      membershipExpiresDate
    ) {
      const expiresDate = new Date(membershipExpiresDate);
      // Check if today is within the membership period (before or on expires date)
      if (today <= expiresDate) {
        return EducationCategory.NEW_GRADUATED;
      }
    }

    // Rule 2: If graduation year < current year-1 → GRADUATED (already graduated)
    if (gradYear < currentYear - 1) {
      return EducationCategory.GRADUATED;
    }

    // Fallback (should not reach here with current logic)
    return EducationCategory.GRADUATED;
  }

  /**
   * Validate work declaration requirements
   * @param workDeclaration Work declaration text
   * @param isRegistration Whether this is for registration
   * @returns Validation result with specific error messages
   */
  static validateWorkDeclaration(
    workDeclaration?: string | boolean,
    isRegistration: boolean = false,
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Business rule: Work declaration required for registration
    if (isRegistration) {
      if (!workDeclaration) {
        errors.push('Work declaration is required for registration');
      } else if (typeof workDeclaration === 'string') {
        if (workDeclaration.trim().length < 10) {
          errors.push('Work declaration must be at least 10 characters');
        }
        if (workDeclaration.trim().length > 500) {
          errors.push('Work declaration cannot exceed 500 characters');
        }
      }
    }

    // Business rule: Work declaration should be meaningful
    if (
      typeof workDeclaration === 'string' &&
      workDeclaration.trim().length > 0
    ) {
      const trimmed = workDeclaration.trim().toLowerCase();
      if (trimmed === 'n/a' || trimmed === 'none' || trimmed === 'no') {
        warnings.push('Work declaration appears to be a placeholder');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate college-country alignment
   * @param college OTA college
   * @param country Country where education was obtained
   * @returns Validation result
   */
  static validateCollegeCountryAlignment(
    college: OtaCollege,
    country: Country,
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Business rule: Canadian colleges should be paired with Canada
    // A college is Canadian if it's not OTHER or NOT_APPLICABLE
    const isCanadian =
      college !== OtaCollege.OTHER && college !== OtaCollege.NOT_APPLICABLE;
    if (isCanadian && country !== Country.CANADA) {
      errors.push(
        `${getOtaCollegeDisplayName(college)} is a Canadian college and should be paired with Canada`,
      );
    }

    // Business rule: International education may require additional verification
    if (country !== Country.CANADA && !isCanadian) {
      warnings.push(
        'International education may require additional verification',
      );
    }

    // Business rule: "Other" college selections may require verification
    if (college === OtaCollege.OTHER) {
      warnings.push('Other college selection may require manual verification');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate graduation year constraints
   * @param graduationYear Year of graduation
   * @param currentYear Current year for validation
   * @returns Validation result
   */
  static validateGraduationYear(
    graduationYear: GraduationYear,
    currentYear: number = new Date().getFullYear(),
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const gradYear = this.getGraduationYearValue(graduationYear);

    // Business rule: Graduation year cannot be too far in the future
    if (gradYear > currentYear + 10) {
      errors.push('Graduation year cannot be more than 10 years in the future');
    }

    // Business rule: Graduation year cannot be too far in the past for OTA programs
    const earliestOtaProgram = 1960; // Approximate start of formal OTA programs
    if (gradYear < earliestOtaProgram) {
      errors.push(`Graduation year cannot be before ${earliestOtaProgram}`);
    }

    // Warning for very recent or future graduations
    if (gradYear > currentYear) {
      warnings.push(
        'Future graduation year - ensure this is correct for current students',
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate degree type requirements
   * @param degreeType Type of degree
   * @param graduationYear Year of graduation
   * @returns Validation result
   */
  static validateDegreeType(
    degreeType: DegreeType,
    graduationYear?: GraduationYear,
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Business rule: Validate degree type based on historical context
    if (graduationYear) {
      const gradYear = this.getGraduationYearValue(graduationYear);

      // Masters programs became more common after 1990
      if (degreeType === DegreeType.MASTERS && gradYear < 1990) {
        warnings.push(
          'Masters degree programs were less common before 1990 - verify accuracy',
        );
      }

      // Doctoral programs in OTA are relatively recent
      if (degreeType === DegreeType.DOCTORATE && gradYear < 2000) {
        warnings.push(
          'Doctoral programs in OTA were very rare before 2000 - verify accuracy',
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Check if education record requires international verification
   * @param country Country of education
   * @param college College attended
   * @returns Whether verification is required
   */
  static requiresInternationalVerification(
    country: Country,
    college: OtaCollege,
  ): boolean {
    // Business rule: Non-Canadian education requires verification
    if (country !== Country.CANADA) {
      return true;
    }

    // Business rule: "Other" college selections may require verification
    if (college === OtaCollege.OTHER) {
      return true;
    }

    return false;
  }

  /**
   * Calculate professional experience years
   * @param graduationYear Year of graduation
   * @param currentYear Current year
   * @returns Years of potential professional experience
   */
  static calculateExperienceYears(
    graduationYear: GraduationYear,
    currentYear: number = new Date().getFullYear(),
  ): number {
    const gradYear = this.getGraduationYearValue(graduationYear);
    const experience = currentYear - gradYear;
    return Math.max(0, experience); // Cannot have negative experience
  }

  /**
   * Determine access privileges based on education status
   * @param education Complete education record
   * @returns Recommended access privilege
   */
  static determineAccessPrivilege(education: OtaEducationInternal): Privilege {
    // Business rule: Graduated students typically get main access
    if (education.osot_education_category === EducationCategory.GRADUATED) {
      return Privilege.MAIN;
    }

    // Business rule: Current students get main access
    if (education.osot_education_category === EducationCategory.STUDENT) {
      return Privilege.MAIN;
    }

    // Business rule: New graduates get main access
    if (education.osot_education_category === EducationCategory.NEW_GRADUATED) {
      return Privilege.MAIN;
    }

    // Default to main access
    return Privilege.MAIN;
  }

  /**
   * Determine if education qualifies for membership benefits
   * @param education Complete education record
   * @returns Qualification result
   */
  static qualifiesForMembershipBenefits(education: OtaEducationInternal): {
    qualifies: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];

    // Business rule: Must have completed degree
    const currentYear = new Date().getFullYear();
    const gradYear = this.getGraduationYearValue(education.osot_ota_grad_year);

    if (gradYear > currentYear) {
      reasons.push('Education not yet completed');
      return { qualifies: false, reasons };
    }

    // Business rule: Must have valid work declaration
    if (!education.osot_work_declaration) {
      reasons.push('Work declaration required for membership benefits');
      return { qualifies: false, reasons };
    }

    // Business rule: International education may have different requirements
    if (education.osot_ota_country !== Country.CANADA) {
      reasons.push('International education - verify credential equivalency');
    }

    const qualifies =
      reasons.length === 0 ||
      reasons.every((reason) => reason.includes('verify'));

    return { qualifies, reasons };
  }

  /**
   * Helper method to get numeric year value from GraduationYear enum
   * @param graduationYear Graduation year enum
   * @returns Numeric year value
   */
  private static getGraduationYearValue(
    graduationYear?: GraduationYear,
  ): number {
    if (!graduationYear) {
      return new Date().getFullYear();
    }

    // Handle specific decade ranges
    if (graduationYear === GraduationYear.PRE_1960) return 1959;
    if (graduationYear === GraduationYear.DECADE_1960_1969) return 1965;
    if (graduationYear === GraduationYear.DECADE_1970_1979) return 1975;

    // For individual years (1980-2027), parse from display name
    const displayName = getGraduationYearDisplayName(graduationYear);
    const yearNumber = parseInt(displayName, 10);
    if (!isNaN(yearNumber)) return yearNumber;

    // For dynamic years beyond 2027
    if (graduationYear > GraduationYear.YEAR_2027) {
      return 2027 + (graduationYear - GraduationYear.YEAR_2027);
    }

    // Fallback
    return new Date().getFullYear();
  }

  /**
   * Validate complete education record for business rules
   * @param education Complete education record
   * @returns Comprehensive validation result
   */
  static validateEducationRecord(education: OtaEducationInternal): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    // Validate work declaration
    const workValidation = this.validateWorkDeclaration(
      education.osot_work_declaration,
      true, // Assume registration context for comprehensive validation
    );
    allErrors.push(...workValidation.errors);
    allWarnings.push(...workValidation.warnings);

    // Validate college-country alignment
    if (education.osot_ota_college && education.osot_ota_country) {
      const collegeValidation = this.validateCollegeCountryAlignment(
        education.osot_ota_college,
        education.osot_ota_country,
      );
      allErrors.push(...collegeValidation.errors);
      allWarnings.push(...collegeValidation.warnings);
    }

    // Validate graduation year
    if (education.osot_ota_grad_year) {
      const graduationValidation = this.validateGraduationYear(
        education.osot_ota_grad_year,
      );
      allErrors.push(...graduationValidation.errors);
      allWarnings.push(...graduationValidation.warnings);
    }

    // Validate degree type
    if (education.osot_ota_degree_type) {
      const degreeValidation = this.validateDegreeType(
        education.osot_ota_degree_type,
        education.osot_ota_grad_year,
      );
      allErrors.push(...degreeValidation.errors);
      allWarnings.push(...degreeValidation.warnings);
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
    };
  }

  /**
   * Generate education summary for display
   * @param education Complete education record
   * @returns Human-readable education summary
   */
  static generateEducationSummary(education: OtaEducationInternal): string {
    const parts: string[] = [];

    if (education.osot_ota_degree_type) {
      parts.push(education.osot_ota_degree_type.toString());
    }

    if (education.osot_ota_college) {
      parts.push(getOtaCollegeDisplayName(education.osot_ota_college));
    }

    if (education.osot_ota_grad_year) {
      parts.push(getGraduationYearDisplayName(education.osot_ota_grad_year));
    }

    if (
      education.osot_ota_country &&
      education.osot_ota_country !== Country.CANADA
    ) {
      parts.push(education.osot_ota_country.toString());
    }

    return (
      parts.filter(Boolean).join(' | ') || 'Education details not specified'
    );
  }
}
