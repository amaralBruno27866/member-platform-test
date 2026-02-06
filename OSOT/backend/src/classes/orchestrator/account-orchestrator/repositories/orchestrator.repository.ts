/**
 * Orchestrator Repository
 *
 * Redis-based repository for managing registration sessions and progress.
 * Implements data persistence, retrieval, and cleanup operations.
 */

import { Injectable, Logger } from '@nestjs/common';
import { RegistrationSessionDto, RegistrationProgressDto } from '../index';
import { RedisMapper } from '../mappers/orchestrator.mappers';
import { RedisService } from '../../../../redis/redis.service';
import { ORCHESTRATOR_CONSTANTS } from '../constants/orchestrator.constants';

@Injectable()
export class OrchestratorRepository {
  private readonly logger = new Logger(OrchestratorRepository.name);

  constructor(private readonly redisService: RedisService) {}

  // ========================================
  // SESSION OPERATIONS
  // ========================================

  /**
   * Create a new registration session
   */
  async createSession(
    session: RegistrationSessionDto,
  ): Promise<RegistrationSessionDto> {
    try {
      const keys = RedisMapper.getSessionKeys(session.sessionId);
      const sessionData = RedisMapper.toRedisSession(session);
      const progressData = RedisMapper.toRedisProgress(session.progress);

      // Set session data with TTL
      await this.redisService.set(keys.session, sessionData, {
        EX: ORCHESTRATOR_CONSTANTS.TIMEOUTS.REGISTRATION_SESSION_TTL,
      });

      // Set progress data with TTL
      await this.redisService.set(keys.progress, progressData, {
        EX: ORCHESTRATOR_CONSTANTS.TIMEOUTS.REGISTRATION_SESSION_TTL,
      });

      this.logger.log(`Session created: ${session.sessionId}`);
      return session;
    } catch (error: any) {
      this.logger.error(
        `Failed to create session ${session.sessionId}:`,
        error,
      );
      throw new Error(`Failed to create session: ${String(error)}`);
    }
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<RegistrationSessionDto | null> {
    try {
      const keys = RedisMapper.getSessionKeys(sessionId);
      const sessionData = await this.redisService.get(keys.session);

      if (!sessionData) {
        return null;
      }

      const session = RedisMapper.fromRedisSession(sessionData);

      // Also fetch progress data
      const progressData = await this.redisService.get(keys.progress);
      if (progressData) {
        session.progress = RedisMapper.fromRedisProgress(progressData);
      }

      return session;
    } catch (error) {
      this.logger.error(`Failed to get session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Update session data
   */
  async updateSession(
    sessionId: string,
    updates: Partial<RegistrationSessionDto>,
  ): Promise<RegistrationSessionDto> {
    try {
      const currentSession = await this.getSession(sessionId);
      if (!currentSession) {
        throw new Error(`Session ${sessionId} not found`);
      }

      const updatedSession = { ...currentSession, ...updates };
      const keys = RedisMapper.getSessionKeys(sessionId);
      const sessionData = RedisMapper.toRedisSession(updatedSession);

      await this.redisService.set(keys.session, sessionData, {
        EX: ORCHESTRATOR_CONSTANTS.TIMEOUTS.REGISTRATION_SESSION_TTL,
      });

      this.logger.log(`Session updated: ${sessionId}`);
      return updatedSession;
    } catch (error: any) {
      this.logger.error(`Failed to update session ${sessionId}:`, error);
      throw new Error(`Failed to update session: ${String(error)}`);
    }
  }

  /**
   * Update progress data
   */
  async updateProgress(
    sessionId: string,
    progress: RegistrationProgressDto,
  ): Promise<RegistrationProgressDto> {
    try {
      const keys = RedisMapper.getSessionKeys(sessionId);
      const progressData = RedisMapper.toRedisProgress(progress);

      await this.redisService.set(keys.progress, progressData, {
        EX: ORCHESTRATOR_CONSTANTS.TIMEOUTS.REGISTRATION_SESSION_TTL,
      });

      // Also update the session's progress reference
      await this.updateSession(sessionId, { progress });

      this.logger.log(`Progress updated: ${sessionId}`);
      return progress;
    } catch (error: any) {
      this.logger.error(`Failed to update progress ${sessionId}:`, error);
      throw new Error(`Failed to update progress: ${String(error)}`);
    }
  }

  /**
   * Delete session and all related data
   */
  async deleteSession(sessionId: string): Promise<{
    deleted: boolean;
    cleanedUpKeys: string[];
  }> {
    try {
      const keys = RedisMapper.getSessionKeys(sessionId);
      const keysToDelete = Object.values(keys);

      // Delete each key individually
      for (const key of keysToDelete) {
        await this.redisService.del(key);
      }

      this.logger.log(
        `Session deleted: ${sessionId}, cleaned ${keysToDelete.length} keys`,
      );

      return {
        deleted: true,
        cleanedUpKeys: keysToDelete,
      };
    } catch (error: any) {
      this.logger.error(`Failed to delete session ${sessionId}:`, error);
      throw new Error(`Failed to delete session: ${String(error)}`);
    }
  }

  /**
   * Store account GUID for session
   */
  async storeAccountGuid(
    sessionId: string,
    accountGuid: string,
  ): Promise<void> {
    try {
      const keys = RedisMapper.getSessionKeys(sessionId);

      await this.redisService.set(keys.accountGuid, accountGuid, {
        EX: ORCHESTRATOR_CONSTANTS.TIMEOUTS.ACCOUNT_GUID_TTL,
      });

      this.logger.log(`Account GUID stored for session: ${sessionId}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to store account GUID for session ${sessionId}:`,
        error,
      );
      throw new Error(`Failed to store account GUID: ${String(error)}`);
    }
  }

  /**
   * Get account GUID for session
   */
  async getAccountGuid(sessionId: string): Promise<string | null> {
    try {
      const keys = RedisMapper.getSessionKeys(sessionId);
      return await this.redisService.get(keys.accountGuid);
    } catch (error) {
      this.logger.error(
        `Failed to get account GUID for session ${sessionId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Get all active sessions (simplified implementation)
   */
  async getActiveSessions(
    limit: number = 100,
  ): Promise<RegistrationSessionDto[]> {
    try {
      const keys = await this.redisService.getKeys('orchestrator:session:*');

      if (keys.length === 0) {
        return [];
      }

      const sessions: RegistrationSessionDto[] = [];

      for (const key of keys.slice(0, limit)) {
        try {
          const data = await this.redisService.get(key);
          if (data) {
            const session = RedisMapper.fromRedisSession(data);
            sessions.push(session);
          }
        } catch (parseError) {
          this.logger.warn('Failed to parse session data:', parseError);
        }
      }

      return sessions.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    } catch (error) {
      this.logger.error('Failed to get active sessions:', error);
      return [];
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<{
    cleaned: number;
    errors: number;
  }> {
    let cleaned = 0;
    let errors = 0;

    try {
      const keys = await this.redisService.getKeys('orchestrator:session:*');

      for (const key of keys) {
        try {
          const sessionData = await this.redisService.get(key);
          if (sessionData) {
            const session = RedisMapper.fromRedisSession(sessionData);
            const expiresAt = new Date(session.expiresAt);

            if (expiresAt < new Date()) {
              await this.deleteSession(session.sessionId);
              cleaned++;
            }
          }
        } catch (error) {
          this.logger.warn(`Error processing session key ${key}:`, error);
          errors++;
        }
      }

      this.logger.log(
        `Cleanup completed: ${cleaned} cleaned, ${errors} errors`,
      );
    } catch (error) {
      this.logger.error('Failed to cleanup expired sessions:', error);
      errors++;
    }

    return { cleaned, errors };
  }

  /**
   * Get repository health information
   */
  async getHealthInfo(): Promise<{
    redisConnected: boolean;
    activeSessions: number;
  }> {
    try {
      // Test Redis connection by trying to get a key
      await this.redisService.get('health-check');
      const redisConnected = true;

      // Count sessions
      const sessions = await this.getActiveSessions(1000);

      return {
        redisConnected,
        activeSessions: sessions.length,
      };
    } catch (error) {
      this.logger.error('Failed to get health info:', error);
      return {
        redisConnected: false,
        activeSessions: 0,
      };
    }
  }

  /**
   * Get sessions by status for scheduler operations
   */
  async getSessionsByStatus(
    status: string,
    limit: number = 100,
  ): Promise<RegistrationSessionDto[]> {
    try {
      const sessions = await this.getActiveSessions(limit * 2); // Get more to filter

      return sessions
        .filter((session) => String(session.status) === String(status))
        .slice(0, limit);
    } catch (error) {
      this.logger.error(`Failed to get sessions by status ${status}:`, error);
      return [];
    }
  } /**
   * Get old sessions for escalation processing
   */
  async getOldSessions(
    olderThanDays: number,
  ): Promise<RegistrationSessionDto[]> {
    try {
      const sessions = await this.getActiveSessions(1000);
      const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;

      return sessions.filter((session) => {
        const createdAt = new Date(session.createdAt).getTime();
        return createdAt < cutoffTime;
      });
    } catch (error) {
      this.logger.error(
        `Failed to get old sessions (${olderThanDays} days):`,
        error,
      );
      return [];
    }
  }
}
