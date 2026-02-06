/**
 * Contact Business Logic Utility
 *
 * Provides business logic and rule validation functions specific to contacts.
 * Enforces business constraints and relationships with full integration.
 *
 * Integration Features:
 * - AccessModifier and Privilege enum integration for role-based validation
 * - Type-safe business rule enforcement using project enums
 * - Consistent validation patterns following project standards
 * - Role-based access control using standardized user roles
 */

import { ContactInternal } from '../interfaces/contact-internal.interface';
// import { AccessModifier } from '../../../../common/enums/access-modifier.enum';
import { Privilege } from '../../../../common/enums/privilege.enum';

/**
 * Contact Business Logic Helper
 * Implements business rules and constraints for contact operations
 */
export class ContactBusinessLogic {
  /**
   * Check if contact can have multiple phone numbers
   * @returns Whether multiple phones are allowed
   */
  static canHaveMultiplePhones(): boolean {
    // Business rule: Contacts can have both home and work phones
    return true;
  }

  /**
   * Determine required fields based on contact context
   * @param isRegistration Whether this is for registration
   * @param hasBusinessWebsite Whether contact has business website
   * @returns List of required field names
   */
  static getRequiredFields(
    isRegistration: boolean = false,
    hasBusinessWebsite: boolean = false,
  ): string[] {
    const requiredFields = ['osot_user_business_id']; // Always required

    if (isRegistration) {
      // Additional requirements for registration
      if (hasBusinessWebsite) {
        requiredFields.push('osot_job_title');
      }
    }

    return requiredFields;
  }

