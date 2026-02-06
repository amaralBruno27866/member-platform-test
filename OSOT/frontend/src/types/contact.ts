/**
 * Contact Types
 * Based on ContactResponseDto and UpdateContactDto from backend
 */

export interface ContactResponse {
  osot_Contact_ID: string;
  osot_table_contactid: string;
  createdon: string;
  modifiedon: string;
  ownerid: string;
  osot_table_account?: string;
  osot_user_business_id: string;
  osot_secondary_email?: string;
  osot_job_title?: string;
  osot_home_phone?: string;
  osot_work_phone?: string;
  osot_business_website?: string;
  osot_facebook?: string;
  osot_instagram?: string;
  osot_tiktok?: string;
  osot_linkedin?: string;
  osot_access_modifiers?: string;
  osot_privilege?: string;
}

export interface UpdateContactDto {
  osot_secondary_email?: string;
  osot_job_title?: string;
  osot_home_phone?: string;
  osot_work_phone?: string;
  osot_business_website?: string;
  osot_facebook?: string;
  osot_instagram?: string;
  osot_tiktok?: string;
  osot_linkedin?: string;
}

// API response wrapper for GET /private/contacts/me (returns array)
export interface ContactApiResponse {
  success: boolean;
  data: ContactResponse[];
  message: string;
}

// API response wrapper for PATCH /private/contacts/me (returns single object)
export interface ContactUpdateApiResponse {
  success: boolean;
  data: ContactResponse;
  message: string;
}
