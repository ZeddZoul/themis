import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

type Platform = 'APPLE_APP_STORE' | 'GOOGLE_PLAY_STORE';
type Severity = 'high' | 'medium' | 'low' | 'none';

interface CheckRun {
  id: string;
  repositoryName: string;
  platforms: Platform[];
  checkDate: Date;
  highestSeverity: Severity;
  totalIssues: number;
  status?: string;
  errorType?: string | null;
  errorMessage?: string | null;
  errorDetails?: string | null;
}

export async function GET(request: Request) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const platformFilter = searchParams.get('platform') || 'all';
    const repositoryFilter = searchParams.get('repository') || 'all';
    const severityFilter = searchParams.get('severity') || 'all';

    console.log('Fetching check history with filters:', {
      page,
      pageSize,
      platform: platformFilter,
      repository: repositoryFilter,
      severity: severityFilter,
    });

    // Build where clause for filtering
    const whereClause: any = {};

    // Repository filter
    if (repositoryFilter !== 'all') {
      whereClause.installation = {
        OR: [
          { repo: { contains: repositoryFilter, mode: 'insensitive' } },
          { owner: { contains: repositoryFilter, mode: 'insensitive' } },
        ],
      };
    }

    // Fetch all check runs with filters (using CheckRun table which has error fields)
    const checkRunRecords = await prisma.checkRun.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Found ${checkRunRecords.length} total check runs`);

    // Process check runs
    const checkRuns: CheckRun[] = checkRunRecords
      .map((checkRun: any) => {
        const issues = checkRun.issues as any;
        
        // Extract platforms from checkType
        let platforms: Platform[] = [];
        if (checkRun.checkType === 'BOTH') {
          platforms = ['APPLE_APP_STORE', 'GOOGLE_PLAY_STORE'];
        } else if (checkRun.checkType === 'APPLE_APP_STORE' || checkRun.checkType === 'GOOGLE_PLAY_STORE') {
          platforms = [checkRun.checkType as Platform];
        } else {
          // Default to both if unknown
          platforms = ['APPLE_APP_STORE', 'GOOGLE_PLAY_STORE'];
        }

        // Calculate severity and issue count
        let totalIssues = 0;
        let highestSeverity: Severity = 'none';

        if (checkRun.status === 'FAILED') {
          // For failed checks, set severity based on error
          highestSeverity = 'none';
          totalIssues = 0;
        } else if (Array.isArray(issues)) {
          totalIssues = issues.length;

          const hasCritical = issues.some((issue: any) => 
            issue.severity === 'high' || issue.severity === 'critical'
          );
          const hasMedium = issues.some((issue: any) => 
            issue.severity === 'medium' || issue.severity === 'warning'
          );
          const hasLow = issues.some((issue: any) => 
            issue.severity === 'low' || issue.severity === 'info'
          );

          if (hasCritical) {
            highestSeverity = 'high';
          } else if (hasMedium) {
            highestSeverity = 'medium';
          } else if (hasLow) {
            highestSeverity = 'low';
          }
        }

        return {
          id: checkRun.id,
          repositoryName: `${checkRun.owner}/${checkRun.repo}`,
          platforms,
          checkDate: checkRun.createdAt,
          highestSeverity,
          totalIssues,
          status: checkRun.status,
          errorType: checkRun.errorType,
          errorMessage: checkRun.errorMessage,
          errorDetails: checkRun.errorDetails,
        };
      })
      .filter((checkRun: CheckRun) => {
        // Apply repository filter
        if (repositoryFilter !== 'all') {
          if (!checkRun.repositoryName.toLowerCase().includes(repositoryFilter.toLowerCase())) {
            return false;
          }
        }

        // Apply platform filter
        if (platformFilter !== 'all') {
          if (!checkRun.platforms.includes(platformFilter as Platform)) {
            return false;
          }
        }

        // Apply severity filter
        if (severityFilter !== 'all') {
          if (checkRun.highestSeverity !== severityFilter) {
            return false;
          }
        }

        return true;
      });

    console.log(`After filtering: ${checkRuns.length} check runs`);



    // Get total count before pagination
    const total = checkRuns.length;
    const totalPages = Math.ceil(total / pageSize);

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedCheckRuns = checkRuns.slice(startIndex, endIndex);

    // Cache check history for 30 seconds with stale-while-revalidate
    // Check runs update frequently, so shorter cache time is appropriate
    return NextResponse.json({
      checkRuns: paginatedCheckRuns,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
      },
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60, max-age=15',
      },
    });
  } catch (error: any) {
    console.error('Error fetching check history:', error.message);
    console.error('Error details:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch check history',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
