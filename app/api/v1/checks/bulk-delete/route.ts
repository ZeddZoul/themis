import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { revalidateTag } from 'next/cache';

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

    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.count,
      message: `Successfully deleted ${deleteResult.count} check run${deleteResult.count !== 1 ? 's' : ''}`,
    });
  } catch (error: any) {
    console.error('Error deleting check runs:', error);
    return NextResponse.json(
      { error: 'Failed to delete check runs', details: error.message },
      { status: 500 }
    );
  }
}