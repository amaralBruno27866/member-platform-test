/**
 * Valid Status Transition Validator
 *
 * Custom validator to ensure product status transitions are valid.
 * According to VALID_STATUS_TRANSITIONS, not all transitions are allowed.
 *
 * Examples:
 * - DISCONTINUED cannot transition to any other status (final state)
 * - DRAFT can transition to AVAILABLE, UNAVAILABLE, or DISCONTINUED
 *
 * @file is-valid-status-transition.validator.ts
 * @module ProductModule
 * @layer Validators
 * @since 2025-05-01
 */

import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { ProductStatus } from '../enums';
import { VALID_STATUS_TRANSITIONS } from '../constants';

/**
 * Validator constraint implementation
 * Requires ProductRepository to check current status
 */
@ValidatorConstraint({ name: 'IsValidStatusTransition', async: true })
@Injectable()
export class IsValidStatusTransitionConstraint
  implements ValidatorConstraintInterface
{
  /**
   * Validate status transition
   * For CREATE operations, any status is valid
   * For UPDATE operations, check VALID_STATUS_TRANSITIONS
   */
  validate(newStatus: ProductStatus, args: ValidationArguments): boolean {
    const object = args.object as {
      id?: string;
      currentStatus?: ProductStatus;
    };

    // For CREATE operations (no ID), any status is valid
    if (!object.id && !object.currentStatus) {
      return true;
    }

    // For UPDATE operations, validate transition
    const currentStatus = object.currentStatus;
    if (currentStatus === undefined) {
      // If current status not provided in DTO, cannot validate
      // This validation should be done at service level
      return true;
    }

    // Check if transition is allowed
    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  }

  defaultMessage(args: ValidationArguments): string {
    const object = args.object as { currentStatus?: ProductStatus };
    const currentStatus = object.currentStatus;

    if (currentStatus === undefined) {
      return 'Cannot validate status transition without current status';
    }

    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];
    const statusNames = {
      [ProductStatus.UNAVAILABLE]: 'UNAVAILABLE',
      [ProductStatus.AVAILABLE]: 'AVAILABLE',
      [ProductStatus.DISCONTINUED]: 'DISCONTINUED',
      [ProductStatus.DRAFT]: 'DRAFT',
      [ProductStatus.OUT_OF_STOCK]: 'OUT_OF_STOCK',
    };

    const currentName = statusNames[currentStatus] || currentStatus;
    const allowedNames = allowedTransitions
      .map((s) => statusNames[s] || s)
      .join(', ');

    return `Invalid status transition from ${currentName}. Allowed transitions: ${allowedNames || 'none (final state)'}`;
  }
}

/**
 * Decorator to validate status transition
 *
 * @param validationOptions - Validation options
 *
 * @example
 * ```typescript
 * class UpdateProductDto {
 *   currentStatus?: ProductStatus; // Should be set by service
 *
 *   @IsValidStatusTransition()
 *   productStatus?: ProductStatus;
 * }
 * ```
 */
export function IsValidStatusTransition(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidStatusTransitionConstraint,
    });
  };
}
