/**
 * Contact Module Constants
 *
 * Centraliza valores de configuração, cache keys, limits e outros constants
 * específicos para operações de contact no OSOT Dataverse API
 */

import { AccessModifier } from '../../../../common/enums/access-modifier.enum';
import { Privilege } from '../../../../common/enums/privilege.enum';
import { ErrorCodes } from '../../../../common/errors/error-codes';

// Cache Configuration
export const CONTACT_CACHE_KEYS = {
  CONTACT_BY_ID: (contactId: string) => `contact:${contactId}`,
  CONTACT_BY_ACCOUNT: (accountId: string) => `contact:account:${accountId}`,
  CONTACT_BY_BUSINESS_ID: (businessId: string) =>
    `contact:business:${businessId}`,
  CONTACT_BY_EMAIL: (email: string) => `contact:email:${email}`,
  CONTACT_BY_PHONE: (phone: string) => `contact:phone:${phone}`,
  CONTACT_SEARCH: (query: string) => `contact:search:${query}`,
  CONTACT_COUNT_BY_ACCOUNT: (accountId: string) =>
    `contact:count:account:${accountId}`,
  CONTACT_SOCIAL_MEDIA: (contactId: string) => `contact:social:${contactId}`,
} as const;

// Cache TTL Values (in seconds)
export const CONTACT_CACHE_TTL = {
  DEFAULT: 3600, // 1 hour
  BY_BUSINESS_ID: 1800, // 30 minutes (frequently accessed)
  SOCIAL_MEDIA: 7200, // 2 hours (less frequently changed)
  SEARCH: 300, // 5 minutes (dynamic results)
  COUNT: 900, // 15 minutes
} as const;

// Default Values
export const CONTACT_DEFAULTS = {
  ACCESS_MODIFIER: AccessModifier.PRIVATE, // Private (from AccessModifier enum)
  PRIVILEGE: Privilege.OWNER, // Owner (from Privilege enum)
  MAX_CONTACTS_PER_ACCOUNT: 5, // Business rule limit
} as const;

// Validation Limits (from Table Contact.csv specification)
export const CONTACT_LIMITS = {
  // Business required field limits
  USER_BUSINESS_ID_MAX_LENGTH: 20, // From CSV: max 20
  USER_BUSINESS_ID_MIN_LENGTH: 3, // Business rule minimum

  // Optional field limits (exact from CSV)
  SECONDARY_EMAIL_MAX_LENGTH: 255, // From CSV: max 255
  JOB_TITLE_MAX_LENGTH: 50, // From CSV: max 50

  // Phone field limits (exact from CSV)
  HOME_PHONE_MAX_LENGTH: 14, // From CSV: max 14
  WORK_PHONE_MAX_LENGTH: 14, // From CSV: max 14

  // URL field limits (exact from CSV - all social media URLs)
  BUSINESS_WEBSITE_MAX_LENGTH: 255, // From CSV: max 255
  FACEBOOK_MAX_LENGTH: 255, // From CSV: max 255
  INSTAGRAM_MAX_LENGTH: 255, // From CSV: max 255
  TIKTOK_MAX_LENGTH: 255, // From CSV: max 255
  LINKEDIN_MAX_LENGTH: 255, // From CSV: max 255

  // Search and general limits
  SEARCH_MIN_LENGTH: 2,
  MAX_CONTACTS_PER_ACCOUNT: 5, // Business rule
} as const;

// Contact Field Patterns
export const CONTACT_PATTERNS = {
  // Canadian phone number: (123) 456-7890, 123-456-7890, or 1234567890
  CANADIAN_PHONE:
    /^(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/,
  // Email validation (more permissive for secondary emails)
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // User business ID (alphanumeric with dash/underscore)
  USER_BUSINESS_ID: /^[a-zA-Z0-9\-_]+$/,
  // URL validation for social media
  URL: /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&=]*)$/,
  // Specific social media URL patterns
  FACEBOOK_URL: /^https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9.]+$/,
  INSTAGRAM_URL: /^https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9_.]+$/,
  TIKTOK_URL: /^https?:\/\/(?:www\.)?tiktok\.com\/@?[a-zA-Z0-9_.]+$/,
  LINKEDIN_URL: /^https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+$/,
} as const;

// Contact Error Codes (using ErrorCodes enum for consistency)
export const CONTACT_ERROR_CODES = {
  // Contact not found
  CONTACT_NOT_FOUND: ErrorCodes.NOT_FOUND,

  // Validation errors
  INVALID_USER_BUSINESS_ID: ErrorCodes.INVALID_INPUT,
  INVALID_EMAIL_FORMAT: ErrorCodes.INVALID_EMAIL_FORMAT,
  INVALID_PHONE_FORMAT: ErrorCodes.INVALID_PHONE_FORMAT,
  INVALID_URL_FORMAT: ErrorCodes.INVALID_INPUT,

  // Business rule violations
  DUPLICATE_BUSINESS_ID: ErrorCodes.BUSINESS_RULE_VIOLATION,
  MAX_CONTACTS_EXCEEDED: ErrorCodes.BUSINESS_RULE_VIOLATION,
  INVALID_ACCOUNT_BINDING: ErrorCodes.BUSINESS_RULE_VIOLATION,

  // Permission issues
  INSUFFICIENT_PRIVILEGE: ErrorCodes.PERMISSION_DENIED,
  CONTACT_ACCESS_DENIED: ErrorCodes.FORBIDDEN,

  // External service errors
  DATAVERSE_CONTACT_ERROR: ErrorCodes.DATAVERSE_SERVICE_ERROR,
  REDIS_CACHE_ERROR: ErrorCodes.REDIS_SERVICE_ERROR,
} as const;

