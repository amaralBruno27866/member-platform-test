/**
 * Contact Service
 * Handles API calls for contact operations
 * Endpoint: /private/contacts
 */

import { api } from '@/lib/api';
import type {
  ContactResponse,
  UpdateContactDto,
  ContactApiResponse,
  ContactUpdateApiResponse,
} from '@/types/contact';

/**
 * Get the current user's contact information
 * Returns first contact from array or null if empty
 */
export const getMyContact = async (): Promise<ContactResponse | null> => {
  const response = await api.get<ContactApiResponse>('/private/contacts/me');
  
  // Backend returns array, take first element
  const contacts = response.data.data;
  return contacts && contacts.length > 0 ? contacts[0] : null;
};

/**
 * Update the current user's contact information
 * Returns updated single contact object
 */
export const updateMyContact = async (
  data: UpdateContactDto
): Promise<ContactResponse> => {
  const response = await api.patch<ContactUpdateApiResponse>(
    '/private/contacts/me',
    data
  );
  
  // Backend returns single object for PATCH
  return response.data.data;
};

export const contactService = {
  getMyContact,
  updateMyContact,
};
