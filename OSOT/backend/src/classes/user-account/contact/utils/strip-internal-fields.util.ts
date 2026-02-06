/**
 * Strip Internal Fields Utility
 *
 * Security utility to filter internal and sensitive fields from contact responses.
 * Ensures only appropriate fields are exposed based on user roles and access levels.
 *
 * Integration Features:
 * - AccessModifier and Privilege enum integration for role-based access control
 * - Type-safe field classification using project enums
 * - Enhanced security filtering with enum-based privilege checking
 * - Consistent access control patterns following project standards
 */

import { ContactInternal } from '../interfaces/contact-internal.interface';
import { AccessModifier } from '../../../../common/enums/access-modifier.enum';
import { Privilege } from '../../../../common/enums/privilege.enum';

/**
 * Field visibility levels for security control
 */
export enum ContactFieldVisibility {
  PUBLIC = 'public', // Available to all users
  PROTECTED = 'protected', // Available to account members and above
  PRIVATE = 'private', // Available to contact owner and admins only
  INTERNAL = 'internal', // System fields - never exposed via API
}

/**
 * Contact field classifications for security filtering
 */
export const CONTACT_FIELD_CLASSIFICATIONS = {
  // Public fields - safe for all users
  [ContactFieldVisibility.PUBLIC]: [
    'osot_user_business_id', // Business identifier
    'osot_job_title', // Professional title
    'osot_business_website', // Business website
    'osot_linkedin', // Professional social media
  ],

  // Protected fields - account members and above
  [ContactFieldVisibility.PROTECTED]: [
    'osot_secondary_email', // Secondary email
    'osot_facebook', // Personal social media
    'osot_instagram', // Personal social media
    'osot_tiktok', // Personal social media
  ],

  // Private fields - contact owner and admins only
  [ContactFieldVisibility.PRIVATE]: [
    'osot_home_phone', // Personal phone
    'osot_work_phone', // Work phone
  ],

  // Internal fields - never exposed via API
  [ContactFieldVisibility.INTERNAL]: [
    'osot_table_contactid', // System ID
    'osot_contact_id', // Business ID
    'createdon', // System created date
    'modifiedon', // System modified date
    'ownerid', // System owner reference
    'osot_table_account', // System account reference
    'osot_access_modifier', // Security level
    'osot_privilege', // Security privilege
  ],
} as const;

/**
 * User role definitions for access control with enum integration
 */
export type ContactUserRole =
  | 'public' // Anonymous/public access
  | 'member' // Account member
  | 'owner' // Contact owner
  | 'admin' // System administrator
  | 'system'; // System-level access

/**
 * Map Privilege enum to ContactUserRole for consistent access control
 */
export const mapPrivilegeToRole = (privilege?: Privilege): ContactUserRole => {
  switch (privilege) {
    case Privilege.OWNER:
      return 'admin';
    case Privilege.ADMIN:
      return 'admin';
    case Privilege.MAIN:
      return 'member';
    default:
      return 'public';
  }
};

/**
 * Map AccessModifier enum to determine field visibility
 */
export const getFieldVisibilityFromAccessModifier = (
  accessModifier?: AccessModifier,
): ContactFieldVisibility => {
  switch (accessModifier) {
    case AccessModifier.PUBLIC:
      return ContactFieldVisibility.PUBLIC;
    case AccessModifier.PROTECTED:
      return ContactFieldVisibility.PROTECTED;
    case AccessModifier.PRIVATE:
      return ContactFieldVisibility.PRIVATE;
    default:
      return ContactFieldVisibility.INTERNAL;
  }
};

/**
 * Contact Field Security Filter
 * Removes sensitive and internal fields based on user role and access level
 */
export class ContactFieldSecurity {
  /**
   * Strip internal fields with enum-based role determination
   * Enhanced version that accepts Privilege enum for role mapping
   * @param contact Raw contact data with internal fields
   * @param privilege User's privilege level (enum-based)
   * @param isOwner Whether user is the contact owner
   * @returns Filtered contact data appropriate for user's access level
   */
  static stripInternalFieldsByPrivilege(
    contact: Partial<ContactInternal>,
    privilege?: Privilege,
    isOwner: boolean = false,
  ): Partial<ContactInternal> {
    const userRole = mapPrivilegeToRole(privilege);
    return this.stripInternalFields(contact, userRole, isOwner);
  }

  /**
   * Strip internal fields from contact data based on user role
   * @param contact Raw contact data with internal fields
   * @param userRole User's access role
   * @param isOwner Whether user is the contact owner
   * @returns Filtered contact data appropriate for user's access level
   */
  static stripInternalFields(
    contact: Partial<ContactInternal>,
    userRole: ContactUserRole = 'public',
    isOwner: boolean = false,
  ): Partial<ContactInternal> {
    const filtered: Partial<ContactInternal> = {};

    // Determine allowed fields based on role
    const allowedFields = this.getAllowedFields(userRole, isOwner);

    // Filter contact fields
    Object.entries(contact).forEach(([key, value]) => {
      if (allowedFields.includes(key)) {
        // Type-safe assignment using index signature
        (filtered as Record<string, unknown>)[key] = value;
      }
    });

    return filtered;
  }

