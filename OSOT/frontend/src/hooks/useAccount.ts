/**
 * Account Hooks
 * React Query hooks for account management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountService } from '@/services/accountService';
import type { UpdateAccountDto } from '@/types/account';
import toast from 'react-hot-toast';
import { useDelayedInvalidation } from './useDelayedInvalidation';

/**
 * Hook to fetch current user's account
 */
export const useAccount = () => {
  return useQuery({
    queryKey: ['account', 'me'],
    queryFn: accountService.getMyAccount,
    staleTime: 0, // Always fetch fresh data (no cache) to catch membership status updates
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache for a short time
    retry: 1,
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
};

/**
 * Hook to update current user's account
 */
export const useUpdateAccount = () => {
  const queryClient = useQueryClient();
  const delayedInvalidation = useDelayedInvalidation();

  return useMutation({
    mutationFn: (data: UpdateAccountDto) => accountService.updateMyAccount(data),
    onSuccess: async () => {
      toast.success('Account updated successfully!');
      // Backend invalidates cache in 2-3 seconds, so we delay refetch
      await delayedInvalidation([['account', 'me']]);
      // Force immediate refetch after invalidation
      await queryClient.refetchQueries({ queryKey: ['account', 'me'] });
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Failed to update account');
    },
  });
};
