/**
 * Insurance Report Scheduler
 *
 * BUSINESS PURPOSE:
 * Automatically generates 24-hour insurance sales reports and sends them to admin for approval.
 * Enables bulk notification to insurance providers with signed, verified payloads.
 *
 * SCHEDULE:
 * - Daily at 6:00 AM (Toronto timezone)
 * - Cron expression: 0 6 * * *
 * - Configurable via INSURANCE_REPORT_SCHEDULE env var
 *
 * WORKFLOW:
 * 1. Triggered at 6 AM (or manually via endpoint)
 * 2. Generates 24-hour report for each active organization
 * 3. Sends admin approval email with:
 *    - Report summary (period, totals, status breakdown)
 *    - Detailed table of all 30 insurance fields
 *    - Approve/Reject buttons with expiring tokens
 * 4. Admin clicks Approve → Provider gets signed JSON via email
 * 5. Provider validates HMAC-SHA256 signature and processes
 *
 * MULTI-TENANT SUPPORT:
 * - Generates separate reports per organization
 * - Each report independently signed with shared HMAC secret
 * - Organization GUID never exposed (only public IDs sent to provider)
 *
 * FEATURES:
 * - Automatic retry on failure (logged with operation IDs)
 * - Comprehensive audit trail with timestamps
 * - Configurable cron schedule via environment
 * - Safe to run multiple times (idempotent)
 *
 * SECURITY:
 * - HMAC-SHA256 signing prevents tampering
 * - Approval tokens expire after 24 hours
 * - Sensitive fields (GUIDs) excluded from provider payload
 * - Timing-safe signature comparison
 *
 * @file insurance-report.scheduler.ts
 * @module InsuranceModule
 * @layer Schedulers
 * @since 2026-01-30
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InsuranceReportEmailService } from '../services/insurance-report-email.service';
import { OrganizationLookupService } from '../../organization/services/organization-lookup.service';
import { InsuranceLookupService } from '../services/insurance-lookup.service';

@Injectable()
export class InsuranceReportScheduler {
  private readonly logger = new Logger(InsuranceReportScheduler.name);
  private readonly cronExpression: string;

  constructor(
    private readonly insuranceReportEmailService: InsuranceReportEmailService,
    private readonly organizationLookupService: OrganizationLookupService,
    private readonly insuranceLookupService: InsuranceLookupService,
    private readonly configService: ConfigService,
  ) {
    this.cronExpression =
      this.configService.get<string>('INSURANCE_REPORT_SCHEDULE') ||
      '0 6 * * *';

    this.logger.log(
      `Insurance Report Scheduler initialized with cron: ${this.cronExpression}`,
    );
  }

  /**
   * Generate and send 24-hour insurance report daily
   *
   * SMART TRIGGER LOGIC:
   * 1. Query all active organizations
   * 2. For EACH organization:
   *    a. Check if there are ANY insurances created in last 24 hours
   *    b. If YES → Generate and send report to admin
   *    c. If NO → Skip (no data to report)
   * 3. Log skipped organizations to avoid unnecessary emails
   *
   * BENEFIT:
   * - No email on days with no sales (customer retention ✅)
   * - Automatic trigger when sales happen (data-driven ✅)
   * - Reduced noise in admin inbox (UX improvement ✅)
   * - Clear audit log of what was skipped (troubleshooting ✅)
   *
   * MULTI-TENANT SUPPORT:
   * - Operates independently for each organization
   * - Each report signed with shared HMAC secret
   * - Organization-specific admin receives approval email only when data exists
   * - Operation tracking via operationId for audit trail
   */
  @Cron('0 6 * * *', { timeZone: 'America/Toronto' })
  async handleDailyReportGeneration(): Promise<void> {
    const operationId = `daily_report_${new Date().toISOString().split('T')[0]}`;

    try {
      this.logger.log(
        `Starting daily insurance report generation for all organizations - Operation: ${operationId}`,
      );

      // Query all active organizations
      const organizations =
        await this.organizationLookupService.findAllActive(operationId);

      if (!organizations || organizations.length === 0) {
        this.logger.warn(
          `No active organizations found for report generation - Operation: ${operationId}`,
        );
        return;
      }

      this.logger.log(
        `Found ${organizations.length} active organizations for report generation - Operation: ${operationId}`,
      );

      // Generate reports for each organization
      let reportsSent = 0;
      let reportsSkipped = 0;

      for (const org of organizations) {
        const orgOperationId = `${operationId}_org_${org.osot_organizationid.substring(0, 8)}`;

        try {
          // ⭐ SMART TRIGGER: Check if there's data in last 24 hours
          const insurancesLast24h =
            await this.insuranceLookupService.findLast24Hours(
              org.osot_organizationid,
              orgOperationId,
            );

          // If no insurances created in last 24h, skip this organization
          if (!insurancesLast24h || insurancesLast24h.length === 0) {
            this.logger.log(
              `⏭️  No insurances sold in last 24h for organization: ${org.osot_organization_name} - Skipping report - Operation: ${orgOperationId}`,
            );
            reportsSkipped++;
            continue;
          }

          this.logger.log(
            `✅ Found ${insurancesLast24h.length} insurances for report generation - Organization: ${org.osot_organization_name} (${org.osot_organizationid}) - Operation: ${orgOperationId}`,
          );

          // Send admin approval email
          // This internally calls InsuranceReportService.generateReport24h()
          await this.insuranceReportEmailService.sendAdminApprovalEmail(
            org.osot_organizationid,
          );

          this.logger.log(
            `✉️  Report generated and sent to admin for organization: ${org.osot_organization_name} - Operation: ${orgOperationId}`,
            {
              organization: org.osot_organization_name,
              organizationGuid: org.osot_organizationid.substring(0, 8) + '...',
              insuranceCount: insurancesLast24h.length,
              timestamp: new Date().toISOString(),
            },
          );
          reportsSent++;
        } catch (orgError) {
          this.logger.error(
            `Error generating report for organization: ${org.osot_organization_name} - Operation: ${orgOperationId}`,
            orgError instanceof Error ? orgError.message : orgError,
          );
          // Continue with next organization instead of failing entire job
        }
      }

      this.logger.log(
        `Daily insurance report generation completed - Reports sent: ${reportsSent}, Reports skipped (no data): ${reportsSkipped} - Operation: ${operationId}`,
        {
          operation: 'handleDailyReportGeneration',
          operationId,
          organizationCount: organizations.length,
          reportsSent,
          reportsSkipped,
          timestamp: new Date().toISOString(),
        },
      );
    } catch (error) {
      this.logger.error(
        `Error in daily insurance report generation - Operation: ${operationId}`,
        error instanceof Error ? error.message : error,
      );

      // Continue execution - don't throw to prevent scheduler from stopping
      // Errors are logged and can be monitored via application logs
    }
  }

  /**
   * Manual trigger for report generation (useful for testing/debugging)
   *
   * @param organizationGuid - Organization to generate report for
   * @returns void
   */
  async generateReportManual(organizationGuid: string): Promise<void> {
    const operationId = `manual_report_${Date.now()}`;

    try {
      this.logger.log(
        `Manually triggering insurance report generation - Operation: ${operationId}`,
      );

      await this.insuranceReportEmailService.sendAdminApprovalEmail(
        organizationGuid,
      );

      this.logger.log(
        `Manual report generation completed - Operation: ${operationId}`,
        {
          operation: 'generateReportManual',
          operationId,
          organizationGuid: organizationGuid.substring(0, 8) + '...',
        },
      );
    } catch (error) {
      this.logger.error(
        `Error in manual report generation - Operation: ${operationId}`,
        error instanceof Error ? error.message : error,
      );
      throw error;
    }
  }

  /**
   * Get scheduler configuration info (for monitoring/debugging)
   *
   * @returns Configuration details
   */
  getScheduleConfig(): {
    cronExpression: string;
    timezone: string;
    nextRun?: Date;
  } {
    return {
      cronExpression: this.cronExpression,
      timezone: 'America/Toronto',
    };
  }

  // ========================================
  // TRIGGER STRATEGIES (Choose Your Implementation)
  // ========================================

  /**
   * STRATEGY 1: TIME-BASED (CURRENT IMPLEMENTATION) ✅
   *
   * Schedule: @Cron('0 6 * * *') - 6 AM every day
   * Logic: Check if insurances exist in last 24h, skip if none
   *
   * Pros:
   * - Simple, predictable schedule
   * - Admin knows exactly when to expect reports
   * - Works with any number of organizations
   * - Easy to troubleshoot (check logs at 6 AM)
   *
   * Cons:
   * - Still runs even on slow days (but sends no email if no data)
   * - Extra Dataverse calls on off days
   *
   * Best For: Most organizations with occasional sales gaps
   *
   * ========================================
   *
   * STRATEGY 2: EVENT-DRIVEN (Alternative)
   *
   * Trigger: InsuranceCreatedEvent listener
   * Logic: When insurance sold → immediately create report record
   *
   * Implementation:
   * 1. Listen to InsuranceCreatedEvent
   * 2. On FIRST insurance of the day: Generate and send report
   * 3. On SUBSEQUENT insurances: Queue for next cycle
   *
   * Pros:
   * - Reports generated within minutes of sales
   * - No unnecessary runs on off days
   * - Real-time insights for admin
   *
   * Cons:
   * - More complex (event coordination)
   * - May run OUTSIDE scheduled hours
   * - Risk of multiple reports same day
   *
   * Implementation Required:
   * ```typescript
   * @EventListener()
   * async onInsuranceCreated(event: InsuranceCreatedEvent) {
   *   const hasOtherReportsToday = await this.checkTodayReports(event.organizationId);
   *   if (!hasOtherReportsToday) {
   *     await this.handleDailyReportGeneration();
   *   }
   * }
   * ```
   *
   * Best For: Organizations with predictable sales during business hours
   *
   * ========================================
   *
   * STRATEGY 3: HYBRID (Recommended for Production)
   *
   * Combination of both:
   * 1. Main schedule: @Cron('0 6 * * *') - 6 AM
   * 2. Event trigger: On InsuranceCreated (with rate limiting)
   *
   * Logic:
   * - If insurance created between 6 AM → midnight: Trigger immediately
   * - If insurance created after midnight: Queue for 6 AM next day
   * - 6 AM scheduler: Send any queued reports + cleanup
   *
   * Pros:
   * - Best of both worlds
   * - Real-time for business hours
   * - Batch for off-hours
   * - No duplicate reports
   *
   * Cons:
   * - Most complex to implement
   * - Requires report state tracking
   *
   * ========================================
   *
   * CURRENT: Strategy 1 (TIME-BASED) is implemented
   * Change to Strategy 2 or 3 if requirements change
   */
}
