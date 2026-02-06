import { useQuery } from '@tanstack/react-query';
import { membershipSettingsService, type MembershipExpiration } from '@/services/membershipSettingsService';

/**
 * Hook to fetch membership expiration information
 */
export function useMembershipExpiration() {
  return useQuery<MembershipExpiration | undefined>({
    queryKey: ['membership-expiration'],
    queryFn: async () => {
      try {
        return await membershipSettingsService.getMyExpiration();
      } catch (error: any) {
        // If user is inactive (404), return undefined instead of throwing
        if (error?.response?.status === 404 || error?.message?.includes('active membership')) {
          return undefined;
        }
        throw error;
      }
    },
    staleTime: 0, // Always fetch fresh data to catch membership status updates
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on 404
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
}

/**
 * Calculate renewal color based on days remaining
 * @param daysRemaining - Days until expiration
 * @returns Color class for text
 */
export function getRenewalColor(daysRemaining: number): string {
  if (daysRemaining >= 100) return 'text-green-600';   // 100+ days = Green
  if (daysRemaining >= 60) return 'text-yellow-600';   // 60-99 days = Yellow
  if (daysRemaining >= 30) return 'text-brand-600';    // 30-59 days = Orange
  return 'text-red-600';                                // 0-29 days = Red
}

/**
 * Format days remaining into a readable string
 * @param days - Number of days
 * @returns Formatted string (e.g., "45 days", "1 day", "Expired")
 */
export function formatDaysRemaining(days: number): string {
  if (days < 0) return 'Expired';
  if (days === 0) return 'Expires today';
  if (days === 1) return '1 day';
  return `${days} days`;
}

/**
 * Check if renewal days should be displayed based on membership status
 * @param membershipExpiration - Membership expiration data
 * @returns True if days should be shown, false otherwise
 */
export function shouldShowRenewalDays(membershipExpiration: MembershipExpiration | undefined): boolean {
  if (!membershipExpiration) return false;
  return membershipExpiration.status.toLowerCase() === 'active';
}
