import { useQuery } from '@tanstack/react-query';
import { queryKeys, CheckFilters } from '@/lib/query-keys';

type Platform = 'APPLE_APP_STORE' | 'GOOGLE_PLAY_STORE' | 'CHROME_WEB_STORE' | 'MOBILE_PLATFORMS';
type Severity = 'high' | 'medium' | 'low' | 'none';

export interface CheckRun {
  id: string;
  repositoryName: string;
  platforms: Platform[];
  checkDate: Date;
  highestSeverity: Severity;
  totalIssues: number;
}

export interface CheckHistoryResponse {
  checkRuns: CheckRun[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

async function fetchCheckHistory(filters?: CheckFilters): Promise<CheckHistoryResponse> {
  const params = new URLSearchParams();
  
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());
  if (filters?.platform) params.append('platform', filters.platform);
  if (filters?.repository) params.append('repository', filters.repository);
  if (filters?.severity) params.append('severity', filters.severity);

  const response = await fetch(`/api/v1/checks/history?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch check history');
  }
  
  return response.json();
}

/**
 * Hook for fetching check history with optional polling
 * No caching - always fetches fresh data
 * 
 * @param filters - Filters for check history
 * @param enablePolling - Enable automatic polling every 30 seconds
 */
export function useCheckHistory(filters?: CheckFilters, enablePolling = false) {
  return useQuery({
    queryKey: queryKeys.checks.history(filters),
    queryFn: () => fetchCheckHistory(filters),
    staleTime: 0, // No caching - always fetch fresh data
    gcTime: 0, // No garbage collection time - don't keep old data
    refetchInterval: enablePolling ? 30 * 1000 : false,
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Always refetch on mount
  });
}
