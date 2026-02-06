import { AccessModifier } from '../../../../common/enums/access-modifier.enum';
import { Privilege } from '../../../../common/enums/privilege.enum';

/**
 * Interface representing the raw Dataverse response for Contact entity.
 * Maps directly to osot_table_contact table structure.
 *
 * MATCHES Table Contact.csv specification exactly (18 fields total).
 * Used internally for type safety when working with raw Dataverse data.
 */
export interface ContactDataverse {
  // System fields
  osot_table_contactid?: string; // Primary key GUID
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
