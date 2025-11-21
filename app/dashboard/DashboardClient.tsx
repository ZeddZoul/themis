'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { colors } from '@/lib/design-system';
import { useToast } from '@/lib/hooks/useToast';
import { useUser } from '@/lib/hooks/useUser';
import { useDashboardStats } from '@/lib/hooks/useDashboardStats';
import { DynamicIcon } from '@/lib/icons';
import { MdDashboard, MdWarning } from 'react-icons/md';
import { FaCodeBranch } from 'react-icons/fa';
import { AiOutlineIssuesClose } from 'react-icons/ai';
import { GiCheckedShield } from 'react-icons/gi';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { TrendsChart } from '@/components/dashboard/TrendsChart';
import { DashboardSkeleton } from '@/components/ui/skeletons';

interface DashboardClientProps {
  initialStats?: {
    totalRepositories: number;
    pendingIssues: number;
    recentChecks: number;
    complianceRate: number;
    trends: {
      repositories: { value: number; direction: 'up' | 'down' };
      issues: { value: number; direction: 'up' | 'down' };
    };
  };
  initialUser?: {
    id: string;
    githubId: string;
    name: string;
    email: string;
  };
}

export function DashboardClient({ initialStats, initialUser }: DashboardClientProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  // Use TanStack Query hooks with initial data from server
  const { data: user, isLoading: userLoading, error: userError } = useUser({
    initialData: initialUser,
  });
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats({
    initialData: initialStats,
  });

  /**
   * Effect: Redirect to login if user authentication fails
   * Purpose: Handle authentication errors by redirecting unauthenticated users
   * Dependencies: userError, userLoading, router
   * Note: Only runs when user loading completes and an error exists
   */
  useEffect(() => {
    if (userError && !userLoading) {
      router.push('/login');
    }
  }, [userError, userLoading, router]);

  /**
   * Effect: Display error toast for dashboard stats failures
   * Purpose: Provide user feedback when stats fail to load
   * Dependencies: statsError, statsLoading, showToast
   * Note: Only runs when stats loading completes and an error exists
   */
  useEffect(() => {
    if (statsError && !statsLoading) {
      showToast({
        type: 'error',
        message: statsError instanceof Error ? statsError.message : 'Failed to load dashboard statistics',
      });
    }
  }, [statsError, statsLoading, showToast]);

  const loading = userLoading || statsLoading;
  const error = statsError;

  // Navigation handlers for stats cards
  const handleNavigateToRepos = useCallback(() => {
    router.push('/dashboard/repos');
  }, [router]);

  const handleNavigateToIssues = useCallback(() => {
    router.push('/dashboard/issues');
  }, [router]);

  if (loading && !initialStats) {
    return <DashboardSkeleton />;
  }

  if (error && !loading && !initialStats) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div 
          className="max-w-md w-full p-6 rounded-lg border text-center"
          style={{ 
            borderColor: colors.status.error,
            backgroundColor: colors.status.error + '10',
          }}
        >
          <div className="flex justify-center mb-4">
            <DynamicIcon
              icon={MdWarning}
              state="error"
              size={64}
              ariaLabel="Error"
              decorative
            />
          </div>
          <h3 
            className="text-xl font-semibold mb-2"
            style={{ color: colors.status.error }}
          >
            Error Loading Dashboard
          </h3>
          <p className="mb-4" style={{ color: colors.text.secondary }}>
            {error instanceof Error ? error.message : 'Failed to load dashboard data'}
          </p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!user && !initialUser) return null;

  const displayUser = user || initialUser;
  const displayStats = stats || initialStats;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2" style={{ color: colors.text.primary }}>
          Overview
        </h2>
        <p className="text-sm sm:text-base" style={{ color: colors.text.secondary }}>
          Welcome, {displayUser?.name}! Here&apos;s your compliance dashboard at a glance.
        </p>
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
        <StatsCard
          title="Total Repositories"
          value={displayStats?.totalRepositories ?? 0}
          icon={FaCodeBranch}
          trend={displayStats?.trends.repositories}
          onClick={handleNavigateToRepos}
          loading={statsLoading && !initialStats}
        />
        <StatsCard
          title="Pending Issues"
          value={displayStats?.pendingIssues ?? 0}
          icon={AiOutlineIssuesClose}
          trend={displayStats?.trends.issues}
          onClick={handleNavigateToIssues}
          loading={statsLoading && !initialStats}
        />
        <StatsCard
          title="Recent Checks"
          value={displayStats?.recentChecks ?? 0}
          icon={MdDashboard}
          loading={statsLoading && !initialStats}
        />
        <StatsCard
          title="Compliance Rate"
          value={
            displayStats?.recentChecks && displayStats.recentChecks > 0
              ? `${displayStats.complianceRate}%`
              : 'N/A'
          }
          icon={GiCheckedShield}
          loading={statsLoading && !initialStats}
        />
      </div>

      {/* Trends Chart */}
      <div className="mb-8">
        <TrendsChart />
      </div>

      {/* Quick Actions Section */}
      <div className="bg-white p-6 rounded-lg border" style={{ borderColor: colors.text.secondary + '30' }}>
        <h3 className="text-lg sm:text-xl font-bold mb-3" style={{ color: colors.text.primary }}>
          Quick Actions
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleNavigateToRepos}
            className="flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors duration-200 hover:border-opacity-100"
            style={{
              borderColor: colors.text.secondary + '30',
              color: colors.text.primary,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = colors.primary.accent;
              e.currentTarget.style.backgroundColor = colors.background.subtle;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = colors.text.secondary + '30';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <DynamicIcon icon={FaCodeBranch} state="active" size={20} decorative />
            <span className="font-medium">View All Repositories</span>
          </button>
          <button
            onClick={handleNavigateToIssues}
            className="flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors duration-200 hover:border-opacity-100"
            style={{
              borderColor: colors.text.secondary + '30',
              color: colors.text.primary,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = colors.primary.accent;
              e.currentTarget.style.backgroundColor = colors.background.subtle;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = colors.text.secondary + '30';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <DynamicIcon icon={AiOutlineIssuesClose} state="active" size={20} decorative />
            <span className="font-medium">View All Issues</span>
          </button>
        </div>
      </div>
    </div>
  );
}