  /**
   * Validate phone number business rules
   * @param homePhone Home phone number
   * @param workPhone Work phone number
   * @returns Validation result
   */
  static validatePhoneRules(
    homePhone?: string,
    workPhone?: string,
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Business rule: At least one phone number should be provided if any is provided
    const hasHomePhone = Boolean(homePhone && homePhone.trim());
    const hasWorkPhone = Boolean(workPhone && workPhone.trim());

    if (hasHomePhone && hasWorkPhone && homePhone === workPhone) {
      errors.push('Home phone and work phone cannot be the same');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate social media presence rules
   * @param contact Contact data
   * @returns Validation result
   */
  static validateSocialMediaRules(contact: Partial<ContactInternal>): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const socialMediaFields = [
      contact.osot_facebook,
      contact.osot_instagram,
      contact.osot_tiktok,
      contact.osot_linkedin,
    ];

    const activeSocialMediaCount = socialMediaFields.filter(Boolean).length;

    // Business rule: If business website exists, recommend LinkedIn
    if (contact.osot_business_website && !contact.osot_linkedin) {
      warnings.push(
        'LinkedIn profile recommended for contacts with business website',
      );
    }

    // Business rule: Professional contacts should prioritize LinkedIn over other platforms
    if (
      contact.osot_job_title &&
      (contact.osot_facebook ||
        contact.osot_instagram ||
        contact.osot_tiktok) &&
      !contact.osot_linkedin
    ) {
      warnings.push(
        'LinkedIn recommended for professional contacts over other social media',
      );
    }

    // Business rule: Maximum social media platforms (4 available: Facebook, Instagram, TikTok, LinkedIn)
    const maxSocialMediaPlatforms = 4;
    if (activeSocialMediaCount > maxSocialMediaPlatforms) {
      errors.push(
        `Maximum ${maxSocialMediaPlatforms} social media platforms allowed`,
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * User roles for business logic validation
   * Enhanced with enum-based access control
   */
  static getUserRoleFromPrivilege(
    privilege?: Privilege,
  ): 'admin' | 'user' | 'readonly' {
    switch (privilege) {
      case Privilege.OWNER:
      case Privilege.ADMIN:
        return 'admin';
      case Privilege.MAIN:
        return 'user';
      default:
        return 'readonly';
    }
  }

  /**
   * Check if contact data update is allowed based on business rules
   * Enhanced with enum-based privilege checking
   * @param existingContact Current contact data
   * @param updateData Proposed update data
   * @param userPrivilege User's privilege level (enum-based)
   * @returns Whether update is allowed
   */
  static isUpdateAllowed(
    existingContact: ContactInternal,
    updateData: Partial<ContactInternal>,
    userPrivilege: Privilege = Privilege.MAIN,
  ): {
    isAllowed: boolean;
    restrictedFields: string[];
    reason?: string;
  } {
    const restrictedFields: string[] = [];
    const userRole = this.getUserRoleFromPrivilege(userPrivilege);

    // Business rule: User Business ID cannot be changed after creation
    if (
      updateData.osot_user_business_id &&
      updateData.osot_user_business_id !== existingContact.osot_user_business_id
    ) {
      restrictedFields.push('osot_user_business_id');
    }

    // Business rule: Only admins can modify access modifiers and privileges
    if (userRole !== 'admin') {
      if (updateData.osot_access_modifiers !== undefined) {
        restrictedFields.push('osot_access_modifiers');
      }
      if (updateData.osot_privilege !== undefined) {
        restrictedFields.push('osot_privilege');
      }
    }

    // Business rule: Readonly users cannot modify anything
    if (userRole === 'readonly') {
      return {
        isAllowed: false,
        restrictedFields: Object.keys(updateData),
        reason: 'Readonly access - no modifications allowed',
      };
    }

    return {
      isAllowed: restrictedFields.length === 0,
      restrictedFields,
      reason:
        restrictedFields.length > 0
          ? `Cannot modify: ${restrictedFields.join(', ')}`
          : undefined,
    };
  }

  /**
   * Generate contact completeness score
   * @param contact Contact data
   * @returns Completeness score (0-100)
   */
  static calculateCompletenessScore(contact: Partial<ContactInternal>): {
    score: number;
    missingFields: string[];
    suggestions: string[];
  } {
    // Note: Total fields available in CSV specification: 18
    const suggestions: string[] = [];
    const missingFields: string[] = [];

    let filledFields = 0;

    // Check required fields (weight: 3 points each)
    if (contact.osot_user_business_id) {
      filledFields += 3;
    } else {
      missingFields.push('User Business ID (required)');
    }

    // Check important fields (weight: 2 points each)
    const importantFields = [
      'osot_secondary_email',
      'osot_home_phone',
      'osot_work_phone',
      'osot_job_title',
    ];

    importantFields.forEach((field) => {
      if (contact[field as keyof ContactInternal]) {
        filledFields += 2;
      } else {
        missingFields.push(field.replace('osot_', '').replace('_', ' '));
      }
    });

    // Check optional fields (weight: 1 point each)
    const optionalFields = [
      'osot_business_website',
      'osot_facebook',
      'osot_instagram',
      'osot_tiktok',
      'osot_linkedin',
    ];

    optionalFields.forEach((field) => {
      if (contact[field as keyof ContactInternal]) {
        filledFields += 1;
      }
    });

    // Calculate score (max possible: 3 + 8 + 5 = 16 points)
    const maxPossiblePoints = 16;
    const score = Math.round((filledFields / maxPossiblePoints) * 100);

    // Generate suggestions
    if (!contact.osot_secondary_email) {
      suggestions.push('Add secondary email for better communication');
    }

    if (!contact.osot_home_phone && !contact.osot_work_phone) {
      suggestions.push('Add at least one phone number for contact options');
    }

    if (!contact.osot_job_title) {
      suggestions.push('Add job title for professional context');
    }

    if (!contact.osot_linkedin && contact.osot_job_title) {
      suggestions.push('Add LinkedIn profile for professional networking');
    }

    if (contact.osot_business_website && !contact.osot_linkedin) {
      suggestions.push('LinkedIn profile recommended for business contacts');
    }

    return {
      score,
      missingFields,
      suggestions,
    };
  }

  /**
   * Validate contact data consistency
   * @param contact Contact data
   * @returns Consistency validation result
   */
  static validateDataConsistency(contact: Partial<ContactInternal>): {
    isConsistent: boolean;
    inconsistencies: string[];
  } {
    const inconsistencies: string[] = [];

    // Check email consistency
    if (contact.osot_secondary_email) {
      const emailDomain = contact.osot_secondary_email.split('@')[1];

      // If business website exists, check domain consistency
      if (contact.osot_business_website) {
        const websiteDomain = contact.osot_business_website
          .replace(/^https?:\/\//, '')
          .replace(/^www\./, '')
          .split('/')[0];

        if (emailDomain !== websiteDomain) {
          inconsistencies.push(
            'Email domain differs from business website domain',
          );
        }
      }
    }

    // Check professional consistency
    if (
      contact.osot_job_title &&
      !contact.osot_business_website &&
      !contact.osot_linkedin
    ) {
      inconsistencies.push(
        'Professional job title provided but no business website or LinkedIn profile',
      );
    }

    // Check phone number format consistency
    if (contact.osot_home_phone && contact.osot_work_phone) {
      // Both should follow same format pattern
      const homeFormat = contact.osot_home_phone.length;
      const workFormat = contact.osot_work_phone.length;

      if (Math.abs(homeFormat - workFormat) > 1) {
        inconsistencies.push('Phone number formats should be consistent');
      }
    }

    return {
      isConsistent: inconsistencies.length === 0,
      inconsistencies,
    };
  }
}
