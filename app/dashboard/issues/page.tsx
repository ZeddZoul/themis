'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { IssueFiltersState } from '@/components/dashboard/IssueFilters';
import { IssuesTable, CheckRun } from '@/components/dashboard/IssuesTable';
import { SkeletonLoader } from '@/components/ui/loading-spinner';
import { SkeletonTable } from '@/components/ui/SkeletonTable';
import { colors } from '@/lib/design-system';
import { useToast } from '@/lib/hooks/useToast';
import { useCheckHistory } from '@/lib/hooks/useCheckHistory';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

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
  const queryClient = useQueryClient();
  
  const [filters, setFilters] = useState<IssueFiltersState>({
    platform: 'all',
    repository: 'all',
    severity: 'all',
  });
  
  // Local state for check runs (updated directly after delete)
  const [localCheckRuns, setLocalCheckRuns] = useState<CheckRun[] | null>(null);
  
  // Build query filters for TanStack Query
  const queryFilters = useMemo(() => ({
    page: 1, // Always fetch page 1 since we're paginating client-side now
    pageSize: 1000, // Fetch more data for client-side pagination
    platform: filters.platform !== 'all' ? filters.platform : undefined,
    repository: filters.repository !== 'all' ? filters.repository : undefined,
    severity: filters.severity !== 'all' ? filters.severity : undefined,
  }), [filters]);

  // Determine if we should enable polling (e.g., if there are active checks)
  const enablePolling = false; // Can be enhanced to detect active checks

  // Use TanStack Query hook for data fetching without caching
  const { data, isLoading, error, isFetching } = useCheckHistory(queryFilters, enablePolling);

  // Use local state if available (after delete), otherwise use server data
  const checkRuns = useMemo(() => {
    return localCheckRuns !== null ? localCheckRuns : (data?.checkRuns || []);
  }, [localCheckRuns, data?.checkRuns]);

  // Reset local state when filters change
  useEffect(() => {
    setLocalCheckRuns(null);
  }, [filters]);


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
  }, []);

  // Handle row click
  const handleRowClick = useCallback((checkRun: CheckRun) => {
    // Navigate to the check results page
    router.push(`/check/results/${checkRun.id}`);
  }, [router]);

  // Handle delete check runs - delete all, update UI with returned list, show single success toast
  const handleDelete = useCallback(async (checkRunIds: string[]) => {
    try {
      // Step 1: Perform the delete operation and wait for backend response
      const response = await fetch('/api/v1/checks/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkRunIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete check runs');
      }

      // Step 2: Get the updated list from backend response
      const result = await response.json();

      // Step 3: Update local state with new list (this updates UI immediately)
      setLocalCheckRuns(result.checkRuns);

      // Step 4: Invalidate related caches for other pages
      queryClient.invalidateQueries({ queryKey: queryKeys.checks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });

      // Step 5: Show single success toast after everything completes
      showToast({
        type: 'success',
        message: 'All deletes were successful',
      });
      
    } catch (error) {
      console.error('Delete failed:', error);
      
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete check runs',
      });
      
      throw error;
    }
  }, [showToast, queryClient]);



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
                onDelete={handleDelete}
              />
            </div>

            {/* Results Summary - Outside the table */}
            {checkRuns.length > 0 && (
              <div className="text-center mb-4">
                <p 
                  className="text-xs sm:text-sm"
                  style={{ color: colors.text.secondary }}
                >
                  Showing {checkRuns.length} of {checkRuns.length} check runs
                </p>
              </div>
            )}




          </>
        )}
      </div>
    </div>
  );
}
