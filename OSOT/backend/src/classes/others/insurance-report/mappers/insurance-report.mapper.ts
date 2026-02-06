/**
 * Insurance Report Mapper
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - enums: Uses InsuranceReportStatus for type-safe status transformations
 * - interfaces: Transforms between Internal, Dataverse, and DTO representations
 * - constants: Uses field name mappings from insurance-report-fields.constant
 *
 * MAPPING PHILOSOPHY:
 * - Bidirectional transformations: DTO ↔ Internal ↔ Dataverse ↔ Response
 * - Type-safe enum conversions (status numbers ↔ enum values)
 * - OData binding format handling for organization relationship
 * - Date string normalization (ISO 8601)
 * - Security: Excludes sensitive tokens from response DTOs
 * - Multi-tenancy: Organization GUID binding
 *
 * TRANSFORMATION FLOWS:
 * 1. CREATE: CreateDto → Internal → Dataverse (POST)
 * 2. READ: Dataverse → Internal → ResponseDto (GET)
 * 3. UPDATE: UpdateDto → Internal → Dataverse (PATCH)
 * 4. QUERY: QueryDto → OData filters (used in repository)
 *
 * @file insurance-report.mapper.ts
 * @module InsuranceReportModule
 * @layer Mappers
 */

import { InsuranceReportStatus } from '../../insurance/enum/insurance-report-status.enum';
import { CreateInsuranceReportDto } from '../dtos/create-insurance-report.dto';
import { UpdateInsuranceReportDto } from '../dtos/update-insurance-report.dto';
import { InsuranceReportResponseDto } from '../dtos/insurance-report-response.dto';
import {
  InsuranceReportInternal,
  CreateInsuranceReportData,
  UpdateInsuranceReportData,
} from '../interfaces/insurance-report-internal.interface';
import {
  InsuranceReportDataverse,
  InsuranceReportStatusDataverse,
  InsuranceReportDataverseCreatePayload,
  InsuranceReportDataverseUpdatePayload,
} from '../interfaces/insurance-report-dataverse.interface';
import { INSURANCE_REPORT_FIELDS } from '../constants/insurance-report-fields.constant';

// ========================================
// ENUM CONVERSION UTILITIES
// ========================================

/**
 * Convert InsuranceReportStatus enum to Dataverse choice number
 */
function statusToDataverse(
  status: InsuranceReportStatus,
): InsuranceReportStatusDataverse {
  const mapping: Record<InsuranceReportStatus, InsuranceReportStatusDataverse> =
    {
      [InsuranceReportStatus.PENDING_APPROVAL]:
        InsuranceReportStatusDataverse.PENDING_APPROVAL,
      [InsuranceReportStatus.APPROVED]: InsuranceReportStatusDataverse.APPROVED,
      [InsuranceReportStatus.REJECTED]: InsuranceReportStatusDataverse.REJECTED,
      [InsuranceReportStatus.SENT_TO_PROVIDER]:
        InsuranceReportStatusDataverse.SENT_TO_PROVIDER,
      [InsuranceReportStatus.ACKNOWLEDGED]:
        InsuranceReportStatusDataverse.ACKNOWLEDGED,
    };
  return mapping[status];
}

/**
 * Convert Dataverse choice number to InsuranceReportStatus enum
 */
function statusFromDataverse(
  dataverseStatus: InsuranceReportStatusDataverse,
): InsuranceReportStatus {
  const mapping: Record<InsuranceReportStatusDataverse, InsuranceReportStatus> =
    {
      [InsuranceReportStatusDataverse.PENDING_APPROVAL]:
        InsuranceReportStatus.PENDING_APPROVAL,
      [InsuranceReportStatusDataverse.APPROVED]: InsuranceReportStatus.APPROVED,
      [InsuranceReportStatusDataverse.REJECTED]: InsuranceReportStatus.REJECTED,
      [InsuranceReportStatusDataverse.SENT_TO_PROVIDER]:
        InsuranceReportStatus.SENT_TO_PROVIDER,
      [InsuranceReportStatusDataverse.ACKNOWLEDGED]:
        InsuranceReportStatus.ACKNOWLEDGED,
    };
  return mapping[dataverseStatus];
}

// ========================================
// CORE MAPPING FUNCTIONS
// ========================================

/**
 * Map Dataverse response to internal representation
 * Handles transformation from external Dataverse API format to internal business objects
 *
 * TRANSFORMATIONS:
 * - Choice numbers → Enums
 * - ISO 8601 strings → Date objects
 * - OData lookup value → organizationGuid
 * - snake_case → camelCase (field names preserved for consistency)
 */
