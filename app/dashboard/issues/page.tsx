'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { IssueFiltersState } from '@/components/dashboard/IssueFilters';
import { IssuesTable, CheckRun } from '@/components/dashboard/IssuesTable';
import { Pagination } from '@/components/ui/pagination';
import { SkeletonLoader } from '@/components/ui/loading-spinner';
import { SkeletonTable } from '@/components/ui/SkeletonTable';
import { colors } from '@/lib/design-system';
import { useToast } from '@/lib/hooks/useToast';
import { useCheckHistory } from '@/lib/hooks/useCheckHistory';

// Dynamically import IssueFilters component with loading state
const IssueFilters = dynamic(
  () => import('@/components/dashboard/IssueFilters').then((mod) => ({ default: mod.IssueFilters })),
  {
    loading: () => (
      <div 
        className="p-4 rounded-lg border" 
        style={{ borderColor: colors.text.secondary + '20', backgroundColor: colors.background.subtle }}
        role="status"
        aria-label="Loading filters"
      >
        <SkeletonLoader variant="card" />
      </div>
    ),
    ssr: false,
  }
);

export default function IssuesHistoryPage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<IssueFiltersState>({
    platform: 'all',
    repository: 'all',
    severity: 'all',
  });

  // Build query filters for TanStack Query
  const queryFilters = useMemo(() => ({
    page: currentPage,
    pageSize: 20,
    platform: filters.platform !== 'all' ? filters.platform : undefined,
    repository: filters.repository !== 'all' ? filters.repository : undefined,
    severity: filters.severity !== 'all' ? filters.severity : undefined,
  }), [currentPage, filters]);

  // Determine if we should enable polling (e.g., if there are active checks)
  const enablePolling = false; // Can be enhanced to detect active checks

  // Use TanStack Query hook for data fetching with caching and optional polling
  const { data, isLoading, error, isFetching } = useCheckHistory(queryFilters, enablePolling);

  /**
   * Effect: Display error toast when check history loading fails
   * Purpose: Provide user feedback for data fetching errors
   * Dependencies: error, isLoading, showToast
   * Note: Only runs when loading completes and an error exists
   */
  useEffect(() => {
    if (error && !isLoading) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to load check history',
      });
    }
  }, [error, isLoading, showToast]);

  // Memoize checkRuns to prevent unnecessary re-renders
  const checkRuns = useMemo(() => data?.checkRuns || [], [data?.checkRuns]);
  
  const pagination = data?.pagination || {
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  };

  // Extract unique repository names for filter dropdown
  const repositories = useMemo(() => {
    if (checkRuns.length > 0) {
      return Array.from(
        new Set(checkRuns.map((run: CheckRun) => run.repositoryName))
      ).sort() as string[];
    }
    return [];
  }, [checkRuns]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: IssueFiltersState) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to page 1 when filters change
  }, []);

  // Handle page changes
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Handle row click
  const handleRowClick = useCallback((checkRun: CheckRun) => {
    // Navigate to the check results page
    router.push(`/check/${checkRun.id}`);
  }, [router]);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 
            className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2"
            style={{ color: colors.text.primary }}
          >
            Issues History
          </h1>
          <p 
            className="text-sm sm:text-base lg:text-lg"
            style={{ color: colors.text.secondary }}
          >
            View and filter all compliance check runs across your repositories
          </p>
        </div>

        {/* Filters */}
        <div className="mb-4 sm:mb-6">
          <IssueFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            repositories={repositories}
          />
        </div>

        {/* Stale data indicator - shows when background revalidation is happening */}
        {isFetching && !isLoading && (
          <div 
            className="mb-4 p-2 rounded text-center text-sm"
            style={{ 
              backgroundColor: colors.primary.accent + '10',
              color: colors.primary.accent,
            }}
            role="status"
            aria-live="polite"
          >
            Updating check history...
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div role="status" aria-live="polite" aria-label="Loading check history">
            <SkeletonTable rows={5} columns={6} />
            <span className="sr-only">Loading check history...</span>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div 
            className="p-6 rounded-lg border text-center"
            style={{ 
              borderColor: colors.status.error,
              backgroundColor: colors.status.error + '10',
            }}
          >
            <p style={{ color: colors.status.error }} className="font-medium">
              {error instanceof Error ? error.message : 'Failed to load check history'}
            </p>
          </div>
        )}

        {/* Issues Table */}
        {!isLoading && !error && (
          <>
            <div className="mb-4 sm:mb-6 rounded-lg border overflow-hidden" style={{ borderColor: colors.text.secondary + '20' }}>
              <IssuesTable
                checkRuns={checkRuns}
                onRowClick={handleRowClick}
              />
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            )}

            {/* Results Summary */}
            {checkRuns.length > 0 && (
              <div className="mt-3 sm:mt-4 text-center">
                <p 
                  className="text-xs sm:text-sm"
                  style={{ color: colors.text.secondary }}
                >
                  Showing {checkRuns.length} of {pagination.total} check runs
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
