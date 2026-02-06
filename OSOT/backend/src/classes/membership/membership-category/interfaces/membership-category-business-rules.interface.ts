import { MembershipCategoryInternal } from './membership-category-internal.interface';

/**
 * Interface for Membership Category business rules operations.
 * Defines the contract for enforcing membership category-specific business logic.
 */
export interface MembershipCategoryBusinessRules {
  /**
   * Apply business rules for membership category creation
   */
  applyCreationRules(categoryData: Record<string, unknown>): Promise<{
    processedData: Record<string, unknown>;
    rulesApplied: string[];
    warnings?: string[];
  }>;

  /**
   * Apply business rules for membership category updates
   */
  applyUpdateRules(
    updateData: Record<string, unknown>,
    existingCategory: Record<string, unknown>,
  ): Promise<{
    processedData: Record<string, unknown>;
    rulesApplied: string[];
    warnings?: string[];
  }>;

  /**
   * Validate exclusive user reference business rule
   * Ensures only ONE of Account OR Affiliate is specified, never both
   */
  validateExclusiveUserReference(
    categoryData: Partial<MembershipCategoryInternal>,
  ): Promise<{
    isValid: boolean;
    errors: string[];
    correctedData?: Partial<MembershipCategoryInternal>;
  }>;

  /**
   * Validate retirement category requirements
   * Ensures retirement start date is provided for retirement categories
   */
  validateRetirementRequirements(
    categoryData: Partial<MembershipCategoryInternal>,
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings?: string[];
  }>;

  /**
   * Validate parental leave date consistency
   * Ensures from date is before to date if both are provided
   */
  validateParentalLeaveDates(
    categoryData: Partial<MembershipCategoryInternal>,
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings?: string[];
  }>;

  /**
   * Validate eligibility field consistency with user type
   * Ensures correct eligibility field is used based on user type
   */
  validateEligibilityConsistency(
    categoryData: Partial<MembershipCategoryInternal>,
  ): Promise<{
    isValid: boolean;
    errors: string[];
    correctedData?: Partial<MembershipCategoryInternal>;
  }>;

  /**
   * Validate category consistency with user type
   * Ensures category matches user type (OT/OTA vs Affiliate categories)
   */
  validateCategoryUserTypeConsistency(
    categoryData: Partial<MembershipCategoryInternal>,
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings?: string[];
  }>;

  /**
   * Apply default values based on business rules
   * Sets appropriate defaults for privilege, access modifiers, etc.
   */
  applyDefaultValues(
    categoryData: Partial<MembershipCategoryInternal>,
  ): Promise<{
    processedData: Partial<MembershipCategoryInternal>;
    defaultsApplied: string[];
  }>;

  /**
   * Validate membership declaration requirement
   * Ensures declaration is explicitly set to true for compliance
   */
  validateMembershipDeclaration(
    categoryData: Partial<MembershipCategoryInternal>,
  ): Promise<{
    isValid: boolean;
    errors: string[];
  }>;

  /**
   * Calculate computed fields for business logic
   * Computes isActive, userType, isEligible, etc. based on data
   */
  calculateComputedFields(categoryData: MembershipCategoryInternal): Promise<{
    computedFields: Partial<MembershipCategoryInternal>;
    calculationsPerformed: string[];
  }>;
}

/**
 * Business Rule Validation Result
 * Standard return type for all validation operations
 */
export interface BusinessRuleValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  processedData?: Record<string, unknown>;
  rulesApplied?: string[];
}

/**
 * Business Rule Configuration
 * Defines how business rules should be applied and validated
 */
export interface MembershipCategoryBusinessRuleConfig {
  // User reference validation rules
  userReference: {
    requireUserReference: boolean; // Must have either Account OR Affiliate
    exclusiveReference: boolean; // Cannot have both Account AND Affiliate
    validateReferenceExists: boolean; // Check if referenced user exists
  };

  // Date validation rules
  dateValidation: {
    allowFutureDates: boolean; // Allow future dates for retirement/parental leave
    validateParentalLeaveRange: boolean; // Validate from < to dates
    maxParentalLeaveDays: number; // Maximum allowed parental leave days
  };

  // Category-specific rules
  categoryRules: {
    requireRetirementDateForRetired: boolean; // Retirement date required for retired categories
    validateCategoryEligibility: boolean; // Category must match eligibility requirements
    allowCategoryChange: boolean; // Allow changing category after creation
  };

  // Declaration and compliance rules
  complianceRules: {
    requireMembershipDeclaration: boolean; // Declaration must be explicitly true
    auditTrailRequired: boolean; // Track all changes for compliance
    validatePrivilegeAssignment: boolean; // Validate privilege assignment rules
  };
}

/**
 * Default Business Rule Configuration
 * Standard configuration based on business requirements
 */
export const DEFAULT_MEMBERSHIP_CATEGORY_BUSINESS_RULE_CONFIG: MembershipCategoryBusinessRuleConfig =
  {
    userReference: {
      requireUserReference: true,
      exclusiveReference: true,
      validateReferenceExists: true,
    },
    dateValidation: {
      allowFutureDates: false,
      validateParentalLeaveRange: true,
      maxParentalLeaveDays: 730, // 2 years
    },
    categoryRules: {
      requireRetirementDateForRetired: true,
      validateCategoryEligibility: true,
      allowCategoryChange: false, // Strict: no category changes after creation
    },
    complianceRules: {
      requireMembershipDeclaration: true,
      auditTrailRequired: true,
      validatePrivilegeAssignment: true,
    },
  };
