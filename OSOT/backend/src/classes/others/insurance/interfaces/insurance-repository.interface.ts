/**
 * Insurance Repository Interface
 *
 * Contract for Insurance data access layer.
 * Defines all methods for interacting with Insurance entity in Dataverse.
 *
 * Responsibilities:
 * - CRUD operations (Create, Read, Update, Delete)
 * - Query operations (Find, Search, Filter)
 * - Existence checks
 * - Count operations
 * - Status-based queries (active, expired, etc.)
 *
 * All methods return InsuranceInternal objects (not Dataverse-specific).
 * Repository implementations handle the transformation from Dataverse to Internal.
 *
 * IMPORTANT NOTES:
 * - Insurance certificates are mostly immutable after creation (21 snapshot fields)
 * - Only status, endorsements, and access control can be updated
 * - Delete operations are soft deletes (status = CANCELLED)
 * - Multi-tenant filtering by organizationGuid is mandatory
 * - All lookup relationships (Organization, Order, Account) are immutable
 */

import { InsuranceInternal } from './insurance-internal.interface';

/**
 * Insurance Repository contract
 */
export interface InsuranceRepository {
  // ========================================
  // CRUD OPERATIONS
  // ========================================

  /**
   * Create a new insurance certificate
   *
   * Business Rules:
   * - All snapshot fields must be provided at creation
   * - Relationships (organizationGuid, orderGuid, accountGuid) are required and immutable
   * - Status defaults to PENDING
   * - Declaration must be true
   *
   * @param insurance - Insurance data (without IDs - auto-generated)
   * @param operationId - Operation tracking ID
   * @returns Created insurance with generated IDs (osot_table_insuranceid, osot_insuranceid)
   */
  create(
    insurance: Omit<
      InsuranceInternal,
      'osot_table_insuranceid' | 'osot_insuranceid'
    >,
    operationId?: string,
  ): Promise<InsuranceInternal>;

  /**
   * Update existing insurance certificate
   *
   * Mutable Fields ONLY:
   * - osot_insurance_status (lifecycle state changes)
   * - osot_endorsement_description (policy amendments)
   * - osot_endorsement_effective_date (endorsement start date)
   * - osot_privilege (access level)
   * - osot_access_modifiers (access control)
   *
   * Immutable Fields (will be ignored if included):
   * - All snapshot fields (21 fields: account, address, insurance details)
   * - Relationship fields (organizationGuid, orderGuid, accountGuid)
   * - System fields (createdon, modifiedon)
   *
   * @param id - Insurance GUID (osot_table_insuranceid)
   * @param updates - Partial insurance data to update (only mutable fields)
   * @param organizationGuid - Organization context (multi-tenant security)
   * @param operationId - Operation tracking ID
   * @returns Updated insurance
   */
  update(
    id: string,
    updates: Partial<InsuranceInternal>,
    organizationGuid: string,
    operationId?: string,
  ): Promise<InsuranceInternal>;

  /**
   * Delete insurance (soft delete - mark as CANCELLED)
   *
   * Business Rule: Insurance cannot be permanently deleted (audit/compliance requirement)
   * Soft delete sets status to CANCELLED but preserves all data
   *
   * @param id - Insurance GUID (osot_table_insuranceid)
   * @param organizationGuid - Organization context (multi-tenant security)
   * @param operationId - Operation tracking ID
   * @returns True if deleted successfully
   */
  delete(
    id: string,
    organizationGuid: string,
    operationId?: string,
  ): Promise<boolean>;

  /**
   * Hard delete insurance (permanent removal)
   *
   * WARNING: Use with extreme caution - irreversible operation
   * Should only be used by Main app for data cleanup/GDPR compliance
   * Not recommended for regular operations due to audit trail requirements
   *
   * @param id - Insurance GUID (osot_table_insuranceid)
   * @param operationId - Operation tracking ID
   * @returns True if deleted successfully
   */
  hardDelete(id: string, operationId?: string): Promise<boolean>;

  // ========================================
  // FIND OPERATIONS (Single Record)
  // ========================================

  /**
   * Find insurance by internal ID (GUID)
   *
   * @param id - Insurance GUID (osot_table_insuranceid)
   * @param organizationGuid - Organization context (multi-tenant filter)
   * @param operationId - Operation tracking ID
   * @returns Insurance or null if not found
   */
  findById(
    id: string,
    organizationGuid: string,
    operationId?: string,
  ): Promise<InsuranceInternal | null>;

  /**
   * Find insurance by business ID (Autonumber)
   *
   * @param insuranceNumber - Business insurance number (osot_insuranceid, e.g., "osot-ins-0000001")
   * @param organizationGuid - Organization context (multi-tenant filter)
   * @param operationId - Operation tracking ID
   * @returns Insurance or null if not found
   */
  findByInsuranceNumber(
    insuranceNumber: string,
    organizationGuid: string,
    operationId?: string,
  ): Promise<InsuranceInternal | null>;

  /**
   * Find insurance by certificate number
   *
   * Business Use: Lookup insurance by the snapshot certificate ID
   * Example: osot_certificate = "osot-acct-0000123"
   *
   * @param certificateNumber - Certificate ID from account snapshot
   * @param organizationGuid - Organization context (multi-tenant filter)
   * @param operationId - Operation tracking ID
   * @returns Insurance or null if not found
   */
  findByCertificateNumber(
    certificateNumber: string,
    organizationGuid: string,
    operationId?: string,
  ): Promise<InsuranceInternal | null>;

  // ========================================
  // FIND OPERATIONS (Multiple Records)
  // ========================================

