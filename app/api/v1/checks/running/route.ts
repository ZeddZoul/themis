import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

// Mark as dynamic since we use cookies for session
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all running checks
    const runningChecks = await prisma.checkRun.findMany({
      where: {
        status: 'IN_PROGRESS',
      },
      select: {
        id: true,
        repositoryId: true,
        owner: true,
        repo: true,
        checkType: true,
        createdAt: true,
        status: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(runningChecks);
  } catch (error) {
    console.error('Error fetching running checks:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to fetch running checks' },
      { status: 500 }
    );
  }
}