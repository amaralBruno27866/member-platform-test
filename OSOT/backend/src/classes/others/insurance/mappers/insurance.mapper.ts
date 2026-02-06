/**
 * Insurance Mapper
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes for transformation error handling
 * - enums: Uses InsuranceStatus enum for lifecycle states
 * - interfaces: Bidirectional transformation between DTOs, Internal, and Dataverse
 * - integrations: Compatible with DataverseService response formats
 *
 * CRITICAL RESPONSIBILITIES:
 * - Transform Create/Update DTOs to Internal representation
 * - Transform Internal to Response DTOs for API output
 * - Transform Dataverse responses to Internal
 * - Transform Internal to Dataverse payloads
 * - Handle OData @odata.bind for relationship lookups (Organization, Order, Account)
 * - Convert dates between ISO 8601 strings (Dataverse) and Date objects (Internal)
 * - Validate snapshot field immutability (21 frozen fields)
 * - Handle InsuranceStatus enum conversions
 * - Preserve business rule state (declaration, questions, endorsements)
 *
 * SNAPSHOT FIELDS (14 immutable account/address fields + 6 insurance details):
 * - Account: accountGroup, category, membership, certificate, firstName, lastName, personalCorporation
 * - Address: address1, address2, city, province, postalCode, phoneNumber, email
 * - Insurance: insuranceType, insuranceLimit, insurancePrice, total
 * - Decision: Insurance snapshot freezes entire policy at creation for audit/compliance
 *
 * DATE FIELD HANDLING:
 * - Dataverse stores as ISO 8601 strings: '2026-01-23T00:00:00Z'
 * - Internal uses Date objects for processing
 * - Response DTOs return ISO strings for API consumption
 *
 * ODATA BIND PATTERN for Relationships:
 * - Create payload: osot_Table_Organization@odata.bind: "/osot_table_organizations(guid)"
 * - Response includes: _osot_table_organization_value: "guid" (read-only lookup value)
 * - Mapper converts between both formats via createOdataBind() helper
 */

import { InsuranceStatus } from '../enum/insurance-status.enum';
import { CreateInsuranceDto } from '../dtos/create-insurance.dto';
import { UpdateInsuranceDto } from '../dtos/update-insurance.dto';
import { InsuranceResponseDto } from '../dtos/insurance-response.dto';
import { InsuranceInternal } from '../interfaces/insurance-internal.interface';
import { InsuranceDataverse } from '../interfaces/insurance-dataverse.interface';

// Export Response DTO type for external use
export { InsuranceResponseDto } from '../dtos/insurance-response.dto';

/**
 * Helper Functions for Data Conversions
 */

/**
 * Convert ISO 8601 string to Date object
 * Handles null/undefined safely
 * Example: '2026-01-23T00:00:00Z' -> Date object
 */
function parseIsoDate(dateString: string | undefined): Date | undefined {
  if (!dateString) return undefined;
  return new Date(dateString);
}

/**
 * Convert Date object to ISO 8601 string
 * Handles null/undefined safely
 * Example: Date object -> '2026-01-23T00:00:00Z'
 */
function toIsoString(date: Date | undefined): string | undefined {
  if (!date) return undefined;
  return date.toISOString();
}

/**
 * Create OData @odata.bind string from GUID
 * Example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" -> "/osot_table_organizations(a1b2c3d4-e5f6-7890-abcd-ef1234567890)"
 */
function createOdataBind(
  entity: string,
  guid: string | undefined,
): string | undefined {
  if (!guid) return undefined;
  return `/osot_table_${entity}(${guid})`;
}

/**
 * Convert InsuranceStatus enum to Dataverse choice number
 * Dataverse stores enum values as numbers:
 * - DRAFT = 1
 * - PENDING = 2
 * - ACTIVE = 3
 * - EXPIRED = 4
 * - CANCELLED = 5
 */
function statusToDataverseNumber(
  status: InsuranceStatus | undefined,
): number | undefined {
  if (status === undefined) return undefined;

  const statusMap: Record<InsuranceStatus, number> = {
    [InsuranceStatus.DRAFT]: 1,
    [InsuranceStatus.PENDING]: 2,
    [InsuranceStatus.ACTIVE]: 3,
    [InsuranceStatus.EXPIRED]: 4,
    [InsuranceStatus.CANCELLED]: 5,
  };

  return statusMap[status];
}

