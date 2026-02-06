/**
 * Organization Validation Constants
 *
 * Business rules and validation constraints for Organization entity:
 * - Field length limits
 * - Format patterns
 * - Required field rules
 * - Slug validation rules
 *
 * Based on Dataverse schema in Table Organization.csv
 */

/**
 * Field length constraints
 * Based on Table Organization.csv specification
 */
export const ORGANIZATION_FIELD_LENGTH = {
  /**
   * Organization Name max length
   * Dataverse: Single line of text (255 characters)
   */
  ORGANIZATION_NAME_MAX: 255,

  /**
   * Organization Name min length
   * Business rule: Minimum 3 characters for meaningful name
   */
  ORGANIZATION_NAME_MIN: 3,

  /**
   * Legal Name max length
   * Dataverse: Single line of text (255 characters)
   */
  LEGAL_NAME_MAX: 255,

  /**
   * Legal Name min length
   * Business rule: Minimum 3 characters
   */
  LEGAL_NAME_MIN: 3,

  /**
   * Acronym max length
   * Dataverse: Single line of text (100 characters)
   */
  ACRONYM_MAX: 100,

  /**
   * Acronym min length
   * Business rule: Minimum 2 characters (e.g., "OT")
   */
  ACRONYM_MIN: 2,

  /**
   * Slug max length
   * Dataverse type: Single line of text (255 characters)
   * Note: Not a URL field type, but used in URLs as identifier
   */
  SLUG_MAX: 255,

  /**
   * Slug min length
   * Business rule: Minimum 2 characters (e.g., "ot")
   */
  SLUG_MIN: 2,

  /**
   * Organization Logo URL max length
   * Dataverse: URL field (255 characters)
   */
  ORGANIZATION_LOGO_MAX: 255,

  /**
   * Organization Website URL max length
   * Dataverse: URL field (255 characters)
   */
  ORGANIZATION_WEBSITE_MAX: 255,

  /**
   * Representative max length
   * Dataverse: Single line of text (255 characters)
   */
  REPRESENTATIVE_MAX: 255,

  /**
   * Representative min length
   * Business rule: Minimum 3 characters
   */
  REPRESENTATIVE_MIN: 3,

  /**
   * Organization Email max length
   * Dataverse: Email field (255 characters)
   */
  ORGANIZATION_EMAIL_MAX: 255,

  /**
   * Organization Phone max length
   * Dataverse: Phone field (14 characters - Canadian format)
   */
  ORGANIZATION_PHONE_MAX: 14,

  /**
   * Organization Phone min length
   * Business rule: Minimum 10 digits (without formatting)
   */
  ORGANIZATION_PHONE_MIN: 10,
} as const;

/**
 * Slug validation pattern
 * Format: lowercase letters, numbers, and hyphens only
 * Pattern: ^[a-z0-9-]+$
 *
 * Valid examples:
 * - "osot"
 * - "aota"
 * - "bc-ot-society"
 * - "quebec-ot-2025"
 *
 * Invalid examples:
 * - "OSOT" (uppercase)
 * - "osot canada" (space)
 * - "osot_canada" (underscore)
 * - "société" (accent)
 */
export const SLUG_PATTERN = /^[a-z0-9-]+$/;

/**
 * Slug validation error messages
 */
export const SLUG_VALIDATION_MESSAGES = {
  pattern: 'Slug must contain only lowercase letters, numbers, and hyphens',
  minLength: `Slug must be at least ${ORGANIZATION_FIELD_LENGTH.SLUG_MIN} characters`,
  maxLength: `Slug must not exceed ${ORGANIZATION_FIELD_LENGTH.SLUG_MAX} characters`,
  required: 'Slug is required',
  unique: 'This slug is already in use by another organization',
  reserved: 'This slug is reserved and cannot be used',
} as const;

/**
 * Reserved slugs that cannot be used
 * These are system/application routes that would conflict
 */
export const RESERVED_SLUGS = [
  'admin',
  'api',
  'login',
  'register',
  'logout',
  'public',
  'private',
  'system',
  'dashboard',
  'profile',
  'settings',
  'help',
  'support',
  'docs',
  'documentation',
  'test',
  'demo',
  'staging',
  'production',
  'dev',
  'development',
  'health',
  'status',
  'version',
] as const;

/**
 * Check if slug is reserved
 */
export function isReservedSlug(slug: string): boolean {
  const normalizedSlug = slug.toLowerCase();
  return RESERVED_SLUGS.some((reserved) => reserved === normalizedSlug);
}

/**
 * Canadian phone number validation pattern
 * Formats accepted:
 * - +1-416-555-0100
 * - (416) 555-0100
 * - 416-555-0100
 * - 4165550100
 */
export const CANADIAN_PHONE_PATTERN =
  /^(\+?1[-.]?)?\(?([2-9]\d{2})\)?[-.]?(\d{3})[-.]?(\d{4})$/;

/**
 * Email validation pattern (basic)
 * For more complex validation, use class-validator @IsEmail()
 */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * URL validation pattern (basic)
 * For more complex validation, use class-validator @IsUrl()
 */
