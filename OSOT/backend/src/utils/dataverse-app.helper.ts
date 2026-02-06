// src/utils/dataverse-app.helper.ts
// Helper to decide which app credentials to use for each Dataverse operation

export type DataverseApp = 'main' | 'owner' | 'admin';

/**
 * System role for internal operations (password recovery, automated tasks, etc.)
 * These operations need read access but are not tied to a specific user.
 */
export const SYSTEM_ROLE: string = 'owner'; // Use 'owner' credentials for system operations

/**
 * Selects the appropriate Dataverse app context based on the operation and user role.
 * All account creation is done by the 'owner' app for security and audit purposes.
 *
 * CRITICAL: All READ operations now use 'main' app due to Dataverse permission constraints.
 * The 'owner' and 'admin' apps lack table-level read access on many entities.
 *
 * Usage guidance: prefer calling `getAppForOperation` from domain services
 * (e.g. AccountCrudService, AccountLookupService) so all Dataverse calls
 * can be routed consistently through `DataverseService` which will use the
 * selected app credentials.
 */
export function getAppForOperation(
  operation: 'create' | 'read' | 'write' | 'delete',
  userRole?: string,
): DataverseApp {
  switch (operation) {
    case 'create':
      if (userRole === 'main') return 'main';
      return 'owner'; // default for admin/undefined/any other role
    case 'read':
      // ALWAYS use 'main' for read operations - owner/admin apps lack table read permissions
      return 'main';
    case 'write':
      if (userRole === 'main') return 'main';
      if (userRole === 'admin') return 'admin';
      if (userRole === 'owner') return 'owner';
      return 'main';
    case 'delete':
      if (userRole === 'main') return 'main';
      return 'main'; // only main can delete
    default:
      return 'main';
  }
}

// CRUD permissions by profile:
// Admin: write, read
// Main: create, read, write, delete
// Owner: create, write, read

export function canCreate(role: string | undefined) {
  return role === 'main' || role === 'owner';
}

export function canRead(role: string) {
  return role === 'main' || role === 'admin' || role === 'owner';
}

export function canWrite(role: string) {
  return role === 'main' || role === 'admin' || role === 'owner';
}

export function canDelete(role: string) {
  return role === 'main';
}
