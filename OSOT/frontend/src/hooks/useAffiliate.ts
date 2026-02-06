import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { affiliateService } from '@/services/affiliateService';
import type { Affiliate, UpdateAffiliateDto } from '@/types/affiliate';
import { useDelayedInvalidation } from './useDelayedInvalidation';

/**
 * Hook to fetch current affiliate data
 */
export function useAffiliate() {
  return useQuery<Affiliate>({
    queryKey: ['affiliate'],
    queryFn: affiliateService.getMyAffiliate,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}

/**
 * Hook to update affiliate data
 */
export function useUpdateAffiliate() {
  const queryClient = useQueryClient();
  const delayedInvalidation = useDelayedInvalidation();

  return useMutation({
    mutationFn: (data: UpdateAffiliateDto) => affiliateService.updateMyAffiliate(data),
    onSuccess: async () => {
      // Backend invalidates cache in 2-3 seconds
      await delayedInvalidation([['affiliate']]);
      // Force immediate refetch after invalidation
      await queryClient.refetchQueries({ queryKey: ['affiliate'] });
    },
  });
}
