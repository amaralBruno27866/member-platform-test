import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { CreateAccountDto } from '../dtos/create-account.dto';
import { UpdateAccountDto } from '../dtos/update-account.dto';
import { AccountResponseDto } from '../dtos/account-response.dto';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { AccountCrudService } from './account-crud.service';
import { AccountLookupService } from './account-lookup.service';
import { AccountBusinessRules } from '../rules/account-business-rules';
import { AccountGroup, Privilege } from '../../../../common/enums';
import {
  canCreate,
  canRead,
  canWrite,
} from '../../../../utils/dataverse-app.helper';

/**
 * Account Business Rules Service (ENTERPRISE)
 *
 * MODERNIZED ARCHITECTURE INTEGRATION:
 * - Business Rule Framework: Centralized validation and business logic enforcement
 * - Service Orchestration: Combines CRUD + Lookup services for comprehensive operations
 * - Structured Logging: Operation IDs, security-aware logging with PII redaction
 * - Security-First Design: Privilege-based access control and anti-fraud protection
 * - Error Management: Centralized error handling with createAppError and detailed context
 * - Canadian Standards: Account validation following Canadian business requirements
 *
 * PERMISSION SYSTEM (Multi-App based):
 * - MAIN: Full access to all business rule operations and validation
 * - OWNER: Full access to validation with comprehensive business rule enforcement
 * - ADMIN: Access to validation with limited modification permissions
 * - Business rules enforce data integrity and anti-fraud protection regardless of privilege level
 *
 * ENTERPRISE FEATURES:
 * - Operation tracking with unique IDs for comprehensive audit trails
 * - Email uniqueness validation with anti-fraud protection
 * - Person uniqueness validation (firstName + lastName + dateOfBirth)
 * - Password complexity enforcement with security standards
 * - Account status transition validation with business rule compliance
 * - Group membership validation with security and business logic checks
 * - Comprehensive business rule validation with detailed error reporting
 * - Security-aware logging with PII redaction capabilities
 * - Performance monitoring and validation analytics
 *
 * ANTI-FRAUD PROTECTION:
 * - Email uniqueness validation across all accounts
 * - Person uniqueness validation to prevent duplicate registrations
 * - Cross-reference validation using lookup services
 * - Comprehensive audit trails for regulatory compliance
 * - Business rule violation tracking with detailed context
 *
 * Key Features:
 * - Email uniqueness enforcement for account creation and updates
 * - Person uniqueness validation using comprehensive name + DOB matching
 * - Password complexity validation with Canadian security standards
 * - Business rule orchestration combining multiple validation layers
 * - Privilege-based validation with security audit trails
 * - Account lifecycle management with status transition validation
 * - Operation tracking for compliance, debugging, and analytics
 * - Structured logging with security-aware PII handling
 * - Service orchestration enabling complex business operations
 * - Integration with CRUD and Lookup services for complete validation
 */
@Injectable()
export class AccountBusinessRulesService {
  private readonly logger = new Logger(AccountBusinessRulesService.name);

  constructor(
    @Inject(forwardRef(() => AccountCrudService))
    private readonly accountCrudService: AccountCrudService,
    private readonly accountLookupService: AccountLookupService,
  ) {}

  /**
   * Convert userRole string to Privilege enum
   * Helper for privilege-based validation
   */
  private getUserPrivilegeFromRole(userRole?: string): Privilege {
    switch (userRole?.toLowerCase()) {
      case 'main':
        return Privilege.MAIN;
      case 'admin':
        return Privilege.ADMIN;
      case 'owner':
      default:
        return Privilege.OWNER;
    }
  }

