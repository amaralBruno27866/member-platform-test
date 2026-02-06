/**
 * Address Service
 * Handles all address-related API calls
 */

import { api } from '@/lib/api';
import type { AddressResponse, UpdateAddressDto, AddressApiResponse, AddressUpdateApiResponse } from '@/types/address';

export const addressService = {
  /**
   * Get my address information
   * GET /private/addresses/me
   * Returns array of addresses (currently only one)
   */
  getMyAddress: async (): Promise<AddressResponse | null> => {
    const response = await api.get<AddressApiResponse>('/private/addresses/me');
    // Backend returns array, we take the first one
    return response.data.data && response.data.data.length > 0 
      ? response.data.data[0] 
      : null;
  },

  /**
   * Update my address information
   * PATCH /private/addresses/me
   */
  updateMyAddress: async (data: UpdateAddressDto): Promise<AddressResponse> => {
    const response = await api.patch<AddressUpdateApiResponse>('/private/addresses/me', data);
    // Backend returns single updated address object
    return response.data.data;
  },
};
