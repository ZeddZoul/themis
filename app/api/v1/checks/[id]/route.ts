import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Check run ID is required' }, { status: 400 });
    }

    // Fetch the check run with all details
    const checkRun = await prisma.checkRun.findUnique({
      where: { id },
      select: {
        id: true,
        repositoryId: true,
        owner: true,
        repo: true,
        branchName: true,
        status: true,
        checkType: true,
        issues: true,
        errorType: true,
        errorMessage: true,
        errorDetails: true,
        createdAt: true,
        completedAt: true,
      },
    });

    if (!checkRun) {
      return NextResponse.json({ error: 'Check run not found' }, { status: 404 });
    }

    // For now, we'll allow access to any check run
    // In a production app, you'd want to verify the user has access to this repository

    // Debug logging
    const issues = (checkRun.issues as any[]) || [];
    if (issues.length > 0) {
      console.log('[API Debug] First issue keys:', Object.keys(issues[0]));
      console.log('[API Debug] First issue AI data:', {
        hasLoc: !!issues[0].aiPinpointLocation,
        hasFix: !!issues[0].aiSuggestedFix
      });
    }

    return NextResponse.json({
      id: checkRun.id,
      repositoryId: checkRun.repositoryId,
      owner: checkRun.owner,
      repo: checkRun.repo,
      branchName: checkRun.branchName,
      status: checkRun.status,
      checkType: checkRun.checkType,
      issues: issues,
      errorType: checkRun.errorType,
      errorMessage: checkRun.errorMessage,
      errorDetails: checkRun.errorDetails,
      createdAt: checkRun.createdAt,
      completedAt: checkRun.completedAt,
    });
  } catch (error) {
    console.error('Failed to fetch check run details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch check run details' },
      { status: 500 }
    );
  }
}