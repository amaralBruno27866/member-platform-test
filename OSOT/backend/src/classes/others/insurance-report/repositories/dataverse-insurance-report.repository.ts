/**
 * Dataverse Insurance Report Repository
 *
 * Implementation of InsuranceReportRepository using Dataverse as data store.
 * Handles all CRUD operations for Insurance Report entity via DataverseService.
 *
 * Architecture Notes:
 * - Uses DataverseService for HTTP calls to Dataverse API
 * - Maps between Internal ↔ Dataverse representations via InsuranceReportMapper
 * - Enforces multi-tenant security via organizationGuid filtering
 * - Role-based credentials: always uses 'main' app for Insurance Report operations
 * - Validates unique periods per organization (no overlapping reports)
 * - Enforces status transition rules at data access layer
 *
 * @file dataverse-insurance-report.repository.ts
 * @module InsuranceReportModule
 * @layer Repositories
 */

import { Injectable, Logger } from '@nestjs/common';
import { DataverseService } from '../../../../integrations/dataverse.service';
import {
  InsuranceReportInternal,
  InsuranceReportDataverse,
  InsuranceReportRepository,
  CreateInsuranceReportData,
  UpdateInsuranceReportData,
} from '../interfaces';
import {
  mapDataverseToInternal,
  mapInternalToDataverseCreate,
  mapInternalToDataverseUpdate,
} from '../mappers';
import {
  INSURANCE_REPORT_ENTITY,
  INSURANCE_REPORT_FIELDS,
  INSURANCE_REPORT_ODATA,
} from '../constants';
import { InsuranceReportStatus } from '../../insurance/enum/insurance-report-status.enum';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';

/**
 * Dataverse implementation of Insurance Report Repository
 */
