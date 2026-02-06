/**
 * Organization OData Constants
 *
 * Centralized configuration for Organization entity OData operations:
 * - Field names (Dataverse schema)
 * - Entity metadata
 * - Query expand configurations
 *
 * CRITICAL: Field names must match exactly with Dataverse schema (Table Organization.csv)
 * Any mismatch will cause OData query failures
 */

/**
 * Organization entity metadata for Dataverse API
 */
export const ORGANIZATION_ENTITY = {
  /**
   * Logical name used in OData API endpoints
   * Example: /api/data/v9.2/osot_table_organizations
   */
  logicalName: 'osot_table_organization',

  /**
   * Plural name for collection endpoints
   */
  collectionName: 'osot_table_organizations',

  /**
   * Primary key field name (GUID)
   */
  primaryKey: 'osot_table_organizationid',
} as const;

/**
 * Organization field names exactly as they appear in Dataverse
 * Used for OData $select, $filter, $orderby operations
 *
 * IMPORTANT: These names are case-sensitive and must match Dataverse schema
 * Based on: Table Organization.csv specification (14 fields)
 */
export const ORGANIZATION_ODATA = {
  // ========================================
  // IDENTIFIERS (2 fields)
  // ========================================

  /**
   * Primary key (GUID)
   * System-generated unique identifier
   * System required field
   */
  TABLE_ORGANIZATION_ID: 'osot_table_organizationid',

  /**
   * Business ID (Autonumber)
   * Format: osot-org-0000001
   * User-friendly unique identifier
   * Business required field
   */
  ORGANIZATION_ID: 'osot_organizationid',

  // ========================================
  // BASIC INFORMATION (5 fields)
  // ========================================

  /**
   * Organization name
   * Required field (max 255 chars)
   * Example: "Ontario Society of Occupational Therapists"
   */
  ORGANIZATION_NAME: 'osot_organization_name',

  /**
   * Legal name (razão social)
   * Required field (max 255 chars)
   * Example: "Ontario Society of Occupational Therapists Inc."
   */
  LEGAL_NAME: 'osot_legal_name',

  /**
   * Acronym (sigla)
   * Optional field (max 100 chars)
   * Example: "OSOT", "AOTA", "CAOT"
   * Used for branding and display
   */
  ACRONYM: 'osot_acronym',

  /**
   * Slug (unique text identifier)
   * Required field (max 255 chars)
   * Dataverse type: Single line of text
   * Format: lowercase, numbers, hyphens only
   * Pattern: ^[a-z0-9-]+$
   * Example: "osot", "aota", "bc-ot-society"
   * Must be unique across all organizations
   * Used in URLs: /login/{slug}, /api/public/organization/{slug}
   */
  SLUG: 'osot_slug',

  /**
   * Organization status
   * Optional field (Choice - global)
   * Synced with: Choices_Status (global choice in Dataverse)
   * Maps to: AccountStatus enum (ACTIVE=1, INACTIVE=2, PENDING=3)
   * Default: Active (1)
   */
  ORGANIZATION_STATUS: 'osot_organization_status',

  // ========================================
  // BRANDING (3 fields)
  // ========================================

  /**
   * Organization logo URL
   * Required field (max 255 chars)
   * Example: "https://cdn.osot.on.ca/logo.png"
   */
  ORGANIZATION_LOGO: 'osot_organization_logo',

  /**
   * Organization website URL
   * Required field (max 255 chars)
   * Example: "https://www.osot.on.ca"
   */
  ORGANIZATION_WEBSITE: 'osot_organization_website',

  /**
   * Representative (legal representative)
   * Required field (max 255 chars)
   * Example: "John Doe, Executive Director"
   */
  REPRESENTATIVE: 'osot_representative',

  // ========================================
  // CONTACT (2 fields)
  // ========================================

  /**
   * Organization email
   * Required field (max 255 chars)
   * Format: email
   * Example: "info@osot.on.ca"
   */
  ORGANIZATION_EMAIL: 'osot_organization_email',

  /**
   * Organization phone
   * Required field (max 14 chars)
   * Format: Canadian phone number
   * Example: "+1-416-555-0100"
   */
  ORGANIZATION_PHONE: 'osot_organization_phone',

  // ========================================
  // ACCESS CONTROL (2 fields)
  // ========================================

  /**
   * Privilege level
   * Optional field (Choice - global)
   * Maps to Privilege enum
   * Default: Main
   */
  PRIVILEGE: 'osot_privilege',

  /**
   * Access modifier
   * Optional field (Choice - global)
   * Maps to AccessModifier enum
   * Default: Private
   */
  ACCESS_MODIFIER: 'osot_access_modifier',

  // ========================================
  // SYSTEM FIELDS (3 fields)
  // ========================================

  /**
   * Created on date
   * System field (datetime)
   * Automatically set by Dataverse
   */
  CREATED_ON: 'createdon',

  /**
   * Modified on date
   * System field (datetime)
   * Automatically updated by Dataverse
   */
  MODIFIED_ON: 'modifiedon',

  /**
   * Owner ID
   * System field (GUID)
   * Dataverse owner reference
   */
  OWNER_ID: 'ownerid',

  // ========================================
  // RELATIONSHIP FIELDS
  // ========================================

  /**
   * Address lookup GUID value
   * Lookup to Table_Address
   * 1:1 relationship with Address entity
   */
  ADDRESS_ID: '_osot_table_address_value',
} as const;

