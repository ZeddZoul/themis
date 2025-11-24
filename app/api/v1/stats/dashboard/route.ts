import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getGithubClient } from '@/lib/github';

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

export async function GET() {
  const session = await getSession();

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Use cached repository count from session to avoid redundant GitHub API calls
    // This is populated during login and refreshed periodically
    let totalRepositories = session.user?.totalRepositories ?? 0;
    
    // If cache is missing or stale, try to refresh it
    if (!totalRepositories || !session.user?.installationCachedAt) {
      try {
        const { getOrRefreshInstallationCache, updateSessionCache } = await import('@/lib/session-cache');
        const installationCache = await getOrRefreshInstallationCache(session, session.user?.githubUsername);
        
        if (installationCache) {
          totalRepositories = installationCache.totalRepositories;
          updateSessionCache(session, installationCache);
          await session.save();
        }
      } catch (error) {
        console.error('Error refreshing installation cache:', error);
        // Continue with 0 if cache refresh fails
      }
    }

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

    // Calculate recent checks (last 30 days) - count total checks, not unique repos
    const recentChecks = recentReports.length;

    // Calculate compliance rate
    // Compliance = repositories with 0 issues / total repositories with checks
    const repositoriesWithChecks = repositoryIssues.size;
    const compliantRepositories = Array.from(repositoryIssues.values()).filter(
      (count) => count === 0
    ).length;
    const complianceRate =
      repositoriesWithChecks > 0
        ? Math.round((compliantRepositories / repositoriesWithChecks) * 100)
        : 100;

    // Calculate trends
    // Repository trend: compare installations count
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

    const stats: DashboardStats = {
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

    // Cache the response for 30 seconds with stale-while-revalidate
    // s-maxage: cache for 30 seconds on CDN/edge
    // stale-while-revalidate: serve stale content for 1 minute while revalidating
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60, max-age=15',
      },
    });
  } catch (error: any) {
    console.error('Error calculating dashboard stats:', error);

    return NextResponse.json(
      {
        error: 'Failed to calculate dashboard statistics',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
