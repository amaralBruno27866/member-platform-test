/**
 * Insurance Constants
 *
 * Barrel export for all insurance constants:
 * - OData field definitions and query helpers
 * - Validation rules and constraints
 * - Business rules and lifecycle logic
 *
 * Usage:
 * import {
 *   INSURANCE_ENTITY,
 *   INSURANCE_FIELDS,
 *   INSURANCE_ODATA,
 *   INSURANCE_FIELD_LENGTH,
 *   INSURANCE_VALIDATION_ERRORS,
 *   VALID_INSURANCE_STATUS_TRANSITIONS,
 * } from '@/classes/others/insurance/constants';
 */

export * from './insurance-odata.constant';
export * from './insurance-validation.constant';
export * from './insurance-business-rules.constant';
