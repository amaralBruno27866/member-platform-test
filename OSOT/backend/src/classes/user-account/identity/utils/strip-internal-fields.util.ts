/**
 * Remove internal-only fields from an identity object before sending to clients.
 * Strips sensitive and internal fields that should never be exposed publicly.
 *
 * This utility ensures data privacy and security by removing:
 * - Internal GUIDs and system identifiers
 * - Security-sensitive privilege information
 * - Dataverse system metadata
 * - Internal processing flags
 */

import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { IdentityInternal } from '../interfaces/identity-internal.interface';

/**
 * Remove internal fields from identity object for public API responses
 * @param identity Identity object (internal or unknown format)
 * @returns Cleaned identity object without internal fields
 */
export function stripInternalFields(
  identity: unknown,
): Record<string, unknown> {
  try {
    if (!identity || typeof identity !== 'object') {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'strip_internal_fields',
        error: 'Invalid identity object provided',
        identity,
      });
    }

    // Extract and exclude all internal/sensitive fields
    const {
      osot_table_identityid, // Internal GUID - never expose
      osot_privilege, // Security-sensitive - controlled by business logic
      ownerid, // System field - never expose
      // Keep all other fields as they are considered safe for public display
      ...rest
    } = identity as Record<string, unknown>;

    // Explicitly void the extracted fields to satisfy linters
    void osot_table_identityid;
    void osot_privilege;
    void ownerid;

    return rest as Record<string, unknown>;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      // Re-throw our custom errors
      throw error;
    }
    throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
      operation: 'strip_internal_fields',
      error: error instanceof Error ? error.message : 'Unknown stripping error',
      identity,
    });
  }
}

/**
 * Remove internal fields from multiple identity objects
 * @param identities Array of identity objects
 * @returns Array of cleaned identity objects
 */
export function stripInternalFieldsBulk(
  identities: unknown[],
): Record<string, unknown>[] {
  if (!Array.isArray(identities)) return [];

  return identities.map((identity) => stripInternalFields(identity));
}

/**
 * Check if an object contains internal fields that should be stripped
 * @param identity Identity object to check
 * @returns True if internal fields are present
 */
export function hasInternalFields(identity: unknown): boolean {
  if (!identity || typeof identity !== 'object') return false;

  const obj = identity as Record<string, unknown>;

  return !!(
    obj.osot_table_identityid ||
    obj.osot_privilege !== undefined ||
    obj.ownerid
  );
}

/**
 * Safely expose identity data for logging purposes
 * Removes all sensitive fields and masks personal information
 * @param identity Identity object
 * @returns Safe object for logging
 */
export function stripForLogging(identity: unknown): Record<string, unknown> {
  if (!identity || typeof identity !== 'object') return {};

  const obj = identity as Record<string, unknown>;

  return {
    // Keep identifiers for tracing (non-sensitive)
    osot_identity_id: obj.osot_identity_id,
    osot_user_business_id: obj.osot_user_business_id,
    // Keep account relationship
    osot_table_account: obj.osot_table_account,
    // Mask chosen name for privacy
    osot_chosen_name: obj.osot_chosen_name ? '[REDACTED]' : undefined,
    // Keep language preferences (non-sensitive)
    osot_language: obj.osot_language,
    // Keep demographic info (already optional, user-controlled)
    osot_gender: obj.osot_gender,
    osot_race: obj.osot_race,
    osot_indigenous: obj.osot_indigenous,
    osot_indigenous_detail: obj.osot_indigenous_detail,
    osot_disability: obj.osot_disability,
    // Keep access modifiers (control visibility)
    osot_access_modifiers: obj.osot_access_modifiers,
    // Keep timestamps
    createdon: obj.createdon,
    modifiedon: obj.modifiedon,
    // Exclude sensitive/internal fields:
    // - osot_table_identityid: Internal GUID
    // - osot_privilege: Security-sensitive
    // - ownerid: System field
    // - osot_indigenous_detail_other: May contain sensitive cultural info
  };
}

/**
 * Type guard to check if object is a valid Identity structure
 * @param identity Object to check
 * @returns True if object has Identity structure
 */
export function isIdentityLike(
  identity: unknown,
): identity is IdentityInternal {
  if (!identity || typeof identity !== 'object') return false;

  const obj = identity as Record<string, unknown>;

  // Check for required Identity fields
  return !!(
    obj.osot_user_business_id &&
    (obj.osot_language || Array.isArray(obj.osot_language))
  );
}
