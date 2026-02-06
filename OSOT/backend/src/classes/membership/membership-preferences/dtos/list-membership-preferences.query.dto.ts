/**
 * List Membership Preferences Query DTO
 * Provides filtering, sorting, and pagination options for membership preferences queries
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - enums: Uses centralized and local enums for filtering options
 * - constants: References query configurations from constants
 * - validation: Optional field validation for query parameters
 *
 * DATAVERSE INTEGRATION:
 * - OData query parameter support
 * - Filtering by year, category, account, affiliate, preferences
 * - Sorting by multiple fields
 * - Pagination with configurable page size
 *
 * USAGE CONTEXT:
 * - Administrative dashboards for membership preferences management
 * - API endpoints for preference listing (private and admin)
 * - Reporting and analytics queries
 * - Annual preference review and bulk operations
 *
 * QUERY CAPABILITIES:
 * - Filter by membership year, category, user (account/affiliate)
 * - Filter by specific preferences (auto-renewal, third parties, etc.)
 * - Search by preference ID or business identifier patterns
 * - Sort by creation date, modification date, or business fields
 * - Paginate results with configurable page sizes
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsNumber,
  IsString,
  IsBoolean,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

// Global enums
import { Privilege, AccessModifier } from '../../../../common/enums';

// Local enums
import { ThirdParties } from '../enums/third-parties.enum';
import { PracticePromotion } from '../enums/practice-promotion.enum';
import { SearchTools } from '../enums/search-tools.enum';
import { PsychotherapySupervision } from '../enums/psychotherapy-supervision.enum';

export class ListMembershipPreferencesQueryDto {
  // ========================================
  // PRIMARY FILTERING OPTIONS
  // ========================================

  @ApiProperty({
    example: '2025',
    description: 'Filter by membership year (e.g., "2024", "2025", "2026")',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Membership year must be a string' })
  membershipYear?: string;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Filter by membership category GUID',
    type: String,
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'Category ID must be a valid UUID' })
  membershipCategoryId?: string;

  @ApiProperty({
    example: 'b1a2c3d4-e5f6-7890-abcd-1234567890ef',
    description: 'Filter by account GUID',
    type: String,
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'Account ID must be a valid UUID' })
  accountId?: string;

  @ApiProperty({
    example: 'c1a2b3d4-e5f6-7890-abcd-123456789012',
    description: 'Filter by affiliate GUID',
    type: String,
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'Affiliate ID must be a valid UUID' })
  affiliateId?: string;

  // ========================================
  // PREFERENCE-SPECIFIC FILTERS
  // ========================================

  @ApiProperty({
    example: true,
    description: 'Filter by auto-renewal preference',
    type: Boolean,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'Auto renewal must be a boolean' })
  autoRenewal?: boolean;

  @ApiProperty({
    example: ThirdParties.RECRUITMENT,
    description: 'Filter by third parties preference',
    enum: ThirdParties,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsEnum(ThirdParties, { message: 'Must be a valid third parties option' })
  thirdParties?: ThirdParties;

  @ApiProperty({
    example: PracticePromotion.SELF,
    description: 'Filter by practice promotion preference',
    enum: PracticePromotion,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsEnum(PracticePromotion, {
    message: 'Must be a valid practice promotion option',
  })
  practicePromotion?: PracticePromotion;

  @ApiProperty({
    example: SearchTools.PROFESSIONAL_NETWORKS,
    description: 'Filter by search tools preference',
    enum: SearchTools,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsEnum(SearchTools, { message: 'Must be a valid search tools option' })
  searchTools?: SearchTools;

  @ApiProperty({
    example: true,
    description: 'Filter by shadowing preference',
    type: Boolean,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'Shadowing must be a boolean' })
  shadowing?: boolean;

  @ApiProperty({
    example: PsychotherapySupervision.COGNITIVE_BEHAVIOURAL,
    description: 'Filter by psychotherapy supervision preference',
    enum: PsychotherapySupervision,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsEnum(PsychotherapySupervision, {
    message: 'Must be a valid psychotherapy supervision option',
  })
  psychotherapySupervision?: PsychotherapySupervision;

  // ========================================
  // ACCESS CONTROL FILTERS
  // ========================================

  @ApiProperty({
    example: Privilege.OWNER,
    description: 'Filter by privilege level',
    enum: Privilege,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsEnum(Privilege, { message: 'Must be a valid privilege level' })
  privilege?: Privilege;

  @ApiProperty({
    example: AccessModifier.PRIVATE,
    description: 'Filter by access modifier',
    enum: AccessModifier,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsEnum(AccessModifier, { message: 'Must be a valid access modifier' })
  accessModifier?: AccessModifier;

  // ========================================
  // SEARCH OPTIONS
  // ========================================

  @ApiProperty({
    example: 'osot-pref',
    description: 'Search by preference ID pattern (partial match)',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  searchTerm?: string;

  // ========================================
  // SORTING OPTIONS
  // ========================================

  @ApiProperty({
    example: 'osot_membership_year',
    description: 'Field to sort by',
    enum: [
      'osot_preference_id',
      'osot_preference',
      'osot_membership_year',
      'osot_auto_renewal',
      'osot_third_parties',
      'osot_practice_promotion',
      'osot_members_search_tools',
      'osot_shadowing',
      'osot_psychotherapy_supervision',
      'osot_privilege',
      'osot_access_modifiers',
      'createdon',
      'modifiedon',
    ],
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Sort field must be a string' })
  sortBy?: string;

  @ApiProperty({
    example: 'DESC',
    description: 'Sort order (ASC or DESC)',
    enum: ['ASC', 'DESC'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'], { message: 'Sort order must be ASC or DESC' })
  sortOrder?: 'ASC' | 'DESC';

  // ========================================
  // PAGINATION OPTIONS
  // ========================================

  @ApiProperty({
    example: 1,
    description: 'Page number (1-based)',
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number;

  @ApiProperty({
    example: 25,
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsNumber({}, { message: 'Page size must be a number' })
  @Min(1, { message: 'Page size must be at least 1' })
  @Max(100, { message: 'Page size cannot exceed 100' })
  pageSize?: number;

  // ========================================
  // DATE RANGE FILTERING
  // ========================================

  @ApiProperty({
    example: '2025-01-01',
    description: 'Filter by creation date (from)',
    format: 'date',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Date must be a string' })
  createdFrom?: string;

  @ApiProperty({
    example: '2025-12-31',
    description: 'Filter by creation date (to)',
    format: 'date',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Date must be a string' })
  createdTo?: string;
}
