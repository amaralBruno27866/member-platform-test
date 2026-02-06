export enum AccountGroup {
  OTHER = 0,
  OCCUPATIONAL_THERAPIST = 1,
  OCCUPATIONAL_THERAPIST_ASSISTANT = 2,
  VENDOR_ADVERTISER = 3,
  STAFF = 4,
}

export interface CreateAccountDto {
  osot_first_name: string;
  osot_last_name: string;
  osot_date_of_birth: string;
  osot_mobile_phone: string;
  osot_email: string;
  osot_password: string;
  osot_account_group: AccountGroup;
  osot_account_declaration: boolean;
}

export interface CreateAddressForAccountDto {
  'osot_Table_Account@odata.bind'?: string;
  osot_address_1: string;
  osot_address_2?: string;
  osot_city: number;
  osot_province: number;
  osot_postal_code: string;
  osot_country: number;
  osot_address_type: number;
  osot_address_preference: number[];
  osot_other_city?: string;
  osot_other_province_state?: string;
}

export interface CreateContactForAccountDto {
  'osot_Table_Account@odata.bind'?: string;
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

export interface CreateIdentityForAccountDto {
  'osot_Table_Account@odata.bind'?: string;
  osot_chosen_name?: string;
  osot_language: number[];
  osot_gender: number;
  osot_race: number;
  osot_indigenous: boolean;
  osot_indigenous_detail?: number;
  osot_indigenous_detail_other?: string;
  osot_disability: boolean;
}

export interface CreateOtEducationForAccountDto {
  'osot_Table_Account@odata.bind'?: string;
  osot_coto_status: number;
  osot_coto_registration: string;
  osot_ot_degree_type: number;
  osot_ot_university: number;
  osot_ot_grad_year: number;
  osot_ot_country: number;
  osot_ot_other?: string;
}

export interface CreateOtaEducationForAccountDto {
  'osot_Table_Account@odata.bind'?: string;
  osot_work_declaration: boolean;
  osot_ota_degree_type: number;
  osot_ota_college: number;
  osot_ota_grad_year: number;
  osot_ota_country: number;
  osot_ota_other?: string;
}

export interface CreateManagementForAccountDto {
  'osot_Table_Account@odata.bind'?: string;
  osot_life_member_retired: boolean;
  osot_shadowing: boolean;
  osot_passed_away: boolean;
  osot_vendor: boolean;
  osot_advertising: boolean;
  osot_recruitment: boolean;
  osot_driver_rehab: boolean;
}

export interface CompleteUserRegistrationDto {
  account: CreateAccountDto;
  address: CreateAddressForAccountDto;
  contact: CreateContactForAccountDto;
  identity: CreateIdentityForAccountDto;
  educationType: 'ot' | 'ota';
  otEducation?: CreateOtEducationForAccountDto;
  otaEducation?: CreateOtaEducationForAccountDto;
  management?: CreateManagementForAccountDto;
}

export interface OrchestratorResponseDto {
  success: boolean;
  message: string;
  sessionId?: string;
  status?: string;
  error?: {
    code?: string | number;
    message?: string;
    details?: string;
    [key: string]: unknown;
  };
}
