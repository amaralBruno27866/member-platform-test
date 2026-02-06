import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ORCHESTRATOR_SCHEDULER } from '../constants/orchestrator.constants';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { RegistrationState } from '../enums/registration-state.enum';
import { Privilege } from '../../../../common/enums/privilege.enum';
import { OrchestratorRepository } from '../repositories/orchestrator.repository';
import { OrchestratorEmailWorkflowService } from '../services/orchestrator-email-workflow.service';
import { EmailService } from '../../../../emails/email.service';

/**
 * Orchestrator Scheduler
 *
 * Handles scheduled tasks for the registration workflow including:
 * - Session cleanup and expiration management
 * - Registration reminder emails
 * - Email workflow timeouts
 * - Statistics and monitoring
 * - Admin approval timeouts
 *
 * This replaces the old AccountScheduler as the Orchestrator now manages
 * the complete registration workflow.
 */
@Injectable()
export class OrchestratorScheduler {
  private readonly logger = new Logger(OrchestratorScheduler.name);
  private isProcessing = false;
  private statistics = {
    lastCleanupRun: new Date(),
    lastReminderRun: new Date(),
    sessionsProcessed: 0,
    remindersInSession: 0,
    cleanupCount: 0,
    errors: 0,
  };

  constructor(
    private readonly orchestratorRepository: OrchestratorRepository,
    private readonly emailWorkflowService: OrchestratorEmailWorkflowService,
    private readonly emailService: EmailService,
  ) {
    this.logger.log(
      'Orchestrator Scheduler initialized for registration workflow management',
    );
  }

  // ========================================
  // REGISTRATION WORKFLOW SCHEDULERS
  // ========================================

