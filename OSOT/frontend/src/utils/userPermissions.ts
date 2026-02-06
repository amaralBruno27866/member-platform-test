/**
 * User Permissions Utilities
 * Based on STAFF_ADMIN_INTERFACE_FRONTEND_GUIDE.md
 * 
 * Purpose: Detect STAFF users and manage role-based permissions
 */

// Account Groups (from backend - REAL VALUES, not documentation!)
export enum AccountGroup {
  MEMBER = 1,
  STUDENT = 2,
  RESIDENT = 3,
  STAFF = 4,  // ← Backend REALMENTE retorna 4, não 7!
  RETIRED = 5,
  CANDIDATE = 6,
}

// Privilege Levels (from JWT)
export enum Privilege {
  OWNER = 1,  // Can read/update own records
  ADMIN = 2,  // Can read/update organization-wide
  MAIN = 3,   // Full CRUD (only role that can DELETE)
}

export interface UserProfile {
  osot_account_id: string;
  osot_table_accountid?: string;
  osot_email: string;
  osot_first_name?: string;
  osot_last_name?: string;
  osot_account_group: number; // Account Group (4 = STAFF na prática)
  osot_privilege: number; // 1=OWNER(menor), 2=ADMIN(médio), 3=MAIN(maior)
  osot_account_status: number;
  osot_active_member?: boolean;
  createdon?: string;
  modifiedon?: string;
}

export interface RolePermissions {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  scope: 'own' | 'organization' | 'all';
}

/**
 * Role permissions by privilege level
 */
export const ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  owner: {
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: false,
    scope: 'own',
  },
  admin: {
    canCreate: false,
    canRead: true,
    canUpdate: true,
    canDelete: false,
    scope: 'organization',
  },
  main: {
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: true,
    scope: 'all',
  },
};

/**
 * Group-specific permissions
 */
interface GroupPermissionConfig {
  canCreateAccounts: boolean;
  canViewAllUsers: boolean;
  canEditAnyUser: boolean;
  canDeleteUsers: boolean;
  canAccessReports: boolean;
  canManageOrganization: boolean;
  dashboardRoute: string;
}

export const GROUP_PERMISSIONS: Record<number, GroupPermissionConfig> = {
  [AccountGroup.STAFF]: {
    canCreateAccounts: true,
    canViewAllUsers: true,
    canEditAnyUser: true,
    canDeleteUsers: false,  // Reserved for MAIN role only
    canAccessReports: true,
    canManageOrganization: true,
    dashboardRoute: '/admin/dashboard',
  },
  [AccountGroup.MEMBER]: {
    canCreateAccounts: false,
    canViewAllUsers: false,
    canEditAnyUser: false,
    canDeleteUsers: false,
    canAccessReports: false,
    canManageOrganization: false,
    dashboardRoute: '/dashboard',
  },
  [AccountGroup.STUDENT]: {
    canCreateAccounts: false,
    canViewAllUsers: false,
    canEditAnyUser: false,
    canDeleteUsers: false,
    canAccessReports: false,
    canManageOrganization: false,
    dashboardRoute: '/dashboard',
  },
  [AccountGroup.RESIDENT]: {
    canCreateAccounts: false,
    canViewAllUsers: false,
    canEditAnyUser: false,
    canDeleteUsers: false,
    canAccessReports: false,
    canManageOrganization: false,
    dashboardRoute: '/dashboard',
  },
  [AccountGroup.RETIRED]: {
    canCreateAccounts: false,
    canViewAllUsers: false,
    canEditAnyUser: false,
    canDeleteUsers: false,
    canAccessReports: false,
    canManageOrganization: false,
    dashboardRoute: '/dashboard',
  },
  [AccountGroup.CANDIDATE]: {
    canCreateAccounts: false,
    canViewAllUsers: false,
    canEditAnyUser: false,
    canDeleteUsers: false,
    canAccessReports: false,
    canManageOrganization: false,
    dashboardRoute: '/dashboard',
  },
};

/**
 * Check if user is STAFF (administrative user)
 * @param profile - User profile with account_group
 * @returns true if user is STAFF (account_group = 4 in production)
 */
export function isStaffUser(profile: UserProfile): boolean {
  return profile.osot_account_group === AccountGroup.STAFF;
}

/**
 * Check if user has administrative privileges (MAIN)
 * STAFF users typically have MAIN privilege (3)
 * @param profile - User profile with privilege level
 * @returns true if user has MAIN privilege
 */
export function hasAdminPrivileges(profile: UserProfile): boolean {
  return profile.osot_privilege === Privilege.MAIN;
}

/**
 * Check if user can access admin dashboard
 * Requires both STAFF account group AND MAIN privilege
 * @param profile - User profile
 * @returns true if user can access admin dashboard
 */
export function canAccessAdminDashboard(profile: UserProfile): boolean {
  return isStaffUser(profile) && hasAdminPrivileges(profile);
}

/**
 * Get role from privilege level
 * @param privilege - Privilege number (1, 2, or 3)
 * @returns Role string
 */
export function getRoleFromPrivilege(privilege: number): string {
  switch (privilege) {
    case Privilege.OWNER:
      return 'owner';
    case Privilege.ADMIN:
      return 'admin';
    case Privilege.MAIN:
      return 'main';
    default:
      return 'owner';
  }
}

/**
 * Get user permissions based on account group
 * @param accountGroup - Account group number (1-6)
 * @returns Group permissions object
 */
export function getUserPermissions(accountGroup: number) {
  return GROUP_PERMISSIONS[accountGroup] || GROUP_PERMISSIONS[AccountGroup.MEMBER];
}

/**
 * Check if user can perform specific action
 * @param userProfile - User profile
 * @param action - Action to perform (create, read, update, delete)
 * @param targetUserId - Optional target user ID (for scope checking)
 * @returns true if user can perform action
 */
export function canPerformAction(
  userProfile: UserProfile,
  action: 'create' | 'read' | 'update' | 'delete',
  targetUserId?: string
): boolean {
  const role = getRoleFromPrivilege(userProfile.osot_privilege);
  const permissions = ROLE_PERMISSIONS[role];
  
  // Capitalize action for permission key
  const actionKey = `can${action.charAt(0).toUpperCase() + action.slice(1)}` as keyof RolePermissions;
  const hasPermission = permissions[actionKey];
  
  if (!hasPermission) return false;
  
  // Check scope for 'own' level
  if (permissions.scope === 'own') {
    return targetUserId === userProfile.osot_account_id;
  }
  
  return true;
}

/**
 * Get appropriate dashboard route for user
 * @param profile - User profile
 * @returns Dashboard route path
 */
export function getDashboardRoute(profile: UserProfile): string {
  const permissions = getUserPermissions(profile.osot_account_group);
  return permissions.dashboardRoute;
}

/**
 * Check if user is active
 * @param profile - User profile
 * @returns true if account is active
 */
export function isActiveUser(profile: UserProfile): boolean {
  return profile.osot_account_status === 1; // 1 = Active
}
