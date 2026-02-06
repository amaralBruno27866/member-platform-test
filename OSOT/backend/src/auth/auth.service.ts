/**
 * Class: AuthService
 * Objective: Provide authentication-related business logic and services.
 * Functionality: Contains methods for handling authentication, authorization, and token management.
 * Expected Result: Supplies authentication logic to controllers and other modules.
 */

import { Injectable, Inject } from '@nestjs/common';
import { createAppError } from '../common/errors/error.factory';
import { ErrorCodes } from '../common/errors/error-codes';
import { JwtService } from '@nestjs/jwt';
import { CacheService } from '../cache/cache.service';
import { LoginDto } from '../classes/login/login.dto';
import { UserLookupService } from './user-lookup.service';
import { RedisService } from '../redis/redis.service';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import {
  TableAccountData,
  TableAccountAffiliateData,
} from './types/user-data.types';

// Enhanced Authentication System
import { EnhancedUserRepositoryService } from './services/enhanced-user-repository.service';
import { AuthenticationResult } from './interfaces/user-repository.interface';
import { getPrivilegeDisplayName, Privilege } from '../common/enums';

// Organization integration
import { OrganizationLookupService } from '../classes/others/organization/services/organization-lookup.service';
import { IOrganizationRepository } from '../classes/others/organization/interfaces';
import { ORGANIZATION_REPOSITORY } from '../classes/others/organization/constants';
import { encryptOrganizationId } from '../utils/organization-crypto.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userLookupService: UserLookupService,
    private readonly redisService: RedisService,
    private readonly enhancedUserRepository: EnhancedUserRepositoryService,
    private readonly cacheService: CacheService,
    private readonly organizationLookupService: OrganizationLookupService,
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository,
  ) {}
  /**
   * Adds the JWT token to the blacklist in Redis, with expiration equal to the remaining token time.
   */
  async blacklistToken(token: string): Promise<void> {
    try {
      // Decodes the token to get the expiration time
      const decoded = jwt.decode(token) as { exp?: number } | null;
      if (!decoded || typeof decoded.exp !== 'number') {
        throw new Error('Invalid token');
      }
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = decoded.exp - now;
      if (expiresIn <= 0) {
        // Token has already expired
        return;
      }
      // Saves the token in the blacklist with expiration
      await this.redisService.set(`blacklist:${token}`, '1', { EX: expiresIn });
    } catch (err) {
      // Logs the error, but doesn't throw to avoid breaking the logout flow
      console.error('Error adding token to blacklist:', err);
    }
  }

  /**
   * Enhanced login method using unified authentication
   * Uses EnhancedUserRepositoryService for secure, type-safe authentication
   *
   * @param loginDto - Login credentials (email, password)
   * @param organizationSlug - Organization slug from subdomain or request
   */
  async loginEnhanced(loginDto: LoginDto, organizationSlug: string) {
    try {
      // 1. Validate organization exists and is active (get internal with GUID)
      const organization =
        await this.organizationRepository.findBySlug(organizationSlug);

      if (!organization) {
        throw createAppError(
          ErrorCodes.NOT_FOUND,
          {
            message: 'Organization not found or inactive',
            organizationSlug,
          },
          404,
          'Organization not found',
        );
      }

      // 2. Use Enhanced Repository for unified authentication with organization isolation
      const authResult: AuthenticationResult =
        await this.enhancedUserRepository.validateCredentials(
          loginDto.osot_email,
          loginDto.osot_password,
          organization.osot_table_organizationid, // Pass organization GUID for isolation
        );

      if (!authResult.success) {
        throw createAppError(
          ErrorCodes.INVALID_CREDENTIALS,
          {
            email: loginDto.osot_email,
            failureReason: authResult.failureReason,
          },
          401,
          'Authentication failed',
        );
      }

      // 3. Map privilege to role based on actual user privilege
      const privilege = authResult.privilege || 1; // Default to OWNER if not set
      const role = this.privilegeToRole(privilege);

      // 4. Build JWT payload with organization context
      const payload = {
        sub: authResult.userId,
        userId: authResult.userId, // Business ID for User decorator compatibility
        userGuid: authResult.userGuid, // GUID for efficient Dataverse lookups
        email: authResult.email,
        role,
        privilege, // Include numeric privilege
        userType: authResult.userType,
        // Organization context (NEW)
        organizationId: encryptOrganizationId(
          organization.osot_table_organizationid,
        ), // Encrypted GUID
        organizationSlug: organization.osot_slug, // Public slug
        organizationName: organization.osot_organization_name, // Display name
      };

      // Generate JWT token
      const access_token = this.jwtService.sign(payload);

      // Warm up user cache in background (non-blocking)
      // This pre-loads frequently accessed data for better UX
      // Errors are logged internally in CacheService, no need to handle here
      void this.cacheService.warmUpUserCache({
        userGuid: authResult.userGuid,
        businessId: authResult.userId,
        userType: authResult.userType,
      });

      // Return structured response
      return {
        access_token,
        user: {
          id: authResult.userId,
          email: authResult.email,
          userType: authResult.userType,
          privilege: getPrivilegeDisplayName(privilege as Privilege), // Human-readable privilege level
          organizationName: organization.osot_organization_name, // Organization display name
          organizationSlug: organization.osot_slug, // Organization slug
        },
        role,
        privilege, // Numeric value for backend compatibility
        userType: authResult.userType,
        authenticationTimestamp: authResult.authenticationTimestamp,
      };
    } catch (error) {
      // Enhanced error handling with context
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error; // Re-throw structured errors
      }

      throw createAppError(
        ErrorCodes.INVALID_CREDENTIALS,
        { email: loginDto.osot_email },
        401,
        'Authentication failed',
      );
    }
  }

  /**
   * Map user type to role for backward compatibility
   */
  private mapUserTypeToRole(userType: string): string {
    switch (userType) {
      case 'affiliate':
        return 'owner'; // Affiliates get owner permissions
      case 'account':
      default:
        return 'main'; // Default role for accounts
    }
  }

  /**
   * Map privilege number to role string
   */
  private privilegeToRole(privilege: number): string {
    switch (privilege) {
      case 1:
        return 'owner';
      case 2:
        return 'admin';
      case 3:
        return 'main';
      default:
        return 'owner';
    }
  }

  /**
   * Legacy login method - DEPRECATED
   * Use loginEnhanced() for new implementations
   *
   * Validates user credentials and returns a JWT if valid.
   * Throws UnauthorizedException if credentials are invalid.
   */
  async login(loginDto: LoginDto) {
    // Use UserLookupService to find user (handles cache and database search)
    const userSearchResult = await this.userLookupService.findUser(
      loginDto.osot_email,
    );

    const { user, userType, isAffiliate } = userSearchResult;

    // Log for the returned object
    console.log('DataverseResponse (user):', JSON.stringify(user, null, 2));

    // Validates password
    const passwordField = String(user.osot_password);
    const isPasswordValid = await bcrypt.compare(
      loginDto.osot_password,
      passwordField,
    );

    if (!isPasswordValid) {
      throw createAppError(
        ErrorCodes.INVALID_CREDENTIALS,
        { email: loginDto.osot_email },
        401,
        'Invalid credentials',
      );
    }
    // Resolve canonical identifiers to use in error contexts/logging
    const subjectId = isAffiliate
      ? String((user as TableAccountAffiliateData).osot_affiliate_id ?? '')
      : String((user as TableAccountData).osot_account_id ?? '');
    const emailFromUser = isAffiliate
      ? String((user as TableAccountAffiliateData).osot_affiliate_email ?? '')
      : String(
          (user as TableAccountData).osot_email ?? loginDto.osot_email ?? '',
        );

    // Checks if the account is active
    let isAccountActive = false;
    if (isAffiliate) {
      // For affiliate, status 1 = active
      isAccountActive =
        user.osot_account_status === 1 ||
        user.osot_account_status === '1' ||
        user.osot_account_status === 'Active';
    } else {
      isAccountActive =
        user.osot_account_status === 1 ||
        user.osot_account_status === '1' ||
        user.osot_account_status === 'Active';
    }
    if (!isAccountActive) {
      throw createAppError(
        ErrorCodes.INVALID_CREDENTIALS,
        { sub: subjectId, email: emailFromUser },
        401,
        'Inactive account. Please contact support.',
      );
    }
    // Map privilege to role/app (only for person)
    function privilegeValueToRole(value: number | string | undefined): string {
      switch (Number(value)) {
        case 1:
          return 'owner';
        case 2:
          return 'admin';
        case 3:
          return 'main';
        default:
          return 'owner';
      }
    }
    let role = 'owner';
    if (!isAffiliate) {
      const accountUser = user as TableAccountData;
      const privilege: string | number | undefined =
        typeof accountUser.osot_privilege === 'number' ||
        typeof accountUser.osot_privilege === 'string'
          ? accountUser.osot_privilege
          : undefined;
      role = privilegeValueToRole(privilege);
    } else {
      // For affiliate, maps to owner to ensure permissions
      role = 'owner';
    }
    // Builds JWT payload
    const payload = isAffiliate
      ? {
          sub: String((user as TableAccountAffiliateData).osot_affiliate_id),
          userId: String((user as TableAccountAffiliateData).osot_affiliate_id), // Added for User decorator compatibility
          email: String(
            (user as TableAccountAffiliateData).osot_affiliate_email,
          ),
          role, // always 'owner' for affiliate
          privilege: 1, // Affiliates always have OWNER privilege
          userType,
        }
      : {
          sub: String((user as TableAccountData).osot_account_id),
          userId: String((user as TableAccountData).osot_account_id), // Added for User decorator compatibility
          email: String((user as TableAccountData).osot_email),
          role,
          privilege: Number((user as TableAccountData).osot_privilege) || 1, // Include numeric privilege
          userType,
        };
    const access_token = this.jwtService.sign(payload);
    // Builds profile response for account or affiliate
    let result: Record<string, any>;
    if (isAffiliate) {
      const affiliateUser = user as TableAccountAffiliateData;
      // Simplified profile for affiliate (can be expanded as needed)
      result = {
        access_token,
        userProfile: {
          affiliate: {
            osot_affiliate_id: String(affiliateUser.osot_affiliate_id ?? ''),
            osot_affiliate_name: String(
              affiliateUser.osot_affiliate_name ?? '',
            ),
            osot_affiliate_email: String(
              affiliateUser.osot_affiliate_email ?? '',
            ),
            osot_affiliate_phone: String(
              affiliateUser.osot_affiliate_phone ?? '',
            ),
            osot_affiliate_website: String(
              affiliateUser.osot_affiliate_website ?? '',
            ),
            osot_affiliate_area: Number(affiliateUser.osot_affiliate_area ?? 0),
            osot_account_status: Number(affiliateUser.osot_account_status ?? 0),
            osot_affiliate_province: Number(
              affiliateUser.osot_affiliate_province ?? 0,
            ),
            osot_affiliate_country: Number(
              affiliateUser.osot_affiliate_country ?? 0,
            ),
          },
        },
        role, // always 'owner' for affiliate
        userType,
      };
    } else {
      // Keeps old response for main account
      result = {
        access_token,
        user,
        role,
        userType,
      };
    }
    console.log(
      'login result:',
      JSON.stringify(result, null, 2),
      '\naccess_token:',
      access_token,
    );
    return result;
  }
}
