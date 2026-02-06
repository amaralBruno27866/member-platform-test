/**
 * Insurance Provider Business Rules Constants
 *
 * Business logic rules and constraints for Insurance Provider operations:
 * - Access control defaults
 * - Organization scoping
 * - Policy period rules
 */

/**
 * Access control rules
 */
export const INSURANCE_PROVIDER_ACCESS_RULES = {
  /**
   * Default privilege for new providers
   * Main (3) per Dataverse default
   */
  DEFAULT_PRIVILEGE: 3, // Main

  /**
   * Default access modifier for new providers
   * Protected (1) per Dataverse default
   */
  DEFAULT_ACCESS_MODIFIER: 1, // Protected
} as const;

/**
 * Organization scoping rules
 */
export const INSURANCE_PROVIDER_ORG_RULES = {
  /**
   * Provider must always be scoped to an organization
   */
  REQUIRE_ORGANIZATION_SCOPE: true,

  /**
   * Organization cannot be changed after creation
   */
  ORGANIZATION_IMMUTABLE: true,
} as const;

/**
 * Policy period rules
 */
export const INSURANCE_PROVIDER_POLICY_RULES = {
  /**
   * Policy period must be valid (end >= start)
   */
  REQUIRE_VALID_PERIOD: true,
} as const;
