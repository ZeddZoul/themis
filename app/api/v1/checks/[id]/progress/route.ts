import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;


    const checkRun = await prisma.checkRun.findUnique({
      where: { id },
    });

    if (!checkRun) {

      
      return NextResponse.json({ error: 'Check run not found' }, { status: 404 });
    }



    // Simple status-based progress without time estimates
    let progress = 0;
    let currentStep = 'Themis is generating compliance report...';
    let fileCount = 0;

    switch (checkRun.status) {
      case 'IN_PROGRESS':
        progress = 50; // Show some progress but don't estimate
        currentStep = 'Themis is generating compliance report...';
        break;
        
      case 'COMPLETED':
        progress = 100;
        currentStep = 'Analysis complete! Preparing results...';
        if (checkRun.issues && Array.isArray(checkRun.issues)) {
          // Count unique files from issues
          const files = new Set();
          (checkRun.issues as any[]).forEach(issue => {
            if (issue.file) files.add(issue.file);
          });
          fileCount = files.size;
        }
        break;
        
      case 'FAILED':
        progress = 100;
        currentStep = 'Analysis failed. Please try again.';
        break;
        
      default:
        progress = 0;
        currentStep = 'Themis is generating compliance report...';
    }

    // Count files from completed analysis
    if (checkRun.status === 'COMPLETED' && checkRun.issues && Array.isArray(checkRun.issues)) {
      const files = new Set();
      (checkRun.issues as any[]).forEach(issue => {
        if (issue.file) files.add(issue.file);
      });
      fileCount = files.size;
    }

    return NextResponse.json({
      status: checkRun.status,
      progress,
      currentStep,
      fileCount,
      createdAt: checkRun.createdAt,
      completedAt: checkRun.completedAt,
    });

  } catch (error) {
    console.error('Progress API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}