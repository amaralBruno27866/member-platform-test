import { ManagementInternal } from './management-internal.interface';

/**
 * Management Repository Interface
 *
 * Defines the contract for management data access operations following the Repository Pattern.
 * This interface abstracts data access operations and provides a clean contract for
 * dependency injection across the management module.
 *
 * ENTERPRISE FEATURES:
 * - Repository Pattern: Clean data access abstraction
 * - Dependency Injection: Injectable via MANAGEMENT_REPOSITORY token
 * - Type Safety: Full TypeScript support for all operations
 * - CRUD Operations: Complete Create, Read, Update, Delete functionality
 * - Administrative Queries: Business permission and flag-based search capabilities
 * - Search Operations: Multi-criteria management discovery and analytics
 *
 * BUSINESS OPERATIONS:
 * - Account-based Management: Multi-tenant account management organization
 * - Business ID Lookups: Integration with external business systems
 * - Flag-based Analysis: Vendor, recruitment, and service tracking
 * - Lifecycle Management: Account status and retirement tracking
 * - Permission Operations: Administrative access and privilege management
 *
 * @interface ManagementRepository
 * @follows Repository Pattern, Dependency Injection
 * @author OSOT Development Team
 * @version 1.0.0 - Management Repository Standard
 */
export interface ManagementRepository {
  /**
   * Create a new management record
   */
  create(
    internal: Partial<ManagementInternal>,
  ): Promise<Record<string, unknown>>;

  /**
   * Find management by GUID identifier
   */
  findByGuid(guid: string): Promise<Record<string, unknown> | undefined>;

  /**
   * Update management by GUID with new data
   */
  updateByGuid(
    guid: string,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;

  /**
   * Delete management by GUID
   */
  deleteByGuid(guid: string): Promise<void>;

  /**
   * Find all management records associated with an account
   */
  findByAccountId(accountId: string): Promise<Record<string, unknown>[]>;

  /**
   * Find specific management by business ID
   */
  findByBusinessId(
    businessId: string,
  ): Promise<Record<string, unknown> | undefined>;

  /**
   * Advanced multi-criteria management search with flags and permissions
   */
  search(criteria: {
    accountId?: string;
    lifeMemberRetired?: boolean;
    shadowing?: boolean;
    passedAway?: boolean;
    vendor?: boolean;
    advertising?: boolean;
    recruitment?: boolean;
    driverRehab?: boolean;
    accessModifiers?: number[];
    privilege?: number[];
    limit?: number;
  }): Promise<{
    results: Record<string, unknown>[];
    totalCount: number;
  }>;

  /**
   * Find management records by vendor status
   */
  findVendors(includeInactive?: boolean): Promise<Record<string, unknown>[]>;

  /**
   * Find management records by recruitment permission
   */
  findRecruitmentEnabled(): Promise<Record<string, unknown>[]>;

  /**
   * Find management records offering shadowing services
   */
  findShadowingAvailable(): Promise<Record<string, unknown>[]>;

  /**
   * Find life members (retired or active)
   */
  findLifeMembers(retiredOnly?: boolean): Promise<Record<string, unknown>[]>;

  /**
   * Find records by administrative privilege level
   */
  findByPrivilege(privilege: number): Promise<Record<string, unknown>[]>;

  /**
   * Get comprehensive management statistics for an account
   */
  getManagementStatistics(accountId: string): Promise<{
    total: number;
    flags: {
      lifeMemberRetired: number;
      shadowing: number;
      vendor: number;
      advertising: number;
      recruitment: number;
      driverRehab: number;
      passedAway: number;
    };
    permissions: {
      privilegeDistribution: Record<string, number>;
      accessModifierDistribution: Record<string, number>;
    };
    business: {
      activeVendors: number;
      recruitmentPartners: number;
      shadowingProviders: number;
      advertisingPartners: number;
    };
  }>;

  /**
   * Get system-wide management analytics
   */
  getSystemAnalytics(): Promise<{
    totalManagementRecords: number;
    flagAnalytics: {
      vendors: { total: number; active: number };
      recruitment: { total: number; active: number };
      shadowing: { total: number; available: number };
      lifeMembers: { total: number; retired: number };
      deceased: number;
    };
    privilegeAnalytics: {
      owners: number;
      admins: number;
      mainUsers: number;
    };
    businessMetrics: {
      businessPartnerships: number;
      serviceProviders: number;
      advertisingReach: number;
    };
  }>;

  /**
   * Bulk operations for administrative efficiency
   */
  bulkUpdate(
    criteria: Record<string, unknown>,
    updateData: Record<string, unknown>,
  ): Promise<{ updatedCount: number }>;

  /**
   * Business rule validation operations
   */
  validateBusinessRules(managementData: Record<string, unknown>): Promise<{
    isValid: boolean;
    violations: string[];
    warnings: string[];
  }>;

  /**
   * Find conflicting management configurations
   */
  findConflicts(): Promise<{
    mutualExclusivity: Record<string, unknown>[];
    lifecycleViolations: Record<string, unknown>[];
    businessRuleViolations: Record<string, unknown>[];
  }>;

  /**
   * Account lifecycle management
   */
  deactivateAccount(
    businessId: string,
    reason: 'passed_away' | 'retired' | 'suspended',
  ): Promise<void>;

  /**
   * Reactivate previously deactivated account
   */
  reactivateAccount(businessId: string): Promise<void>;

  /**
   * Administrative audit operations
   */
  getAuditTrail(
    businessId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<{
    changes: {
      timestamp: string;
      field: string;
      oldValue: unknown;
      newValue: unknown;
      changedBy: string;
    }[];
  }>;
}

/**
 * Dependency Injection Token for Management Repository
 * Used for injecting repository implementations in services
 */
export const MANAGEMENT_REPOSITORY = 'MANAGEMENT_REPOSITORY' as const;

/**
 * Type alias for repository injection
 */
export type ManagementRepositoryType = ManagementRepository;

/**
 * Usage Examples:
 *
 * @example Basic CRUD Operations:
 * ```ts
 * // Create new management record
 * const management = await repo.create({
 *   osot_user_business_id: 'user-123',
 *   osot_vendor: true,
 *   osot_access_modifiers: 2, // Protected
 * });
 *
 * // Find by business ID
 * const found = await repo.findByBusinessId('user-123');
 *
 * // Update permissions
 * await repo.updateByGuid(management.id, {
 *   osot_recruitment: true,
 *   osot_advertising: false,
 * });
 * ```
 *
 * @example Advanced Search Operations:
 * ```ts
 * // Find active vendors
 * const vendors = await repo.search({
 *   vendor: true,
 *   passedAway: false,
 *   limit: 50,
 * });
 *
 * // Find recruitment partners
 * const recruiters = await repo.findRecruitmentEnabled();
 *
 * // Get business analytics
 * const stats = await repo.getSystemAnalytics();
 * ```
 *
 * @example Business Rule Validation:
 * ```ts
 * // Validate before update
 * const validation = await repo.validateBusinessRules({
 *   osot_vendor: true,
 *   osot_recruitment: true, // Should fail - vendors can't recruit
 * });
 *
 * if (!validation.isValid) {
 *   throw new Error(validation.violations.join(', '));
 * }
 * ```
 */