  /**
   * Find all insurance certificates matching filters
   *
   * Supported filters:
   * - insuranceStatus: Filter by status (DRAFT, PENDING, ACTIVE, EXPIRED, CANCELLED)
   * - insuranceType: Filter by coverage type (Professional, General, etc.)
   * - accountGuid: Filter by insured person (accountGuid from snapshot)
   * - orderGuid: Filter by parent order
   * - effectiveDateFrom: Filter by effective date >= value
   * - effectiveDateTo: Filter by effective date <= value
   * - expiryDateFrom: Filter by expiry date >= value
   * - expiryDateTo: Filter by expiry date <= value
   * - skip: Pagination offset
   * - top: Page size (max records to return)
   * - orderBy: Sort field (createdOn, effectiveDate, expiryDate)
   * - sortDirection: Sort direction ('asc' or 'desc')
   *
   * @param filters - Query filters
   * @param organizationGuid - Organization context (multi-tenant filter)
   * @param operationId - Operation tracking ID
   * @returns Array of insurance certificates
   */
  findAll(
    filters: Record<string, any>,
    organizationGuid: string,
    operationId?: string,
  ): Promise<InsuranceInternal[]>;

  /**
   * Find all insurance certificates for a specific account
   *
   * @param accountGuid - Account GUID (insured person)
   * @param organizationGuid - Organization context (multi-tenant filter)
   * @param operationId - Operation tracking ID
   * @returns Array of insurance certificates
   */
  findByAccount(
    accountGuid: string,
    organizationGuid: string,
    operationId?: string,
  ): Promise<InsuranceInternal[]>;

  /**
   * Find all insurance certificates for a specific order
   *
   * Business Use: List all insurance products purchased in a single order
   *
   * @param orderGuid - Order GUID (parent order)
   * @param organizationGuid - Organization context (multi-tenant filter)
   * @param operationId - Operation tracking ID
   * @returns Array of insurance certificates
   */
  findByOrder(
    orderGuid: string,
    organizationGuid: string,
    operationId?: string,
  ): Promise<InsuranceInternal[]>;

  /**
   * Find all active insurance certificates
   *
   * Business Use: List currently active coverage for reporting/compliance
   * Active = status is ACTIVE and effectiveDate <= today and expiryDate > today
   *
   * @param organizationGuid - Organization context (multi-tenant filter)
   * @param operationId - Operation tracking ID
   * @returns Array of active insurance certificates
   */
  findActive(
    organizationGuid: string,
    operationId?: string,
  ): Promise<InsuranceInternal[]>;

  /**
   * Find all expired insurance certificates
   *
   * Business Use: Identify certificates requiring renewal
   * Expired = expiryDate <= today (regardless of status)
   *
   * @param organizationGuid - Organization context (multi-tenant filter)
   * @param operationId - Operation tracking ID
   * @returns Array of expired insurance certificates
   */
  findExpired(
    organizationGuid: string,
    operationId?: string,
  ): Promise<InsuranceInternal[]>;

  /**
   * Find insurance certificates expiring soon (within days)
   *
   * Business Use: Proactive renewal notifications
   * Example: findExpiringSoon(30) returns all expiring in next 30 days
   *
   * @param days - Number of days to look ahead (default: 30)
   * @param organizationGuid - Organization context (multi-tenant filter)
   * @param operationId - Operation tracking ID
   * @returns Array of insurance certificates expiring soon
   */
  findExpiringSoon(
    days: number,
    organizationGuid: string,
    operationId?: string,
  ): Promise<InsuranceInternal[]>;

  /**
   * Find all insurance certificates created in the last 24 hours
   *
   * Business Use: Daily report generation for admin review
   * Returns all insurances created/modified in the last 24 hours (not filtered by status)
   *
   * @param organizationGuid - Organization context (multi-tenant filter)
   * @param fromDate - Start of 24-hour window (ISO string)
   * @param operationId - Operation tracking ID
   * @returns Array of insurance certificates created in last 24h
   */
  findLast24Hours(
    organizationGuid: string,
    fromDate: Date,
    operationId?: string,
  ): Promise<InsuranceInternal[]>;

  // ========================================
  // VALIDATION & CHECK OPERATIONS
  // ========================================

  /**
   * Check if insurance exists by ID
   *
   * @param id - Insurance GUID (osot_table_insuranceid)
   * @param organizationGuid - Organization context (multi-tenant filter)
   * @param operationId - Operation tracking ID
   * @returns True if exists
   */
  exists(
    id: string,
    organizationGuid: string,
    operationId?: string,
  ): Promise<boolean>;

  /**
   * Count insurance certificates matching filters
   *
   * @param filters - Query filters (same as findAll)
   * @param organizationGuid - Organization context (multi-tenant filter)
   * @param operationId - Operation tracking ID
   * @returns Count of matching records
   */
  count(
    filters: Record<string, any>,
    organizationGuid: string,
    operationId?: string,
  ): Promise<number>;

  /**
   * Count active insurance certificates
   *
   * @param organizationGuid - Organization context (multi-tenant filter)
   * @param operationId - Operation tracking ID
   * @returns Count of active certificates
   */
  countActive(organizationGuid: string, operationId?: string): Promise<number>;

  /**
   * Check if account has active insurance
   *
   * Business Use: Verify coverage before providing services
   *
   * @param accountGuid - Account GUID (insured person)
   * @param organizationGuid - Organization context (multi-tenant filter)
   * @param operationId - Operation tracking ID
   * @returns True if account has at least one active insurance
   */
  hasActiveInsurance(
    accountGuid: string,
    organizationGuid: string,
    operationId?: string,
  ): Promise<boolean>;
}

/**
 * Dependency injection token for Insurance Repository
 */
export const INSURANCE_REPOSITORY = 'INSURANCE_REPOSITORY' as const;
