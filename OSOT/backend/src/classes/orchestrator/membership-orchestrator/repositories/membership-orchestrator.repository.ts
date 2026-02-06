/**
 * Membership Orchestrator Repository
 *
 * Redis-based repository for managing membership registration sessions and progress.
 * Implements data persistence, retrieval, and cleanup operations.
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  MembershipSessionDto,
  MembershipProgressDto,
  MEMBERSHIP_ORCHESTRATOR_REDIS_KEYS,
  MEMBERSHIP_ORCHESTRATOR_TIMEOUTS,
} from '../index';
import {
  ACCOUNT_REPOSITORY,
  AccountRepository,
} from '../../../user-account/account/interfaces/account-repository.interface';
import {
  MembershipCategoryRepositoryService,
  MEMBERSHIP_CATEGORY_REPOSITORY,
} from '../../../membership/membership-category/repositories/membership-category.repository';

// Helper to get Redis keys
const getRedisKeys = (sessionId: string) => ({
  session: MEMBERSHIP_ORCHESTRATOR_REDIS_KEYS.MEMBERSHIP_SESSION(sessionId),
  progress: MEMBERSHIP_ORCHESTRATOR_REDIS_KEYS.MEMBERSHIP_PROGRESS(sessionId),
  lock: MEMBERSHIP_ORCHESTRATOR_REDIS_KEYS.SESSION_LOCK(sessionId),
  retryQueue: MEMBERSHIP_ORCHESTRATOR_REDIS_KEYS.RETRY_QUEUE(sessionId),
});
import { RedisService } from '../../../../redis/redis.service';

@Injectable()
export class MembershipOrchestratorRepository {
  private readonly logger = new Logger(MembershipOrchestratorRepository.name);

  constructor(
    private readonly redisService: RedisService,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepository,
    @Inject(MEMBERSHIP_CATEGORY_REPOSITORY)
    private readonly membershipCategoryRepository: MembershipCategoryRepositoryService,
  ) {}

  // ========================================
  // SESSION OPERATIONS
  // ========================================

  /**
   * Create a new membership registration session
   */
  async createSession(
    session: MembershipSessionDto,
  ): Promise<MembershipSessionDto> {
    try {
      const keys = getRedisKeys(session.sessionId);

      // Store session data with TTL
      await this.redisService.set(keys.session, JSON.stringify(session), {
        EX: MEMBERSHIP_ORCHESTRATOR_TIMEOUTS.MEMBERSHIP_SESSION_TTL,
      });

      // Store progress data separately for quick access
      await this.redisService.set(
        keys.progress,
        JSON.stringify(session.progress),
        {
          EX: MEMBERSHIP_ORCHESTRATOR_TIMEOUTS.MEMBERSHIP_SESSION_TTL,
        },
      );

      this.logger.log(`Membership session created: ${session.sessionId}`);
      return session;
    } catch (error: any) {
      this.logger.error(
        `Failed to create membership session ${session.sessionId}:`,
        error,
      );
      throw new Error(`Failed to create session: ${String(error)}`);
    }
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<MembershipSessionDto | null> {
    try {
      const keys = getRedisKeys(sessionId);
      const sessionData = await this.redisService.get(keys.session);

      if (!sessionData) {
        return null;
      }

      const session: MembershipSessionDto = JSON.parse(
        sessionData,
      ) as MembershipSessionDto;

      // Fetch latest progress data
      const progressData = await this.redisService.get(keys.progress);

      if (progressData) {
        session.progress = JSON.parse(progressData) as MembershipProgressDto;
      }

      return session;
    } catch (error) {
      this.logger.error(
        `Failed to get membership session ${sessionId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Update session data
   */
  async updateSession(
    sessionId: string,
    updates: Partial<MembershipSessionDto>,
  ): Promise<MembershipSessionDto> {
    try {
      const currentSession = await this.getSession(sessionId);
      if (!currentSession) {
        throw new Error(`Membership session ${sessionId} not found`);
      }

      const updatedSession = {
        ...currentSession,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      const keys = getRedisKeys(sessionId);
      await this.redisService.set(
        keys.session,
        JSON.stringify(updatedSession),
        {
          EX: MEMBERSHIP_ORCHESTRATOR_TIMEOUTS.MEMBERSHIP_SESSION_TTL,
        },
      );

      this.logger.log(`Membership session updated: ${sessionId}`);
      return updatedSession;
    } catch (error: any) {
      this.logger.error(
        `Failed to update membership session ${sessionId}:`,
        error,
      );
      throw new Error(`Failed to update session: ${String(error)}`);
    }
  }

  /**
   * Update progress data
   */
  async updateProgress(
    sessionId: string,
    progress: MembershipProgressDto,
  ): Promise<MembershipProgressDto> {
    try {
      const keys = getRedisKeys(sessionId);
      const updatedProgress = {
        ...progress,
        updatedAt: new Date().toISOString(),
      };

      await this.redisService.set(
        keys.progress,
        JSON.stringify(updatedProgress),
        {
          EX: MEMBERSHIP_ORCHESTRATOR_TIMEOUTS.MEMBERSHIP_SESSION_TTL,
        },
      );

      // Also update the session's progress reference
      await this.updateSession(sessionId, { progress: updatedProgress });

      this.logger.log(`Membership progress updated: ${sessionId}`);
      return updatedProgress;
    } catch (error: any) {
      this.logger.error(
        `Failed to update membership progress ${sessionId}:`,
        error,
      );
      throw new Error(`Failed to update progress: ${String(error)}`);
    }
  }

  /**
   * Delete session and all related data
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const keys = getRedisKeys(sessionId);

      // Delete all session-related keys (del accepts only one key)
      await this.redisService.del(keys.session);
      await this.redisService.del(keys.progress);
      await this.redisService.del(keys.lock);
      await this.redisService.del(keys.retryQueue);

      this.logger.log(`Membership session deleted: ${sessionId}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete membership session ${sessionId}:`,
        error,
      );
      throw new Error(`Failed to delete session: ${String(error)}`);
    }
  }

  /**
   * Check if session exists
   */
  async sessionExists(sessionId: string): Promise<boolean> {
    try {
      const keys = getRedisKeys(sessionId);
      const sessionData = await this.redisService.get(keys.session);
      return sessionData !== null;
    } catch (error) {
      this.logger.error(
        `Failed to check membership session existence ${sessionId}:`,
        error,
      );
      return false;
    }
  }

  // Note: TTL management methods removed as RedisService doesn't expose ttl/expire
  // TTL is managed automatically when setting keys with EX option

  // ========================================
  // LOCK OPERATIONS (for concurrent safety)
  // ========================================

  /**
   * Acquire processing lock for session
   */
  async acquireLock(
    sessionId: string,
    ttl: number = MEMBERSHIP_ORCHESTRATOR_TIMEOUTS.PROGRESS_LOCK_TTL,
  ): Promise<boolean> {
    try {
      const keys = getRedisKeys(sessionId);

      // Check if lock already exists
      const existingLock = await this.redisService.get(keys.lock);
      if (existingLock) {
        return false;
      }

      // Set lock
      await this.redisService.set(keys.lock, '1', { EX: ttl });
      this.logger.debug(`Lock acquired: ${sessionId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to acquire lock ${sessionId}:`, error);
      throw new Error(`Failed to acquire lock: ${String(error)}`);
    }
  }

  /**
   * Release processing lock
   */
  async releaseLock(sessionId: string): Promise<void> {
    try {
      const keys = getRedisKeys(sessionId);
      await this.redisService.del(keys.lock);
      this.logger.debug(`Lock released: ${sessionId}`);
    } catch (error) {
      this.logger.error(`Failed to release lock ${sessionId}:`, error);
      throw new Error(`Failed to release lock: ${String(error)}`);
    }
  }

  /**
   * Check if session is locked
   */
  async isLocked(sessionId: string): Promise<boolean> {
    try {
      const keys = getRedisKeys(sessionId);
      const lockData = await this.redisService.get(keys.lock);
      return lockData !== null;
    } catch (error) {
      this.logger.error(`Failed to check lock ${sessionId}:`, error);
      return false;
    }
  }

  // ========================================
  // RETRY QUEUE OPERATIONS
  // ========================================

  /**
   * Add session to retry queue
   */
  async addToRetryQueue(sessionId: string, retryAt: Date): Promise<boolean> {
    try {
      const keys = getRedisKeys(sessionId);
      const queueKey = keys.retryQueue;
      const queueData = {
        sessionId,
        retryAt: retryAt.toISOString(),
        addedAt: new Date().toISOString(),
      };

      await this.redisService.set(queueKey, JSON.stringify(queueData), {
        EX: MEMBERSHIP_ORCHESTRATOR_TIMEOUTS.RETRY_QUEUE_TTL,
      });

      this.logger.log(`Session added to retry queue: ${sessionId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to add to retry queue ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Remove session from retry queue
   */
  async removeFromRetryQueue(sessionId: string): Promise<void> {
    try {
      const keys = getRedisKeys(sessionId);
      await this.redisService.del(keys.retryQueue);
      this.logger.log(`Session removed from retry queue: ${sessionId}`);
    } catch (error) {
      this.logger.error(
        `Failed to remove from retry queue ${sessionId}:`,
        error,
      );
      throw new Error(`Failed to remove from retry queue: ${String(error)}`);
    }
  }

  // Note: Batch operations like getAllActiveSessions and cleanupExpiredSessions
  // are not implemented as RedisService doesn't expose keys() method.
  // Cleanup will be handled by Redis TTL expiration automatically.

  // ========================================
  // DATAVERSE PROXY METHODS (For Step 1)
  // ========================================

  /**
   * Find account by ID (proxy to AccountRepository)
   * Used in Step 1 to check osot_active_member status
   * Used in Step 2 to get osot_account_group
   */
  async findAccountById(accountId: string): Promise<{
    osot_table_accountid: string;
    osot_active_member: boolean;
    osot_account_group: number; // AccountGroup enum
  } | null> {
    const account = await this.accountRepository.findById(accountId);

    if (!account) {
      return null;
    }

    return {
      osot_table_accountid: account.osot_table_accountid || accountId,
      osot_active_member: account.osot_active_member,
      osot_account_group: account.osot_account_group,
    };
  }

  /**
   * Find all membership-category records for a user (any year)
   * Used in Step 1 to determine NEW vs RENEWAL
   */
  async findCategoriesByUser(
    userId: string,
    userType: 'account' | 'affiliate',
  ): Promise<Array<{ osot_membership_year: string }> | null> {
    const categories = await this.membershipCategoryRepository.findByUser(
      userId,
      userType,
    );

    return (categories || [])
      .filter((category) => Boolean(category.osot_membership_year))
      .map((category) => ({
        osot_membership_year: category.osot_membership_year,
      }));
  }
}
