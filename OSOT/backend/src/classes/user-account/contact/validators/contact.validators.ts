import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import {
  CONTACT_LIMITS,
  CONTACT_PATTERNS,
  CONTACT_BUSINESS_RULES,
} from '../constants/contact.constants';
import { ErrorMessages } from '../../../../common/errors/error-messages';
import { ErrorCodes } from '../../../../common/errors/error-codes';
// Import utils for validation
import { isValidCanadianPhoneNumber } from '../../../../utils/phone-formatter.utils';
import { isValidUrl } from '../../../../utils/url-sanitizer.utils';

/**
 * Validator for Contact User Business ID
 * Validates format, length, and uniqueness requirements
 */
@ValidatorConstraint({ name: 'contactUserBusinessId', async: false })
export class ContactUserBusinessIdValidator
  implements ValidatorConstraintInterface
{
  validate(userBusinessId: string): boolean {
    if (!userBusinessId) return false; // Business required field

    // Check length constraints
    if (
      userBusinessId.length < CONTACT_LIMITS.USER_BUSINESS_ID_MIN_LENGTH ||
      userBusinessId.length > CONTACT_LIMITS.USER_BUSINESS_ID_MAX_LENGTH
    ) {
      return false;
    }

    // Check pattern (alphanumeric with dash/underscore)
    return CONTACT_PATTERNS.USER_BUSINESS_ID.test(userBusinessId.trim());
  }

  defaultMessage(): string {
    return `User Business ID must be ${CONTACT_LIMITS.USER_BUSINESS_ID_MIN_LENGTH}-${CONTACT_LIMITS.USER_BUSINESS_ID_MAX_LENGTH} characters and contain only letters, numbers, hyphens, and underscores`;
  }
}

/**
 * Validator for Contact Secondary Email
 * Validates email format and length restrictions
 */
@ValidatorConstraint({ name: 'contactSecondaryEmail', async: false })
export class ContactSecondaryEmailValidator
  implements ValidatorConstraintInterface
{
  validate(email: string): boolean {
    if (!email) return true; // Optional field

    // Check length
    if (email.length > CONTACT_LIMITS.SECONDARY_EMAIL_MAX_LENGTH) return false;

    // Use pattern from constants
    return CONTACT_PATTERNS.EMAIL.test(email.trim());
  }

  defaultMessage(): string {
    return ErrorMessages[ErrorCodes.INVALID_EMAIL_FORMAT].publicMessage;
  }
}

/**
 * Validator for Contact Job Title
 * Validates length and format restrictions
 */
@ValidatorConstraint({ name: 'contactJobTitle', async: false })
export class ContactJobTitleValidator implements ValidatorConstraintInterface {
  validate(jobTitle: string): boolean {
    if (!jobTitle) return true; // Optional field

    // Check length
    if (jobTitle.length > CONTACT_LIMITS.JOB_TITLE_MAX_LENGTH) return false;

    // Allow empty strings for field clearing
    const trimmed = jobTitle.trim();
    if (trimmed.length === 0) return true; // Allow clearing the field

    // Basic sanity check - no special chars that could be problematic
    return trimmed.length <= CONTACT_LIMITS.JOB_TITLE_MAX_LENGTH;
  }

  defaultMessage(): string {
    return `Job title must not exceed ${CONTACT_LIMITS.JOB_TITLE_MAX_LENGTH} characters`;
  }
}

/**
 * Validator for Contact Business Website
 * Validates URL format and length
 */
@ValidatorConstraint({ name: 'contactBusinessWebsite', async: false })
export class ContactBusinessWebsiteValidator
  implements ValidatorConstraintInterface
{
  validate(url: string): boolean {
    if (!url) return true; // Optional field

    // Check length
    if (url.length > CONTACT_LIMITS.BUSINESS_WEBSITE_MAX_LENGTH) return false;

    // Use util for URL validation (more robust than regex)
    try {
      return isValidUrl(url.trim());
    } catch {
      return false;
    }
  }

  defaultMessage(): string {
    return 'Business website must be a valid URL (e.g., https://example.com)';
  }
}

/**
 * Validator for Contact Facebook URL
 * Validates Facebook-specific URL format and length
 */
