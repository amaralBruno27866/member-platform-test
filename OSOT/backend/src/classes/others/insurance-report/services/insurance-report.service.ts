/**
 * Insurance Report Service
 *
 * Business logic layer for Insurance Report entity.
 * Handles CRUD operations, validations, and workflows.
 *
 * CRUD MATRIX - Role-Based Access Control:
 * - owner: ❌ No access
 * - admin: ❌ No access
 * - main:  ✅ Full access (create, read, update, delete, approve, reject)
 *
 * RESPONSIBILITIES:
 * - Enforce role-based access control (RBAC)
 * - Validate period conflicts and duplicates
 * - Manage report status transitions (state machine)
 * - Generate and validate approval/rejection tokens
 * - Orchestrate multi-step workflows
 * - Emit domain events for audit trails
 *
 * @file insurance-report.service.ts
 * @module InsuranceReportModule
 * @layer Services
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  InsuranceReportInternal,
  CreateInsuranceReportData,
  UpdateInsuranceReportData,
} from '../interfaces';
import { DataverseInsuranceReportRepository } from '../repositories';
import {
  INSURANCE_REPORT_RULES,
  INSURANCE_REPORT_MESSAGES,
} from '../constants';
import { InsuranceReportStatus } from '../../insurance/enum/insurance-report-status.enum';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import * as crypto from 'crypto';

/**
 * Insurance Report Service - Business Logic Layer
 */
@Injectable()
export class InsuranceReportService {
  private readonly logger = new Logger(InsuranceReportService.name);

  constructor(
    private readonly reportRepository: DataverseInsuranceReportRepository,
  ) {}

  // ========================================
  // CRUD OPERATIONS WITH RBAC
  // ========================================