@Injectable()
export class DataverseInsuranceReportRepository
  implements InsuranceReportRepository
{
  private readonly logger = new Logger(DataverseInsuranceReportRepository.name);

  constructor(private readonly dataverseService: DataverseService) {}

  /**
   * Create a new Insurance Report
   */
  async create(
    data: CreateInsuranceReportData,
    operationId: string,
  ): Promise<InsuranceReportInternal> {
    try {
      this.logger.log(
        `Creating Insurance Report for organization ${data.organizationGuid} - Operation: ${operationId}`,
      );

      if (!data.organizationGuid) {
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'organizationGuid is required',
          operationId,
        });
      }

      if (!data.periodStart || !data.periodEnd) {
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'periodStart and periodEnd are required',
          operationId,
        });
      }

      const dataversePayload = mapInternalToDataverseCreate(data);
      const credentials = this.dataverseService.getCredentialsByApp('main');

      const response = (await this.dataverseService.request(
        'POST',
        INSURANCE_REPORT_ENTITY,
        dataversePayload,
        credentials,
      )) as Record<string, unknown>;

      const createdId = this.extractIdFromResponse(response);
      const created = await this.findById(
        createdId,
        data.organizationGuid,
        operationId,
      );

      if (!created) {
        throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
          message: 'Insurance Report created but could not be retrieved',
          operationId,
          reportId: createdId,
        });
      }

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
   * Find Insurance Report by GUID
   */
  async findById(
    reportGuid: string,
    organizationId: string,
    operationId: string,
  ): Promise<InsuranceReportInternal | null> {
    try {
      this.logger.debug(
        `Finding Insurance Report: ${reportGuid} - Operation: ${operationId}`,
      );

      const credentials = this.dataverseService.getCredentialsByApp('main');

      const filter = `${INSURANCE_REPORT_FIELDS.TABLE_INSURANCE_REPORT_ID} eq '${reportGuid}' and ${INSURANCE_REPORT_FIELDS.ORGANIZATION} eq '${organizationId}'`;
      const endpoint = `${INSURANCE_REPORT_ENTITY}?$filter=${filter}&${INSURANCE_REPORT_ODATA.SELECT_FULL}`;

      const response = (await this.dataverseService.request(
        'GET',
        endpoint,
        null,
        credentials,
      )) as { value?: unknown };

      const items: InsuranceReportDataverse[] = Array.isArray(response?.value)
        ? (response.value as InsuranceReportDataverse[])
        : [];

      return items.length > 0 ? mapDataverseToInternal(items[0]) : null;
    } catch (error) {
      this.logger.error(
        `Error finding Insurance Report: ${reportGuid} - Operation: ${operationId}`,
        error,
      );
      return null;
    }
  }

  /**
   * Find Insurance Report by report ID (autonumber)
   */
  async findByReportId(
    reportId: string,
    organizationId: string,
    operationId: string,
  ): Promise<InsuranceReportInternal | null> {
    try {
      this.logger.debug(
        `Finding Insurance Report by report ID: ${reportId} - Operation: ${operationId}`,
      );

      const credentials = this.dataverseService.getCredentialsByApp('main');

      const filter = `${INSURANCE_REPORT_FIELDS.REPORT_ID} eq '${reportId}' and ${INSURANCE_REPORT_FIELDS.ORGANIZATION} eq '${organizationId}'`;
      const endpoint = `${INSURANCE_REPORT_ENTITY}?$filter=${filter}&${INSURANCE_REPORT_ODATA.SELECT_FULL}`;

      const response = (await this.dataverseService.request(
        'GET',
        endpoint,
        null,
        credentials,
      )) as { value?: unknown };

      const items: InsuranceReportDataverse[] = Array.isArray(response?.value)
        ? (response.value as InsuranceReportDataverse[])
        : [];

      return items.length > 0 ? mapDataverseToInternal(items[0]) : null;
    } catch (error) {
      this.logger.error(
        `Error finding Insurance Report by report ID: ${reportId} - Operation: ${operationId}`,
        error,
      );
      return null;
    }
  }

  /**
   * Find all Insurance Reports matching filters
   */
  async findWithFilters(
    filters: Record<string, unknown>,
    operationId: string,
  ): Promise<InsuranceReportInternal[]> {
    try {
      this.logger.debug(
        `Finding Insurance Reports with filters - Operation: ${operationId}`,
      );

      const credentials = this.dataverseService.getCredentialsByApp('main');
      const organizationId = filters.organizationId as string;

      const filterString = this.buildFilterString(filters, organizationId);

      let endpoint = `${INSURANCE_REPORT_ENTITY}?${INSURANCE_REPORT_ODATA.SELECT_FULL}`;
      if (filterString) {
        endpoint += `&$filter=${filterString}`;
      }

      endpoint += `&$orderby=${INSURANCE_REPORT_FIELDS.PERIOD_END} desc`;

      if (filters.top && typeof filters.top === 'number') {
        endpoint += `&$top=${filters.top}`;
      }

      const response = (await this.dataverseService.request(
        'GET',
        endpoint,
        null,
        credentials,
      )) as { value?: unknown };

      const items: InsuranceReportDataverse[] = Array.isArray(response?.value)
        ? (response.value as InsuranceReportDataverse[])
        : [];

      return items.map((item) => mapDataverseToInternal(item));
    } catch (error) {
      this.logger.error(
        `Error finding Insurance Reports with filters - Operation: ${operationId}`,
        error,
      );
      return [];
    }
  }

  /**
   * Find pending reports for organization
   */
  async findPendingByOrganization(
    organizationId: string,
    operationId: string,
    limit?: number,
  ): Promise<InsuranceReportInternal[]> {
    try {
      this.logger.debug(
        `Finding pending Insurance Reports - Operation: ${operationId}`,
      );

      const credentials = this.dataverseService.getCredentialsByApp('main');

      const filter = `${INSURANCE_REPORT_FIELDS.ORGANIZATION} eq '${organizationId}' and ${INSURANCE_REPORT_FIELDS.REPORT_STATUS} eq 100000000`;

      let endpoint = `${INSURANCE_REPORT_ENTITY}?$filter=${filter}&${INSURANCE_REPORT_ODATA.SELECT_FULL}`;
      endpoint += `&$orderby=${INSURANCE_REPORT_FIELDS.PERIOD_END} desc`;

      if (limit) {
        endpoint += `&$top=${limit}`;
      }

      const response = (await this.dataverseService.request(
        'GET',
        endpoint,
        null,
        credentials,
      )) as { value?: unknown };

      const items: InsuranceReportDataverse[] = Array.isArray(response?.value)
        ? (response.value as InsuranceReportDataverse[])
        : [];

      return items.map((item) => mapDataverseToInternal(item));
    } catch (error) {
      this.logger.error(
        `Error finding pending reports - Operation: ${operationId}`,
        error,
      );
      return [];
    }
  }

  /**
   * Update an existing Insurance Report
   */
  async update(
    reportGuid: string,
    data: UpdateInsuranceReportData,
    organizationId: string,
    operationId: string,
  ): Promise<InsuranceReportInternal> {
    try {
      this.logger.log(
        `Updating Insurance Report ${reportGuid} - Operation: ${operationId}`,
      );

      const existing = await this.findById(
        reportGuid,
        organizationId,
        operationId,
      );
      if (!existing) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message:
            'Insurance Report not found or does not belong to organization',
          operationId,
          reportGuid,
          organizationId,
        });
      }

      const dataversePayload = mapInternalToDataverseUpdate(data);
      const credentials = this.dataverseService.getCredentialsByApp('main');

      const endpoint = `${INSURANCE_REPORT_ENTITY}(${reportGuid})`;
      await this.dataverseService.request(
        'PATCH',
        endpoint,
        dataversePayload,
        credentials,
      );

      const updated = await this.findById(
        reportGuid,
        organizationId,
        operationId,
      );

      if (!updated) {
        throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
          message: 'Insurance Report updated but could not be retrieved',
          operationId,
          reportGuid,
        });
      }

      this.logger.log(
        `Insurance Report updated: ${reportGuid} - Operation: ${operationId}`,
      );

      return updated;
    } catch (error) {
      this.logger.error(
        `Error updating Insurance Report ${reportGuid} - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Delete an Insurance Report
   */
  async delete(
    reportGuid: string,
    organizationId: string,
    operationId: string,
  ): Promise<void> {
    try {
      this.logger.log(
        `Deleting Insurance Report ${reportGuid} - Operation: ${operationId}`,
      );

      const existing = await this.findById(
        reportGuid,
        organizationId,
        operationId,
      );
      if (!existing) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message:
            'Insurance Report not found or does not belong to organization',
          operationId,
          reportGuid,
          organizationId,
        });
      }

      const credentials = this.dataverseService.getCredentialsByApp('main');
      const endpoint = `${INSURANCE_REPORT_ENTITY}(${reportGuid})`;
      await this.dataverseService.request(
        'DELETE',
        endpoint,
        null,
        credentials,
      );

      this.logger.log(
        `Insurance Report deleted: ${reportGuid} - Operation: ${operationId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error deleting Insurance Report ${reportGuid} - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Check if report exists for period (duplicate detection)
   */
  async existsForPeriod(
    organizationId: string,
    periodStart: Date,
    periodEnd: Date,
    operationId: string,
  ): Promise<boolean> {
    try {
      this.logger.debug(`Checking period exists - Operation: ${operationId}`);

      const credentials = this.dataverseService.getCredentialsByApp('main');

      const startDate = periodStart.toISOString().split('T')[0];
      const endDate = periodEnd.toISOString().split('T')[0];

      const filter = `${INSURANCE_REPORT_FIELDS.ORGANIZATION} eq '${organizationId}' and ${INSURANCE_REPORT_FIELDS.PERIOD_START} eq '${startDate}' and ${INSURANCE_REPORT_FIELDS.PERIOD_END} eq '${endDate}'`;

      const endpoint = `${INSURANCE_REPORT_ENTITY}?$filter=${filter}&${INSURANCE_REPORT_ODATA.SELECT_ID_ONLY}&$top=1`;

      const response = (await this.dataverseService.request(
        'GET',
        endpoint,
        null,
        credentials,
      )) as { value?: unknown };

      const items = Array.isArray(response?.value) ? response.value : [];
      return items.length > 0;
    } catch (error) {
      this.logger.error(
        `Error checking period exists - Operation: ${operationId}`,
        error,
      );
      return false;
    }
  }

  /**
   * Count reports by status for organization
   */
  async countByStatus(
    organizationId: string,
    operationId: string,
  ): Promise<Record<string, number>> {
    try {
      this.logger.debug(
        `Counting reports by status - Operation: ${operationId}`,
      );

      const allReports = await this.findByOrganization(
        organizationId,
        operationId,
        1000,
      );

      const counts: Record<string, number> = {
        [InsuranceReportStatus.PENDING_APPROVAL]: 0,
        [InsuranceReportStatus.APPROVED]: 0,
        [InsuranceReportStatus.REJECTED]: 0,
        [InsuranceReportStatus.SENT_TO_PROVIDER]: 0,
        [InsuranceReportStatus.ACKNOWLEDGED]: 0,
      };

      for (const report of allReports) {
        const status = report.reportStatus;
        if (status && status in counts) {
          counts[status]++;
        }
      }

      return counts;
    } catch (error) {
      this.logger.error(
        `Error counting reports by status - Operation: ${operationId}`,
        error,
      );
      return {};
    }
  }

  /**
   * Find all reports for organization
   */
  async findByOrganization(
    organizationId: string,
    operationId: string,
    limit?: number,
  ): Promise<InsuranceReportInternal[]> {
    try {
      this.logger.debug(
        `Finding all reports for organization - Operation: ${operationId}`,
      );

      const credentials = this.dataverseService.getCredentialsByApp('main');

      const filter = `${INSURANCE_REPORT_FIELDS.ORGANIZATION} eq '${organizationId}'`;

      let endpoint = `${INSURANCE_REPORT_ENTITY}?$filter=${filter}&${INSURANCE_REPORT_ODATA.SELECT_FULL}`;
      endpoint += `&$orderby=${INSURANCE_REPORT_FIELDS.PERIOD_END} desc`;

      if (limit) {
        endpoint += `&$top=${limit}`;
      }

      const response = (await this.dataverseService.request(
        'GET',
        endpoint,
        null,
        credentials,
      )) as { value?: unknown };

      const items: InsuranceReportDataverse[] = Array.isArray(response?.value)
        ? (response.value as InsuranceReportDataverse[])
        : [];

      return items.map((item) => mapDataverseToInternal(item));
    } catch (error) {
      this.logger.error(
        `Error finding reports for organization - Operation: ${operationId}`,
        error,
      );
      return [];
    }
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Extract GUID from Dataverse create response
   */
  private extractIdFromResponse(response: Record<string, unknown>): string {
    const id =
      response[INSURANCE_REPORT_FIELDS.TABLE_INSURANCE_REPORT_ID] ||
      response['osot_table_insurance_reportid'];

    if (!id || typeof id !== 'string') {
      throw new Error('Could not extract ID from Dataverse response');
    }

    return id;
  }

  /**
   * Build OData filter string from filter object
   */
  private buildFilterString(
    filters: Record<string, unknown>,
    organizationId: string,
  ): string {
    const conditions: string[] = [];

    // Always filter by organization (multi-tenancy)
    conditions.push(
      `${INSURANCE_REPORT_FIELDS.ORGANIZATION} eq '${organizationId}'`,
    );

    // Status filter
    if (filters.status !== undefined && filters.status !== null) {
      let statusNumber: string | number = '';
      if (typeof filters.status === 'number') {
        statusNumber = filters.status;
      } else if (typeof filters.status === 'string') {
        statusNumber = filters.status;
      }
      if (statusNumber !== '') {
        conditions.push(
          `${INSURANCE_REPORT_FIELDS.REPORT_STATUS} eq ${statusNumber}`,
        );
      }
    }

    // Date range filter
    if (filters.startDate !== undefined && filters.startDate !== null) {
      let startDate = '';
      if (filters.startDate instanceof Date) {
        startDate = filters.startDate.toISOString().split('T')[0];
      } else if (typeof filters.startDate === 'string') {
        startDate = new Date(filters.startDate).toISOString().split('T')[0];
      } else if (typeof filters.startDate === 'number') {
        startDate = new Date(filters.startDate).toISOString().split('T')[0];
      }
      if (startDate) {
        conditions.push(
          `${INSURANCE_REPORT_FIELDS.PERIOD_END} ge '${startDate}'`,
        );
      }
    }

    // Date range filter
    if (filters.endDate !== undefined && filters.endDate !== null) {
      let endDate = '';
      if (filters.endDate instanceof Date) {
        endDate = filters.endDate.toISOString().split('T')[0];
      } else if (typeof filters.endDate === 'string') {
        endDate = new Date(filters.endDate).toISOString().split('T')[0];
      } else if (typeof filters.endDate === 'number') {
        endDate = new Date(filters.endDate).toISOString().split('T')[0];
      }
      if (endDate) {
        conditions.push(
          `${INSURANCE_REPORT_FIELDS.PERIOD_END} le '${endDate}'`,
        );
      }
    }

    // Report ID filter
    if (
      filters.reportId !== undefined &&
      filters.reportId !== null &&
      typeof filters.reportId === 'string'
    ) {
      conditions.push(
        `${INSURANCE_REPORT_FIELDS.REPORT_ID} eq '${filters.reportId}'`,
      );
    }

    return conditions.join(' and ');
  }
}
