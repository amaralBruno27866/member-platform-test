import { Injectable, Logger, Inject } from '@nestjs/common';
import { RedisService } from '../../../../redis/redis.service';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { AccountStatus } from '../../../../common/enums';
import { comparePassword } from '../../../../common/keys/password-hash.util';

// Repository Pattern
import {
  AffiliateRepository,
  AFFILIATE_REPOSITORY,
} from '../interfaces/affiliate-repository.interface';
import { AffiliateInternal } from '../interfaces/affiliate-internal.interface';

// Event System
import { AffiliateEventsService } from '../events/affiliate.events';

/**
 * Affiliate Authentication Service
 *
 * Simplified implementation focusing on core authentication for affiliate organizations.
 * Provides secure authentication operations following enterprise patterns.
 *
 * @implements Repository Pattern for data access abstraction
 * @follows Enterprise security patterns with comprehensive validation
 * @version 2.0.0 - Simplified Implementation
 */
@Injectable()
export class AffiliateAuthService {
  private readonly logger = new Logger(AffiliateAuthService.name);

  constructor(
    @Inject(AFFILIATE_REPOSITORY)
    private readonly affiliateRepository: AffiliateRepository,
    private readonly affiliateEvents: AffiliateEventsService,
    private readonly redisService: RedisService,
  ) {
    this.logger.log('AffiliateAuthService initialized with Repository Pattern');
  }

