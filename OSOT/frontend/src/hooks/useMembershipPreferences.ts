import { useQuery } from '@tanstack/react-query';
import { membershipService, type MembershipPreferences } from '@/services/membershipService';

/**
 * Hook to fetch current user's membership preferences
 * Returns null if user never had membership (no record in membership-preferences)
 */
export function useMembershipPreferences() {
  return useQuery<MembershipPreferences | null>({
    queryKey: ['membership-preferences'],
    queryFn: membershipService.getMyPreferences,
    staleTime: 0, // Always fetch fresh data
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
}
