import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { repoName, branchName, checkType, summary, issues, checkRunId } = await request.json();

    if (!repoName || !summary || !issues) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }

    // Generate TXT content
    const txt = generateTXT({ repoName, branchName, checkType, summary, issues, checkRunId });

    // Return as downloadable file
    return new NextResponse(txt, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="themis-report-${repoName.replace('/', '-')}-${checkRunId.substring(0, 8)}.txt"`,
      },
    });
  } catch (error) {
    console.error('TXT export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

function generateTXT(data: any): string {
  const { repoName, branchName, checkType, summary, issues } = data;
  
  const lines: string[] = [];
  
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('                  THEMIS COMPLIANCE REPORT');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');
  lines.push(`Repository:  ${repoName}`);
  lines.push(`Branch:      ${branchName || 'N/A'}`);
  lines.push(`Check Type:  ${checkType || 'full'}`);
  lines.push(`Generated:   ${new Date().toISOString()}`);
  lines.push('');
  lines.push('───────────────────────────────────────────────────────────────');
  lines.push('                         SUMMARY');
  lines.push('───────────────────────────────────────────────────────────────');
  lines.push('');
  lines.push(`Total Issues:     ${summary.totalIssues}`);
  lines.push(`High Severity:    ${summary.highSeverity}`);
  lines.push(`Medium Severity:  ${summary.mediumSeverity}`);
  lines.push(`Low Severity:     ${summary.lowSeverity}`);
  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('                          ISSUES');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');

  issues.forEach((issue: any, index: number) => {
    lines.push(`[${index + 1}] ${issue.severity.toUpperCase()} - ${issue.category}`);
    if (issue.ruleId) {
      lines.push(`    Rule ID: ${issue.ruleId}`);
    }
    if (issue.file) {
      lines.push(`    File: ${issue.file}`);
    }
    lines.push('');
    lines.push(`    Description:`);
    lines.push(`    ${issue.description}`);
    lines.push('');
    lines.push(`    Solution:`);
    lines.push(`    ${issue.solution}`);
    lines.push('');
    
    if (issue.aiPinpointLocation) {
      lines.push(`    📍 Themis-Detected Location:`);
      lines.push(`       ${issue.aiPinpointLocation.filePath} (Lines: ${issue.aiPinpointLocation.lineNumbers.join(', ')})`);
      lines.push('');
    }
    
    if (issue.aiSuggestedFix) {
      lines.push(`    💡 Themis-Suggested Fix:`);
      lines.push(`       ${issue.aiSuggestedFix.explanation}`);
      lines.push('');
      lines.push(`       Code:`);
      issue.aiSuggestedFix.codeSnippet.split('\n').forEach((line: string) => {
        lines.push(`       ${line}`);
      });
      lines.push('');
    }
    
    lines.push('───────────────────────────────────────────────────────────────');
    lines.push('');
  });

  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('                      END OF REPORT');
  lines.push('═══════════════════════════════════════════════════════════════');

  return lines.join('\n');
}