/**
 * Convert Dataverse choice number to InsuranceStatus enum
 */
function numberToStatus(
  statusCode: number | undefined,
): InsuranceStatus | undefined {
  if (statusCode === undefined) return undefined;

  const statusMap: Record<number, InsuranceStatus> = {
    1: InsuranceStatus.DRAFT,
    2: InsuranceStatus.PENDING,
    3: InsuranceStatus.ACTIVE,
    4: InsuranceStatus.EXPIRED,
    5: InsuranceStatus.CANCELLED,
  };

  return statusMap[statusCode];
}

/**
 * Insurance Mapper Class
 * Handles bidirectional transformations between DTOs, Internal, and Dataverse formats
 */
export class InsuranceMapper {
  /**
   * Transform CreateInsuranceDto to InsuranceInternal
   *
   * Purpose: Convert API request data to internal domain model
   * Handles: Date parsing, relationship GUIDs, enum conversion, validation
   *
   * @param dto - Create request DTO with all required fields
   * @returns InsuranceInternal - Internal domain representation ready for business rules
   */
  static createDtoToInternal(dto: CreateInsuranceDto): InsuranceInternal {
    return {
      // ========================================
      // SYSTEM FIELDS (not set on create, generated by Dataverse)
      // ========================================
      // osot_table_insuranceid: undefined, // System-generated GUID
      // osot_insuranceid: undefined, // System-generated autonumber
      // createdon: undefined, // System timestamp
      // modifiedon: undefined, // System timestamp
      // ownerid: undefined, // System-determined owner
      // statecode: 0, // Default to Active
      // statuscode: undefined, // Will be set based on osot_insurance_status

      // ========================================
      // REQUIRED RELATIONSHIP FIELDS (from DTO)
      // ========================================
      organizationGuid: dto.organizationGuid,
      orderGuid: dto.orderGuid,
      accountGuid: dto.accountGuid,

      // ========================================
      // SNAPSHOT FIELDS FROM ACCOUNT/ADDRESS (immutable after creation)
      // ========================================
      osot_account_group: dto.osot_account_group,
      osot_category: dto.osot_category,
      osot_membership: dto.osot_membership,
      osot_membership_year: dto.osot_membership_year,
      osot_certificate: dto.osot_certificate,
      osot_first_name: dto.osot_first_name,
      osot_last_name: dto.osot_last_name,
      osot_personal_corporation: dto.osot_personal_corporation,
      osot_address_1: dto.osot_address_1,
      osot_address_2: dto.osot_address_2,
      osot_city: dto.osot_city,
      osot_province: dto.osot_province,
      osot_postal_code: dto.osot_postal_code,
      osot_phone_number: dto.osot_phone_number,
      osot_email: dto.osot_email,

      // ========================================
      // INSURANCE DETAILS (mostly immutable)
      // ========================================
      osot_insurance_type: dto.osot_insurance_type,
      osot_insurance_limit: dto.osot_insurance_limit,
      osot_insurance_price: dto.osot_insurance_price,
      osot_total: dto.osot_total,
      osot_insurance_status: InsuranceStatus.PENDING, // New insurance starts as PENDING
      osot_insurance_declaration: dto.osot_insurance_declaration,

      // ========================================
      // DATE FIELDS
      // ========================================
      osot_effective_date: parseIsoDate(dto.osot_effective_date) || new Date(),
      osot_expires_date: parseIsoDate(dto.osot_expires_date),
      osot_endorsement_effective_date: parseIsoDate(
        dto.osot_endorsement_effective_date,
      ),

      // ========================================
      // QUESTIONS & EXPLANATIONS (immutable)
      // ========================================
      osot_insurance_question_1: dto.osot_insurance_question_1,
      osot_insurance_question_1_explain: dto.osot_insurance_question_1_explain,
      osot_insurance_question_2: dto.osot_insurance_question_2,
      osot_insurance_question_2_explain: dto.osot_insurance_question_2_explain,
      osot_insurance_question_3: dto.osot_insurance_question_3,
      osot_insurance_question_3_explain: dto.osot_insurance_question_3_explain,

      // ========================================
      // ENDORSEMENTS (mutable for future updates)
      // ========================================
      osot_endorsement_description: dto.osot_endorsement_description,

      // ========================================
      // ACCESS CONTROL
      // ========================================
      osot_privilege: dto.osot_privilege,
      osot_access_modifiers: dto.osot_access_modifiers,
    };
  }