export function mapDataverseToInternal(
  dataverse: InsuranceReportDataverse,
): InsuranceReportInternal {
  return {
    // System fields
    osot_table_insurance_reportid: dataverse.osot_table_insurance_reportid,
    reportId: dataverse.osot_report_id,
    createdon: dataverse.createdon ? new Date(dataverse.createdon) : undefined,
    modifiedon: dataverse.modifiedon
      ? new Date(dataverse.modifiedon)
      : undefined,
    ownerid: dataverse.ownerid,

    // Organization context (multi-tenant)
    organizationGuid: dataverse._osot_table_organization_value,

    // Period (24-hour window)
    periodStart: dataverse.osot_period_start
      ? new Date(dataverse.osot_period_start)
      : new Date(),
    periodEnd: dataverse.osot_period_end
      ? new Date(dataverse.osot_period_end)
      : new Date(),

    // Metrics
    totalRecords: dataverse.osot_total_records || 0,
    totalValue: dataverse.osot_total_value || 0,

    // Status
    reportStatus: dataverse.osot_report_status
      ? statusFromDataverse(dataverse.osot_report_status)
      : InsuranceReportStatus.PENDING_APPROVAL,

    // Approval metadata
    approvedToken: dataverse.osot_approved_token,
    approvedBy: dataverse.osot_approved_by,
    approvedDate: dataverse.osot_approved_date
      ? new Date(dataverse.osot_approved_date)
      : undefined,

    // Rejection metadata
    rejectionToken: dataverse.osot_rejection_token,
    rejectBy: dataverse.osot_reject_by,
    rejectedDate: dataverse.osot_rejected_date
      ? new Date(dataverse.osot_rejected_date)
      : undefined,
    rejectionReason: dataverse.osot_rejection_reason,

    // Access control
    privilege: dataverse.osot_privilege?.toString(),
    accessModifier: dataverse.osot_access_modifier?.toString(),
  };
}

/**
 * Map internal representation to Response DTO format
 * Used for API responses to frontend
 *
 * SECURITY: Excludes sensitive tokens (approvedToken, rejectionToken)
 * INCLUDES: All metadata for display (approved by, rejected by, reasons)
 */
export function mapInternalToResponseDto(
  internal: InsuranceReportInternal,
): InsuranceReportResponseDto {
  const responseDto = new InsuranceReportResponseDto();

  return Object.assign(responseDto, {
    // System fields
    osot_table_insurance_reportid: internal.osot_table_insurance_reportid || '',
    reportId: internal.reportId || '',
    createdon: internal.createdon?.toISOString() || '',
    modifiedon: internal.modifiedon?.toISOString(),

    // Organization context
    organizationGuid: internal.organizationGuid || '',
    // organizationName will be populated if expanded in query

    // Period
    periodStart: internal.periodStart,
    periodEnd: internal.periodEnd,

    // Metrics
    totalRecords: internal.totalRecords,
    totalValue: internal.totalValue,

    // Status
    reportStatus: internal.reportStatus,

    // Approval metadata (NO TOKENS for security)
    approvedBy: internal.approvedBy,
    approvedDate: internal.approvedDate?.toISOString(),

    // Rejection metadata (NO TOKENS for security)
    rejectBy: internal.rejectBy,
    rejectedDate: internal.rejectedDate?.toISOString(),
    rejectionReason: internal.rejectionReason,

    // Access control
    privilege: internal.privilege,
    accessModifier: internal.accessModifier,
  });
}

/**
 * Map Create DTO to internal create format
 * Used for report creation operations
 *
 * VALIDATION: Assumes DTO has passed class-validator checks
 * DEFAULTS: reportStatus = PENDING_APPROVAL if not provided
 */
export function mapCreateDtoToInternal(
  createDto: CreateInsuranceReportDto,
): CreateInsuranceReportData {
  return {
    // Organization context (required - from JWT)
    organizationGuid: createDto.organizationGuid,

    // Period (required)
    periodStart: new Date(createDto.periodStart),
    periodEnd: new Date(createDto.periodEnd),

    // Metrics (required)
    totalRecords: createDto.totalRecords,
    totalValue: createDto.totalValue,

    // Status (optional - defaults to PENDING_APPROVAL)
    reportStatus:
      createDto.reportStatus || InsuranceReportStatus.PENDING_APPROVAL,

    // Tokens (optional - for testing/admin workflows)
    approvedToken: createDto.approvedToken,
    rejectionToken: createDto.rejectionToken,

    // Access control (optional)
    privilege: createDto.privilege,
    accessModifier: createDto.accessModifier,
  };
}

/**
 * Map Update DTO to internal update format
 * Used for report update operations (approval/rejection workflows)
 *
 * VALIDATION: Assumes DTO has passed class-validator checks
 * PARTIAL: Only includes fields that are present in DTO
 */
export function mapUpdateDtoToInternal(
  updateDto: UpdateInsuranceReportDto,
): UpdateInsuranceReportData {
  const updateData: UpdateInsuranceReportData = {};

  // Only include fields that are explicitly set
  if (updateDto.reportStatus !== undefined) {
    updateData.reportStatus = updateDto.reportStatus;
  }

  if (updateDto.approvedToken !== undefined) {
    updateData.approvedToken = updateDto.approvedToken;
  }

  if (updateDto.approvedBy !== undefined) {
    updateData.approvedBy = updateDto.approvedBy;
  }

  if (updateDto.approvedDate !== undefined) {
    updateData.approvedDate = new Date(updateDto.approvedDate);
  }

  if (updateDto.rejectionToken !== undefined) {
    updateData.rejectionToken = updateDto.rejectionToken;
  }

  if (updateDto.rejectBy !== undefined) {
    updateData.rejectBy = updateDto.rejectBy;
  }

  if (updateDto.rejectionReason !== undefined) {
    updateData.rejectionReason = updateDto.rejectionReason;
  }

  return updateData;
}

