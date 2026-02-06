/**
 * Insurance Report Email Service
 *
 * Handles sending insurance report emails to admin and insurance providers.
 * Uses InsuranceReportService for report generation and EmailService for delivery.
 *
 * RESPONSIBILITIES:
 * - Send admin approval email with 24h report summary + approve/reject buttons
 * - Send provider notification email with signed JSON payload
 * - Track email delivery and errors
 *
 * @file insurance-report-email.service.ts
 * @module InsuranceModule
 * @layer Services
 * @since 2026-01-30
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../../../../emails/email.service';
import { InsuranceReportService } from './insurance-report.service';
import { InsuranceReportPayloadDto } from '../dtos/insurance-report-payload.dto';

@Injectable()
export class InsuranceReportEmailService {
  private readonly logger = new Logger(InsuranceReportEmailService.name);
  private readonly adminEmail: string;
  private readonly providerEmail: string;
  private readonly appBaseUrl: string;

  constructor(
    private readonly emailService: EmailService,
    private readonly insuranceReportService: InsuranceReportService,
    private readonly configService: ConfigService,
  ) {
    this.adminEmail =
      this.configService.get<string>('INSURANCE_REPORT_ADMIN_EMAIL') || '';
    this.providerEmail =
      this.configService.get<string>('INSURANCE_PROVIDER_EMAIL') || '';
    this.appBaseUrl =
      this.configService.get<string>('APP_BASE_URL') || 'http://localhost:3000';

    if (!this.adminEmail) {
      this.logger.warn(
        'INSURANCE_REPORT_ADMIN_EMAIL not configured - admin emails will fail',
      );
    }
    if (!this.providerEmail) {
      this.logger.warn(
        'INSURANCE_PROVIDER_EMAIL not configured - provider emails will fail',
      );
    }
  }

  /**
   * Send admin approval email with 24-hour report
   *
   * @param organizationGuid - Organization to send report for
   * @param approvalTokenHash - Hashed approval token for tracking
   * @param rejectionTokenHash - Hashed rejection token for tracking
   * @returns void
   */
  async sendAdminApprovalEmail(
    organizationGuid: string,
    _approvalTokenHash?: string,
    _rejectionTokenHash?: string,
  ): Promise<void> {
    const operationId = `send_admin_approval_${Date.now()}`;

    try {
      this.logger.log(
        `Sending admin approval email for org ${organizationGuid} - Operation: ${operationId}`,
      );

      // Generate report
      const reportResult =
        this.insuranceReportService.generateReport24h(organizationGuid);

      // Build approval/rejection URLs with tokens
      const approveUrl = `${this.appBaseUrl}/private/insurance/reports/${reportResult.payload.reportId}/approve?token=${reportResult.approvalToken}`;
      const rejectUrl = `${this.appBaseUrl}/private/insurance/reports/${reportResult.payload.reportId}/reject?token=${reportResult.rejectionToken}`;

      // Prepare template variables
      const templateVariables = {
        reportId: reportResult.payload.reportId,
        summary: reportResult.payload.summary,
        insurances: reportResult.payload.insurances,
        approveUrl,
        rejectUrl,
        tokenExpiry: '24 hours',
      };

      // Send email using template
      await this.emailService.sendEmail(
        this.adminEmail,
        `Insurance Report Approval - ${reportResult.payload.reportId}`,
        'insurance-report-admin-approval',
        templateVariables,
      );

      this.logger.log(
        `Admin approval email sent successfully - Report: ${reportResult.payload.reportId}, Recipients: ${this.adminEmail}`,
        {
          operation: 'sendAdminApprovalEmail',
          operationId,
          reportId: reportResult.payload.reportId,
          recordCount: reportResult.payload.insurances.length,
          adminEmail: this.adminEmail.substring(0, 5) + '***',
        },
      );
    } catch (_error) {
      this.logger.error(
        `Error sending admin approval email for org ${organizationGuid} - Operation: ${operationId}`,
        _error instanceof Error ? _error.message : _error,
      );
      throw _error;
    }
  }

  /**
   * Send provider notification email with signed JSON payload
   *
   * @param payload - Signed insurance report payload to send to provider
   * @returns void
   */
  async sendProviderNotificationEmail(
    payload: InsuranceReportPayloadDto,
  ): Promise<void> {
    const operationId = `send_provider_notification_${Date.now()}`;

    try {
      this.logger.log(
        `Sending provider notification email for report ${payload.reportId} - Operation: ${operationId}`,
      );

      // Prepare template variables
      const templateVariables = {
        reportId: payload.reportId,
        generatedAt: payload.generatedAt,
        summary: payload.summary,
        signature: payload.signature,
        signatureAlgorithm: payload.signatureAlgorithm,
        signedAt: payload.signedAt,
      };

      // Send email using template
      await this.emailService.sendEmail(
        this.providerEmail,
        `Insurance Report - ${payload.reportId}`,
        'insurance-report-provider-notification',
        templateVariables,
      );

      this.logger.log(
        `Provider notification email sent successfully - Report: ${payload.reportId}, Records: ${payload.insurances.length}, Total: $${payload.summary.totalAmount.toFixed(2)}`,
        {
          operation: 'sendProviderNotificationEmail',
          operationId,
          reportId: payload.reportId,
          recordCount: payload.insurances.length,
          totalAmount: payload.summary.totalAmount,
          providerEmail: this.providerEmail.substring(0, 5) + '***',
        },
      );
    } catch (_error) {
      this.logger.error(
        `Error sending provider notification email for report ${payload.reportId} - Operation: ${operationId}`,
        _error instanceof Error ? _error.message : _error,
      );
      throw _error;
    }
  }

  /**
   * Get email status info (useful for debugging/monitoring)
   *
   * @returns Email configuration info
   */
  getEmailConfig(): { adminEmail: string; providerEmail: string } {
    return {
      adminEmail: this.adminEmail
        ? this.adminEmail.substring(0, 5) + '***'
        : 'NOT SET',
      providerEmail: this.providerEmail
        ? this.providerEmail.substring(0, 5) + '***'
        : 'NOT SET',
    };
  }
}
