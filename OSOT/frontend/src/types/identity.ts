/**
 * Identity Types
 * Based on IdentityResponseDto and IdentityUpdateDto from backend
 */

export interface IdentityResponse {
  osot_identity_id: string;
  osot_table_identityid: string;
  osot_user_business_id: string;
  osot_chosen_name?: string;
  osot_language: string[];
  osot_other_language?: string;
  osot_gender?: string;
  osot_race?: string;
  osot_indigenous?: boolean;
  osot_indigenous_detail?: string;
  osot_indigenous_detail_other?: string;
  osot_disability?: boolean;
  osot_access_modifiers?: string;
  osot_privilege?: string;
  osot_table_account?: string;
  ownerid: string;
  createdon: string;
  modifiedon?: string;
}

export interface UpdateIdentityDto {
  osot_chosen_name?: string;
  osot_language?: number[];
  osot_other_language?: string;
  osot_gender?: number;
  osot_race?: number;
  osot_indigenous?: boolean;
  osot_indigenous_detail?: number;
  osot_indigenous_detail_other?: string;
  osot_disability?: boolean;
}

// API response wrapper for GET /private/identities/me (returns array)
export interface IdentityApiResponse {
  success: boolean;
  data: IdentityResponse[];
  message: string;
}

// API response wrapper for PATCH /private/identities/me (returns single object)
export interface IdentityUpdateApiResponse {
  success: boolean;
  data: IdentityResponse;
  message: string;
}
