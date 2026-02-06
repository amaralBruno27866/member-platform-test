/**
 * Membership Employment Mapper
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes for transformation error handling
 * - enums: Uses centralized and local enums for type safety
 * - utils: Uses utility functions for data normalization
 * - integrations: Compatible with DataverseService response formats
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Essential employment data transformations only
 * - Clean mapping between DTOs and internal representations
 * - Type-safe enum conversions (7 local + 2 global enums)
 * - Proper OData bind handling for 2 lookup fields (Account XOR Affiliate)
 * - Multi-select array ↔ string conversions for Dataverse
 *
 * KEY RESPONSIBILITIES:
 * - Transform Create/Update DTOs to Internal representation
 * - Transform Internal to Response DTOs for API output
 * - Transform Dataverse responses to Internal
 * - Transform Internal to Dataverse payloads
 * - Handle OData bind format conversions
 * - Convert multi-select arrays to/from comma-separated strings
 * - Validate employment data completeness
 * - Sanitize sensitive data for logging
 */

import { Privilege, AccessModifier } from '../../../../common/enums';
import { UpdateMembershipEmploymentDto } from '../dtos/membership-employment-update.dto';
import { ResponseMembershipEmploymentDto } from '../dtos/membership-employment-response.dto';
import { CreateMembershipEmploymentDto } from '../dtos/membership-employment-create.dto';
import { MembershipEmploymentInternal } from '../interfaces/membership-employment-internal.interface';
import { MembershipEmploymentDataverse } from '../interfaces/membership-employment-dataverse.interface';
import { Benefits, getBenefitsDisplayName } from '../enums/benefits.enum';
import {
  EmploymentStatus,
  getEmployementStatusDisplayName,
} from '../enums/employment-status.enum';
import { Funding, getFundingDisplayName } from '../enums/funding.enum';
import {
  HourlyEarnings,
  getHourlyEarningsLabel,
} from '../enums/hourly-earnings.enum';
import {
  PracticeYears,
  getPracticeYearsDisplayName,
} from '../enums/practice-years.enum';
import {
  RoleDescription,
  getRoleDescriptionDisplayName,
} from '../enums/role-descriptor.enum';
import { WorkHours, getWorkHoursDisplayName } from '../enums/work-hours.enum';
import { MEMBERSHIP_EMPLOYMENT_FIELDS } from '../constants/membership-employment.constants';

// Export the ResponseDto type for external use
export { ResponseMembershipEmploymentDto } from '../dtos/membership-employment-response.dto';

/**
 * Complete DTO with system-determined fields for employment creation
 * Used internally when controller enriches CreateDto with system fields
 */
export interface EnrichedCreateMembershipEmploymentDto
  extends CreateMembershipEmploymentDto {
  osot_membership_year: string; // SYSTEM-DEFINED from membership-settings (YYYY format)
  'osot_Table_Account@odata.bind'?: string;
  'osot_Table_Account_Affiliate@odata.bind'?: string;
  osot_privilege?: Privilege;
  osot_access_modifiers?: AccessModifier;
}

/**
 * Helper functions for enum conversions and data parsing
 */

/**
 * Convert string/number or array to WorkHours enum array (Multi-select)
 * Handles Dataverse comma-separated format: "1,2,3" -> [1, 2, 3]
 */
function parseWorkHours(value: unknown): WorkHours[] | undefined {
  if (value === null || value === undefined) return undefined;

  // Handle Dataverse comma-separated string format: "1,2,3"
  if (typeof value === 'string') {
    if (value.includes(',')) {
      const parsed = value
        .split(',')
        .map((v) => {
          const numValue = parseInt(v.trim(), 10);
          return !isNaN(numValue) && Object.values(WorkHours).includes(numValue)
            ? numValue
            : null;
        })
        .filter((v): v is WorkHours => v !== null);

      return parsed.length > 0 ? parsed : undefined;
    }
    // Single value string
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && Object.values(WorkHours).includes(numValue)) {
      return [numValue];
    }
  }

  // Handle array (internal format)
  if (Array.isArray(value)) {
    const parsed = value
      .map((v) => {
        if (typeof v === 'number') {
          return Object.values(WorkHours).includes(v) ? v : null;
        }
        if (typeof v === 'string') {
          const numValue = parseInt(v, 10);
          return !isNaN(numValue) && Object.values(WorkHours).includes(numValue)
            ? numValue
            : null;
        }
        return null;
      })
      .filter((v): v is WorkHours => v !== null);

    return parsed.length > 0 ? parsed : undefined;
  }

  // Handle single number value
  if (typeof value === 'number') {
    return Object.values(WorkHours).includes(value) ? [value] : undefined;
  }

  return undefined;
}

