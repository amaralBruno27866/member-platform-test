/**
 * Affiliate Service - API client for affiliate registration and private operations
 * Following FRONTEND_INTEGRATION_GUIDE.md patterns
 */

import { api } from '@/lib/api';
import type { Affiliate, UpdateAffiliateDto } from '@/types/affiliate';

const API_URL = import.meta.env.VITE_API_URL;

export interface AffiliateRegistrationData {
  osot_affiliate_name: string;
  osot_affiliate_area: number;
  osot_representative_first_name: string;
  osot_representative_last_name: string;
  osot_representative_job_title: string;
  osot_affiliate_email: string;
  osot_affiliate_phone: string;
  osot_affiliate_website?: string;
  osot_affiliate_address_1: string;
  osot_affiliate_address_2?: string;
  osot_affiliate_city: number;
  osot_affiliate_province: number;
  osot_affiliate_postal_code: string;
  osot_affiliate_country: number;
  osot_password: string;
  osot_account_declaration: boolean;
}

export interface AffiliateRegistrationResponse {
  success: boolean;
  message: string;
  sessionId: string;
  status: string;
  nextStep: string;
  expiresAt?: Date;
  verificationEmailSent?: boolean;
}

class AffiliateService {
  private baseUrl = `${API_URL}/public/affiliates`;

  // Registration methods (public)
  async register(data: AffiliateRegistrationData): Promise<AffiliateRegistrationResponse> {
    const response = await api.post<AffiliateRegistrationResponse>(
      `${this.baseUrl}/register`,
      data
    );
    return response.data;
  }

  async getStatus(sessionId: string): Promise<unknown> {
    const response = await api.get(`${this.baseUrl}/status/${sessionId}`);
    return response.data;
  }

  async verifyEmail(token: string, email: string): Promise<unknown> {
    const response = await api.post(`${this.baseUrl}/verify-email`, {
      token,
      email,
    });
    return response.data;
  }

  // Private methods (authenticated)
  /**
   * Get current affiliate information
   */
  async getMyAffiliate(): Promise<Affiliate> {
    // Token is automatically added by api interceptor (from sessionStorage)
    const response = await api.get<Affiliate>(
      `${API_URL}/private/affiliates/me`
    );

    return response.data;
  }

  /**
   * Update current affiliate information
   */
  async updateMyAffiliate(data: UpdateAffiliateDto): Promise<Affiliate> {
    // Token is automatically added by api interceptor (from sessionStorage)
    const response = await api.patch<Affiliate>(
      `${API_URL}/private/affiliates/me`,
      data
    );

    return response.data;
  }
}

export const affiliateService = new AffiliateService();
