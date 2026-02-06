import { Injectable, Logger } from '@nestjs/common';
import { createAppError } from '../../common/errors/error.factory';
import { ErrorCodes } from '../../common/errors/error-codes';

// Unified Interface
import {
  UserRepository,
  UserLookupResult,
  AuthenticationResult,
  PasswordResetResult,
  AuthenticationFailureReason,
} from '../interfaces/user-repository.interface';

// Existing Services
import { UserLookupService } from '../user-lookup.service';

// Account and Affiliate Auth Services
import { AccountAuthService } from './account-auth.service';
import { AffiliateAuthService } from '../../classes/user-account/affiliate/services/affiliate-auth.service';
import { TableAccountData } from '../types/user-data.types';

/**
 * Enhanced User Repository Service
 *
 * Simplified implementation focusing on core authentication delegation
 * to AccountAuthService and AffiliateAuthService.
 *
 * @implements UserRepository
 * @version 2.0.0 - Simplified Enterprise Implementation
 */
@Injectable()
export class EnhancedUserRepositoryService implements UserRepository {
  private readonly logger = new Logger(EnhancedUserRepositoryService.name);

  constructor(
    private readonly userLookupService: UserLookupService,
    private readonly accountAuthService: AccountAuthService,
    private readonly affiliateAuthService: AffiliateAuthService,
  ) {
    this.logger.log(
      'EnhancedUserRepositoryService initialized with unified interface',
    );
  }

  /**
   * Simplified user type determination
   */
  async getUserType(email: string): Promise<UserLookupResult> {
    try {
      const userSearchResult =
        await this.userLookupService.findUserForLogin(email);
      const { isAffiliate } = userSearchResult;

      return {
        user: null,
        userType: isAffiliate ? 'affiliate' : 'account',
        isAffiliate,
        found: true,
      };
    } catch {
      return {
        user: null,
        userType: 'account',
        isAffiliate: false,
        found: false,
      };
    }
  }