  /**
   * Create a new Insurance Report
   * RBAC: main only
   */
  async createReport(
    data: CreateInsuranceReportData,
    userRole: string,
    operationId: string,
  ): Promise<InsuranceReportInternal> {
    // RBAC: Only 'main' role can create
    if (userRole !== 'main') {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Only main role can create Insurance Reports',
        operationId,
        requiredRole: 'main',
        userRole,
      });
    }

    try {
      this.logger.log(`Creating Insurance Report - Operation: ${operationId}`);

      // Validate period
      const periodValidation = this.validatePeriod(
        data.periodStart,
        data.periodEnd,
      );
      if (!periodValidation.isValid) {
        throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
          message: periodValidation.errors[0],
          operationId,
        });
      }

      // Check for duplicates
      const exists = await this.reportRepository.existsForPeriod(
        data.organizationGuid,
        data.periodStart,
        data.periodEnd,
        operationId,
      );

      if (exists) {
        throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
          message: INSURANCE_REPORT_MESSAGES.DUPLICATE_REPORT,
          operationId,
          periodStart: data.periodStart.toISOString().split('T')[0],
          periodEnd: data.periodEnd.toISOString().split('T')[0],
        });
      }

      // Create in repository
      const created = await this.reportRepository.create(data, operationId);

      this.logger.log(
        `Insurance Report created: ${created.osot_table_insurance_reportid} - Operation: ${operationId}`,
      );

      return created;
    } catch (error) {
      this.logger.error(
        `Error creating Insurance Report - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get Insurance Report by ID
   * RBAC: main only
   */
  async getReportById(
    reportGuid: string,
    organizationId: string,
    userRole: string,
    operationId: string,
  ): Promise<InsuranceReportInternal> {
    // RBAC: Only 'main' role can read
    if (userRole !== 'main') {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Only main role can access Insurance Reports',
        operationId,
        requiredRole: 'main',
        userRole,
      });
    }

    try {
      this.logger.log(
        `Getting Insurance Report: ${reportGuid} - Operation: ${operationId}`,
      );

      const report = await this.reportRepository.findById(
        reportGuid,
        organizationId,
        operationId,
      );

      if (!report) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: 'Insurance Report not found',
          operationId,
          reportGuid,
        });
      }

      return report;
    } catch (error) {
      this.logger.error(
        `Error getting Insurance Report: ${reportGuid} - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get Insurance Report by report ID (autonumber)
   * RBAC: main only
   */
  async getReportByReportId(
    reportId: string,
    organizationId: string,
    userRole: string,
    operationId: string,
  ): Promise<InsuranceReportInternal> {
    // RBAC: Only 'main' role can read
    if (userRole !== 'main') {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Only main role can access Insurance Reports',
        operationId,
        requiredRole: 'main',
        userRole,
      });
    }

    try {
      this.logger.log(
        `Getting Insurance Report by report ID: ${reportId} - Operation: ${operationId}`,
      );

      const report = await this.reportRepository.findByReportId(
        reportId,
        organizationId,
        operationId,
      );

      if (!report) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: 'Insurance Report not found',
          operationId,
          reportId,
        });
      }

      return report;
    } catch (error) {
      this.logger.error(
        `Error getting Insurance Report by report ID: ${reportId} - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * List all Insurance Reports for organization
   * RBAC: main only
   */
  async listReports(
    organizationId: string,
    userRole: string,
    operationId: string,
    limit?: number,
  ): Promise<InsuranceReportInternal[]> {
    // RBAC: Only 'main' role can read
    if (userRole !== 'main') {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Only main role can access Insurance Reports',
        operationId,
        requiredRole: 'main',
        userRole,
      });
    }

    try {
      this.logger.log(`Listing Insurance Reports - Operation: ${operationId}`);

      return await this.reportRepository.findByOrganization(
        organizationId,
        operationId,
        limit,
      );
    } catch (error) {
      this.logger.error(
        `Error listing Insurance Reports - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * List pending reports for approval
   * RBAC: main only
   */
  async listPendingReports(
    organizationId: string,
    userRole: string,
    operationId: string,
    limit?: number,
  ): Promise<InsuranceReportInternal[]> {
    // RBAC: Only 'main' role can read
    if (userRole !== 'main') {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Only main role can access Insurance Reports',
        operationId,
        requiredRole: 'main',
        userRole,
      });
    }

    try {
      this.logger.log(
        `Listing pending Insurance Reports - Operation: ${operationId}`,
      );

      return await this.reportRepository.findPendingByOrganization(
        organizationId,
        operationId,
        limit,
      );
    } catch (error) {
      this.logger.error(
        `Error listing pending reports - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update Insurance Report
   * RBAC: main only
   */
  async updateReport(
    reportGuid: string,
    data: UpdateInsuranceReportData,
    organizationId: string,
    userRole: string,
    operationId: string,
  ): Promise<InsuranceReportInternal> {
    // RBAC: Only 'main' role can update
    if (userRole !== 'main') {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Only main role can update Insurance Reports',
        operationId,
        requiredRole: 'main',
        userRole,
      });
    }

    try {
      this.logger.log(
        `Updating Insurance Report: ${reportGuid} - Operation: ${operationId}`,
      );

      // Validate status transition if status is being updated
      if (data.reportStatus) {
        const existing = await this.reportRepository.findById(
          reportGuid,
          organizationId,
          operationId,
        );

        if (!existing) {
          throw createAppError(ErrorCodes.NOT_FOUND, {
            message: 'Insurance Report not found',
            operationId,
            reportGuid,
          });
        }

        const transition = this.validateStatusTransition(
          existing.reportStatus,
          data.reportStatus,
        );

        if (!transition.isValid) {
          throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
            message: transition.error,
            operationId,
            currentStatus: existing.reportStatus,
            requestedStatus: data.reportStatus,
          });
        }
      }

      return await this.reportRepository.update(
        reportGuid,
        data,
        organizationId,
        operationId,
      );
    } catch (error) {
      this.logger.error(
        `Error updating Insurance Report: ${reportGuid} - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Delete Insurance Report
   * RBAC: main only
   */
  async deleteReport(
    reportGuid: string,
    organizationId: string,
    userRole: string,
    operationId: string,
  ): Promise<void> {
    // RBAC: Only 'main' role can delete
    if (userRole !== 'main') {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Only main role can delete Insurance Reports',
        operationId,
        requiredRole: 'main',
        userRole,
      });
    }

    try {
      this.logger.log(
        `Deleting Insurance Report: ${reportGuid} - Operation: ${operationId}`,
      );

      return await this.reportRepository.delete(
        reportGuid,
        organizationId,
        operationId,
      );
    } catch (error) {
      this.logger.error(
        `Error deleting Insurance Report: ${reportGuid} - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  // ========================================
  // WORKFLOW OPERATIONS
  // ========================================

  /**
   * Approve an Insurance Report
   * Generates approval token and updates status
   * RBAC: main only
   */
  async approveReport(
    reportGuid: string,
    approverId: string,
    organizationId: string,
    userRole: string,
    operationId: string,
  ): Promise<InsuranceReportInternal> {
    // RBAC: Only 'main' role can approve
    if (userRole !== 'main') {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Only main role can approve Insurance Reports',
        operationId,
        requiredRole: 'main',
        userRole,
      });
    }

    try {
      this.logger.log(
        `Approving Insurance Report: ${reportGuid} - Operation: ${operationId}`,
      );

      // Get existing report
      const existing = await this.reportRepository.findById(
        reportGuid,
        organizationId,
        operationId,
      );

      if (!existing) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: 'Insurance Report not found',
          operationId,
          reportGuid,
        });
      }

      // Validate status is PENDING_APPROVAL
      if (existing.reportStatus !== InsuranceReportStatus.PENDING_APPROVAL) {
        throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
          message: 'Report must be in PENDING_APPROVAL status',
          operationId,
          currentStatus: existing.reportStatus,
        });
      }

      // Generate approval token
      const approvedToken = this.generateToken();

      // Update report
      const updateData: UpdateInsuranceReportData = {
        reportStatus: InsuranceReportStatus.APPROVED,
        approvedToken,
        approvedBy: approverId,
        approvedDate: new Date(),
      };

      return await this.reportRepository.update(
        reportGuid,
        updateData,
        organizationId,
        operationId,
      );
    } catch (error) {
      this.logger.error(
        `Error approving Insurance Report: ${reportGuid} - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Reject an Insurance Report
   * Generates rejection token and updates status
   * RBAC: main only
   */
  async rejectReport(
    reportGuid: string,
    rejectorId: string,
    reason: string,
    organizationId: string,
    userRole: string,
    operationId: string,
  ): Promise<InsuranceReportInternal> {
    // RBAC: Only 'main' role can reject
    if (userRole !== 'main') {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Only main role can reject Insurance Reports',
        operationId,
        requiredRole: 'main',
        userRole,
      });
    }

    try {
      this.logger.log(
        `Rejecting Insurance Report: ${reportGuid} - Operation: ${operationId}`,
      );

      // Get existing report
      const existing = await this.reportRepository.findById(
        reportGuid,
        organizationId,
        operationId,
      );

      if (!existing) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: 'Insurance Report not found',
          operationId,
          reportGuid,
        });
      }

      // Validate status is PENDING_APPROVAL
      if (existing.reportStatus !== InsuranceReportStatus.PENDING_APPROVAL) {
        throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
          message: 'Report must be in PENDING_APPROVAL status',
          operationId,
          currentStatus: existing.reportStatus,
        });
      }

      // Validate rejection reason
      if (!reason || reason.trim().length === 0) {
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'Rejection reason is required',
          operationId,
        });
      }

      // Generate rejection token
      const rejectionToken = this.generateToken();

      // Update report
      const updateData: UpdateInsuranceReportData = {
        reportStatus: InsuranceReportStatus.REJECTED,
        rejectionToken,
        rejectBy: rejectorId,
        rejectedDate: new Date(),
        rejectionReason: reason,
      };

      return await this.reportRepository.update(
        reportGuid,
        updateData,
        organizationId,
        operationId,
      );
    } catch (error) {
      this.logger.error(
        `Error rejecting Insurance Report: ${reportGuid} - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Send approved report to provider
   * Updates status to SENT_TO_PROVIDER
   * RBAC: main only
   */
  async sendToProvider(
    reportGuid: string,
    organizationId: string,
    userRole: string,
    operationId: string,
  ): Promise<InsuranceReportInternal> {
    // RBAC: Only 'main' role can send
    if (userRole !== 'main') {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Only main role can send Insurance Reports',
        operationId,
        requiredRole: 'main',
        userRole,
      });
    }

    try {
      this.logger.log(
        `Sending Insurance Report to provider: ${reportGuid} - Operation: ${operationId}`,
      );

      // Get existing report
      const existing = await this.reportRepository.findById(
        reportGuid,
        organizationId,
        operationId,
      );

      if (!existing) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: 'Insurance Report not found',
          operationId,
          reportGuid,
        });
      }

      // Validate status is APPROVED
      if (existing.reportStatus !== InsuranceReportStatus.APPROVED) {
        throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
          message: 'Report must be APPROVED before sending to provider',
          operationId,
          currentStatus: existing.reportStatus,
        });
      }

      // Update report
      const updateData: UpdateInsuranceReportData = {
        reportStatus: InsuranceReportStatus.SENT_TO_PROVIDER,
      };

      return await this.reportRepository.update(
        reportGuid,
        updateData,
        organizationId,
        operationId,
      );
    } catch (error) {
      this.logger.error(
        `Error sending report to provider: ${reportGuid} - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Mark report as acknowledged by provider
   * Updates status to ACKNOWLEDGED (terminal state)
   * RBAC: main only
   */
  async acknowledgeReport(
    reportGuid: string,
    organizationId: string,
    userRole: string,
    operationId: string,
  ): Promise<InsuranceReportInternal> {
    // RBAC: Only 'main' role can acknowledge
    if (userRole !== 'main') {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Only main role can acknowledge Insurance Reports',
        operationId,
        requiredRole: 'main',
        userRole,
      });
    }

    try {
      this.logger.log(
        `Acknowledging Insurance Report: ${reportGuid} - Operation: ${operationId}`,
      );

      // Get existing report
      const existing = await this.reportRepository.findById(
        reportGuid,
        organizationId,
        operationId,
      );

      if (!existing) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: 'Insurance Report not found',
          operationId,
          reportGuid,
        });
      }

      // Validate status is SENT_TO_PROVIDER
      if (existing.reportStatus !== InsuranceReportStatus.SENT_TO_PROVIDER) {
        throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
          message: 'Report must be SENT_TO_PROVIDER before acknowledging',
          operationId,
          currentStatus: existing.reportStatus,
        });
      }

      // Update report
      const updateData: UpdateInsuranceReportData = {
        reportStatus: InsuranceReportStatus.ACKNOWLEDGED,
      };

      return await this.reportRepository.update(
        reportGuid,
        updateData,
        organizationId,
        operationId,
      );
    } catch (error) {
      this.logger.error(
        `Error acknowledging Insurance Report: ${reportGuid} - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  // ========================================
  // VALIDATION & HELPER METHODS
  // ========================================

  /**
   * Validate period (24-hour window, not future)
   */
  private validatePeriod(
    periodStart: Date,
    periodEnd: Date,
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check end > start
    if (periodEnd <= periodStart) {
      errors.push(INSURANCE_REPORT_MESSAGES.PERIOD_INVALID_RANGE);
    }

    // Check 24-hour window (with timezone tolerance: 23-25 hours)
    const hoursDiff =
      (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60);
    const minHours = INSURANCE_REPORT_RULES.REPORT_PERIOD_HOURS - 1; // 23 hours
    const maxHours = INSURANCE_REPORT_RULES.REPORT_PERIOD_HOURS + 1; // 25 hours
    if (hoursDiff < minHours || hoursDiff > maxHours) {
      errors.push(INSURANCE_REPORT_MESSAGES.PERIOD_NOT_24_HOURS);
    }

    // Check not future (with 1 hour buffer for timezone)
    const now = new Date();
    const bufferMs = 60 * 60 * 1000; // 1 hour in milliseconds
    if (periodEnd > new Date(now.getTime() + bufferMs)) {
      errors.push(INSURANCE_REPORT_MESSAGES.PERIOD_IN_FUTURE);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate status transition (state machine)
   */
  private validateStatusTransition(
    currentStatus: string,
    newStatus: string,
  ): { isValid: boolean; error?: string } {
    const validTransitions =
      INSURANCE_REPORT_RULES.VALID_STATUS_TRANSITIONS[
        currentStatus as InsuranceReportStatus
      ];

    if (
      !validTransitions ||
      !validTransitions.includes(newStatus as InsuranceReportStatus)
    ) {
      return {
        isValid: false,
        error: `Cannot transition from ${currentStatus} to ${newStatus}`,
      };
    }

    return { isValid: true };
  }

  /**
   * Generate approval/rejection token (SHA256 hash of UUID)
   */
  private generateToken(): string {
    const uuid = crypto.randomUUID();
    return crypto.createHash('sha256').update(uuid).digest('hex');
  }
}