/**
 * Convert string/number or array to Funding enum array (Multi-select)
 * Handles Dataverse comma-separated format: "1,2,3" -> [1, 2, 3]
 */
function parseFunding(value: unknown): Funding[] | undefined {
  if (value === null || value === undefined) return undefined;

  if (typeof value === 'string') {
    if (value.includes(',')) {
      const parsed = value
        .split(',')
        .map((v) => {
          const numValue = parseInt(v.trim(), 10);
          return !isNaN(numValue) && Object.values(Funding).includes(numValue)
            ? numValue
            : null;
        })
        .filter((v): v is Funding => v !== null);

      return parsed.length > 0 ? parsed : undefined;
    }
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && Object.values(Funding).includes(numValue)) {
      return [numValue];
    }
  }

  if (Array.isArray(value)) {
    const parsed = value
      .map((v) => {
        if (typeof v === 'number') {
          return Object.values(Funding).includes(v) ? v : null;
        }
        if (typeof v === 'string') {
          const numValue = parseInt(v, 10);
          return !isNaN(numValue) && Object.values(Funding).includes(numValue)
            ? numValue
            : null;
        }
        return null;
      })
      .filter((v): v is Funding => v !== null);

    return parsed.length > 0 ? parsed : undefined;
  }

  if (typeof value === 'number') {
    return Object.values(Funding).includes(value) ? [value] : undefined;
  }

  return undefined;
}

/**
 * Convert string/number or array to Benefits enum array (Multi-select)
 * Handles Dataverse comma-separated format: "1,2,3" -> [1, 2, 3]
 */
function parseBenefits(value: unknown): Benefits[] | undefined {
  if (value === null || value === undefined) return undefined;

  if (typeof value === 'string') {
    if (value.includes(',')) {
      const parsed = value
        .split(',')
        .map((v) => {
          const numValue = parseInt(v.trim(), 10);
          return !isNaN(numValue) && Object.values(Benefits).includes(numValue)
            ? numValue
            : null;
        })
        .filter((v): v is Benefits => v !== null);

      return parsed.length > 0 ? parsed : undefined;
    }
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && Object.values(Benefits).includes(numValue)) {
      return [numValue];
    }
  }

  if (Array.isArray(value)) {
    const parsed = value
      .map((v) => {
        if (typeof v === 'number') {
          return Object.values(Benefits).includes(v) ? v : null;
        }
        if (typeof v === 'string') {
          const numValue = parseInt(v, 10);
          return !isNaN(numValue) && Object.values(Benefits).includes(numValue)
            ? numValue
            : null;
        }
        return null;
      })
      .filter((v): v is Benefits => v !== null);

    return parsed.length > 0 ? parsed : undefined;
  }

  if (typeof value === 'number') {
    return Object.values(Benefits).includes(value) ? [value] : undefined;
  }

  return undefined;
}

/**
 * Convert string/number to EmploymentStatus enum
 */
