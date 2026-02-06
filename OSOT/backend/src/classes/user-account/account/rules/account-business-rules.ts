/**
 * Account Business Rules (PURE VALIDATION LOGIC)
 *
 * CLEAR ARCHITECTURAL SEPARATION:
 * - rules: Business validation logic ONLY
 * - utils: Helper functions and utilities ONLY
 * - validators: DTO format validation ONLY
 * - services: Enterprise orchestration ONLY
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes for business rule violations
 * - enums: Uses centralized enums for business logic
 * - interfaces: Uses account interfaces for type safety
 *
 * BUSINESS RULES PHILOSOPHY:
 * - Essential account business rules validation
 * - Clear constraint validation with detailed error messages
 * - Account relationship management validation
 * - Canadian account business logic validation
 * - Anti-fraud protection through uniqueness validation
 * - NO helper functions (those go in utils/)
 * - NO DTO validation (those go in validators/)
 */

import {
  AccountGroup,
  AccountStatus,
  Privilege,
} from '../../../../common/enums';
import type { CreateAccountDto } from '../dtos/create-account.dto';
import type { UpdateAccountDto } from '../dtos/update-account.dto';

/**
 * Account Business Rules Validator
 * PURE VALIDATION LOGIC - No helpers, no transformations
 */
export class AccountBusinessRules {
  // ========================================
  // EMAIL UNIQUENESS VALIDATION
  // ========================================

  /**
   * Validate email uniqueness for account creation
   * @param email Email to validate
   * @param existingEmails Array of existing emails in database
   * @returns Validation result
   */
  static validateEmailUniquenessForCreate(
    email: string,
    existingEmails: string[],
  ): { isValid: boolean; message?: string } {
    const normalizedEmail = email.toLowerCase().trim();

    if (
      existingEmails.some(
        (existingEmail) =>
          existingEmail.toLowerCase().trim() === normalizedEmail,
      )
    ) {
      return {
        isValid: false,
        message: 'Email address is already registered in the system',
      };
    }

    return { isValid: true };
  }

  /**
   * Validate email uniqueness for account update
   * @param email New email to validate
   * @param currentAccountId ID of account being updated
   * @param existingEmails Array of existing emails with account IDs
   * @returns Validation result
   */
  static validateEmailUniquenessForUpdate(
    email: string,
    currentAccountId: string,
    existingEmails: { email: string; accountId: string }[],
  ): { isValid: boolean; message?: string } {
    const normalizedEmail = email.toLowerCase().trim();

    const conflictingAccount = existingEmails.find(
      (existing) =>
        existing.email.toLowerCase().trim() === normalizedEmail &&
        existing.accountId !== currentAccountId,
    );

    if (conflictingAccount) {
      return {
        isValid: false,
        message: 'Email address is already registered to another account',
      };
    }

    return { isValid: true };
  }

  // ========================================
  // PERSON UNIQUENESS VALIDATION (ANTI-FRAUD)
  // ========================================

  /**
   * Validate person uniqueness based on first name, last name, and date of birth
   * This prevents users from creating multiple accounts with slight name variations
   * @param firstName First name to validate
   * @param lastName Last name to validate
   * @param dateOfBirth Date of birth to validate
   * @param existingPersons Array of existing person combinations
   * @returns Validation result
   */
  static validatePersonUniquenessForCreate(
    firstName: string,
    lastName: string,
    dateOfBirth: string,
    existingPersons: {
      firstName: string;
      lastName: string;
      dateOfBirth: string;
    }[],
  ): { isValid: boolean; message?: string } {
    const normalizedFirstName = firstName.toLowerCase().trim();
    const normalizedLastName = lastName.toLowerCase().trim();
    const normalizedDateOfBirth = dateOfBirth.trim();

    const duplicatePerson = existingPersons.find(
      (existing) =>
        existing.firstName.toLowerCase().trim() === normalizedFirstName &&
        existing.lastName.toLowerCase().trim() === normalizedLastName &&
        existing.dateOfBirth.trim() === normalizedDateOfBirth,
    );

    if (duplicatePerson) {
      return {
        isValid: false,
        message:
          'An account with this name and date of birth already exists. Please contact support if you believe this is an error.',
      };
    }

    return { isValid: true };
  }

  /**
   * Validate person uniqueness for account update
   * @param firstName New first name
   * @param lastName New last name
   * @param dateOfBirth New date of birth
   * @param currentAccountId ID of account being updated
   * @param existingPersons Array of existing person combinations with account IDs
   * @returns Validation result
   */
  static validatePersonUniquenessForUpdate(
    firstName: string,
    lastName: string,
    dateOfBirth: string,
    currentAccountId: string,
    existingPersons: {
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      accountId: string;
    }[],
  ): { isValid: boolean; message?: string } {
    const normalizedFirstName = firstName.toLowerCase().trim();
    const normalizedLastName = lastName.toLowerCase().trim();
    const normalizedDateOfBirth = dateOfBirth.trim();

    const conflictingPerson = existingPersons.find(
      (existing) =>
        existing.firstName.toLowerCase().trim() === normalizedFirstName &&
        existing.lastName.toLowerCase().trim() === normalizedLastName &&
        existing.dateOfBirth.trim() === normalizedDateOfBirth &&
        existing.accountId !== currentAccountId,
    );

    if (conflictingPerson) {
      return {
        isValid: false,
        message:
          'Another account with this name and date of birth already exists. Please contact support if you believe this is an error.',
      };
    }

    return { isValid: true };
  }

