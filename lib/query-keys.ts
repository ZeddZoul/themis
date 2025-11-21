/**
 * Hierarchical query key factory for TanStack Query
 * Provides typed query keys for all data fetching operations
 */

export interface RepositoryFilters {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface CheckFilters {
  page?: number;
  pageSize?: number;
  platform?: string;
  repository?: string;
  severity?: string;
}

/**
 * Query keys structure for TanStack Query
 * Organized hierarchically for better cache management and invalidation
 */
export const queryKeys = {
  repositories: {
    all: ['repositories'] as const,
    list: (filters?: RepositoryFilters) => ['repositories', 'list', filters] as const,
    detail: (id: number) => ['repositories', 'detail', id] as const,
    reports: (id: number) => ['repositories', 'reports', id] as const,
  },
  checks: {
    all: ['checks'] as const,
    running: ['checks', 'running'] as const,
    recentlyCompleted: ['checks', 'recently-completed'] as const,
    history: (filters?: CheckFilters) => ['checks', 'history', filters] as const,
    detail: (id: string) => ['checks', 'detail', id] as const,
  },
  stats: {
    all: ['stats'] as const,
    dashboard: ['stats', 'dashboard'] as const,
  },
  user: {
    all: ['user'] as const,
    me: ['user', 'me'] as const,
  },
} as const;
