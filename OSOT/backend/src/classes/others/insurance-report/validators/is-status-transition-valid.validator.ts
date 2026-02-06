/**
 * Is Status Transition Valid Validator
 *
 * Validates that status transitions follow the allowed state machine rules.
 * Enforces business rule constraints for report lifecycle management.
 *
 * STATUS TRANSITION RULES:
 * - PENDING_APPROVAL can transition to: APPROVED, REJECTED
 * - APPROVED can transition to: SENT_TO_PROVIDER, REJECTED
 * - REJECTED cannot transition to any other state (terminal state)
 * - SENT_TO_PROVIDER can transition to: ACKNOWLEDGED, REJECTED
 * - ACKNOWLEDGED cannot transition to any other state (terminal state)
 *
 * USAGE:
 * ```typescript
 * @Validate(IsStatusTransitionValidConstraint)
 * class UpdateInsuranceReportDto {
 *   reportStatus?: InsuranceReportStatus;
 * }
 *
 * // In controller: attach current status
 * const dto = new UpdateInsuranceReportDto();
 * dto.reportStatus = newStatus;
 * dto.currentStatus = existingReport.reportStatus; // Needed for validator
 * await validate(dto);
 * ```
 *
 * @file is-status-transition-valid.validator.ts
 * @module InsuranceReportModule
 * @layer Validators
 */

import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import {
  INSURANCE_REPORT_RULES,
  INSURANCE_REPORT_MESSAGES,
} from '../constants';
import { InsuranceReportStatus } from '../../insurance/enum/insurance-report-status.enum';

interface StatusObject {
  currentStatus?: unknown;
  reportStatus?: unknown;
}

@ValidatorConstraint({ name: 'isStatusTransitionValid', async: false })
export class IsStatusTransitionValidConstraint
  implements ValidatorConstraintInterface
{
  validate(value: unknown, _args: ValidationArguments): boolean {
    // Extract the object being validated and the current status
    const object = _args.object as unknown as StatusObject;
    const currentStatus = (object.currentStatus || object.reportStatus) as
      | InsuranceReportStatus
      | undefined;
    const newStatus = value as InsuranceReportStatus | undefined;

    // If no current status provided, this is a creation (allowed to set any valid status)
    if (!currentStatus) {
      // Default new reports to PENDING_APPROVAL
      return (
        newStatus === undefined ||
        newStatus === InsuranceReportStatus.PENDING_APPROVAL
      );
    }

    // Check if current status exists in transition rules
    const allowedTransitions =
      INSURANCE_REPORT_RULES.VALID_STATUS_TRANSITIONS[currentStatus];

    if (!allowedTransitions) {
      // Current status not in transition map = invalid state
      return false;
    }

    // Check if new status is in the allowed transitions
    return allowedTransitions.includes(newStatus);
  }

  defaultMessage(_args: ValidationArguments): string {
    const object = _args.object as unknown as StatusObject;
    const currentStatus = (object.currentStatus || object.reportStatus) as
      | InsuranceReportStatus
      | undefined;
    const newStatus = _args.value as InsuranceReportStatus | undefined;

    if (!currentStatus) {
      return INSURANCE_REPORT_MESSAGES.INVALID_STATUS_TRANSITION(
        'unknown',
        'unknown',
      );
    }

    const allowedTransitions =
      INSURANCE_REPORT_RULES.VALID_STATUS_TRANSITIONS[currentStatus];

    if (!allowedTransitions || allowedTransitions.length === 0) {
      const currentStr =
        typeof currentStatus === 'string' || typeof currentStatus === 'number'
          ? String(currentStatus)
          : 'unknown';
      const newStr =
        typeof newStatus === 'string' || typeof newStatus === 'number'
          ? String(newStatus)
          : 'unknown';
      return `${INSURANCE_REPORT_MESSAGES.INVALID_STATUS_TRANSITION(currentStr, newStr)} Current status '${currentStr}' has no valid transitions.`;
    }

    const allowedStatusList = allowedTransitions.join(', ');
    const currentStr =
      typeof currentStatus === 'string' || typeof currentStatus === 'number'
        ? String(currentStatus)
        : 'unknown';
    const newStr =
      typeof newStatus === 'string' || typeof newStatus === 'number'
        ? String(newStatus)
        : 'unknown';
    return `${INSURANCE_REPORT_MESSAGES.INVALID_STATUS_TRANSITION(currentStr, newStr)} From '${currentStr}', allowed transitions are: ${allowedStatusList}. Cannot transition to '${newStr}'.`;
  }
}
