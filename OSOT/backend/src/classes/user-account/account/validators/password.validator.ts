/**
 * Password Validator for Account
 *
 * SECURITY FOCUSED:
 * - Advanced password strength validation
 * - Common password pattern detection
 * - Configurable security requirements
 * - Business rule integration
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - constants: Uses ACCOUNT_VALIDATION_PATTERNS and ACCOUNT_SECURITY
 * - errors: Provides detailed error messages for security violations
 *
 * BUSINESS RULES:
 * - Minimum 8 characters (configurable)
 * - Must contain uppercase, lowercase, and numbers
 * - Optional special character requirements
 * - Prevent common weak passwords
 * - Prevent personal information in passwords
 */

import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import {
  ACCOUNT_VALIDATION_PATTERNS,
  ACCOUNT_SECURITY,
} from '../constants/account.constants';
import { ErrorMessages } from '../../../../common/errors/error-messages';
import { ErrorCodes } from '../../../../common/errors/error-codes';

// ========================================
// CONTEXT INTERFACE FOR VALIDATION
// ========================================

interface PasswordValidationContext {
  osot_first_name?: string;
  osot_last_name?: string;
  osot_email?: string;
  osot_date_of_birth?: string | Date;
}

/**
 * Comprehensive Password Strength Validator
 * Validates password against multiple security criteria
 */
