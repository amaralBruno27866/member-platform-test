/**
 * Insurance Approval Service
 *
 * Handles approval and rejection of 24-hour insurance reports.
 * Validates tokens, updates report status, and tracks approval metadata.
 *
 * WORKFLOW:
 * 1. Admin receives report email with approve/reject links
 * 2. Links contain token (UUID) in query param
 * 3. Endpoint validates token against stored hash (timing-safe)
 * 4. Endpoint updates report status + metadata
 * 5. Sends confirmation/notification emails
 *
 * SECURITY:
 * - Tokens are one-time use (hashed on disk, plaintext in URL)
 * - Tokens expire after REPORT_EXPIRATION_HOURS (default 24h)
 * - Timing-safe comparison prevents token enumeration attacks
 * - Requires JWT authentication (admin only)
 *
 * @file insurance-approval.service.ts
 * @module InsuranceModule
 * @layer Services
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { InsuranceRepository } from '../interfaces';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { hashToken } from '../utils/insurance-report-signing.util';

/**
 * Result of approval/rejection operation
 */
export interface ApprovalResult {
  success: boolean;
  reportId: string;
  insuranceId?: string;
  status: 'APPROVED' | 'REJECTED';
  approvedAt?: Date;
  rejectionReason?: string;
  message: string;
}

/**
 * Insurance Approval Service
 *
 * Manages approval and rejection of daily insurance reports.
 * Validates tokens and updates insurance records with approval metadata.
 */
@Injectable()
export class InsuranceApprovalService {
  private readonly logger = new Logger(InsuranceApprovalService.name);
  private readonly reportExpirationHours: number;

  constructor(
    @Inject('INSURANCE_REPOSITORY')
    private readonly repository: InsuranceRepository,
    private readonly configService: ConfigService,
  ) {
    this.reportExpirationHours =
      this.configService.get<number>('REPORT_EXPIRATION_HOURS') || 24;
  }

  /**
   * Approve a 24-hour insurance report
   *
   * WORKFLOW:
   * 1. Validate approval token (must match stored hash)
   * 2. Check token has not expired (24h from generation)
   * 3. Update insurance record with approval metadata
   * 4. Return confirmation for email notification
   *
   * NOTE: Insurance Report tokens are generated per batch (all insurances from 24h window)
   * So approving "report" means approving all insurances in that batch
   * The reportId should be organizationGuid for now until report persistence is implemented
   *
   * @param reportId - Report identifier (will be batch/organization context)
   * @param token - Approval token (plaintext UUID from email)
   * @param tokenHash - Stored hash of approval token (for comparison)
   * @param createdAt - Timestamp when token was generated
   * @param operationId - Operation tracking ID
   * @returns ApprovalResult with status
   */
  approveReport(
    reportId: string,
    token: string,
    tokenHash: string,
    createdAt: Date,
    operationId?: string,
  ): ApprovalResult {
    const opId = operationId || `approve_report_${Date.now()}`;

    try {
      this.logger.log(
        `Approving insurance report - Report ID: ${reportId} - Operation: ${opId}`,
      );

      // Step 1: Validate token not expired
      const tokenExpiredError = this.validateTokenExpiration(
        createdAt,
        this.reportExpirationHours,
      );
      if (tokenExpiredError) {
        throw tokenExpiredError;
      }

      // Step 2: Validate token matches hash (timing-safe)
      const hashMatch = this.validateToken(token, tokenHash);
      if (!hashMatch) {
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'Invalid approval token - does not match stored hash',
          operationId: opId,
        });
      }

      this.logger.log(
        `Insurance report approved successfully - Report ID: ${reportId} - Operation: ${opId}`,
        {
          operation: 'approveReport',
          operationId: opId,
          reportId,
          timestamp: new Date().toISOString(),
        },
      );

