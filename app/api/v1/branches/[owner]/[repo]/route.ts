import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getRepoBranches, getDefaultBranch } from '@/lib/github';

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

    const [branches, defaultBranch] = await Promise.all([
      getRepoBranches(owner, repo),
      getDefaultBranch(owner, repo),
    ]);

    return NextResponse.json({
      branches,
      defaultBranch,
    });
  } catch (error: any) {
    console.error('Error fetching repository branches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch branches', details: error.message },
      { status: 500 }
    );
  }
}