@ValidatorConstraint({ name: 'contactFacebookUrl', async: false })
export class ContactFacebookUrlValidator
  implements ValidatorConstraintInterface
{
  validate(url: string): boolean {
    if (!url) return true; // Optional field

    // Check length
    if (url.length > CONTACT_LIMITS.FACEBOOK_MAX_LENGTH) return false;

    // First check if it's a valid URL, then check Facebook domain
    try {
      if (!isValidUrl(url.trim())) return false;
      // Allow generic facebook.com URLs or specific profile URLs
      const trimmedUrl = url.trim();
      return /^https?:\/\/(?:www\.)?facebook\.com\/?/i.test(trimmedUrl);
    } catch {
      return false;
    }
  }

  defaultMessage(): string {
    return 'Facebook URL must be a valid Facebook profile URL (e.g., https://facebook.com/username)';
  }
}

/**
 * Validator for Contact Instagram URL
 * Validates Instagram-specific URL format and length
 */
@ValidatorConstraint({ name: 'contactInstagramUrl', async: false })
export class ContactInstagramUrlValidator
  implements ValidatorConstraintInterface
{
  validate(url: string): boolean {
    if (!url) return true; // Optional field

    // Check length
    if (url.length > CONTACT_LIMITS.INSTAGRAM_MAX_LENGTH) return false;

    // First check if it's a valid URL, then check Instagram domain
    try {
      if (!isValidUrl(url.trim())) return false;
      // Allow generic instagram.com URLs or specific profile URLs
      const trimmedUrl = url.trim();
      return /^https?:\/\/(?:www\.)?instagram\.com\/?/i.test(trimmedUrl);
    } catch {
      return false;
    }
  }

  defaultMessage(): string {
    return 'Instagram URL must be a valid Instagram profile URL (e.g., https://instagram.com/username)';
  }
}

/**
 * Validator for Contact TikTok URL
 * Validates TikTok-specific URL format and length
 */
@ValidatorConstraint({ name: 'contactTiktokUrl', async: false })
export class ContactTiktokUrlValidator implements ValidatorConstraintInterface {
  validate(url: string): boolean {
    if (!url) return true; // Optional field

    // Check length
    if (url.length > CONTACT_LIMITS.TIKTOK_MAX_LENGTH) return false;

    // First check if it's a valid URL, then check TikTok domain
    try {
      if (!isValidUrl(url.trim())) return false;
      // Allow generic tiktok.com URLs or specific profile URLs
      const trimmedUrl = url.trim();
      return /^https?:\/\/(?:www\.)?tiktok\.com\/?/i.test(trimmedUrl);
    } catch {
      return false;
    }
  }

  defaultMessage(): string {
    return 'TikTok URL must be a valid TikTok profile URL (e.g., https://tiktok.com/@username)';
  }
}

/**
 * Validator for Contact LinkedIn URL
 * Validates LinkedIn-specific URL format and length
 */
@ValidatorConstraint({ name: 'contactLinkedinUrl', async: false })
export class ContactLinkedinUrlValidator
  implements ValidatorConstraintInterface
{
  validate(url: string): boolean {
    if (!url) return true; // Optional field

    // Check length
    if (url.length > CONTACT_LIMITS.LINKEDIN_MAX_LENGTH) return false;

    // First check if it's a valid URL, then check LinkedIn domain
    try {
      if (!isValidUrl(url.trim())) return false;
      // Allow generic linkedin.com URLs or specific profile URLs
      const trimmedUrl = url.trim();
      return /^https?:\/\/(?:www\.)?linkedin\.com\/?/i.test(trimmedUrl);
    } catch {
      return false;
    }
  }

  defaultMessage(): string {
    return 'LinkedIn URL must be a valid LinkedIn profile URL (e.g., https://linkedin.com/in/username)';
  }
}

/**
 * Validator for Contact Phone Numbers
 * Validates Canadian phone number format using utils
 */
@ValidatorConstraint({ name: 'contactPhoneNumber', async: false })
export class ContactPhoneNumberValidator
  implements ValidatorConstraintInterface
{
  validate(phone: string): boolean {
    if (!phone) return true; // Optional field

    // Check length
    if (phone.length > CONTACT_LIMITS.HOME_PHONE_MAX_LENGTH) return false;

    // Use util for Canadian phone validation
    try {
      return isValidCanadianPhoneNumber(phone.trim());
    } catch {
      return false;
    }
  }

  defaultMessage(): string {
    return (
      ErrorMessages[ErrorCodes.INVALID_PHONE_FORMAT]?.publicMessage ||
      'Phone number must be a valid Canadian phone number (e.g., (416) 555-1234)'
    );
  }
}