  /**
   * Get list of fields allowed for a specific user role
   * @param userRole User's access role
   * @param isOwner Whether user is the contact owner
   * @returns Array of allowed field names
   */
  static getAllowedFields(
    userRole: ContactUserRole,
    isOwner: boolean = false,
  ): string[] {
    const allowedFields: string[] = [];

    switch (userRole) {
      case 'system':
      case 'admin':
        // Admins can see everything except internal system fields
        allowedFields.push(
          ...CONTACT_FIELD_CLASSIFICATIONS[ContactFieldVisibility.PUBLIC],
          ...CONTACT_FIELD_CLASSIFICATIONS[ContactFieldVisibility.PROTECTED],
          ...CONTACT_FIELD_CLASSIFICATIONS[ContactFieldVisibility.PRIVATE],
        );
        break;

      case 'owner':
        // Contact owners can see their own private data
        allowedFields.push(
          ...CONTACT_FIELD_CLASSIFICATIONS[ContactFieldVisibility.PUBLIC],
          ...CONTACT_FIELD_CLASSIFICATIONS[ContactFieldVisibility.PROTECTED],
          ...CONTACT_FIELD_CLASSIFICATIONS[ContactFieldVisibility.PRIVATE],
        );
        break;

      case 'member':
        // Account members can see public and protected data
        allowedFields.push(
          ...CONTACT_FIELD_CLASSIFICATIONS[ContactFieldVisibility.PUBLIC],
          ...CONTACT_FIELD_CLASSIFICATIONS[ContactFieldVisibility.PROTECTED],
        );
        // If they're also the owner, add private fields
        if (isOwner) {
          allowedFields.push(
            ...CONTACT_FIELD_CLASSIFICATIONS[ContactFieldVisibility.PRIVATE],
          );
        }
        break;

      case 'public':
      default:
        // Public users can only see public fields
        allowedFields.push(
          ...CONTACT_FIELD_CLASSIFICATIONS[ContactFieldVisibility.PUBLIC],
        );
        break;
    }

    return allowedFields;
  }

  /**
   * Check if a field is visible to a specific user role
   * @param fieldName Name of the field to check
   * @param userRole User's access role
   * @param isOwner Whether user is the contact owner
   * @returns Whether field is visible to this user
   */
  static isFieldVisible(
    fieldName: string,
    userRole: ContactUserRole,
    isOwner: boolean = false,
  ): boolean {
    const allowedFields = this.getAllowedFields(userRole, isOwner);
    return allowedFields.includes(fieldName);
  }

  /**
   * Get field visibility level
   * @param fieldName Name of the field
   * @returns Visibility level of the field
   */
  static getFieldVisibility(fieldName: string): ContactFieldVisibility {
    const fieldClassifications = CONTACT_FIELD_CLASSIFICATIONS as Record<
      string,
      readonly string[]
    >;

    for (const [level, fields] of Object.entries(fieldClassifications)) {
      if (fields.includes(fieldName)) {
        return level as ContactFieldVisibility;
      }
    }

    // Unknown fields are treated as internal for security
    return ContactFieldVisibility.INTERNAL;
  }

  /**
   * Strip fields for batch operations (multiple contacts)
   * @param contacts Array of contact data
   * @param userRole User's access role
   * @param ownerMap Map of contact IDs to owner status
   * @returns Array of filtered contacts
   */
  static stripFieldsFromBatch(
    contacts: Partial<ContactInternal>[],
    userRole: ContactUserRole = 'public',
    ownerMap: Map<string, boolean> = new Map(),
  ): Partial<ContactInternal>[] {
    return contacts.map((contact) => {
      const contactId = contact.osot_table_contactid || '';
      const isOwner = ownerMap.get(contactId) || false;

      return this.stripInternalFields(contact, userRole, isOwner);
    });
  }

  /**
   * Create a safe copy with only allowed fields for API response
   * @param contact Raw contact data
   * @param userRole User's access role
   * @param isOwner Whether user is the contact owner
   * @returns Safe contact data for API response
   */
  static createSafeResponse(
    contact: Partial<ContactInternal>,
    userRole: ContactUserRole = 'public',
    isOwner: boolean = false,
  ): Record<string, any> {
    const safeContact = this.stripInternalFields(contact, userRole, isOwner);

    // Add metadata for client-side handling
    return {
      ...safeContact,
      _metadata: {
        accessLevel: userRole,
        isOwner,
        fieldsIncluded: Object.keys(safeContact).length,
        lastFiltered: new Date().toISOString(),
      },
    };
  }

  /**
   * Mask sensitive data for logging purposes
   * @param contact Contact data
   * @returns Masked contact data safe for logs
   */
  static maskForLogging(
    contact: Partial<ContactInternal>,
  ): Partial<ContactInternal> {
    const masked = { ...contact };

    // Mask email
    if (masked.osot_secondary_email) {
      const email = masked.osot_secondary_email;
      const [username, domain] = email.split('@');
      masked.osot_secondary_email = `${username.substring(0, 2)}***@${domain}`;
    }

    // Mask phone numbers
    if (masked.osot_home_phone) {
      const phone = masked.osot_home_phone;
      masked.osot_home_phone = `***-***-${phone.slice(-4)}`;
    }

    if (masked.osot_work_phone) {
      const phone = masked.osot_work_phone;
      masked.osot_work_phone = `***-***-${phone.slice(-4)}`;
    }

    // Remove completely sensitive fields
    const {
      osot_table_contactid: _removed1,

      osot_table_account: _removed2,
      ...cleanedMasked
    } = masked;

    return cleanedMasked;
  }
}