  /**
   * Transform Internal InsuranceInternal to Dataverse payload
   *
   * Purpose: Convert domain model to Dataverse OData format
   * Handles: ISO date formatting, OData @odata.bind relationships, enum to number conversion
   *
   * @param internal - Internal domain representation
   * @returns Partial<InsuranceDataverse> - Payload ready for Dataverse API
   */
  static internalToDataverse(
    internal: Partial<InsuranceInternal>,
  ): Partial<InsuranceDataverse> {
    const dataverse: Partial<InsuranceDataverse> = {
      // ========================================
      // REQUIRED RELATIONSHIP BINDINGS (OData)
      // ========================================
      'osot_Table_Organization@odata.bind': createOdataBind(
        'organization',
        internal.organizationGuid,
      ),
      'osot_Table_Order@odata.bind': createOdataBind(
        'order',
        internal.orderGuid,
      ),
      'osot_Table_Account@odata.bind': createOdataBind(
        'account',
        internal.accountGuid,
      ),

      // ========================================
      // SNAPSHOT FIELDS (immutable)
      // ========================================
      osot_account_group: internal.osot_account_group,
      osot_category: internal.osot_category,
      osot_membership: internal.osot_membership,
      osot_membership_year: internal.osot_membership_year,
      osot_certificate: internal.osot_certificate,
      osot_first_name: internal.osot_first_name,
      osot_last_name: internal.osot_last_name,
      osot_personal_corporation: internal.osot_personal_corporation,
      osot_address_1: internal.osot_address_1,
      osot_address_2: internal.osot_address_2,
      osot_city: internal.osot_city,
      osot_province: internal.osot_province,
      osot_postal_code: internal.osot_postal_code,
      osot_phone_number: internal.osot_phone_number,
      osot_email: internal.osot_email,

      // ========================================
      // INSURANCE DETAILS
      // ========================================
      osot_insurance_type: internal.osot_insurance_type,
      osot_insurance_limit: internal.osot_insurance_limit,
      osot_insurance_price: internal.osot_insurance_price,
      osot_total: internal.osot_total,
      osot_insurance_status: statusToDataverseNumber(
        internal.osot_insurance_status,
      ),
      osot_insurance_declaration: internal.osot_insurance_declaration,

      // ========================================
      // DATE FIELDS (convert to ISO 8601)
      // ========================================
      osot_effective_date: toIsoString(internal.osot_effective_date),
      osot_expires_date: toIsoString(internal.osot_expires_date),
      osot_endorsement_effective_date: toIsoString(
        internal.osot_endorsement_effective_date,
      ),

      // ========================================
      // QUESTIONS & EXPLANATIONS
      // ========================================
      osot_insurance_question_1: internal.osot_insurance_question_1,
      osot_insurance_question_1_explain:
        internal.osot_insurance_question_1_explain,
      osot_insurance_question_2: internal.osot_insurance_question_2,
      osot_insurance_question_2_explain:
        internal.osot_insurance_question_2_explain,
      osot_insurance_question_3: internal.osot_insurance_question_3,
      osot_insurance_question_3_explain:
        internal.osot_insurance_question_3_explain,

      // ========================================
      // ENDORSEMENTS
      // ========================================
      osot_endorsement_description: internal.osot_endorsement_description,

      // ========================================
      // ACCESS CONTROL
      // ========================================
      osot_privilege: internal.osot_privilege,
      osot_access_modifiers: internal.osot_access_modifiers,
    };

    // Remove undefined values (don't send to Dataverse)
    Object.keys(dataverse).forEach((key) => {
      if (dataverse[key as keyof InsuranceDataverse] === undefined) {
        delete dataverse[key as keyof InsuranceDataverse];
      }
    });

    return dataverse;
  }

