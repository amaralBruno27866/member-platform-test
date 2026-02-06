/**
 * List Management Query DTO
 * Provides comprehensive filtering, sorting, and pagination for management account listings
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - swagger: API documentation for query parameters
 * - validators: Query parameter validation with proper type checking
 * - integrations: Compatible with DataverseService OData queries
 * - enums: Uses centralized enums for filtering options
 *
 * DATAVERSE INTEGRATION:
 * - OData query parameter support ($filter, $orderby, $skip, $top)
 * - Field-specific filtering aligned with Table Account Management.csv
 * - Enum-based filtering for AccessModifier and Privilege choice fields
 * - Full-text search capabilities across user business IDs
 *
 * USAGE CONTEXT:
 * - Administrative management account listings and reports
 * - Search and discovery functionality for business services
 * - Data export and reporting operations
 * - External system integration with filtered data access
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
import { Type } from 'class-transformer';
import { AccessModifier, Privilege } from '../../../../common/enums';

export class ListManagementQueryDto {
  // ========================================
  // PAGINATION PARAMETERS
  // ========================================

  @ApiProperty({
    description: 'Number of records to skip (for pagination)',
    example: 0,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  skip?: number;

  @ApiProperty({
    description: 'Maximum number of records to return',
    example: 50,
    minimum: 1,
    maximum: 200,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(200)
  top?: number;

  // ========================================
  // SEARCH PARAMETERS
  // ========================================

  @ApiProperty({
    description: 'Full-text search across User Business IDs',
    example: 'USR-BUSINESS-001',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filter by specific User Business ID',
    example: 'USR-BUSINESS-001-2024',
    required: false,
  })
  @IsOptional()
  @IsString()
  userBusinessId?: string;

  // ========================================
  // LIFECYCLE STATUS FILTERS
  // ========================================

  @ApiProperty({
    description: 'Filter by life member retired status',
    example: false,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  lifeMemberRetired?: boolean;

  @ApiProperty({
    description: 'Filter by shadowing status',
    example: false,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  shadowing?: boolean;

  @ApiProperty({
    description: 'Filter by passed away status',
    example: false,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  passedAway?: boolean;

  // ========================================
  // BUSINESS SERVICE FILTERS
  // ========================================

  @ApiProperty({
    description: 'Filter by vendor service status',
    example: false,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  vendor?: boolean;

  @ApiProperty({
    description: 'Filter by advertising service status',
    example: false,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  advertising?: boolean;

  @ApiProperty({
    description: 'Filter by recruitment service status',
    example: false,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  recruitment?: boolean;

  @ApiProperty({
    description: 'Filter by driver rehabilitation service status',
    example: false,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  driverRehab?: boolean;

  // ========================================
  // ACCESS CONTROL FILTERS
  // ========================================

  @ApiProperty({
    description: 'Filter by access modifier level',
    enum: AccessModifier,
    enumName: 'AccessModifier',
    example: AccessModifier.PROTECTED,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsEnum(AccessModifier)
  accessModifier?: AccessModifier;

  @ApiProperty({
    description: 'Filter by privilege level',
    enum: Privilege,
    enumName: 'Privilege',
    example: Privilege.MAIN,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsEnum(Privilege)
  privilege?: Privilege;

  // ========================================
  // DATE RANGE FILTERS
  // ========================================

  @ApiProperty({
    description: 'Filter by creation date from (ISO 8601 format)',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsString()
  createdFrom?: string;

  @ApiProperty({
    description: 'Filter by creation date to (ISO 8601 format)',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsString()
  createdTo?: string;

  @ApiProperty({
    description: 'Filter by last modified date from (ISO 8601 format)',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsString()
  modifiedFrom?: string;

  @ApiProperty({
    description: 'Filter by last modified date to (ISO 8601 format)',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsString()
  modifiedTo?: string;

  // ========================================
  // SORTING PARAMETERS
  // ========================================

  @ApiProperty({
    description: 'Field to sort by',
    example: 'modifiedon',
    enum: [
      'createdon',
      'modifiedon',
      'osot_user_business_id',
      'osot_account_management_id',
      'osot_access_modifiers',
      'osot_privilege',
    ],
    required: false,
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({
    description: 'Sort order (ascending or descending)',
    example: 'desc',
    enum: ['asc', 'desc'],
    required: false,
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  // ========================================
  // AGGREGATION AND ANALYSIS FILTERS
  // ========================================

  @ApiProperty({
    description: 'Include only accounts with active business services',
    example: false,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasActiveServices?: boolean;

  @ApiProperty({
    description: 'Include only accounts with administrative privileges',
    example: false,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasAdminPrivileges?: boolean;

  @ApiProperty({
    description: 'Include only active (non-deceased) accounts',
    example: true,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  activeOnly?: boolean;
}
