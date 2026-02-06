/**
 * User Profile Hook with React Query Cache
 * Prevents multiple simultaneous API calls to /api/accounts/me
 */

import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import type { UserProfile } from '@/utils/userPermissions';

export function useUserProfile(): UseQueryResult<UserProfile | null, Error> {
  return useQuery<UserProfile | null>({
    queryKey: ['userProfile'],
    queryFn: async () => {
      console.log('📞 [useUserProfile] Fetching profile...');
      
      try {
        const profile = await authService.fetchUserProfile();
        console.log('✅ [useUserProfile] Profile fetched:', {
          first_name: profile.osot_first_name,
          email: profile.osot_email,
          account_group: profile.osot_account_group,
          privilege: profile.osot_privilege,
        });
        return profile;
      } catch (error) {
        console.error('❌ [useUserProfile] Fetch failed:', error);
        
        // FALLBACK: Use basic user data from sessionStorage
        const basicUser = authService.getCurrentUser();
        if (basicUser) {
          console.log('⚠️ [useUserProfile] Using fallback from sessionStorage');
          return {
            osot_first_name: basicUser.osot_first_name || 'User',
            osot_last_name: basicUser.osot_last_name || '',
            osot_email: basicUser.osot_email || basicUser.email || 'user@email.com',
            osot_account_group: 0,
            osot_privilege: authService.getUserPrivilege() || 1,
          } as UserProfile;
        }
        
        console.error('❌ [useUserProfile] No fallback available');
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in memory for 10 minutes (previously cacheTime)
    retry: 1, // Only retry once on failure
    enabled: authService.isAuthenticated(), // Only run if user is authenticated
  });
}
