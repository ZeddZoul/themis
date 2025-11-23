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
async function fetchDashboardStatsInternal(userId: string): Promise<DashboardStats | null> {
  try {

    // Fetch total repositories from GitHub
    let totalRepositories = 0;
    try {
      // 1. Get the App-authenticated client (JWT)
      const appOctokit = getGithubClient();
      
      // 2. Find the installation ID for this user
      // We need to know which installation to query
      // First get the user's GitHub username from the database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { githubId: true }
      });

      if (user?.githubId) {
        const { data: installation } = await appOctokit.request('GET /users/{username}/installation', {
          username: user.githubId,
        });
      
        if (installation && installation.id) {
          // 3. Get an installation-authenticated client
          // We pass undefined for accessToken (so it uses App Auth) and the specific installationId
          const installationOctokit = getGithubClient(undefined, String(installation.id));
          
          // 4. List repositories for this installation
          const { data: repos } = await installationOctokit.request('GET /installation/repositories');
          totalRepositories = repos.total_count || repos.repositories?.length || 0;
        }
      }
    } catch (error) {
      console.error('Error fetching repositories count:', error);
      // If 404, it means app is not installed for this user, so 0 repos is correct
    }

    // Get current date ranges for trend calculation
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Fetch all recent reports (last 30 days)
    const recentReports = await prisma.complianceReport.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Fetch reports from 30-60 days ago for trend comparison
    const previousReports = await prisma.complianceReport.findMany({
      where: {
        createdAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo,
        },
      },
    });

    // Calculate pending issues from recent reports
    let pendingIssues = 0;
    const repositoryIssues = new Map<string, number>();

    recentReports.forEach((report: any) => {
      const issues = report.issues as any;
      if (Array.isArray(issues)) {
        const repoKey = report.installationId;
        if (!repositoryIssues.has(repoKey)) {
          repositoryIssues.set(repoKey, issues.length);
        }
      }
    });

    repositoryIssues.forEach((count) => {
      pendingIssues += count;
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

    let previousPendingIssues = 0;
    const previousRepositoryIssues = new Map<string, number>();

    previousReports.forEach((report: any) => {
      const issues = report.issues as any;
      if (Array.isArray(issues)) {
        const repoKey = report.installationId;
        if (!previousRepositoryIssues.has(repoKey)) {
          previousRepositoryIssues.set(repoKey, issues.length);
        }
      }
    });

    previousRepositoryIssues.forEach((count) => {
      previousPendingIssues += count;
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
 */
export async function fetchDashboardStatsServer(): Promise<DashboardStats | null> {
  const session = await getSession();

  if (!session.isLoggedIn || !session.user) {
    return null;
  }

  // Use Next.js unstable_cache for server-side caching with revalidation
  const getCachedStats = unstable_cache(
    async (userId: string) => fetchDashboardStatsInternal(userId),
    ['dashboard-stats'],
    {
      revalidate: 120, // Revalidate every 2 minutes
      tags: ['dashboard-stats'],
    }
  );

  return getCachedStats(session.user.id);
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