export const URL_PATTERN = /^https?:\/\/.+/;

/**
 * Validation error messages
 */
export const ORGANIZATION_VALIDATION_MESSAGES = {
  // Organization Name
  organizationNameRequired: 'Organization name is required',
  organizationNameTooShort: `Organization name must be at least ${ORGANIZATION_FIELD_LENGTH.ORGANIZATION_NAME_MIN} characters`,
  organizationNameTooLong: `Organization name must not exceed ${ORGANIZATION_FIELD_LENGTH.ORGANIZATION_NAME_MAX} characters`,

  // Legal Name
  legalNameRequired: 'Legal name is required',
  legalNameTooShort: `Legal name must be at least ${ORGANIZATION_FIELD_LENGTH.LEGAL_NAME_MIN} characters`,
  legalNameTooLong: `Legal name must not exceed ${ORGANIZATION_FIELD_LENGTH.LEGAL_NAME_MAX} characters`,

  // Acronym
  acronymTooShort: `Acronym must be at least ${ORGANIZATION_FIELD_LENGTH.ACRONYM_MIN} characters`,
  acronymTooLong: `Acronym must not exceed ${ORGANIZATION_FIELD_LENGTH.ACRONYM_MAX} characters`,

  // Slug
  slugRequired: SLUG_VALIDATION_MESSAGES.required,
  slugPattern: SLUG_VALIDATION_MESSAGES.pattern,
  slugTooShort: SLUG_VALIDATION_MESSAGES.minLength,
  slugTooLong: SLUG_VALIDATION_MESSAGES.maxLength,
  slugUnique: SLUG_VALIDATION_MESSAGES.unique,
  slugReserved: SLUG_VALIDATION_MESSAGES.reserved,

  // Logo
  logoRequired: 'Organization logo URL is required',
  logoInvalidUrl: 'Organization logo must be a valid URL',
  logoTooLong: `Logo URL must not exceed ${ORGANIZATION_FIELD_LENGTH.ORGANIZATION_LOGO_MAX} characters`,

  // Website
  websiteRequired: 'Organization website URL is required',
  websiteInvalidUrl: 'Website must be a valid URL',
  websiteTooLong: `Website URL must not exceed ${ORGANIZATION_FIELD_LENGTH.ORGANIZATION_WEBSITE_MAX} characters`,

  // Representative
  representativeRequired: 'Representative is required',
  representativeTooShort: `Representative must be at least ${ORGANIZATION_FIELD_LENGTH.REPRESENTATIVE_MIN} characters`,
  representativeTooLong: `Representative must not exceed ${ORGANIZATION_FIELD_LENGTH.REPRESENTATIVE_MAX} characters`,

  // Email
  emailRequired: 'Organization email is required',
  emailInvalid: 'Organization email must be a valid email address',
  emailTooLong: `Email must not exceed ${ORGANIZATION_FIELD_LENGTH.ORGANIZATION_EMAIL_MAX} characters`,

  // Phone
  phoneRequired: 'Organization phone is required',
  phoneInvalid: 'Phone must be a valid Canadian phone number',
  phoneTooShort: `Phone must be at least ${ORGANIZATION_FIELD_LENGTH.ORGANIZATION_PHONE_MIN} digits`,
  phoneTooLong: `Phone must not exceed ${ORGANIZATION_FIELD_LENGTH.ORGANIZATION_PHONE_MAX} characters`,

  // Status
  statusInvalid: 'Organization status must be a valid status value',

  // Access Control
  privilegeInvalid: 'Privilege must be a valid privilege value',
  accessModifierInvalid:
    'Access modifier must be a valid access modifier value',
} as const;

/**
 * Default values for optional fields
 */
export const ORGANIZATION_DEFAULTS = {
  /**
   * Default status for new organizations
   * Active = 1 (will be defined in OrganizationStatus enum)
   */
  STATUS: 1,

  /**
   * Default privilege
   * Main = 1 (from global Privilege enum)
   */
  PRIVILEGE: 1,

  /**
   * Default access modifier
   * Private = 1 (from global AccessModifier enum)
   */
  ACCESS_MODIFIER: 1,
} as const;

/**
 * Business rules
 */
export const ORGANIZATION_BUSINESS_RULES = {
  /**
   * Slug immutability
   * Once created, slug should not be changed to prevent broken URLs
   */
  SLUG_IMMUTABLE: true,

  /**
   * Slug uniqueness
   * Slug must be unique across all organizations (case-insensitive)
   */
  SLUG_UNIQUE: true,

  /**
   * Allow duplicate organization names
   * Different organizations can have similar names
   * Example: "Ontario Society of OT" vs "Ontario Society of Occupational Therapists"
   */
  ALLOW_DUPLICATE_NAMES: true,

  /**
   * Require active status for login
   * Only organizations with Active status can be used for login
   */
  REQUIRE_ACTIVE_FOR_LOGIN: true,
} as const;
