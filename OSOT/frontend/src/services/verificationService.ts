import { api } from '@/lib/api';

/**
 * Verification Service
 * 
 * Handles email verification for both professional users and affiliate organizations.
 * Processes verification tokens sent via email links.
 */

interface VerificationRequest {
  sessionId: string;
  verificationToken: string;
}

interface VerificationResponse {
  success: boolean;
  message: string;
  sessionId?: string;
  status?: string;
}

/**
 * Verify email for professional user (orchestrator)
 */
export const verifyEmail = async (
  sessionId: string,
  verificationToken: string
): Promise<VerificationResponse> => {
  const response = await api.post<VerificationResponse>(
    '/public/orchestrator/verify-email',
    {
      sessionId,
      verificationToken,
    } as VerificationRequest
  );
  
  return response.data;
};

/**
 * Verify email for affiliate organization
 */
export const verifyAffiliateEmail = async (
  sessionId: string,
  verificationToken: string
): Promise<VerificationResponse> => {
  const response = await api.post<VerificationResponse>(
    '/public/affiliates/verify-email',
    {
      sessionId,
      verificationToken,
    } as VerificationRequest
  );
  
  return response.data;
};
