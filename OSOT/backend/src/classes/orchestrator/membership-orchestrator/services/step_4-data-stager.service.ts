import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../../redis/redis.service';
import { MEMBERSHIP_ORCHESTRATOR_TIMEOUTS } from '../constants/membership-orchestrator.constants';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { createAppError } from '../../../../common/errors/error.factory';

/**
 * Membership Data Staging Service
 *
 * Handles Step 4: Store membership data in Redis
 * - Store category, employment, practices, preferences
 * - Retrieve staged data
 */
@Injectable()
export class MembershipDataStagingService {
  private readonly logger = new Logger(MembershipDataStagingService.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * Store category data in Redis
   */
  async stageCategory(sessionId: string, categoryData: any): Promise<void> {
    try {
      await this.redisService.set(
        `membership:session:${sessionId}:category`,
        JSON.stringify(categoryData),
        { EX: MEMBERSHIP_ORCHESTRATOR_TIMEOUTS.MEMBERSHIP_SESSION_TTL },
      );

      this.logger.log(`✅ Category data staged`);
    } catch (error) {
      this.logger.error(`❌ Failed to stage category data`, error);
      throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
        message: 'Failed to stage category data',
        sessionId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Store employment data in Redis (if needed)
   */
  async stageEmployment(sessionId: string, employmentData: any): Promise<void> {
    try {
      await this.redisService.set(
        `membership:session:${sessionId}:employment`,
        JSON.stringify(employmentData),
        { EX: MEMBERSHIP_ORCHESTRATOR_TIMEOUTS.MEMBERSHIP_SESSION_TTL },
      );

      this.logger.log(`✅ Employment data staged`);
    } catch (error) {
      this.logger.error(`❌ Failed to stage employment data`, error);
      throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
        message: 'Failed to stage employment data',
        sessionId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Store practices data in Redis (if needed)
   */
  async stagePractices(sessionId: string, practicesData: any): Promise<void> {
    try {
      await this.redisService.set(
        `membership:session:${sessionId}:practices`,
        JSON.stringify(practicesData),
        { EX: MEMBERSHIP_ORCHESTRATOR_TIMEOUTS.MEMBERSHIP_SESSION_TTL },
      );

      this.logger.log(`✅ Practices data staged`);
    } catch (error) {
      this.logger.error(`❌ Failed to stage practices data`, error);
      throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
        message: 'Failed to stage practices data',
        sessionId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Store preferences data in Redis (if provided)
   */
  async stagePreferences(
    sessionId: string,
    preferencesData: any,
  ): Promise<void> {
    try {
      await this.redisService.set(
        `membership:session:${sessionId}:preferences`,
        JSON.stringify(preferencesData),
        { EX: MEMBERSHIP_ORCHESTRATOR_TIMEOUTS.MEMBERSHIP_SESSION_TTL },
      );

      this.logger.log(`✅ Preferences data staged`);
    } catch (error) {
      this.logger.error(`❌ Failed to stage preferences data`, error);
      throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
        message: 'Failed to stage preferences data',
        sessionId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Retrieve staged category data
   */
  async getCategory(sessionId: string): Promise<Record<string, any> | null> {
    const data = await this.redisService.get(
      `membership:session:${sessionId}:category`,
    );
    return data ? (JSON.parse(data) as Record<string, any>) : null;
  }

  /**
   * Retrieve staged employment data
   */
  async getEmployment(sessionId: string): Promise<Record<string, any> | null> {
    const data = await this.redisService.get(
      `membership:session:${sessionId}:employment`,
    );
    return data ? (JSON.parse(data) as Record<string, any>) : null;
  }

  /**
   * Retrieve staged practices data
   */
  async getPractices(sessionId: string): Promise<Record<string, any> | null> {
    const data = await this.redisService.get(
      `membership:session:${sessionId}:practices`,
    );
    return data ? (JSON.parse(data) as Record<string, any>) : null;
  }

  /**
   * Retrieve staged preferences data
   */
  async getPreferences(sessionId: string): Promise<Record<string, any> | null> {
    const data = await this.redisService.get(
      `membership:session:${sessionId}:preferences`,
    );
    return data ? (JSON.parse(data) as Record<string, any>) : null;
  }

  /**
   * Retrieve all staged data
   */
  async getAllStagedData(sessionId: string): Promise<{
    category: Record<string, any> | null;
    employment: Record<string, any> | null;
    practices: Record<string, any> | null;
    preferences: Record<string, any> | null;
  }> {
    const [category, employment, practices, preferences] = await Promise.all([
      this.getCategory(sessionId),
      this.getEmployment(sessionId),
      this.getPractices(sessionId),
      this.getPreferences(sessionId),
    ]);

    return { category, employment, practices, preferences };
  }
}
