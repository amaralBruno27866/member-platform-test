/**
 * Class: UserLookupService
 * Objective: Centralize user search logic with caching and multi-table support.
 * Functionality: Handles user lookup across different account types with Redis caching.
 * Expected Result: Clean separation of user search concerns from authentication logic.
 *
 * Note: Currently supports only Table_Account. Prepared for Table_Account_Affiliate integration.
 */

import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import {
  AccountRepository,
  ACCOUNT_REPOSITORY,
} from '../classes/user-account/account/interfaces/account-repository.interface';
import {
  AffiliateRepository,
  AFFILIATE_REPOSITORY,
} from '../classes/user-account/affiliate/interfaces/affiliate-repository.interface';
import { RedisService } from '../redis/redis.service';
import { UserData, TableAccountData } from './types/user-data.types';

// Type for user search result
export interface UserSearchResult {
  user: UserData;
  userType: 'person' | 'affiliate';
  isAffiliate: boolean;
  cacheKey: string;
}

@Injectable()
export class UserLookupService {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepository,
    @Inject(AFFILIATE_REPOSITORY)
    private readonly affiliateRepository: AffiliateRepository,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Find user by email with caching support.
   * Searches in Table_Account first, prepared for Table_Account_Affiliate expansion.
   */
  async findUser(email: string): Promise<UserSearchResult> {
    const cacheKey = `user:cache:${email}`;

    // Try cache first
    const cachedUser = await this.getCachedUser(cacheKey);
    if (cachedUser) {
      return {
        user: cachedUser,
        userType: 'person',
        isAffiliate: false,
        cacheKey,
      };
    }

    // Search in Table_Account
    const personResult = await this.searchInTableAccount(email);
    if (personResult) {
      // Cache the result
      await this.cacheUser(cacheKey, personResult);
      return {
        user: personResult,
        userType: 'person',
        isAffiliate: false,
        cacheKey,
      };
    }

    // Search in Table_Account_Affiliate
    const affiliateResult = await this.searchInTableAccountAffiliate(email);
    if (affiliateResult) {
      // Cache the result
      await this.cacheUser(cacheKey, affiliateResult);
      return {
        user: affiliateResult,
        userType: 'affiliate',
        isAffiliate: true,
        cacheKey,
      };
    }

    throw new NotFoundException(`User not found with email: ${email}`);
  }

  /**
   * Find user by email specifically for login/authentication operations.
   * Uses different cache key and login-specific repository method to ensure
   * sensitive fields like osot_password are available.
   */
  async findUserForLogin(email: string): Promise<UserSearchResult> {
    const cacheKey = `user:login:${email}`; // Different cache key for login

    // Try login-specific cache first
    const cachedUser = await this.getCachedUser(cacheKey);
    if (cachedUser) {
      return {
        user: cachedUser,
        userType: 'person',
        isAffiliate: false,
        cacheKey,
      };
    }

    // Search in Table_Account first
    const user = await this.searchInTableAccountForLogin(email);
    if (user) {
      await this.cacheUser(cacheKey, user);
      return {
        user,
        userType: 'person',
        isAffiliate: false,
        cacheKey,
      };
    }

    // Search in Table_Account_Affiliate for login
    const affiliateUser = await this.searchInTableAccountAffiliate(email);
    if (affiliateUser) {
      await this.cacheUser(cacheKey, affiliateUser);
      return {
        user: affiliateUser,
        userType: 'affiliate',
        isAffiliate: true,
        cacheKey,
      };
    }

    throw new NotFoundException(`User not found with email: ${email}`);
  }

  /**
   * Search user in Table_Account with error handling.
   * Uses standard findByEmail method for general operations.
   */
  private async searchInTableAccount(
    email: string,
  ): Promise<TableAccountData | null> {
    try {
      const user = await this.accountRepository.findByEmail(email);

      if (user) {
        return user;
      }
      return null;
    } catch (error) {
      // If it's a 404 error, return null to continue search
      if (
        error &&
        typeof error === 'object' &&
        'status' in error &&
        (error as { status?: number }).status === 404
      ) {
        return null;
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Search user in Table_Account specifically for login operations.
   * Uses findByEmailForAuth to ensure osot_password field is available.
   */
  private async searchInTableAccountForLogin(
    email: string,
  ): Promise<TableAccountData | null> {
    try {
      const user = await this.accountRepository.findByEmailForAuth(email);

      if (user) {
        // User found
        return user;
      }
      return null;
    } catch (error) {
      // If it's a 404 error, return null to continue search
      if (
        error &&
        typeof error === 'object' &&
        'status' in error &&
        (error as { status?: number }).status === 404
      ) {
        // User not found
        return null;
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Get cached user from Redis.
   */
  private async getCachedUser(cacheKey: string): Promise<UserData | null> {
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        const user = JSON.parse(cached) as UserData;
        // User found in cache
        return user;
      }
    } catch (_error) {
      // Ignore cache errors silently
    }
    return null;
  }

  /**
   * Cache user data with TTL of 10 minutes
   */
  private async cacheUser(cacheKey: string, user: UserData): Promise<void> {
    try {
      await this.redisService.set(cacheKey, JSON.stringify(user), { EX: 600 });
    } catch (error) {
      console.error('Failed to cache user:', error);
    }
  }

  /**
   * Clear user cache for a specific email
   * Useful for forcing fresh data retrieval during login issues
   */
  async clearUserCache(email: string): Promise<void> {
    try {
      const standardCacheKey = `user:cache:${email}`;
      const loginCacheKey = `user:login:${email}`;

      await this.redisService.delete(standardCacheKey);
      await this.redisService.delete(loginCacheKey);
    } catch (error) {
      console.error('Failed to clear user cache:', error);
    }
  }

  /**
   * Search user in Table_Account_Affiliate with error handling.
   */
  private async searchInTableAccountAffiliate(
    email: string,
  ): Promise<UserData | null> {
    try {
      const affiliate = await this.affiliateRepository.findByEmail(email);

      if (affiliate) {
        return affiliate as UserData;
      }
      return null;
    } catch (error) {
      // If it's a 404 error, return null to continue search
      if (
        error &&
        typeof error === 'object' &&
        'status' in error &&
        (error as { status?: number }).status === 404
      ) {
        return null;
      }
      // Re-throw other errors
      throw error;
    }
  }
  //   try {
  //     console.log('[USER_LOOKUP DEBUG] Searching in Table_Account_Affiliate:', email);
  //     const affiliate = await this.tableAccountAffiliateService.findByEmail(email);
  //     if (affiliate) {
  //       console.log('[USER_LOOKUP DEBUG] User found in Table_Account_Affiliate');
  //       return affiliate;
  //     }
  //     return null;
  //   } catch (error) {
  //     console.log('[USER_LOOKUP DEBUG] User not found in Table_Account_Affiliate');
  //     return null;
  //   }
  // }
}
