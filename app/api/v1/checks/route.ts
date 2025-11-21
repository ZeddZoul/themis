import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getGithubClient } from '@/lib/github';
import { analyzeAndPersistCompliance } from '@/lib/compliance-hybrid';
import { prisma } from '@/lib/prisma';

interface CheckRequest {
  repoId?: number;
  owner?: string;
  repo?: string;
  checkType: 'APPLE_APP_STORE' | 'GOOGLE_PLAY_STORE' | 'CHROME_WEB_STORE' | 'MOBILE_PLATFORMS';
  branchName?: string;
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  let isAuthenticated = false;

  // 1. Check API Key
  if (apiKey) {
    const user = await prisma.user.findUnique({
      where: { apiKey },
    });
    if (user) {
      isAuthenticated = true;
    }
  }

  // 2. Check Session if no API Key
  if (!isAuthenticated) {
    const session = await getSession();
    if (session.isLoggedIn) {
      isAuthenticated = true;
    }
  }

  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body: CheckRequest = await request.json();
    const { repoId, checkType, branchName } = body;
    let { owner, repo } = body;

    // If repoId is provided, fetch details from GitHub
    if (repoId) {
      const octokit = getGithubClient();
      const { data: repoData } = await octokit.request('GET /repositories/{id}', {
        id: repoId,
      });
      owner = repoData.owner.login;
      repo = repoData.name;
    }

    if (!owner || !repo) {
      return NextResponse.json({ error: 'Missing repository information' }, { status: 400 });
    }

    // Use provided branch or default (we can't easily get default without repoId lookup, so default to main if not provided)
    const branch = branchName || 'main';

    console.log(`Analyzing repository: ${owner}/${repo}@${branch} for ${checkType} compliance`);

    // Run AI-powered compliance check and persist to database
    const session = await getSession();
    const accessToken = session.user?.accessToken;

    const checkRunId = await analyzeAndPersistCompliance(
      owner,
      repo,
      checkType,
      branch,
      accessToken
    );

    console.log(`[Checks API] Created checkRunId: ${checkRunId}, verifying it exists...`);

    // Fetch the saved check run to return results
    const checkRun = await prisma.checkRun.findUnique({
      where: { id: checkRunId },
    });

    console.log(`[Checks API] CheckRun verification: ${checkRun ? 'FOUND' : 'NOT FOUND'} - ${checkRunId}`);

    if (!checkRun) {
      throw new Error('Failed to retrieve check run results');
    }

    const issues = (checkRun.issues as any[]) || [];
    
    const results = {
      status: checkRun.status.toLowerCase(),
      repository: `${owner}/${repo}`,
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
