/**
 * Insurance Lookup Service
 *
 * Handles read operations, filtering, and searching for Insurance records.
 * Provides various lookup patterns for different use cases.
 *
 * Lookup Patterns:
 * - findById(insuranceId): Get single insurance by ID
 * - findByOrder(orderId): Get all insurances from order
 * - findByAccount(accountGuid): Get account's all insurances
 * - findByAccountAndYear(accountGuid, membershipYear): Get insurances for specific year
 * - findActiveByAccountAndType(accountGuid, type): Check prerequisite (Professional active?)
 * - findByTypeAndStatus(type, status): Admin lookup (all Professional active insurances)
 * - findExpiredByYear(membershipYear): Scheduler lookup (mark as EXPIRED)
 *
 * @file insurance-lookup.service.ts
 * @module InsuranceModule
 * @layer Services
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import {
  InsuranceRepository,
  INSURANCE_REPOSITORY,
} from '../interfaces/insurance-repository.interface';
import { InsuranceInternal } from '../interfaces/insurance-internal.interface';
import { InsuranceStatus } from '../enum/insurance-status.enum';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';

@Injectable()
export class InsuranceLookupService {
  private readonly logger = new Logger(InsuranceLookupService.name);

  constructor(
    @Inject(INSURANCE_REPOSITORY)
    private readonly repository: InsuranceRepository,
  ) {}

  /**
   * Find single insurance by ID
   *
   * @param insuranceId - Insurance GUID
   * @param organizationGuid - Organization context (multi-tenant)
   * @param operationId - Operation tracking ID
   * @returns InsuranceInternal or null if not found
   */
  async findById(
    insuranceId: string,
    organizationGuid: string,
    operationId?: string,
  ): Promise<InsuranceInternal | null> {
    const opId = operationId || `find_insurance_by_id_${Date.now()}`;

    try {
      this.logger.debug(
        `Looking up insurance ${insuranceId} - Operation: ${opId}`,
      );

      const insurance = await this.repository.findById(
        insuranceId,
        organizationGuid,
        opId,
      );

      if (!insurance) {
        this.logger.debug(
          `Insurance ${insuranceId} not found - Operation: ${opId}`,
        );
        return null;
      }

      return insurance;
    } catch (error) {
      this.logger.error(
        `Error finding insurance ${insuranceId} - Operation: ${opId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Error looking up insurance',
        insuranceId,
        operationId: opId,
      });
    }
  }

  /**
   * Find all insurances associated with an order
   *
   * Used for:
   * - Displaying order's insurance certificates
   * - Validating duplicate insurance (per order)
   *
   * @param orderId - Order GUID
   * @param organizationGuid - Organization context
   * @param operationId - Operation tracking ID
   * @returns Array of InsuranceInternal
   */
  async findByOrder(
    orderId: string,
    organizationGuid: string,
    operationId?: string,
  ): Promise<InsuranceInternal[]> {
    const opId = operationId || `find_insurance_by_order_${Date.now()}`;

    try {
      this.logger.debug(
        `Finding insurances for order ${orderId} - Operation: ${opId}`,
      );

      const insurances = await this.repository.findByOrder(
        orderId,
        organizationGuid,
      );

      this.logger.debug(
        `Found ${insurances.length} insurances for order ${orderId} - Operation: ${opId}`,
      );

      return insurances;
    } catch (error) {
      this.logger.error(
        `Error finding insurances for order ${orderId} - Operation: ${opId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Error looking up order insurances',
        orderId,
        operationId: opId,
      });
    }
  }

  /**
   * Find all insurances for an account
   *
   * Used for:
   * - Account profile (show all certificates)
   * - Pagination/listing with filters
   *
   * @param accountGuid - Account GUID
   * @param organizationGuid - Organization context
   * @param operationId - Operation tracking ID
   * @returns Array of InsuranceInternal
   */
  async findByAccount(
    accountGuid: string,
    organizationGuid: string,
    operationId?: string,
  ): Promise<InsuranceInternal[]> {
    const opId = operationId || `find_insurance_by_account_${Date.now()}`;

    try {
      this.logger.debug(
        `Finding insurances for account ${accountGuid} - Operation: ${opId}`,
      );

      const insurances = await this.repository.findByAccount(
        accountGuid,
        organizationGuid,
      );

      this.logger.debug(
        `Found ${insurances.length} insurances for account ${accountGuid} - Operation: ${opId}`,
      );

      return insurances;
    } catch (error) {
      this.logger.error(
        `Error finding insurances for account ${accountGuid} - Operation: ${opId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Error looking up account insurances',
        accountGuid,
        operationId: opId,
      });
    }
  }

  /**
   * Find insurances for account in specific academic year
   *
   * Used for:
   * - Checking duplicate insurance per type per year
   * - Renewal flow (showing active insurances for current year)
   * - Expiration scheduler (finding insurances to expire)
   *
   * @param accountGuid - Account GUID
   * @param membershipYear - Academic year (e.g., '2025-2026')
   * @param organizationGuid - Organization context
   * @param operationId - Operation tracking ID
   * @returns Array of InsuranceInternal for that year
   */
  async findByAccountAndYear(
    accountGuid: string,
    membershipYear: string | undefined,
    organizationGuid: string,
    operationId?: string,
  ): Promise<InsuranceInternal[]> {
    const opId = operationId || `find_insurance_by_account_year_${Date.now()}`;

    try {
      if (!membershipYear) {
        this.logger.warn(
          `Membership year not provided for account ${accountGuid} - Operation: ${opId}`,
        );
        return [];
      }

      this.logger.debug(
        `Finding insurances for account ${accountGuid}, year ${membershipYear} - Operation: ${opId}`,
      );

      // Use findAll with filters for account and membership year
      const insurances = await this.repository.findAll(
        { accountGuid, membershipYear },
        organizationGuid,
        opId,
      );

      this.logger.debug(
        `Found ${insurances.length} insurances for account ${accountGuid} in year ${membershipYear} - Operation: ${opId}`,
      );

      return insurances;
    } catch (error) {
      this.logger.error(
        `Error finding insurances for account ${accountGuid}, year ${membershipYear} - Operation: ${opId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Error looking up insurances by account and year',
        accountGuid,
        membershipYear,
        operationId: opId,
      });
    }
  }

  /**
   * Find active insurance of specific type for account
   *
   * Used for:
   * - CRITICAL: Checking Professional insurance prerequisite
   * - Validating insurance type eligibility
   * - Preventing duplicate type in same year
   *
   * @param accountGuid - Account GUID
   * @param insuranceType - Type to search for (e.g., 'professional')
   * @param membershipYear - Academic year
   * @param organizationGuid - Organization context
   * @param operationId - Operation tracking ID
   * @returns InsuranceInternal or null if not found
   */
  async findActiveByAccountAndType(
    accountGuid: string,
    insuranceType: string | undefined,
    membershipYear: string | undefined,
    organizationGuid: string,
    operationId?: string,
  ): Promise<InsuranceInternal | null> {
    const opId = operationId || `find_active_insurance_by_type_${Date.now()}`;

    try {
      if (!insuranceType || !membershipYear) {
        this.logger.debug(
          `Insurance type or year missing for account ${accountGuid} - Operation: ${opId}`,
        );
        return null;
      }

      this.logger.debug(
        `Finding active ${insuranceType} insurance for account ${accountGuid}, year ${membershipYear} - Operation: ${opId}`,
      );

      // Use findAll with filters for account and membership year
      const insurances = await this.repository.findAll(
        { accountGuid, membershipYear },
        organizationGuid,
        opId,
      );

      const activeInsurance = insurances.find(
        (ins) =>
          ins.osot_insurance_type === insuranceType &&
          ins.osot_insurance_status === InsuranceStatus.ACTIVE,
      );

      if (!activeInsurance) {
        this.logger.debug(
          `No active ${insuranceType} insurance found for account ${accountGuid} - Operation: ${opId}`,
        );
        return null;
      }

      return activeInsurance;
    } catch (error) {
      this.logger.error(
        `Error finding active ${insuranceType} insurance for account ${accountGuid} - Operation: ${opId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Error looking up active insurance by type',
        accountGuid,
        insuranceType,
        operationId: opId,
      });
    }
  }

  /**
   * Find all insurances of specific type with specific status
   *
   * Used for:
   * - Admin dashboards (all professional insurance)
   * - Compliance reporting (all expired insurances)
   * - Scheduler operations (find records to process)
   *
   * @param insuranceType - Type to filter (optional)
   * @param status - Status to filter (optional)
   * @param organizationGuid - Organization context
   * @param operationId - Operation tracking ID
   * @returns Array of InsuranceInternal matching criteria
   */
  async findByTypeAndStatus(
    insuranceType: string | undefined,
    status: InsuranceStatus | undefined,
    organizationGuid: string,
    operationId?: string,
  ): Promise<InsuranceInternal[]> {
    const opId = operationId || `find_insurance_by_type_status_${Date.now()}`;

    try {
      this.logger.debug(
        `Finding insurances - type: ${insuranceType ?? 'ANY'}, status: ${status ?? 'ANY'} - Operation: ${opId}`,
      );

      const filters: Record<string, unknown> = {};
      if (insuranceType) {
        filters.insuranceType = insuranceType;
      }
      if (status) {
        filters.insuranceStatus = status;
      }

      const insurances = await this.repository.findAll(
        filters,
        organizationGuid,
        opId,
      );

      this.logger.debug(
        `Found ${insurances.length} insurances matching criteria - Operation: ${opId}`,
      );

      return insurances;
    } catch (error) {
      this.logger.error(
        `Error finding insurances by type and status - Operation: ${opId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Error looking up insurances by type and status',
        insuranceType,
        status,
        operationId: opId,
      });
    }
  }

  /**
   * Find all insurances for a specific membership year
   *
   * Used for:
   * - Expiration scheduler (find all insurances of old year)
   * - Year-end reporting
   * - Compliance audits
   *
   * @param membershipYear - Academic year to find
   * @param organizationGuid - Organization context
   * @param excludeStatus - Exclude insurances with this status (e.g., CANCELLED)
   * @param operationId - Operation tracking ID
   * @returns Array of InsuranceInternal for that year
   */
  async findByYear(
    membershipYear: string,
    organizationGuid: string,
    excludeStatus?: InsuranceStatus,
    operationId?: string,
  ): Promise<InsuranceInternal[]> {
    const opId = operationId || `find_insurance_by_year_${Date.now()}`;

    try {
      this.logger.debug(
        `Finding insurances for year ${membershipYear}${excludeStatus ? `, excluding ${excludeStatus}` : ''} - Operation: ${opId}`,
      );

      const insurances = await this.repository.findAll(
        { membershipYear },
        organizationGuid,
        opId,
      );

      let filtered = insurances;
      if (excludeStatus) {
        filtered = insurances.filter(
          (ins) => ins.osot_insurance_status !== excludeStatus,
        );
      }

      this.logger.debug(
        `Found ${filtered.length} insurances for year ${membershipYear} - Operation: ${opId}`,
      );

      return filtered;
    } catch (error) {
      this.logger.error(
        `Error finding insurances for year ${membershipYear} - Operation: ${opId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Error looking up insurances by year',
        membershipYear,
        operationId: opId,
      });
    }
  }

  /**
   * Find all ACTIVE insurances expiring after a date
   *
   * Used for:
   * - Renewal notifications (insurances expiring soon)
   * - Compliance check (ensure active coverage)
   *
   * @param accountGuid - Account GUID
   * @param expiryDateAfter - Find insurances expiring AFTER this date
   * @param organizationGuid - Organization context
   * @param operationId - Operation tracking ID
   * @returns Array of InsuranceInternal
   */
  async findExpiringAfter(
    accountGuid: string,
    expiryDateAfter: Date,
    organizationGuid: string,
    operationId?: string,
  ): Promise<InsuranceInternal[]> {
    const opId = operationId || `find_expiring_insurances_${Date.now()}`;

    try {
      this.logger.debug(
        `Finding insurances for account ${accountGuid} expiring after ${expiryDateAfter.toISOString()} - Operation: ${opId}`,
      );

      const insurances = await this.findByAccount(
        accountGuid,
        organizationGuid,
        opId,
      );

      // Filter for ACTIVE with expiry date in future
      const expiringInsurances = insurances.filter(
        (ins) =>
          ins.osot_insurance_status === InsuranceStatus.ACTIVE &&
          ins.osot_expires_date &&
          new Date(ins.osot_expires_date) > expiryDateAfter,
      );

      this.logger.debug(
        `Found ${expiringInsurances.length} insurances expiring after ${expiryDateAfter.toISOString()} - Operation: ${opId}`,
      );

      return expiringInsurances;
    } catch (error) {
      this.logger.error(
        `Error finding expiring insurances for account ${accountGuid} - Operation: ${opId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Error looking up expiring insurances',
        accountGuid,
        operationId: opId,
      });
    }
  }

  /**
   * Find all insurance records created in the last 24 hours
   * Used by InsuranceReportScheduler to generate daily reports
   *
   * @param organizationGuid - Organization context (multi-tenant)
   * @param operationId - Operation tracking ID
   * @returns Array of InsuranceInternal records created in last 24h
   */
  async findLast24Hours(
    organizationGuid: string,
    operationId?: string,
  ): Promise<InsuranceInternal[]> {
    const opId = operationId || `find_last_24h_${Date.now()}`;

    try {
      this.logger.log(
        `Looking up insurances created in last 24 hours for org ${organizationGuid} - Operation: ${opId}`,
      );

      // Calculate 24-hour window
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      this.logger.debug(
        `24h report period: ${oneDayAgo.toISOString()} to ${now.toISOString()}`,
      );

      // Query insurances created in last 24 hours
      // Filter by:
      // 1. Organization match
      // 2. Created timestamp >= 24h ago
      // 3. Active status (not CANCELLED, EXPIRED)
      const insurances = await this.repository.findLast24Hours(
        organizationGuid,
        oneDayAgo,
        opId,
      );

      this.logger.log(
        `Found ${insurances.length} insurances in last 24h - Operation: ${opId}`,
      );

      return insurances;
    } catch (error) {
      this.logger.error(
        `Error looking up last 24h insurances - Operation: ${opId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Error looking up 24h insurances for report',
        organizationGuid,
        operationId: opId,
      });
    }
  }
}
