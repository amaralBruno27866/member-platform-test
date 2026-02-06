/**
 * Contact Hooks
 * React Query hooks for contact data management
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import type { ContactResponse, UpdateContactDto } from '@/types/contact';
import { contactService } from '@/services/contactService';
import { useDelayedInvalidation } from './useDelayedInvalidation';

/**
 * Hook to fetch the current user's contact information
 */
export const useContact = () => {
  return useQuery<ContactResponse | null>({
    queryKey: ['contact', 'me'],
    queryFn: contactService.getMyContact,
    staleTime: 30 * 60 * 1000, // 30 minutes - contact data rarely changes
    gcTime: 60 * 60 * 1000, // 1 hour - keep in cache
  });
};

/**
 * Hook to update the current user's contact information
 */
export const useUpdateContact = () => {
  const queryClient = useQueryClient();
  const delayedInvalidation = useDelayedInvalidation();

  return useMutation({
    mutationFn: (data: UpdateContactDto) => contactService.updateMyContact(data),
    onSuccess: async () => {
      // Backend invalidates cache in 2-3 seconds
      await delayedInvalidation([['contact', 'me']]);
      // Force immediate refetch after invalidation
      await queryClient.refetchQueries({ queryKey: ['contact', 'me'] });
    },
  });
};
