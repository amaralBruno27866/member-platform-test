/**
 * Dataverse-specific interface for Table Account Affiliate
 * Maps exactly to the Dataverse field names and structure
 *
 * PURPOSE:
 * - Used for direct Dataverse API communication
 * - Handles serialization/deserialization from Dataverse responses
 * - Maps to OData entity format returned by Microsoft Dataverse
 *
 * FIELD MAPPING:
 * - Logical names match exactly what Dataverse returns
 * - Choice fields return numeric values aligned with global enums
 * - System fields include Dataverse metadata
 *
 * USAGE:
 * - DataverseService operations (create, read, update, delete)
 * - Direct API responses from Dataverse
 * - Mapping to/from AffiliateInternal interface
 *
 * @author OSOT Development Team
 * @version 1.0.0
 */

export interface AffiliateDataverse {
  // ========================================
  // SYSTEM FIELDS (Dataverse metadata)
  // ========================================

  /** Primary key GUID */
  osot_table_account_affiliateid?: string;

  /** Autonumber field - Business ID */
  osot_affiliate_id?: string;

  /** System creation timestamp */
  createdon?: string;

  /** System modification timestamp */
  modifiedon?: string;

  /** Owner reference */
  ownerid?: string;

  /** Owner lookup value (expanded) */
  _ownerid_value?: string;

  // ========================================
  // ORGANIZATION PROFILE
  // ========================================

  /** Organization name */
  osot_affiliate_name?: string;

  /** Business area (numeric choice value) */
  osot_affiliate_area?: number;

  /** Business area label (when expanded) */
  'osot_affiliate_area@OData.Community.Display.V1.FormattedValue'?: string;

  // ========================================
  // REPRESENTATIVE IDENTITY
  // ========================================

  /** Representative's first name */
  osot_representative_first_name?: string;

  /** Representative's last name */
  osot_representative_last_name?: string;

  /** Representative's job title */
  osot_representative_job_title?: string;

  // ========================================
  // CONTACT INFORMATION
  // ========================================

  /** Primary email address */
  osot_affiliate_email?: string;

  /** Primary phone number */
  osot_affiliate_phone?: string;

  /** Organization website URL */
  osot_affiliate_website?: string;

  // ========================================
  // SOCIAL MEDIA LINKS
  // ========================================

  /** Facebook page URL */
  osot_affiliate_facebook?: string;

  /** Instagram profile URL */
  osot_affiliate_instagram?: string;

  /** TikTok profile URL */
  osot_affiliate_tiktok?: string;

  /** LinkedIn company page URL */
  osot_affiliate_linkedin?: string;

  // ========================================
  // ADDRESS INFORMATION
  // ========================================

  /** Primary address line */
  osot_affiliate_address_1?: string;

  /** Secondary address line */
  osot_affiliate_address_2?: string;

  /** City (numeric choice value) */
  osot_affiliate_city?: number;

  /** City label (when expanded) */
  'osot_affiliate_city@OData.Community.Display.V1.FormattedValue'?: string;

  /** Other city name (optional text field) */
  osot_other_city?: string;

  /** Province (numeric choice value) */
  osot_affiliate_province?: number;

  /** Province label (when expanded) */
  'osot_affiliate_province@OData.Community.Display.V1.FormattedValue'?: string;

  /** Other province/state name (optional text field) */
  osot_other_province_state?: string;

  /** Postal/ZIP code */
  osot_affiliate_postal_code?: string;

  /** Country (numeric choice value) */
  osot_affiliate_country?: number;

  /** Country label (when expanded) */
  'osot_affiliate_country@OData.Community.Display.V1.FormattedValue'?: string;

  // ========================================
  // ACCOUNT & SECURITY
  // ========================================

  /** Encrypted password */
  osot_password?: string;

  /** Account status (numeric choice value) */
  osot_account_status?: number;

  /** Account status label (when expanded) */
  'osot_account_status@OData.Community.Display.V1.FormattedValue'?: string;

  /** Account declaration flag (boolean) */
  osot_account_declaration?: boolean;

  /** Account declaration label (when expanded) */
  'osot_account_declaration@OData.Community.Display.V1.FormattedValue'?: string;

  /** Active membership status (boolean) */
  osot_active_member?: boolean;

  /** Active member label (when expanded) */
  'osot_active_member@OData.Community.Display.V1.FormattedValue'?: string;

  // ========================================
  // ACCESS CONTROL & PERMISSIONS
  // ========================================

  /** Access modifier level (numeric choice value) */
  osot_access_modifiers?: number;

  /** Access modifiers label (when expanded) */
  'osot_access_modifiers@OData.Community.Display.V1.FormattedValue'?: string;

  /** Privilege level (numeric choice value) */
  osot_privilege?: number;

  /** Privilege label (when expanded) */
  'osot_privilege@OData.Community.Display.V1.FormattedValue'?: string;

  // ========================================
  // ODATA SYSTEM ANNOTATIONS
  // ========================================

  /** OData entity tag for concurrency control */
  '@odata.etag'?: string;

  /** OData context information */
  '@odata.context'?: string;

  /** OData type information */
  '@odata.type'?: string;

  /** OData ID reference */
  '@odata.id'?: string;

  /** OData edit link */
  '@odata.editLink'?: string;

  // ========================================
  // EXPANDED LOOKUP FIELDS
  // ========================================

  /** Owner user information (when expanded) */
  owner?: {
    systemuserid: string;
    fullname: string;
    internalemailaddress: string;
  };

  // ========================================
  // CALCULATED/COMPUTED FIELDS
  // ========================================

  /** Full representative name (computed) */
  representative_full_name?: string;

  /** Address summary (computed) */
  address_summary?: string;

  /** Social media links count (computed) */
  social_media_count?: number;
}

// ========================================
// DATAVERSE QUERY INTERFACES
// ========================================

/**
 * Dataverse query options for Affiliate entities
 */
export interface AffiliateDataverseQuery {
  /** OData select clause */
  $select?: string;

  /** OData filter clause */
  $filter?: string;

  /** OData expand clause */
  $expand?: string;

  /** OData orderby clause */
  $orderby?: string;

  /** OData top clause */
  $top?: number;

  /** OData skip clause */
  $skip?: number;

  /** Include count in response */
  $count?: boolean;
}

/**
 * Dataverse collection response for Affiliate queries
 */
export interface AffiliateDataverseCollection {
  /** Collection of affiliate entities */
  value: AffiliateDataverse[];

  /** Total count (when requested) */
  '@odata.count'?: number;

  /** Next page link (for pagination) */
  '@odata.nextLink'?: string;

  /** Context information */
  '@odata.context': string;
}

/**
 * Dataverse error response structure
 */
export interface AffiliateDataverseError {
  error: {
    code: string;
    message: string;
    details?: Array<{
      code: string;
      message: string;
      target?: string;
    }>;
  };
}

// ========================================
// FIELD MAPPING UTILITIES
// ========================================

/**
 * Maps choice field values to their display labels
 */
export interface AffiliateChoiceMapping {
  [key: string]: {
    value: number;
    label: string;
  };
}

/**
 * Dataverse field metadata for Affiliate entity
 */
export interface AffiliateFieldMetadata {
  logicalName: string;
  displayName: string;
  dataType: string;
  isRequired: boolean;
  maxLength?: number;
  choices?: AffiliateChoiceMapping;
}
