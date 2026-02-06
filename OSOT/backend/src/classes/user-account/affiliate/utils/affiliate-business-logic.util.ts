/**
 * Affiliate Business Logic Utility
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes for business rule violations
 * - enums: Uses centralized enums for business logic validation
 * - utils: Integrates with global business rule patterns
 *
 * BUSINESS PHILOSOPHY:
 * - Essential affiliate business rules and constraints
 * - Organization profile validation and compliance
 * - Representative authorization and approval workflows
 * - Contact verification and communication protocols
 * - Geographic service area validation
 * - Privacy and access control for affiliate management
 * - Membership benefits and privilege determination
 */

import {
  AffiliateArea,
  Country,
  AccountStatus,
  Privilege,
} from '../../../../common/enums';
import type { AffiliateInternal } from '../interfaces/affiliate-internal.interface';

/**
 * Affiliate Business Logic Helper
 * Implements business rules and constraints for affiliate operations
 */
export class AffiliateBusinessLogic {
  /**
   * Check if organization can have multiple affiliate accounts
   * Business rule: Each organization should have only one affiliate account
   * @returns Whether multiple affiliate accounts are allowed
   */
  static canHaveMultipleAffiliateAccounts(): boolean {
    // Business rule: One affiliate account per organization
    return false;
  }

  /**
   * Determine required fields based on affiliate context
   * @param isRegistration Whether this is for registration
   * @param isUpdate Whether this is for an update operation
   * @returns List of required field names
   */
  static getRequiredFields(
    isRegistration: boolean = false,
    isUpdate: boolean = false,
  ): string[] {
    const requiredFields = [
      'osot_user_business_id',
      'osot_affiliate_name',
      'osot_affiliate_area',
      'osot_representative_first_name',
      'osot_representative_last_name',
      'osot_representative_job_title',
      'osot_affiliate_email',
      'osot_affiliate_phone',
      'osot_affiliate_address_1',
      'osot_affiliate_province',
      'osot_affiliate_country',
      'osot_affiliate_postal_code',
    ];

    if (isRegistration) {
      // Additional requirements for registration
      requiredFields.push(
        'osot_table_account', // Must be linked to account
        'password', // Password required for new accounts
        'osot_account_declaration', // Must accept terms
      );
    }

    if (isUpdate) {
      // For updates, some fields may be optional
      const optionalForUpdate = ['password', 'osot_account_declaration'];
      return requiredFields.filter(
        (field) => !optionalForUpdate.includes(field),
      );
    }

    return requiredFields;
  }

  /**
   * Determine affiliate access privilege based on area and verification status
   * This is the core business logic for access privilege assignment
   *
   * BUSINESS RULES:
   * 1. Healthcare affiliates get admin privileges due to professional requirements
   * 2. Government affiliates get admin access for public sector needs
   * 3. Other areas get main access
   * 4. Inactive accounts get limited privileges
   * 5. Pending accounts get limited privileges until verified
   *
   * @param affiliateArea Business area of the affiliate
   * @param isVerified Whether the affiliate has been verified
   * @param accountStatus Current account status
   * @returns Calculated access privilege
   */
  static determineAccessPrivilege(
    affiliateArea: AffiliateArea,
    isVerified: boolean = false,
    accountStatus?: AccountStatus,
  ): Privilege {
    // Business rule: Inactive accounts get limited access
    if (accountStatus === AccountStatus.INACTIVE) {
      return Privilege.MAIN; // Still allow basic access for inactive
    }

    // Business rule: Pending accounts get limited access until verified
    if (accountStatus === AccountStatus.PENDING || !isVerified) {
      return Privilege.MAIN; // Basic access until verification
    }

    // Business rule: Area-based privilege determination
    switch (affiliateArea) {
      case AffiliateArea.HEALTHCARE_AND_LIFE_SCIENCES:
        // Healthcare affiliates get admin access for professional resources
        return Privilege.ADMIN;

      case AffiliateArea.GOVERNMENT_AND_PUBLIC_SECTOR:
        // Government affiliates get admin access for public sector needs
        return Privilege.ADMIN;

      case AffiliateArea.SCIENCE_AND_RESEARCH:
        // Research organizations get admin access for data needs
        return Privilege.ADMIN;

      case AffiliateArea.NONPROFIT_AND_SOCIAL_SERVICES:
        // Non-profits get main access to support their mission
        return Privilege.MAIN;

      case AffiliateArea.PROFESSIONAL_SERVICES:
        // Professional services get main access
        return Privilege.MAIN;

      default:
        // Default to main access for other areas
        return Privilege.MAIN;
    }
  }

