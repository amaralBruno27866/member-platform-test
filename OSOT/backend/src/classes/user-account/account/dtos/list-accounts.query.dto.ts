/**
 * Account List Query DTO
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - swagger: API documentation for query parameters
 * - validators: Query parameter validation
 * - integrations: Compatible with DataverseService queries
 *
 * QUERY CAPABILITIES:
 * - Essential query parameters for account listing
 * - Standard pagination and filtering
 * - Compatible with OData queries
 * - Clean API for account search and filtering
 *
 * BUSINESS RULES:
 * - Email and phone searches require appropriate permissions
 * - Account group filtering for administrative purposes
 * - Status-based filtering for account management
 * - Date range filtering for audit and reporting
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { AccountGroup, AccountStatus } from '../../../../common/enums';

export class ListAccountsQueryDto {
  // ========================================
  // SEARCH PARAMETERS
  // ========================================

  @ApiProperty({
    description: 'Search by first name (partial match)',
    required: false,
    example: 'John',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({
    description: 'Search by last name (partial match)',
    required: false,
    example: 'Smith',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'Search by email address (exact match, requires permission)',
    required: false,
    example: 'john.smith@example.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({
    description: 'Search by phone number (exact match, requires permission)',
    required: false,
    example: '+1-416-555-0123',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  // ========================================
  // FILTER PARAMETERS
  // ========================================

  @ApiProperty({
    description: 'Filter by account group',
    required: false,
    enum: AccountGroup,
    example: AccountGroup.OCCUPATIONAL_THERAPIST,
  })
  @IsOptional()
  @IsEnum(AccountGroup)
  accountGroup?: AccountGroup;

  @ApiProperty({
    description: 'Filter by account status',
    required: false,
    enum: AccountStatus,
    example: AccountStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(AccountStatus)
  accountStatus?: AccountStatus;

  @ApiProperty({
    description: 'Filter by active member status',
    required: false,
    example: true,
  })
  @IsOptional()
  @Transform(({ value }: { value: string | boolean }) => {
    if (typeof value === 'string') {
      if (value === 'true') return true;
      if (value === 'false') return false;
    }
    return value;
  })
  activeMember?: boolean;

  // ========================================
  // DATE RANGE PARAMETERS
  // ========================================

  @ApiProperty({
    description: 'Filter by creation date (from)',
    required: false,
    example: '2024-01-01',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsString()
  createdFrom?: string;

  @ApiProperty({
    description: 'Filter by creation date (to)',
    required: false,
    example: '2024-12-31',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsString()
  createdTo?: string;

  // ========================================
  // PAGINATION PARAMETERS
  // ========================================

  @ApiProperty({
    description: 'Page number (1-based)',
    required: false,
    minimum: 1,
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }: { value: string | number }) => {
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? value : parsed;
    }
    return value;
  })
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    required: false,
    minimum: 1,
    maximum: 100,
    example: 10,
  })
  @IsOptional()
  @Transform(({ value }: { value: string | number }) => {
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? value : parsed;
    }
    return value;
  })
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  // ========================================
  // SORTING PARAMETERS
  // ========================================

  @ApiProperty({
    description: 'Sort by field',
    required: false,
    example: 'osot_Last_Name',
    enum: [
      'osot_Last_Name',
      'osot_First_Name',
      'osot_Email',
      'osot_Account_Group',
      'osot_Account_Status',
      'CreatedOn',
      'ModifiedOn',
    ],
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({
    description: 'Sort direction',
    required: false,
    example: 'asc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  sortDirection?: 'asc' | 'desc' = 'asc';
}
