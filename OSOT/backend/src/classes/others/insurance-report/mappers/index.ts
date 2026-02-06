/**
 * Insurance Report Mappers Index
 *
 * Centralized export of all mapping functions for the insurance report entity.
 * Provides bidirectional transformations between different data representations.
 *
 * EXPORTED FUNCTIONS:
 * - mapDataverseToInternal: Dataverse → Internal
 * - mapInternalToResponseDto: Internal → Response DTO
 * - mapCreateDtoToInternal: Create DTO → Internal
 * - mapUpdateDtoToInternal: Update DTO → Internal
 * - mapInternalToDataverseCreate: Internal → Dataverse CREATE payload
 * - mapInternalToDataverseUpdate: Internal → Dataverse UPDATE payload
 *
 * HELPER FUNCTIONS:
 * - extractGuidFromBind: Extract GUID from OData bind string
 * - isValidIsoDate: Validate ISO 8601 date format
 *
 * @file index.ts
 * @module InsuranceReportModule/Mappers
 */

export {
  mapDataverseToInternal,
  mapInternalToResponseDto,
  mapCreateDtoToInternal,
  mapUpdateDtoToInternal,
  mapInternalToDataverseCreate,
  mapInternalToDataverseUpdate,
  extractGuidFromBind,
  isValidIsoDate,
} from './insurance-report.mapper';
