/**
 * Education Hooks
 * React Query hooks for education data management
 * Automatically determines OT vs OTA based on account group
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { EducationResponse, UpdateEducationDto } from '@/types/education';
import { educationService } from '@/services/educationService';
import { useAccount } from './useAccount';

/**
 * Hook to fetch the current user's education information
 * Automatically uses correct endpoint based on account group
 */
export const useEducation = () => {
  const { data: account } = useAccount();
  
  return useQuery<EducationResponse | null>({
    queryKey: ['education', 'me', account?.osot_account_group],
    queryFn: async () => {
      console.log('🎣 [useEducation] Fetching education data for account group:', account?.osot_account_group);
      
      if (!account?.osot_account_group) {
        throw new Error('Account group not available');
      }
      const result = await educationService.getMyEducation(account.osot_account_group);
      
      console.log('🎣 [useEducation] Hook received result:', result);
      
      return result;
    },
    enabled: !!account?.osot_account_group,
    staleTime: 30 * 60 * 1000, // 30 minutes - education data rarely changes
    gcTime: 60 * 60 * 1000, // 1 hour - keep in cache
  });
};

/**
 * Hook to update the current user's education information
 * Automatically uses correct endpoint based on account group
 */
export const useUpdateEducation = () => {
  const queryClient = useQueryClient();
  const { data: account } = useAccount();

  return useMutation({
    mutationFn: (data: UpdateEducationDto) => {
      if (!account?.osot_account_group) {
        throw new Error('Account group not available');
      }
      return educationService.updateMyEducation(account.osot_account_group, data);
    },
    onSuccess: () => {
      // Invalidate and refetch education data
      queryClient.invalidateQueries({ queryKey: ['education', 'me'] });
    },
  });
};