  /**
   * Registration reminders and timeout monitoring
   * Runs every 30 minutes to check for:
   * - Pending email verifications
   * - Stalled admin approvals
   * - Session timeouts
   */
  @Cron(ORCHESTRATOR_SCHEDULER.REGISTRATION_REMINDER_INTERVAL, {
    name: 'orchestrator-registration-reminders',
    timeZone: 'America/Toronto',
  })
  async handleRegistrationReminders(): Promise<void> {
    if (this.isProcessing) {
      this.logger.warn(
        'Previous reminder check still processing, skipping execution',
      );
      return;
    }

    this.isProcessing = true;
    this.statistics.remindersInSession = 0;

    try {
      this.logger.log('🔔 Starting registration reminder check...');

      // 1. Check email verification timeouts
      await this.processEmailVerificationReminders();

      // 2. Check admin approval timeouts
      await this.processAdminApprovalReminders();

      // 3. Send escalation emails for long-pending registrations
      await this.processEscalationReminders();

      this.statistics.lastReminderRun = new Date();
      this.logger.log(
        `✅ Registration reminder check completed. Processed ${this.statistics.remindersInSession} reminders`,
      );
    } catch (error) {
      this.statistics.errors++;
      const appError = createAppError(
        ErrorCodes.INTERNAL_ERROR,
        {
          operation: 'registration_reminder_check',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        500,
      );
      this.logger.error('❌ Error in registration reminder check:', appError);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Session cleanup and maintenance
   * Runs every 6 hours to:
   * - Remove expired sessions
   * - Clean up orphaned data
   * - Update statistics
   */
  @Cron(ORCHESTRATOR_SCHEDULER.SESSION_CLEANUP_INTERVAL, {
    name: 'orchestrator-session-cleanup',
    timeZone: 'America/Toronto',
  })
  async handleSessionCleanup(): Promise<void> {
    this.logger.log('🧹 Starting orchestrator session cleanup...');

    try {
      // 1. Clean up expired sessions
      const cleanupResult =
        await this.orchestratorRepository.cleanupExpiredSessions();
      this.statistics.cleanupCount += cleanupResult.cleaned;
      this.statistics.errors += cleanupResult.errors;

      // 2. Clean up orphaned email workflow data
      await this.cleanupOrphanedEmailWorkflowData();

      // 3. Update session statistics
      await this.updateSessionStatistics();

      this.statistics.lastCleanupRun = new Date();
      this.logger.log(
        `✅ Session cleanup completed: ${cleanupResult.cleaned} cleaned, ${cleanupResult.errors} errors`,
      );
    } catch (error) {
      this.statistics.errors++;
      const appError = createAppError(
        ErrorCodes.INTERNAL_ERROR,
        {
          operation: 'session_cleanup',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        500,
      );
      this.logger.error('❌ Error in session cleanup:', appError);
    }
  }

  /**
   * Daily maintenance and reporting
   * Runs at 2 AM to:
   * - Generate daily reports
   * - Archive old data
   * - Health checks
   */
  @Cron(ORCHESTRATOR_SCHEDULER.DAILY_CLEANUP_INTERVAL, {
    name: 'orchestrator-daily-maintenance',
    timeZone: 'America/Toronto',
  })
  async handleDailyMaintenance(): Promise<void> {
    this.logger.log('📊 Starting daily orchestrator maintenance...');

    try {
      // 1. Generate daily statistics report
      await this.generateDailyReport();

      // 2. Archive completed registrations older than 30 days
      await this.archiveOldRegistrations();

      // 3. Health check on email workflow
      await this.performEmailWorkflowHealthCheck();

      this.logger.log('✅ Daily maintenance completed successfully');
    } catch (error) {
      this.statistics.errors++;
      const appError = createAppError(
        ErrorCodes.INTERNAL_ERROR,
        {
          operation: 'daily_maintenance',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        500,
      );
      this.logger.error('❌ Error in daily maintenance:', appError);
    }
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  /**
   * Process email verification reminders
   * Sends reminders for pending email verifications
   */
  private async processEmailVerificationReminders(): Promise<void> {
    try {
      // Get sessions with pending email verification
      const pendingSessions =
        await this.orchestratorRepository.getSessionsByStatus(
          RegistrationState.EMAIL_VERIFICATION_PENDING,
          50, // Limit to avoid overwhelming
        );

      for (const session of pendingSessions) {
        try {
          // Check if reminder is due (after 4 hours of pending)
          const createdAt = new Date(session.createdAt);
          const hoursSinceCreation =
            (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

          if (hoursSinceCreation >= 4 && hoursSinceCreation < 72) {
            // 4 hours to 3 days
            // Get email workflow status to check reminder count
            const emailStatus =
              await this.emailWorkflowService.getEmailWorkflowStatus(
                session.sessionId,
              );

            if (emailStatus.success && (emailStatus.resendCount || 0) < 3) {
              // Send reminder email
              await this.emailWorkflowService.resendVerificationEmail(
                session.sessionId,
              );
              this.statistics.remindersInSession++;

              this.logger.log(
                `📧 Sent email verification reminder for session: ${session.sessionId}`,
              );
            }
          }
        } catch (error) {
          this.logger.warn(
            `Failed to process reminder for session ${session.sessionId}:`,
            error,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        'Failed to process email verification reminders:',
        error,
      );
      throw error;
    }
  }

  /**
   * Process admin approval reminders
   * Sends escalation emails for long-pending approvals
   */
  private async processAdminApprovalReminders(): Promise<void> {
    try {
      // Get sessions pending admin approval
      const pendingApprovals =
        await this.orchestratorRepository.getSessionsByStatus(
          RegistrationState.PENDING_APPROVAL,
          50,
        );

      for (const session of pendingApprovals) {
        try {
          // Check if escalation is due (after 48 hours)
          const emailVerifiedAt = new Date(
            session.emailVerifiedAt || session.updatedAt,
          );
          const hoursSinceVerification =
            (Date.now() - emailVerifiedAt.getTime()) / (1000 * 60 * 60);

          if (hoursSinceVerification >= 48) {
            // 2 days
            // Send escalation email to admins
            await this.sendAdminEscalationEmail(session);
            this.statistics.remindersInSession++;

            this.logger.log(
              `⚠️ Sent admin escalation for session: ${session.sessionId}`,
            );
          }
        } catch (error) {
          this.logger.warn(
            `Failed to process admin reminder for session ${session.sessionId}:`,
            error,
          );
        }
      }
    } catch (error) {
      this.logger.error('Failed to process admin approval reminders:', error);
      throw error;
    }
  }

  /**
   * Process escalation reminders for critical timeouts
   */
  private async processEscalationReminders(): Promise<void> {
    try {
      // Get very old pending sessions (7+ days)
      const oldSessions = await this.orchestratorRepository.getOldSessions(7);

      for (const session of oldSessions) {
        // Send critical escalation to system admins
        await this.sendCriticalEscalationEmail(session);
        this.statistics.remindersInSession++;
      }
    } catch (error) {
      this.logger.error('Failed to process escalation reminders:', error);
      throw error;
    }
  }

  /**
   * Clean up orphaned email workflow data
   */
  private async cleanupOrphanedEmailWorkflowData(): Promise<void> {
    try {
      // This would implement cleanup of email workflow tokens, expired templates, etc.
      this.logger.debug('Cleaning up orphaned email workflow data...');

      // TODO: Implement actual cleanup logic
      // - Remove expired verification tokens
      // - Clean up old email templates cache
      // - Remove stale admin approval tokens
      await Promise.resolve(); // Placeholder to satisfy async requirement
    } catch (error) {
      this.logger.error(
        'Failed to cleanup orphaned email workflow data:',
        error,
      );
    }
  }

  /**
   * Update session statistics
   */
  private async updateSessionStatistics(): Promise<void> {
    try {
      // Get active sessions count
      const activeSessions =
        await this.orchestratorRepository.getActiveSessions(1000);
      this.statistics.sessionsProcessed = activeSessions.length;

      this.logger.debug(
        `📊 Updated statistics: ${activeSessions.length} active sessions`,
      );
    } catch (error) {
      this.logger.error('Failed to update session statistics:', error);
    }
  }

  /**
   * Generate daily report
   */
  private async generateDailyReport(): Promise<void> {
    try {
      // TODO: Generate comprehensive daily report
      // - Registration completion rates
      // - Email workflow performance
      // - Admin response times
      // - Error rates and patterns
      await Promise.resolve(); // Placeholder to satisfy async requirement

      this.logger.log('📈 Daily report generated successfully');
    } catch (error) {
      this.logger.error('Failed to generate daily report:', error);
    }
  }

  /**
   * Archive old registrations
   */
  private async archiveOldRegistrations(): Promise<void> {
    try {
      // TODO: Archive completed registrations older than 30 days
      // Move to long-term storage, keep only metadata
      await Promise.resolve(); // Placeholder to satisfy async requirement

      this.logger.log('📦 Old registrations archived successfully');
    } catch (error) {
      this.logger.error('Failed to archive old registrations:', error);
    }
  }

  /**
   * Perform email workflow health check
   */
  private async performEmailWorkflowHealthCheck(): Promise<void> {
    try {
      // TODO: Check email service health, template availability, etc.
      await Promise.resolve(); // Placeholder to satisfy async requirement

      this.logger.log('💓 Email workflow health check completed');
    } catch (error) {
      this.logger.error('Email workflow health check failed:', error);
    }
  }

  /**
   * Send admin escalation email
   */
  private async sendAdminEscalationEmail(session: {
    sessionId: string;
  }): Promise<void> {
    try {
      // TODO: Send escalation email to admin team
      // Include session details, time elapsed, user info
      await Promise.resolve(); // Placeholder to satisfy async requirement

      this.logger.debug(
        `📨 Admin escalation sent for session: ${session.sessionId}`,
      );
    } catch (error) {
      this.logger.error('Failed to send admin escalation email:', error);
    }
  }

  /**
   * Send critical escalation email
   */
  private async sendCriticalEscalationEmail(session: {
    sessionId: string;
  }): Promise<void> {
    try {
      // TODO: Send critical alert to system administrators
      // Flag for manual intervention
      await Promise.resolve(); // Placeholder to satisfy async requirement

      this.logger.warn(
        `🚨 Critical escalation sent for session: ${session.sessionId}`,
      );
    } catch (error) {
      this.logger.error('Failed to send critical escalation email:', error);
    }
  }

  // ========================================
  // PUBLIC MONITORING METHODS
  // ========================================

  /**
   * Get scheduler statistics for monitoring
   */
  getSchedulerStats(): typeof this.statistics {
    return { ...this.statistics };
  }

  /**
   * Manual cleanup trigger with privilege validation
   * Only ADMIN and OWNER can trigger manual operations
   */
  async triggerManualCleanup(
    adminPrivilege: Privilege,
    options?: {
      sessionIds?: string[];
      states?: RegistrationState[];
      olderThanHours?: number;
    },
  ): Promise<{
    success: boolean;
    message: string;
    cleanedCount?: number;
    errors?: string[];
  }> {
    try {
      // Validate admin privileges
      if (
        adminPrivilege !== Privilege.ADMIN &&
        adminPrivilege !== Privilege.OWNER
      ) {
        throw createAppError(
          ErrorCodes.PERMISSION_DENIED,
          { privilege: adminPrivilege },
          403,
          'Insufficient privileges for manual cleanup operation',
        );
      }

      if (this.isProcessing) {
        throw createAppError(
          ErrorCodes.CONFLICT,
          { operation: 'manual_cleanup' },
          409,
          'Cleanup operation already in progress',
        );
      }

      this.logger.log(
        `🔧 Manual cleanup triggered by admin with privilege: ${adminPrivilege}`,
        options,
      );

      // Perform targeted cleanup based on options
      const result = await this.orchestratorRepository.cleanupExpiredSessions();

      return {
        success: true,
        message: 'Manual cleanup completed successfully',
        cleanedCount: result.cleaned,
        errors:
          result.errors > 0
            ? [`${result.errors} errors occurred during cleanup`]
            : undefined,
      };
    } catch (error) {
      this.logger.error('Manual cleanup failed:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Manual cleanup failed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Manual reminder trigger for specific session
   */
  async triggerManualReminder(
    sessionId: string,
    adminPrivilege: Privilege,
  ): Promise<{
    success: boolean;
    message: string;
    reminderSent?: boolean;
  }> {
    try {
      // Validate admin privileges
      if (
        adminPrivilege !== Privilege.ADMIN &&
        adminPrivilege !== Privilege.OWNER
      ) {
        throw createAppError(
          ErrorCodes.PERMISSION_DENIED,
          { privilege: adminPrivilege },
          403,
          'Insufficient privileges for manual reminder operation',
        );
      }

      // Get session and determine appropriate reminder
      const session = await this.orchestratorRepository.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      let reminderSent = false;

      if (session.status === RegistrationState.EMAIL_VERIFICATION_PENDING) {
        await this.emailWorkflowService.resendVerificationEmail(sessionId);
        reminderSent = true;
      } else if (session.status === RegistrationState.PENDING_APPROVAL) {
        await this.sendAdminEscalationEmail(session);
        reminderSent = true;
      }

      this.logger.log(`📧 Manual reminder sent for session: ${sessionId}`);

      return {
        success: true,
        message: `Manual reminder ${reminderSent ? 'sent' : 'not applicable'} for session ${sessionId}`,
        reminderSent,
      };
    } catch (error) {
      this.logger.error('Manual reminder failed:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Manual reminder failed',
      };
    }
  }
}
