import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { owner: string; repo: string } }
) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { owner, repo } = params;

    // Fetch all check runs for this repository, sorted by most recent first
    const checks = await prisma.checkRun.findMany({
      where: {
        owner,
        repo,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ checks });
  } catch (error: any) {
    console.error('Error fetching check history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch check history', details: error.message },
      { status: 500 }
    );
  }
}
