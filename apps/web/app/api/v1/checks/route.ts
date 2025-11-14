import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getGithubClient } from '@/lib/github';
import { analyzeRepositoryCompliance } from '@/lib/compliance';

interface CheckRequest {
  repoId: number;
  checkType: 'APPLE_APP_STORE' | 'GOOGLE_PLAY_STORE' | 'BOTH';
}

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body: CheckRequest = await request.json();
    const { repoId, checkType } = body;

    // Get repository details
    const octokit = getGithubClient();
    const { data: repo } = await octokit.request('GET /repositories/{id}', {
      id: repoId,
    });

    console.log(`Analyzing repository: ${repo.full_name} for ${checkType} compliance`);

    // Run AI-powered compliance check
    const issues = await analyzeRepositoryCompliance(
      repo.owner.login,
      repo.name,
      checkType
    );

    const results = {
      status: 'completed',
      repository: repo.full_name,
      checkType,
      summary: {
        totalIssues: issues.length,
        highSeverity: issues.filter((i) => i.severity === 'high').length,
        mediumSeverity: issues.filter((i) => i.severity === 'medium').length,
        lowSeverity: issues.filter((i) => i.severity === 'low').length,
      },
      issues,
    };

    console.log(`Analysis complete: ${issues.length} issues found`);

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error running check:', error);
    return NextResponse.json(
      { error: 'Failed to run check', details: error.message },
      { status: 500 }
    );
  }
}
