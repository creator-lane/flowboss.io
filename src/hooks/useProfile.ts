import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface UserProfile {
  id: string;
  business_name?: string;
  trade?: string;
  team_size?: string;
  business_role?: string; // 'gc' | 'sub' | 'both'
  priorities?: string[];
  phone?: string;
  zip?: string;
  email?: string;
}

/**
 * Shared hook — fetches the current user's profile once and caches it.
 * Every page that needs to personalise UX reads from this single query.
 */
export function useProfile() {
  const { data, isLoading, error } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await api.getSettings();
      return res.data as UserProfile;
    },
    staleTime: 5 * 60 * 1000, // 5 min — profile rarely changes
  });

  const isGC = data?.business_role === 'gc' || data?.business_role === 'both';
  const isSub = data?.business_role === 'sub' || data?.business_role === 'both';
  const isSolo = data?.team_size === 'solo';
  const priorities = data?.priorities || [];

  return {
    profile: data ?? null,
    isLoading,
    error,
    /** User manages GC projects */
    isGC,
    /** User works as a sub on GC projects */
    isSub,
    /** Solo operator (no crew) */
    isSolo,
    /** Ordered priority list from onboarding */
    priorities,
    /** Check if a specific priority was selected */
    hasPriority: (p: string) => priorities.includes(p),
  };
}
