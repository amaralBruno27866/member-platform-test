/**
 * Address Hooks
 * React Query hooks for address management
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { addressService } from '@/services/addressService';
import type { UpdateAddressDto } from '@/types/address';
import toast from 'react-hot-toast';
import { useDelayedInvalidation } from './useDelayedInvalidation';

/**
 * Hook to fetch current user's address
 */
export const useAddress = () => {
  return useQuery({
    queryKey: ['address', 'me'],
    queryFn: addressService.getMyAddress,
    staleTime: 30 * 60 * 1000, // 30 minutes - address data rarely changes
    gcTime: 60 * 60 * 1000, // 1 hour - keep in cache
    retry: 1,
  });
};

/**
 * Hook to update current user's address
 */
export const useUpdateAddress = () => {
  const queryClient = useQueryClient();
  const delayedInvalidation = useDelayedInvalidation();

  return useMutation({
    mutationFn: (data: UpdateAddressDto) => addressService.updateMyAddress(data),
    onSuccess: async () => {
      toast.success('Address updated successfully!');
      // Backend invalidates cache in 2-3 seconds
      await delayedInvalidation([['address', 'me']]);
      // Force immediate refetch after invalidation
      await queryClient.refetchQueries({ queryKey: ['address', 'me'] });
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Failed to update address');
    },
  });
};