// Rate Limiting
export const CONTACT_RATE_LIMITS = {
  CONTACT_CREATION: 3, // Max contact creations per hour per user
  CONTACT_UPDATES: 15, // Max contact updates per hour per user
  SEARCH_REQUESTS: 100, // Max search requests per minute
  SOCIAL_MEDIA_UPDATES: 10, // Max social media updates per hour
  PHONE_UPDATES: 5, // Max phone number updates per hour
} as const;

// Event Types
export const CONTACT_EVENTS = {
  CREATED: 'contact.created',
  UPDATED: 'contact.updated',
  DELETED: 'contact.deleted',
  BUSINESS_ID_CHANGED: 'contact.business.id.changed',
  EMAIL_UPDATED: 'contact.email.updated',
  PHONE_UPDATED: 'contact.phone.updated',
  SOCIAL_MEDIA_UPDATED: 'contact.social.media.updated',
  JOB_TITLE_CHANGED: 'contact.job.title.changed',
  PRIVILEGE_CHANGED: 'contact.privilege.changed',
} as const;

// Dataverse Field Names (from Table Contact.csv - 18 fields total)
export const CONTACT_FIELDS = {
  // System fields
  CONTACT_ID: 'osot_Contact_ID', // Autonumber
  TABLE_CONTACT_ID: 'osot_Table_ContactId', // Primary key GUID
  CREATED_ON: 'createdon',
  MODIFIED_ON: 'modifiedon',
  OWNER_ID: 'ownerid',

  // Relationship fields
  TABLE_ACCOUNT: 'osot_Table_Account', // Lookup to Table_Account
  TABLE_ACCOUNT_BIND: 'osot_Table_Account@odata.bind', // For binding operations

  // Business required fields
  USER_BUSINESS_ID: 'osot_User_Business_ID', // Text max 20, business required

  // Optional fields
  SECONDARY_EMAIL: 'osot_Secondary_Email', // Email max 255
  JOB_TITLE: 'osot_Job_Title', // Text max 50

  // Phone fields (max 14 chars each)
  HOME_PHONE: 'osot_Home_Phone',
  WORK_PHONE: 'osot_Work_Phone',

  // Social media and web (URL max 255 chars each)
  BUSINESS_WEBSITE: 'osot_Business_Website',
  FACEBOOK: 'osot_Facebook',
  INSTAGRAM: 'osot_Instagram',
  TIKTOK: 'osot_TikTok',
  LINKEDIN: 'osot_LinkedIn',

  // Choice fields
  ACCESS_MODIFIERS: 'osot_Access_Modifiers',
  PRIVILEGE: 'osot_Privilege',
} as const;

// Dataverse Choice Field Names (from CSV)
export const CONTACT_CHOICE_FIELDS = {
  ACCESS_MODIFIERS: 'Choices_Access_Modifiers',
  PRIVILEGES: 'Choices_Privilege',
} as const;

// Contact ID Auto-number Configuration
export const CONTACT_AUTONUMBER = {
  PREFIX: 'osot-ct',
  MIN_DIGITS: 7,
  SEED_VALUE: 1,
  PREVIEW_FORMAT: 'osot-ct-0000001',
} as const;

// Business Rules (based on Table Contact.csv requirements)
export const CONTACT_BUSINESS_RULES = {
  // CSV Required fields
  REQUIRE_USER_BUSINESS_ID: true, // User Business ID is business required in CSV
  REQUIRE_ACCOUNT_BINDING: true, // Contact must be bound to an account (lookup)

  // CSV Optional field validations
  VALIDATE_SOCIAL_MEDIA_URLS: true, // Facebook, Instagram, TikTok, LinkedIn are URL format
  VALIDATE_EMAIL_FORMAT: true, // Secondary_Email must be email format
  VALIDATE_PHONE_FORMAT: true, // Home_Phone, Work_Phone must be phone format
  VALIDATE_URL_FORMAT: true, // Business_Website must be URL format

  // Security and defaults (from CSV choice defaults)
  AUTO_SET_PRIVILEGE: true, // Default to "Owner" as per CSV
  AUTO_SET_ACCESS_MODIFIER: true, // Default to "Private" as per CSV

  // Business logic
  UNIQUE_BUSINESS_ID_PER_ACCOUNT: true, // User_Business_ID must be unique per account
  MAX_CONTACTS_PER_ACCOUNT: 5, // Business rule limit

  // Autonumber configuration (from CSV)
  AUTO_GENERATE_CONTACT_ID: true, // osot_Contact_ID is autonumber (osot-ct-0000001)
} as const;

