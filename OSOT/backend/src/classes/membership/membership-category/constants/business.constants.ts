import { AccessModifier } from '../../../../common/enums/access-modifier.enum';
import { Privilege } from '../../../../common/enums/privilege.enum';
import { Category } from '../../../../common/enums/categories-enum';
import { UserGroup } from '../../../../common/enums/user-group.enum';

/**
 * Busi  getCategoryKey: (categoryId: string): string =>
    `${MEMBERSHIP_CATEGORY_CACHE_KEYS.BY_CATEGORY}:${categoryId}`,ss Constants for Membership Category
 * Defines default values, business rules, and constraints for membership category operations
 * Based on Table Membership Category.csv schema and business requirements
 */

/**
 * Default Values for Required Fields
 */
export const MEMBERSHIP_CATEGORY_DEFAULTS = {
  // Default privilege level for new membership categories (per CSV: Default = Owner)
  PRIVILEGE: Privilege.OWNER,

  // Default access modifier for new membership categories (per CSV: Default = Private)
  ACCESS_MODIFIER: AccessModifier.PRIVATE,
} as const;

/**
 * Business Rules and Constraints
 */
export const MEMBERSHIP_CATEGORY_RULES = {
  // User Reference Rules
  REQUIRE_USER_REFERENCE: true, // Must have either Account OR Affiliate
  EXCLUSIVE_USER_REFERENCE: true, // Cannot have both Account AND Affiliate

  // Users Group Rules
  USERS_GROUP_OPTIONAL: true, // Optional per CSV, set by internal process
  USERS_GROUP_VALIDATE_CONSISTENCY: true, // Validate consistency with account type when present

  // Date Validation Rules
  PARENTAL_LEAVE_REQUIRES_BOTH_DATES: false, // From and To are both optional
  RETIREMENT_DATE_REQUIRED_FOR_RETIRED: true, // Required if category is OT_RET or OTA_RET

  // Parental Leave Expected Rules (ACCOUNT ONLY - not for Affiliates)
  PARENTAL_LEAVE_EXPECTED_ACCOUNT_ONLY: true, // Only for Account users (not Affiliates - companies don't take parental leave)
  PARENTAL_LEAVE_EXPECTED_REQUIRES_ELIGIBILITY_6: true, // Only available when eligibility = 6 (On Parental Leave)
  PARENTAL_LEAVE_EXPECTED_REQUIRES_PRACTITIONER: true, // Only for OT(1) or OTA(2) user groups
  PARENTAL_LEAVE_EXPECTED_ONE_TIME_USE: true, // Each option (FULL_YEAR, SIX_MONTHS) can only be used once in user's lifetime
  PARENTAL_LEAVE_EXPECTED_ELIGIBLE_USER_GROUPS: [UserGroup.OT, UserGroup.OTA], // Only OT and OTA practitioners

  // Category-specific Rules
  RETIREMENT_CATEGORIES: [Category.OT_RET, Category.OTA_RET],
  STUDENT_CATEGORIES: [Category.OT_STU, Category.OTA_STU],
  LIFE_MEMBER_CATEGORIES: [Category.OT_LIFE, Category.OTA_LIFE],
  AFFILIATE_CATEGORIES: [Category.AFF_PRIM, Category.AFF_PREM],

  // Users Group Categories (for future business rule validation)
  STUDENT_USER_GROUPS: [
    UserGroup.OT_STUDENT,
    UserGroup.OTA_STUDENT,
    UserGroup.OT_STUDENT_NEW_GRAD,
    UserGroup.OTA_STUDENT_NEW_GRAD,
  ],
  PRACTITIONER_USER_GROUPS: [UserGroup.OT, UserGroup.OTA],
  AFFILIATE_USER_GROUPS: [UserGroup.AFFILIATE],
  VENDOR_USER_GROUPS: [UserGroup.VENDOR_ADVERTISER_RECRUITER],
  OTHER_USER_GROUPS: [UserGroup.OTHER],
} as const;

/**
 * Field Validation Limits
 */
