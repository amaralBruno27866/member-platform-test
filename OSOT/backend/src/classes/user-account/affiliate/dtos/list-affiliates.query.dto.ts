/**
 * List Affiliates Query DTO
 * Provides comprehensive filtering, sorting, and pagination for affiliate listings
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - swagger: API documentation for query parameters
 * - validators: Query parameter validation
 * - integrations: Compatible with DataverseService OData queries
 * - enums: Uses centralized enums for filtering options
 *
 * DATAVERSE INTEGRATION:
 * - OData query parameter support ($filter, $orderby, $skip, $top)
 * - Field-specific filtering aligned with Table Account Affiliate.csv
 * - Enum-based filtering for choice fields
 * - Full-text search capabilities
 *
 * USAGE CONTEXT:
 * - Public affiliate directory listings
 * - Administrative affiliate management
 * - Search and discovery functionality
 * - Data export and reporting operations
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  AffiliateArea,
  AccountStatus,
  Province,
  Country,
  City,
  AccessModifier,
} from '../../../../common/enums';

export class ListAffiliatesQueryDto {
  // ========================================
  // PAGINATION PARAMETERS
  // ========================================

  @ApiProperty({
    description: 'Number of records to skip (for pagination)',
    required: false,
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : (value as number),
  )
  skip?: number = 0;

  @ApiProperty({
    description: 'Maximum number of records to return',
    required: false,
    default: 50,
    minimum: 1,
    maximum: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : (value as number),
  )
  take?: number = 50;

  // ========================================
  // SEARCH & FILTERING
  // ========================================

  @ApiProperty({
    description:
      'Full-text search across affiliate name and representative names',
    required: false,
    example: 'Tech Solutions',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filter by affiliate name (partial match)',
    required: false,
    example: 'Tech Solutions',
  })
  @IsOptional()
  @IsString()
  affiliateName?: string;

  @ApiProperty({
    description: 'Filter by representative first name',
    required: false,
    example: 'John',
  })
  @IsOptional()
  @IsString()
  representativeFirstName?: string;

  @ApiProperty({
    description: 'Filter by representative last name',
    required: false,
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  representativeLastName?: string;

  @ApiProperty({
    description: 'Filter by business area/industry',
    required: false,
    enum: AffiliateArea,
    enumName: 'AffiliateArea',
  })
  @IsOptional()
  @IsEnum(AffiliateArea)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : (value as number),
  )
  affiliateArea?: AffiliateArea;

  @ApiProperty({
    description: 'Filter by account status',
    required: false,
    enum: AccountStatus,
    enumName: 'AccountStatus',
  })
  @IsOptional()
  @IsEnum(AccountStatus)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : (value as number),
  )
  accountStatus?: AccountStatus;

  // ========================================
  // GEOGRAPHIC FILTERING
  // ========================================

  @ApiProperty({
    description: 'Filter by city',
    required: false,
    enum: City,
    enumName: 'City',
  })
  @IsOptional()
  @IsEnum(City)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : (value as number),
  )
  city?: City;

  @ApiProperty({
    description: 'Filter by province',
    required: false,
    enum: Province,
    enumName: 'Province',
  })
  @IsOptional()
  @IsEnum(Province)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : (value as number),
  )
  province?: Province;

  @ApiProperty({
    description: 'Filter by country',
    required: false,
    enum: Country,
    enumName: 'Country',
  })
  @IsOptional()
  @IsEnum(Country)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : (value as number),
  )
  country?: Country;

  @ApiProperty({
    description: 'Filter by postal code (exact or prefix match)',
    required: false,
    example: 'K1A',
  })
  @IsOptional()
  @IsString()
  postalCode?: string;

  // ========================================
  // CONTACT & SOCIAL MEDIA FILTERING
  // ========================================

  @ApiProperty({
    description: 'Filter by email domain',
    required: false,
    example: 'company.com',
  })
  @IsOptional()
  @IsString()
  emailDomain?: string;

  @ApiProperty({
    description: 'Filter affiliates with website',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  hasWebsite?: boolean;

  @ApiProperty({
    description: 'Filter affiliates with social media presence',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  hasSocialMedia?: boolean;

  // ========================================
  // MEMBERSHIP & ACCESS FILTERING
  // ========================================

  @ApiProperty({
    description: 'Filter by active membership status',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  activeMember?: boolean;

  @ApiProperty({
    description: 'Filter by access modifier',
    required: false,
    enum: AccessModifier,
    enumName: 'AccessModifier',
  })
  @IsOptional()
  @IsEnum(AccessModifier)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : (value as number),
  )
  accessModifier?: AccessModifier;

  // ========================================
  // DATE RANGE FILTERING
  // ========================================

  @ApiProperty({
    description: 'Filter affiliates created after this date (ISO 8601)',
    required: false,
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsString()
  createdAfter?: string;

  @ApiProperty({
    description: 'Filter affiliates created before this date (ISO 8601)',
    required: false,
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsString()
  createdBefore?: string;

  @ApiProperty({
    description: 'Filter affiliates modified after this date (ISO 8601)',
    required: false,
    example: '2024-06-01T00:00:00Z',
  })
  @IsOptional()
  @IsString()
  modifiedAfter?: string;

  // ========================================
  // SORTING OPTIONS
  // ========================================

  @ApiProperty({
    description: 'Sort field',
    required: false,
    default: 'osot_Affiliate_Name',
    enum: [
      'osot_Affiliate_Name',
      'osot_Representative_First_Name',
      'osot_Representative_Last_Name',
      'osot_Affiliate_Area',
      'osot_Account_Status',
      'osot_Affiliate_City',
      'osot_Affiliate_Province',
      'CreatedOn',
      'ModifiedOn',
    ],
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'osot_Affiliate_Name';

  @ApiProperty({
    description: 'Sort direction',
    required: false,
    default: 'asc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';

  // ========================================
  // RESPONSE OPTIONS
  // ========================================

  @ApiProperty({
    description: 'Include total count in response (may impact performance)',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  includeCount?: boolean = false;

  @ApiProperty({
    description: 'Include related entity data in response',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  includeRelated?: boolean = false;

  @ApiProperty({
    description: 'Fields to include in response (comma-separated)',
    required: false,
    example:
      'osot_Affiliate_Name,osot_Representative_First_Name,osot_Affiliate_Email',
  })
  @IsOptional()
  @IsString()
  select?: string;

  // ========================================
  // ADMIN FILTERING (Optional)
  // ========================================

  @ApiProperty({
    description: 'Include soft-deleted records (admin only)',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  includeDeleted?: boolean = false;

  @ApiProperty({
    description: 'Filter by owner ID (admin only)',
    required: false,
  })
  @IsOptional()
  @IsString()
  ownerId?: string;
}
