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

    // Generate YAML content
    const yaml = generateYAML({ repoName, branchName, checkType, summary, issues, checkRunId });

    // Return as downloadable file
    return new NextResponse(yaml, {
      headers: {
        'Content-Type': 'application/x-yaml',
        'Content-Disposition': `attachment; filename="themis-report-${repoName.replace('/', '-')}-${checkRunId.substring(0, 8)}.yaml"`,
      },
    });
  } catch (error) {
    console.error('YAML export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

function generateYAML(data: any): string {
  const { repoName, branchName, checkType, summary, issues, checkRunId } = data;
  
  const yaml = `# Themis Compliance Report
# Repository: ${repoName}
# Branch: ${branchName || 'N/A'}
# Check Type: ${checkType || 'full'}
# Generated: ${new Date().toISOString()}

metadata:
  repository: "${repoName}"
  branch: "${branchName || 'N/A'}"
  check_type: "${checkType || 'full'}"
  generated_at: "${new Date().toISOString()}"
  check_run_id: "${checkRunId}"

summary:
  total_issues: ${summary.totalIssues}
  high_severity: ${summary.highSeverity}
  medium_severity: ${summary.mediumSeverity}
  low_severity: ${summary.lowSeverity}

issues:
${issues.map((issue: any, index: number) => `  - id: ${index + 1}
    severity: ${issue.severity}
    category: "${issue.category}"
    ${issue.ruleId ? `rule_id: "${issue.ruleId}"` : ''}
    description: "${issue.description.replace(/"/g, '\\"')}"
    solution: "${issue.solution.replace(/"/g, '\\"')}"
    ${issue.file ? `file: "${issue.file}"` : ''}
    ${issue.aiPinpointLocation ? `ai_location:
      file_path: "${issue.aiPinpointLocation.filePath}"
      line_numbers: [${issue.aiPinpointLocation.lineNumbers.join(', ')}]` : ''}
    ${issue.aiSuggestedFix ? `ai_fix:
      explanation: "${issue.aiSuggestedFix.explanation.replace(/"/g, '\\"')}"
      code_snippet: |
        ${issue.aiSuggestedFix.codeSnippet.split('\n').map((line: string) => `        ${line}`).join('\n')}` : ''}`).join('\n')}
`;

  return yaml;
}
