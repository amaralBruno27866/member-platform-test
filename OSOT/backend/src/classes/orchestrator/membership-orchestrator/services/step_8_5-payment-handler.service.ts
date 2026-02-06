import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../../redis/redis.service';
import { MembershipOrchestratorEventService } from '../events/membership-orchestrator-event.service';
import { MEMBERSHIP_ORCHESTRATOR_DEFAULTS } from '../constants/membership-orchestrator.constants';

/**
 * Membership Payment Handler Service
 *
 * Handles Step 8.5: Payment processing (mock for testing)
 * - Mark payment as completed
 * - Emit payment completed event
 */
@Injectable()
export class MembershipPaymentHandlerService {
  private readonly logger = new Logger(MembershipPaymentHandlerService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly eventsService: MembershipOrchestratorEventService,
  ) {}

  /**
   * Mock payment approval for testing (skip external gateway)
   */
  async markPaymentCompletedMock(
    sessionId: string,
    userId: string,
    amount: number,
  ): Promise<void> {
    const _operationId = `mock_payment_${Date.now()}`;

    try {
      // Get session from Redis
      const sessionData = await this.redisService.get(
        `membership-orchestrator:session:${sessionId}`,
      );

      if (!sessionData) {
        throw new Error('Session not found');
      }

      const session = JSON.parse(sessionData) as Record<string, any>;

      if (session.accountId !== userId) {
        throw new Error('Session does not belong to user');
      }

      const now = new Date().toISOString();

      const updatedProgress: Record<string, any> = {
        ...(session.progress as Record<string, any>),
        payment: {
          status: 'completed',
          transactionId: `mock_${Date.now()}`,
          paymentIntentId: `mock_intent_${sessionId}`,
          paidAt: now,
        },
        percentage: 85,
        updatedAt: now,
      };

      const updates: Record<string, any> = {
        status: 'PAYMENT_COMPLETED',
        updatedAt: now,
        progress: updatedProgress,
      };

      // Update session in Redis
      await this.redisService.set(
        `membership-orchestrator:session:${sessionId}`,
        JSON.stringify({ ...session, ...updates }),
        { EX: 172800 }, // 48 hours
      );

      this.eventsService.emitPaymentCompleted({
        type: 'membership-orchestrator.payment.completed' as const,
        sessionId,
        accountId: userId,
        amount,
        currency: MEMBERSHIP_ORCHESTRATOR_DEFAULTS.DEFAULT_CURRENCY,
        paymentMethod: 'paypal',
        transactionId: (updatedProgress.payment as Record<string, any>)
          .transactionId as string,
        paymentIntentId: (updatedProgress.payment as Record<string, any>)
          .paymentIntentId as string,
        processingDuration: 0,
        timestamp: new Date(),
      });

      this.logger.log(
        `✅ Mock payment completed - Session: ${sessionId}, Amount: ${amount} ${MEMBERSHIP_ORCHESTRATOR_DEFAULTS.DEFAULT_CURRENCY}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to mark payment completed`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Validate payment is completed before proceeding
   */
  async validatePaymentCompleted(sessionId: string): Promise<boolean> {
    const sessionData = await this.redisService.get(
      `membership-orchestrator:session:${sessionId}`,
    );

    if (!sessionData) {
      return false;
    }

    const session = JSON.parse(sessionData) as Record<string, any>;

    const progress = session.progress as Record<string, any> | undefined;
    const payment = progress?.payment as Record<string, any> | undefined;

    return payment?.status === 'completed';
  }
}
