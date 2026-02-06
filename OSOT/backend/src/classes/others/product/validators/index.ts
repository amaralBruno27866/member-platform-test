/**
 * Product Validators Index
 *
 * Central export point for all Product custom validators.
 *
 * Validators:
 * - AtLeastOnePrice: Ensures at least one price field is set
 * - IsProductCodeUnique: Validates product code uniqueness (async)
 * - IsValidStatusTransition: Validates status transitions (async)
 * - IsPriceRequiredWhenAvailable: Ensures price when status=AVAILABLE
 * - IsInventoryValidForStatus: Validates inventory based on status
 * - IsEndDateAfterStartDate: Validates end date >= start date
 * - IsInsuranceTypeRequired: Validates insuranceType when category=INSURANCE
 *
 * @file index.ts
 * @module ProductModule
 * @layer Validators
 * @since 2025-05-01
 */

// ========================================
// SYNC VALIDATORS
// ========================================
export {
  AtLeastOnePrice,
  AtLeastOnePriceConstraint,
} from './at-least-one-price.validator';

export {
  IsPriceRequiredWhenAvailable,
  IsPriceRequiredWhenAvailableConstraint,
} from './is-price-required-when-available.validator';

export {
  IsInventoryValidForStatus,
  IsInventoryValidForStatusConstraint,
} from './is-inventory-valid-for-status.validator';

export { IsEndDateAfterStartDate } from './is-end-date-after-start-date.validator';

export {
  IsInsuranceTypeRequired,
  IsInsuranceTypeRequiredConstraint,
} from './is-insurance-type-required.validator';

// ========================================
// ASYNC VALIDATORS (Require Repository)
// ========================================
export {
  IsProductCodeUnique,
  IsProductCodeUniqueConstraint,
} from './is-product-code-unique.validator';

export {
  IsValidStatusTransition,
  IsValidStatusTransitionConstraint,
} from './is-valid-status-transition.validator';

// ========================================
// VALIDATOR CONSTRAINTS ARRAY
// (For module providers registration)
// ========================================
export const PRODUCT_VALIDATOR_CONSTRAINTS = [
  'AtLeastOnePriceConstraint',
  'IsPriceRequiredWhenAvailableConstraint',
  'IsInventoryValidForStatusConstraint',
  'IsProductCodeUniqueConstraint',
  'IsValidStatusTransitionConstraint',
] as const;
