import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { checkId: string } }
) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const checkRun = await prisma.checkRun.findUnique({
      where: { id: params.checkId },
    });

    if (!checkRun) {
      return NextResponse.json({ error: 'Check run not found' }, { status: 404 });
    }

    return NextResponse.json(checkRun);
  } catch (error: any) {
    console.error('Error fetching check run:', error);
    return NextResponse.json(
      { error: 'Failed to fetch check run', details: error.message },
      { status: 500 }
    );
  }
}
