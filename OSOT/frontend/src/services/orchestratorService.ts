/**
 * Orchestrator Service - Complete User Registration
 * Handles the complete user registration workflow through the orchestrator API
 */

import { api } from '../lib/api';
import { getOrganizationSlug } from '@/utils/getOrganizationSlug';

export interface CompleteUserRegistrationData {
  organizationSlug?: string;
  account: {
    osot_first_name: string;
    osot_last_name: string;
    osot_date_of_birth: string;
    osot_mobile_phone: string;
    osot_email: string;
    osot_password: string;
    osot_account_group: number;
    osot_account_declaration: boolean;
  };
  address: {
    osot_address_1: string;
    osot_address_2?: string;
    osot_city: number;
    osot_province: number;
    osot_postal_code: string;
    osot_country: number;
    osot_address_type: number;
    osot_address_preference?: number[];
    osot_other_city?: string;
    osot_other_province_state?: string;
  };
  contact: {
    osot_secondary_email?: string;
    osot_job_title?: string;
    osot_home_phone?: string;
    osot_work_phone?: string;
    osot_business_website?: string;
    osot_facebook?: string;
    osot_instagram?: string;
    osot_tiktok?: string;
    osot_linkedin?: string;
  };
  identity: {
    osot_chosen_name?: string;
    osot_language: number[];
    osot_gender?: number;
    osot_race?: number;
    osot_indigenous?: boolean;
    osot_indigenous_detail?: number;
    osot_indigenous_detail_other?: string;
    osot_disability?: boolean;
  };
  educationType: 'ot' | 'ota';
  otEducation?: {
    osot_coto_status: number;
    osot_coto_registration?: string;
    osot_ot_degree_type: number;
    osot_ot_university: number;
    osot_ot_grad_year: number;
    osot_ot_country: number;
    osot_ot_other?: string;
  };
  otaEducation?: {
    osot_work_declaration: boolean;
    osot_ota_degree_type?: number;
    osot_ota_college?: number;
    osot_ota_grad_year?: number;
    osot_ota_country?: number;
    osot_ota_other?: string;
  };
  management?: {
    osot_life_member_retired?: boolean;
    osot_shadowing?: boolean;
    osot_passed_away?: boolean;
    osot_vendor?: boolean;
    osot_advertising?: boolean;
    osot_recruitment?: boolean;
    osot_driver_rehab?: boolean;
  };
}

export interface OrchestratorResponse {
  success: boolean;
  sessionId: string;
  status: string;
  message: string;
  timestamp: string;
  validationErrors?: unknown[];
  progress?: {
    completedSteps: string[];
    currentStep: string;
    totalSteps: number;
  };
  nextSteps?: string[];
}

class OrchestratorService {
  private baseUrl = '/public/orchestrator';

  /**
   * Initiate complete user registration
   */
  async register(
    data: CompleteUserRegistrationData,
    skipEmailVerification = false,
  ): Promise<OrchestratorResponse> {
    // Automatically add organization slug if not provided
    const registrationData = {
      ...data,
      organizationSlug: data.organizationSlug || getOrganizationSlug(),
    };
    
    const url = `${this.baseUrl}/register${skipEmailVerification ? '?skipEmailVerification=true' : ''}`;
    const response = await api.post<OrchestratorResponse>(url, registrationData);
    return response.data;
  }

  /**
   * Get registration status
   */
  async getStatus(sessionId: string): Promise<OrchestratorResponse> {
    const response = await api.get<OrchestratorResponse>(`${this.baseUrl}/status/${sessionId}`);
    return response.data;
  }

  /**
   * Verify email
   */
  async verifyEmail(
    sessionId: string,
    verificationToken: string,
  ): Promise<OrchestratorResponse> {
    const response = await api.post<OrchestratorResponse>(`${this.baseUrl}/verify-email`, {
      sessionId,
      verificationToken,
    });
    return response.data;
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(sessionId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await api.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/resend-verification/${sessionId}`
    );
    return response.data;
  }

  /**
   * Execute entity creation (after admin approval)
   */
  async executeEntityCreation(sessionId: string): Promise<OrchestratorResponse> {
    const response = await api.post<OrchestratorResponse>(
      `${this.baseUrl}/execute/${sessionId}`
    );
    return response.data;
  }

  /**
   * Get email workflow status
   */
  async getEmailWorkflowStatus(sessionId: string): Promise<unknown> {
    const response = await api.get(`${this.baseUrl}/email-status/${sessionId}`);
    return response.data;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: string;
    service: string;
    timestamp: string;
    version: string;
    features: Record<string, boolean>;
  }> {
    const response = await api.get<{
      status: string;
      service: string;
      timestamp: string;
      version: string;
      features: Record<string, boolean>;
    }>(`${this.baseUrl}/health`);
    return response.data;
  }
}

export const orchestratorService = new OrchestratorService();
