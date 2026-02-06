import { Injectable, Logger, Inject } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { createAppError } from '../../common/errors/error.factory';
import { ErrorCodes } from '../../common/errors/error-codes';
import { AccountStatus } from '../../common/enums';
import { comparePassword } from '../../common/keys/password-hash.util';

// Repository Pattern
import {
  AccountRepository,
  ACCOUNT_REPOSITORY,
} from '../../classes/user-account/account/interfaces/account-repository.interface';
import { AccountInternal } from '../../classes/user-account/account/interfaces/account-internal.interface';

// Event System
import { AccountEventsService } from '../../classes/user-account/account/events/account.events';

/**
 * Account Authentication Service
 *
 * Simplified implementation focusing on core authentication for user accounts.
 * Provides secure authentication operations following enterprise patterns.
 *
 * @implements Repository Pattern for data access abstraction
 * @follows Enterprise security patterns with comprehensive validation
 * @version 1.0.0 - Initial Implementation
 */
@Injectable()
export class AccountAuthService {
  private readonly logger = new Logger(AccountAuthService.name);

  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepository,
    private readonly accountEvents: AccountEventsService,
    private readonly redisService: RedisService,
  ) {
    this.logger.log('AccountAuthService initialized with Repository Pattern');
  }

  /**
   * Validate and sanitize email input for account authentication
   */
  private validateAuthEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      throw createAppError(
        ErrorCodes.VALIDATION_ERROR,
        {
          field: 'email',
          message: 'Email is required for account authentication',
          operation: 'validateCredentials',
        },
        400,
      );
    }

    if (email.length < 5 || !email.includes('@') || !email.includes('.')) {
      throw createAppError(
        ErrorCodes.VALIDATION_ERROR,
        {
          field: 'email',
          message: 'Email format is invalid for account authentication',
          operation: 'validateCredentials',
        },
        400,
      );
    }

    return email.toLowerCase().trim();
  }

  /**
   * Validate password input for account authentication
   */
  private validateAuthPassword(password: string): string {
    if (!password || typeof password !== 'string') {
      throw createAppError(
        ErrorCodes.VALIDATION_ERROR,
        {
          field: 'password',
          message: 'Password is required for account authentication',
          operation: 'validateCredentials',
        },
        400,
      );
    }

    if (password.length < 8) {
      throw createAppError(
        ErrorCodes.VALIDATION_ERROR,
        {
          field: 'password',
          message: 'Password must be at least 8 characters',
          operation: 'validateCredentials',
        },
        400,
      );
    }

    return password;
  }

  /**
   * Safely extract field values from account data
   */
  private safeExtractField(
    data: AccountInternal | Record<string, unknown>,
    fieldName: string,
  ): string {
    const record = data as Record<string, unknown>;
    const rawValue = record[fieldName];

    if (typeof rawValue === 'string') {
      return rawValue;
    }

    if (typeof rawValue === 'number' || typeof rawValue === 'boolean') {
      return String(rawValue);
    }

    return '';
  }

  /**
   * Validate account status
   */
  private validateAccountStatus(
    accountData: AccountInternal | Record<string, unknown>,
  ): void {
    const record = accountData as Record<string, unknown>;
    const statusRaw = record['osot_account_status'];
    const status =
      typeof statusRaw === 'number'
        ? (statusRaw as AccountStatus)
        : AccountStatus.INACTIVE;

    if (status !== AccountStatus.ACTIVE) {
      throw createAppError(
        ErrorCodes.INVALID_CREDENTIALS,
        {
          accountStatus: status,
          message: 'Account is not active',
          operation: 'validateCredentials',
        },
        403,
      );
    }
  }

  /**
   * Apply basic business rules for account authentication
   */
  private applyAccountAuthenticationBusinessRules(
    accountData: AccountInternal | Record<string, unknown>,
    email: string,
  ): void {
    // Rule 1: Account Status Validation
    this.validateAccountStatus(accountData);

    // Rule 2: Basic data completeness
    const requiredFields = [
      'osot_account_id',
      'osot_email',
      'osot_password',
      'osot_account_status',
    ];

    const record = accountData as Record<string, unknown>;
    const missingFields = requiredFields.filter(
      (field) => !this.safeExtractField(record, field),
    );

    if (missingFields.length > 0) {
      throw createAppError(
        ErrorCodes.VALIDATION_ERROR,
        {
          email,
          missingFields,
          message: 'Account data incomplete',
          operation: 'validateCredentials',
        },
        500,
      );
    }
  }

  /**
   * Validate account credentials with simplified implementation
   */
  /**
   * Validate user credentials with organization isolation
   * @param email User email
   * @param password User password
   * @param organizationGuid Organization GUID for multi-tenant isolation
   */
  async validateCredentials(
    email: string,
    password: string,
    organizationGuid?: string,
  ) {
    const sanitizedEmail = this.validateAuthEmail(email);
    const validatedPassword = this.validateAuthPassword(password);

    // Starting credential validation

    try {
      // Use Repository Pattern for data access (with password field and organization filter)
      const accountData = await this.accountRepository
        .findByEmailForAuth(sanitizedEmail, organizationGuid)
        .catch((error: Error) => {
          this.logger.warn(
            `Account lookup failed for email: ${sanitizedEmail}`,
            error.message,
          );
          throw createAppError(
            ErrorCodes.INVALID_CREDENTIALS,
            {
              email: sanitizedEmail,
              operation: 'validateCredentials',
            },
            401,
          );
        });

      // Account data retrieved

      if (!accountData) {
        throw createAppError(
          ErrorCodes.INVALID_CREDENTIALS,
          {
            email: sanitizedEmail,
            operation: 'validateCredentials',
          },
          401,
        );
      }

      // Apply business rules
      this.applyAccountAuthenticationBusinessRules(accountData, sanitizedEmail);

      // Business rules passed

      // Safe field extraction for password
      const storedPassword = this.safeExtractField(
        accountData,
        'osot_password',
      );

      // Checking password

      if (!storedPassword) {
        throw createAppError(
          ErrorCodes.INVALID_CREDENTIALS,
          {
            email: sanitizedEmail,
            message: 'Account password not configured',
            operation: 'validateCredentials',
          },
          401,
        );
      }

      // Comparing password

      // Validate password
      const passwordMatches = await comparePassword(
        validatedPassword,
        storedPassword,
      );

      // Password comparison complete

      if (!passwordMatches) {
        throw createAppError(
          ErrorCodes.INVALID_CREDENTIALS,
          {
            email: sanitizedEmail,
            operation: 'validateCredentials',
          },
          401,
        );
      }

      // Extract account ID
      const accountId =
        this.safeExtractField(accountData, 'osot_account_id') ||
        this.safeExtractField(accountData, 'osot_table_accountid');

      if (!accountId) {
        throw createAppError(
          ErrorCodes.VALIDATION_ERROR,
          {
            email: sanitizedEmail,
            message: 'Account ID not found',
            operation: 'validateCredentials',
          },
          500,
        );
      }

      // Create authentication response
      const authResponse = {
        id: accountId,
        email: sanitizedEmail,
        authenticated: true,
        userType: 'account',
        firstName: this.safeExtractField(accountData, 'osot_first_name'),
        lastName: this.safeExtractField(accountData, 'osot_last_name'),
        privilege: this.safeExtractField(accountData, 'osot_privilege'),
        timestamp: new Date().toISOString(),
      };

      // Emit authentication event
      this.emitAccountAuthenticated(accountId, sanitizedEmail);

      return authResponse;
    } catch (error) {
      // Emit authentication failed event
      this.emitAccountAuthenticationFailed(sanitizedEmail, error);

      throw error;
    }
  }

  /**
   * Request password reset with Redis token management
   */
  async requestPasswordReset(email: string) {
    const sanitizedEmail = this.validateAuthEmail(email);

    this.logger.debug(
      `[ACCOUNT_AUTH] Starting password reset request for: ${sanitizedEmail}`,
    );

    try {
      // Verify account exists
      const accountData =
        await this.accountRepository.findByEmailForAuth(sanitizedEmail);

      if (!accountData) {
        throw createAppError(
          ErrorCodes.ACCOUNT_NOT_FOUND,
          {
            email: sanitizedEmail,
            operation: 'requestPasswordReset',
          },
          404,
        );
      }

      // Validate account status
      this.validateAccountStatus(accountData);

      // Generate reset token and store in Redis
      const resetToken =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

      // Store token with 15 minute expiry
      await this.redisService.setTempCode(
        'password-reset',
        sanitizedEmail,
        resetToken,
        900, // 15 minutes
      );

      const accountId = this.safeExtractField(accountData, 'osot_account_id');

      this.logger.log(
        `[ACCOUNT_AUTH] Password reset token generated: ${accountId}`,
        {
          operation: 'requestPasswordReset',
          accountId,
          email: sanitizedEmail,
          timestamp: new Date().toISOString(),
        },
      );

      // Emit password reset requested event
      this.emitPasswordResetRequested(accountId, sanitizedEmail);

      return {
        tokenSent: true,
        email: sanitizedEmail,
        expiresIn: 15, // minutes
      };
    } catch (error) {
      this.logger.error(
        `[ACCOUNT_AUTH] Password reset request failed for: ${sanitizedEmail}`,
        {
          operation: 'requestPasswordReset',
          email: sanitizedEmail,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      );

      throw error;
    }
  }

  /**
   * Emit account authenticated event
   */
  private emitAccountAuthenticated(accountId: string, _email: string): void {
    try {
      this.accountEvents.publishAccountAuthentication({
        accountId,
        accountBusinessId: accountId, // Using accountId as business ID fallback
        eventType: 'login_success',
        authenticationMethod: 'password',
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.warn('Failed to emit authentication event', error);
    }
  }

  /**
   * Emit account authentication failed event
   */
  private emitAccountAuthenticationFailed(email: string, error: unknown): void {
    try {
      this.accountEvents.publishAccountAuthentication({
        accountId: '',
        accountBusinessId: '',
        eventType: 'login_failure',
        authenticationMethod: 'password',
        failureReason: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      });
    } catch (eventError) {
      this.logger.warn(
        'Failed to emit authentication failure event',
        eventError,
      );
    }
  }

  /**
   * Emit password reset requested event
   */
  private emitPasswordResetRequested(accountId: string, _email: string): void {
    try {
      this.accountEvents.publishAccountAuthentication({
        accountId,
        accountBusinessId: accountId,
        eventType: 'password_reset',
        authenticationMethod: 'token',
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.warn('Failed to emit password reset event', error);
    }
  }
}
