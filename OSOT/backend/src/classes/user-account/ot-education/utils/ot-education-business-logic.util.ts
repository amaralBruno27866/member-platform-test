/**
 * OT Education Business Logic Utility (SIMPLIFIED)
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes for business rule violations
 * - enums: Uses centralized enums for business logic validation
 * - utils: Integrates with global business rule patterns
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Essential OT education business rules only
 * - COTO status and registration alignment
 * - Education category determination logic
 * - University-country alignment validation
 * - Graduation year business constraints
 */

import {
  CotoStatus,
  OtUniversity,
  GraduationYear,
  EducationCategory,
  Country,
} from '../../../../common/enums';
import { getGraduationYearDisplayName } from '../../../../common/enums/graduation-year.enum';
import {
  getOtUniversityDisplayName,
  isOntarioUniversity,
} from '../../../../common/enums/ot-university.enum';
import type { OtEducationInternal } from '../interfaces/ot-education-internal.interface';

/**
 * OT Education Business Logic Helper
 * Implements business rules and constraints for OT education operations
 */
export class OtEducationBusinessLogic {
  /**
   * Check if user can have multiple OT education records
   * Business rule: Each user should have only one OT education record
   * @returns Whether multiple education records are allowed
   */
  static canHaveMultipleEducationRecords(): boolean {
    // Business rule: One OT education record per user
    return false;
  }

  /**
   * Determine required fields based on OT education context
   * @param isRegistration Whether this is for registration
   * @param cotoStatus The COTO professional status
   * @returns List of required field names
   */
  static getRequiredFields(
    isRegistration: boolean = false,
    cotoStatus?: CotoStatus,
  ): string[] {
    const requiredFields = [
      'osot_user_business_id',
      'osot_coto_status',
      'osot_ot_degree_type',
      'osot_ot_university',
      'osot_ot_grad_year',
      'osot_ot_country',
    ];

    if (isRegistration) {
      // Additional requirements for registration
      requiredFields.push('osot_table_account'); // Must be linked to account
    }

    // COTO registration required for certain statuses
    if (
      cotoStatus === CotoStatus.GENERAL ||
      cotoStatus === CotoStatus.PROVISIONAL_TEMPORARY
    ) {
      requiredFields.push('osot_coto_registration');
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
   * user-editable COTO status for NEW_GRADUATED classification (50% discount eligibility)
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

    // Default category: If none of the above conditions are met
    return EducationCategory.GRADUATED;
  }

  /**
   * Validate COTO status and registration alignment
   * @param cotoStatus Professional status
   * @param cotoRegistration Registration number
   * @returns Validation result with specific error messages
   */
  static validateCotoAlignment(
    cotoStatus: CotoStatus,
    cotoRegistration?: string,
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Business rule: GENERAL and PROVISIONAL_TEMPORARY require registration
    if (
      cotoStatus === CotoStatus.GENERAL ||
      cotoStatus === CotoStatus.PROVISIONAL_TEMPORARY
    ) {
      if (!cotoRegistration || cotoRegistration.trim().length === 0) {
        errors.push(
          `COTO status "${cotoStatus}" requires a registration number`,
        );
      } else if (!/^\d{8}$/.test(cotoRegistration.trim())) {
        errors.push('COTO registration must be exactly 8 digits');
      }
    }

    // Business rule: OTHER and RESIGNED typically don't have registration
    if (
      (cotoStatus === CotoStatus.OTHER || cotoStatus === CotoStatus.RESIGNED) &&
      cotoRegistration
    ) {
      warnings.push(
        `COTO registration is typically not provided for status "${cotoStatus}"`,
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate university-country alignment
   * @param university OT university
   * @param country Country where education was obtained
   * @returns Validation result
   */
  static validateUniversityCountryAlignment(
    university: OtUniversity,
    country: Country,
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Business rule: Canadian universities should be paired with Canada
    if (isOntarioUniversity(university) && country !== Country.CANADA) {
      errors.push(
        `${getOtUniversityDisplayName(university)} is a Canadian university and should be paired with Canada`,
      );
    }

    // Business rule: International education may require additional verification
    if (country !== Country.CANADA && !isOntarioUniversity(university)) {
      warnings.push(
        'International education may require additional verification',
      );
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

    // Business rule: Graduation year cannot be too far in the past for OT programs
    const earliestOtProgram = 1950; // Approximate start of formal OT programs
    if (gradYear < earliestOtProgram) {
      errors.push(`Graduation year cannot be before ${earliestOtProgram}`);
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
   * Check if education record requires international verification
   * @param country Country of education
   * @param university University attended
   * @returns Whether verification is required
   */
  static requiresInternationalVerification(
    country: Country,
    university: OtUniversity,
  ): boolean {
    // Business rule: Non-Canadian education requires verification
    if (country !== Country.CANADA) {
      return true;
    }

    // Business rule: "Other" university selections may require verification
    if (university === OtUniversity.OTHER) {
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
   * Determine if education qualifies for membership benefits
   * @param education Complete education record
   * @returns Qualification result
   */
  static qualifiesForMembershipBenefits(education: OtEducationInternal): {
    qualifies: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];

    // Business rule: Must have completed degree
    const currentYear = new Date().getFullYear();
    const gradYear = this.getGraduationYearValue(education.osot_ot_grad_year);

    if (gradYear > currentYear) {
      reasons.push('Education not yet completed');
      return { qualifies: false, reasons };
    }

    // Business rule: Must have valid COTO status for certain benefits
    if (education.osot_coto_status === CotoStatus.OTHER) {
      reasons.push('COTO status "Other" may have limited benefits');
    }

    // Business rule: International education may have different requirements
    if (education.osot_ot_country !== Country.CANADA) {
      reasons.push('International education - verify credential equivalency');
    }

    const qualifies =
      reasons.length === 0 ||
      reasons.every(
        (reason) => reason.includes('may have') || reason.includes('verify'),
      );

    return { qualifies, reasons };
  }

  /**
   * Helper method to get numeric year value from GraduationYear enum
   * @param graduationYear Graduation year enum
   * @returns Numeric year value
   */
  private static getGraduationYearValue(
    graduationYear: GraduationYear,
  ): number {
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
  static validateEducationRecord(education: OtEducationInternal): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    // Validate COTO alignment
    if (
      education.osot_coto_status &&
      education.osot_coto_registration !== undefined
    ) {
      const cotoValidation = this.validateCotoAlignment(
        education.osot_coto_status,
        education.osot_coto_registration,
      );
      allErrors.push(...cotoValidation.errors);
      allWarnings.push(...cotoValidation.warnings);
    }

    // Validate university-country alignment
    if (education.osot_ot_university && education.osot_ot_country) {
      const universityValidation = this.validateUniversityCountryAlignment(
        education.osot_ot_university,
        education.osot_ot_country,
      );
      allErrors.push(...universityValidation.errors);
      allWarnings.push(...universityValidation.warnings);
    }

    // Validate graduation year
    if (education.osot_ot_grad_year) {
      const graduationValidation = this.validateGraduationYear(
        education.osot_ot_grad_year,
      );
      allErrors.push(...graduationValidation.errors);
      allWarnings.push(...graduationValidation.warnings);
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
    };
  }
}
