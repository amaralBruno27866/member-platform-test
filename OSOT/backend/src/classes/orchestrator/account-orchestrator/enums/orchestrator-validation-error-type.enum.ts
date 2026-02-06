/**
 * Enumeration of validation error types in the orchestrator.
 * Used to categorize validation failures for better error handling and user feedback.
 */
export enum OrchestratorValidationErrorType {
  /**
   * Errors in individual entity validation (DTO level)
   */
  ENTITY_VALIDATION = 'ENTITY_VALIDATION',

  /**
   * Errors in cross-entity relationship validation
   */
  CROSS_ENTITY_VALIDATION = 'CROSS_ENTITY_VALIDATION',

  /**
   * Errors in business rule validation
   */
  BUSINESS_RULE_VALIDATION = 'BUSINESS_RULE_VALIDATION',

  /**
   * System or internal errors during validation
   */
  SYSTEM_ERROR = 'SYSTEM_ERROR',

  /**
   * Data consistency errors
   */
  DATA_CONSISTENCY = 'DATA_CONSISTENCY',

  /**
   * Permission or authorization errors
   */
  AUTHORIZATION = 'AUTHORIZATION',

  /**
   * External service validation errors
   */
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
}