function parseEmploymentStatus(value: unknown): EmploymentStatus | undefined {
  if (typeof value === 'number') {
    return Object.values(EmploymentStatus).includes(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    const numValue = parseInt(value, 10);
    if (
      !isNaN(numValue) &&
      Object.values(EmploymentStatus).includes(numValue)
    ) {
      return numValue;
    }
  }
  return undefined;
}

/**
 * Convert string/number to RoleDescription enum
 */
function parseRoleDescription(value: unknown): RoleDescription | undefined {
  if (typeof value === 'number') {
    return Object.values(RoleDescription).includes(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && Object.values(RoleDescription).includes(numValue)) {
      return numValue;
    }
  }
  return undefined;
}

/**
 * Convert string/number to PracticeYears enum
 */
function parsePracticeYears(value: unknown): PracticeYears | undefined {
  if (typeof value === 'number') {
    return Object.values(PracticeYears).includes(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && Object.values(PracticeYears).includes(numValue)) {
      return numValue;
    }
  }
  return undefined;
}

/**
 * Convert string/number to HourlyEarnings enum
 */
function parseHourlyEarnings(value: unknown): HourlyEarnings | undefined {
  if (typeof value === 'number') {
    return Object.values(HourlyEarnings).includes(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && Object.values(HourlyEarnings).includes(numValue)) {
      return numValue;
    }
  }
  return undefined;
}

/**
 * Convert string/number to AccessModifier enum
 */
function parseAccessModifier(value: unknown): AccessModifier | undefined {
  if (typeof value === 'number') {
    return Object.values(AccessModifier).includes(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && Object.values(AccessModifier).includes(numValue)) {
      return numValue;
    }
  }
  return undefined;
}

/**
 * Convert string/number to Privilege enum
 */
function parsePrivilege(value: unknown): Privilege | undefined {
  if (typeof value === 'number') {
    return Object.values(Privilege).includes(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && Object.values(Privilege).includes(numValue)) {
      return numValue;
    }
  }
  return undefined;
}

/**
 * Extract GUID from OData bind string
 * Example: "/osot_table_accounts(a1b2c3d4-e5f6-7890-abcd-ef1234567890)" -> "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 */
function extractGuidFromBind(odataBind: string): string | undefined {
  if (!odataBind) return undefined;
  const match = odataBind.match(/\(([a-f0-9-]+)\)/i);
  return match ? match[1] : undefined;
}

/**
 * Create OData bind string from GUID
 * Example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" -> "/osot_table_accounts(a1b2c3d4-e5f6-7890-abcd-ef1234567890)"
 */
function createODataBind(tableName: string, guid: string): string {
  return `/${tableName}(${guid})`;
}

/**
 * Membership Employment Mapper Class
 *
 * Handles all data transformations between different employment representations:
 * - DTOs ↔ Internal interfaces
 * - Dataverse responses ↔ Internal interfaces
 * - OData bind conversions for lookups
 * - Multi-select array ↔ comma-separated string conversions
 * - Data normalization and validation
 * - Type-safe enum conversions (9 enums total: 7 local + 2 global)
 * - Error handling for transformation failures
 *
 * Key Features:
 * - Type-safe transformations with enum validation
 * - OData bind handling for 2 lookup fields (Account XOR Affiliate)
 * - Multi-select field conversions (WorkHours, Funding, Benefits)
 * - Employment ID format validation (osot-emp-NNNNNNN)
 * - Business rule validation integration (XOR, conditional _Other fields)
 * - Comprehensive error handling
 * - Integration with essential modules
 */
export class MembershipEmploymentMapper {
  /**
   * Map CreateDto to Internal (overload for simple DTO)
   */
  static mapCreateDtoToInternal(
    dto: CreateMembershipEmploymentDto,
  ): Partial<MembershipEmploymentInternal>;

  /**
   * Map CreateDto to Internal (overload for enriched DTO)
   */
  static mapCreateDtoToInternal(
    dto: EnrichedCreateMembershipEmploymentDto,
  ): MembershipEmploymentInternal;

  /**
   * Map CreateDto to Internal (implementation)
   * Handles both simple and enriched DTOs
   */
  static mapCreateDtoToInternal(
    dto: CreateMembershipEmploymentDto | EnrichedCreateMembershipEmploymentDto,
  ): MembershipEmploymentInternal | Partial<MembershipEmploymentInternal> {
    const internal: Partial<MembershipEmploymentInternal> = {
      osot_employment_status: dto.osot_employment_status,
      osot_work_hours: dto.osot_work_hours,
      osot_role_descriptor: dto.osot_role_descriptor,
      osot_practice_years: dto.osot_practice_years,
      osot_position_funding: dto.osot_position_funding,
      osot_employment_benefits: dto.osot_employment_benefits,
      osot_earnings_employment: dto.osot_earnings_employment,
      osot_earnings_self_direct: dto.osot_earnings_self_direct,
      osot_earnings_self_indirect: dto.osot_earnings_self_indirect,
      osot_union_name: dto.osot_union_name,
    };

    // Add membership year if provided (enriched DTO) - SYSTEM-DEFINED
    if ('osot_membership_year' in dto && dto.osot_membership_year) {
      internal.osot_membership_year = dto.osot_membership_year;
    }

    // Handle lookup fields - convert OData binds to GUIDs
    if ('osot_Table_Account@odata.bind' in dto) {
      const accountBind = dto['osot_Table_Account@odata.bind'];
      if (accountBind) {
        internal.osot_table_account = extractGuidFromBind(accountBind);
      }
    }

    if ('osot_Table_Account_Affiliate@odata.bind' in dto) {
      const affiliateBind = dto['osot_Table_Account_Affiliate@odata.bind'];
      if (affiliateBind) {
        internal.osot_table_account_affiliate =
          extractGuidFromBind(affiliateBind);
      }
    }

    // Conditional "_Other" fields
    if (dto.osot_role_descriptor_other !== undefined) {
      internal.osot_role_descriptor_other = dto.osot_role_descriptor_other;
    }
    if (dto.osot_position_funding_other !== undefined) {
      internal.osot_position_funding_other = dto.osot_position_funding_other;
    }
    if (dto.osot_employment_benefits_other !== undefined) {
      internal.osot_employment_benefits_other =
        dto.osot_employment_benefits_other;
    }

    // Optional another employment field
    if (dto.osot_another_employment !== undefined) {
      internal.osot_another_employment = dto.osot_another_employment;
    }

    // Optional access control fields (defaults applied at service layer)
    if ('osot_privilege' in dto && dto.osot_privilege !== undefined) {
      internal.osot_privilege = dto.osot_privilege;
    }
    if (
      'osot_access_modifiers' in dto &&
      dto.osot_access_modifiers !== undefined
    ) {
      internal.osot_access_modifiers = dto.osot_access_modifiers;
    }

    return internal as MembershipEmploymentInternal;
  }

  /**
   * Map UpdateDto to partial Internal
   * Used when updating existing employment from API requests
   * Supports partial updates - only provided fields are included
   */
  static mapUpdateDtoToInternal(
    dto: UpdateMembershipEmploymentDto,
  ): Partial<MembershipEmploymentInternal> {
    const internal: Partial<MembershipEmploymentInternal> = {};

    // Employment fields (all optional in update)
    if (dto.osot_employment_status !== undefined) {
      internal.osot_employment_status = dto.osot_employment_status;
    }
    if (dto.osot_work_hours !== undefined) {
      internal.osot_work_hours = dto.osot_work_hours;
    }
    if (dto.osot_role_descriptor !== undefined) {
      internal.osot_role_descriptor = dto.osot_role_descriptor;
    }
    if (dto.osot_practice_years !== undefined) {
      internal.osot_practice_years = dto.osot_practice_years;
    }
    if (dto.osot_position_funding !== undefined) {
      internal.osot_position_funding = dto.osot_position_funding;
    }
    if (dto.osot_employment_benefits !== undefined) {
      internal.osot_employment_benefits = dto.osot_employment_benefits;
    }
    if (dto.osot_earnings_employment !== undefined) {
      internal.osot_earnings_employment = dto.osot_earnings_employment;
    }
    if (dto.osot_earnings_self_direct !== undefined) {
      internal.osot_earnings_self_direct = dto.osot_earnings_self_direct;
    }
    if (dto.osot_earnings_self_indirect !== undefined) {
      internal.osot_earnings_self_indirect = dto.osot_earnings_self_indirect;
    }
    if (dto.osot_union_name !== undefined) {
      internal.osot_union_name = dto.osot_union_name;
    }

    // Conditional "_Other" fields
    if (dto.osot_role_descriptor_other !== undefined) {
      internal.osot_role_descriptor_other = dto.osot_role_descriptor_other;
    }
    if (dto.osot_position_funding_other !== undefined) {
      internal.osot_position_funding_other = dto.osot_position_funding_other;
    }
    if (dto.osot_employment_benefits_other !== undefined) {
      internal.osot_employment_benefits_other =
        dto.osot_employment_benefits_other;
    }

    // Optional another employment
    if (dto.osot_another_employment !== undefined) {
      internal.osot_another_employment = dto.osot_another_employment;
    }

    return internal;
  }

  /**
   * Map Internal to ResponseDto
   * Used when returning employment data from API endpoints
   * Returns only user-relevant fields (15 total: 14 employment + membership_year)
   */
  static mapInternalToResponseDto(
    internal: MembershipEmploymentInternal,
  ): ResponseMembershipEmploymentDto {
    const response: ResponseMembershipEmploymentDto = {
      osot_membership_year: internal.osot_membership_year,
      osot_employment_status: getEmployementStatusDisplayName(
        internal.osot_employment_status,
      ),
      osot_work_hours: internal.osot_work_hours?.map((wh) =>
        getWorkHoursDisplayName(wh),
      ),
      osot_role_descriptor: getRoleDescriptionDisplayName(
        internal.osot_role_descriptor,
      ),
      osot_practice_years: internal.osot_practice_years
        ? getPracticeYearsDisplayName(internal.osot_practice_years)
        : undefined,
      osot_position_funding: internal.osot_position_funding?.map((f) =>
        getFundingDisplayName(f),
      ),
      osot_employment_benefits: internal.osot_employment_benefits?.map((b) =>
        getBenefitsDisplayName(b),
      ),
      osot_earnings_employment: internal.osot_earnings_employment
        ? getHourlyEarningsLabel(internal.osot_earnings_employment)
        : undefined,
      osot_earnings_self_direct: internal.osot_earnings_self_direct
        ? getHourlyEarningsLabel(internal.osot_earnings_self_direct)
        : undefined,
      osot_earnings_self_indirect: internal.osot_earnings_self_indirect
        ? getHourlyEarningsLabel(internal.osot_earnings_self_indirect)
        : undefined,
      osot_union_name: internal.osot_union_name,
    };

    // Conditional "_Other" fields
    if (internal.osot_role_descriptor_other !== undefined) {
      response.osot_role_descriptor_other = internal.osot_role_descriptor_other;
    }
    if (internal.osot_position_funding_other !== undefined) {
      response.osot_position_funding_other =
        internal.osot_position_funding_other;
    }
    if (internal.osot_employment_benefits_other !== undefined) {
      response.osot_employment_benefits_other =
        internal.osot_employment_benefits_other;
    }

    // Optional another employment
    if (internal.osot_another_employment !== undefined) {
      response.osot_another_employment = internal.osot_another_employment;
    }

    return response;
  }

  /**
   * Map Internal to Self-Service DTO (/me route)
   * Used specifically for GET /me endpoint
   * Returns MINIMAL user-relevant fields (15 total) - excludes organization, system fields, and lookups
   *
   * INCLUDED FIELDS:
   * - osot_membership_year
   * - osot_employment_status
   * - osot_work_hours
   * - osot_role_descriptor + osot_role_descriptor_other
   * - osot_practice_years
   * - osot_position_funding + osot_position_funding_other
   * - osot_employment_benefits + osot_employment_benefits_other
   * - osot_earnings_employment
   * - osot_earnings_self_direct
   * - osot_earnings_self_indirect
   * - osot_union_name
   * - osot_another_employment
   */
  static mapInternalToSelfServiceDto(
    internal: MembershipEmploymentInternal,
  ): Partial<ResponseMembershipEmploymentDto> {
    const response: Partial<ResponseMembershipEmploymentDto> = {
      osot_membership_year: internal.osot_membership_year,
      osot_employment_status: getEmployementStatusDisplayName(
        internal.osot_employment_status,
      ),
      osot_work_hours: internal.osot_work_hours?.map((wh) =>
        getWorkHoursDisplayName(wh),
      ),
      osot_role_descriptor: getRoleDescriptionDisplayName(
        internal.osot_role_descriptor,
      ),
      osot_practice_years: internal.osot_practice_years
        ? getPracticeYearsDisplayName(internal.osot_practice_years)
        : undefined,
      osot_position_funding: internal.osot_position_funding?.map((f) =>
        getFundingDisplayName(f),
      ),
      osot_employment_benefits: internal.osot_employment_benefits?.map((b) =>
        getBenefitsDisplayName(b),
      ),
      osot_earnings_employment: internal.osot_earnings_employment
        ? getHourlyEarningsLabel(internal.osot_earnings_employment)
        : undefined,
      osot_earnings_self_direct: internal.osot_earnings_self_direct
        ? getHourlyEarningsLabel(internal.osot_earnings_self_direct)
        : undefined,
      osot_earnings_self_indirect: internal.osot_earnings_self_indirect
        ? getHourlyEarningsLabel(internal.osot_earnings_self_indirect)
        : undefined,
      osot_union_name: internal.osot_union_name,
    };

    // Conditional "_Other" fields
    if (internal.osot_role_descriptor_other !== undefined) {
      response.osot_role_descriptor_other = internal.osot_role_descriptor_other;
    }
    if (internal.osot_position_funding_other !== undefined) {
      response.osot_position_funding_other =
        internal.osot_position_funding_other;
    }
    if (internal.osot_employment_benefits_other !== undefined) {
      response.osot_employment_benefits_other =
        internal.osot_employment_benefits_other;
    }

    // Optional another employment
    if (internal.osot_another_employment !== undefined) {
      response.osot_another_employment = internal.osot_another_employment;
    }

    return response;
  }

  /**
   * Map Dataverse response to Internal
   * Used when receiving data from Dataverse API
   * Handles multi-select comma-separated string to array conversion
   */
  static mapDataverseToInternal(
    dataverse: MembershipEmploymentDataverse,
  ): MembershipEmploymentInternal {
    return {
      // Primary key (GUID) - Required for updates
      osot_table_membership_employmentid:
        dataverse.osot_table_membership_employmentid,
      osot_employment_id: dataverse.osot_employment_id,
      osot_membership_year: dataverse.osot_membership_year,

      // Lookup fields - Dataverse returns them directly as GUIDs
      osot_table_account: dataverse.osot_table_account,
      osot_table_account_affiliate: dataverse.osot_table_account_affiliate,

      // Employment fields with enum parsing
      osot_employment_status: parseEmploymentStatus(
        dataverse.osot_employment_status,
      ),
      osot_work_hours: parseWorkHours(dataverse.osot_work_hours),
      osot_role_descriptor: parseRoleDescription(
        dataverse.osot_role_descriptor,
      ),
      osot_practice_years: parsePracticeYears(dataverse.osot_practice_years),
      osot_position_funding: parseFunding(dataverse.osot_position_funding),
      osot_employment_benefits: parseBenefits(
        dataverse.osot_employment_benefits,
      ),
      osot_earnings_employment: parseHourlyEarnings(
        dataverse.osot_earnings_employment,
      ),
      osot_earnings_self_direct: parseHourlyEarnings(
        dataverse.osot_earnings_self_direct,
      ),
      osot_earnings_self_indirect: parseHourlyEarnings(
        dataverse.osot_earnings_self_indirect,
      ),
      osot_union_name: dataverse.osot_union_name,

      // Conditional "_Other" fields
      osot_role_descriptor_other: dataverse.osot_role_descriptor_other,
      osot_position_funding_other: dataverse.osot_position_funding_other,
      osot_employment_benefits_other: dataverse.osot_employment_benefits_other,

      // Optional another employment
      osot_another_employment: dataverse.osot_another_employment,

      // Access control fields with enum parsing
      osot_privilege: parsePrivilege(dataverse.osot_privilege),
      osot_access_modifiers: parseAccessModifier(
        dataverse.osot_access_modifiers,
      ),

      // System timestamps
      createdon: dataverse.createdon,
      modifiedon: dataverse.modifiedon,
    };
  }

  /**
   * Map Internal to Dataverse payload
   * Used when sending data to Dataverse API
   * Converts multi-select arrays to comma-separated strings
   * Converts lookup GUIDs to OData bind format
   */
  static mapInternalToDataverse(
    internal: MembershipEmploymentInternal,
    isUpdate = false,
  ): Partial<MembershipEmploymentDataverse> {
    const payload: Partial<MembershipEmploymentDataverse> = {};

    // Primary key (only for updates)
    if (isUpdate && internal.osot_employment_id !== undefined) {
      payload.osot_employment_id = internal.osot_employment_id;
    }

    // Membership year (SYSTEM-DEFINED, should not be in updates)
    if (internal.osot_membership_year !== undefined && !isUpdate) {
      payload.osot_membership_year = internal.osot_membership_year;
    }

    // Lookup fields - convert to OData bind format
    if (internal.osot_table_account !== undefined) {
      payload[MEMBERSHIP_EMPLOYMENT_FIELDS.ACCOUNT_BIND] = createODataBind(
        'osot_table_accounts',
        internal.osot_table_account,
      );
    }

    if (internal.osot_table_account_affiliate !== undefined) {
      payload[MEMBERSHIP_EMPLOYMENT_FIELDS.ACCOUNT_AFFILIATE_BIND] =
        createODataBind(
          'osot_table_account_affiliates',
          internal.osot_table_account_affiliate,
        );
    }

    // Employment fields (single choice - direct assignment)
    if (internal.osot_employment_status !== undefined) {
      payload.osot_employment_status = internal.osot_employment_status;
    }
    if (internal.osot_role_descriptor !== undefined) {
      payload.osot_role_descriptor = internal.osot_role_descriptor;
    }
    if (internal.osot_practice_years !== undefined) {
      payload.osot_practice_years = internal.osot_practice_years;
    }
    if (internal.osot_earnings_employment !== undefined) {
      payload.osot_earnings_employment = internal.osot_earnings_employment;
    }
    if (internal.osot_earnings_self_direct !== undefined) {
      payload.osot_earnings_self_direct = internal.osot_earnings_self_direct;
    }
    if (internal.osot_earnings_self_indirect !== undefined) {
      payload.osot_earnings_self_indirect =
        internal.osot_earnings_self_indirect;
    }
    if (internal.osot_union_name !== undefined) {
      payload.osot_union_name = internal.osot_union_name;
    }

    // Multi-select fields - convert arrays to comma-separated strings
    if (internal.osot_work_hours !== undefined) {
      payload.osot_work_hours = Array.isArray(internal.osot_work_hours)
        ? internal.osot_work_hours.join(',')
        : String(internal.osot_work_hours);
    }
    if (internal.osot_position_funding !== undefined) {
      payload.osot_position_funding = Array.isArray(
        internal.osot_position_funding,
      )
        ? internal.osot_position_funding.join(',')
        : String(internal.osot_position_funding);
    }
    if (internal.osot_employment_benefits !== undefined) {
      payload.osot_employment_benefits = Array.isArray(
        internal.osot_employment_benefits,
      )
        ? internal.osot_employment_benefits.join(',')
        : String(internal.osot_employment_benefits);
    }

    // Conditional "_Other" fields
    if (internal.osot_role_descriptor_other !== undefined) {
      payload.osot_role_descriptor_other = internal.osot_role_descriptor_other;
    }
    if (internal.osot_position_funding_other !== undefined) {
      payload.osot_position_funding_other =
        internal.osot_position_funding_other;
    }
    if (internal.osot_employment_benefits_other !== undefined) {
      payload.osot_employment_benefits_other =
        internal.osot_employment_benefits_other;
    }

    // Optional another employment
    if (internal.osot_another_employment !== undefined) {
      payload.osot_another_employment = internal.osot_another_employment;
    }

    // Access control fields
    if (internal.osot_privilege !== undefined) {
      payload[MEMBERSHIP_EMPLOYMENT_FIELDS.PRIVILEGE] = internal.osot_privilege;
    }
    if (internal.osot_access_modifiers !== undefined) {
      payload[MEMBERSHIP_EMPLOYMENT_FIELDS.ACCESS_MODIFIERS] =
        internal.osot_access_modifiers;
    }

    return payload;
  }

  /**
   * Validate employment data for completeness
   * Returns validation errors if any required fields are missing or invalid
   */
  static validateEmploymentData(
    employment: Partial<MembershipEmploymentInternal>,
  ): string[] {
    const errors: string[] = [];

    // Check required fields
    if (!employment.osot_membership_year) {
      errors.push('Membership year is required');
    } else {
      // Validate year format (4 digits)
      if (!/^\d{4}$/.test(employment.osot_membership_year)) {
        errors.push('Membership year must be a 4-digit year (YYYY)');
      }
    }

    // Validate user reference (Account XOR Affiliate)
    const hasAccount = !!employment.osot_table_account;
    const hasAffiliate = !!employment.osot_table_account_affiliate;

    if (!hasAccount && !hasAffiliate) {
      errors.push(
        'At least one user reference is required (account or affiliate)',
      );
    }

    if (hasAccount && hasAffiliate) {
      errors.push(
        'Account and Affiliate are mutually exclusive - only one can be provided',
      );
    }

    // Validate required employment fields
    if (employment.osot_employment_status === undefined) {
      errors.push('Employment status is required');
    }
    if (
      !employment.osot_work_hours ||
      employment.osot_work_hours.length === 0
    ) {
      errors.push('Work hours are required');
    }
    if (employment.osot_role_descriptor === undefined) {
      errors.push('Role descriptor is required');
    }
    if (employment.osot_practice_years === undefined) {
      errors.push('Practice years are required');
    }
    if (
      !employment.osot_position_funding ||
      employment.osot_position_funding.length === 0
    ) {
      errors.push('Position funding is required');
    }
    if (
      !employment.osot_employment_benefits ||
      employment.osot_employment_benefits.length === 0
    ) {
      errors.push('Employment benefits are required');
    }
    if (employment.osot_earnings_employment === undefined) {
      errors.push('Earnings from employment is required');
    }
    if (employment.osot_earnings_self_direct === undefined) {
      errors.push('Earnings from self-employment (direct) is required');
    }
    if (employment.osot_earnings_self_indirect === undefined) {
      errors.push('Earnings from self-employment (indirect) is required');
    }
    if (!employment.osot_union_name) {
      errors.push('Union name is required');
    }

    // Validate conditional "_Other" fields
    if (
      employment.osot_role_descriptor === RoleDescription.OTHER &&
      !employment.osot_role_descriptor_other
    ) {
      errors.push(
        'Role descriptor other is required when role descriptor is OTHER',
      );
    }
    if (
      employment.osot_position_funding?.includes(Funding.OTHER) &&
      !employment.osot_position_funding_other
    ) {
      errors.push(
        'Position funding other is required when funding includes OTHER',
      );
    }
    if (
      employment.osot_employment_benefits?.includes(Benefits.OTHER) &&
      !employment.osot_employment_benefits_other
    ) {
      errors.push(
        'Employment benefits other is required when benefits include OTHER',
      );
    }

    // Validate enum values if provided
    if (employment.osot_employment_status !== undefined) {
      if (
        !Object.values(EmploymentStatus).includes(
          employment.osot_employment_status,
        )
      ) {
        errors.push('Invalid employment status value');
      }
    }

    if (employment.osot_work_hours !== undefined) {
      if (!Array.isArray(employment.osot_work_hours)) {
        errors.push('Work hours must be an array');
      } else {
        const invalidValues = employment.osot_work_hours.filter(
          (val) => !Object.values(WorkHours).includes(val),
        );
        if (invalidValues.length > 0) {
          errors.push('Invalid work hours value(s)');
        }
      }
    }

    if (employment.osot_position_funding !== undefined) {
      if (!Array.isArray(employment.osot_position_funding)) {
        errors.push('Position funding must be an array');
      } else {
        const invalidValues = employment.osot_position_funding.filter(
          (val) => !Object.values(Funding).includes(val),
        );
        if (invalidValues.length > 0) {
          errors.push('Invalid position funding value(s)');
        }
      }
    }

    if (employment.osot_employment_benefits !== undefined) {
      if (!Array.isArray(employment.osot_employment_benefits)) {
        errors.push('Employment benefits must be an array');
      } else {
        const invalidValues = employment.osot_employment_benefits.filter(
          (val) => !Object.values(Benefits).includes(val),
        );
        if (invalidValues.length > 0) {
          errors.push('Invalid employment benefits value(s)');
        }
      }
    }

    return errors;
  }

  /**
   * Sanitize employment data by removing sensitive fields
   * Used when preparing data for logging or external systems
   */
  static sanitizeEmploymentData(
    employment: MembershipEmploymentInternal,
  ): Partial<MembershipEmploymentInternal> {
    const sanitized: Partial<MembershipEmploymentInternal> = {
      osot_employment_id: employment.osot_employment_id,
      osot_membership_year: employment.osot_membership_year,
      osot_employment_status: employment.osot_employment_status,
      osot_work_hours: employment.osot_work_hours,
      osot_role_descriptor: employment.osot_role_descriptor,
      osot_practice_years: employment.osot_practice_years,
      osot_position_funding: employment.osot_position_funding,
      osot_employment_benefits: employment.osot_employment_benefits,
      // Note: Union name included as it's not highly sensitive
      osot_union_name: employment.osot_union_name,
      osot_another_employment: employment.osot_another_employment,
      createdon: employment.createdon,
      modifiedon: employment.modifiedon,
    };

    // Exclude earnings data (potentially sensitive)
    // Exclude lookup GUIDs (user references)
    // Exclude conditional "_Other" fields (may contain PII)

    return sanitized;
  }
}
