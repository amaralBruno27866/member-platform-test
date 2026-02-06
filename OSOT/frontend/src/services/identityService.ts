/**
 * Identity Service
 * Handles API calls for identity operations
 * Endpoint: /private/identities
 */

import { api } from '@/lib/api';
import type {
  IdentityResponse,
  UpdateIdentityDto,
  IdentityApiResponse,
  IdentityUpdateApiResponse,
} from '@/types/identity';

/**
 * Get the current user's identity information
 * Returns first identity from array or null if empty
 */
export const getMyIdentity = async (): Promise<IdentityResponse | null> => {
  const response = await api.get<IdentityApiResponse>('/private/identities/me');
  
  // Backend returns array, take first element
  const identities = response.data.data;
  return identities && identities.length > 0 ? identities[0] : null;
};

/**
 * Update the current user's identity information
 * Returns updated single identity object
 */
export const updateMyIdentity = async (
  data: UpdateIdentityDto
): Promise<IdentityResponse> => {
  const response = await api.patch<IdentityUpdateApiResponse>(
    '/private/identities/me',
    data
  );
  
  // Backend returns single object for PATCH
  return response.data.data;
};

export const identityService = {
  getMyIdentity,
  updateMyIdentity,
};
