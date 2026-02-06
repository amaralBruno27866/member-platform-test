/**
 * Cache Configuration Interfaces
 *
 * @file cache-config.interface.ts
 * @module CacheModule
 */

/**
 * Cache key prefixes for different entity types
 */
export enum CachePrefix {
  ACCOUNT_PROFILE = 'account:profile',
  ACCOUNT_ADDRESS = 'account:address',
  ACCOUNT_CONTACT = 'account:contact',
  ACCOUNT_IDENTITY = 'account:identity',
  EDUCATION_OT = 'education:ot',
  EDUCATION_OTA = 'education:ota',
  MEMBERSHIP_EXPIRATION = 'membership:expiration',
  MEMBERSHIP_SETTINGS = 'membership:settings',
}

/**
 * Cache TTL configuration (in seconds)
 */
export interface CacheTTLConfig {
  account: number; // 30 minutes
  education: number; // 1 hour
  membership: number; // 1 hour
}

/**
 * Cache key builder result
 */
export interface CacheKey {
  key: string;
  prefix: CachePrefix;
  identifier: string;
}

/**
 * Warm-up cache options
 */
export interface WarmUpOptions {
  userGuid: string;
  businessId?: string; // Business ID (osot-XXXXXXX) for dual key caching
  userType: 'account' | 'affiliate';
  skipAccount?: boolean;
  skipEducation?: boolean;
  skipMembership?: boolean;
}

/**
 * Cache operation result
 */
export interface CacheOperationResult {
  success: boolean;
  key: string;
  cached?: boolean;
  error?: string;
}
