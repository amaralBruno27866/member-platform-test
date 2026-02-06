import { api } from '@/lib/api';

/**
 * Admin Approval Service
 * 
 * Handles admin approval and rejection for both professional users (orchestrator)
 * and affiliate organizations. Processes approval/rejection tokens from admin notification emails.
 */

interface ApprovalResponse {
  success: boolean;
  message: string;
}

interface AffiliateApprovalRequest {
  action: 'approve' | 'reject';
  reason?: string;
}

/**
 * Approve professional user account (orchestrator)
 * Token-only endpoint - no body required
 * Uses GET method as specified in backend documentation
 */
export const approveAccount = async (
  approvalToken: string
): Promise<ApprovalResponse> => {
  const response = await api.get<ApprovalResponse>(
    `/public/orchestrator/admin/approve/${approvalToken}`
  );
  
  return response.data;
};

/**
 * Reject professional user account (orchestrator)
 * Token-only endpoint - no body required
 * Uses GET method as specified in backend documentation
 */
export const rejectAccount = async (
  rejectionToken: string
): Promise<ApprovalResponse> => {
  const response = await api.get<ApprovalResponse>(
    `/public/orchestrator/admin/reject/${rejectionToken}`
  );
  
  return response.data;
};

/**
 * Approve or reject affiliate organization
 * Requires action and optional reason in body
 */
export const approveAffiliate = async (
  approvalToken: string,
  reason?: string
): Promise<ApprovalResponse> => {
  const response = await api.post<ApprovalResponse>(
    `/public/affiliates/approve/${approvalToken}`,
    {
      action: 'approve',
      reason,
    } as AffiliateApprovalRequest
  );
  
  return response.data;
};

/**
 * Reject affiliate organization
 * Requires action and reason in body
 */
export const rejectAffiliate = async (
  rejectionToken: string,
  reason: string
): Promise<ApprovalResponse> => {
  const response = await api.post<ApprovalResponse>(
    `/public/affiliates/approve/${rejectionToken}`,
    {
      action: 'reject',
      reason,
    } as AffiliateApprovalRequest
  );
  
  return response.data;
};
