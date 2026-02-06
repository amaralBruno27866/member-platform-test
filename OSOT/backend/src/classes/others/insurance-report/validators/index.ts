/**
 * Insurance Report Validators Index
 *
 * Centralized export of all custom validator constraints for the insurance report entity.
 * These validators enforce business rules at the DTO level using class-validator.
 *
 * VALIDATOR CONSTRAINTS:
 * 1. IsPeriodValidConstraint - Validates period is exactly 24 hours (23-25 hour tolerance)
 * 2. IsDateNotFutureConstraint - Validates dates are not in the future
 * 3. IsStatusTransitionValidConstraint - Validates status transitions follow state machine rules
 *
 * USAGE:
 * ```typescript
 * import { IsPeriodValidConstraint } from './validators';\n *
 * @Validate(IsPeriodValidConstraint)
 * class CreateInsuranceReportDto {
 *   periodStart: string;
 *   periodEnd: string;
 * }
 * ```
 *
 * @file index.ts
 * @module InsuranceReportModule/Validators
 */

export { IsPeriodValidConstraint } from './is-period-valid.validator';
export { IsDateNotFutureConstraint } from './is-date-not-future.validator';
export { IsStatusTransitionValidConstraint } from './is-status-transition-valid.validator';
