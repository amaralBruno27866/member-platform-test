/**
 * Membership Settings Service
 * Handles API calls for membership settings
 */

import { api } from '@/lib/api';

const API_URL = import.meta.env.VITE_API_URL;

export interface MembershipExpiration {
  expiresDate: string; // YYYY-MM-DD
  daysRemaining: number;
  membershipYear: string;
  category: string;
  status: string;
  requiresRenewal: boolean;
}

class MembershipSettingsService {
  /**
   * Get current user's membership expiration information
   */
  async getMyExpiration(): Promise<MembershipExpiration> {
    // Token is automatically added by api interceptor (from sessionStorage)
    const response = await api.get<MembershipExpiration>(
      `${API_URL}/private/membership-settings/my-expiration`
    );

    return response.data;
  }
}

export const membershipSettingsService = new MembershipSettingsService();
