/**
 * Insurance Report Service
 *
 * Generates 24-hour insurance reports for admin approval and provider notification.
 *
 * RESPONSIBILITIES:
 * - Query insurances created in last 24 hours
 * - Build summary statistics
 * - Generate signed JSON payload for insurance providers
 * - Format data for email templates
 *
 * @file insurance-report.service.ts
 * @module InsuranceModule
 * @layer Services
 * @since 2026-01-30
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InsuranceLookupService } from './insurance-lookup.service';
import { OrganizationLookupService } from '../../organization/services/organization-lookup.service';
import { InsuranceReportItemDto } from '../dtos/insurance-report-item.dto';
import { InsuranceReportSummaryDto } from '../dtos/insurance-report-summary.dto';
import { InsuranceReportPayloadDto } from '../dtos/insurance-report-payload.dto';
import {
  signReportPayload,
  generateReportToken,
  hashToken,
} from '../utils/insurance-report-signing.util';
import { v4 as uuidv4 } from 'uuid';

interface GenerateReportResult {
  payload: InsuranceReportPayloadDto;
  approvalToken: string;
  rejectionToken: string;
  approvalTokenHash: string;
  rejectionTokenHash: string;
}

interface Report24hData {
  items: InsuranceReportItemDto[];
  summary: InsuranceReportSummaryDto;
}

@Injectable()
export class InsuranceReportService {
  private readonly logger = new Logger(InsuranceReportService.name);
  private readonly hmacSecret: string;

  constructor(
    private readonly insuranceLookupService: InsuranceLookupService,
    private readonly organizationLookupService: OrganizationLookupService,
    private readonly configService: ConfigService,
  ) {
    this.hmacSecret =
      this.configService.get<string>('INSURANCE_REPORT_HMAC_SECRET') || '';

    if (!this.hmacSecret || this.hmacSecret.length < 32) {
      this.logger.warn(
        'INSURANCE_REPORT_HMAC_SECRET not configured or too short - report signing will fail',
      );
    }
  }

  /**
   * Generate 24-hour insurance report for specific organization
   *
   * @param organizationGuid - Organization to generate report for
   * @returns Report payload with signature and approval tokens
   */
  generateReport24h(organizationGuid: string): GenerateReportResult {
    const operationId = `generate_report_24h_${Date.now()}`;

    try {
      this.logger.log(
        `Generating 24h insurance report for org ${organizationGuid} - Operation: ${operationId}`,
      );

      // 1. Calculate time window (last 24 hours)
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      this.logger.debug(
        `Report period: ${oneDayAgo.toISOString()} to ${now.toISOString()}`,
      );

      // 2. Query insurances created in last 24 hours
      // NOTE: This would use a dedicated OData filter - implementation depends on InsuranceLookupService capability
      const reportData = this.buildReport24hData(
        organizationGuid,
        oneDayAgo,
        now,
      );

      // 3. Generate report ID
      const reportId = `report-${organizationGuid.substring(0, 8)}-${new Date().toISOString().split('T')[0]}-${uuidv4().substring(0, 8)}`;

      // 4. Build payload
      const payload: InsuranceReportPayloadDto = {
        reportId,
        organizationGuid,
        generatedAt: now.toISOString(),
        summary: reportData.summary,
        insurances: reportData.items,
        signature: '', // Will be filled by signReportPayload
        signatureAlgorithm: 'HMAC-SHA256',
        signedAt: '', // Will be filled by signReportPayload
      };

      // 5. Sign payload
      const signedPayload = signReportPayload(payload, this.hmacSecret);

      // 6. Generate approval/rejection tokens
      const approvalToken = generateReportToken();
      const rejectionToken = generateReportToken();

      this.logger.log(
        `Report generated successfully - Report ID: ${reportId}, Records: ${reportData.items.length}, Total: $${reportData.summary.totalAmount.toFixed(2)}`,
        {
          operation: 'generateReport24h',
          operationId,
          reportId,
          recordCount: reportData.items.length,
          totalAmount: reportData.summary.totalAmount,
          organizationGuid: organizationGuid.substring(0, 8) + '...',
        },
      );

      return {
        payload: signedPayload,
        approvalToken,
        rejectionToken,
        approvalTokenHash: hashToken(approvalToken),
        rejectionTokenHash: hashToken(rejectionToken),
      };
    } catch (error) {
      this.logger.error(
        `Error generating 24h report for org ${organizationGuid} - Operation: ${operationId}`,
        error,
      );

      throw error;
    }
  }

  /**
   * Build report data from insurance records
   *
   * @private
   * @param organizationGuid - Organization filter
   * @param periodStart - Start of report period
   * @param periodEnd - End of report period
   * @returns Report data with items and summary
   */
  private buildReport24hData(
    organizationGuid: string,
    periodStart: Date,
    periodEnd: Date,
  ): Report24hData {
    // TODO: Implement OData query to get insurances in period with all required fields
    // For now, return empty structure as placeholder
    // This would call insuranceLookupService with time-based filter and organization context

    // When implemented, this should:
    // 1. Query insurances by organization and date range
    // 2. For each insurance, fetch the related Organization record
    // 3. Map osot_organization_name to sponsoring_entity
    // 4. Include all 30 fields as per schema in InsuranceReportItemDto

    const items: InsuranceReportItemDto[] = [];
    const itemsWithDisplay = this.mapItemsWithDisplayNames(items);
    const summary = this.buildSummary(itemsWithDisplay, periodStart, periodEnd);

    return {
      items: itemsWithDisplay,
      summary,
    };
  }

  /**
   * Map insurance items to include display names for enum fields
   *
   * @private
   * @param items - Raw insurance items
   * @returns Items with display names added
   */
  private mapItemsWithDisplayNames(
    items: InsuranceReportItemDto[],
  ): InsuranceReportItemDto[] {
    return items.map((item) => ({
      ...item,
      osot_insurance_status_display: this.getStatusDisplayName(
        item.osot_insurance_status,
      ),
    }));
  }

  /**
   * Convert insurance status string/number to display name
   *
   * @private
   * @param status - Status value (can be number or string)
   * @returns Display name for UI rendering
   */
  private getStatusDisplayName(status: string | number): string {
    const statusNum =
      typeof status === 'string' ? parseInt(status, 10) : status;

    switch (statusNum) {
      case 1:
        return 'Draft';
      case 2:
        return 'Pending';
      case 3:
        return 'Active';
      case 4:
        return 'Expired';
      case 5:
        return 'Cancelled';
      default:
        return status?.toString() || 'Unknown';
    }
  }

  /**
   * Build summary statistics from insurance items
   *
   * @private
   * @param items - Insurance items to summarize
   * @param periodStart - Report period start
   * @param periodEnd - Report period end
   * @returns Summary statistics
   */
  private buildSummary(
    items: InsuranceReportItemDto[],
    periodStart: Date,
    periodEnd: Date,
  ): InsuranceReportSummaryDto {
    const summary: InsuranceReportSummaryDto = {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      totalRecords: items.length,
      totalPremium: 0,
      totalAmount: 0,
      countActive: 0,
      countPending: 0,
      countDraft: 0,
      countExpired: 0,
      countCancelled: 0,
      byInsuranceType: {},
      byStatus: {},
    };

    // Aggregate data
    for (const item of items) {
      // Totals
      summary.totalPremium += item.osot_insurance_price;
      summary.totalAmount += item.osot_total;

      // By status
      const status = item.osot_insurance_status;
      if (status === 'ACTIVE') summary.countActive++;
      else if (status === 'PENDING') summary.countPending++;
      else if (status === 'DRAFT') summary.countDraft++;
      else if (status === 'EXPIRED') summary.countExpired++;
      else if (status === 'CANCELLED') summary.countCancelled++;

      // By insurance type
      const type = item.osot_insurance_type;
      if (!summary.byInsuranceType[type]) {
        summary.byInsuranceType[type] = { count: 0, total: 0 };
      }
      summary.byInsuranceType[type].count++;
      summary.byInsuranceType[type].total += item.osot_total;

      // By status breakdown
      if (!summary.byStatus[status]) {
        summary.byStatus[status] = { count: 0, total: 0 };
      }
      summary.byStatus[status].count++;
      summary.byStatus[status].total += item.osot_total;
    }

    return summary;
  }
}