  /**
   * Validate if user has privilege to create account with specific group
   * STAFF group (4) can only be created by ADMIN (2) or MAIN (3)
   *
   * @param accountGroup - Account group to validate
   * @param userRole - User role (main, admin, owner)
   * @returns Validation result with error message if invalid
   */
  validateAccountGroupPrivilege(
    accountGroup: number,
    userRole?: string,
  ): { isValid: boolean; error?: string } {
    const operationId = `validate_account_group_privilege_${Date.now()}`;
    const privilege = this.getUserPrivilegeFromRole(userRole);

    this.logger.debug(
      `Validating account group privilege - Operation: ${operationId}`,
      {
        operation: 'validateAccountGroupPrivilege',
        operationId,
        accountGroup,
        privilege,
        userRole,
        timestamp: new Date().toISOString(),
      },
    );

    // STAFF group (4) requires ADMIN (2) or MAIN (3) privilege
    if (accountGroup === 4 && privilege < Privilege.ADMIN) {
      this.logger.warn(
        `Account group privilege validation failed - STAFF group requires ADMIN or MAIN privilege - Operation: ${operationId}`,
        {
          operation: 'validateAccountGroupPrivilege',
          operationId,
          accountGroup,
          privilege,
          requiredPrivilege: Privilege.ADMIN,
          timestamp: new Date().toISOString(),
        },
      );

      return {
        isValid: false,
        error:
          'Only ADMIN or MAIN privilege can create STAFF accounts. Your privilege level is insufficient.',
      };
    }

    this.logger.debug(
      `Account group privilege validation passed - Operation: ${operationId}`,
      {
        operation: 'validateAccountGroupPrivilege',
        operationId,
        accountGroup,
        privilege,
        timestamp: new Date().toISOString(),
      },
    );

    return { isValid: true };
  }

