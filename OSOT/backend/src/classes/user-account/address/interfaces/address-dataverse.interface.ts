/**
 * Interface representing the raw Dataverse response for Address entity.
 * Maps directly to osot_table_address table structure.
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - enums: Uses centralized enums for type safety
 * - Based on Table Address.csv specification exactly (17 fields total)
 * - Used internally for type safety when working with raw Dataverse data
 *
 * MATCHES Table Address.csv specification exactly.
 */

import {
  City,
  Province,
  Country,
  AddressType,
  AccessModifier,
  Privilege,
} from '../../../../common/enums';

export interface AddressDataverse {
  // ========================================
  // SYSTEM FIELDS
  // ========================================

  /** Primary key GUID */
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
  osot_table_account?: string;

  /** OData binding for Account relationship */
  'osot_Table_Account@odata.bind'?: string;

  /** Lookup to Table_Organization (required relationship) */
  _osot_table_organization_value?: string;

  /** OData binding for Organization relationship */
  'osot_Table_Organization@odata.bind'?: string;

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
  osot_address_preference?: string; // Dataverse expects string format "1,2,3" for multi-select

  /** Text max 255 chars - optional (other city name) */
  osot_other_city?: string;

  /** Text max 255 chars - optional (other province/state) */
  osot_other_province_state?: string;

  /** Choice from AccessModifier enum - optional (default: Private) */
  osot_access_modifiers?: AccessModifier;

  /** Choice from Privilege enum - optional (default: Owner) */
  osot_privilege?: Privilege;
}
