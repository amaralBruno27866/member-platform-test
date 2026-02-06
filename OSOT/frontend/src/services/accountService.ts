/**
 * Account Service
 * Handles all account-related API calls
 */

import { api } from '@/lib/api';
import type { AccountResponse, UpdateAccountDto, ChangePasswordDto, AccountApiResponse } from '@/types/account';

export const accountService = {
  /**
   * Get my account information
   * GET /private/accounts/me
   */
  getMyAccount: async (): Promise<AccountResponse> => {
    const response = await api.get<AccountApiResponse>('/private/accounts/me');
    return response.data.data; // Extract data from wrapper
  },

  /**
   * Update my account information
   * PATCH /private/accounts/me
   */
  updateMyAccount: async (data: UpdateAccountDto): Promise<AccountResponse> => {
    const response = await api.patch<AccountApiResponse>('/private/accounts/me', data);
    return response.data.data; // Extract data from wrapper
  },

  /**
   * Change password
   * PATCH /private/accounts/me
   * Note: Backend should validate current password before allowing change
   */
  changePassword: async (data: ChangePasswordDto): Promise<AccountResponse> => {
    const response = await api.patch<AccountApiResponse>('/private/accounts/me', data);
    return response.data.data; // Extract data from wrapper
  },
};
