import { AccountStatus, Privilege } from '../../common/enums';

/**
 * User Repository Interface - Unified Authentication Abstraction
 *
 * Provides a clean abstraction layer for authentication operations
 * supporting both Account and Affiliate user types with consistent
 * enterprise patterns and security validation.
 *
 * @version 2.0.0 - Enterprise Unified Architecture
 */

// ===============================
// Core Type Definitions
// ===============================

/**
 * Supported user types in the authentication system
 */
export type UserType = 'account' | 'affiliate';

/**
 * Unified user data structure combining both account and affiliate data
 */
export interface UnifiedUserData {
  // Common fields
  id: string;
  email: string;
  password: string;
  status: AccountStatus;
  userType: UserType;

  // Account-specific fields (when userType === 'account')
  osot_account_id?: string;
  osot_first_name?: string;
  osot_last_name?: string;
  osot_privilege?: Privilege;
  osot_date_of_birth?: string;
  osot_mobile_phone?: string;

  // Affiliate-specific fields (when userType === 'affiliate')
  osot_affiliate_id?: string;
  osot_affiliate_name?: string;
  osot_affiliate_email?: string;
  osot_representative_job_title?: string;
  osot_affiliate_phone?: string;
  osot_affiliate_website?: string;
  osot_affiliate_area?: number;
  osot_affiliate_province?: number;
  osot_affiliate_country?: number;
}

/**
 * User lookup result with type information
 */
export interface UserLookupResult {
  user: UnifiedUserData;
  userType: UserType;
  isAffiliate: boolean;
  found: boolean;
}

/**
 * Authentication result with comprehensive context
 */
export interface AuthenticationResult {
  success: boolean;
  user?: UnifiedUserData;
  userType?: UserType;
  userId: string;
  userGuid?: string; // GUID for Dataverse lookups (osot_table_accountid or osot_table_account_affiliateid)
  email: string;
  privilege?: Privilege;
  failureReason?: AuthenticationFailureReason;
  organizationName?: string; // For affiliates
  representativeTitle?: string; // For affiliates
  authenticationTimestamp: string;
}

/**
 * Detailed authentication failure reasons for audit and debugging
 */
export type AuthenticationFailureReason =
  | 'USER_NOT_FOUND'
  | 'INVALID_PASSWORD'
  | 'ACCOUNT_INACTIVE'
  | 'ACCOUNT_PENDING'
  | 'INSUFFICIENT_PRIVILEGES'
  | 'REPRESENTATIVE_UNAUTHORIZED'
  | 'PASSWORD_NOT_CONFIGURED'
  | 'SECURITY_RESTRICTIONS'
  | 'DATA_INCOMPLETE'
  | 'VALIDATION_FAILED'
  | 'UNKNOWN_ERROR';

/**
 * Password reset result with user type context
 */
export interface PasswordResetResult {
  tokenSent: boolean;
  email: string;
  userType: UserType;
  expiresIn: number; // minutes
  organizationName?: string; // For affiliates
}

// ===============================
// Repository Interface
// ===============================

/**
 * Unified User Repository Interface
 *
 * Provides consistent authentication operations across different user types
 * while maintaining type safety and enterprise security patterns.
 */
export interface UserRepository {
  /**
   * Find user by email across all user types
   * @param email - User email address
   * @returns Promise<UnifiedUserData> - User data with type information
   */
  findByEmail(email: string): Promise<UnifiedUserData>;

  /**
   * Validate user credentials with comprehensive business rules
   * @param email - User email address
   * @param password - Plain text password
   * @returns Promise<AuthenticationResult> - Authentication result with context
   */
  validateCredentials(
    email: string,
    password: string,
  ): Promise<AuthenticationResult>;

  /**
   * Determine user type by email lookup
   * @param email - User email address
   * @returns Promise<UserLookupResult> - User type and existence information
   */
  getUserType(email: string): Promise<UserLookupResult>;

  /**
   * Request password reset with user type-specific handling
   * @param email - User email address
   * @returns Promise<PasswordResetResult> - Reset token information
   */
  requestPasswordReset(email: string): Promise<PasswordResetResult>;

  /**
   * Find account-specific user data
   * @param email - Account email address
   * @returns Promise<UnifiedUserData> - Account user data
   */
  findAccountByEmail(email: string): Promise<UnifiedUserData>;

  /**
   * Find affiliate-specific user data
   * @param email - Affiliate email address
   * @returns Promise<UnifiedUserData> - Affiliate user data
   */
  findAffiliateByEmail(email: string): Promise<UnifiedUserData>;

  /**
   * Validate account credentials with account-specific business rules
   * @param email - Account email address
   * @param password - Plain text password
   * @returns Promise<AuthenticationResult> - Account authentication result
   */
  validateAccountCredentials(
    email: string,
    password: string,
  ): Promise<AuthenticationResult>;

  /**
   * Validate affiliate credentials with organization-specific business rules
   * @param email - Affiliate email address
   * @param password - Plain text password
   * @returns Promise<AuthenticationResult> - Affiliate authentication result
   */
  validateAffiliateCredentials(
    email: string,
    password: string,
  ): Promise<AuthenticationResult>;
}

// ===============================
// Service Dependencies
// ===============================

/**
 * Authentication service dependencies for dependency injection
 */
export interface AuthServiceDependencies {
  userRepository: UserRepository;
  accountAuthService?: any; // AccountAuthService
  affiliateAuthService?: any; // AffiliateAuthService
  jwtService: any;
  redisService: any;
  authEvents: any;
}

/**
 * Token for UserRepository dependency injection
 */
export const USER_REPOSITORY = 'USER_REPOSITORY' as const;

// ===============================
// Enhanced Response Types
// ===============================

/**
 * Unified login response supporting both user types
 */
export interface UnifiedLoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    userType: UserType;

    // Account-specific response fields
    account?: {
      osot_account_id: string;
      osot_first_name: string;
      osot_last_name: string;
      osot_privilege: Privilege;
      osot_date_of_birth?: string;
      osot_mobile_phone?: string;
    };

    // Affiliate-specific response fields
    affiliate?: {
      osot_affiliate_id: string;
      osot_affiliate_name: string;
      osot_affiliate_email: string;
      osot_representative_job_title?: string;
      osot_affiliate_phone?: string;
      osot_affiliate_website?: string;
      osot_affiliate_area?: number;
      osot_affiliate_province?: number;
      osot_affiliate_country?: number;
    };
  };
  role: string;
  userType: UserType;
  authenticationTimestamp: string;
}

/**
 * JWT payload for unified authentication
 */
export interface UnifiedJwtPayload {
  sub: string; // User ID
  email: string;
  role: string;
  userType: UserType;
  iat: number;
  exp: number;
  // Organization Context (Multi-Tenant Architecture)
  organizationId: string; // Encrypted GUID for security (decrypt with organization-crypto.util)
  organizationSlug: string; // Public identifier (e.g., 'osot', 'org-a') from subdomain
  organizationName: string; // Display name
}

/**
 * Validated login input data
 */
export interface ValidatedLoginData {
  email: string;
  password: string;
  sanitized: boolean;
  validationTimestamp: string;
}
