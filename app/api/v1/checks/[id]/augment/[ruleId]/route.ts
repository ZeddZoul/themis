import { NextRequest, NextResponse } from 'next/server';
import { augmentSingleIssue } from '@/lib/compliance-hybrid';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; ruleId: string } }
) {
  try {
    const { id: checkRunId, ruleId } = params;

    console.log(`[API] On-demand augmentation requested for ${ruleId} in check ${checkRunId}`);

    const augmentation = await augmentSingleIssue(checkRunId, ruleId);

    if (!augmentation) {
      return NextResponse.json(
        { error: 'Failed to generate AI insights' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      augmentation,
    });
  } catch (error) {
    console.error('[API] On-demand augmentation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