/**
 * OData query building helpers
 */
export const ORGANIZATION_ODATA_QUERIES = {
  /**
   * Basic select fields for list views
   * Minimal fields for performance
   */
  SELECT_BASIC: [
    ORGANIZATION_ODATA.ORGANIZATION_ID,
    ORGANIZATION_ODATA.ORGANIZATION_NAME,
    ORGANIZATION_ODATA.ACRONYM,
    ORGANIZATION_ODATA.SLUG,
    ORGANIZATION_ODATA.ORGANIZATION_STATUS,
    ORGANIZATION_ODATA.ORGANIZATION_LOGO,
  ].join(','),

  /**
   * Public fields for branding (used in login page)
   * Fields safe to expose without authentication
   *
   * IMPORTANT: Must include all required fields expected by toInternal() mapper:
   * - osot_organization_name, osot_legal_name, osot_slug
   * - osot_organization_logo, osot_organization_website
   * - osot_representative, osot_organization_email, osot_organization_phone
   */
  SELECT_PUBLIC: [
    ORGANIZATION_ODATA.TABLE_ORGANIZATION_ID,
    ORGANIZATION_ODATA.ORGANIZATION_ID,
    ORGANIZATION_ODATA.ORGANIZATION_NAME,
    ORGANIZATION_ODATA.LEGAL_NAME,
    ORGANIZATION_ODATA.ACRONYM,
    ORGANIZATION_ODATA.SLUG,
    ORGANIZATION_ODATA.ORGANIZATION_STATUS,
    ORGANIZATION_ODATA.ORGANIZATION_LOGO,
    ORGANIZATION_ODATA.ORGANIZATION_WEBSITE,
    ORGANIZATION_ODATA.REPRESENTATIVE,
    ORGANIZATION_ODATA.ORGANIZATION_EMAIL,
    ORGANIZATION_ODATA.ORGANIZATION_PHONE,
  ].join(','),

  /**
   * Complete select for detail views
   * All fields except system fields
   */
  SELECT_COMPLETE: [
    ORGANIZATION_ODATA.TABLE_ORGANIZATION_ID,
    ORGANIZATION_ODATA.ORGANIZATION_ID,
    ORGANIZATION_ODATA.ORGANIZATION_NAME,
    ORGANIZATION_ODATA.LEGAL_NAME,
    ORGANIZATION_ODATA.ACRONYM,
    ORGANIZATION_ODATA.SLUG,
    ORGANIZATION_ODATA.ORGANIZATION_STATUS,
    ORGANIZATION_ODATA.ORGANIZATION_LOGO,
    ORGANIZATION_ODATA.ORGANIZATION_WEBSITE,
    ORGANIZATION_ODATA.REPRESENTATIVE,
    ORGANIZATION_ODATA.ORGANIZATION_EMAIL,
    ORGANIZATION_ODATA.ORGANIZATION_PHONE,
    ORGANIZATION_ODATA.PRIVILEGE,
    ORGANIZATION_ODATA.ACCESS_MODIFIER,
    ORGANIZATION_ODATA.ADDRESS_ID,
    ORGANIZATION_ODATA.CREATED_ON,
    ORGANIZATION_ODATA.MODIFIED_ON,
  ].join(','),
} as const;

/**
 * Common OData filters
 */
export const ORGANIZATION_ODATA_FILTERS = {
  /**
   * Filter by slug (for public lookup)
   */
  bySlug: (slug: string) =>
    `${ORGANIZATION_ODATA.SLUG} eq '${slug.toLowerCase()}'`,

  /**
   * Filter by status
   */
  byStatus: (status: number) =>
    `${ORGANIZATION_ODATA.ORGANIZATION_STATUS} eq ${status}`,

  /**
   * Filter active organizations only
   * Assumes Active = 1 (will be defined in enum)
   */
  activeOnly: () => `${ORGANIZATION_ODATA.ORGANIZATION_STATUS} eq 1`,

  /**
   * Filter by organization ID (for lookups)
   */
  byId: (id: string) => `${ORGANIZATION_ODATA.TABLE_ORGANIZATION_ID} eq ${id}`,
} as const;

/**
 * OData order by options
 */
export const ORGANIZATION_ODATA_ORDERBY = {
  /**
   * Order by name ascending
   */
  nameAsc: `${ORGANIZATION_ODATA.ORGANIZATION_NAME} asc`,

  /**
   * Order by name descending
   */
  nameDesc: `${ORGANIZATION_ODATA.ORGANIZATION_NAME} desc`,

  /**
   * Order by created date descending (newest first)
   */
  newestFirst: `${ORGANIZATION_ODATA.CREATED_ON} desc`,

  /**
   * Order by created date ascending (oldest first)
   */
  oldestFirst: `${ORGANIZATION_ODATA.CREATED_ON} asc`,
} as const;
