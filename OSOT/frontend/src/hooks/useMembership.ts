/**
 * Membership Hooks
 * React Query hooks for membership data management
 */

import { useQuery } from '@tanstack/react-query';
import type {
  MembershipCategory,
  MembershipEmployment,
  MembershipPractices,
  MembershipPreferences,
  MembershipData,
} from '@/types/membership';
import { membershipService } from '@/services/membershipService';

/**
 * Hook to fetch membership category
 */
export const useMembershipCategory = () => {
  return useQuery<MembershipCategory | null>({
    queryKey: ['membership', 'category', 'me'],
    queryFn: () => membershipService.getMyCategory(),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
};

/**
 * Hook to fetch membership employment
 */
export const useMembershipEmployment = () => {
  return useQuery<MembershipEmployment | null>({
    queryKey: ['membership', 'employment', 'me'],
    queryFn: () => membershipService.getMyEmployment(),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
};

/**
 * Hook to fetch membership practices
 */
export const useMembershipPractices = () => {
  return useQuery<MembershipPractices | null>({
    queryKey: ['membership', 'practices', 'me'],
    queryFn: () => membershipService.getMyPractices(),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
};

/**
 * Hook to fetch membership preferences
 */
export const useMembershipPreferences = () => {
  return useQuery<MembershipPreferences | null>({
    queryKey: ['membership', 'preferences', 'me'],
    queryFn: () => membershipService.getMyPreferences(),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
};

/**
 * Hook to fetch all membership data at once
 */
export const useAllMembershipData = () => {
  return useQuery<MembershipData>({
    queryKey: ['membership', 'all', 'me'],
    queryFn: () => membershipService.getAllMyMembershipData(),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
};
