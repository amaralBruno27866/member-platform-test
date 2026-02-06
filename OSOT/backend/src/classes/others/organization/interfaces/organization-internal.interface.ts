import { AccountStatus } from '../../../../common/enums/account-status.enum';
import { Privilege } from '../../../../common/enums/privilege.enum';
import { AccessModifier } from '../../../../common/enums/access-modifier.enum';

/**
 * Internal Organization interface with all fields including system information.
 * Used for server-side operations and business logic.
 *
 * MATCHES Table Organization.csv specification exactly (14 fields total).
 *
 * This interface represents organization data with TypeScript native types (Date, enums).
 * Use OrganizationDataverseInterface for raw Dataverse API responses.
 */
export interface OrganizationInternal {
  // ========================================
  // SYSTEM FIELDS (5 fields)
  // ========================================

  /**
   * Primary key (GUID)
   * System-generated unique identifier
   * Never expose publicly
   */
  osot_table_organizationid?: string;

  /**
   * Business ID (Autonumber)
   * Format: osot-org-0000001
   * User-friendly unique identifier
   * Safe to expose publicly
   */
  osot_organizationid?: string;

  /**
   * Created on date
   * System field - automatically set by Dataverse
   * Date object for internal processing
   */
  createdon?: Date;

  /**
   * Modified on date
   * System field - automatically updated by Dataverse
   * Date object for internal processing
   */
  modifiedon?: Date;

  /**
   * Owner ID
   * System field - Dataverse owner reference
   * GUID format
   */
  ownerid?: string;

  // ========================================
  // BASIC INFORMATION (5 fields)
  // ========================================

  /**
   * Organization name
   * Required field
   * Example: "Ontario Society of Occupational Therapists"
   * Max 255 characters
   */
  osot_organization_name: string;

  /**
   * Legal name (razão social)
   * Required field
   * Example: "Ontario Society of Occupational Therapists Inc."
   * Max 255 characters
   */
  osot_legal_name: string;

  /**
   * Acronym (sigla)
   * Optional field
   * Example: "OSOT", "AOTA", "CAOT"
   * Max 100 characters
   */
  osot_acronym?: string;

  /**
   * Slug (unique text identifier)
   * Required field
   * Format: lowercase, numbers, hyphens only
   * Pattern: ^[a-z0-9-]+$
   * Example: "osot", "aota", "bc-ot-society"
   * Must be unique across all organizations
   * Used in URLs: /login/{slug}, /api/public/organization/{slug}
   * Max 255 characters
   */
  osot_slug: string;

  /**
   * Organization status
   * Optional field
   * Maps to AccountStatus enum (Choices_Status global choice)
   * Default: Active (1)
   * Values: ACTIVE=1, INACTIVE=2, PENDING=3
   */
  osot_organization_status?: AccountStatus;

  // ========================================
  // RELATIONSHIP FIELDS (1 field)
  // ========================================

  /**
   * Address GUID - required relationship
   * 1:1 relationship with Address entity
   * Address is created after organization (org first, then address)
   * Cascade delete: deleting org also deletes its address
   */
  addressGuid?: string;

  /**
   * Organization logo URL
   * Required field
   * Example: "https://cdn.osot.on.ca/logo.png"
   * Max 255 characters
   */
  osot_organization_logo: string;

  /**
   * Organization website URL
   * Required field
   * Example: "https://www.osot.on.ca"
   * Max 255 characters
   */
  osot_organization_website: string;

  /**
   * Representative (legal representative)
   * Required field
   * Example: "John Doe, Executive Director"
   * Max 255 characters
   */
  osot_representative: string;

  // ========================================
  // CONTACT (2 fields)
  // ========================================

  /**
   * Organization email
   * Required field
   * Format: email
   * Example: "info@osot.on.ca"
   * Max 255 characters
   */
  osot_organization_email: string;

  /**
   * Organization phone
   * Required field
   * Format: Canadian phone number
   * Example: "+1-416-555-0100"
   * Max 14 characters
   */
  osot_organization_phone: string;

  // ========================================
  // ACCESS CONTROL (2 fields)
  // ========================================

  /**
   * Privilege level
   * Optional field
   * Maps to Privilege enum (Choices_Privilege global choice)
   * Default: Main
   */
  osot_privilege?: Privilege;

  /**
   * Access modifier
   * Optional field
   * Maps to AccessModifier enum (Choices_Access_Modifiers global choice)
   * Default: Private
   */
  osot_access_modifier?: AccessModifier;

  // ========================================
  // COMPUTED FIELDS (not stored in database)
  // ========================================

  /**
   * Computed: Is organization active?
   * Based on organization_status === ACTIVE
   */
  isActive?: boolean;

  /**
   * Computed: Has complete branding?
   * True if logo and website are set
   */
  hasCompleteBranding?: boolean;
}

/**
 * Type for creating new Internal Organization records
 * Excludes system-generated and computed fields
 */
export type CreateOrganizationInternal = Omit<
  OrganizationInternal,
  | 'osot_table_organizationid'
  | 'osot_organizationid'
  | 'createdon'
  | 'modifiedon'
  | 'ownerid'
  | 'isActive'
  | 'hasCompleteBranding'
>;

/**
 * Type for updating existing Internal Organization records
 * Makes all fields optional except ID
 */
export type UpdateOrganizationInternal = Partial<
  Omit<
    OrganizationInternal,
    | 'osot_table_organizationid'
    | 'osot_organizationid'
    | 'createdon'
    | 'modifiedon'
    | 'ownerid'
    | 'osot_slug' // Slug is immutable after creation
    | 'isActive'
    | 'hasCompleteBranding'
  >
> & {
  // ID is required for updates
  osot_table_organizationid: string;
};

/**
 * Type for minimal Organization data (for lists)
 * Only essential fields for display
 */
export type OrganizationBasicInternal = {
  osot_organizationid?: string; // Business ID
  osot_organization_name: string;
  osot_acronym?: string;
  osot_slug: string;
  osot_organization_status?: AccountStatus;
  osot_organization_logo: string;
};

/**
 * Type for public Organization data (used in white-label login)
 * Fields safe to expose without authentication
 */
export type OrganizationPublicInternal = {
  osot_organizationid?: string; // Business ID
  osot_organization_name: string;
  osot_acronym?: string;
  osot_slug: string;
  osot_organization_logo: string;
  osot_organization_website: string;
};
