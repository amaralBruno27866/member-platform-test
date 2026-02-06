import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Query DTO for listing and filtering contacts
 *
 * NOTE: This DTO doesn't need enum imports as it's used for flexible
 * filtering where enum values would be too restrictive for search queries.
 * The actual Contact records returned will have proper enum typing.
 */

export class ListContactsQueryDto {
  @ApiPropertyOptional({
    description: 'Free text search (user business ID, job title, email)',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by user business ID' })
  @IsOptional()
  @IsString()
  osot_user_business_id?: string;

  @ApiPropertyOptional({ description: 'Filter by secondary email' })
  @IsOptional()
  @IsString()
  osot_secondary_email?: string;

  @ApiPropertyOptional({ description: 'Filter by job title' })
  @IsOptional()
  @IsString()
  osot_job_title?: string;

  @ApiPropertyOptional({ description: 'Filter by home phone' })
  @IsOptional()
  @IsString()
  osot_home_phone?: string;

  @ApiPropertyOptional({ description: 'Filter by work phone' })
  @IsOptional()
  @IsString()
  osot_work_phone?: string;

  @ApiPropertyOptional({ description: 'Filter by related account GUID' })
  @IsOptional()
  @IsString()
  osot_table_account?: string;

  @ApiPropertyOptional({ description: 'Page number (default: 1)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Page size (default: 25)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 25;
}