  /**
   * Transform Dataverse response to InsuranceInternal
   *
   * Purpose: Convert Dataverse OData response to internal domain model
   * Handles: Date parsing from ISO strings, relationship GUID extraction, enum conversion
   *
   * @param dataverse - Dataverse API response data
   * @returns InsuranceInternal - Internal domain representation
   */
  static dataverseToInternal(dataverse: InsuranceDataverse): InsuranceInternal {
    return {
      // ========================================
      // SYSTEM FIELDS (from Dataverse response)
      // ========================================
      osot_table_insuranceid: dataverse.osot_table_insuranceid,
      osot_insuranceid: dataverse.osot_insuranceid,
      createdon: parseIsoDate(dataverse.createdon),
      modifiedon: parseIsoDate(dataverse.modifiedon),
      ownerid: dataverse.ownerid,
      statecode: dataverse.statecode,
      statuscode: dataverse.statuscode,

      // ========================================
      // RELATIONSHIP FIELDS (extract GUIDs from lookup values)
      // ========================================
      organizationGuid: dataverse._osot_table_organization_value || '',
      orderGuid: dataverse._osot_table_order_value || '',
      accountGuid: dataverse._osot_table_account_value || '',

      // ========================================
      // SNAPSHOT FIELDS
      // ========================================
      osot_account_group: dataverse.osot_account_group || '',
      osot_category: dataverse.osot_category || '',
      osot_membership: dataverse.osot_membership || '',
      osot_membership_year: dataverse.osot_membership_year || '',
      osot_certificate: dataverse.osot_certificate || '',
      osot_first_name: dataverse.osot_first_name || '',
      osot_last_name: dataverse.osot_last_name || '',
      osot_personal_corporation: dataverse.osot_personal_corporation,
      osot_address_1: dataverse.osot_address_1 || '',
      osot_address_2: dataverse.osot_address_2,
      osot_city: dataverse.osot_city || '',
      osot_province: dataverse.osot_province || '',
      osot_postal_code: dataverse.osot_postal_code || '',
      osot_phone_number: dataverse.osot_phone_number || '',
      osot_email: dataverse.osot_email || '',

      // ========================================
      // INSURANCE DETAILS
      // ========================================
      osot_insurance_type: dataverse.osot_insurance_type || '',
      osot_insurance_limit: dataverse.osot_insurance_limit || 0,
      osot_insurance_price: dataverse.osot_insurance_price || 0,
      osot_total: dataverse.osot_total || 0,
      osot_insurance_status:
        numberToStatus(dataverse.osot_insurance_status) ||
        InsuranceStatus.DRAFT,
      osot_insurance_declaration: dataverse.osot_insurance_declaration || false,

      // ========================================
      // DATE FIELDS (convert from ISO strings)
      // ========================================
      osot_effective_date:
        parseIsoDate(dataverse.osot_effective_date) || new Date(),
      osot_expires_date:
        parseIsoDate(dataverse.osot_expires_date) || new Date(),
      osot_endorsement_effective_date: parseIsoDate(
        dataverse.osot_endorsement_effective_date,
      ),

      // ========================================
      // QUESTIONS & EXPLANATIONS
      // ========================================
      osot_insurance_question_1: dataverse.osot_insurance_question_1,
      osot_insurance_question_1_explain:
        dataverse.osot_insurance_question_1_explain,
      osot_insurance_question_2: dataverse.osot_insurance_question_2,
      osot_insurance_question_2_explain:
        dataverse.osot_insurance_question_2_explain,
      osot_insurance_question_3: dataverse.osot_insurance_question_3,
      osot_insurance_question_3_explain:
        dataverse.osot_insurance_question_3_explain,

      // ========================================
      // ENDORSEMENTS
      // ========================================
      osot_endorsement_description: dataverse.osot_endorsement_description,

      // ========================================
      // ACCESS CONTROL
      // ========================================
      osot_privilege: dataverse.osot_privilege,
      osot_access_modifiers: dataverse.osot_access_modifiers,
    };
  }

