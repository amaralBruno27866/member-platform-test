/**
 * Membership Service
 * Handles API calls for all membership-related entities
 */

import { api } from '@/lib/api';
import type {
  MembershipCategory,
  MembershipEmployment,
  MembershipPractices,
  MembershipPreferences,
  MembershipData,
} from '@/types/membership';

const API_URL = import.meta.env.VITE_API_URL;

class MembershipService {
  /**
   * Get current user's membership category information
   */
  async getMyCategory(): Promise<MembershipCategory | null> {
    try {
      const response = await api.get<MembershipCategory[]>(
        `${API_URL}/private/membership-categories/me`
      );
      // Backend returns array, take first element
      return response.data[0] || null;
    } catch (error: any) {
      // Handle 404 - user doesn't have category for current year
      if (error.response?.status === 404 || error.response?.status === 400) {
        console.log('No membership category found for current year');
        return null;
      }
      console.error('Error fetching membership category:', error);
      return null;
    }
  }

  /**
   * Get current user's membership employment information
   */
  async getMyEmployment(): Promise<MembershipEmployment | null> {
    try {
      const response = await api.get<MembershipEmployment[]>(
        `${API_URL}/private/membership-employments/me`
      );
      // Backend returns array, take first element
      return response.data[0] || null;
    } catch (error: any) {
      // Handle 404 - user doesn't have employment for current year
      if (error.response?.status === 404 || error.response?.status === 400) {
        console.log('No membership employment found for current year');
        return null;
      }
      console.error('Error fetching membership employment:', error);
      return null;
    }
  }

  /**
   * Get current user's membership practices information
   */
  async getMyPractices(): Promise<MembershipPractices | null> {
    try {
      const response = await api.get<MembershipPractices[]>(
        `${API_URL}/private/membership-practices/me`
      );
      // Backend returns array, take first element
      return response.data[0] || null;
    } catch (error: any) {
      // Handle 404 - user doesn't have practices for current year
      if (error.response?.status === 404 || error.response?.status === 400) {
        console.log('No membership practices found for current year');
        return null;
      }
      console.error('Error fetching membership practices:', error);
      return null;
    }
  }

  /**
   * Get current user's membership preferences information
   */
  async getMyPreferences(): Promise<MembershipPreferences | null> {
    try {
      const response = await api.get<MembershipPreferences[]>(
        `${API_URL}/private/membership-preferences/me`
      );
      // Backend returns array, take first element
      return response.data[0] || null;
    } catch (error: any) {
      // Handle 404 - user doesn't have preferences for current year
      if (error.response?.status === 404 || error.response?.status === 400) {
        console.log('No membership preferences found for current year');
        return null;
      }
      console.error('Error fetching membership preferences:', error);
      return null;
    }
  }

  /**
   * Get all membership data for current user
   * Combines all 4 entities into a single response
   */
  async getAllMyMembershipData(): Promise<MembershipData> {
    try {
      // Fetch all 4 entities in parallel
      const [category, employment, practices, preferences] = await Promise.all([
        this.getMyCategory(),
        this.getMyEmployment(),
        this.getMyPractices(),
        this.getMyPreferences(),
      ]);

      return {
        category,
        employment,
        practices,
        preferences,
        hasActiveMembership: category !== null,
      };
    } catch (error) {
      console.error('Error fetching all membership data:', error);
      return {
        category: null,
        employment: null,
        practices: null,
        preferences: null,
        hasActiveMembership: false,
      };
    }
  }
}

export const membershipService = new MembershipService();
