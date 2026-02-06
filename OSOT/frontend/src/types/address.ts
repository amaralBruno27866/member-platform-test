/**
 * Address Types
 * TypeScript interfaces for address data structures
 */

export interface AddressResponse {
  osot_Address_ID: string;
  osot_Table_AddressId: string;
  CreatedOn: string;
  ModifiedOn: string;
  OwnerId: string;
  osot_Table_Account?: string;
  osot_user_business_id?: string;
  osot_other_city?: string;
  osot_other_province_state?: string;
  osot_address_1: string;
  osot_address_2?: string;
  osot_city: string;
  osot_province: string;
  osot_postal_code: string;
  osot_country: string;
  osot_address_type: string;
  osot_address_preference?: string[];
  osot_access_modifiers?: string;
  osot_privilege?: string;
}

export interface UpdateAddressDto {
  osot_address_1?: string;
  osot_address_2?: string;
  osot_city?: number;
  osot_province?: number;
  osot_postal_code?: string;
  osot_country?: number;
  osot_address_type?: number;
  osot_address_preference?: number[];
  osot_other_city?: string;
  osot_other_province_state?: string;
}

export interface AddressApiResponse {
  success: boolean;
  data: AddressResponse[];
  message: string;
  timestamp?: string;
}

export interface AddressUpdateApiResponse {
  success: boolean;
  data: AddressResponse;
  message: string;
  timestamp?: string;
}
