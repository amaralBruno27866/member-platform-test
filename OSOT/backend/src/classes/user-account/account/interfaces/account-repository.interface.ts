/**
 * Interface for Account repository operations.
 * Defines the contract for data access layer operations.
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - integrations: Uses DataverseService for data operations
 * - errors: Returns structured error handling
 * - interfaces: Works with AccountInternal and AccountDataverse
 *
 * BUSINESS OPERATIONS:
 * - Essential CRUD operations for account management
 * - Authentication and authorization support
 * - Account lookup and search capabilities
 * - Bulk operations for administrative functions
 * - Security-focused operations (password, email verification)
 *
 * SECURITY CONSIDERATIONS:
 * - Password operations are separate and secured
 * - Email and phone uniqueness validation
 * - Permission-based access control
 * - Audit trail support through system fields
 */

import {
  AccountInternal,
  AccountInternalCreate,
} from './account-internal.interface';
import { AccountGroup, AccountStatus } from '../../../../common/enums';

export interface AccountRepository {
  // ========================================
  // CORE CRUD OPERATIONS
  // ========================================

  /**
   * Create a new account record
   * @param accountData - Account data for creation
   * @returns Promise<AccountInternal> - Created account (without password)
   */
  create(accountData: AccountInternalCreate): Promise<AccountInternal>;

  /**
   * Find account by ID (GUID)
   * @param accountId - Account GUID
   * @returns Promise<AccountInternal | null> - Account without password
   */
  findById(accountId: string): Promise<AccountInternal | null>;

  /**
   * Find account by business ID (osot-0000001)
   * @param businessId - Account business ID
   * @param organizationGuid - Optional organization GUID for multi-tenant isolation
   * @returns Promise<AccountInternal | null> - Account without password
   */
  findByBusinessId(
    businessId: string,
    organizationGuid?: string,
  ): Promise<AccountInternal | null>;

  /**
   * Update account by ID
   * @param accountId - Account GUID
   * @param updateData - Partial account data for update
   * @param userRole - Optional user role for permission checking
   * @returns Promise<AccountInternal> - Updated account (without password)
   */
  update(
    accountId: string,
    updateData: Partial<AccountInternal>,
    userRole?: string,
  ): Promise<AccountInternal>;

  /**
   * Delete account by ID (soft delete - mark as inactive)
   * @param accountId - Account GUID
   * @param userRole - Optional user role for permission checking
   * @returns Promise<boolean> - Success status
   */
  delete(accountId: string, userRole?: string): Promise<boolean>;

  // ========================================
  // AUTHENTICATION OPERATIONS
  // ========================================

  /**
   * Find account by email (general lookup without password)
   * @param email - Email address
   * @param organizationGuid - Optional organization GUID for multi-tenant isolation
   * @returns Promise<AccountInternal | null> - Account WITHOUT password
   */
  findByEmail(
    email: string,
    organizationGuid?: string,
  ): Promise<AccountInternal | null>;

  /**
   * Find account by email for authentication
   * @param email - Email address
   * @param organizationGuid - Optional organization GUID for multi-tenant isolation
   * @returns Promise<AccountInternal | null> - Account WITH password for auth
   */
  findByEmailForAuth(
    email: string,
    organizationGuid?: string,
  ): Promise<AccountInternal | null>;

  /**
   * Find account by phone number (general lookup without password)
   * @param phone - Phone number
   * @param organizationGuid - Optional organization GUID for multi-tenant isolation
   * @returns Promise<AccountInternal | null> - Account WITHOUT password
   */
  findByPhone(
    phone: string,
    organizationGuid?: string,
  ): Promise<AccountInternal | null>;

  /**
   * Find account by phone for authentication
   * @param phone - Phone number
   * @returns Promise<AccountInternal | null> - Account WITH password for auth
   */
  findByPhoneForAuth(phone: string): Promise<AccountInternal | null>;

  /**
   * Update password by account ID
   * @param accountId - Account GUID
   * @param hashedPassword - New hashed password
   * @returns Promise<boolean> - Success status
   */
  updatePassword(accountId: string, hashedPassword: string): Promise<boolean>;

  // ========================================
  // UNIQUENESS VALIDATION
  // ========================================

  /**
   * Check if email exists (for uniqueness validation)
   * @param email - Email address to check
   * @param excludeAccountId - Optional account ID to exclude from check
   * @returns Promise<boolean> - True if email exists
   */
  existsByEmail(email: string, excludeAccountId?: string): Promise<boolean>;

  /**
   * Check if phone exists (for uniqueness validation)
   * @param phone - Phone number to check
   * @param excludeAccountId - Optional account ID to exclude from check
   * @returns Promise<boolean> - True if phone exists
   */
  existsByPhone(phone: string, excludeAccountId?: string): Promise<boolean>;