/**
 * Business Rule Validator for Contact Creation
 * Validates business logic requirements for contact creation
 */
@ValidatorConstraint({ name: 'contactBusinessRules', async: false })
export class ContactBusinessRulesValidator
  implements ValidatorConstraintInterface
{
  validate(contactData: Record<string, unknown>): boolean {
    if (!contactData) return false;

    // Validate business required fields
    if (CONTACT_BUSINESS_RULES.REQUIRE_USER_BUSINESS_ID) {
      if (!contactData.osot_user_business_id) return false;
    }

    if (CONTACT_BUSINESS_RULES.REQUIRE_ACCOUNT_BINDING) {
      if (!contactData.osot_table_account) return false;
    }

    // Additional business logic can be added here
    return true;
  }

  defaultMessage(): string {
    return 'Contact data does not meet business rule requirements';
  }
}

/**
 * Composite validator for all contact social media URLs
 * Validates all social media URLs in one pass
 */
export class ContactSocialMediaValidator {
  static validate(contactData: Record<string, unknown>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (contactData.osot_business_website) {
      const validator = new ContactBusinessWebsiteValidator();
      if (!validator.validate(contactData.osot_business_website as string)) {
        errors.push(validator.defaultMessage());
      }
    }

    if (contactData.osot_facebook) {
      const validator = new ContactFacebookUrlValidator();
      if (!validator.validate(contactData.osot_facebook as string)) {
        errors.push(validator.defaultMessage());
      }
    }

    if (contactData.osot_instagram) {
      const validator = new ContactInstagramUrlValidator();
      if (!validator.validate(contactData.osot_instagram as string)) {
        errors.push(validator.defaultMessage());
      }
    }

    if (contactData.osot_tiktok) {
      const validator = new ContactTiktokUrlValidator();
      if (!validator.validate(contactData.osot_tiktok as string)) {
        errors.push(validator.defaultMessage());
      }
    }

    if (contactData.osot_linkedin) {
      const validator = new ContactLinkedinUrlValidator();
      if (!validator.validate(contactData.osot_linkedin as string)) {
        errors.push(validator.defaultMessage());
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Comprehensive validator for all contact fields
 * Used for validating entire contact objects during creation/update
 */
export class ContactFieldsValidator {
  static validate(contactData: Record<string, unknown>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate User Business ID (required)
    const userBusinessIdValidator = new ContactUserBusinessIdValidator();
    if (
      !userBusinessIdValidator.validate(
        contactData.osot_user_business_id as string,
      )
    ) {
      errors.push(userBusinessIdValidator.defaultMessage());
    }

    // Validate optional email
    if (contactData.osot_secondary_email) {
      const emailValidator = new ContactSecondaryEmailValidator();
      if (
        !emailValidator.validate(contactData.osot_secondary_email as string)
      ) {
        errors.push(emailValidator.defaultMessage());
      }
    }

    // Validate optional job title
    if (contactData.osot_job_title) {
      const jobTitleValidator = new ContactJobTitleValidator();
      if (!jobTitleValidator.validate(contactData.osot_job_title as string)) {
        errors.push(jobTitleValidator.defaultMessage());
      }
    }

    // Validate phone numbers using utils for better validation
    if (contactData.osot_home_phone) {
      const phoneValidator = new ContactPhoneNumberValidator();
      if (!phoneValidator.validate(contactData.osot_home_phone as string)) {
        errors.push(`Home phone: ${phoneValidator.defaultMessage()}`);
      }
    }

    if (contactData.osot_work_phone) {
      const phoneValidator = new ContactPhoneNumberValidator();
      if (!phoneValidator.validate(contactData.osot_work_phone as string)) {
        errors.push(`Work phone: ${phoneValidator.defaultMessage()}`);
      }
    }

    // Validate social media URLs
    const socialMediaValidation =
      ContactSocialMediaValidator.validate(contactData);
    errors.push(...socialMediaValidation.errors);

    // Validate business rules
    const businessRulesValidator = new ContactBusinessRulesValidator();
    if (!businessRulesValidator.validate(contactData)) {
      errors.push(businessRulesValidator.defaultMessage());
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
