import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * Redis Module
 * Global module for Redis caching and session management
 * Exports RedisService for use across the application
 */
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