  /**
   * Validate representative authorization requirements
   * @param firstName Representative first name
   * @param lastName Representative last name
   * @param jobTitle Representative job title
   * @param isRegistration Whether this is for registration
   * @returns Validation result with specific error messages
   */
  static validateRepresentativeAuthorization(
    firstName?: string,
    lastName?: string,
    jobTitle?: string,
    isRegistration: boolean = false,
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Business rule: Representative information required for registration
    if (isRegistration) {
      if (!firstName?.trim()) {
        errors.push('Representative first name is required for registration');
      }
      if (!lastName?.trim()) {
        errors.push('Representative last name is required for registration');
      }
      if (!jobTitle?.trim()) {
        errors.push('Representative job title is required for registration');
      }
    }

    // Business rule: Representative should have appropriate authority
    if (jobTitle) {
      const authorizedTitles = [
        'director',
        'manager',
        'coordinator',
        'administrator',
        'president',
        'ceo',
        'coo',
        'owner',
        'principal',
        'head',
        'chief',
        'lead',
        'supervisor',
      ];

      const hasAuthorizedTitle = authorizedTitles.some((title) =>
        jobTitle.toLowerCase().includes(title),
      );

      if (!hasAuthorizedTitle) {
        warnings.push(
          'Representative job title may require verification of authority to act on behalf of organization',
        );
      }
    }

    // Business rule: Check for meaningful names
    if (firstName && lastName) {
      if (firstName.toLowerCase() === lastName.toLowerCase()) {
        errors.push('Representative first and last names must be different');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate organization profile requirements
   * @param affiliateName Organization name
   * @param affiliateArea Business area
   * @param country Country of operation
   * @returns Validation result
   */
  static validateOrganizationProfile(
    affiliateName?: string,
    affiliateArea?: AffiliateArea,
    country?: Country,
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Business rule: Organization name must be meaningful
    if (affiliateName) {
      const trimmedName = affiliateName.trim();

      // Check for placeholder names
      const placeholderNames = ['test', 'demo', 'example', 'temp', 'sample'];
      if (
        placeholderNames.some((placeholder) =>
          trimmedName.toLowerCase().includes(placeholder),
        )
      ) {
        warnings.push(
          'Organization name appears to be a placeholder - verify authenticity',
        );
      }

      // Check for single word names (may indicate incomplete information)
      if (!trimmedName.includes(' ') && trimmedName.length < 10) {
        warnings.push(
          'Organization name is very short - consider providing full legal name',
        );
      }
    }

    // Business rule: Area-specific validation
    if (affiliateArea && country) {
      // Business rule: Healthcare organizations may require additional verification
      if (affiliateArea === AffiliateArea.HEALTHCARE_AND_LIFE_SCIENCES) {
        warnings.push(
          'Healthcare affiliates may require professional license verification',
        );
      }

      // Government organizations require special handling
      if (affiliateArea === AffiliateArea.GOVERNMENT_AND_PUBLIC_SECTOR) {
        warnings.push(
          'Government affiliates require additional verification and approval',
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
   * Check if affiliate requires special verification
   * @param affiliateArea Business area
   * @param country Country of operation
   * @param website Organization website
   * @returns Whether special verification is required
   */
  static requiresSpecialVerification(
    affiliateArea?: AffiliateArea,
    country?: Country,
    website?: string,
  ): boolean {
    // Business rule: Healthcare organizations require verification
    if (affiliateArea === AffiliateArea.HEALTHCARE_AND_LIFE_SCIENCES) {
      return true;
    }

    // Business rule: Government organizations require verification
    if (affiliateArea === AffiliateArea.GOVERNMENT_AND_PUBLIC_SECTOR) {
      return true;
    }

    // Business rule: International affiliates require verification
    if (country && country !== Country.CANADA) {
      return true;
    }

    // Business rule: Organizations without websites may require verification
    if (!website || website.trim().length === 0) {
      return true;
    }

    return false;
  }

  /**
   * Helper method to get affiliate area display name
   * @param affiliateArea Affiliate area enum
   * @returns Human-readable area name
   */
  static getAffiliateAreaDisplayName(affiliateArea?: AffiliateArea): string {
    if (!affiliateArea) return 'Not specified';

    const areaNames = {
      [AffiliateArea.OTHER]: 'Other',
      [AffiliateArea.HEALTHCARE_AND_LIFE_SCIENCES]:
        'Healthcare and Life Sciences',
      [AffiliateArea.GOVERNMENT_AND_PUBLIC_SECTOR]:
        'Government and Public Sector',
      [AffiliateArea.CONSTRUCTION_REAL_ESTATE_AND_PROPERTY_MANAGEMENT]:
        'Construction, Real Estate and Property Management',
      [AffiliateArea.CONSUMER_GOODS_AND_RETAIL]: 'Consumer Goods and Retail',
      [AffiliateArea.FINANCIAL_SERVICES_AND_INSURANCE]:
        'Financial Services and Insurance',
      [AffiliateArea.INFORMATION_TECHNOLOGY_AND_SOFTWARE]:
        'Information Technology and Software',
      [AffiliateArea.LEGAL_SERVICES]: 'Legal Services',
      [AffiliateArea.NONPROFIT_AND_SOCIAL_SERVICES]:
        'Nonprofit and Social Services',
      [AffiliateArea.PHARMACEUTICALS_AND_BIOTECHNOLOGY]:
        'Pharmaceuticals and Biotechnology',
      [AffiliateArea.PROFESSIONAL_SERVICES]: 'Professional Services',
      [AffiliateArea.SCIENCE_AND_RESEARCH]: 'Science and Research',
    };

    return areaNames[affiliateArea] || 'Unknown Area';
  }

  /**
   * Validate complete affiliate record for business rules
   * @param affiliate Complete affiliate record
   * @returns Comprehensive validation result
   */
  static validateAffiliateRecord(affiliate: AffiliateInternal): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    // Validate representative authorization
    const repValidation = this.validateRepresentativeAuthorization(
      affiliate.osot_representative_first_name,
      affiliate.osot_representative_last_name,
      affiliate.osot_representative_job_title,
      true, // Assume registration context for comprehensive validation
    );
    allErrors.push(...repValidation.errors);
    allWarnings.push(...repValidation.warnings);

    // Validate organization profile
    const orgValidation = this.validateOrganizationProfile(
      affiliate.osot_affiliate_name,
      affiliate.osot_affiliate_area,
      affiliate.osot_affiliate_country,
    );
    allErrors.push(...orgValidation.errors);
    allWarnings.push(...orgValidation.warnings);

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
    };
  }

  /**
   * Generate affiliate summary for display
   * @param affiliate Complete affiliate record
   * @returns Human-readable affiliate summary
   */
  static generateAffiliateSummary(affiliate: AffiliateInternal): string {
    const parts: string[] = [];

    if (affiliate.osot_affiliate_name) {
      parts.push(affiliate.osot_affiliate_name);
    }

    if (affiliate.osot_affiliate_area) {
      parts.push(
        this.getAffiliateAreaDisplayName(affiliate.osot_affiliate_area),
      );
    }

    if (
      affiliate.osot_representative_first_name &&
      affiliate.osot_representative_last_name
    ) {
      parts.push(
        `Contact: ${affiliate.osot_representative_first_name} ${affiliate.osot_representative_last_name}`,
      );
    }

    return (
      parts.filter(Boolean).join(' | ') || 'Affiliate details not specified'
    );
  }
}