  /**
   * Transform UpdateInsuranceDto to Partial InsuranceInternal
   *
   * Purpose: Convert API update request to internal domain model
   * Important: Updates are limited to mutable fields only
   * Mutable fields: status, endorsement description/date, privilege, access modifiers
   *
   * @param dto - Update request DTO (only mutable fields)
   * @returns Partial<InsuranceInternal> - Internal representation for update operation
   */
  static updateDtoToInternal(
    dto: UpdateInsuranceDto,
  ): Partial<InsuranceInternal> {
    const internal: Partial<InsuranceInternal> = {
      // Only these fields can be updated (all others are immutable)
      osot_insurance_status: dto.osot_insurance_status,
      osot_endorsement_description: dto.osot_endorsement_description,
      osot_endorsement_effective_date: parseIsoDate(
        dto.osot_endorsement_effective_date,
      ),
      osot_privilege: dto.osot_privilege,
      osot_access_modifiers: dto.osot_access_modifiers,
    };

    // Remove undefined values
    Object.keys(internal).forEach((key) => {
      if (internal[key as keyof InsuranceInternal] === undefined) {
        delete internal[key as keyof InsuranceInternal];
      }
    });

    return internal;
  }

  /**
   * Transform InsuranceInternal to InsuranceResponseDto
   *
   * Purpose: Convert internal domain model to API response
   * Handles: Date serialization, enum to readable values, system field exposure
   *
   * @param internal - Internal domain representation
   * @returns InsuranceResponseDto - Response DTO for API output
   */
  static internalToResponseDto(
    internal: InsuranceInternal,
  ): InsuranceResponseDto {
    const response = new InsuranceResponseDto();

    // ========================================
    // SYSTEM FIELDS
    // ========================================
    response.osot_table_insuranceid = internal.osot_table_insuranceid;
    response.osot_insuranceid = internal.osot_insuranceid;
    response.createdon = toIsoString(internal.createdon);
    response.modifiedon = toIsoString(internal.modifiedon);

    // ========================================
    // RELATIONSHIP FIELDS (GUIDs)
    // ========================================
    response.organizationGuid = internal.organizationGuid;
    response.orderGuid = internal.orderGuid;
    response.accountGuid = internal.accountGuid;

    // ========================================
    // SNAPSHOT FIELDS
    // ========================================
    response.osot_account_group = internal.osot_account_group;
    response.osot_category = internal.osot_category;
    response.osot_membership = internal.osot_membership;
    response.osot_certificate = internal.osot_certificate;
    response.osot_first_name = internal.osot_first_name;
    response.osot_last_name = internal.osot_last_name;
    response.osot_personal_corporation = internal.osot_personal_corporation;
    response.osot_address_1 = internal.osot_address_1;
    response.osot_address_2 = internal.osot_address_2;
    response.osot_city = internal.osot_city;
    response.osot_province = internal.osot_province;
    response.osot_postal_code = internal.osot_postal_code;
    response.osot_phone_number = internal.osot_phone_number;
    response.osot_email = internal.osot_email;

    // ========================================
    // INSURANCE DETAILS
    // ========================================
    response.osot_insurance_type = internal.osot_insurance_type;
    response.osot_insurance_limit = internal.osot_insurance_limit;
    response.osot_insurance_price = internal.osot_insurance_price;
    response.osot_total = internal.osot_total;
    response.osot_insurance_status = internal.osot_insurance_status;
    response.osot_insurance_declaration = internal.osot_insurance_declaration;

    // ========================================
    // DATE FIELDS (as ISO strings for API)
    // ========================================
    response.osot_effective_date = toIsoString(internal.osot_effective_date);
    response.osot_expires_date = toIsoString(internal.osot_expires_date);
    response.osot_endorsement_effective_date = toIsoString(
      internal.osot_endorsement_effective_date,
    );

    // ========================================
    // QUESTIONS & EXPLANATIONS
    // ========================================
    response.osot_insurance_question_1 = internal.osot_insurance_question_1;
    response.osot_insurance_question_1_explain =
      internal.osot_insurance_question_1_explain;
    response.osot_insurance_question_2 = internal.osot_insurance_question_2;
    response.osot_insurance_question_2_explain =
      internal.osot_insurance_question_2_explain;
    response.osot_insurance_question_3 = internal.osot_insurance_question_3;
    response.osot_insurance_question_3_explain =
      internal.osot_insurance_question_3_explain;

    // ========================================
    // ENDORSEMENTS
    // ========================================
    response.osot_endorsement_description =
      internal.osot_endorsement_description;

    // ========================================
    // ACCESS CONTROL
    // ========================================
    response.osot_privilege = internal.osot_privilege;
    response.osot_access_modifiers = internal.osot_access_modifiers;

    return response;
  }
}