export const MEMBERSHIP_CATEGORY_LIMITS = {
  // Autonumber Configuration (per CSV)
  CATEGORY_ID_PREFIX: 'osot-cat',
  CATEGORY_ID_MIN_DIGITS: 7,
  CATEGORY_ID_SEED_VALUE: 1,

  // Date Range Validation
  MIN_YEAR: 2019, // Based on MembershipYear enum
  MAX_YEAR: 2050, // Based on MembershipYear enum

  // Users Group Validation
  USERS_GROUP_MIN_VALUE: 1, // Based on UserGroup enum
  USERS_GROUP_MAX_VALUE: 9, // Based on UserGroup enum

  // Business Logic Limits
  MAX_PARENTAL_LEAVE_DAYS: 365 * 2, // 2 years maximum
  MIN_RETIREMENT_AGE_DAYS: 365 * 50, // Minimum 50 years old (rough estimate)
} as const;

/**
 * Eligibility Rules by User Type
 */
export const ELIGIBILITY_RULES = {
  // OT/OTA users use standard eligibility (0-7)
  ACCOUNT_ELIGIBILITY_RANGE: { MIN: 0, MAX: 7 },

  // Affiliate users use affiliate-specific eligibility (1-2)
  AFFILIATE_ELIGIBILITY_RANGE: { MIN: 1, MAX: 2 },

  // Default eligibility when not specified
  DEFAULT_ACCOUNT_ELIGIBILITY: 0, // NONE
  DEFAULT_AFFILIATE_ELIGIBILITY: 1, // PRIMARY
} as const;

/**
 * Required Fields by Context
 */
export const REQUIRED_FIELDS = {
  // Always Required (per CSV Business required)
  ALWAYS: ['osot_membership_year'] as const,

  // Required when Account user
  FOR_ACCOUNT: ['osot_table_account'] as const,

  // Required when Affiliate user
  FOR_AFFILIATE: ['osot_table_account_affiliate'] as const,

  // Required for Retired categories
  FOR_RETIRED: ['osot_retirement_start'] as const,

  // Required for Parental Leave (if one is set, both should be set)
  FOR_PARENTAL_LEAVE: [
    'osot_parental_leave_from',
    'osot_parental_leave_to',
  ] as const,
} as const;

/**
 * Business Error Messages
 */
export const MEMBERSHIP_CATEGORY_ERRORS = {
  // User Reference Errors
  NO_USER_REFERENCE: 'Must specify either Account or Affiliate user reference',
  MULTIPLE_USER_REFERENCES:
    'Cannot specify both Account and Affiliate user references',

  // Users Group Errors
  USERS_GROUP_INVALID: 'Users Group must be a valid value (1-9)',
  USERS_GROUP_CONSISTENCY:
    'Users Group does not match account type or category',

  // Date Validation Errors
  INVALID_PARENTAL_LEAVE_PERIOD:
    'Parental leave end date must be after start date',
  PARENTAL_LEAVE_TOO_LONG: 'Parental leave period cannot exceed 2 years',
  RETIREMENT_DATE_REQUIRED:
    'Retirement start date is required for retired categories',
  RETIREMENT_DATE_INVALID: 'Retirement date cannot be in the future',

  // Category Consistency Errors
  ELIGIBILITY_MISMATCH:
    'Eligibility type does not match user type (Account vs Affiliate)',
  CATEGORY_USER_TYPE_MISMATCH:
    'Category does not match user type (OT/OTA vs Affiliate)',

  // Parental Leave Expected Errors
  PARENTAL_LEAVE_EXPECTED_AFFILIATE_NOT_ALLOWED:
    'Parental Leave Expected is not available for Affiliate users. This feature is only for Account users (OT/OTA practitioners)',
  PARENTAL_LEAVE_EXPECTED_NOT_AVAILABLE:
    'Parental Leave Expected is only available for OT/OTA practitioners with eligibility "On Parental Leave"',
  PARENTAL_LEAVE_EXPECTED_REQUIRES_DATES:
    'Parental Leave Expected requires both parental leave from and to dates',
  PARENTAL_LEAVE_EXPECTED_ALREADY_USED:
    'This parental leave option has already been used in a previous membership year',
  PARENTAL_LEAVE_EXPECTED_FULL_YEAR_USED:
    'Full Year (12 months) parental leave has already been used',
  PARENTAL_LEAVE_EXPECTED_SIX_MONTHS_USED:
    'Six Months parental leave has already been used',
  PARENTAL_LEAVE_EXPECTED_ALL_OPTIONS_USED:
    'All parental leave expected options have been used. Insurance coverage not available for this parental leave period',
} as const;