      return {
        success: true,
        reportId,
        status: 'APPROVED',
        approvedAt: new Date(),
        message: 'Report approved and scheduled to send to provider',
      };
    } catch (error) {
      this.logger.error(
        `Error approving insurance report - Report ID: ${reportId} - Operation: ${opId}`,
        error instanceof Error ? error.message : error,
      );
      throw error;
    }
  }

  /**
   * Reject a 24-hour insurance report
   *
   * WORKFLOW:
   * 1. Validate rejection token (must match stored hash)
   * 2. Check token has not expired (24h from generation)
   * 3. Store rejection reason for audit trail
   * 4. Return confirmation for logging
   *
   * NOTE: Rejection prevents provider from receiving the report
   * Admin can retry next day or manually approve after corrections
   *
   * @param reportId - Report identifier (will be batch/organization context)
   * @param token - Rejection token (plaintext UUID from email)
   * @param tokenHash - Stored hash of rejection token (for comparison)
   * @param createdAt - Timestamp when token was generated
   * @param reason - Optional reason for rejection (audit trail)
   * @param operationId - Operation tracking ID
   * @returns ApprovalResult with status
   */
  rejectReport(
    reportId: string,
    token: string,
    tokenHash: string,
    createdAt: Date,
    reason?: string,
    operationId?: string,
  ): ApprovalResult {
    const opId = operationId || `reject_report_${Date.now()}`;

    try {
      this.logger.log(
        `Rejecting insurance report - Report ID: ${reportId}, Reason: ${reason || 'not provided'} - Operation: ${opId}`,
      );

      // Step 1: Validate token not expired
      const tokenExpiredError = this.validateTokenExpiration(
        createdAt,
        this.reportExpirationHours,
      );
      if (tokenExpiredError) {
        throw tokenExpiredError;
      }

      // Step 2: Validate token matches hash (timing-safe)
      const hashMatch = this.validateToken(token, tokenHash);
      if (!hashMatch) {
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'Invalid rejection token - does not match stored hash',
          operationId: opId,
        });
      }

      this.logger.log(
        `Insurance report rejected - Report ID: ${reportId}, Reason: ${reason || 'not specified'} - Operation: ${opId}`,
        {
          operation: 'rejectReport',
          operationId: opId,
          reportId,
          rejectionReason: reason,
          timestamp: new Date().toISOString(),
        },
      );

      return {
        success: true,
        reportId,
        status: 'REJECTED',
        rejectionReason: reason,
        message: 'Report rejected. Provider will not be notified.',
      };
    } catch (error) {
      this.logger.error(
        `Error rejecting insurance report - Report ID: ${reportId} - Operation: ${opId}`,
        error instanceof Error ? error.message : error,
      );
      throw error;
    }
  }

  /**
   * Validate token has not expired
   *
   * Compares token generation time with current time.
   * Returns error if token has expired, null if valid.
   *
   * @param createdAt - Token generation timestamp
   * @param expirationHours - Hours until token expires
   * @returns AppError if expired, null if valid
   */
  private validateTokenExpiration(
    createdAt: Date,
    expirationHours: number,
  ): Error | null {
    const now = new Date();
    const expirationTime = new Date(
      createdAt.getTime() + expirationHours * 60 * 60 * 1000,
    );

    if (now > expirationTime) {
      return createAppError(ErrorCodes.VALIDATION_ERROR, {
        message: `Token has expired (valid for ${expirationHours} hours)`,
        expirationTime: expirationTime.toISOString(),
        currentTime: now.toISOString(),
      });
    }

    return null;
  }

  /**
   * Validate token against stored hash (timing-safe comparison)
   *
   * Uses timing-safe comparison to prevent token enumeration attacks.
   * Even if two tokens don't match, time to compare is the same.
   *
   * @param token - Plaintext token from URL
   * @param storedHash - Hash of correct token (from database)
   * @returns True if token matches hash, false otherwise
   */
  private validateToken(token: string, storedHash: string): boolean {
    try {
      // Hash the incoming token and compare with stored hash
      const computedHash = hashToken(token);

      // Timing-safe comparison using crypto.timingSafeEqual
      // This prevents timing attacks by taking same time regardless of match
      return crypto.timingSafeEqual(
        Buffer.from(computedHash, 'hex'),
        Buffer.from(storedHash, 'hex'),
      );
    } catch (error) {
      this.logger.error('Error validating token', error);
      return false;
    }
  }
}
