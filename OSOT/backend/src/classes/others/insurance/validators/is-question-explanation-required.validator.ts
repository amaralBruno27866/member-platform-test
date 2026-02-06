/**
 * Is Question Explanation Required Validator
 *
 * Custom validator to ensure question explanations are provided when needed.
 * If a high-risk question is answered "Yes", explanation is mandatory.
 *
 * Business Rule:
 * - ONLY applies to Professional insurance type
 * - For other insurance types (General, Corporative, Property), questions are not applicable
 * - If insurance_type is Professional:
 *   * Question 1 (allegations): If true, explanation required
 *   * Question 2 (cancellation): If true, explanation required
 *   * Question 3 (claims): If true, explanation required
 *   * Explanation must be 1-4000 characters (not empty)
 * - If insurance_type is NOT Professional:
 *   * Questions should be null/undefined (skip validation)
 *   * No explanation required
 * - Applies to: CreateInsuranceDto and UpdateInsuranceDto (for endorsements)
 *
 * @file is-question-explanation-required.validator.ts
 * @module InsuranceModule
 * @layer Validators
 * @since 2026-01-27
 */

import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { INSURANCE_QUESTION_BUSINESS_RULES } from '../constants';

/**
 * Validator function to check if question explanations are required
 * When any of the three high-risk questions are answered "Yes" (for Professional insurance),
 * their corresponding explanation field is required
 */
export function IsQuestionExplanationRequired(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isQuestionExplanationRequired',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(_value: unknown, args: ValidationArguments) {
          const obj = args.object as Record<string, unknown>;

          // Get insurance type to determine if questions are applicable
          const insuranceType = obj.osot_insurance_type as string | undefined;

          // If insurance type is not Professional, questions are not applicable
          // Skip validation for other types
          if (
            !insuranceType ||
            !INSURANCE_QUESTION_BUSINESS_RULES.TYPES_REQUIRING_QUESTIONS.includes(
              insuranceType as 'Professional',
            )
          ) {
            return true; // Validation passes for non-Professional types
          }

          // For Professional insurance type, validate that Yes answers have explanations

          // Check Question 1
          const question1 = obj.osot_insurance_question_1 as
            | boolean
            | undefined;
          const explain1 = obj.osot_insurance_question_1_explain as
            | string
            | undefined;

          if (
            question1 === true &&
            (!explain1 || explain1.trim().length === 0)
          ) {
            return false;
          }

          // Check Question 2
          const question2 = obj.osot_insurance_question_2 as
            | boolean
            | undefined;
          const explain2 = obj.osot_insurance_question_2_explain as
            | string
            | undefined;

          if (
            question2 === true &&
            (!explain2 || explain2.trim().length === 0)
          ) {
            return false;
          }

          // Check Question 3
          const question3 = obj.osot_insurance_question_3 as
            | boolean
            | undefined;
          const explain3 = obj.osot_insurance_question_3_explain as
            | string
            | undefined;

          if (
            question3 === true &&
            (!explain3 || explain3.trim().length === 0)
          ) {
            return false;
          }

          return true;
        },
        defaultMessage(_args: ValidationArguments) {
          return 'For Professional insurance, if any high-risk question is answered "Yes", an explanation is required. Explanations must be 1-4000 characters.';
        },
      },
    });
  };
}
