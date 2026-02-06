/**
 * Validation interface for Membership Category operations.
 * Defines validation rules, error handling, and form validation logic.
 */
export interface MembershipCategoryValidation {
  /**
   * Validate complete membership category data for creation
   */
  validateForCreation(
    categoryData: Record<string, unknown>,
  ): Promise<CategoryValidationResult>;

  /**
   * Validate partial membership category data for updates
   */
  validateForUpdate(
    updateData: Record<string, unknown>,
    existingData: Record<string, unknown>,
  ): Promise<CategoryValidationResult>;

  /**
   * Validate required fields based on context
   */
  validateRequiredFields(
    categoryData: Record<string, unknown>,
    context: ValidationContext,
  ): Promise<FieldValidationResult>;

  /**
   * Validate user reference fields (Account OR Affiliate exclusivity)
   */
  validateUserReference(
    categoryData: Record<string, unknown>,
  ): Promise<FieldValidationResult>;

  /**
   * Validate date fields and ranges
   */
  validateDateFields(
    categoryData: Record<string, unknown>,
  ): Promise<FieldValidationResult>;

  /**
   * Validate choice field values against enums
   */
  validateChoiceFields(
    categoryData: Record<string, unknown>,
  ): Promise<FieldValidationResult>;

  /**
   * Validate business logic constraints
   */
  validateBusinessConstraints(
    categoryData: Record<string, unknown>,
  ): Promise<CategoryValidationResult>;
}

/**
 * Validation result structure
 */
export interface CategoryValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  fieldErrors: Record<string, string[]>;
  processedData?: Record<string, unknown>;
}

/**
 * Field-specific validation result
 */
export interface FieldValidationResult {
  isValid: boolean;
  fieldName: string;
  errors: string[];
  warnings?: string[];
  correctedValue?: unknown;
}

/**
 * Validation error structure
 */
export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error' | 'warning';
  context?: Record<string, unknown>;
}

/**
 * Validation warning structure
 */
export interface ValidationWarning {
  field: string;
  code: string;
  message: string;
  suggestion?: string;
}

/**
 * Validation context for different operations
 */
export type ValidationContext =
  | 'creation'
  | 'update'
  | 'account-user'
  | 'affiliate-user'
  | 'retirement'
  | 'parental-leave';

/**
 * Validation rule configuration
 */
export interface ValidationRuleConfig {
  // Field validation rules
  fields: {
    osot_membership_year: FieldValidationRule;
    osot_membership_category: FieldValidationRule;
    osot_membership_declaration: FieldValidationRule;
    osot_table_account: FieldValidationRule;
    osot_table_account_affiliate: FieldValidationRule;
    osot_eligibility: FieldValidationRule;
    osot_eligibility_affiliate: FieldValidationRule;
    osot_parental_leave_from: FieldValidationRule;
    osot_parental_leave_to: FieldValidationRule;
    osot_parental_leave_expected: FieldValidationRule;
    osot_retirement_start: FieldValidationRule;
    osot_privilege: FieldValidationRule;
    osot_access_modifiers: FieldValidationRule;
  };

  // Business rule validation
  businessRules: {
    exclusiveUserReference: boolean;
    retirementDateRequired: boolean;
    parentalLeaveDateRange: boolean;
    membershipDeclarationRequired: boolean;
  };

  // Date validation rules
  dateRules: {
    allowFutureDates: boolean;
    allowPastDates: boolean;
    maxParentalLeaveDays: number;
    validateDateFormats: boolean;
  };
}

/**
 * Individual field validation rule
 */
export interface FieldValidationRule {
  required: boolean;
  requiredContext?: ValidationContext[];
  type: 'string' | 'number' | 'boolean' | 'date' | 'choice' | 'lookup';
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: RegExp;
  enumValues?: number[];
  customValidator?: string;
}

/**
 * Validation error codes
 */
