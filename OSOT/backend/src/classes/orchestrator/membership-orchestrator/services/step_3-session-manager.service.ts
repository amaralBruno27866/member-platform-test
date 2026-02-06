import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../../redis/redis.service';
import { MembershipOrchestratorRepository } from '../repositories/membership-orchestrator.repository';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';

/**
 * Membership Session Manager Service
 *
 * Handles Step 3: Create and manage Redis sessions
 * - Create initial session with metadata
 * - Retrieve sessions with validation
 * - Update session state
 */
@Injectable()
export class MembershipSessionManagerService {
  private readonly logger = new Logger(MembershipSessionManagerService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly repository: MembershipOrchestratorRepository,
  ) {}

  /**
   * Create Redis session with initial state
   */
  async createSession(
    sessionId: string,
    dto: Record<string, any>,
    validationResult: {
      membershipType: 'NEW' | 'RENEWAL';
      accountGroup: number;
      previousYears: string[];
    },
    userGroupResult: {
      usersGroup: number | null;
      needsEligibility: boolean;
      membershipCategory: number | null;
      needsEmployment: boolean;
      needsPractices: boolean;
    },
  ): Promise<Record<string, any>> {
    const operationId = `create_session_${Date.now()}`;

    try {
      // Calculate expiration time (48 hours from now)
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

      // Create session object with all determined context
      const sessionData = {
        sessionId,
        accountId: (dto.accountId as string) || '',
        status: 'initiated',
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
      };

      // Enhance session with determined context
      const enrichedSession = {
        ...sessionData,
        metadata: {
          membershipType: validationResult.membershipType,
          usersGroup: userGroupResult.usersGroup,
          membershipCategory: userGroupResult.membershipCategory,
          needsEligibility: userGroupResult.needsEligibility,
          needsEmployment: userGroupResult.needsEmployment,
          needsPractices: userGroupResult.needsPractices,
          previousYears: validationResult.previousYears,
          accountGroup: validationResult.accountGroup,
        },
      };

      // Store session in Redis (48 hours = 172800 seconds)
      const sessionKey = `membership-orchestrator:session:${sessionId}`;
      await this.redisService.set(sessionKey, JSON.stringify(enrichedSession), {
        EX: 172800,
      });

      this.logger.log(
        `✅ Session created in Redis - TTL: 48h, Expires: ${expiresAt.toISOString()} (Operation: ${operationId})`,
      );

      return enrichedSession;
    } catch (error) {
      this.logger.error(
        `❌ Failed to create session`,
        error instanceof Error ? error.stack : String(error),
      );

      throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
        message: 'Failed to create membership session',
        operationId,
        sessionId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Retrieve session from Redis with validation
   */
  async getSession(sessionId: string): Promise<Record<string, any>> {
    try {
      const sessionKey = `membership-orchestrator:session:${sessionId}`;
      const sessionData = await this.redisService.get(sessionKey);

      if (!sessionData) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: 'Membership session not found or expired',
          sessionId,
        });
      }

      return JSON.parse(sessionData as unknown as string) as Record<
        string,
        any
      >;
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.NOT_FOUND, {
        message: 'Failed to retrieve session',
        sessionId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Validate session ownership and state
   */
  async validateSessionOwnership(
    sessionId: string,
    userId: string,
  ): Promise<Record<string, any>> {
    const session = await this.getSession(sessionId);

    if (session.accountId !== userId) {
      throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
        message: 'Session does not belong to authenticated user',
        sessionId,
        userId,
      });
    }

    // Check if session is in terminal state
    if (
      session.status === 'completed' ||
      session.status === 'failed' ||
      session.status === 'cancelled'
    ) {
      throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
        message: `Cannot proceed with session in ${session.status} state`,
        sessionId,
        status: session.status,
      });
    }

    return session;
  }

  /**
   * Update session state
   */
  async updateSessionState(
    sessionId: string,
    newStatus: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      const session = await this.getSession(sessionId);

      const updates: Record<string, any> = {
        ...session,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };

      if (metadata) {
        Object.assign(updates, metadata);
      }

      const sessionKey = `membership-orchestrator:session:${sessionId}`;
      await this.redisService.set(sessionKey, JSON.stringify(updates), {
        EX: 172800,
      });

      this.logger.log(`✅ Session state updated - Status: ${newStatus}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to update session state`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Cleanup session from Redis
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const sessionKey = `membership-orchestrator:session:${sessionId}`;
      await this.redisService.del(sessionKey);

      // Clean up related keys
      await this.redisService.del(
        `membership-orchestrator:account-reference:${sessionId}`,
      );
      await this.redisService.del(
        `membership-orchestrator:pricing-cache:${sessionId}`,
      );
      await this.redisService.del(
        `membership-orchestrator:product-selection:${sessionId}`,
      );

      this.logger.log(`✅ Session deleted and cleanup complete`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to delete session`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