/**
 * Cache Constants for Membership Category
 * Defines cache keys, TTL values, and caching strategies for membership category operations
 * Based on performance requirements and data access patterns
 */

/**
 * Cache Key Prefixes
 * Used to organize and identify cached data by type and operation
 */
export const MEMBERSHIP_CATEGORY_CACHE_KEYS = {
  // Base Cache Keys
  PREFIX: 'membership-category',
  LIST: 'membership-category:list',
  DETAIL: 'membership-category:detail',
  SEARCH: 'membership-category:search',
  COUNT: 'membership-category:count',
  STATS: 'membership-category:stats',

  // Filtered Lists Cache Keys
  BY_CATEGORY: 'membership-category:by-category',
  BY_ELIGIBILITY: 'membership-category:by-eligibility',
  BY_ACCOUNT: 'membership-category:by-account',
  BY_AFFILIATE: 'membership-category:by-affiliate',
  BY_USER_GROUP: 'membership-category:by-user-group', // Nova cache para Users_Group
  BY_YEAR: 'membership-category:by-year',
  BY_STATUS: 'membership-category:by-status',

  // Business Logic Cache Keys
  ELIGIBILITY_RULES: 'membership-category:eligibility-rules',
  CATEGORY_RULES: 'membership-category:category-rules',
  USER_GROUP_MAPPINGS: 'membership-category:user-group-mappings', // Cache para mapeamentos Users_Group
  VALIDATION_RULES: 'membership-category:validation-rules',
  YEAR_TRANSITIONS: 'membership-category:year-transitions',

  // Aggregation Cache Keys
  CATEGORY_COUNTS: 'membership-category:category-counts',
  ELIGIBILITY_COUNTS: 'membership-category:eligibility-counts',
  USER_GROUP_STATS: 'membership-category:user-group-stats', // Stats por Users_Group
  YEARLY_STATS: 'membership-category:yearly-stats',
  ACCOUNT_SUMMARY: 'membership-category:account-summary',
  AFFILIATE_SUMMARY: 'membership-category:affiliate-summary',

  // Additional Cache Keys for Helpers
  BY_ID: 'membership-category:by-id',
  BY_CATEGORY_ID: 'membership-category:by-category-id',
  BY_YEAR_CATEGORY: 'membership-category:by-year-category',
  BY_USER_YEAR: 'membership-category:by-user-year',
  LIST_BY_PRIVILEGE: 'membership-category:list-by-privilege',
} as const;

/**
 * Cache TTL (Time To Live) Values in Seconds
 * Different data types have different freshness requirements
 */
export const MEMBERSHIP_CATEGORY_CACHE_TTL = {
  // Individual records - medium freshness requirement
  RECORD: 15 * 60, // 15 minutes

  // User-specific data - short TTL for security
  USER_DATA: 5 * 60, // 5 minutes

  // Query results - medium TTL, can be stale
  QUERY_RESULTS: 10 * 60, // 10 minutes

  // List operations - longer TTL, less critical
  LIST_OPERATIONS: 30 * 60, // 30 minutes

  // Lookup data - very long TTL, rarely changes
  LOOKUP_DATA: 2 * 60 * 60, // 2 hours

  // Validation rules - long TTL, changes infrequently
  VALIDATION_RULES: 60 * 60, // 1 hour

  // Emergency short TTL for troubleshooting
  DEBUG_MODE: 30, // 30 seconds
} as const;

/**
 * Cache Tags for Invalidation Groups
 * Used to invalidate related cached data when changes occur
 */
export const MEMBERSHIP_CATEGORY_CACHE_TAGS = {
  // Entity-level tags
  ENTITY: 'membership-category',
  RECORDS: 'membership-category-records',

  // Data relationship tags
  ACCOUNT_RELATED: 'membership-category-account',
  AFFILIATE_RELATED: 'membership-category-affiliate',

  // Business logic tags
  YEAR_DEPENDENT: 'membership-category-year',
  CATEGORY_DEPENDENT: 'membership-category-category',
  ELIGIBILITY_DEPENDENT: 'membership-category-eligibility',

  // Operation tags
  CRUD_OPERATIONS: 'membership-category-crud',
  LOOKUP_OPERATIONS: 'membership-category-lookup',
  VALIDATION_OPERATIONS: 'membership-category-validation',
} as const;

