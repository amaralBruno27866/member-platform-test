/**
 * Identity Hooks
 * React Query hooks for identity data management
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import type { IdentityResponse, UpdateIdentityDto } from '@/types/identity';
import { identityService } from '@/services/identityService';
import { useDelayedInvalidation } from './useDelayedInvalidation';

/**
 * Hook to fetch the current user's identity information
 */
export const useIdentity = () => {
  return useQuery<IdentityResponse | null>({
    queryKey: ['identity', 'me'],
    queryFn: identityService.getMyIdentity,
    staleTime: 30 * 60 * 1000, // 30 minutes - identity data rarely changes
    gcTime: 60 * 60 * 1000, // 1 hour - keep in cache
  });
};

/**
 * Hook to update the current user's identity information
 */
export const useUpdateIdentity = () => {
  const queryClient = useQueryClient();
  const delayedInvalidation = useDelayedInvalidation();

  return useMutation({
    mutationFn: (data: UpdateIdentityDto) => identityService.updateMyIdentity(data),
    onSuccess: async () => {
      // Backend invalidates cache in 2-3 seconds
      await delayedInvalidation([['identity', 'me']]);
      // Force immediate refetch after invalidation
      await queryClient.refetchQueries({ queryKey: ['identity', 'me'] });
    },
  });
};;
