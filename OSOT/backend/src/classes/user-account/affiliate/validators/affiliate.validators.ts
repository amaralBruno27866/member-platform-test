/**
 * Affiliate Validators (Refactored)
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - constants: Uses AFFILIATE_FIELD_LIMITS and AFFILIATE_VALIDATION_PATTERNS
 * - enums: Validates against centralized enums (AffiliateArea, AccountStatus, Province, Country)
 * - utils: Leverages phone, URL, and validation utilities for consistency
 * - errors: Uses ErrorCodes and ErrorMessages for structured error handling
 *
 * VALIDATION SCOPE (Core Field Validators Only):
 * - Organization profile validation (name, area)
 * - Representative identity validation (names, job title)
 * - Contact information validation (email, phone, website)
 * - Address and postal code validation (country-specific)
 * - Social media URL validation (platform-specific)
 * - Password security validation (strength, policy compliance)
 * - Business rules compliance and cross-field validation
 *
 * REFACTORED ARCHITECTURE:
 * - Utility functions moved to affiliate-helpers.util.ts
 * - Business logic moved to affiliate-business-logic.util.ts
 * - Composite validators replaced with centralized business logic
 * - Validators now focused solely on field-level validation
 *
 * BUSINESS CONTEXT:
 * - Affiliate module consolidates address, contact, identity, and account validation
 * - Representative validation ensures contact person information is complete
 * - Organization validation ensures business profile data integrity
 * - Geographic validation supports Canadian/US address requirements
 * - Security validation enforces password policies and account declarations
 *
 * All validators implement class-validator's ValidatorConstraintInterface
 * and use centralized error messages for consistency across the application.
 *
 * @author OSOT Development Team
 * @version 2.1.0 (Refactored)
 */

// Essential modules integration
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

// Affiliate constants and configurations
import {
  AFFILIATE_FIELD_LIMITS,
  AFFILIATE_VALIDATION_PATTERNS,
  AFFILIATE_AREAS,
  AFFILIATE_ACCOUNT_STATUS,
  AFFILIATE_ACCESS_MODIFIERS,
  AFFILIATE_PROVINCES,
  AFFILIATE_COUNTRIES,
  AFFILIATE_BUSINESS_RULES,
} from '../constants/affiliate.constants';

// Centralized error handling
import { ErrorMessages } from '../../../../common/errors/error-messages';
import { ErrorCodes } from '../../../../common/errors/error-codes';

// Centralized enums using standardized import path
import {
  AffiliateArea,
  AccountStatus,
  AccessModifier,
  Province,
  Country,
} from '../../../../common/enums';

// Essential utils integration
import { isValidCanadianPhoneNumber } from '../../../../utils/phone-formatter.utils';
import { isValidUrl } from '../../../../utils/url-sanitizer.utils';

// ========================================
// ORGANIZATION PROFILE VALIDATORS
// ========================================

/**
 * Validator for Affiliate Name
 * Validates organization name format and length requirements
 * Integrated with centralized error handling
 */
@ValidatorConstraint({ name: 'affiliateName', async: false })
export class AffiliateNameValidator implements ValidatorConstraintInterface {
  validate(affiliateName: string): boolean {
    if (!affiliateName) return false; // Business required field

    const trimmedName = affiliateName.trim();

    // Check length constraints
    if (
      trimmedName.length < 2 ||
      trimmedName.length > AFFILIATE_FIELD_LIMITS.NAME
    ) {
      return false;
    }

    // Check for reasonable organization name format
    // Allow letters, numbers, spaces, and common business characters
    const businessNamePattern = /^[a-zA-Z0-9\s\-.,&()'"]+$/;
    if (!businessNamePattern.test(trimmedName)) {
      return false;
    }

    // Ensure it's not just numbers or special characters
    if (!/[a-zA-Z]/.test(trimmedName)) {
      return false;
    }

    return true;
  }

  defaultMessage(): string {
    return `Affiliate name must be 2-${AFFILIATE_FIELD_LIMITS.NAME} characters and contain at least one letter`;
  }
}

/**
 * Validator for Affiliate Area
 * Validates business area against allowed enum values
 * Integrated with centralized enums
 */
@ValidatorConstraint({ name: 'affiliateArea', async: false })
export class AffiliateAreaValidator implements ValidatorConstraintInterface {
  validate(area: AffiliateArea | number): boolean {
    if (area === undefined || area === null) return false; // Business required

    // Check if it's a valid area value
    const validAreas = Object.values(AFFILIATE_AREAS) as number[];
    return validAreas.includes(Number(area));
  }

