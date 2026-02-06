/**
 * Organization Mappers - Barrel Export
 *
 * Exports all mapper functions for Organization entity transformations:
 * - toInternal: Dataverse → Internal (parse API data)
 * - toDataverse: Internal → Dataverse (prepare for API)
 * - toResponseDto: Internal → Response DTO (full API response)
 * - toPublicResponseDto: Internal → Public Response DTO (white-label login)
 * - Batch mapping functions for arrays
 * - Utility parsers (parseAccountStatus, parsePrivilege, etc.)
 */

export {
  // Main mapper functions
  toInternal,
  toDataverse,
  toResponseDto,
  toPublicResponseDto,
  // Batch mapping functions
  toInternalArray,
  toResponseDtoArray,
  toPublicResponseDtoArray,
  // Utility parsers
  parseAccountStatus,
  parsePrivilege,
  parseAccessModifier,
  parseDate,
} from './organization.mapper';
