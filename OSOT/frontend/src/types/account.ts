/**
 * Account Type Definitions
 * Based on backend DTOs: account-response.dto.ts and update-account.dto.ts
 */

export interface AccountResponse {
  // System Fields
  osot_account_id: string;
  osot_table_accountid: string;
  createdon: string;
  modifiedon: string;
  ownerid: string;

  // Personal Information
  osot_last_name: string;
  osot_first_name: string;
  osot_date_of_birth: string;

  // Contact Information
  osot_mobile_phone: string;
  osot_email: string;

  // Account Configuration
  osot_account_group: string;
  osot_account_declaration: boolean;

  // Account Status
  osot_account_status: string;
  osot_active_member: boolean;

  // Access Control (read-only, not displayed to user)
  osot_access_modifiers: string;
  osot_privilege: string;
}

/**
 * DTO for updating account information
 * Only includes fields that users can edit themselves
 * Password change is handled separately for security
 */
export interface UpdateAccountDto {
  osot_last_name?: string;
  osot_first_name?: string;
  osot_date_of_birth?: string; // Format: YYYY-MM-DD
  osot_mobile_phone?: string; // Format: (XXX) XXX-XXXX
  osot_email?: string;
}

/**
 * DTO for changing password (separate from profile update)
 * Backend should validate old password before allowing change
 */
export interface ChangePasswordDto {
  osot_password: string; // New password
}

export interface AccountApiResponse {
  success: boolean;
  data: AccountResponse;
  message: string;
  timestamp: string;
}