  defaultMessage(): string {
    return ErrorMessages[ErrorCodes.VALIDATION_ERROR].publicMessage;
  }
}

// ========================================
// REPRESENTATIVE IDENTITY VALIDATORS
// ========================================

/**
 * Validator for Representative First Name
 * Validates first name format and length requirements
 * Integrated with centralized error handling
 */
@ValidatorConstraint({ name: 'representativeFirstName', async: false })
export class RepresentativeFirstNameValidator
  implements ValidatorConstraintInterface
{
  validate(firstName: string): boolean {
    if (!firstName) return false; // Business required field

    const trimmedName = firstName.trim();

    // Check length constraints
    if (
      trimmedName.length < 1 ||
      trimmedName.length > AFFILIATE_FIELD_LIMITS.FIRST_NAME
    ) {
      return false;
    }

    // Check for valid name format (letters, spaces, hyphens, apostrophes)
    const namePattern = /^[a-zA-Z\s\-'.]+$/;
    return namePattern.test(trimmedName);
  }

  defaultMessage(): string {
    return ErrorMessages[ErrorCodes.INVALID_NAME_FORMAT].publicMessage;
  }
}

/**
 * Validator for Representative Last Name
 * Validates last name format and length requirements
 * Integrated with centralized error handling
 */
@ValidatorConstraint({ name: 'representativeLastName', async: false })
export class RepresentativeLastNameValidator
  implements ValidatorConstraintInterface
{
  validate(lastName: string): boolean {
    if (!lastName) return false; // Business required field

    const trimmedName = lastName.trim();

    // Check length constraints
    if (
      trimmedName.length < 1 ||
      trimmedName.length > AFFILIATE_FIELD_LIMITS.LAST_NAME
    ) {
      return false;
    }

    // Check for valid name format
    const namePattern = /^[a-zA-Z\s\-'.]+$/;
    return namePattern.test(trimmedName);
  }

  defaultMessage(): string {
    return ErrorMessages[ErrorCodes.INVALID_NAME_FORMAT].publicMessage;
  }
}

/**
 * Validator for Representative Job Title
 * Validates job title format and length requirements
 * Integrated with centralized error handling
 */
@ValidatorConstraint({ name: 'representativeJobTitle', async: false })
export class RepresentativeJobTitleValidator
  implements ValidatorConstraintInterface
{
  validate(jobTitle: string): boolean {
    if (!jobTitle) return false; // Business required field

    const trimmedTitle = jobTitle.trim();

    // Check length constraints
    if (
      trimmedTitle.length < 2 ||
      trimmedTitle.length > AFFILIATE_FIELD_LIMITS.JOB_TITLE
    ) {
      return false;
    }

    // Allow letters, numbers, spaces, and common job title characters
    const jobTitlePattern = /^[a-zA-Z0-9\s\-.,&()/]+$/;
    if (!jobTitlePattern.test(trimmedTitle)) {
      return false;
    }

    // Ensure it contains at least one letter
    if (!/[a-zA-Z]/.test(trimmedTitle)) {
      return false;
    }

    return true;
  }

  defaultMessage(): string {
    return `Job title must be 2-${AFFILIATE_FIELD_LIMITS.JOB_TITLE} characters and contain at least one letter`;
  }
}

// ========================================
// CONTACT INFORMATION VALIDATORS
// ========================================

/**
 * Validator for Affiliate Email
 * Validates email format and length requirements
 * Integrated with centralized error handling
 */
@ValidatorConstraint({ name: 'affiliateEmail', async: false })
export class AffiliateEmailValidator implements ValidatorConstraintInterface {
  validate(email: string): boolean {
    if (!email) return false; // Business required field

    const trimmedEmail = email.trim().toLowerCase();

    // Check length constraints
    if (trimmedEmail.length > AFFILIATE_FIELD_LIMITS.EMAIL) {
      return false;
    }

    // Use the pattern from constants
    return AFFILIATE_VALIDATION_PATTERNS.EMAIL.test(trimmedEmail);
  }

  defaultMessage(): string {
    return ErrorMessages[ErrorCodes.INVALID_EMAIL_FORMAT].publicMessage;
  }
}

/**
 * Validator for Affiliate Phone
 * Validates phone number format using utility function
 * Integrated with centralized phone validation utility
 */
@ValidatorConstraint({ name: 'affiliatePhone', async: false })
export class AffiliatePhoneValidator implements ValidatorConstraintInterface {
  validate(phone: string): boolean {
    if (!phone || phone.trim().length === 0) return false;

    const trimmed = phone.trim();

    // Check exact length for Canadian format: (XXX) XXX-XXXX
    if (trimmed.length !== AFFILIATE_FIELD_LIMITS.PHONE) {
      return false;
    }

    // Use pattern from constants for Canadian format validation
    return AFFILIATE_VALIDATION_PATTERNS.PHONE.test(trimmed);
  }

  defaultMessage(): string {
    return 'Phone must be in Canadian format: (XXX) XXX-XXXX';
  }
}

/**
 * Validator for Affiliate Website URL
 * Validates business website URL format and length
 * Integrated with centralized URL validation utility
 */
@ValidatorConstraint({ name: 'affiliateWebsite', async: false })
export class AffiliateWebsiteValidator implements ValidatorConstraintInterface {
  validate(website: string): boolean {
    if (!website) return true; // Optional field

    const trimmedUrl = website.trim();

    // Check length constraints
    if (trimmedUrl.length > AFFILIATE_FIELD_LIMITS.WEBSITE) {
      return false;
    }

    // Use utility function for URL validation
    if (!isValidUrl(trimmedUrl)) {
      return false;
    }

    // Ensure it's not a social media URL (should use dedicated fields)
    const socialDomains = [
      'facebook.com',
      'instagram.com',
      'tiktok.com',
      'linkedin.com',
      'twitter.com',
      'youtube.com',
    ];

    for (const domain of socialDomains) {
      if (trimmedUrl.toLowerCase().includes(domain)) {
        return false;
      }
    }

    return true;
  }

  defaultMessage(): string {
    return 'Website URL must be a valid business website URL (not a social media link)';
  }
}

// ========================================
// ADDRESS & POSTAL CODE VALIDATORS
// ========================================

/**
 * Validator for Affiliate Address Line 1
 * Validates primary address format and length requirements
 * Integrated with centralized error handling
 */
@ValidatorConstraint({ name: 'affiliateAddress1', async: false })
export class AffiliateAddress1Validator
  implements ValidatorConstraintInterface
{
  validate(address: string): boolean {
    if (!address) return false; // Business required field

    const trimmedAddress = address.trim();

    // Check length constraints
    if (
      trimmedAddress.length < 5 ||
      trimmedAddress.length > AFFILIATE_FIELD_LIMITS.ADDRESS_1
    ) {
      return false;
    }

    // Allow letters, numbers, spaces, and common address characters
    const addressPattern = /^[a-zA-Z0-9\s\-.,#/]+$/;
    if (!addressPattern.test(trimmedAddress)) {
      return false;
    }

    // Must contain at least one number (street number)
    if (!/\d/.test(trimmedAddress)) {
      return false;
    }

    return true;
  }

  defaultMessage(): string {
    return ErrorMessages[ErrorCodes.INVALID_INPUT].publicMessage;
  }
}

/**
 * Validator for Affiliate Address Line 2
 * Validates secondary address format and length requirements
 * Integrated with centralized error handling
 */
@ValidatorConstraint({ name: 'affiliateAddress2', async: false })
export class AffiliateAddress2Validator
  implements ValidatorConstraintInterface
{
  validate(address: string): boolean {
    if (!address) return true; // Optional field

    const trimmedAddress = address.trim();

    // Check length constraints
    if (trimmedAddress.length > AFFILIATE_FIELD_LIMITS.ADDRESS_2) {
      return false;
    }

    // Allow letters, numbers, spaces, and common address characters
    const addressPattern = /^[a-zA-Z0-9\s\-.,#/]+$/;
    return addressPattern.test(trimmedAddress);
  }

  defaultMessage(): string {
    return ErrorMessages[ErrorCodes.INVALID_INPUT].publicMessage;
  }
}

/**
 * Validator for Affiliate Province
 * Validates province selection against centralized enum
 * Integrated with centralized enums
 */
@ValidatorConstraint({ name: 'affiliateProvince', async: false })
export class AffiliateProvinceValidator
  implements ValidatorConstraintInterface
{
  validate(province: Province | number): boolean {
    if (province === undefined || province === null) return false; // Business required

    // Check if it's a valid province value
    const validProvinces = Object.values(AFFILIATE_PROVINCES) as number[];
    return validProvinces.includes(Number(province));
  }

  defaultMessage(): string {
    return ErrorMessages[ErrorCodes.VALIDATION_ERROR].publicMessage;
  }
}

/**
 * Validator for Affiliate Country
 * Validates country selection against centralized enum
 * Integrated with centralized enums
 */
@ValidatorConstraint({ name: 'affiliateCountry', async: false })
export class AffiliateCountryValidator implements ValidatorConstraintInterface {
  validate(country: Country | number): boolean {
    if (country === undefined || country === null) return false; // Business required

    // Check if it's a valid country value
    const validCountries = Object.values(AFFILIATE_COUNTRIES) as number[];
    return validCountries.includes(Number(country));
  }

  defaultMessage(): string {
    return ErrorMessages[ErrorCodes.VALIDATION_ERROR].publicMessage;
  }
}

/**
 * Validator for Affiliate Postal Code
 * Validates postal code format based on country
 * Supports Canadian postal codes and US ZIP codes
 * Integrated with centralized error handling
 */
@ValidatorConstraint({ name: 'affiliatePostalCode', async: false })
export class AffiliatePostalCodeValidator
  implements ValidatorConstraintInterface
{
  validate(postalCode: string, args: ValidationArguments): boolean {
    if (!postalCode) return false; // Business required field

    const trimmedCode = postalCode.trim().toUpperCase();

    // Check maximum length constraint from Dataverse
    if (trimmedCode.length > AFFILIATE_FIELD_LIMITS.POSTAL_CODE) {
      return false;
    }

    // Get country from the object being validated
    const objectData = args.object as Record<string, any>;
    const country = objectData?.affiliateCountry as Country | number;

    return this.validateByCountry(trimmedCode, country);
  }

  private validateByCountry(
    postalCode: string,
    country?: Country | number,
  ): boolean {
    // Canadian postal code validation (Canada = 1)
    if (country === 1 || Number(country) === 1) {
      return AFFILIATE_VALIDATION_PATTERNS.POSTAL_CODE_CA.test(postalCode);
    }

    // US ZIP code validation (USA = 2)
    if (country === 2 || Number(country) === 2) {
      return AFFILIATE_VALIDATION_PATTERNS.POSTAL_CODE_US.test(postalCode);
    }

    // Generic validation for other countries (alphanumeric with spaces/hyphens)
    return /^[A-Za-z0-9\s-]{3,7}$/.test(postalCode);
  }

  defaultMessage(args: ValidationArguments): string {
    const objectData = args.object as Record<string, any>;
    const country = objectData?.affiliateCountry as Country | number;

    if (country === 1 || Number(country) === 1) {
      return 'Postal code must be a valid Canadian postal code (format: A1A 1A1)';
    }

    if (country === 2 || Number(country) === 2) {
      return 'ZIP code must be a valid US ZIP code (format: 12345 or 12345-6789)';
    }

    return `Postal code must be valid (max ${AFFILIATE_FIELD_LIMITS.POSTAL_CODE} characters)`;
  }
}

/**
 * Validator for Other City
 * Validates optional field with length constraints
 */
@ValidatorConstraint({ name: 'affiliateOtherCity', async: false })
export class AffiliateOtherCityValidator
  implements ValidatorConstraintInterface
{
  validate(otherCity: string): boolean {
    if (!otherCity) return true; // Optional field

    const trimmed = otherCity.trim();

    // Check minimum length (at least 2 characters for meaningful city name)
    if (trimmed.length < 2) {
      return false;
    }

    // Check maximum length
    if (trimmed.length > AFFILIATE_FIELD_LIMITS.OTHER_CITY) {
      return false;
    }

    // Basic pattern validation (allow letters, numbers, spaces, common punctuation for city names)
    const pattern = /^[a-zA-Z0-9\s,.-/']+$/;
    return pattern.test(trimmed);
  }

  defaultMessage(): string {
    return ErrorMessages[ErrorCodes.INVALID_INPUT].publicMessage;
  }
}

/**
 * Validator for Other Province/State
 * Validates optional field with length constraints
 */
@ValidatorConstraint({ name: 'affiliateOtherProvinceState', async: false })
export class AffiliateOtherProvinceStateValidator
  implements ValidatorConstraintInterface
{
  validate(otherProvinceState: string): boolean {
    if (!otherProvinceState) return true; // Optional field

    const trimmed = otherProvinceState.trim();

    // Check minimum length (at least 2 characters for meaningful province/state name)
    if (trimmed.length < 2) {
      return false;
    }

    // Check maximum length
    if (trimmed.length > AFFILIATE_FIELD_LIMITS.OTHER_PROVINCE_STATE) {
      return false;
    }

    // Basic pattern validation (allow letters, numbers, spaces, common punctuation for province/state names)
    const pattern = /^[a-zA-Z0-9\s,.-/']+$/;
    return pattern.test(trimmed);
  }

  defaultMessage(): string {
    return ErrorMessages[ErrorCodes.INVALID_INPUT].publicMessage;
  }
}

// ========================================
// SOCIAL MEDIA URL VALIDATORS
// ========================================

/**
 * Validator for Facebook URL
 * Validates Facebook page/profile URLs
 * Integrated with centralized URL validation utility
 */
@ValidatorConstraint({ name: 'facebookUrl', async: false })
export class FacebookUrlValidator implements ValidatorConstraintInterface {
  validate(url: string): boolean {
    if (!url) return true; // Optional field

    const trimmedUrl = url.trim().toLowerCase();

    // Check length constraints
    if (trimmedUrl.length > AFFILIATE_FIELD_LIMITS.SOCIAL_MEDIA_URL) {
      return false;
    }

    // Basic URL validation
    if (!isValidUrl(trimmedUrl)) {
      return false;
    }

    // Facebook-specific validation
    const facebookPattern = /^https?:\/\/(www\.)?(facebook|fb)\.com\/.+/;
    return facebookPattern.test(trimmedUrl);
  }

  defaultMessage(): string {
    return 'Facebook URL must be a valid Facebook page or profile URL';
  }
}

/**
 * Validator for Instagram URL
 * Validates Instagram profile URLs
 * Integrated with centralized URL validation utility
 */
@ValidatorConstraint({ name: 'instagramUrl', async: false })
export class InstagramUrlValidator implements ValidatorConstraintInterface {
  validate(url: string): boolean {
    if (!url) return true; // Optional field

    const trimmedUrl = url.trim().toLowerCase();

    // Check length constraints
    if (trimmedUrl.length > AFFILIATE_FIELD_LIMITS.SOCIAL_MEDIA_URL) {
      return false;
    }

    // Basic URL validation
    if (!isValidUrl(trimmedUrl)) {
      return false;
    }

    // Instagram-specific validation
    const instagramPattern = /^https?:\/\/(www\.)?instagram\.com\/.+/;
    return instagramPattern.test(trimmedUrl);
  }

  defaultMessage(): string {
    return 'Instagram URL must be a valid Instagram profile URL';
  }
}

/**
 * Validator for TikTok URL
 * Validates TikTok profile URLs
 * Integrated with centralized URL validation utility
 */
@ValidatorConstraint({ name: 'tiktokUrl', async: false })
export class TiktokUrlValidator implements ValidatorConstraintInterface {
  validate(url: string): boolean {
    if (!url) return true; // Optional field

    const trimmedUrl = url.trim().toLowerCase();

    // Check length constraints
    if (trimmedUrl.length > AFFILIATE_FIELD_LIMITS.SOCIAL_MEDIA_URL) {
      return false;
    }

    // Basic URL validation
    if (!isValidUrl(trimmedUrl)) {
      return false;
    }

    // TikTok-specific validation
    const tiktokPattern = /^https?:\/\/(www\.)?tiktok\.com\/@.+/;
    return tiktokPattern.test(trimmedUrl);
  }

  defaultMessage(): string {
    return 'TikTok URL must be a valid TikTok profile URL (format: @username)';
  }
}

/**
 * Validator for LinkedIn URL
 * Validates LinkedIn company page or profile URLs
 * Integrated with centralized URL validation utility
 */
@ValidatorConstraint({ name: 'linkedinUrl', async: false })
export class LinkedinUrlValidator implements ValidatorConstraintInterface {
  validate(url: string): boolean {
    if (!url) return true; // Optional field

    const trimmedUrl = url.trim().toLowerCase();

    // Check length constraints
    if (trimmedUrl.length > AFFILIATE_FIELD_LIMITS.SOCIAL_MEDIA_URL) {
      return false;
    }

    // Basic URL validation
    if (!isValidUrl(trimmedUrl)) {
      return false;
    }

    // LinkedIn-specific validation
    const linkedinPattern =
      /^https?:\/\/(www\.)?linkedin\.com\/(company|in)\/.+/;
    return linkedinPattern.test(trimmedUrl);
  }

  defaultMessage(): string {
    return 'LinkedIn URL must be a valid LinkedIn company page or profile URL';
  }
}

// ========================================
// SOCIAL MEDIA VALIDATION UTILITIES
// ========================================

/**
 * Validate social media URL by platform
 * Centralized validation function for social media URLs
 */
export function validateSocialMediaUrl(
  url: string,
  platform: 'FACEBOOK' | 'INSTAGRAM' | 'TIKTOK' | 'LINKEDIN' | 'WEBSITE',
): boolean {
  if (!url) return false;

  const trimmedUrl = url.trim().toLowerCase();

  // Basic URL validation
  if (!isValidUrl(trimmedUrl)) {
    return false;
  }

  // Platform-specific validation
  switch (platform) {
    case 'FACEBOOK':
      return /^https?:\/\/(www\.)?(facebook|fb)\.com\/.+/.test(trimmedUrl);
    case 'INSTAGRAM':
      return /^https?:\/\/(www\.)?instagram\.com\/.+/.test(trimmedUrl);
    case 'TIKTOK':
      return /^https?:\/\/(www\.)?tiktok\.com\/@.+/.test(trimmedUrl);
    case 'LINKEDIN':
      return /^https?:\/\/(www\.)?linkedin\.com\/(company|in)\/.+/.test(
        trimmedUrl,
      );
    case 'WEBSITE': {
      // For business websites, avoid social media domains
      const socialDomains = [
        'facebook.com',
        'instagram.com',
        'tiktok.com',
        'linkedin.com',
        'twitter.com',
      ];
      return !socialDomains.some((domain) => trimmedUrl.includes(domain));
    }
    default:
      return false;
  }
}

/**
 * Validate postal code by country
 * Centralized validation function for postal codes
 */
export function validatePostalCode(
  postalCode: string,
  country?: Country | number,
): {
  isValid: boolean;
  formatted: string;
  error?: string;
} {
  if (!postalCode) {
    return {
      isValid: false,
      formatted: '',
      error: 'Postal code is required',
    };
  }

  const trimmedCode = postalCode.trim().toUpperCase();

  // Check maximum length constraint from Dataverse
  if (trimmedCode.length > AFFILIATE_FIELD_LIMITS.POSTAL_CODE) {
    return {
      isValid: false,
      formatted: trimmedCode,
      error: `Postal code cannot exceed ${AFFILIATE_FIELD_LIMITS.POSTAL_CODE} characters`,
    };
  }

  // Canadian postal code validation (Canada = 1)
  if (country === 1 || Number(country) === 1) {
    const canadianPattern = /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/;
    if (!canadianPattern.test(trimmedCode)) {
      return {
        isValid: false,
        formatted: trimmedCode,
        error: 'Canadian postal code must be in format A1A 1A1',
      };
    }
    return {
      isValid: true,
      formatted: formatPostalCodeHelper(trimmedCode, country),
    };
  }

  // US ZIP code validation (USA = 2)
  if (country === 2 || Number(country) === 2) {
    const usPattern = /^\d{5}(-\d{4})?$/;
    if (!usPattern.test(trimmedCode)) {
      return {
        isValid: false,
        formatted: trimmedCode,
        error: 'US ZIP code must be in format 12345 or 12345-1234',
      };
    }
    return {
      isValid: true,
      formatted: trimmedCode,
    };
  }

  // Generic validation for other countries (alphanumeric with spaces/hyphens)
  const genericPattern = /^[A-Za-z0-9\s-]{3,7}$/;
  if (!genericPattern.test(trimmedCode)) {
    return {
      isValid: false,
      formatted: trimmedCode,
      error: 'Postal code must be 3-7 alphanumeric characters',
    };
  }

  return {
    isValid: true,
    formatted: trimmedCode,
  };
}

/**
 * Helper function for postal code formatting (imported from utils)
 * This is a helper function that will be imported from affiliate-helpers.util.ts
 */
function formatPostalCodeHelper(
  postalCode: string,
  country?: Country | number,
): string {
  if (!postalCode) return '';

  const trimmedCode = postalCode.trim().toUpperCase();

  if (country === 1 || Number(country) === 1) {
    // Canadian postal code formatting (A1A 1A1)
    const cleanCode = trimmedCode.replace(/\s/g, '');
    if (cleanCode.length === 6) {
      return `${cleanCode.substring(0, 3)} ${cleanCode.substring(3)}`;
    }
  }

  return trimmedCode;
}

/**
 * Validate and format phone number
 * Centralized validation function for phone numbers
 */
export function validateAndFormatPhone(phone: string): {
  isValid: boolean;
  formatted: string;
  error?: string;
} {
  if (!phone) {
    return {
      isValid: false,
      formatted: '',
      error: 'Phone number is required',
    };
  }

  const trimmedPhone = phone.trim();

  // Check length constraints
  if (trimmedPhone.length > AFFILIATE_FIELD_LIMITS.PHONE) {
    return {
      isValid: false,
      formatted: trimmedPhone,
      error: `Phone number cannot exceed ${AFFILIATE_FIELD_LIMITS.PHONE} characters`,
    };
  }

  // Use utility function for Canadian phone validation
  if (!isValidCanadianPhoneNumber(trimmedPhone)) {
    return {
      isValid: false,
      formatted: trimmedPhone,
      error: 'Phone number must be a valid Canadian phone number',
    };
  }

  return {
    isValid: true,
    formatted: formatCanadianPhoneNumberHelper(trimmedPhone),
  };
}

/**
 * Helper function for phone formatting (will be imported from utils)
 */
function formatCanadianPhoneNumberHelper(phone: string): string {
  if (!phone) return '';

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Handle different formats
  if (digits.length === 10) {
    // Format: (123) 456-7890
    return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
  }

  if (digits.length === 11 && digits.startsWith('1')) {
    // Format: +1 (123) 456-7890
    return `+1 (${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7)}`;
  }

  // Return original if can't format
  return phone;
}

// ========================================
// PASSWORD & SECURITY VALIDATORS
// ========================================

/**
 * Password requirements configuration
 */
const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  MAX_LENGTH: AFFILIATE_FIELD_LIMITS.PASSWORD,
  MIN_UPPERCASE: 1,
  MIN_LOWERCASE: 1,
  MIN_NUMBERS: 1,
  MIN_SPECIAL_CHARS: 1,
  ALLOWED_SPECIAL_CHARS: '!@#$%^&*()_+-=[]{}|;:,.<>?',
} as const;

/**
 * Common weak passwords that should be rejected
 */
const WEAK_PASSWORDS = [
  'password',
  'password123',
  '123456',
  '12345678',
  'qwerty',
  'abc123',
  'admin',
  'admin123',
  'osot123',
  'affiliate',
  'affiliate123',
  'welcome',
  'welcome123',
  'letmein',
  'changeme',
] as const;

/**
 * Password strength levels
 */
export enum PasswordStrength {
  VERY_WEAK = 1,
  WEAK = 2,
  FAIR = 3,
  GOOD = 4,
  STRONG = 5,
}

/**
 * Check if password is in weak passwords list
 */
function isWeakPassword(password: string): boolean {
  const lowercasePassword = password.toLowerCase();
  return (WEAK_PASSWORDS as readonly string[]).includes(lowercasePassword);
}

/**
 * Calculate password strength score
 * Validates password complexity and security requirements
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password) return PasswordStrength.VERY_WEAK;

  let score = 0;

  // Length scoring
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Character type scoring
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  // Bonus points
  if (password.length >= 20) score += 1;
  if (/[A-Z].*[A-Z]/.test(password)) score += 1; // Multiple uppercase
  if (/\d.*\d/.test(password)) score += 1; // Multiple numbers

  // Penalties
  if (/(.)\1{2,}/.test(password)) score -= 1; // Repeated characters
  if (isWeakPassword(password)) score -= 2;

  // Convert score to strength level
  if (score <= 2) return PasswordStrength.VERY_WEAK;
  if (score <= 4) return PasswordStrength.WEAK;
  if (score <= 6) return PasswordStrength.FAIR;
  if (score <= 8) return PasswordStrength.GOOD;
  return PasswordStrength.STRONG;
}

/**
 * Get password requirements as human-readable text
 * Helper function for displaying password requirements to users
 */
export function getPasswordRequirements(): string[] {
  return [
    `At least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters long`,
    `No more than ${PASSWORD_REQUIREMENTS.MAX_LENGTH} characters`,
    'At least one uppercase letter (A-Z)',
    'At least one lowercase letter (a-z)',
    'At least one number (0-9)',
    `At least one special character (${PASSWORD_REQUIREMENTS.ALLOWED_SPECIAL_CHARS})`,
    'Must not be a common weak password',
    'Must not contain personal information',
    'Must not have repeated character patterns',
  ];
}

/**
 * Validator for Affiliate Password
 * Validates password complexity and security requirements
 * Uses same pattern as account module for consistency
 */
@ValidatorConstraint({ name: 'affiliatePassword', async: false })
export class AffiliatePasswordValidator
  implements ValidatorConstraintInterface
{
  validate(password: string): boolean {
    if (!password) return false; // Business required field

    // Check minimum length
    if (password.length < AFFILIATE_BUSINESS_RULES.MIN_PASSWORD_LENGTH)
      return false;

    // Check maximum length
    if (password.length > AFFILIATE_FIELD_LIMITS.PASSWORD) return false;

    // Use pattern from constants for strength validation
    return AFFILIATE_VALIDATION_PATTERNS.PASSWORD.test(password);
  }

  defaultMessage(): string {
    return 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.';
  }
}

/**
 * Validator for Password Policy
 * Enforces organizational password policies
 * Validates against personal information
 * Integrated with ValidationArguments for context validation
 */
@ValidatorConstraint({ name: 'passwordPolicy', async: false })
export class PasswordPolicyValidator implements ValidatorConstraintInterface {
  validate(password: string, args: ValidationArguments): boolean {
    if (!password) return false;

    // Get user information for context (if available)
    const objectData = args.object as Record<string, any>;
    const firstName = (
      objectData?.representativeFirstName as string
    )?.toLowerCase();
    const lastName = (
      objectData?.representativeLastName as string
    )?.toLowerCase();
    const email = (objectData?.affiliateEmail as string)?.toLowerCase();
    const orgName = (objectData?.affiliateName as string)?.toLowerCase();

    // Password should not contain personal information
    if (firstName && password.toLowerCase().includes(firstName)) {
      return false;
    }

    if (lastName && password.toLowerCase().includes(lastName)) {
      return false;
    }

    if (email) {
      const emailUser = email.split('@')[0];
      if (
        emailUser &&
        emailUser.length > 3 &&
        password.toLowerCase().includes(emailUser)
      ) {
        return false;
      }
    }

    if (orgName) {
      // Extract meaningful words from organization name
      const orgWords = orgName
        .split(/[\s\-.,&()]+/)
        .filter((word: string) => word.length > 3);

      for (const word of orgWords) {
        if (password.toLowerCase().includes(word)) {
          return false;
        }
      }
    }

    return true;
  }

  defaultMessage(): string {
    return 'Password must not contain personal or organizational information';
  }
}

// ========================================
// ACCOUNT & SECURITY VALIDATORS
// ========================================

/**
 * Validator for Account Declaration
 * Validates account declaration acceptance for registration
 * Integrated with centralized error handling
 */
@ValidatorConstraint({ name: 'accountDeclaration', async: false })
export class AccountDeclarationValidator
  implements ValidatorConstraintInterface
{
  validate(declaration: boolean): boolean {
    // Must be explicitly true for registration
    return declaration === true;
  }

  defaultMessage(): string {
    return 'Account declaration must be accepted to proceed with registration';
  }
}

/**
 * Validator for Account Status
 * Validates account status against centralized enum
 * Integrated with centralized enums
 */
@ValidatorConstraint({ name: 'affiliateAccountStatus', async: false })
export class AffiliateAccountStatusValidator
  implements ValidatorConstraintInterface
{
  validate(status: AccountStatus | number): boolean {
    if (status === undefined || status === null) return true; // Optional field

    // Check if it's a valid status value
    const validStatuses = Object.values(AFFILIATE_ACCOUNT_STATUS) as number[];
    return validStatuses.includes(Number(status));
  }

  defaultMessage(): string {
    return ErrorMessages[ErrorCodes.VALIDATION_ERROR].publicMessage;
  }
}

/**
 * Validator for Access Modifiers
 * Validates access modifier selection against centralized enum
 * Integrated with centralized enums
 */
@ValidatorConstraint({ name: 'affiliateAccessModifiers', async: false })
export class AffiliateAccessModifiersValidator
  implements ValidatorConstraintInterface
{
  validate(accessModifier: AccessModifier | number): boolean {
    if (accessModifier === undefined || accessModifier === null) return true; // Optional field

    // Check if it's a valid access modifier value
    const validModifiers = Object.values(
      AFFILIATE_ACCESS_MODIFIERS,
    ) as number[];
    return validModifiers.includes(Number(accessModifier));
  }

  defaultMessage(): string {
    return ErrorMessages[ErrorCodes.VALIDATION_ERROR].publicMessage;
  }
}

// ========================================
// BUSINESS RULE VALIDATORS
// ========================================

/**
 * Validator for Representative Full Name Uniqueness
 * Ensures representative name is not just repeated characters
 * Integrated with ValidationArguments for cross-field validation
 */
@ValidatorConstraint({ name: 'representativeFullName', async: false })
export class RepresentativeFullNameValidator
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments): boolean {
    const objectData = args.object as Record<string, any>;
    const firstName = (objectData?.representativeFirstName as string)?.trim();
    const lastName = (objectData?.representativeLastName as string)?.trim();

    if (!firstName || !lastName) return false;

    // Ensure first and last name are not the same
    if (firstName.toLowerCase() === lastName.toLowerCase()) {
      return false;
    }

    // Ensure names are not just repeated characters
    const repeatedPattern = /^(.)\1*$/;
    if (repeatedPattern.test(firstName) || repeatedPattern.test(lastName)) {
      return false;
    }

    return true;
  }

  defaultMessage(): string {
    return 'Representative first and last names must be different and meaningful';
  }
}

/**
 * Validator for Social Media URL Consistency
 * Ensures social media URLs are from the correct platforms
 * Integrated with ValidationArguments for platform validation
 */
@ValidatorConstraint({ name: 'socialMediaPlatform', async: false })
export class SocialMediaPlatformValidator
  implements ValidatorConstraintInterface
{
  validate(url: string, args: ValidationArguments): boolean {
    if (!url) return true; // Optional field

    const trimmedUrl = url.trim().toLowerCase();
    const propertyName = args.property;

    // Platform-specific validation
    switch (propertyName) {
      case 'affiliateFacebook':
        return (
          trimmedUrl.includes('facebook.com') || trimmedUrl.includes('fb.com')
        );
      case 'affiliateInstagram':
        return trimmedUrl.includes('instagram.com');
      case 'affiliateTikTok':
        return trimmedUrl.includes('tiktok.com');
      case 'affiliateLinkedIn':
        return trimmedUrl.includes('linkedin.com');
      default:
        return true;
    }
  }

  defaultMessage(args: ValidationArguments): string {
    const propertyName = args.property;
    const platform = propertyName.replace('affiliate', '').toLowerCase();
    return `${platform} URL must be from the correct platform`;
  }
}

/**
 * Validator for Social Media URL Uniqueness
 * Ensures the same URL is not used across multiple social media fields
 * Integrated with ValidationArguments for cross-field validation
 */
@ValidatorConstraint({ name: 'socialMediaUniqueness', async: false })
export class SocialMediaUniquenessValidator
  implements ValidatorConstraintInterface
{
  validate(url: string, args: ValidationArguments): boolean {
    if (!url) return true; // Optional field

    const objectData = args.object as Record<string, any>;
    const currentProperty = args.property;

    const socialMediaFields = [
      'affiliateWebsite',
      'affiliateFacebook',
      'affiliateInstagram',
      'affiliateTikTok',
      'affiliateLinkedIn',
    ];

    // Check if the same URL is used in other fields
    for (const field of socialMediaFields) {
      if (field !== currentProperty && objectData?.[field] === url) {
        return false;
      }
    }

    return true;
  }

  defaultMessage(): string {
    return 'The same URL cannot be used for multiple social media platforms';
  }
}
