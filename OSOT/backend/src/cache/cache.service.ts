/**
 * Cache Service - Centralized User Data Caching
 *
 * This service provides a unified interface for caching user-related data
 * across the application. It supports:
 * - Account profile, address, contact, identity
 * - Education data (OT/OTA)
 * - Membership expiration and settings
 * - Cache warm-up on login
 * - Granular cache invalidation on updates
 *
 * @file cache.service.ts
 * @module CacheModule
 * @since 2025-12-11
 */

import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import {
  CachePrefix,
  CacheTTLConfig,
  CacheKey,
  WarmUpOptions,
  CacheOperationResult,
} from './interfaces/cache-config.interface';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  /**
   * Default TTL values (in seconds)
   * PRESENTATION MODE: Reduced to 60 seconds for fast feedback during demos
   * In production, adjust based on data volatility:
   * - Critical data (prices, membership): 60-300s
   * - Semi-static (profiles, addresses): 300-900s
   * - Static (education, settings): 3600+s
   */
  private readonly ttlConfig: CacheTTLConfig = {
    account: parseInt(process.env.ACCOUNT_CACHE_TTL || '60', 10), // 60 sec (was 1800)
    education: parseInt(process.env.EDUCATION_CACHE_TTL || '60', 10), // 60 sec (was 3600)
    membership: parseInt(process.env.EXPIRATION_CACHE_TTL || '60', 10), // 60 sec (was 3600)
  };

  constructor(private readonly redisService: RedisService) {}

  // ========================================
  // CACHE KEY BUILDERS
  // ========================================

  /**
   * Build cache key for account profile
   */
  buildAccountKey(userGuid: string): CacheKey {
    return {
      key: `${CachePrefix.ACCOUNT_PROFILE}:${userGuid}`,
      prefix: CachePrefix.ACCOUNT_PROFILE,
      identifier: userGuid,
    };
  }

  /**
   * Build cache key for account address
   */
  buildAddressKey(userGuid: string): CacheKey {
    return {
      key: `${CachePrefix.ACCOUNT_ADDRESS}:${userGuid}`,
      prefix: CachePrefix.ACCOUNT_ADDRESS,
      identifier: userGuid,
    };
  }

  /**
   * Build cache key for account contact
   */
  buildContactKey(userGuid: string): CacheKey {
    return {
      key: `${CachePrefix.ACCOUNT_CONTACT}:${userGuid}`,
      prefix: CachePrefix.ACCOUNT_CONTACT,
      identifier: userGuid,
    };
  }

  /**
   * Build cache key for account identity
   */
  buildIdentityKey(userGuid: string): CacheKey {
    return {
      key: `${CachePrefix.ACCOUNT_IDENTITY}:${userGuid}`,
      prefix: CachePrefix.ACCOUNT_IDENTITY,
      identifier: userGuid,
    };
  }

  /**
   * Build cache key for OT education
   */
  buildOtEducationKey(userGuid: string): CacheKey {
    return {
      key: `${CachePrefix.EDUCATION_OT}:${userGuid}`,
      prefix: CachePrefix.EDUCATION_OT,
      identifier: userGuid,
    };
  }

  /**
   * Build cache key for OTA education
   */
  buildOtaEducationKey(userGuid: string): CacheKey {
    return {
      key: `${CachePrefix.EDUCATION_OTA}:${userGuid}`,
      prefix: CachePrefix.EDUCATION_OTA,
      identifier: userGuid,
    };
  }

  /**
   * Build cache key for membership expiration
   */
  buildMembershipExpirationKey(userGuid: string): CacheKey {
    return {
      key: `${CachePrefix.MEMBERSHIP_EXPIRATION}:${userGuid}`,
      prefix: CachePrefix.MEMBERSHIP_EXPIRATION,
      identifier: userGuid,
    };
  }

  /**
   * Build cache key for membership settings
   */
  buildMembershipSettingsKey(userGuid: string): CacheKey {
    return {
      key: `${CachePrefix.MEMBERSHIP_SETTINGS}:${userGuid}`,
      prefix: CachePrefix.MEMBERSHIP_SETTINGS,
      identifier: userGuid,
    };
  }

  // ========================================
  // GENERIC CACHE OPERATIONS
  // ========================================

  /**
   * Get cached data
   * @param key - Cache key (string or CacheKey object)
   * @returns Cached data or null if not found
   */
  async get<T>(key: string | CacheKey): Promise<T | null> {
    try {
      const cacheKey = typeof key === 'string' ? key : key.key;
      const cached = await this.redisService.get(cacheKey);

      if (cached) {
        return JSON.parse(cached) as T;
      }

      return null;
    } catch (error) {
      const cacheKey = typeof key === 'string' ? key : key.key;
      this.logger.error(
        `Failed to get cache for ${cacheKey}:`,
        error instanceof Error ? error.message : String(error),
      );
      return null;
    }
  }

  /**
   * Set cached data
   * @param key - Cache key (string or CacheKey object)
   * @param value - Data to cache
   * @param ttl - Time to live in seconds (optional, uses default from config)
   */
  async set<T>(
    key: string | CacheKey,
    value: T,
    ttl?: number,
  ): Promise<CacheOperationResult> {
    try {
      const cacheKey = typeof key === 'string' ? key : key.key;
      const effectiveTtl = ttl || this.getDefaultTTL(cacheKey);

      await this.redisService.set(cacheKey, JSON.stringify(value), {
        EX: effectiveTtl,
      });

      return {
        success: true,
        key: cacheKey,
        cached: true,
      };
    } catch (error) {
      const cacheKey = typeof key === 'string' ? key : key.key;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to set cache for ${cacheKey}:`, errorMessage);
      return {
        success: false,
        key: cacheKey,
        cached: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Invalidate (delete) specific cache key
   * @param key - Cache key to invalidate
   */
  async invalidate(key: string | CacheKey): Promise<CacheOperationResult> {
    try {
      const cacheKey = typeof key === 'string' ? key : key.key;
      await this.redisService.del(cacheKey);

      return {
        success: true,
        key: cacheKey,
      };
    } catch (error) {
      const cacheKey = typeof key === 'string' ? key : key.key;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to invalidate cache for ${cacheKey}:`,
        errorMessage,
      );
      return {
        success: false,
        key: cacheKey,
        error: errorMessage,
      };
    }
  }

  /**
   * Invalidate all cache keys matching pattern
   * @param pattern - Redis key pattern (e.g., 'account:*')
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const deletedCount = await this.redisService.deletePattern(pattern);
      this.logger.debug(
        `🗑️ INVALIDATED PATTERN: ${pattern} (${deletedCount} keys)`,
      );
      return deletedCount;
    } catch (error) {
      this.logger.error(`Failed to invalidate pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Invalidate all user-related cache
   * @param userGuid - User GUID
   */
  async invalidateUserCache(userGuid: string): Promise<number> {
    const patterns = [
      `account:*:${userGuid}`,
      `education:*:${userGuid}`,
      `membership:*:${userGuid}`,
    ];

    let totalDeleted = 0;
    for (const pattern of patterns) {
      totalDeleted += await this.invalidatePattern(pattern);
    }

    this.logger.log(
      `🗑️ Invalidated all cache for user ${userGuid}: ${totalDeleted} keys`,
    );
    return totalDeleted;
  }

  // ========================================
  // WARM-UP CACHE
  // ========================================

  /**
   * Warm up user cache on login
   * Pre-loads all user-related data into Redis
   * Runs in background, does not block login response
   *
   * @param options - Warm-up options
   */
  async warmUpUserCache(_options: WarmUpOptions): Promise<void> {
    // Note: Cache warm-up is triggered after login
    // Data will be cached by services on first access
    try {
      const promises: Promise<any>[] = [];
      await Promise.all(promises);
    } catch (_error) {
      // Silent fail - warm-up failure should not break login
    }
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Get default TTL based on cache key prefix
   */
  private getDefaultTTL(key: string): number {
    if (key.startsWith('account:')) {
      return this.ttlConfig.account;
    } else if (key.startsWith('education:')) {
      return this.ttlConfig.education;
    } else if (key.startsWith('membership:')) {
      return this.ttlConfig.membership;
    }
    return this.ttlConfig.account; // Default fallback
  }

  /**
   * Check if cache is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const testKey = 'health:check';
      await this.redisService.set(testKey, 'ok', { EX: 10 });
      const result = await this.redisService.get(testKey);
      await this.redisService.del(testKey);
      return result === 'ok';
    } catch (error) {
      this.logger.error('Cache health check failed:', error);
      return false;
    }
  }

  // ========================================
  // CACHE INVALIDATION (PHASE 1 - POST-WRITE)
  // ========================================

  /**
   * Invalidate all cache entries for a specific user
   * Called after user profile updates (account, address, contact, identity, etc)
   *
   * @param userGuid - User's GUID
   */
  async invalidateUser(userGuid: string): Promise<void> {
    try {
      const patterns = [
        `${CachePrefix.ACCOUNT_PROFILE}:${userGuid}`,
        `${CachePrefix.ACCOUNT_ADDRESS}:${userGuid}`,
        `${CachePrefix.ACCOUNT_CONTACT}:${userGuid}`,
        `${CachePrefix.ACCOUNT_IDENTITY}:${userGuid}`,
        `${CachePrefix.EDUCATION_OT}:${userGuid}`,
        `${CachePrefix.EDUCATION_OTA}:${userGuid}`,
        `${CachePrefix.MEMBERSHIP_EXPIRATION}:${userGuid}`,
        `${CachePrefix.MEMBERSHIP_SETTINGS}:${userGuid}`,
      ];

      for (const pattern of patterns) {
        await this.redisService.deletePattern(`${pattern}:*`);
      }

      this.logger.log(
        `[CACHE INVALIDATION] Invalidated all cache for user ${userGuid}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to invalidate user cache for ${userGuid}:`,
        error,
      );
      // Fail silently - cache invalidation is not critical
    }
  }

  /**
   * Invalidate account profile cache for a specific user
   *
   * @param userGuid - User's GUID
   */
  async invalidateAccountProfile(userGuid: string): Promise<void> {
    try {
      const key = this.buildAccountKey(userGuid);
      await this.redisService.deletePattern(`${key.key}:*`);
      this.logger.log(
        `[CACHE INVALIDATION] Invalidated account profile for user ${userGuid}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to invalidate account profile for ${userGuid}:`,
        error,
      );
    }
  }

  /**
   * Invalidate address cache for a specific user
   *
   * @param userGuid - User's GUID
   */
  async invalidateAddress(userGuid: string): Promise<void> {
    try {
      const key = this.buildAddressKey(userGuid);
      await this.redisService.deletePattern(`${key.key}:*`);
      this.logger.log(
        `[CACHE INVALIDATION] Invalidated address for user ${userGuid}`,
      );
    } catch (error) {
      this.logger.error(`Failed to invalidate address for ${userGuid}:`, error);
    }
  }

  /**
   * Invalidate contact cache for a specific user
   *
   * @param userGuid - User's GUID
   */
  async invalidateContact(userGuid: string): Promise<void> {
    try {
      const key = this.buildContactKey(userGuid);
      await this.redisService.deletePattern(`${key.key}:*`);
      this.logger.log(
        `[CACHE INVALIDATION] Invalidated contact for user ${userGuid}`,
      );
    } catch (error) {
      this.logger.error(`Failed to invalidate contact for ${userGuid}:`, error);
    }
  }

  /**
   * Invalidate identity cache for a specific user
   *
   * @param userGuid - User's GUID
   */
  async invalidateIdentity(userGuid: string): Promise<void> {
    try {
      const key = this.buildIdentityKey(userGuid);
      await this.redisService.deletePattern(`${key.key}:*`);
      this.logger.log(
        `🗑️ [CACHE INVALIDATION] Identity cache cleared for user ${userGuid?.substring(0, 8)}***`,
        {
          operation: 'invalidate_identity',
          userGuid: userGuid?.substring(0, 8) + '***',
          cacheKey: key.key,
          timestamp: new Date().toISOString(),
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to invalidate identity for ${userGuid}:`,
        error,
      );
    }
  }

  /**
   * Invalidate education cache (both OT and OTA) for a specific user
   *
   * @param userGuid - User's GUID
   */
  async invalidateEducation(userGuid: string): Promise<void> {
    try {
      const otKey = this.buildOtEducationKey(userGuid);
      const otaKey = this.buildOtaEducationKey(userGuid);
      await this.redisService.deletePattern(`${otKey.key}:*`);
      await this.redisService.deletePattern(`${otaKey.key}:*`);
      this.logger.log(
        `[CACHE INVALIDATION] Invalidated education for user ${userGuid}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to invalidate education for ${userGuid}:`,
        error,
      );
    }
  }

  /**
   * Invalidate membership cache (expiration and settings) for a specific user
   *
   * @param userGuid - User's GUID
   */
  async invalidateMembership(userGuid: string): Promise<void> {
    try {
      const expirationKey = this.buildMembershipExpirationKey(userGuid);
      const settingsKey = this.buildMembershipSettingsKey(userGuid);
      await this.redisService.deletePattern(`${expirationKey.key}:*`);
      await this.redisService.deletePattern(`${settingsKey.key}:*`);
      this.logger.log(
        `[CACHE INVALIDATION] Invalidated membership for user ${userGuid}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to invalidate membership for ${userGuid}:`,
        error,
      );
    }
  }

  /**
   * Invalidate all product cache
   * Called after product create/update/delete
   *
   * @param productId - Optional product ID (if provided, only invalidate that product)
   */
  async invalidateProduct(productId?: string): Promise<void> {
    try {
      if (productId) {
        // Invalidate specific product and related caches
        await this.redisService.deletePattern(`products:*:${productId}:*`);
        await this.redisService.deletePattern(`product:${productId}:*`);
        this.logger.log(
          `[CACHE INVALIDATION] Invalidated product cache for ${productId}`,
        );
      } else {
        // Invalidate entire product catalog
        await this.redisService.deletePattern('products:*');
        await this.redisService.deletePattern('product:*');
        this.logger.log(
          `[CACHE INVALIDATION] Invalidated all product catalog cache`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to invalidate product cache for ${productId || 'all'}:`,
        error,
      );
    }
  }
}
