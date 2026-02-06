/**
 * Address List Query DTO (SIMPLIFIED)
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - swagger: API documentation for query parameters
 * - validators: Query parameter validation
 * - integrations: Compatible with DataverseService queries
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Essential query parameters only
 * - Standard pagination and filtering
 * - Compatible with OData queries
 * - Clean API for address listing
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListAddressesQueryDto {
  @ApiProperty({
    description: 'Filter by user business ID',
    required: false,
    example: 'ADDR001',
  })
  @IsOptional()
  @IsString()
  userBusinessId?: string;

  @ApiProperty({
    description: 'Filter by postal code',
    required: false,
    example: 'K1A 0A6',
  })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({
    description: 'Filter by city',
    required: false,
    example: 'Toronto',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    description: 'Filter by province',
    required: false,
    example: 'Ontario',
  })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiProperty({
    description: 'Filter by address type',
    required: false,
    example: 'Home',
  })
  @IsOptional()
  @IsString()
  addressType?: string;

  @ApiProperty({
    description: 'Number of records to skip for pagination',
    required: false,
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value as string, 10) : 0))
  @IsNumber()
  @Min(0)
  skip?: number = 0;

  @ApiProperty({
    description: 'Maximum number of records to return',
    required: false,
    default: 50,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value as string, 10) : 50))
  @IsNumber()
  @Min(1)
  @Max(100)
  top?: number = 50;

  @ApiProperty({
    description: 'OData $expand parameter for related data',
    required: false,
    example: 'osot_table_account',
  })
  @IsOptional()
  @IsString()
  expand?: string;

  @ApiProperty({
    description: 'OData $select parameter for specific fields',
    required: false,
    example: 'osot_address_1,osot_city,osot_postal_code',
  })
  @IsOptional()
  @IsString()
  select?: string;
}