  /**
   * Validate email uniqueness with comprehensive logging and anti-fraud protection
   * Uses AccountLookupService for real-time duplicate detection
   * Enhanced with operation tracking and security-aware logging
   */
  async validateEmailUniqueness(
    email: string,
    excludeAccountId?: string,
    userRole?: string,
  ): Promise<{ isValid: boolean; message?: string; existingEmail?: string }> {
    const operationId = `validate_email_uniqueness_${Date.now()}`;

    this.logger.log(
      `Starting email uniqueness validation - Operation: ${operationId}`,
      {
        operation: 'validateEmailUniqueness',
        operationId,
        userRole: userRole || 'undefined',
        emailDomain: email.split('@')[1] || 'unknown', // PII redaction
        hasExclusion: !!excludeAccountId,
        timestamp: new Date().toISOString(),
      },
    );

    if (!canRead(userRole || '')) {
      this.logger.warn(
        `Email uniqueness validation denied - insufficient privileges - Operation: ${operationId}`,
        {
          operation: 'validateEmailUniqueness',
          operationId,
          requiredPrivilege: 'READ',
          userRole: userRole || 'undefined',
          error: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Insufficient privileges to validate email uniqueness',
        operationId,
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'validateEmailUniqueness',
      });
    }

    try {
      // Use lookup service to check for duplicates
      const duplicateEmails =
        await this.accountLookupService.findDuplicateEmails(
          email,
          excludeAccountId,
        );

      const isValid = duplicateEmails.length === 0;
      const existingEmail =
        !isValid && duplicateEmails.length > 0
          ? duplicateEmails[0].osot_email
          : undefined;

      this.logger.log(
        `Email uniqueness validation completed - Operation: ${operationId}`,
        {
          operation: 'validateEmailUniqueness',
          operationId,
          isValid,
          duplicateCount: duplicateEmails.length,
          hasExistingEmail: !!existingEmail,
          timestamp: new Date().toISOString(),
        },
      );

      return {
        isValid,
        message: isValid
          ? undefined
          : 'Email address already exists in the system',
        existingEmail,
      };
    } catch (error) {
      this.logger.error(
        `Email uniqueness validation failed - Operation: ${operationId}`,
        {
          operation: 'validateEmailUniqueness',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to validate email uniqueness',
        operationId,
        operation: 'validateEmailUniqueness',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Validate person uniqueness with comprehensive logging and anti-fraud protection
   * Uses AccountLookupService for real-time duplicate detection
   * Checks firstName + lastName + dateOfBirth combination
   * Enhanced with operation tracking and security-aware logging
   */
  async validatePersonUniqueness(
    firstName: string,
    lastName: string,
    dateOfBirth: string,
    excludeAccountId?: string,
    userRole?: string,
  ): Promise<{ isValid: boolean; message?: string; existingEmail?: string }> {
    const operationId = `validate_person_uniqueness_${Date.now()}`;

    this.logger.log(
      `Starting person uniqueness validation - Operation: ${operationId}`,
      {
        operation: 'validatePersonUniqueness',
        operationId,
        userRole: userRole || 'undefined',
        hasFirstName: !!firstName,
        hasLastName: !!lastName,
        hasDateOfBirth: !!dateOfBirth,
        hasExclusion: !!excludeAccountId,
        timestamp: new Date().toISOString(),
      },
    );

    if (!canRead(userRole || '')) {
      this.logger.warn(
        `Person uniqueness validation denied - insufficient privileges - Operation: ${operationId}`,
        {
          operation: 'validatePersonUniqueness',
          operationId,
          requiredPrivilege: 'READ',
          userRole: userRole || 'undefined',
          error: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Insufficient privileges to validate person uniqueness',
        operationId,
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'validatePersonUniqueness',
      });
    }

    try {
      // Use lookup service to check for duplicates
      const duplicatePersons =
        await this.accountLookupService.findDuplicatePersons(
          firstName,
          lastName,
          dateOfBirth,
          excludeAccountId,
        );

      const isValid = duplicatePersons.length === 0;
      const existingEmail =
        !isValid && duplicatePersons.length > 0
          ? duplicatePersons[0].email
          : undefined;

      this.logger.log(
        `Person uniqueness validation completed - Operation: ${operationId}`,
        {
          operation: 'validatePersonUniqueness',
          operationId,
          isValid,
          duplicateCount: duplicatePersons.length,
          hasExistingEmail: !!existingEmail,
          timestamp: new Date().toISOString(),
        },
      );

      return {
        isValid,
        message: isValid
          ? undefined
          : 'A person with the same name and date of birth already exists in the system',
        existingEmail,
      };
    } catch (error) {
      this.logger.error(
        `Person uniqueness validation failed - Operation: ${operationId}`,
        {
          operation: 'validatePersonUniqueness',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to validate person uniqueness',
        operationId,
        operation: 'validatePersonUniqueness',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Validate password complexity with enhanced logging
   * DELEGATES TO AccountBusinessRules.validatePasswordComplexity - Single source of truth
   * Enhanced with operation tracking and comprehensive logging
   */
  validatePasswordComplexity(
    password: string,
    userRole?: string,
  ): { isValid: boolean; message?: string } {
    const operationId = `validate_password_complexity_${Date.now()}`;

    this.logger.log(
      `Starting password complexity validation - Operation: ${operationId}`,
      {
        operation: 'validatePasswordComplexity',
        operationId,
        userRole: userRole || 'undefined',
        passwordLength: password.length,
        timestamp: new Date().toISOString(),
      },
    );

    if (!canRead(userRole || '')) {
      this.logger.warn(
        `Password complexity validation denied - insufficient privileges - Operation: ${operationId}`,
        {
          operation: 'validatePasswordComplexity',
          operationId,
          requiredPrivilege: 'READ',
          userRole: userRole || 'undefined',
          error: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Insufficient privileges to validate password complexity',
        operationId,
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'validatePasswordComplexity',
      });
    }

    try {
      // Delegate to business rules class
      const validation =
        AccountBusinessRules.validatePasswordComplexity(password);

      this.logger.log(
        `Password complexity validation completed - Operation: ${operationId}`,
        {
          operation: 'validatePasswordComplexity',
          operationId,
          isValid: validation.isValid,
          timestamp: new Date().toISOString(),
        },
      );

      return validation;
    } catch (error) {
      this.logger.error(
        `Password complexity validation failed - Operation: ${operationId}`,
        {
          operation: 'validatePasswordComplexity',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to validate password complexity',
        operationId,
        operation: 'validatePasswordComplexity',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Validate complete account creation with comprehensive business rules
   * Orchestrates multiple validation layers using CRUD and Lookup services
   * Enhanced with operation tracking and detailed error reporting
   */
  async validateAccountCreation(
    createAccountDto: CreateAccountDto,
    userRole?: string,
  ): Promise<{ isValid: boolean; violations: string[] }> {
    const operationId = `validate_account_creation_${Date.now()}`;
    const violations: string[] = [];

    this.logger.log(
      `Starting account creation validation - Operation: ${operationId}`,
      {
        operation: 'validateAccountCreation',
        operationId,
        userRole: userRole || 'undefined',
        timestamp: new Date().toISOString(),
      },
    );

    if (!canCreate(userRole)) {
      this.logger.warn(
        `Account creation validation denied - insufficient privileges - Operation: ${operationId}`,
        {
          operation: 'validateAccountCreation',
          operationId,
          requiredPrivilege: 'CREATE',
          userRole: userRole || 'undefined',
          error: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Insufficient privileges to validate account creation',
        operationId,
        requiredPrivilege: 'CREATE',
        userRole: userRole || 'undefined',
        operation: 'validateAccountCreation',
      });
    }

    try {
      // 1. Validate STAFF account group restrictions
      // STAFF can only be created by MAIN or ADMIN privilege users
      if (createAccountDto.osot_account_group === AccountGroup.STAFF) {
        const userPrivilege = this.getUserPrivilegeFromRole(userRole);
        if (
          userPrivilege !== Privilege.MAIN &&
          userPrivilege !== Privilege.ADMIN
        ) {
          violations.push('Only MAIN or ADMIN users can create STAFF accounts');
          this.logger.warn(
            `STAFF account creation attempted by non-privileged user - Operation: ${operationId}`,
            {
              operation: 'validateAccountCreation',
              operationId,
              userRole: userRole || 'undefined',
              accountGroup: 'STAFF',
              timestamp: new Date().toISOString(),
            },
          );
        }
      }

      // 2. Validate email uniqueness
      const emailValidation = await this.validateEmailUniqueness(
        createAccountDto.osot_email,
        undefined,
        userRole,
      );
      if (!emailValidation.isValid) {
        violations.push(emailValidation.message || 'Email validation failed');
      }

      // 3. Validate person uniqueness
      const personValidation = await this.validatePersonUniqueness(
        createAccountDto.osot_first_name,
        createAccountDto.osot_last_name,
        createAccountDto.osot_date_of_birth,
        undefined,
        userRole,
      );
      if (!personValidation.isValid) {
        violations.push(personValidation.message || 'Person validation failed');
      }

      // 3. Validate password complexity
      const passwordValidation = this.validatePasswordComplexity(
        createAccountDto.osot_password,
        userRole,
      );
      if (!passwordValidation.isValid) {
        violations.push(
          passwordValidation.message || 'Password validation failed',
        );
      }

      // 4. Validate other business rules using AccountBusinessRules
      const businessRulesValidation =
        AccountBusinessRules.validateAccountCreation(
          createAccountDto,
          [], // Empty existing emails - we already validated above
          [], // Empty existing persons - we already validated above
        );
      violations.push(...businessRulesValidation.violations);

      const isValid = violations.length === 0;

      this.logger.log(
        `Account creation validation completed - Operation: ${operationId}`,
        {
          operation: 'validateAccountCreation',
          operationId,
          isValid,
          violationCount: violations.length,
          timestamp: new Date().toISOString(),
        },
      );

      return { isValid, violations };
    } catch (error) {
      this.logger.error(
        `Account creation validation failed - Operation: ${operationId}`,
        {
          operation: 'validateAccountCreation',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      );

      // Re-throw if it's already an AppError
      if (error instanceof Error && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to validate account creation',
        operationId,
        operation: 'validateAccountCreation',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Validate complete account update with comprehensive business rules
   * Orchestrates multiple validation layers using CRUD and Lookup services
   * Enhanced with operation tracking and detailed error reporting
   */
  async validateAccountUpdate(
    updateAccountDto: UpdateAccountDto,
    accountId: string,
    userRole?: string,
  ): Promise<{ isValid: boolean; violations: string[] }> {
    const operationId = `validate_account_update_${Date.now()}`;
    const violations: string[] = [];

    this.logger.log(
      `Starting account update validation - Operation: ${operationId}`,
      {
        operation: 'validateAccountUpdate',
        operationId,
        userRole: userRole || 'undefined',
        accountId: accountId.substring(0, 8) + '...', // PII redaction
        timestamp: new Date().toISOString(),
      },
    );

    if (!canWrite(userRole || '')) {
      this.logger.warn(
        `Account update validation denied - insufficient privileges - Operation: ${operationId}`,
        {
          operation: 'validateAccountUpdate',
          operationId,
          requiredPrivilege: 'WRITE',
          userRole: userRole || 'undefined',
          error: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        },
      );

      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Insufficient privileges to validate account update',
        operationId,
        requiredPrivilege: 'WRITE',
        userRole: userRole || 'undefined',
        operation: 'validateAccountUpdate',
      });
    }

    try {
      // 1. Validate email uniqueness (if email is being updated)
      if (updateAccountDto.osot_email) {
        const emailValidation = await this.validateEmailUniqueness(
          updateAccountDto.osot_email,
          accountId,
          userRole,
        );
        if (!emailValidation.isValid) {
          violations.push(emailValidation.message || 'Email validation failed');
        }
      }

      // 2. Validate person uniqueness (if name or DOB is being updated)
      if (
        updateAccountDto.osot_first_name ||
        updateAccountDto.osot_last_name ||
        updateAccountDto.osot_date_of_birth
      ) {
        // Get current account to fill missing fields
        const currentAccount = await this.accountCrudService.findById(
          accountId,
          userRole,
        );
        if (currentAccount) {
          const personValidation = await this.validatePersonUniqueness(
            updateAccountDto.osot_first_name || currentAccount.osot_first_name,
            updateAccountDto.osot_last_name || currentAccount.osot_last_name,
            updateAccountDto.osot_date_of_birth ||
              currentAccount.osot_date_of_birth,
            accountId,
            userRole,
          );
          if (!personValidation.isValid) {
            violations.push(
              personValidation.message || 'Person validation failed',
            );
          }
        }
      }

      // 3. Validate password complexity (if password is being updated)
      if (updateAccountDto.osot_password) {
        const passwordValidation = this.validatePasswordComplexity(
          updateAccountDto.osot_password,
          userRole,
        );
        if (!passwordValidation.isValid) {
          violations.push(
            passwordValidation.message || 'Password validation failed',
          );
        }
      }

      // 4. Validate other business rules using AccountBusinessRules
      const businessRulesValidation =
        AccountBusinessRules.validateAccountUpdate(
          updateAccountDto,
          accountId,
          [], // Empty existing emails - we already validated above
          [], // Empty existing persons - we already validated above
        );
      violations.push(...businessRulesValidation.violations);

      const isValid = violations.length === 0;

      this.logger.log(
        `Account update validation completed - Operation: ${operationId}`,
        {
          operation: 'validateAccountUpdate',
          operationId,
          isValid,
          violationCount: violations.length,
          timestamp: new Date().toISOString(),
        },
      );

      return { isValid, violations };
    } catch (error) {
      this.logger.error(
        `Account update validation failed - Operation: ${operationId}`,
        {
          operation: 'validateAccountUpdate',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      );

      // Re-throw if it's already an AppError
      if (error instanceof Error && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to validate account update',
        operationId,
        operation: 'validateAccountUpdate',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Create account with enhanced business rule validation
   * Orchestrates validation + CRUD operations for complete account creation
   * Enhanced with comprehensive logging and error handling
   *
   * @param createAccountDto - Account creation data
   * @param organizationGuid - Organization GUID for multi-tenant isolation (optional)
   * @param userRole - User role for permission checking
   */
  async createAccountWithValidation(
    createAccountDto: CreateAccountDto,
    organizationGuid?: string,
    userRole?: string,
  ): Promise<AccountResponseDto | null> {
    const operationId = `create_account_with_validation_${Date.now()}`;

    this.logger.log(
      `Starting account creation with validation - Operation: ${operationId}`,
      {
        operation: 'createAccountWithValidation',
        operationId,
        userRole: userRole || 'undefined',
        hasOrganization: !!organizationGuid,
        timestamp: new Date().toISOString(),
      },
    );

    try {
      // Validate business rules
      const validation = await this.validateAccountCreation(
        createAccountDto,
        userRole,
      );

      if (!validation.isValid) {
        this.logger.warn(
          `Account creation validation failed - Operation: ${operationId}`,
          {
            operation: 'createAccountWithValidation',
            operationId,
            violations: validation.violations,
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
          message: `Account creation validation failed: ${validation.violations.join(', ')}`,
          operationId,
          violations: validation.violations,
          operation: 'createAccountWithValidation',
        });
      }

      // Create account using CRUD service with organization context
      const createdAccount = await this.accountCrudService.create(
        createAccountDto,
        organizationGuid,
        userRole,
      );

      this.logger.log(
        `Account created with validation - Operation: ${operationId}`,
        {
          operation: 'createAccountWithValidation',
          operationId,
          accountId: createdAccount?.osot_table_accountid,
          timestamp: new Date().toISOString(),
        },
      );

      return createdAccount;
    } catch (error) {
      this.logger.error(
        `Account creation with validation failed - Operation: ${operationId}`,
        {
          operation: 'createAccountWithValidation',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      );

      // Re-throw if it's already an AppError
      if (error instanceof Error && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to create account with validation',
        operationId,
        operation: 'createAccountWithValidation',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update account with enhanced business rule validation
   * Orchestrates validation + CRUD operations for complete account update
   * Enhanced with comprehensive logging and error handling
   */
  async updateAccountWithValidation(
    accountId: string,
    updateAccountDto: UpdateAccountDto,
    userRole?: string,
  ): Promise<AccountResponseDto | null> {
    const operationId = `update_account_with_validation_${Date.now()}`;

    this.logger.log(
      `Starting account update with validation - Operation: ${operationId}`,
      {
        operation: 'updateAccountWithValidation',
        operationId,
        userRole: userRole || 'undefined',
        accountId: accountId.substring(0, 8) + '...', // PII redaction
        timestamp: new Date().toISOString(),
      },
    );

    try {
      // Validate business rules
      const validation = await this.validateAccountUpdate(
        updateAccountDto,
        accountId,
        userRole,
      );

      if (!validation.isValid) {
        this.logger.warn(
          `Account update validation failed - Operation: ${operationId}`,
          {
            operation: 'updateAccountWithValidation',
            operationId,
            violations: validation.violations,
            timestamp: new Date().toISOString(),
          },
        );

        throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
          message: `Account update validation failed: ${validation.violations.join(', ')}`,
          operationId,
          violations: validation.violations,
          operation: 'updateAccountWithValidation',
        });
      }

      // Update account using CRUD service
      const updatedAccount = await this.accountCrudService.update(
        accountId,
        updateAccountDto,
        userRole,
      );

      this.logger.log(
        `Account updated with validation - Operation: ${operationId}`,
        {
          operation: 'updateAccountWithValidation',
          operationId,
          accountId: accountId.substring(0, 8) + '...',
          timestamp: new Date().toISOString(),
        },
      );

      return updatedAccount;
    } catch (error) {
      this.logger.error(
        `Account update with validation failed - Operation: ${operationId}`,
        {
          operation: 'updateAccountWithValidation',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      );

      // Re-throw if it's already an AppError
      if (error instanceof Error && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to update account with validation',
        operationId,
        operation: 'updateAccountWithValidation',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