export const VALIDATION_ERROR_CODES = {
  // Required field errors
  FIELD_REQUIRED: 'FIELD_REQUIRED',
  CONDITIONAL_FIELD_REQUIRED: 'CONDITIONAL_FIELD_REQUIRED',

  // Type validation errors
  INVALID_TYPE: 'INVALID_TYPE',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_ENUM_VALUE: 'INVALID_ENUM_VALUE',

  // Business rule errors
  EXCLUSIVE_USER_REFERENCE_VIOLATION: 'EXCLUSIVE_USER_REFERENCE_VIOLATION',
  MISSING_USER_REFERENCE: 'MISSING_USER_REFERENCE',
  RETIREMENT_DATE_REQUIRED: 'RETIREMENT_DATE_REQUIRED',
  INVALID_PARENTAL_LEAVE_RANGE: 'INVALID_PARENTAL_LEAVE_RANGE',
  MEMBERSHIP_DECLARATION_REQUIRED: 'MEMBERSHIP_DECLARATION_REQUIRED',

  // Date validation errors
  INVALID_DATE_FORMAT: 'INVALID_DATE_FORMAT',
  DATE_IN_FUTURE: 'DATE_IN_FUTURE',
  DATE_IN_PAST: 'DATE_IN_PAST',
  DATE_RANGE_INVALID: 'DATE_RANGE_INVALID',

  // Lookup validation errors
  INVALID_LOOKUP_REFERENCE: 'INVALID_LOOKUP_REFERENCE',
  LOOKUP_REFERENCE_NOT_FOUND: 'LOOKUP_REFERENCE_NOT_FOUND',

  // Data consistency errors
  ELIGIBILITY_TYPE_MISMATCH: 'ELIGIBILITY_TYPE_MISMATCH',
  CATEGORY_USER_TYPE_MISMATCH: 'CATEGORY_USER_TYPE_MISMATCH',
} as const;

/**
 * Default validation configuration
 */
export const DEFAULT_VALIDATION_CONFIG: ValidationRuleConfig = {
  fields: {
    osot_membership_year: {
      required: true,
      type: 'choice',
      enumValues: Array.from({ length: 32 }, (_, i) => i + 1), // 1-32
    },
    osot_membership_category: {
      required: false,
      type: 'choice',
      enumValues: Array.from({ length: 15 }, (_, i) => i + 1), // 1-15
    },
    osot_membership_declaration: {
      required: true,
      type: 'boolean',
    },
    osot_table_account: {
      required: false,
      requiredContext: ['account-user'],
      type: 'lookup',
      pattern:
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    },
    osot_table_account_affiliate: {
      required: false,
      requiredContext: ['affiliate-user'],
      type: 'lookup',
      pattern:
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    },
    osot_eligibility: {
      required: false,
      type: 'choice',
      enumValues: [0, 1, 2, 3, 4, 5, 6, 7], // NONE, QUESTION_1-7
    },
    osot_eligibility_affiliate: {
      required: false,
      type: 'choice',
      enumValues: [1, 2], // PRIMARY, PREMIUM
    },
    osot_parental_leave_from: {
      required: false,
      type: 'date',
    },
    osot_parental_leave_to: {
      required: false,
      type: 'date',
    },
    osot_parental_leave_expected: {
      required: false,
      type: 'choice',
      enumValues: [1, 2], // FULL_YEAR, SIX_MONTHS
    },
    osot_retirement_start: {
      required: false,
      requiredContext: ['retirement'],
      type: 'date',
    },
    osot_privilege: {
      required: false,
      type: 'choice',
      enumValues: [1, 2, 3], // OWNER, ADMIN, MAIN
    },
    osot_access_modifiers: {
      required: false,
      type: 'choice',
      enumValues: [1, 2, 3], // PUBLIC, PROTECTED, PRIVATE
    },
  },
  businessRules: {
    exclusiveUserReference: true,
    retirementDateRequired: true,
    parentalLeaveDateRange: true,
    membershipDeclarationRequired: true,
  },
  dateRules: {
    allowFutureDates: false,
    allowPastDates: true,
    maxParentalLeaveDays: 730, // 2 years
    validateDateFormats: true,
  },
};
