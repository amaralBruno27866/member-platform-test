/**
 * Affiliate related types based on backend API
 */

export interface Affiliate {
  osot_affiliate_id: string;
  osot_affiliate_name: string;
  osot_affiliate_area: string | {
    label: string;
    value: number;
  };
  osot_affiliate_email: string;
  osot_affiliate_phone: string;
  osot_affiliate_website: string;
  osot_representative_first_name: string;
  osot_representative_last_name: string;
  osot_representative_job_title: string;
  osot_affiliate_address_1: string;
  osot_affiliate_address_2: string;
  osot_affiliate_city: string | {
    label: string;
    value: number;
  };
  osot_affiliate_province: string | {
    label: string;
    value: number;
  };
  osot_affiliate_country: string | {
    label: string;
    value: number;
  };
  osot_affiliate_postal_code: string;
  osot_affiliate_facebook?: string;
  osot_affiliate_instagram?: string;
  osot_affiliate_tiktok?: string;
  osot_affiliate_linkedin?: string;
  osot_account_declaration: boolean;
  osot_account_status: string | {  // Can be string or object depending on backend response
    label: string;
    value: number;
  };
  osot_active_member?: boolean; // May come from related account lookup
  statuscode?: number; // Status code from Dataverse
}

export interface UpdateAffiliateDto {
  osot_affiliate_name?: string;
  osot_affiliate_area?: number;
  osot_affiliate_email?: string;
  osot_affiliate_phone?: string;
  osot_affiliate_website?: string;
  osot_representative_first_name?: string;
  osot_representative_last_name?: string;
  osot_representative_job_title?: string;
  osot_affiliate_address_1?: string;
  osot_affiliate_address_2?: string;
  osot_affiliate_city?: number;
  osot_affiliate_province?: number;
  osot_affiliate_country?: number;
  osot_affiliate_postal_code?: string;
  osot_affiliate_facebook?: string;
  osot_affiliate_instagram?: string;
  osot_affiliate_tiktok?: string;
  osot_affiliate_linkedin?: string;
}