  /**
   * Validate and sanitize email input for affiliate authentication
   */
  private validateAuthEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      throw createAppError(
        ErrorCodes.VALIDATION_ERROR,
        {
          field: 'email',
          message: 'Email is required for affiliate authentication',
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
          message: 'Email format is invalid for affiliate authentication',
          operation: 'validateCredentials',
        },
        400,
      );
    }

    return email.toLowerCase().trim();
  }

  /**
   * Validate password input for affiliate authentication
   */
  private validateAuthPassword(password: string): string {
    if (!password || typeof password !== 'string') {
      throw createAppError(
        ErrorCodes.VALIDATION_ERROR,
        {
          field: 'password',
          message: 'Password is required for affiliate authentication',
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
   * Safely extract field values from affiliate data
   */
  private safeExtractField(
    data: AffiliateInternal | Record<string, unknown>,
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
   * Validate affiliate account status
   */
  private validateAffiliateStatus(
    affiliateData: AffiliateInternal | Record<string, unknown>,
  ): void {
    const record = affiliateData as Record<string, unknown>;
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
          message: 'Affiliate organization is not active',
          operation: 'validateCredentials',
        },
        403,
      );
    }
  }

  /**
   * Apply basic business rules for affiliate authentication
   */
  private applyAffiliateAuthenticationBusinessRules(
    affiliateData: AffiliateInternal | Record<string, unknown>,
    email: string,
  ): void {
    // Rule 1: Affiliate Status Validation
    this.validateAffiliateStatus(affiliateData);

    // Rule 2: Basic data completeness
    const requiredFields = [
      'osot_affiliate_id',
      'osot_affiliate_email',
      'osot_password',
      'osot_account_status',
    ];

    const record = affiliateData as Record<string, unknown>;
    const missingFields = requiredFields.filter(
      (field) => !this.safeExtractField(record, field),
    );

    if (missingFields.length > 0) {
      throw createAppError(
        ErrorCodes.VALIDATION_ERROR,
        {
          email,
          missingFields,
          message: 'Affiliate organization data incomplete',
          operation: 'validateCredentials',
        },
        500,
      );
    }
  }

  /**
   * Validate affiliate credentials with simplified implementation
   */
  async validateCredentials(
    email: string,
    password: string,
    organizationGuid?: string,
  ) {
    const sanitizedEmail = this.validateAuthEmail(email);
    const validatedPassword = this.validateAuthPassword(password);

    this.logger.debug(
      `[AFFILIATE_AUTH] Starting credential validation for: ${sanitizedEmail}`,
    );

    try {
      // Use Repository Pattern for data access
      const affiliateData = await this.affiliateRepository
        .findByEmail(sanitizedEmail, organizationGuid)
        .catch((error: Error) => {
          this.logger.warn(
            `Affiliate lookup failed for email: ${sanitizedEmail}`,
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

      this.logger.debug(
        `[AFFILIATE_AUTH] Affiliate data retrieved: ${affiliateData ? 'found' : 'not found'}`,
      );

      // Apply business rules
      this.applyAffiliateAuthenticationBusinessRules(
        affiliateData,
        sanitizedEmail,
      );

      this.logger.debug(`[AFFILIATE_AUTH] Business rules passed`);

      // Safe field extraction for password
      const storedPassword = this.safeExtractField(
        affiliateData,
        'osot_password',
      );

      this.logger.debug(
        `[AFFILIATE_AUTH] Stored password exists: ${!!storedPassword}`,
      );

      if (!storedPassword) {
        throw createAppError(
          ErrorCodes.INVALID_CREDENTIALS,
          {
            email: sanitizedEmail,
            message: 'Affiliate password not configured',
            operation: 'validateCredentials',
          },
          401,
        );
      }

      this.logger.debug(`[AFFILIATE_AUTH] Starting password comparison`);

      // DEBUG: Log password details (REMOVE IN PRODUCTION)
      this.logger.debug(
        `[AFFILIATE_AUTH] Provided password length: ${validatedPassword.length}`,
      );
      this.logger.debug(
        `[AFFILIATE_AUTH] Stored hash starts with: ${storedPassword.substring(0, 7)}`,
      );

      // Validate password
      const passwordMatches = await comparePassword(
        validatedPassword,
        storedPassword,
      );

      this.logger.debug(
        `[AFFILIATE_AUTH] Password matches: ${passwordMatches}`,
      );

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

      // Extract affiliate ID
      const affiliateId =
        this.safeExtractField(affiliateData, 'osot_affiliate_id') ||
        this.safeExtractField(affiliateData, 'osot_affiliateid');

      if (!affiliateId) {
        throw createAppError(
          ErrorCodes.VALIDATION_ERROR,
          {
            email: sanitizedEmail,
            message: 'Affiliate ID not found',
            operation: 'validateCredentials',
          },
          500,
        );
      }

      // Create authentication response
      const authResponse = {
        id: affiliateId,
        email: sanitizedEmail,
        authenticated: true,
        userType: 'affiliate',
        organizationName: this.safeExtractField(
          affiliateData,
          'osot_affiliate_name',
        ),
        timestamp: new Date().toISOString(),
      };

      this.logger.log(
        `Successful affiliate authentication for organization: ${affiliateId}`,
      );
      return authResponse;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `Affiliate authentication failed for email: ${sanitizedEmail}`,
        errorMessage,
      );

      throw error;
    }
  }

  /**
   * Request password reset for affiliate organization
   */
  async requestPasswordReset(email: string) {
    const sanitizedEmail = this.validateAuthEmail(email);

    try {
      // Verify affiliate organization exists
      const affiliateData = await this.affiliateRepository
        .findByEmail(sanitizedEmail)
        .catch((error: Error) => {
          this.logger.warn(
            `Password reset requested for non-existent affiliate email: ${sanitizedEmail}`,
            error.message,
          );
          throw createAppError(
            ErrorCodes.ACCOUNT_NOT_FOUND,
            {
              email: sanitizedEmail,
              operation: 'requestPasswordReset',
            },
            404,
          );
        });

      const affiliateId = this.safeExtractField(
        affiliateData,
        'osot_affiliate_id',
      );
      const organizationName = this.safeExtractField(
        affiliateData,
        'osot_affiliate_name',
      );

      // Generate token and store in Redis
      const token = Math.random().toString(36).slice(2, 8);
      await this.redisService.setTempCode(
        'affiliate-password-reset',
        sanitizedEmail,
        token,
        60 * 15, // 15 minutes
      );

      this.logger.log(
        `Password reset token generated for affiliate organization: ${affiliateId}`,
      );

      return {
        tokenSent: true,
        email: sanitizedEmail,
        organizationName,
        userType: 'affiliate',
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `Affiliate password reset failed for email: ${sanitizedEmail}`,
        errorMessage,
      );

      throw error;
    }
  }
}
