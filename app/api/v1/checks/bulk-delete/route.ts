import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { revalidateTag } from 'next/cache';

type Platform = 'APPLE_APP_STORE' | 'GOOGLE_PLAY_STORE' | 'CHROME_WEB_STORE' | 'MOBILE_PLATFORMS';
type Severity = 'high' | 'medium' | 'low' | 'none';

interface CheckRun {
  id: string;
  repositoryName: string;
  platforms: Platform[];
  branchName?: string;
  checkDate: Date;
  highestSeverity: Severity;
  totalIssues: number;
  status?: string;
  errorType?: string | null;
  errorMessage?: string | null;
  errorDetails?: string | null;
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { checkRunIds } = body;

    if (!checkRunIds || !Array.isArray(checkRunIds) || checkRunIds.length === 0) {
      return NextResponse.json({ error: 'Check run IDs are required' }, { status: 400 });
    }

    // Validate that all IDs are strings
    if (!checkRunIds.every(id => typeof id === 'string')) {
      return NextResponse.json({ error: 'Invalid check run ID format' }, { status: 400 });
    }

    // Delete the check runs
    const deleteResult = await prisma.checkRun.deleteMany({
      where: {
        id: {
          in: checkRunIds,
        },
      },
    });

    // Revalidate cache tags after successful deletion
    revalidateTag('checks');
    revalidateTag('dashboard-stats');
    revalidateTag('check-history');

    // Fetch updated list of check runs
    const checkRunRecords = await prisma.checkRun.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Process check runs (same logic as history endpoint)
    const checkRuns: CheckRun[] = checkRunRecords.map((checkRun: any) => {
      const issues = checkRun.issues as any;
      
      // Extract platforms from checkType
      let platforms: Platform[] = [];
      if (checkRun.checkType === 'MOBILE_PLATFORMS') {
        platforms = ['APPLE_APP_STORE', 'GOOGLE_PLAY_STORE'];
      } else if (checkRun.checkType === 'APPLE_APP_STORE' || checkRun.checkType === 'GOOGLE_PLAY_STORE' || checkRun.checkType === 'CHROME_WEB_STORE') {
        platforms = [checkRun.checkType as Platform];
      } else {
        platforms = ['APPLE_APP_STORE', 'GOOGLE_PLAY_STORE'];
      }

      // Calculate severity and issue count
      let totalIssues = 0;
      let highestSeverity: Severity = 'none';

      if (checkRun.status === 'FAILED') {
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
        branchName: checkRun.branchName,
        checkDate: checkRun.createdAt,
        highestSeverity,
        totalIssues,
        status: checkRun.status,
        errorType: checkRun.errorType,
        errorMessage: checkRun.errorMessage,
        errorDetails: checkRun.errorDetails,
      };
    });

    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.count,
      message: `Successfully deleted ${deleteResult.count} check run${deleteResult.count !== 1 ? 's' : ''}`,
      checkRuns, // Return updated list
    });
  } catch (error: any) {
    console.error('Error deleting check runs:', error);
    return NextResponse.json(
      { error: 'Failed to delete check runs', details: error.message },
      { status: 500 }
    );
  }
}