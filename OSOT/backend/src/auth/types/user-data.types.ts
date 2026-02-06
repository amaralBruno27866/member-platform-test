/**
 * Types for Dataverse responses
 * Objective: Provide type safety for user data returned from Dataverse
 */

// Base interface for common account fields
interface BaseAccountData {
  osot_account_id?: string | number;
  osot_email?: string;
  osot_password?: string;
  osot_account_status?: number | string;
  osot_privilege?: number | string;
}

// Interface for Table_Account (OT/OTA users)
export interface TableAccountData extends BaseAccountData {
  osot_table_accountid?: string; // GUID - Primary key for lookups
  osot_first_name?: string;
  osot_last_name?: string;
  osot_date_of_birth?: string;
  osot_mobile_phone?: string;
  osot_account_group?: number;
  osot_account_declaration?: boolean;
  osot_active_member?: boolean;
}

// Interface for Table_Account_Affiliate
export interface TableAccountAffiliateData {
  osot_table_account_affiliateid?: string; // GUID - Primary key for lookups
  osot_affiliate_id?: string | number;
  osot_affiliate_name?: string;
  osot_affiliate_email?: string;
  osot_affiliate_phone?: string;
  osot_affiliate_website?: string;
  osot_affiliate_area?: number;
  osot_account_status?: number | string;
  osot_affiliate_province?: number;
  osot_affiliate_country?: number;
  osot_password?: string;
}

// Union type for any user data
export type UserData = TableAccountData | TableAccountAffiliateData;

// Type guards to check user type
export function isTableAccountData(user: UserData): user is TableAccountData {
  return 'osot_account_id' in user;
}

export function isAffiliateData(
  user: UserData,
): user is TableAccountAffiliateData {
  return 'osot_affiliate_id' in user;
}
