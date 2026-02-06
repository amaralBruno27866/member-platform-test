/**
 * React Query Configuration
 * Optimized for profile data caching to reduce database calls
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Profile data is relatively static - cache for 15 minutes
      staleTime: 15 * 60 * 1000, // 15 minutes - data considered fresh
      gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache even if unused
      
      // Don't refetch on window focus - profile data doesn't change often
      refetchOnWindowFocus: false,
      
      // Don't refetch on mount if data exists - use cache
      refetchOnMount: false,
      
      // Don't refetch on reconnect - profile data is stable
      refetchOnReconnect: false,
      
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});