  // ========================================
  // SEARCH AND FILTERING
  // ========================================

  /**
   * Find accounts with pagination and filtering
   * @param options - Search and filter options
   * @returns Promise<{ accounts: AccountInternal[]; total: number }> - Paginated results
   */
  findMany(options: AccountSearchOptions): Promise<{
    accounts: AccountInternal[];
    total: number;
  }>;

  /**
   * Find accounts by group
   * @param accountGroup - Account group to filter by
   * @param options - Optional pagination and sorting
   * @returns Promise<AccountInternal[]> - Accounts in group
   */
  findByGroup(
    accountGroup: AccountGroup,
    options?: AccountSearchOptions,
  ): Promise<AccountInternal[]>;

  /**
   * Find accounts by status
   * @param accountStatus - Account status to filter by
   * @param options - Optional pagination and sorting
   * @returns Promise<AccountInternal[]> - Accounts with status
   */
  findByStatus(
    accountStatus: AccountStatus,
    options?: AccountSearchOptions,
  ): Promise<AccountInternal[]>;

  /**
   * Find active accounts (account_status = ACTIVE)
   * @param limit - Optional limit for number of results
   * @returns Promise<AccountInternal[]> - Active accounts
   */
  findActiveAccounts(limit?: number): Promise<AccountInternal[]>;

  /**
   * Find pending accounts (for admin approval)
   * @param limit - Optional limit for number of results
   * @returns Promise<AccountInternal[]> - Pending accounts
   */
  findPendingAccounts(limit?: number): Promise<AccountInternal[]>;

  /**
   * Search accounts by name (first or last name)
   * @param searchTerm - Name to search for
   * @param limit - Optional limit for number of results
   * @returns Promise<AccountInternal[]> - Matching accounts
   */
  searchByName(searchTerm: string, limit?: number): Promise<AccountInternal[]>;

  // ========================================
  // BULK OPERATIONS
  // ========================================

  /**
   * Create multiple accounts (bulk import)
   * @param accountData - Array of account data for creation
   * @returns Promise<AccountInternal[]> - Created accounts
   */
  createMany(accountData: AccountInternalCreate[]): Promise<AccountInternal[]>;

  /**
   * Update account status for multiple accounts
   * @param accountIds - Array of account GUIDs
   * @param status - New status to set
   * @returns Promise<number> - Number of updated accounts
   */
  updateStatusMany(
    accountIds: string[],
    status: AccountStatus,
  ): Promise<number>;

  // ========================================
  // STATISTICAL OPERATIONS
  // ========================================

  /**
   * Get account statistics
   * @returns Promise<AccountStatistics> - Account statistics
   */
  getStatistics(): Promise<AccountStatistics>;

  /**
   * Count accounts by group
   * @returns Promise<Record<AccountGroup, number>> - Count by group
   */
  countByGroup(): Promise<Record<AccountGroup, number>>;

  /**
   * Count accounts by status
   * @returns Promise<Record<AccountStatus, number>> - Count by status
   */
  countByStatus(): Promise<Record<AccountStatus, number>>;
}

// ========================================
// SUPPORTING INTERFACES
// ========================================

/**
 * Search options for account queries
 */
export interface AccountSearchOptions {
  /** Search by first name (partial match) */
  firstName?: string;

  /** Search by last name (partial match) */
  lastName?: string;

  /** Search by email (exact match) */
  email?: string;

  /** Search by phone (exact match) */
  phone?: string;

  /** Filter by account group */
  accountGroup?: AccountGroup;

  /** Filter by account status */
  accountStatus?: AccountStatus;

  /** Filter by active member status */
  activeMember?: boolean;

  /** Filter by creation date (from) */
  createdFrom?: string;

  /** Filter by creation date (to) */
  createdTo?: string;

  /** Page number (1-based) */
  page?: number;

  /** Number of items per page */
  limit?: number;

  /** Sort by field */
  sortBy?: string;

  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Account statistics interface
 */
export interface AccountStatistics {
  /** Total number of accounts */
  total: number;

  /** Number of active accounts */
  active: number;

  /** Number of inactive accounts */
  inactive: number;

  /** Number of pending accounts */
  pending: number;

  /** Number of active members */
  activeMembers: number;

  /** Breakdown by account group */
  byGroup: Record<AccountGroup, number>;

  /** Recent registrations (last 30 days) */
  recentRegistrations: number;

  /** Accounts created today */
  createdToday: number;

  /** Last updated timestamp */
  lastUpdated: string;
}

/**
 * Dependency Injection Token for Account Repository
 * Enables NestJS dependency injection of the AccountRepository interface
 * Using string token for better TypeScript type inference
 */
export const ACCOUNT_REPOSITORY = 'ACCOUNT_REPOSITORY' as const;
