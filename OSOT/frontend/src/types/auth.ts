export interface User {
  id: string; // User ID (osot_account_id or osot_affiliate_id)
  osot_account_id?: string;
  osot_email: string;
  email?: string; // Alternative field name
  osot_first_name?: string;
  osot_last_name?: string;
  osot_role?: string; // Adjust based on actual API response if needed
  osot_privilege?: string; // "Owner", "Admin", "Main"
  privilege?: string; // Alternative field name
  osot_active_member?: boolean; // Membership status (from Account/Affiliate)
  userType?: 'account' | 'affiliate'; // User type
  organizationName?: string; // Organization display name
  organizationSlug?: string; // Organization slug
  [key: string]: unknown; // Allow other fields
}

export interface LoginCredentials {
  osot_email: string;
  osot_password: string;
  organizationSlug: string; // REQUIRED for multi-tenant architecture
}

export interface AuthResponse {
  access_token: string;
  user: User;
  role: string;        // User role: "owner", "admin", "main"
  privilege: number;   // Privilege level (1=Owner, 2=Admin, 3=Main)
  userType: string;    // User type: "account" or "affiliate"
  authenticationTimestamp?: string; // ISO timestamp of login
}
