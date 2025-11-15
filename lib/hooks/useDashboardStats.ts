import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

export interface DashboardStats {
  totalRepositories: number;
  pendingIssues: number;
  recentChecks: number;
  complianceRate: number;
  trends: {
    repositories: { value: number; direction: 'up' | 'down' };
    issues: { value: number; direction: 'up' | 'down' };
  };
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await fetch('/api/v1/stats/dashboard');
  
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard statistics');
  }
  
  return response.json();
}

interface UseDashboardStatsOptions {
  initialData?: DashboardStats;
}

/**
 * Hook for fetching dashboard statistics
 * Uses shorter stale time (30 seconds) for more up-to-date stats
 * Accepts initialData from Server Component for faster initial render
 */
export function useDashboardStats(options?: UseDashboardStatsOptions) {
  return useQuery({
    queryKey: queryKeys.stats.dashboard,
    queryFn: fetchDashboardStats,
    staleTime: 30 * 1000, // 30 seconds
    initialData: options?.initialData,
  });
}
