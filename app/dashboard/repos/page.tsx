'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useQueryClient } from '@tanstack/react-query';
import { RepositoryCard } from '@/components/dashboard/RepositoryCard';
import { Pagination } from '@/components/ui/pagination';
import { SkeletonLoader } from '@/components/ui/loading-spinner';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { SimpleLoading } from '@/components/ui/simple-loading';
import { RunningChecks } from '@/components/dashboard/RunningChecks';
import { colors } from '@/lib/design-system';
import { useToast } from '@/lib/hooks/useToast';
import { useRepositories, Repository } from '@/lib/hooks/useRepositories';
import { useCompletionNotifications } from '@/lib/hooks/useCompletionNotifications';
import { queryKeys } from '@/lib/query-keys';
import { DynamicIcon } from '@/lib/icons';
import { FaCodeBranch } from 'react-icons/fa';

// Dynamically import SearchBar component with loading state
const SearchBar = dynamic(
  () => import('@/components/dashboard/SearchBar').then((mod) => ({ default: mod.SearchBar })),
  {
    loading: () => (
      <div 
        className="w-full px-4 py-3 border rounded-lg"
        style={{ borderColor: colors.text.secondary + '40' }}
        role="status"
        aria-label="Loading search"
      >
        <SkeletonLoader variant="text" lines={1} />
      </div>
    ),
    ssr: false,
  }
);

export default function RepositoriesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  // Enable completion notifications
  useCompletionNotifications();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCheckLoading, setIsCheckLoading] = useState(false);
  const [loadingRepo, setLoadingRepo] = useState<string>('');
  const [checkRunId, setCheckRunId] = useState<string>('');
  const [isNavigating, setIsNavigating] = useState(false);

  // Build filters for TanStack Query
  const filters = useMemo(() => ({
    page: currentPage,
    pageSize: 10,
    search: searchQuery || undefined,
  }), [currentPage, searchQuery]);

  // Use TanStack Query hook for data fetching with caching
  const { data, isLoading, error, isFetching } = useRepositories(filters);

  /**
   * Effect: Display error toast when repository loading fails
   * Purpose: Provide user feedback for data fetching errors
   * Dependencies: error, isLoading, showToast
   * Note: Only runs when loading completes and an error exists
   */
  useEffect(() => {
    if (error && !isLoading) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to load repositories',
      });
    }
  }, [error, isLoading, showToast]);

  const repositories = data?.repositories || [];
  const pagination = data?.pagination || {
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  };

  // Handle search changes
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to page 1 on search
  }, []);

  // Handle page changes
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Handle repository click - navigate to check history for that repo
  const handleRepositoryClick = useCallback((repo: Repository) => {
    const [owner, repoName] = repo.full_name.split('/');
    router.push(`/dashboard/checks/${owner}/${repoName}`);
  }, [router]);

  // Handle start check - show overlay loading then navigate to results
  const handleStartCheck = useCallback(async (repo: Repository, platform: string, branch: string) => {
    try {
      setIsCheckLoading(true);
      setLoadingRepo(repo.full_name);

      const response = await fetch('/api/v1/checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoId: repo.id,
          checkType: platform,
          branchName: branch,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start check');
      }

      const data = await response.json();
      
      // Set navigation state to keep loading screen visible during navigation
      setIsNavigating(true);
      
      // Analysis is complete! Navigate directly to results
      router.push(`/check/results/${data.checkRunId}`);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.repositories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.dashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.checks.all });
      
      // Keep loading screen visible for a moment to ensure smooth navigation
      setTimeout(() => {
        setIsNavigating(false);
      }, 1000);
      
    } catch (error) {
      console.error('Check failed:', error);
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to start compliance check',
      });
    } finally {
      // Clear loading state (but keep navigation state if set)
      setIsCheckLoading(false);
      setLoadingRepo('');
      setCheckRunId('');
    }
  }, [showToast, queryClient]);

  // Handle completion from loading component
  const handleLoadingComplete = useCallback(() => {
    if (checkRunId) {
      // Set navigating flag to prevent overlay from disappearing
      setIsNavigating(true);
      // Replace current page - loading state shouldn't be in browser history
      router.replace(`/check/results/${checkRunId}`);
    }
    // Don't reset loading state here - let the page unmount handle cleanup
  }, [checkRunId, router]);

  return (
    <div className="h-screen relative overflow-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 
            className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2"
            style={{ color: colors.text.primary }}
          >
            Repositories
          </h1>
          <p 
            className="text-sm sm:text-base lg:text-lg"
            style={{ color: colors.text.secondary }}
          >
            Manage and monitor your repositories for compliance issues
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-4 sm:mb-6">
          <SearchBar
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search repositories by name..."
          />
        </div>

        {/* Running Checks Section */}
        <RunningChecks />

        {/* Background revalidation indicator */}
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
            Updating repositories...
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" role="status" aria-live="polite" aria-label="Loading repositories">
            <SkeletonCard count={6} />
            <span className="sr-only">Loading repositories...</span>
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
              {error instanceof Error ? error.message : 'Failed to load repositories'}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && repositories.length === 0 && (
          <div 
            className="p-12 rounded-lg border text-center"
            style={{ 
              borderColor: colors.text.secondary + '40',
              backgroundColor: colors.background.subtle,
            }}
          >
            <div className="flex justify-center mb-4">
              <DynamicIcon
                icon={FaCodeBranch}
                state="inactive"
                size={64}
                ariaLabel="No repositories"
                decorative
              />
            </div>
            <h3 
              className="text-xl font-semibold mb-2"
              style={{ color: colors.text.primary }}
            >
              {searchQuery ? 'No repositories found' : 'No repositories available'}
            </h3>
            <p style={{ color: colors.text.secondary }}>
              {searchQuery 
                ? 'Try adjusting your search query'
                : 'Install the GitHub App on your repositories to get started'
              }
            </p>
          </div>
        )}

        {/* Repository List */}
        {!isLoading && !error && repositories.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
              {repositories.map((repo) => (
                <RepositoryCard
                  key={repo.id}
                  id={repo.id}
                  name={repo.name}
                  fullName={repo.full_name}
                  description={repo.description}
                  status={repo.lastCheckStatus}
                  lastCheckDate={repo.lastCheckDate}
                  issueCount={repo.issueCount}
                  errorType={repo.errorType}
                  errorMessage={repo.errorMessage}
                  errorDetails={repo.errorDetails}
                  onClick={() => handleRepositoryClick(repo)}
                  onStartCheck={(platform, branch) => handleStartCheck(repo, platform, branch)}
                  isCheckRunning={isCheckLoading && loadingRepo === repo.full_name}
                  branches={repo.branches}
                  defaultBranch={repo.default_branch}
                />
              ))}
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
            <div className="mt-3 sm:mt-4 text-center">
              <p 
                className="text-xs sm:text-sm"
                style={{ color: colors.text.secondary }}
              >
                Showing {repositories.length} of {pagination.total} repositories
              </p>
            </div>
          </>
        )}
      </div>
      
      {/* Loading Overlay */}
      {(isCheckLoading || isNavigating) && (
        <SimpleLoading
          enableRealTimeSync={false}
          title="Themis is generating compliance report"
          subtitle="Don't worry, you can leave or close this window. You'll be notified when the check is complete."
        />
      )}
    </div>
  );
}
