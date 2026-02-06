/**
 * Internal Address interface with all fields including sensitive information.
 * Used for server-side operations and business logic.
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - enums: Uses centralized enums for type safety
 * - MATCHES Table Address.csv specification exactly (17 fields total)
 *
 * WARNING: This interface contains sensitive fields and should NEVER be exposed
 * directly to public APIs. Use AddressResponseDto for public responses.
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Complete internal representation for business logic
 * - Includes system fields for auditing and ownership
 * - Type-safe enum integration
 */

import {
  City,
  Province,
  Country,
  AddressType,
  AddressPreference,
  AccessModifier,
  Privilege,
} from '../../../../common/enums';

export interface AddressInternal {
  // ========================================
  // SYSTEM FIELDS (internal use only - never expose publicly)
  // ========================================

  /** GUID - Primary key */
  osot_table_addressid?: string;

  /** Autonumber Business ID (osot-ad-0000001) */
  osot_address_id?: string;

  /** ISO datetime string */
  createdon?: string;

  /** ISO datetime string */
  modifiedon?: string;

  /** Owner GUID */
  ownerid?: string;

  // ========================================
  // RELATIONSHIP FIELDS
  // ========================================

  /** Lookup to Table_Account (optional relationship) */
  // osot_table_account?: string; // DEPRECATED: Use @odata.bind instead

  /** Organization GUID - required relationship */
  organizationGuid?: string;

  // ========================================
  // BUSINESS FIELDS
  // ========================================

  /** Text max 20 chars - optional */
  osot_user_business_id?: string;

  /** Text max 255 chars - business required */
  osot_address_1: string;

  /** Text max 255 chars - optional */
  osot_address_2?: string;

  /** Choice from Cities enum - business required */
  osot_city: City;

  /** Choice from Provinces enum - business required */
  osot_province: Province;

  /** Text max 7 chars - business required (Canadian A1A 1A1 format) */
  osot_postal_code: string;

  /** Choice from Countries enum - business required (default: Canada) */
  osot_country: Country;

  /** Choice from AddressType enum - business required */
  osot_address_type: AddressType;

  /** Choice from AddressPreference enum - optional (multiple selection allowed) */
  osot_address_preference?: AddressPreference[];

  /** Text max 255 chars - optional (other city name) */
  osot_other_city?: string;

  /** Text max 255 chars - optional (other province/state) */
  osot_other_province_state?: string;

  /** Choice from AccessModifier enum - optional (default: Private) */
  osot_access_modifiers?: AccessModifier;

  /** Choice from Privilege enum - optional (default: Owner) */
  osot_privilege?: Privilege;

  // ========================================
  // COMPUTED/EXPANDED FIELDS (when needed)
  // ========================================

  /** Expanded Account data (when using $expand) */
  account?: {
    osot_account_id?: string;
    osot_first_name?: string;
    osot_last_name?: string;
    osot_email?: string;
  };
}
