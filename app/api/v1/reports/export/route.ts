import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

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



    // Generate the markdown report (template-based, no AI)
    const markdown = generateMarkdownReport({
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

function generateMarkdownReport(data: {
  repoName: string;
  branchName?: string;
  checkType?: string;
  summary: ExportRequest['summary'];
  issues: ExportRequest['issues'];
}): string {
  const platformMap: { [key: string]: string } = {
    'APPLE_APP_STORE': 'Apple App Store',
    'GOOGLE_PLAY_STORE': 'Google Play Store',
    'CHROME_WEB_STORE': 'Chrome Web Store',
    'MOBILE_PLATFORMS': 'Mobile Platforms (iOS & Android)',
  };

  const platformName = data.checkType ? platformMap[data.checkType] || data.checkType : 'Unknown Platform';
  const date = new Date().toISOString().split('T')[0];

  // Group issues by severity
  const highIssues = data.issues.filter(i => i.severity === 'high');
  const mediumIssues = data.issues.filter(i => i.severity === 'medium');
  const lowIssues = data.issues.filter(i => i.severity === 'low');

  const lines: string[] = [];

  // Header
  lines.push('# Themis Compliance Report');
  lines.push('');
  lines.push(`**Repository:** ${data.repoName}  `);
  lines.push(`**Branch:** ${data.branchName || 'main'}  `);
  lines.push(`**Platform:** ${platformName}  `);
  lines.push(`**Generated:** ${date}  `);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Executive Summary
  lines.push('## Executive Summary');
  lines.push('');
  lines.push('| Metric | Count |');
  lines.push('|--------|-------|');
  lines.push(`| Total Issues | ${data.summary.totalIssues} |`);
  lines.push(`| 🔴 High Severity | ${data.summary.highSeverity} |`);
  lines.push(`| 🟡 Medium Severity | ${data.summary.mediumSeverity} |`);
  lines.push(`| 🟢 Low Severity | ${data.summary.lowSeverity} |`);
  lines.push('');

  // Compliance Score
  const totalPossibleIssues = data.summary.totalIssues || 1;
  const score = Math.max(0, 100 - (data.summary.highSeverity * 10 + data.summary.mediumSeverity * 5 + data.summary.lowSeverity * 2));
  lines.push(`**Compliance Score:** ${score.toFixed(0)}/100`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Helper function to render issues
  const renderIssues = (issues: typeof data.issues, severityLabel: string, emoji: string) => {
    if (issues.length === 0) return;

    lines.push(`## ${emoji} ${severityLabel} Severity Issues`);
    lines.push('');

    issues.forEach((issue, index) => {
      lines.push(`### ${index + 1}. ${issue.category}`);
      lines.push('');
      
      if (issue.ruleId) {
        lines.push(`**Rule ID:** \`${issue.ruleId}\`  `);
      }
      if (issue.file) {
        lines.push(`**File:** \`${issue.file}\`  `);
      }
      lines.push('');

      lines.push('**Description:**');
      lines.push('');
      lines.push(issue.description);
      lines.push('');

      if (issue.aiPinpointLocation && issue.aiPinpointLocation.lineNumbers.length > 0) {
        lines.push('**📍 Themis-Detected Location:**');
        lines.push('');
        lines.push(`\`${issue.aiPinpointLocation.filePath}\` - Lines: ${issue.aiPinpointLocation.lineNumbers.join(', ')}`);
        lines.push('');
      }

      lines.push('**Solution:**');
      lines.push('');
      lines.push(issue.solution);
      lines.push('');

      if (issue.aiSuggestedFix && issue.aiSuggestedFix.explanation) {
        lines.push('**💡 Themis-Suggested Fix:**');
        lines.push('');
        lines.push(issue.aiSuggestedFix.explanation);
        lines.push('');
        
        if (issue.aiSuggestedFix.codeSnippet) {
          lines.push('```');
          lines.push(issue.aiSuggestedFix.codeSnippet);
          lines.push('```');
          lines.push('');
        }
      }

      lines.push('---');
      lines.push('');
    });
  };

  // Render issues by severity
  renderIssues(highIssues, 'High', '🔴');
  renderIssues(mediumIssues, 'Medium', '🟡');
  renderIssues(lowIssues, 'Low', '🟢');

  // Recommendations
  lines.push('## Recommendations');
  lines.push('');
  if (data.summary.highSeverity > 0) {
    lines.push('1. **Address all high-severity issues immediately** - These are critical compliance violations that may result in app rejection.');
  }
  if (data.summary.mediumSeverity > 0) {
    lines.push('2. **Review medium-severity issues** - These should be addressed before submission to avoid potential delays.');
  }
  if (data.summary.lowSeverity > 0) {
    lines.push('3. **Consider low-severity improvements** - While not critical, these enhance overall compliance and app quality.');
  }
  lines.push('');

  // Footer
  lines.push('---');
  lines.push('');
  lines.push('*Generated by Themis - Automated Compliance Checker*');
  lines.push('');

  return lines.join('\n');
}

