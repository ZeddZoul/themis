import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

interface ExportRequest {
  checkRunId: string;
  repoName: string;
  branchName?: string;
  checkType?: string;
  summary: {
    totalIssues: number;
    highSeverity: number;
    mediumSeverity: number;
    lowSeverity: number;
  };
  issues: Array<{
    severity: 'high' | 'medium' | 'low';
    category: string;
    description: string;
    solution: string;
    file?: string;
    ruleId?: string;
    aiPinpointLocation?: {
      filePath: string;
      lineNumbers: number[];
    };
    aiSuggestedFix?: {
      explanation: string;
      codeSnippet: string;
    };
  }>;
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body: ExportRequest = await request.json();
    const { repoName, branchName, checkType, summary, issues } = body;

    console.log(`[Report Export] Generating report for ${repoName} with ${issues.length} issues`);

    // Generate the markdown report using AI
    const markdown = await generateMarkdownReport({
      repoName,
      branchName,
      checkType,
      summary,
      issues,
    });

    return NextResponse.json({
      success: true,
      markdown,
    });
  } catch (error) {
    console.error('[Report Export] Failed to generate markdown report:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      repoName: 'unknown',
      issueCount: 0,
      timestamp: new Date().toISOString(),
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to generate report',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

async function generateMarkdownReport(data: {
  repoName: string;
  branchName?: string;
  checkType?: string;
  summary: ExportRequest['summary'];
  issues: ExportRequest['issues'];
}): Promise<string> {
  try {
    const platformMap: { [key: string]: string } = {
      'APPLE_APP_STORE': 'Apple App Store',
      'GOOGLE_PLAY_STORE': 'Google Play Store',
      'CHROME_WEB_STORE': 'Chrome Web Store',
      'MOBILE_PLATFORMS': 'Mobile Platforms (iOS & Android)',
    };

    const platformName = data.checkType ? platformMap[data.checkType] || data.checkType : 'Unknown Platform';

    const prompt = `You are Themis, an AI compliance expert. Generate a comprehensive, professional Markdown report for a compliance check.

Repository: ${data.repoName}
Branch: ${data.branchName || 'main'}
Platform: ${platformName}
Check Date: ${new Date().toISOString().split('T')[0]}

Summary:
- Total Issues: ${data.summary.totalIssues}
- High Severity: ${data.summary.highSeverity}
- Medium Severity: ${data.summary.mediumSeverity}
- Low Severity: ${data.summary.lowSeverity}

Issues Details:
${JSON.stringify(data.issues, null, 2)}

Create a well-structured Markdown report with:
1. Professional header with repository info and summary
2. Executive summary with key findings
3. Detailed issues organized by severity (Critical/High, Medium, Low)
4. For each issue include:
   - Rule ID and category
   - Clear description of the violation
   - AI-pinpointed code location (if available)
   - Recommended solution with code snippets (if available)
   - Affected files
5. Recommendations section
6. Professional footer

Use proper Markdown formatting with headers, code blocks, tables, and emphasis.
Make it suitable for technical teams and compliance officers.
Be concise but comprehensive.`;

    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const markdown = result.text || '';

    console.log(`[Report Export] Generated ${markdown.length} character report`);
    return markdown;
  } catch (error) {
    console.error('[Report Export] AI generation failed:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      repoName: data.repoName,
      issueCount: data.issues?.length || 0,
      promptLength: prompt?.length || 0,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

