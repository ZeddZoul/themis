/**
 * Server-side data fetching utilities
 * These functions are designed to be called from Server Components
 * with Next.js caching and revalidation
 */

import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getGithubClient } from '@/lib/github';
import { unstable_cache } from 'next/cache';

interface DashboardStats {
  totalRepositories: number;
  pendingIssues: number;
  recentChecks: number;
  complianceRate: number;
  trends: {
    repositories: { value: number; direction: 'up' | 'down' };
    issues: { value: number; direction: 'up' | 'down' };
  };
}

interface User {
  id: string;
  githubId: string;
  name: string;
  email: string;
}

/**
 * Internal function to fetch dashboard statistics
 * Wrapped by cached version below
 */
async function fetchDashboardStatsInternal(
  userId: string, 
  accessToken?: string,
  cachedRepoCount?: number
): Promise<DashboardStats | null> {
  try {
    // Use cached repository count from session if available
    // This avoids making redundant GitHub API calls
    const totalRepositories = cachedRepoCount ?? 0;

    // Get current date ranges for trend calculation
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Fetch all recent check runs (last 30 days)
    const recentReports = await prisma.checkRun.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
        status: 'COMPLETED', // Only count completed checks
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Fetch check runs from 30-60 days ago for trend comparison
    const previousReports = await prisma.checkRun.findMany({
      where: {
        createdAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo,
        },
        status: 'COMPLETED',
      },
    });

    // Get the latest check run per repository
    const repositoryLatestChecks = new Map<string, any>();
    
    recentReports.forEach((report: any) => {
      const repoKey = report.repositoryId;
      const existing = repositoryLatestChecks.get(repoKey);
      
      // Keep the most recent check for each repository
      if (!existing || new Date(report.createdAt) > new Date(existing.createdAt)) {
        repositoryLatestChecks.set(repoKey, report);
      }
    });

    // Calculate pending issues from latest check per repository
    let pendingIssues = 0;
    const repositoryIssues = new Map<string, number>();

    repositoryLatestChecks.forEach((report: any, repoKey: string) => {
      const issues = report.issues as any;
      if (Array.isArray(issues)) {
        const issueCount = issues.length;
        repositoryIssues.set(repoKey, issueCount);
        pendingIssues += issueCount;
      }
    });

    const recentChecks = recentReports.length;

    // Calculate compliance rate
    const repositoriesWithChecks = repositoryIssues.size;
    const compliantRepositories = Array.from(repositoryIssues.values()).filter(
      (count) => count === 0
    ).length;
    const complianceRate =
      repositoriesWithChecks > 0
        ? Math.round((compliantRepositories / repositoriesWithChecks) * 100)
        : 100;

    // Calculate trends
    const currentInstallations = await prisma.installation.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const previousInstallations = await prisma.installation.count({
      where: {
        createdAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo,
        },
      },
    });

    const repositoryTrendValue =
      previousInstallations > 0
        ? Math.round(
            ((currentInstallations - previousInstallations) / previousInstallations) * 100
          )
        : 0;

    // Get the latest check run per repository for previous period
    const previousRepositoryLatestChecks = new Map<string, any>();
    
    previousReports.forEach((report: any) => {
      const repoKey = report.repositoryId;
      const existing = previousRepositoryLatestChecks.get(repoKey);
      
      // Keep the most recent check for each repository
      if (!existing || new Date(report.createdAt) > new Date(existing.createdAt)) {
        previousRepositoryLatestChecks.set(repoKey, report);
      }
    });

    // Issue trend: compare total issues
    let previousPendingIssues = 0;
    const previousRepositoryIssues = new Map<string, number>();

    previousRepositoryLatestChecks.forEach((report: any, repoKey: string) => {
      const issues = report.issues as any;
      if (Array.isArray(issues)) {
        const issueCount = issues.length;
        previousRepositoryIssues.set(repoKey, issueCount);
        previousPendingIssues += issueCount;
      }
    });

    const issueTrendValue =
      previousPendingIssues > 0
        ? Math.round(((pendingIssues - previousPendingIssues) / previousPendingIssues) * 100)
        : 0;

    return {
      totalRepositories,
      pendingIssues,
      recentChecks,
      complianceRate,
      trends: {
        repositories: {
          value: Math.abs(repositoryTrendValue),
          direction: repositoryTrendValue >= 0 ? 'up' : 'down',
        },
        issues: {
          value: Math.abs(issueTrendValue),
          direction: issueTrendValue >= 0 ? 'up' : 'down',
        },
      },
    };
  } catch (error) {
    console.error('Error fetching dashboard stats on server:', error);
    return null;
  }
}

/**
 * Fetch dashboard statistics on the server with caching
 * This function is optimized for Server Components with Next.js caching
 * Revalidates every 2 minutes (120 seconds)
 * Uses cached repository count from session to avoid redundant GitHub API calls
 */
export async function fetchDashboardStatsServer(): Promise<DashboardStats | null> {
  const session = await getSession();

  if (!session.isLoggedIn || !session.user) {
    return null;
  }

  // Use cached repository count from session if available
  const cachedRepoCount = session.user.totalRepositories;

  // Use Next.js unstable_cache for server-side caching with revalidation
  const getCachedStats = unstable_cache(
    async (userId: string, accessToken?: string, repoCount?: number) => 
      fetchDashboardStatsInternal(userId, accessToken, repoCount),
    ['dashboard-stats'],
    {
      revalidate: 120, // Revalidate every 2 minutes
      tags: ['dashboard-stats'],
    }
  );

  return getCachedStats(session.user.id, session.user.accessToken, cachedRepoCount);
}

/**
 * Fetch current user on the server with caching
 * This function is optimized for Server Components with Next.js caching
 * Revalidates every 5 minutes (300 seconds) as user data changes infrequently
 */
export async function fetchUserServer(): Promise<User | null> {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.user) {
      return null;
    }

    // User data from session is already cached by session management
    // No additional caching needed here
    return session.user;
  } catch (error) {
    console.error('Error fetching user on server:', error);
    return null;
  }
}
