import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { repoFullName: string } }
) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Decode the repo full name (e.g., "owner/repo")
    const repoFullName = decodeURIComponent(params.repoFullName);
    const [owner, repo] = repoFullName.split('/');

    if (!owner || !repo) {
      return NextResponse.json({ error: 'Invalid repository name' }, { status: 400 });
    }

    // Find the latest check run for this repository
    const latestCheckRun = await prisma.checkRun.findFirst({
      where: {
        owner,
        repo,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!latestCheckRun) {
      return NextResponse.json({ error: 'No check runs found for this repository' }, { status: 404 });
    }

    return NextResponse.json(latestCheckRun);
  } catch (error: any) {
    console.error('Error fetching latest check run:', error);
    return NextResponse.json(
      { error: 'Failed to fetch latest check run', details: error.message },
      { status: 500 }
    );
  }
}