  // ========================================
  // PASSWORD VALIDATION
  // ========================================

  /**
   * Validate password complexity requirements
   * @param password Password to validate
   * @returns Validation result
   */
  static validatePasswordComplexity(password: string): {
    isValid: boolean;
    message?: string;
  } {
    if (!password || password.length < 8) {
      return {
        isValid: false,
        message: 'Password must be at least 8 characters long',
      };
    }

    if (!/[A-Z]/.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain at least one uppercase letter',
      };
    }

    if (!/[a-z]/.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain at least one lowercase letter',
      };
    }

    if (!/[0-9]/.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain at least one number',
      };
    }

    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain at least one special character',
      };
    }

    return { isValid: true };
  }

  // ========================================
  // ACCOUNT STATUS VALIDATION
  // ========================================

  /**
   * Validate account status transitions
   * @param currentStatus Current account status
   * @param newStatus New account status
   * @returns Validation result
   */
  static validateStatusTransition(
    currentStatus: AccountStatus,
    newStatus: AccountStatus,
  ): { isValid: boolean; message?: string } {
    // Define allowed transitions
    const allowedTransitions: Record<AccountStatus, AccountStatus[]> = {
      [AccountStatus.PENDING]: [AccountStatus.ACTIVE, AccountStatus.INACTIVE],
      [AccountStatus.ACTIVE]: [AccountStatus.INACTIVE],
      [AccountStatus.INACTIVE]: [AccountStatus.ACTIVE],
    };

    if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
      return {
        isValid: false,
        message: `Invalid status transition from ${AccountStatus[currentStatus]} to ${AccountStatus[newStatus]}`,
      };
    }

    return { isValid: true };
  }

  // ========================================
  // ACCOUNT GROUP VALIDATION
  // ========================================

  /**
   * Validate account group assignment
   * @param accountGroup Account group to validate
   * @returns Validation result
   */
  static validateAccountGroup(accountGroup: AccountGroup): {
    isValid: boolean;
    message?: string;
  } {
    if (!Object.values(AccountGroup).includes(accountGroup)) {
      return {
        isValid: false,
        message: 'Invalid account group specified',
      };
    }

    return { isValid: true };
  }

  /**
   * Validate account group change permissions
   * @param currentGroup Current account group
   * @param newGroup New account group
   * @param userRole Role of user making the change
   * @returns Validation result
   */
  static validateAccountGroupChange(
    currentGroup: AccountGroup,
    newGroup: AccountGroup,
    userRole: Privilege,
  ): { isValid: boolean; message?: string } {
    // Only admin users can change to OCCUPATIONAL_THERAPIST or OCCUPATIONAL_THERAPIST_ASSISTANT
    if (
      (newGroup === AccountGroup.OCCUPATIONAL_THERAPIST ||
        newGroup === AccountGroup.OCCUPATIONAL_THERAPIST_ASSISTANT) &&
      userRole !== Privilege.MAIN // Assuming MAIN is admin level
    ) {
      return {
        isValid: false,
        message: 'Only administrators can assign professional account groups',
      };
    }

    return { isValid: true };
  }

  // ========================================
  // ACCOUNT DECLARATION VALIDATION
  // ========================================

  /**
   * Validate account declaration requirement
   * @param accountDeclaration Declaration status
   * @returns Validation result
   */
  static validateAccountDeclaration(accountDeclaration: boolean): {
    isValid: boolean;
    message?: string;
  } {
    if (!accountDeclaration) {
      return {
        isValid: false,
        message: 'Account declaration must be accepted to create an account',
      };
    }

    return { isValid: true };
  }

  // ========================================
  // DATE OF BIRTH VALIDATION
  // ========================================

  /**
   * Validate date of birth business rules
   * @param dateOfBirth Date of birth string (YYYY-MM-DD)
   * @returns Validation result
   */
  static validateDateOfBirth(dateOfBirth: string): {
    isValid: boolean;
    message?: string;
  } {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();

    // Must be in the past
    if (birthDate >= today) {
      return {
        isValid: false,
        message: 'Date of birth must be in the past',
      };
    }

    // Must be at least 13 years old (COPPA compliance)
    const minAge = 13;
    const minBirthDate = new Date();
    minBirthDate.setFullYear(today.getFullYear() - minAge);

    if (birthDate > minBirthDate) {
      return {
        isValid: false,
        message: `User must be at least ${minAge} years old`,
      };
    }

    // Must be reasonable (not more than 120 years old)
    const maxAge = 120;
    const maxBirthDate = new Date();
    maxBirthDate.setFullYear(today.getFullYear() - maxAge);

    if (birthDate < maxBirthDate) {
      return {
        isValid: false,
        message: 'Please enter a valid date of birth',
      };
    }

    return { isValid: true };
  }

  // ========================================
  // COMPREHENSIVE VALIDATION METHODS
  // ========================================

  /**
   * Validate all business rules for account creation
   * @param createDto Create account DTO
   * @param existingEmails Array of existing emails
   * @param existingPersons Array of existing person combinations
   * @returns Validation result with all violations
   */
  static validateAccountCreation(
    createDto: CreateAccountDto,
    existingEmails: string[],
    existingPersons: {
      firstName: string;
      lastName: string;
      dateOfBirth: string;
    }[],
  ): { isValid: boolean; violations: string[] } {
    const violations: string[] = [];

    // Email uniqueness
    const emailValidation = this.validateEmailUniquenessForCreate(
      createDto.osot_email,
      existingEmails,
    );
    if (!emailValidation.isValid) {
      violations.push(emailValidation.message);
    }

    // Person uniqueness
    const personValidation = this.validatePersonUniquenessForCreate(
      createDto.osot_first_name,
      createDto.osot_last_name,
      createDto.osot_date_of_birth,
      existingPersons,
    );
    if (!personValidation.isValid) {
      violations.push(personValidation.message);
    }

    // Password complexity
    const passwordValidation = this.validatePasswordComplexity(
      createDto.osot_password,
    );
    if (!passwordValidation.isValid) {
      violations.push(passwordValidation.message);
    }

    // Account group
    const groupValidation = this.validateAccountGroup(
      createDto.osot_account_group,
    );
    if (!groupValidation.isValid) {
      violations.push(groupValidation.message);
    }

    // Account declaration
    const declarationValidation = this.validateAccountDeclaration(
      createDto.osot_account_declaration,
    );
    if (!declarationValidation.isValid) {
      violations.push(declarationValidation.message);
    }

    // Date of birth
    const dobValidation = this.validateDateOfBirth(
      createDto.osot_date_of_birth,
    );
    if (!dobValidation.isValid) {
      violations.push(dobValidation.message);
    }

    return {
      isValid: violations.length === 0,
      violations,
    };
  }

  /**
   * Validate all business rules for account update
   * @param updateDto Update account DTO
   * @param currentAccountId ID of account being updated
   * @param existingEmails Array of existing emails with account IDs
   * @param existingPersons Array of existing person combinations with account IDs
   * @param currentStatus Current account status (for status transitions)
   * @param userRole Role of user making the update
   * @returns Validation result with all violations
   */
  static validateAccountUpdate(
    updateDto: UpdateAccountDto,
    currentAccountId: string,
    existingEmails: { email: string; accountId: string }[],
    existingPersons: {
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      accountId: string;
    }[],
    currentStatus?: AccountStatus,
    userRole?: Privilege,
  ): { isValid: boolean; violations: string[] } {
    const violations: string[] = [];

    // Email uniqueness (if email is being updated)
    if (updateDto.osot_email !== undefined) {
      const emailValidation = this.validateEmailUniquenessForUpdate(
        updateDto.osot_email,
        currentAccountId,
        existingEmails,
      );
      if (!emailValidation.isValid) {
        violations.push(emailValidation.message);
      }
    }

    // Person uniqueness (if any personal data is being updated)
    if (
      updateDto.osot_first_name !== undefined ||
      updateDto.osot_last_name !== undefined ||
      updateDto.osot_date_of_birth !== undefined
    ) {
      // For person validation, we need all three fields
      // If any is missing from DTO, we'd need current values (handled in service)
      if (
        updateDto.osot_first_name &&
        updateDto.osot_last_name &&
        updateDto.osot_date_of_birth
      ) {
        const personValidation = this.validatePersonUniquenessForUpdate(
          updateDto.osot_first_name,
          updateDto.osot_last_name,
          updateDto.osot_date_of_birth,
          currentAccountId,
          existingPersons,
        );
        if (!personValidation.isValid) {
          violations.push(personValidation.message);
        }
      }
    }

    // Password complexity (if password is being updated)
    if (updateDto.osot_password !== undefined) {
      const passwordValidation = this.validatePasswordComplexity(
        updateDto.osot_password,
      );
      if (!passwordValidation.isValid) {
        violations.push(passwordValidation.message);
      }
    }

    // NOTE: Account status transition validation removed from DTO validation
    // System fields (osot_account_status, osot_privilege, etc.) are no longer
    // exposed in UpdateAccountDto for security reasons. Status transitions are
    // now handled through dedicated business logic methods via updateSystemFields()

    // Account group change (if group is being updated)
    if (updateDto.osot_account_group !== undefined && userRole !== undefined) {
      const groupValidation = this.validateAccountGroup(
        updateDto.osot_account_group,
      );
      if (!groupValidation.isValid) {
        violations.push(groupValidation.message);
      }
    }

    // Date of birth (if being updated)
    if (updateDto.osot_date_of_birth !== undefined) {
      const dobValidation = this.validateDateOfBirth(
        updateDto.osot_date_of_birth,
      );
      if (!dobValidation.isValid) {
        violations.push(dobValidation.message);
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
    };
  }
}
