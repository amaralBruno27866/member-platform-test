import { AccessModifier } from '../../../../common/enums/access-modifier.enum';
import { Privilege } from '../../../../common/enums/privilege.enum';

/**
 * Internal Contact interface with all fields including sensitive information.
 * Used for server-side operations and business logic.
 *
 * MATCHES Table Contact.csv specification exactly (18 fields total).
 *
 * WARNING: This interface contains sensitive fields and should NEVER be exposed
 * directly to public APIs. Use ContactResponseDto for public responses.
 */
export interface ContactInternal {
  // System fields (internal use only - never expose publicly)
  osot_table_contactid?: string; // GUID - Primary key
  osot_contact_id?: string; // Autonumber Business ID (osot-ct-0000001)
  createdon?: string; // ISO datetime string
  modifiedon?: string; // ISO datetime string
  ownerid?: string; // Owner GUID

  // Relationship fields
  osot_table_account?: string; // Lookup to Table_Account (required relationship)

  // Business required fields
  osot_user_business_id: string; // Text max 20 chars - business required

  // Optional contact information
  osot_secondary_email?: string; // Email format, max 255 chars
  osot_job_title?: string; // Text max 50 chars

  // Phone fields (max 14 chars each)
  osot_home_phone?: string; // Canadian phone format
  osot_work_phone?: string; // Canadian phone format

  // Social media and web presence (URL format, max 255 chars each)
  osot_business_website?: string;
  osot_facebook?: string;
  osot_instagram?: string;
  osot_tiktok?: string;
  osot_linkedin?: string;

  // Security and access control (choice fields)
  osot_access_modifiers?: AccessModifier; // AccessModifier enum (default: Private)
  osot_privilege?: Privilege; // Privilege enum (default: Owner)
}
