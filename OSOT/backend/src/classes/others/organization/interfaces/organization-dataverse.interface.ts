/**
 * Interface representing the raw Dataverse response for Organization entity.
 * Maps directly to Table Organization.csv table structure.
 *
 * MATCHES Table Organization.csv specification exactly (14 fields total).
 * Used internally for type safety when working with raw Dataverse data.
 *
 * KEY DIFFERENCES from OrganizationInternal:
 * - Dates are ISO strings (not Date objects)
 * - Enums are numbers (not TypeScript enums)
 * - All fields use Dataverse naming conventions
 */
export interface OrganizationDataverse {
  // ========================================
  // SYSTEM FIELDS (5 fields)
  // ========================================

  /**
   * Primary key (GUID)
   * System-generated unique identifier
   */
  osot_table_organizationid?: string;

  /**
   * Business ID (Autonumber)
   * Format: osot-org-0000001
   */
  osot_organizationid?: string;

  /**
   * Created on date
   * ISO datetime string
   */
  createdon?: string;

  /**
   * Modified on date
   * ISO datetime string
   */
  modifiedon?: string;

  /**
   * Owner ID
   * Owner GUID
   */
  ownerid?: string;

  // ========================================
  // BASIC INFORMATION (5 fields)
  // ========================================

  /**
   * Organization name
   * Required field (max 255 chars)
   */
  osot_organization_name: string;

  /**
   * Legal name
   * Required field (max 255 chars)
   */
  osot_legal_name: string;

  /**
   * Acronym
   * Optional field (max 100 chars)
   */
  osot_acronym?: string;

  /**
   * Slug (unique text identifier)
   * Required field (max 255 chars)
   * Format: ^[a-z0-9-]+$
   */
  osot_slug: string;

  // ========================================
  // RELATIONSHIP FIELDS (1 field)
  // ========================================

  /**
   * Lookup to Table_Address (required relationship)
   * 1:1 relationship with Address entity
   * Address GUID value from Dataverse lookup
   */
  _osot_table_address_value?: string;

  /**
   * OData binding for Address relationship
   */
  'osot_Table_Address@odata.bind'?: string;

  /**
   * Organization status
   * Optional field (Choice - number)
   * Maps to AccountStatus enum
   * Values: 1=Active, 2=Inactive, 3=Pending
   * Default: 1 (Active)
   */
  osot_organization_status?: number;

  // ========================================
  // BRANDING (3 fields)
  // ========================================

  /**
   * Organization logo URL
   * Required field (max 255 chars)
   */
  osot_organization_logo: string;

  /**
   * Organization website URL
   * Required field (max 255 chars)
   */
  osot_organization_website: string;

  /**
   * Representative
   * Required field (max 255 chars)
   */
  osot_representative: string;

  // ========================================
  // CONTACT (2 fields)
  // ========================================

  /**
   * Organization email
   * Required field (max 255 chars)
   */
  osot_organization_email: string;

  /**
   * Organization phone
   * Required field (max 14 chars)
   */
  osot_organization_phone: string;

  // ========================================
  // ACCESS CONTROL (2 fields)
  // ========================================

  /**
   * Privilege level
   * Optional field (Choice - number)
   * Maps to Privilege enum
   */
  osot_privilege?: number;

  /**
   * Access modifier
   * Optional field (Choice - number)
   * Maps to AccessModifier enum
   */
  osot_access_modifier?: number;
}

/**
 * Type for creating new Organization records
 * Excludes system-generated fields
 */
export type CreateOrganizationDataverse = Omit<
  OrganizationDataverse,
  | 'osot_table_organizationid'
  | 'osot_organizationid'
  | 'createdon'
  | 'modifiedon'
  | 'ownerid'
>;

/**
 * Type for updating existing Organization records
 * Makes all fields optional except system ID
 * Slug is excluded as it's immutable after creation
 */
export type UpdateOrganizationDataverse = Partial<
  Omit<
    OrganizationDataverse,
    | 'osot_table_organizationid'
    | 'osot_organizationid'
    | 'createdon'
    | 'modifiedon'
    | 'ownerid'
    | 'osot_slug' // Slug cannot be changed after creation
  >
> & {
  // ID is required for updates
  osot_table_organizationid: string;
};

/**
 * Type for minimal Organization data from Dataverse (for lists)
 */
export type OrganizationBasicDataverse = {
  osot_organizationid?: string;
  osot_organization_name: string;
  osot_acronym?: string;
  osot_slug: string;
  osot_organization_status?: number;
  osot_organization_logo: string;
};

/**
 * Type for public Organization data from Dataverse (for white-label login)
 */
export type OrganizationPublicDataverse = {
  osot_organizationid?: string;
  osot_organization_name: string;
  osot_acronym?: string;
  osot_slug: string;
  osot_organization_logo: string;
  osot_organization_website: string;
};
