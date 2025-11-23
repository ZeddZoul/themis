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
  
  // Local state for optimistic updates
  const [optimisticCheckRuns, setOptimisticCheckRuns] = useState<CheckRun[]>([]);
  const [hasOptimisticUpdates, setHasOptimisticUpdates] = useState(false);

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

  // Use TanStack Query hook for data fetching with caching and optional polling
  const { data, isLoading, error, isFetching, refetch } = useCheckHistory(queryFilters, enablePolling);

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
  const serverCheckRuns = useMemo(() => data?.checkRuns || [], [data?.checkRuns]);
  
  // Use optimistic data if available, otherwise use server data
  const checkRuns = useMemo(() => {
    return hasOptimisticUpdates ? optimisticCheckRuns : serverCheckRuns;
  }, [hasOptimisticUpdates, optimisticCheckRuns, serverCheckRuns]);
  
  // Update optimistic state when server data changes
  useEffect(() => {
    if (!hasOptimisticUpdates && serverCheckRuns.length > 0) {
      setOptimisticCheckRuns(serverCheckRuns);
    }
  }, [serverCheckRuns, hasOptimisticUpdates]);

  // Auto-sync optimistic updates with server data after a delay
  useEffect(() => {
    if (hasOptimisticUpdates) {
      const syncTimer = setTimeout(async () => {
        try {
          // Force a refetch to sync with server
          await refetch();
          setHasOptimisticUpdates(false);
        } catch (error) {
          console.error('Failed to sync with server:', error);
          // Force reset optimistic updates on error
          setHasOptimisticUpdates(false);
          showToast({
            type: 'info',
            message: 'Refreshing data to ensure accuracy...',
          });
        }
      }, 3000); // Sync after 3 seconds

      return () => clearTimeout(syncTimer);
    }
  }, [hasOptimisticUpdates, refetch, showToast]);

  // Reset optimistic updates when filters change
  useEffect(() => {
    if (hasOptimisticUpdates) {
      setHasOptimisticUpdates(false);
      setOptimisticCheckRuns([]);
    }
  }, [filters, hasOptimisticUpdates]); // Reset when filters change


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

  // Handle delete check runs with optimistic updates
  const handleDelete = useCallback(async (checkRunIds: string[]) => {
    // Store original state for potential rollback
    const originalCheckRuns = checkRuns;
    
    // Optimistic update: immediately remove items from UI
    const updatedCheckRuns = checkRuns.filter(run => !checkRunIds.includes(run.id));
    setOptimisticCheckRuns(updatedCheckRuns);
    setHasOptimisticUpdates(true);
    
    try {
      // Show optimistic success message
      showToast({
        type: 'info',
        message: `Deleting ${checkRunIds.length} check run${checkRunIds.length > 1 ? 's' : ''}...`,
      });

      const response = await fetch('/api/v1/checks/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkRunIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete check runs');
      }

      // Success - show final success message
      showToast({
        type: 'success',
        message: `Successfully deleted ${checkRunIds.length} check run${checkRunIds.length > 1 ? 's' : ''}`,
      });

      // Invalidate all related queries to ensure fresh data
      await queryClient.invalidateQueries({
        queryKey: queryKeys.checks.all,
      });
      
      // Also invalidate dashboard stats since they might be affected
      await queryClient.invalidateQueries({
        queryKey: queryKeys.stats.all,
      });

      // Force a refetch to get the latest data
      await refetch();

      // Reset optimistic updates flag after successful sync
      setHasOptimisticUpdates(false);
      
    } catch (error) {
      console.error('Delete failed:', error);
      
      // Revert optimistic update on error
      setOptimisticCheckRuns(originalCheckRuns);
      setHasOptimisticUpdates(false);
      
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete check runs',
      });
      
      throw error; // Re-throw to let the table handle the error state
    }
  }, [checkRuns, showToast, queryClient, queryFilters, refetch]);



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
        {isFetching && !isLoading && !hasOptimisticUpdates && (
          <div 
            className="mb-4 p-2 rounded text-center text-sm flex items-center justify-center gap-2"
            style={{ 
              backgroundColor: colors.primary.accent + '10',
              color: colors.primary.accent,
            }}
            role="status"
            aria-live="polite"
          >
            <div 
              className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin"
            />
            Updating check history...
          </div>
        )}

        {/* Optimistic updates indicator */}
        {hasOptimisticUpdates && (
          <div 
            className="mb-4 p-2 rounded text-center text-sm flex items-center justify-center gap-2"
            style={{ 
              backgroundColor: colors.status.warning + '10',
              color: colors.status.warning,
            }}
            role="status"
            aria-live="polite"
          >
            <div 
              className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin"
            />
            Syncing changes with server...
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
                  {hasOptimisticUpdates && (
                    <span className="ml-2 text-xs" style={{ color: colors.status.warning }}>
                      (syncing...)
                    </span>
                  )}
                </p>
              </div>
            )}




          </>
        )}
      </div>
    </div>
  );
}