/**
 * Cache Configuration
 * Defines behavior and limits for caching operations
 */
export const MEMBERSHIP_CATEGORY_CACHE_CONFIG = {
  // Maximum entries to cache per key pattern
  MAX_ENTRIES_PER_KEY: 1000,

  // Maximum memory usage (estimated in MB)
  MAX_MEMORY_MB: 50,

  // Cache warming settings
  ENABLE_CACHE_WARMING: true,
  WARM_UP_DELAY_MS: 5000, // 5 seconds after startup

  // Compression settings
  ENABLE_COMPRESSION: true,
  COMPRESSION_THRESHOLD_BYTES: 1024, // 1KB

  // Refresh settings
  ENABLE_BACKGROUND_REFRESH: true,
  REFRESH_PERCENTAGE: 0.8, // Refresh when 80% of TTL elapsed

  // Circuit breaker for cache failures
  ENABLE_CIRCUIT_BREAKER: true,
  CIRCUIT_BREAKER_THRESHOLD: 5, // Failures before opening circuit
  CIRCUIT_BREAKER_TIMEOUT_MS: 30000, // 30 seconds
} as const;

/**
 * Cache Key Helper Functions
 * Utility functions to generate consistent cache keys
 */
export const MEMBERSHIP_CATEGORY_CACHE_HELPERS = {
  /**
   * Generate cache key for individual record by ID
   */
  getDetailKey: (id: string): string =>
    `${MEMBERSHIP_CATEGORY_CACHE_KEYS.DETAIL}:${id}`,

  /**
   * Generate cache key for record by Category ID
   */
  getCategoryIdKey: (categoryId: string): string =>
    `${MEMBERSHIP_CATEGORY_CACHE_KEYS.BY_CATEGORY_ID}${categoryId}`,

  /**
   * Generate cache key for account memberships
   */
  getAccountKey: (accountId: string): string =>
    `${MEMBERSHIP_CATEGORY_CACHE_KEYS.BY_ACCOUNT}${accountId}`,

  /**
   * Generate cache key for affiliate memberships
   */
  getAffiliateKey: (affiliateId: string): string =>
    `${MEMBERSHIP_CATEGORY_CACHE_KEYS.BY_AFFILIATE}${affiliateId}`,

  /**
   * Generate cache key for year-specific data
   */
  getYearKey: (year: number): string =>
    `${MEMBERSHIP_CATEGORY_CACHE_KEYS.BY_YEAR}${year}`,

  /**
   * Generate cache key for Users Group data
   */
  getUserGroupKey: (userGroup: UserGroup): string =>
    `${MEMBERSHIP_CATEGORY_CACHE_KEYS.BY_USER_GROUP}:${userGroup}`,

  /**
   * Generate cache key for Users Group stats by year
   */
  getUserGroupYearKey: (userGroup: UserGroup, year: number): string =>
    `${MEMBERSHIP_CATEGORY_CACHE_KEYS.USER_GROUP_STATS}:${userGroup}:${year}`,

  /**
   * Generate cache key for category-specific data
   */
  getCategoryKey: (category: number): string =>
    `${MEMBERSHIP_CATEGORY_CACHE_KEYS.BY_CATEGORY}${category}`,

  /**
   * Generate cache key for year + category combination
   */
  getCategoryYearKey: (year: number, category: Category): string =>
    `${MEMBERSHIP_CATEGORY_CACHE_KEYS.BY_YEAR}:${year}:${category}`,

  /**
   * Generate cache key for user + year combination
   */
  getUserYearKey: (userId: string, year: number, isAffiliate = false): string =>
    `${MEMBERSHIP_CATEGORY_CACHE_KEYS.BY_YEAR}:${isAffiliate ? 'affiliate' : 'account'}:${userId}:${year}`,

  /**
   * Generate cache key for privilege-based lists
   */
  getPrivilegeListKey: (privilege: number): string =>
    `${MEMBERSHIP_CATEGORY_CACHE_KEYS.LIST_BY_PRIVILEGE}${privilege}`,
} as const;
