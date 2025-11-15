import { useQuery } from '@tanstack/react-query';
import { queryKeys, RepositoryFilters } from '@/lib/query-keys';

type RepositoryStatus = 'success' | 'warning' | 'error' | 'none' | 'failed';

export interface Repository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: any;
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  lastCheckStatus: RepositoryStatus;
  lastCheckDate?: Date;
  issueCount?: number;
  errorType?: string | null;
  errorMessage?: string | null;
  errorDetails?: string | null;
}

export interface RepositoriesResponse {
  repositories: Repository[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  error?: string;
  needsInstallation?: boolean;
}

async function fetchRepositories(filters?: RepositoryFilters): Promise<RepositoriesResponse> {
  const params = new URLSearchParams();
  
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());
  if (filters?.search) params.append('search', filters.search);

  const response = await fetch(`/api/v1/repositories?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch repositories');
  }
  
  return response.json();
}

/**
 * Hook for fetching repositories with caching and filters
 * Uses TanStack Query for automatic caching and background revalidation
 */
export function useRepositories(filters?: RepositoryFilters) {
  return useQuery({
    queryKey: queryKeys.repositories.list(filters),
    queryFn: () => fetchRepositories(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
