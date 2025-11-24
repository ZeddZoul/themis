import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

// Mark as dynamic since we use cookies for session
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');
    
    if (!since) {
      return NextResponse.json({ error: 'Missing since parameter' }, { status: 400 });
    }

    // Get recently completed checks
    const completedChecks = await prisma.checkRun.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: new Date(since),
        },
      },
      select: {
        id: true,
        repositoryId: true,
        owner: true,
        repo: true,
        checkType: true,
        completedAt: true,
        issues: true,
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    // Transform to include issue count
    const transformedChecks = completedChecks.map(check => ({
      ...check,
      issueCount: Array.isArray(check.issues) ? check.issues.length : 0,
    }));

    return NextResponse.json(transformedChecks);
  } catch (error) {
    console.error('Error fetching completed checks:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to fetch completed checks' },
      { status: 500 }
    );
  }
}