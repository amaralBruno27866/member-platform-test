/**
 * Insurance Dataverse Interface
 *
 * Dataverse API representation of Insurance entity (OData format).
 * Matches the exact field names and types returned by Dataverse API.
 *
 * Architecture Notes:
 * - snake_case naming (Dataverse convention)
 * - All fields optional (partial updates supported)
 * - Dates are ISO 8601 strings (not Date objects)
 * - Currency fields are numbers (Dataverse precision: 2 decimals)
 * - _osot_table_organization_value, _osot_table_order_value, _osot_table_account_value are lookup GUIDs (read-only)
 * - osot_Table_Organization@odata.bind, osot_Table_Order@odata.bind, osot_Table_Account@odata.bind are used for writes
 * - Boolean fields in Dataverse are Yes/No but represented as boolean in JSON
 */

/**
 * Insurance entity - Dataverse API representation
 *
 * Represents an insurance certificate with immutable snapshot of insured person,
 * coverage amount, and related details frozen at time of policy creation.
 * No lookups post-creation - all data frozen for audit/compliance.
 */
export interface InsuranceDataverse {
  // ========================================
  // SYSTEM FIELDS
  // ========================================

  /**
   * Primary key (GUID)
   */
  osot_table_insuranceid?: string;

  /**
   * Autonumber ID (human-readable)
   * Format: osot-ins-0000001
   * Read-only
   */
  osot_insuranceid?: string;

  /**
   * Creation timestamp (ISO 8601 string)
   * Example: '2026-01-23T10:30:00Z'
   */
  createdon?: string;

  /**
   * Modification timestamp (ISO 8601 string)
   */
  modifiedon?: string;

  /**
   * Owner ID (GUID)
   */
  ownerid?: string;

  /**
   * State code (0 = Active, 1 = Inactive)
   */
  statecode?: number;

  /**
   * Status code (detailed status)
   */
  statuscode?: number;

  // ========================================
  // REQUIRED RELATIONSHIP FIELDS (Lookups)
  // ========================================

  /**
   * Organization GUID (read-only lookup value)
   * Retrieved via $select=_osot_table_organization_value
   * For writes, use osot_Table_Organization@odata.bind in payload
   * Example: 'org-guid-123'
   */
  _osot_table_organization_value?: string;

  /**
   * Order GUID (read-only lookup value)
   * Retrieved via $select=_osot_table_order_value
   * For writes, use osot_Table_Order@odata.bind in payload
   * Example: 'order-guid-456'
   */
  _osot_table_order_value?: string;

  /**
   * Account/User GUID (read-only lookup value)
   * Retrieved via $select=_osot_table_account_value
   * For writes, use osot_Table_Account@odata.bind in payload
   * Example: 'account-guid-789'
   */
  _osot_table_account_value?: string;

  /**
   * Organization @odata.bind field name
   * Used for creating/updating organization relationships
   * Format: "/osot_table_organizations(guid)"
   */
  'osot_Table_Organization@odata.bind'?: string;

  /**
   * Order @odata.bind field name
   * Used for creating/updating order relationships
   * Format: "/osot_table_orders(guid)"
   */
  'osot_Table_Order@odata.bind'?: string;

  /**
   * Account @odata.bind field name
   * Used for creating/updating account relationships
   * Format: "/osot_table_accounts(guid)"
   */
  'osot_Table_Account@odata.bind'?: string;

  // ========================================
  // SNAPSHOT FIELDS FROM ACCOUNT/ADDRESS (14 required - IMMUTABLE)
  // ========================================

  /**
   * Account group (copied from table_account)
   * Immutable snapshot of account classification at time of insurance creation
   * Example: 'Individual', 'Organization'
   */
  osot_account_group?: string;

  /**
   * Category (copied from membership_category)
   * Immutable snapshot of membership category
   * Example: 'OT', 'OTA'
   */
  osot_category?: string;

  /**
   * Membership (copied from membership_category)
   * Immutable snapshot of membership type
   * Example: 'Standard', 'Premium'
   */
  osot_membership?: string;

  /**
   * Membership year (academic year) when insurance was purchased
   * Copied from membership_settings.osot_membership_year
   * Format: YYYY (e.g., '2025', '2026')
   * Used for annual expiration logic
   * Example: '2025'
   * Immutable snapshot - frozen at insurance creation
   */
  osot_membership_year?: string;

  /**
   * Certificate ID (copied from table_account.account_id)
   * Immutable snapshot of insured person identifier
   * Used for certificate identification
   */
  osot_certificate?: string;

  /**
   * First name (copied from table_account)
   * Immutable snapshot of insured person's first name
   */
  osot_first_name?: string;

  /**
   * Last name (copied from table_account)
   * Immutable snapshot of insured person's last name
   */
  osot_last_name?: string;

  /**
   * Personal/Corporation name (optional, copied from table_account)
   * Immutable snapshot if provided
   * Example: 'John Smith Inc.'
   */
  osot_personal_corporation?: string;

  /**
   * Address line 1 (copied from table_address)
   * Immutable snapshot of mailing address
   * Required for coverage validation
   */
  osot_address_1?: string;

  /**
   * Address line 2 (optional, copied from table_address)
   * Immutable snapshot if provided
   */
  osot_address_2?: string;

  /**
   * City (copied from table_address)
   * Immutable snapshot of mailing city
   */
  osot_city?: string;

