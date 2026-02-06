/**
 * Cache Module
 *
 * Provides centralized caching functionality for user-related data.
 * Uses Redis as the caching backend.
 *
 * @module CacheModule
 */

import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache.service';
import { RedisService } from '../redis/redis.service';

/**
 * Global module to make CacheService available throughout the app
 * without needing explicit imports in every module
 */
@Global()
@Module({
  providers: [CacheService, RedisService],
  exports: [CacheService],
})
export class CacheModule {}
