/**
 * Affiliate Interfaces Index
 * Centralized export for all affiliate-related interfaces
 *
 * @author OSOT Development Team
 * @version 1.0.0
 */

// ========================================
// CORE INTERFACES
// ========================================

// Internal business logic interface
export type {
  AffiliateInternal,
  AffiliateRepresentative,
  AffiliateOrganization,
  AffiliateContact,
  AffiliateAddress,
  AffiliateAccount,
  AffiliateRequiredFields,
  AffiliateUpdatableFields,
  AffiliatePublicFields,
} from './affiliate-internal.interface';

// Dataverse integration interface
export type {
  AffiliateDataverse,
  AffiliateDataverseQuery,
  AffiliateDataverseCollection,
  AffiliateDataverseError,
  AffiliateChoiceMapping,
  AffiliateFieldMetadata,
} from './affiliate-dataverse.interface';

// Repository contract interface
export type { AffiliateRepository } from './affiliate-repository.interface';

// ========================================
// DATA TRANSFER OBJECTS
// ========================================

// Request DTOs
export type {
  CreateAffiliateDto,
  UpdateAffiliateDto,
  AffiliateLoginDto,
  ChangeAffiliatePasswordDto,
  ResetAffiliatePasswordDto,
  AffiliateSearchDto,
} from './affiliate-dto.interface';

// Response DTOs
export type {
  AffiliateResponseDto,
  AffiliateDetailedResponseDto,
  AffiliateListItemDto,
  AffiliateProfileSummaryDto,
  AffiliateCollectionDto,
  AffiliateStatsDto,
} from './affiliate-dto.interface';

// Authentication DTOs
export type {
  AffiliateAuthResponseDto,
  AffiliateSessionDto,
} from './affiliate-dto.interface';

// Validation & Error DTOs
export type {
  AffiliateValidationErrorDto,
  AffiliateOperationResultDto,
} from './affiliate-dto.interface';

// Import/Export DTOs
export type {
  AffiliateImportDto,
  AffiliateExportDto,
} from './affiliate-dto.interface';

// ========================================
// CONVENIENCE RE-EXPORTS
// ========================================

// Most commonly used interfaces for easier imports
export type {
  AffiliateInternal as Affiliate,
  AffiliateResponseDto as AffiliateResponse,
  CreateAffiliateDto as CreateAffiliate,
  UpdateAffiliateDto as UpdateAffiliate,
  AffiliateRepository as IAffiliateRepository,
} from './';
