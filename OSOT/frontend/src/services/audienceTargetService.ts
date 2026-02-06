/**
 * Audience Target Service
 * Handles API calls for audience target configuration with enum arrays
 */

import { api } from '@/lib/api';
import type { AxiosError } from 'axios';

export interface AudienceTargetResponse {
  osot_target: string;
  osot_Table_Product: {
    id: string;
    productId: string;
    productCode: string;
  };
  
  // Account & Identity (5 fields)
  osot_account_group?: number[];
  osot_membership_gender?: number[];
  osot_indigenous_details?: number[];
  osot_membership_language?: number[];
  osot_membership_race?: number[];
  
  // Location (4 fields)
  osot_affiliate_city?: number[];
  osot_affiliate_province?: number[];
  osot_membership_city?: number[];
  osot_province?: number[];
  
  // Membership (3 fields)
  osot_affiliate_area?: number[];
  osot_eligibility_affiliate?: number[];
  osot_membership_category?: number[];
  
  // Employment (9 fields)
  osot_earnings?: number[];
  osot_earnings_selfdirect?: number[];
  osot_earnings_selfindirect?: number[];
  osot_employment_benefits?: number[];
  osot_employment_status?: number[];
  osot_position_funding?: number[];
  osot_practice_years?: number[];
  osot_role_description?: number[];
  osot_work_hours?: number[];
  
  // Practice (4 fields)
  osot_client_age?: number[];
  osot_practice_area?: number[];
  osot_practice_services?: number[];
  osot_practice_settings?: number[];
  
  // Preferences (4 fields)
  osot_membership_search_tools?: number[];
  osot_practice_promotion?: number[];
  osot_psychotherapy_supervision?: number[];
  osot_third_parties?: number[];
  
  // Education - OT (3 fields)
  osot_coto_status?: number[];
  osot_ot_grad_year?: number[];
  osot_ot_university?: number[];
  
  // Education - OTA (2 fields)
  osot_ota_grad_year?: number[];
  osot_ota_college?: number[];
  
  _links: {
    self: { href: string };
    product: { href: string };
  };
  createdOn: string;
  modifiedOn: string;
}

export interface UpdateAudienceTargetDto {
  // Account & Identity (5 fields)
  osot_account_group?: number[];
  osot_membership_gender?: number[];
  osot_indigenous_details?: number[];
  osot_membership_language?: number[];
  osot_membership_race?: number[];
  
  // Location (4 fields)
  osot_affiliate_city?: number[];
  osot_affiliate_province?: number[];
  osot_membership_city?: number[];
  osot_province?: number[];
  
  // Membership (3 fields)
  osot_affiliate_area?: number[];
  osot_eligibility_affiliate?: number[];
  osot_membership_category?: number[];
  
  // Employment (9 fields)
  osot_earnings?: number[];
  osot_earnings_selfdirect?: number[];
  osot_earnings_selfindirect?: number[];
  osot_employment_benefits?: number[];
  osot_employment_status?: number[];
  osot_position_funding?: number[];
  osot_practice_years?: number[];
  osot_role_description?: number[];
  osot_work_hours?: number[];
  
  // Practice (4 fields)
  osot_client_age?: number[];
  osot_practice_area?: number[];
  osot_practice_services?: number[];
  osot_practice_settings?: number[];
  
  // Preferences (4 fields)
  osot_membership_search_tools?: number[];
  osot_practice_promotion?: number[];
  osot_psychotherapy_supervision?: number[];
  osot_third_parties?: number[];
  
  // Education - OT (3 fields)
  osot_coto_status?: number[];
  osot_ot_grad_year?: number[];
  osot_ot_university?: number[];
  
  // Education - OTA (2 fields)
  osot_ota_grad_year?: number[];
  osot_ota_college?: number[];
}

class AudienceTargetService {
  /**
   * Get audience target by product GUID
   * @param productId - Product GUID (not business ID)
   */
  async getByProductId(productId: string): Promise<AudienceTargetResponse | null> {
    try {
      const response = await api.get<{ data: AudienceTargetResponse[] }>(
        `/private/audience-targets?productId=${productId}`
      );
      
      if (response.data.data && response.data.data.length > 0) {
        return response.data.data[0];
      }
      
      return null;
    } catch (error) {
      // Silently handle backend UUID validation error (known issue)
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as AxiosError<{ message?: unknown; error?: string; statusCode?: number }>;
        if (axiosError.response?.status !== 400) {
          // Only log non-validation errors
          console.error('❌ [audienceTargetService] Error fetching audience target:', {
            status: axiosError.response?.status,
            url: axiosError.config?.url,
            error: axiosError.response?.data,
          });
        }
      }
      throw error;
    }
  }

  /**
   * Get audience target by target ID
   * @param targetId - Target business ID (osot-target-XXXXXXX)
   */
  async getByTargetId(targetId: string): Promise<AudienceTargetResponse> {
    try {
      const response = await api.get<AudienceTargetResponse>(
        `/private/audience-targets/${targetId}`
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching audience target:', error);
      throw error;
    }
  }

  /**
   * Update audience target configuration
   * @param targetId - Target business ID (osot-target-XXXXXXX)
   * @param data - Configuration to update (arrays of enum values)
   */
  async update(targetId: string, data: UpdateAudienceTargetDto): Promise<AudienceTargetResponse> {
    try {
      // Build payload: convert undefined to null (clear field), keep empty arrays as null, keep populated arrays
      const payload: Record<string, number[] | null> = {};
      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined) {
          // Skip undefined (field not modified)
          return;
        }
        
        if (Array.isArray(value)) {
          if (value.length > 0) {
            // Has values - send the array
            payload[key] = value;
          } else {
            // Empty array - send null to clear the field
            payload[key] = null;
          }
        }
      });

      console.log('[audienceTargetService] PATCH payload:', payload);

      const response = await api.patch<AudienceTargetResponse>(
        `/private/audience-targets/${targetId}`,
        payload
      );
      
      return response.data;
    } catch (error) {
      console.error('Error updating audience target:', error);
      throw error;
    }
  }
}

export const audienceTargetService = new AudienceTargetService();
