import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getGithubClient } from '@/lib/github';
import { analyzeAndPersistCompliance } from '@/lib/compliance-hybrid';
import { prisma } from '@/lib/prisma';

interface CheckRequest {
  repoId: number;
  checkType: 'APPLE_APP_STORE' | 'GOOGLE_PLAY_STORE' | 'BOTH';
  branchName?: string;
}

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body: CheckRequest = await request.json();
    const { repoId, checkType, branchName } = body;

    // Get repository details
    const octokit = getGithubClient();
    const { data: repo } = await octokit.request('GET /repositories/{id}', {
      id: repoId,
    });

    // Use provided branch or default branch
    const branch = branchName || repo.default_branch || 'main';

    console.log(`Analyzing repository: ${repo.full_name}@${branch} for ${checkType} compliance`);

    // Run AI-powered compliance check and persist to database
    const checkRunId = await analyzeAndPersistCompliance(
      repo.owner.login,
      repo.name,
      checkType,
      branch
    );

    // Fetch the saved check run to return results
    const checkRun = await prisma.checkRun.findUnique({
      where: { id: checkRunId },
    });

    if (!checkRun) {
      throw new Error('Failed to retrieve check run results');
    }

    const issues = (checkRun.issues as any[]) || [];
    
    const results = {
      status: checkRun.status.toLowerCase(),
      repository: repo.full_name,
      checkType,
      checkRunId,
      summary: {
        totalIssues: issues.length,
        highSeverity: issues.filter((i: any) => i.severity === 'high').length,
        mediumSeverity: issues.filter((i: any) => i.severity === 'medium').length,
        lowSeverity: issues.filter((i: any) => i.severity === 'low').length,
      },
      issues,
    };

    console.log(`Analysis complete and saved: ${issues.length} issues found`);

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error running check:', error);
    return NextResponse.json(
      { error: 'Failed to run check', details: error.message },
      { status: 500 }
    );
  }
}