/**
 * Map internal create data to Dataverse CREATE payload
 * Constructs POST request body for Dataverse API
 *
 * CRITICAL:
 * - Uses osot_Table_Organization@odata.bind for relationship binding
 * - Converts enum → Dataverse choice number
 * - Excludes system fields (osot_table_insurance_reportid, createdon, modifiedon, ownerid)
 */
export function mapInternalToDataverseCreate(
  internal: CreateInsuranceReportData,
): InsuranceReportDataverseCreatePayload {
  const payload: InsuranceReportDataverseCreatePayload = {
    // Organization relationship (OData bind)
    'osot_Table_Organization@odata.bind': `/osot_table_organizations(${internal.organizationGuid})`,

    // Period (required)
    [INSURANCE_REPORT_FIELDS.PERIOD_START]: internal.periodStart
      .toISOString()
      .split('T')[0],
    [INSURANCE_REPORT_FIELDS.PERIOD_END]: internal.periodEnd
      .toISOString()
      .split('T')[0],

    // Metrics (required)
    [INSURANCE_REPORT_FIELDS.TOTAL_RECORDS]: internal.totalRecords,
    [INSURANCE_REPORT_FIELDS.TOTAL_VALUE]: internal.totalValue,

    // Status (convert enum → Dataverse number)
    [INSURANCE_REPORT_FIELDS.REPORT_STATUS]: statusToDataverse(
      internal.reportStatus,
    ),
  };

  // Optional fields (only include if present)
  if (internal.approvedToken) {
    payload[INSURANCE_REPORT_FIELDS.APPROVED_TOKEN] = internal.approvedToken;
  }

  if (internal.rejectionToken) {
    payload[INSURANCE_REPORT_FIELDS.REJECTION_TOKEN] = internal.rejectionToken;
  }

  if (internal.privilege !== undefined) {
    payload[INSURANCE_REPORT_FIELDS.PRIVILEGE] = Number(internal.privilege);
  }

  if (internal.accessModifier !== undefined) {
    payload[INSURANCE_REPORT_FIELDS.ACCESS_MODIFIER] = Number(
      internal.accessModifier,
    );
  }

  return payload;
}

/**
 * Map internal update data to Dataverse UPDATE payload
 * Constructs PATCH request body for Dataverse API
 *
 * PARTIAL: Only includes fields that are present in updateData
 * NO ORGANIZATION: Organization cannot be changed after creation
 */
export function mapInternalToDataverseUpdate(
  internal: UpdateInsuranceReportData,
): InsuranceReportDataverseUpdatePayload {
  const payload: InsuranceReportDataverseUpdatePayload = {};

  // Only include fields that are explicitly set
  if (internal.reportStatus !== undefined) {
    payload[INSURANCE_REPORT_FIELDS.REPORT_STATUS] = statusToDataverse(
      internal.reportStatus,
    );
  }

  if (internal.approvedToken !== undefined) {
    payload[INSURANCE_REPORT_FIELDS.APPROVED_TOKEN] = internal.approvedToken;
  }

  if (internal.approvedBy !== undefined) {
    payload[INSURANCE_REPORT_FIELDS.APPROVED_BY] = internal.approvedBy;
  }

  if (internal.approvedDate !== undefined) {
    payload[INSURANCE_REPORT_FIELDS.APPROVED_DATE] =
      internal.approvedDate.toISOString();
  }

  if (internal.rejectionToken !== undefined) {
    payload[INSURANCE_REPORT_FIELDS.REJECTION_TOKEN] = internal.rejectionToken;
  }

  if (internal.rejectBy !== undefined) {
    payload[INSURANCE_REPORT_FIELDS.REJECT_BY] = internal.rejectBy;
  }

  if (internal.rejectionReason !== undefined) {
    payload[INSURANCE_REPORT_FIELDS.REJECTION_REASON] =
      internal.rejectionReason;
  }

  return payload;
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Extract organization GUID from OData bind string
 * Example: "/osot_table_organizations(guid-123)" → "guid-123"
 *
 * @param bindString OData bind format string
 * @returns Extracted GUID or undefined
 */
export function extractGuidFromBind(bindString?: string): string | undefined {
  if (!bindString) return undefined;
  const match = bindString.match(/\(([a-f0-9-]+)\)/i);
  return match?.[1];
}

/**
 * Validate if a date string is a valid ISO 8601 format
 *
 * @param dateString Date string to validate
 * @returns True if valid ISO 8601, false otherwise
 */
export function isValidIsoDate(dateString: string): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString === date.toISOString();
}
