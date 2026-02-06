/**
 * Data Transfer Object interfaces for Affiliate module
 * Used for API requests, responses, and data transformation
 *
 * PURPOSE:
 * - Define contracts for external API communication
 * - Provide type safety for request/response data
 * - Separate internal business logic from external interfaces
 * - Enable clean data transformation between layers
 *
 * SECURITY:
 * - Excludes sensitive fields (passwords, internal IDs, privileges)
 * - Provides controlled exposure of affiliate data
 * - Includes validation-friendly structures
 *
 * BUSINESS CONTEXT:
 * - Support affiliate registration, updates, and queries
 * - Enable public affiliate directory functionality
 * - Facilitate partner integration workflows
 *
 * @author OSOT Development Team
 * @version 1.0.0
 */

import {
  AffiliateArea,
  AccountStatus,
  AccessModifier,
  Province,
  Country,
  City,
} from '../../../../common/enums';

// ========================================
// REQUEST DTOs (Input)
// ========================================

/**
 * DTO for creating a new affiliate
 * Contains all required fields for affiliate registration
 */
export interface CreateAffiliateDto {
  // Organization Profile
  affiliateName: string;
  affiliateArea: AffiliateArea;

  // Representative Identity
  representativeFirstName: string;
  representativeLastName: string;
  representativeJobTitle: string;

  // Contact Information
  affiliateEmail: string;
  affiliatePhone: string;
  affiliateWebsite?: string;

  // Social Media (Optional)
  affiliateFacebook?: string;
  affiliateInstagram?: string;
  affiliateTikTok?: string;
  affiliateLinkedIn?: string;

  // Address Information
  affiliateAddress1: string;
  affiliateAddress2?: string;
  affiliateCity: City;
  affiliateProvince: Province;
  affiliatePostalCode: string;
  affiliateCountry: Country;

  // Account Setup
  password: string;
  confirmPassword: string;
  accountDeclaration: boolean;

  // Optional Settings
  accessModifiers?: AccessModifier;
}

/**
 * DTO for updating an existing affiliate
 * All fields are optional to support partial updates
 */
export interface UpdateAffiliateDto {
  // Organization Profile
  affiliateName?: string;
  affiliateArea?: AffiliateArea;

  // Representative Identity
  representativeFirstName?: string;
  representativeLastName?: string;
  representativeJobTitle?: string;

  // Contact Information
  affiliateEmail?: string;
  affiliatePhone?: string;
  affiliateWebsite?: string;

  // Social Media
  affiliateFacebook?: string;
  affiliateInstagram?: string;
  affiliateTikTok?: string;
  affiliateLinkedIn?: string;

  // Address Information
  affiliateAddress1?: string;
  affiliateAddress2?: string;
  affiliateCity?: City;
  affiliateProvince?: Province;
  affiliatePostalCode?: string;
  affiliateCountry?: Country;

  // Account Settings
  accountDeclaration?: boolean;
  accessModifiers?: AccessModifier;
}

/**
 * DTO for affiliate login credentials
 */
export interface AffiliateLoginDto {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * DTO for password change request
 */
export interface ChangeAffiliatePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

/**
 * DTO for password reset request
 */
export interface ResetAffiliatePasswordDto {
  email: string;
}

/**
 * DTO for search/filter operations
 */
export interface AffiliateSearchDto {
  name?: string;
  area?: AffiliateArea;
  status?: AccountStatus;
  province?: Province;
  country?: Country;
  activeOnly?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'area' | 'createdOn' | 'province';
  sortOrder?: 'asc' | 'desc';
}

// ========================================
// RESPONSE DTOs (Output)
// ========================================

/**
 * DTO for affiliate response (public view)
 * Excludes sensitive information
 */
export interface AffiliateResponseDto {
  // Public Identifiers
  affiliateId: string; // Business ID (affi-0000001)

  // Organization Profile
  affiliateName: string;
  affiliateArea: AffiliateArea;
  affiliateAreaLabel: string;

  // Representative Identity
  representativeFirstName: string;
  representativeLastName: string;
  representativeFullName: string;
  representativeJobTitle: string;

  // Contact Information
  affiliateEmail: string;
  affiliatePhone: string;
  affiliateWebsite?: string;

  // Social Media
  affiliateFacebook?: string;
  affiliateInstagram?: string;
  affiliateTikTok?: string;
  affiliateLinkedIn?: string;

