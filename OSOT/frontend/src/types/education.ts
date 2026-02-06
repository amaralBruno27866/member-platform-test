/**
 * Education Types
 * Handles both OT and OTA education based on account group
 */

// OT Education Types
export interface OtEducationResponse {
  osot_ot_education_id: string;
  osot_table_ot_educationid: string;
  createdon: string;
  modifiedon: string;
  ownerid: string;
  osot_table_account?: string;
  osot_user_business_id: string;
  osot_coto_status: string;
  osot_coto_registration?: string;
  osot_ot_degree_type: string;
  osot_ot_university: string;
  osot_ot_grad_year: string;
  osot_education_category?: string;
  osot_ot_country: string;
  osot_ot_other?: string;
  osot_access_modifiers?: string;
  osot_privilege?: string;
}

export interface UpdateOtEducationDto {
  osot_coto_status?: number;
  osot_coto_registration?: string;
  osot_ot_degree_type?: number;
  osot_ot_university?: number;
  osot_ot_country?: number;
  osot_ot_other?: string;
}

// OTA Education Types
export interface OtaEducationResponse {
  osot_ota_education_id: string;
  osot_table_ota_educationid: string;
  ownerid?: string;
  osot_user_business_id: string;
  osot_work_declaration: boolean;
  osot_ota_degree_type?: string;
  osot_ota_college?: string;
  osot_ota_grad_year?: string;
  osot_education_category?: string;
  osot_ota_country?: string;
  osot_ota_other?: string;
  createdon?: string;
  modifiedon?: string;
}

export interface UpdateOtaEducationDto {
  osot_ota_degree_type?: number;
  osot_ota_college?: number;
  osot_ota_country?: number;
  osot_ota_other?: string;
}

// Union type for education response
export type EducationResponse = OtEducationResponse | OtaEducationResponse;

// Union type for update
export type UpdateEducationDto = UpdateOtEducationDto | UpdateOtaEducationDto;

// Type guards - use fields that actually exist in the response
export function isOtEducation(education: EducationResponse): education is OtEducationResponse {
  // OT has coto_status and ot_university, OTA doesn't
  return 'osot_coto_status' in education || 'osot_ot_university' in education;
}

export function isOtaEducation(education: EducationResponse): education is OtaEducationResponse {
  // OTA has work_declaration and ota_college, OT doesn't
  return 'osot_work_declaration' in education || 'osot_ota_college' in education;
}

// API response wrappers
export interface OtEducationApiResponse {
  success: boolean;
  data: OtEducationResponse[];
  message: string;
}

export interface OtaEducationApiResponse {
  success: boolean;
  data: OtaEducationResponse[];
  message: string;
}

export interface OtEducationUpdateApiResponse {
  success: boolean;
  data: OtEducationResponse;
  message: string;
}

export interface OtaEducationUpdateApiResponse {
  success: boolean;
  data: OtaEducationResponse;
  message: string;
}