// Social Media Configuration (based on Table Contact.csv URL fields)
export const CONTACT_SOCIAL_MEDIA = {
  // Supported platforms (exact from CSV)
  SUPPORTED_PLATFORMS: [
    'business_website', // osot_Business_Website
    'facebook', // osot_Facebook
    'instagram', // osot_Instagram
    'tiktok', // osot_TikTok
    'linkedin', // osot_LinkedIn
  ],
  URL_VALIDATION_ENABLED: true, // All are URL format fields in CSV
  PLATFORM_SPECIFIC_VALIDATION: true, // Each platform has specific URL patterns
  MAX_URL_LENGTH: 255, // All URL fields have max 255 chars in CSV
} as const;

// Communication Configuration (based on Table Contact.csv phone/email fields)
export const CONTACT_COMMUNICATION = {
  // Phone types available in CSV
  PHONE_TYPES: ['home', 'work'], // osot_Home_Phone, osot_Work_Phone

  // Email types available in CSV
  EMAIL_TYPES: ['secondary'], // osot_Secondary_Email

  // Contact methods (derived from CSV fields)
  PREFERRED_CONTACT_METHODS: ['email', 'phone', 'social'], // Secondary email, phones, social URLs

  // Phone format requirements
  PHONE_FORMAT: 'canadian', // All phone fields should follow Canadian format
  PHONE_MAX_LENGTH: 14, // From CSV specification
} as const;

// Dataverse OData Configuration (all 18 CSV fields)
export const CONTACT_ODATA = {
  TABLE_NAME: 'osot_table_contacts',
  ACCOUNT_TABLE_NAME: 'osot_table_accounts',
  RELATIONSHIP_NAME: 'osot_Account_to_Contact',

  // All 18 fields from Table Contact.csv for SELECT queries
  SELECT_FIELDS: [
    'osot_Contact_ID', // Autonumber
    'osot_Table_ContactId', // GUID
    'createdon', // DateTime
    'modifiedon', // DateTime
    'ownerid', // Owner
    'osot_Table_Account', // Lookup
    'osot_User_Business_ID', // Business required
    'osot_Secondary_Email', // Optional email
    'osot_Job_Title', // Optional text
    'osot_Home_Phone', // Optional phone
    'osot_Work_Phone', // Optional phone
    'osot_Business_Website', // Optional URL
    'osot_Facebook', // Optional URL
    'osot_Instagram', // Optional URL
    'osot_TikTok', // Optional URL
    'osot_LinkedIn', // Optional URL
    'osot_Access_Modifiers', // Choice
    'osot_Privilege', // Choice
  ],

  // Individual field mappings for OData queries (using correct Dataverse logical names)
  ID: 'osot_contact_id',
  TABLE_ID: 'osot_table_contactid',
  CREATED_ON: 'createdon',
  MODIFIED_ON: 'modifiedon',
  OWNER_ID: 'ownerid',
  ACCOUNT_LOOKUP: 'osot_table_account', // Lookup field for account relationships
  USER_BUSINESS_ID: 'osot_user_business_id', // Correct logical name from CSV
  SECONDARY_EMAIL: 'osot_secondary_email',
  JOB_TITLE: 'osot_job_title',
  HOME_PHONE: 'osot_home_phone',
  WORK_PHONE: 'osot_work_phone',
  BUSINESS_WEBSITE: 'osot_business_website',
  FACEBOOK: 'osot_facebook',
  INSTAGRAM: 'osot_instagram',
  TIKTOK: 'osot_tiktok',
  LINKEDIN: 'osot_linkedin',
  ACCESS_MODIFIERS: 'osot_access_modifiers',
  PRIVILEGE: 'osot_privilege',
} as const;

// Export all constants as a single object for easy importing
export const CONTACT_CONSTANTS = {
  CACHE_KEYS: CONTACT_CACHE_KEYS,
  CACHE_TTL: CONTACT_CACHE_TTL,
  DEFAULTS: CONTACT_DEFAULTS,
  LIMITS: CONTACT_LIMITS,
  PATTERNS: CONTACT_PATTERNS,
  ERROR_CODES: CONTACT_ERROR_CODES,
  RATE_LIMITS: CONTACT_RATE_LIMITS,
  EVENTS: CONTACT_EVENTS,
  FIELDS: CONTACT_FIELDS,
  CHOICE_FIELDS: CONTACT_CHOICE_FIELDS,
  AUTONUMBER: CONTACT_AUTONUMBER,
  BUSINESS_RULES: CONTACT_BUSINESS_RULES,
  SOCIAL_MEDIA: CONTACT_SOCIAL_MEDIA,
  COMMUNICATION: CONTACT_COMMUNICATION,
  ODATA: CONTACT_ODATA,
} as const;