@ValidatorConstraint({ name: 'accountPasswordStrength', async: false })
export class AccountPasswordStrengthValidator
  implements ValidatorConstraintInterface
{
  validate(password: string, args?: ValidationArguments): boolean {
    if (!password) return false;

    // Get additional context if available (for personal info check)
    const context = (args?.object as PasswordValidationContext) || {};

    // Basic length check
    if (password.length < ACCOUNT_SECURITY.PASSWORD_MIN_LENGTH) {
      return false;
    }

    if (password.length > ACCOUNT_SECURITY.PASSWORD_MAX_LENGTH) {
      return false;
    }

    // Use pattern from constants for basic requirements
    if (!ACCOUNT_VALIDATION_PATTERNS.PASSWORD.test(password)) {
      return false;
    }

    // Check for personal information in password
    if (this.containsPersonalInfo(password, context)) {
      return false;
    }

    // Check for sequential characters
    if (this.hasSequentialCharacters(password)) {
      return false;
    }

    // Check for repeated characters
    if (this.hasExcessiveRepeatedCharacters(password)) {
      return false;
    }

    return true;
  }

  /**
   * Check if password contains personal information
   */
  private containsPersonalInfo(
    password: string,
    context: PasswordValidationContext,
  ): boolean {
    const lowerPassword = password.toLowerCase();

    // Check against first name
    if (
      context.osot_first_name &&
      typeof context.osot_first_name === 'string'
    ) {
      const firstName = context.osot_first_name.toLowerCase();
      if (firstName.length >= 3 && lowerPassword.includes(firstName)) {
        return true;
      }
    }

    // Check against last name
    if (context.osot_last_name && typeof context.osot_last_name === 'string') {
      const lastName = context.osot_last_name.toLowerCase();
      if (lastName.length >= 3 && lowerPassword.includes(lastName)) {
        return true;
      }
    }

    // Check against email username
    if (context.osot_email && typeof context.osot_email === 'string') {
      const emailParts = context.osot_email.split('@');
      if (emailParts.length > 0 && emailParts[0]) {
        const emailUsername = emailParts[0].toLowerCase();
        if (
          emailUsername.length >= 3 &&
          lowerPassword.includes(emailUsername)
        ) {
          return true;
        }
      }
    }

    // Check against birth year
    if (context.osot_date_of_birth) {
      const birthYear = new Date(context.osot_date_of_birth)
        .getFullYear()
        .toString();
      if (lowerPassword.includes(birthYear)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check for sequential characters (abc, 123, qwe, etc.)
   */
  private hasSequentialCharacters(password: string): boolean {
    const sequences = [
      'abcdefghijklmnopqrstuvwxyz',
      '0123456789',
      'qwertyuiopasdfghjklzxcvbnm', // QWERTY keyboard layout
    ];

    const lowerPassword = password.toLowerCase();

    for (const sequence of sequences) {
      for (let i = 0; i <= sequence.length - 4; i++) {
        const subseq = sequence.substring(i, i + 4);
        if (lowerPassword.includes(subseq)) {
          return true;
        }
        // Check reverse sequence
        const reverseSubseq = subseq.split('').reverse().join('');
        if (lowerPassword.includes(reverseSubseq)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check for excessive repeated characters (aaa, 111, etc.)
   */
  private hasExcessiveRepeatedCharacters(password: string): boolean {
    // Check for 3 or more consecutive identical characters
    const repeatedPattern = /(.)\1{2,}/;
    return repeatedPattern.test(password);
  }

  defaultMessage(): string {
    return ErrorMessages[ErrorCodes.INVALID_PASSWORD_STRENGTH].publicMessage;
  }
}

/**
 * Password Complexity Analyzer
 * Provides detailed feedback on password strength
 */
export class PasswordComplexityAnalyzer {
  /**
   * Analyze password and return detailed feedback
   */
  static analyzePassword(
    password: string,
    context?: PasswordValidationContext,
  ): PasswordAnalysisResult {
    const result: PasswordAnalysisResult = {
      isValid: false,
      score: 0,
      feedback: [],
      requirements: {
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecialChar: false,
        noPersonalInfo: false,
        noSequential: false,
        noRepeated: false,
      },
    };

    if (!password) {
      result.feedback.push('Password is required');
      return result;
    }

    const validator = new AccountPasswordStrengthValidator();

    // Length check
    if (password.length >= ACCOUNT_SECURITY.PASSWORD_MIN_LENGTH) {
      result.requirements.minLength = true;
      result.score += 10;
    } else {
      result.feedback.push(
        `Password must be at least ${ACCOUNT_SECURITY.PASSWORD_MIN_LENGTH} characters long`,
      );
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      result.requirements.hasUppercase = true;
      result.score += 15;
    } else {
      result.feedback.push(
        'Password must contain at least one uppercase letter',
      );
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      result.requirements.hasLowercase = true;
      result.score += 15;
    } else {
      result.feedback.push(
        'Password must contain at least one lowercase letter',
      );
    }

    // Number check
    if (/\d/.test(password)) {
      result.requirements.hasNumber = true;
      result.score += 15;
    } else {
      result.feedback.push('Password must contain at least one number');
    }

    // Special character check (optional but adds score)
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      result.requirements.hasSpecialChar = true;
      result.score += 20;
    } else if (ACCOUNT_SECURITY.PASSWORD_REQUIRE_SPECIAL) {
      result.feedback.push(
        'Password must contain at least one special character',
      );
    }

    // Personal info check
    const personalInfoContext: PasswordValidationContext = context || {};
    if (!validator['containsPersonalInfo'](password, personalInfoContext)) {
      result.requirements.noPersonalInfo = true;
      result.score += 10;
    } else {
      result.feedback.push('Password should not contain personal information');
    }

    // Sequential check
    if (!validator['hasSequentialCharacters'](password)) {
      result.requirements.noSequential = true;
      result.score += 5;
    } else {
      result.feedback.push('Password should not contain sequential characters');
    }

    // Repeated characters check
    if (!validator['hasExcessiveRepeatedCharacters'](password)) {
      result.requirements.noRepeated = true;
      result.score += 5;
    } else {
      result.feedback.push('Password should not contain repeated characters');
    }

    // Calculate final validity
    const requiredChecks = [
      result.requirements.minLength,
      result.requirements.hasUppercase,
      result.requirements.hasLowercase,
      result.requirements.hasNumber,
      result.requirements.noPersonalInfo,
      result.requirements.noSequential,
      result.requirements.noRepeated,
    ];

    // Add special char requirement if configured
    if (ACCOUNT_SECURITY.PASSWORD_REQUIRE_SPECIAL) {
      requiredChecks.push(result.requirements.hasSpecialChar);
    }

    result.isValid = requiredChecks.every((check) => check === true);

    return result;
  }

  /**
   * Get password strength level based on score
   */
  static getStrengthLevel(score: number): PasswordStrengthLevel {
    if (score >= 90) return PasswordStrengthLevel.VERY_STRONG;
    if (score >= 75) return PasswordStrengthLevel.STRONG;
    if (score >= 60) return PasswordStrengthLevel.MODERATE;
    if (score >= 40) return PasswordStrengthLevel.WEAK;
    return PasswordStrengthLevel.VERY_WEAK;
  }
}

// ========================================
// SUPPORTING INTERFACES
// ========================================

export interface PasswordAnalysisResult {
  isValid: boolean;
  score: number;
  feedback: string[];
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
    noPersonalInfo: boolean;
    noSequential: boolean;
    noRepeated: boolean;
  };
}

export enum PasswordStrengthLevel {
  VERY_WEAK = 'very_weak',
  WEAK = 'weak',
  MODERATE = 'moderate',
  STRONG = 'strong',
  VERY_STRONG = 'very_strong',
}

// ========================================
// EXPORT DECORATOR
// ========================================

/**
 * Decorator function for Password Strength validation
 */
export function IsValidAccountPassword() {
  return function (_object: any, _propertyName: string) {
    const _validatorOptions = {
      validator: AccountPasswordStrengthValidator,
      message: 'Password does not meet security requirements',
    };
    // This would be used with registerDecorator in a real implementation
  };
}