  /**
   * Validate user credentials with enhanced security and organization isolation
   * @param email User email
   * @param password User password
   * @param organizationGuid Optional organization GUID for multi-tenant isolation
   */
  async validateCredentials(
    email: string,
    password: string,
    organizationGuid?: string,
  ): Promise<AuthenticationResult> {
    try {
      // Clear cache to ensure we get fresh data with password field for login
      await this.userLookupService.clearUserCache(email);

      const userLookupResult = await this.getUserType(email);

      if (!userLookupResult.found) {
        return {
          success: false,
          userId: '',
          email,
          failureReason: 'USER_NOT_FOUND',
          authenticationTimestamp: new Date().toISOString(),
        };
      }

      if (userLookupResult.userType === 'account') {
        return await this.validateAccountCredentials(
          email,
          password,
          organizationGuid,
        );
      } else {
        return await this.validateAffiliateCredentials(
          email,
          password,
          organizationGuid,
        );
      }
    } catch (authError) {
      this.logger.error('Authentication failed', authError);
      return {
        success: false,
        userId: '',
        email,
        failureReason: 'VALIDATION_FAILED',
        authenticationTimestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Validate account credentials - PUBLIC method for interface compliance
   * @param email User email
   * @param password User password
   * @param organizationGuid Optional organization GUID for multi-tenant isolation
   */
  async validateAccountCredentials(
    email: string,
    password: string,
    organizationGuid?: string,
  ): Promise<AuthenticationResult> {
    try {
      // First validate credentials with organization isolation
      await this.accountAuthService.validateCredentials(
        email,
        password,
        organizationGuid,
      );

      // If validation successful, get user data using UserLookupService
      const userSearchResult =
        await this.userLookupService.findUserForLogin(email);
      const userData = userSearchResult.user;

      if (!userData) {
        throw new Error('User data not found after successful validation');
      }

      // Cast to TableAccountData to access privilege field
      const accountData = userData as TableAccountData;

      return {
        success: true,
        userType: 'account',
        userId: this.extractStringField(userData, 'osot_account_id'), // Business ID (osot-0000213)
        userGuid: this.extractStringField(userData, 'osot_table_accountid'), // GUID for Dataverse lookups
        email: this.extractStringField(userData, 'osot_email') || email,
        privilege: Number(accountData.osot_privilege) || 1, // Include privilege, default to OWNER
        authenticationTimestamp: new Date().toISOString(),
      };
    } catch (authError) {
      return {
        success: false,
        userType: 'account',
        userId: '',
        email,
        failureReason: this.mapErrorToFailureReason(authError),
        authenticationTimestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Validate affiliate credentials - PUBLIC method for interface compliance
   */
  async validateAffiliateCredentials(
    email: string,
    password: string,
    organizationGuid?: string,
  ): Promise<AuthenticationResult> {
    try {
      // First validate credentials (this only validates, doesn't return user data)
      await this.affiliateAuthService.validateCredentials(
        email,
        password,
        organizationGuid,
      );

      // If validation successful, get user data using UserLookupService
      const userSearchResult =
        await this.userLookupService.findUserForLogin(email);
      const userData = userSearchResult.user;

      if (!userData) {
        throw new Error('User data not found after successful validation');
      }

      return {
        success: true,
        userType: 'affiliate',
        userId: this.extractStringField(userData, 'osot_affiliate_id'), // Business ID
        userGuid: this.extractStringField(
          userData,
          'osot_table_account_affiliateid',
        ), // GUID for Dataverse lookups
        email:
          this.extractStringField(userData, 'osot_affiliate_email') || email,
        organizationName: this.extractStringField(
          userData,
          'osot_affiliate_name',
        ),
        authenticationTimestamp: new Date().toISOString(),
      };
    } catch (authError) {
      return {
        success: false,
        userType: 'affiliate',
        userId: '',
        email,
        failureReason: this.mapErrorToFailureReason(authError),
        authenticationTimestamp: new Date().toISOString(),
      };
    }
  } /**
   * Request password reset with delegation
   */
  async requestPasswordReset(email: string): Promise<PasswordResetResult> {
    const userLookupResult = await this.getUserType(email);

    if (!userLookupResult.found) {
      throw createAppError(
        ErrorCodes.ACCOUNT_NOT_FOUND,
        { email, operation: 'requestPasswordReset' },
        404,
      );
    }

    if (userLookupResult.userType === 'account') {
      const resetResult =
        await this.accountAuthService.requestPasswordReset(email);
      return {
        tokenSent: resetResult.tokenSent,
        email: resetResult.email,
        userType: 'account',
        expiresIn: 15,
      };
    } else {
      const resetResult =
        await this.affiliateAuthService.requestPasswordReset(email);
      return {
        tokenSent: resetResult.tokenSent,
        email: resetResult.email,
        userType: 'affiliate',
        expiresIn: 15,
        organizationName: resetResult.organizationName,
      };
    }
  }

  // Interface compliance - placeholder implementations
  findByEmail(): Promise<never> {
    throw new Error('Use getUserType instead');
  }

  findAccountByEmail(): Promise<never> {
    throw new Error('Use validateAccountCredentials instead');
  }

  findAffiliateByEmail(): Promise<never> {
    throw new Error('Use validateAffiliateCredentials instead');
  }

  /**
   * Safe field extraction from auth response objects
   */
  private extractStringField(obj: unknown, field: string): string {
    if (!obj || typeof obj !== 'object') return '';

    const value = (obj as Record<string, unknown>)[field];
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    return '';
  }

  /**
   * Map errors to failure reasons with proper typing
   */
  private mapErrorToFailureReason(error: unknown): AuthenticationFailureReason {
    if (!error) return 'UNKNOWN_ERROR';

    // Type guard for Error objects
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      if (errorMessage.includes('password')) return 'INVALID_PASSWORD';
      if (errorMessage.includes('privilege')) return 'INSUFFICIENT_PRIVILEGES';
      if (errorMessage.includes('inactive')) return 'ACCOUNT_INACTIVE';
      if (errorMessage.includes('not found')) return 'USER_NOT_FOUND';
    }

    // Type guard for objects with status codes
    if (typeof error === 'object' && error !== null) {
      const errorObj = error as Record<string, unknown>;
      const statusCode = errorObj.statusCode || errorObj.code;

      if (statusCode === 401) return 'INVALID_PASSWORD';
      if (statusCode === 403) return 'INSUFFICIENT_PRIVILEGES';
      if (statusCode === 404) return 'USER_NOT_FOUND';
    }

    return 'UNKNOWN_ERROR';
  }
}
