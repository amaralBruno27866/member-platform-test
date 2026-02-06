/**
 * Order Validators Index
 *
 * Central export point for all Order custom validators.
 *
 * Validators:
 * - AccountOrAffiliateRequired: Ensures at least one buyer is specified
 * - ValidTotalCalculation: Validates order total calculation
 * - ValidCouponFormat: Validates coupon code format
 * - SubtotalNotGreaterThanTotal: Ensures subtotal <= total
 * - IsProfessionalRequiredForInsurance: Ensures professional insurance requirement when selecting other types
 *
 * Sync Validators:
 * - Used in DTOs for immediate validation
 * - Do not require database calls
 * - Run during DTO instantiation
 *
 * Async Validators:
 * - Currently none implemented
 * - Future: IsValidStatusTransition, CouponExists, etc.
 *
 * @file index.ts
 * @module OrderModule
 * @layer Validators
 * @since 2026-01-22
 */

// ========================================
// SYNC VALIDATORS
// ========================================
export {
  AccountOrAffiliateRequired,
  AccountOrAffiliateRequiredConstraint,
} from './account-or-affiliate-required.validator';

export {
  ValidTotalCalculation,
  ValidTotalCalculationConstraint,
} from './valid-total-calculation.validator';

export {
  ValidCouponFormat,
  ValidCouponFormatConstraint,
} from './valid-coupon-format.validator';

export {
  SubtotalNotGreaterThanTotal,
  SubtotalNotGreaterThanTotalConstraint,
} from './subtotal-not-greater-than-total.validator';

export {
  IsProfessionalRequiredForInsurance,
  IsProfessionalRequiredForInsuranceConstraint,
} from './is-professional-required-for-insurance.validator';

// ========================================
// ASYNC VALIDATORS (Future)
// ========================================
// export { IsValidStatusTransition } from './is-valid-status-transition.validator';
// export { CouponExists } from './coupon-exists.validator';
