/**
 * List Membership Practices Query DTO
 * Handles filtering, sorting, and pagination for GET list operations
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - Query parameters for GET /private/membership-practices endpoints
 * - Integrates with DataverseService for OData query building
 * - Supports filtering by membership year, account, and practice characteristics
 * - Pagination controls with configurable limits
 *
 * DATAVERSE INTEGRATION:
 * - Builds OData $filter queries from user inputs
 * - Transforms frontend parameters to Dataverse field names
 * - Supports $orderby for sorting results
 * - Implements $skip and $top for pagination
 *
 * USAGE CONTEXT:
 * - Used in controller @Query() decorators
 * - Transforms to OData query strings for Dataverse API
 * - Supports admin list operations with multi-user filtering
 * - Client-side list operations filtered by user context
 *
 * BUSINESS RULES:
 * - Single enum value filters (not arrays) for UI simplicity
 * - Default pagination: skip=0, top=20
 * - Maximum page size: 100 records
 * - Enum filters match single selected values
 * - Search applies to text fields (practice_settings_other, practice_services_other)
 * - Year filter is primary discriminator (always required in practice)
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsInt,
  IsEnum,
  IsUUID,
  IsBoolean,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

// Local enums integration
import { ClientsAge } from '../enums/clients-age.enum';
import { PracticeArea } from '../enums/practice-area.enum';
import { PracticeServices } from '../enums/practice-services.enum';
import { PracticeSettings } from '../enums/practice-settings.enum';

/**
 * Sortable field names for membership practices
 */
export enum MembershipPracticesSortField {
  MEMBERSHIP_YEAR = 'osot_membership_year',
  PRACTICE_ID = 'osot_practice_id',
  CREATED_ON = 'createdon',
  MODIFIED_ON = 'modifiedon',
}

export class ListMembershipPracticesQueryDto {
  // ========================================
  // PRIMARY FILTERS
  // ========================================

  @ApiPropertyOptional({
    example: 2026,
    description: 'Filter by membership year (integer, format: YYYY)',
    type: 'integer',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Membership year must be an integer' })
  @Min(2020, { message: 'Membership year must be 2020 or later' })
  @Max(2100, { message: 'Membership year must be 2100 or earlier' })
  membershipYear?: number;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Filter by account UUID (admin use)',
    type: 'string',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Account ID must be a valid UUID v4' })
  accountId?: string;

  // ========================================
  // BOOLEAN FILTER
  // ========================================

  @ApiPropertyOptional({
    example: false,
    description: 'Filter by preceptor declaration (true/false)',
    type: 'boolean',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'Preceptor declaration must be a boolean' })
  preceptorDeclaration?: boolean;

  // ========================================
  // ENUM VALUE FILTERS (SINGLE SELECTION)
  // ========================================

  @ApiPropertyOptional({
    example: ClientsAge.ADULT,
    description:
      'Filter by single client age group (matches records containing this value)',
    enum: ClientsAge,
  })
  @IsOptional()
  @Type(() => Number)
  @IsEnum(ClientsAge, {
    message: 'Clients age must be a valid ClientsAge enum value',
  })
  clientsAge?: ClientsAge;

  @ApiPropertyOptional({
    example: PracticeArea.CHRONIC_PAIN,
    description:
      'Filter by single practice area (matches records containing this value)',
    enum: PracticeArea,
  })
  @IsOptional()
  @Type(() => Number)
  @IsEnum(PracticeArea, {
    message: 'Practice area must be a valid PracticeArea enum value',
  })
  practiceArea?: PracticeArea;

  @ApiPropertyOptional({
    example: PracticeSettings.CLIENTS_HOME,
    description:
      'Filter by single practice setting (matches records containing this value)',
    enum: PracticeSettings,
  })
  @IsOptional()
  @Type(() => Number)
  @IsEnum(PracticeSettings, {
    message: 'Practice setting must be a valid PracticeSettings enum value',
  })
  practiceSettings?: PracticeSettings;

  @ApiPropertyOptional({
    example: PracticeServices.COGNITIVE_BEHAVIOUR_THERAPY,
    description:
      'Filter by single practice service (matches records containing this value)',
    enum: PracticeServices,
  })
  @IsOptional()
  @Type(() => Number)
  @IsEnum(PracticeServices, {
    message: 'Practice service must be a valid PracticeServices enum value',
  })
  practiceServices?: PracticeServices;

  // ========================================
  // TEXT SEARCH
  // ========================================

  @ApiPropertyOptional({
    example: 'mobile clinic',
    description:
      'Search text in other fields (practice_settings_other, practice_services_other)',
    type: 'string',
  })
  @IsOptional()
  @IsString({ message: 'Search must be a string' })
  search?: string;

  // ========================================
  // PAGINATION
  // ========================================

  @ApiPropertyOptional({
    example: 0,
    description: 'Number of records to skip (pagination offset, default: 0)',
    type: 'integer',
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Skip must be an integer' })
  @Min(0, { message: 'Skip must be 0 or greater' })
  skip?: number = 0;

  @ApiPropertyOptional({
    example: 20,
    description:
      'Number of records to return (page size, default: 20, max: 100)',
    type: 'integer',
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Top must be an integer' })
  @Min(1, { message: 'Top must be at least 1' })
  @Max(100, { message: 'Top must not exceed 100' })
  top?: number = 20;

  // ========================================
  // SORTING
  // ========================================

  @ApiPropertyOptional({
    example: MembershipPracticesSortField.MODIFIED_ON,
    description: 'Field to sort by (default: modifiedon desc if not provided)',
    enum: MembershipPracticesSortField,
  })
  @IsOptional()
  @IsEnum(MembershipPracticesSortField, {
    message: 'Order by must be a valid MembershipPracticesSortField enum value',
  })
  orderBy?: MembershipPracticesSortField;

  @ApiPropertyOptional({
    example: 'desc',
    description: 'Sort direction (asc or desc, default: desc)',
    type: 'string',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString({ message: 'Sort direction must be a string' })
  @Matches(/^(asc|desc)$/, {
    message: 'Sort direction must be either "asc" or "desc"',
  })
  sortDirection?: 'asc' | 'desc' = 'desc';
}