  // Address Information
  affiliateAddress1: string;
  affiliateAddress2?: string;
  affiliateCity: City;
  affiliateCityLabel: string;
  affiliateProvince: Province;
  affiliateProvinceLabel: string;
  affiliatePostalCode: string;
  affiliateCountry: Country;
  affiliateCountryLabel: string;

  // Account Status
  accountStatus: AccountStatus;
  accountStatusLabel: string;
  activeMember: boolean;
  accountDeclaration: boolean;

  // Access Control
  accessModifiers: AccessModifier;
  accessModifiersLabel: string;

  // Metadata
  createdOn: string;
  modifiedOn: string;

  // Computed Fields
  addressSummary: string;
  socialMediaCount: number;
}

/**
 * DTO for detailed affiliate response (authenticated view)
 * Includes additional information for authenticated users
 */
export interface AffiliateDetailedResponseDto extends AffiliateResponseDto {
  // Additional Metadata
  lastLoginDate?: string;
  membershipStartDate?: string;

  // Extended Information
  totalConnections?: number;
  verificationStatus?: 'pending' | 'verified' | 'rejected';

  // Activity Metrics
  profileCompleteness: number;
  lastActivityDate?: string;
}

/**
 * DTO for minimal affiliate information (list view)
 */
export interface AffiliateListItemDto {
  affiliateId: string;
  affiliateName: string;
  affiliateArea: AffiliateArea;
  affiliateAreaLabel: string;
  representativeFullName: string;
  affiliateCity: City;
  affiliateCityLabel: string;
  affiliateProvince: Province;
  affiliateProvinceLabel: string;
  accountStatus: AccountStatus;
  accountStatusLabel: string;
  activeMember: boolean;
  createdOn: string;
}

/**
 * DTO for affiliate profile summary
 */
export interface AffiliateProfileSummaryDto {
  affiliateId: string;
  affiliateName: string;
  representativeFullName: string;
  affiliateArea: AffiliateArea;
  affiliateAreaLabel: string;
  affiliateEmail: string;
  affiliatePhone: string;
  addressSummary: string;
  activeMember: boolean;
}

// ========================================
// COLLECTION & PAGINATION DTOs
// ========================================

/**
 * DTO for paginated affiliate results
 */
export interface AffiliateCollectionDto {
  affiliates: AffiliateListItemDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters?: AffiliateSearchDto;
}

/**
 * DTO for affiliate statistics
 */
export interface AffiliateStatsDto {
  totalAffiliates: number;
  activeAffiliates: number;
  inactiveAffiliates: number;
  pendingAffiliates: number;
  byArea: Record<AffiliateArea, number>;
  byProvince: Record<Province, number>;
  recentRegistrations: number; // Last 30 days
}

// ========================================
// AUTHENTICATION & SESSION DTOs
// ========================================

/**
 * DTO for affiliate authentication response
 */
export interface AffiliateAuthResponseDto {
  affiliate: AffiliateProfileSummaryDto;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  permissions: string[];
}

/**
 * DTO for affiliate session information
 */
export interface AffiliateSessionDto {
  affiliateId: string;
  affiliateName: string;
  representativeFullName: string;
  affiliateEmail: string;
  accountStatus: AccountStatus;
  privileges: string[];
  sessionStart: string;
  sessionExpiry: string;
  lastActivity: string;
}

// ========================================
// VALIDATION & ERROR DTOs
// ========================================

/**
 * DTO for validation error responses
 */
export interface AffiliateValidationErrorDto {
  field: string;
  message: string;
  code: string;
  value?: any;
}

/**
 * DTO for operation result responses
 */
export interface AffiliateOperationResultDto {
  success: boolean;
  message: string;
  affiliateId?: string;
  errors?: AffiliateValidationErrorDto[];
  data?: any;
}

// ========================================
// IMPORT/EXPORT DTOs
// ========================================

/**
 * DTO for bulk affiliate import
 */
export interface AffiliateImportDto {
  affiliates: CreateAffiliateDto[];
  options: {
    skipDuplicates: boolean;
    validateOnly: boolean;
    notifyAffiliates: boolean;
  };
}

/**
 * DTO for affiliate export
 */
export interface AffiliateExportDto {
  filters?: AffiliateSearchDto;
  format: 'csv' | 'xlsx' | 'json';
  fields: string[];
  includeHeaders: boolean;
}
