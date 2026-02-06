/**
 * Delayed Invalidation Hook
 * Implements backend cache invalidation pattern (2-3 seconds delay)
 * 
 * When the backend invalidates cache after UPDATE/DELETE operations,
 * this hook waits for ~2.5 seconds before triggering React Query refetch.
 * This aligns with the backend's cache invalidation timing.
 */

import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook to perform delayed query invalidation
 * Waits 2.5 seconds (backend cache invalidation time) before invalidating React Query
 */
export const useDelayedInvalidation = () => {
  const queryClient = useQueryClient();

  /**
   * Invalidate one or multiple queries with a 2.5 second delay
   * @param queryKeys Array of query keys to invalidate
   */
  return async (queryKeys: (string | string[])[]) => {
    // Wait for backend to invalidate its cache (~2.5 seconds)
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Invalidate React Query cache
    for (const queryKey of queryKeys) {
      await queryClient.invalidateQueries({ queryKey: Array.isArray(queryKey) ? queryKey : [queryKey] });
    }
  };
};
