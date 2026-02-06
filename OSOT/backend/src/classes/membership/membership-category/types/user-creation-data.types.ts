/**
 * User Creation Data Types for Membership Category
 *
 * These interfaces define the structure of user data collected
 * during the membership creation process.
 */

// Base interface for common user creation data
export interface BaseUserCreationData {
  userGuid: string;
  userType: 'account' | 'affiliate';
}

// Interface for Account user creation data
export interface AccountUserCreationData extends BaseUserCreationData {
  userType: 'account';
  user_group: number;
  education_category?: string;
  education_table?: 'ot-education' | 'ota-education';
}

// Interface for Affiliate user creation data
export interface AffiliateUserCreationData extends BaseUserCreationData {
  userType: 'affiliate';
  affiliate_id: string;
}

// Union type for any user creation data
export type UserCreationData =
  | AccountUserCreationData
  | AffiliateUserCreationData;

// Type guards to check user creation data type
export function isAccountUserCreationData(
  userData: UserCreationData,
): userData is AccountUserCreationData {
  return userData.userType === 'account';
}

export function isAffiliateUserCreationData(
  userData: UserCreationData,
): userData is AffiliateUserCreationData {
  return userData.userType === 'affiliate';
}