  /**
   * Province (copied from table_address)
   * Immutable snapshot of mailing province
   * Example: 'ON', 'BC', 'QC'
   */
  osot_province?: string;

  /**
   * Postal code (copied from table_address)
   * Immutable snapshot - no formatting, stored as 'K1A0A6'
   * Max 7 characters
   */
  osot_postal_code?: string;

  /**
   * Phone number (copied from table_account.mobile_phone)
   * Immutable snapshot of contact number
   * Max 14 characters
   */
  osot_phone_number?: string;

  /**
   * Email (copied from table_account)
   * Immutable snapshot of contact email
   * Max 255 characters
   */
  osot_email?: string;

  // ========================================
  // INSURANCE DETAILS (6 required, 1 optional - MOSTLY IMMUTABLE)
  // ========================================

  /**
   * Insurance type (copied from product name)
   * Immutable snapshot of product/coverage type
   * Example: 'Professional Liability', 'General Liability'
   */
  osot_insurance_type?: string;

  /**
   * Insurance limit amount (copied from product)
   * Immutable snapshot of coverage limit at purchase time
   * Currency: 0.00 to 922,337,203,685,477.00
   * Example: 50000.00, 100000.00, 250000.00
   */
  osot_insurance_limit?: number;

  /**
   * Insurance price (copied from product selected_price)
   * Immutable snapshot of premium at purchase time
   * Currency: 0.00 to 922,337,203,685,477.00
   * Example: 79.00, 125.50
   */
  osot_insurance_price?: number;

  /**
   * Insurance total (copied from order_product item_total)
   * Immutable snapshot of final amount (price + tax)
   * Currency: 0.00 to 922,337,203,685,477.00
   * Example: 89.27 (79.00 + 10.27 tax)
   */
  osot_total?: number;

  /**
   * Insurance status (Choice field)
   * DRAFT (1), PENDING (2), ACTIVE (3), EXPIRED (4), CANCELLED (5)
   * Mutable - lifecycle-driven state changes
   */
  osot_insurance_status?: number;

  /**
   * Insurance declaration (Yes/No boolean)
   * User declares that all information is true and complete
   * Business required - must be true to activate insurance
   */
  osot_insurance_declaration?: boolean;

  // ========================================
  // DATE FIELDS (2 required, 1 optional)
  // ========================================

  /**
   * Effective date (ISO 8601, copied from order.createdon or explicit date)
   * When coverage starts
   * Example: '2026-01-23T00:00:00Z'
   */
  osot_effective_date?: string;

  /**
   * Expiry date (ISO 8601, copied from membership_settings.year_ends)
   * When coverage ends
   * Example: '2026-12-31T00:00:00Z'
   */
  osot_expires_date?: string;

  /**
   * Endorsement effective date (ISO 8601, optional)
   * When amendment/modification takes effect
   * Null unless endorsement has been applied
   * Example: '2026-06-15T00:00:00Z'
   */
  osot_endorsement_effective_date?: string;

  // ========================================
  // QUESTIONS & ENDORSEMENTS (6 optional)
  // ========================================

  /**
   * Insurance question 1: Allegations of negligence (Yes/No)
   * "In the past, has the Applicant or any of his/her employees ever been the
   * recipient of any allegations of professional negligence in writing or verbally?"
   * Optional - default No
   * High-risk question - Yes answer may trigger manual review
   */
  osot_insurance_question_1?: boolean;

  /**
   * Explanation for question 1 (text area, 4000 chars max)
   * Required if question_1 = Yes
   * Null or empty string if question_1 = No
   */
  osot_insurance_question_1_explain?: string;

  /**
   * Insurance question 2: Insurer cancellation/denial (Yes/No)
   * "Has any insurer ever declined, cancelled or imposed special conditions
   * for any coverage for you or your entity in the past?"
   * Optional - default No
   * High-risk question - Yes answer may trigger manual review
   */
  osot_insurance_question_2?: boolean;

  /**
   * Explanation for question 2 (text area, 4000 chars max)
   * Required if question_2 = Yes
   * Null or empty string if question_2 = No
   */
  osot_insurance_question_2_explain?: string;

  /**
   * Insurance question 3: Awareness of potential claims (Yes/No)
   * "Is the Applicant or any of his/her employees aware of any facts, circumstances
   * or situations which may reasonably give rise to a claim, other than advised above?"
   * Optional - default No
   * High-risk question - Yes answer may trigger manual review
   */
  osot_insurance_question_3?: boolean;

  /**
   * Explanation for question 3 (text area, 4000 chars max)
   * Required if question_3 = Yes
   * Null or empty string if question_3 = No
   */
  osot_insurance_question_3_explain?: string;

  /**
   * Endorsement description (text area, 4000 chars max)
   * Description of policy amendment/modification
   * Admin-only field
   * Null unless endorsement has been added
   */
  osot_endorsement_description?: string;

  // ========================================
  // ACCESS CONTROL (2 optional fields)
  // ========================================

  /**
   * Privilege level (Choice field)
   * Determines access level to insurance data
   * Optional - defaults to Private
   */
  osot_privilege?: number;

  /**
   * Access modifier (Choice field)
   * Determines who can access this insurance
   * Optional - defaults to Private
   */
  osot_access_modifiers?: number;

  // ========================================
  // ODATA METADATA (Read-only)
  // ========================================

  /**
   * OData context (API metadata)
   */
  '@odata.context'?: string;

  /**
   * OData etag (concurrency control)
   */
  '@odata.etag'?: string;
}
