/**
 * Hybrid Compliance Engine
 * 
 * Combines deterministic rules engine with AI augmentation
 * for reliable, consistent, and intelligent compliance checking
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getFileContent } from './github';
import { prisma } from './prisma';
import { evaluateRules, type Platform as RulePlatform, type ComplianceRule } from './compliance-rules';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface ComplianceIssue {
  // Deterministic fields (from rules engine)
  ruleId: string;
  severity: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  solution: string;
  file?: string;
  
  // AI-augmented fields (optional)
  aiPinpointLocation?: {
    filePath: string;
    lineNumbers: number[];
  };
  aiSuggestedFix?: {
    explanation: string;
    codeSnippet: string;
  };
}

export interface AnalysisResult {
  issues: ComplianceIssue[];
  success: boolean;
}

/**
 * Main analysis function: Deterministic + AI Augmentation
 */
export async function analyzeRepositoryCompliance(
  owner: string,
  repo: string,
  checkType: 'APPLE_APP_STORE' | 'GOOGLE_PLAY_STORE' | 'BOTH',
  branchName?: string
): Promise<AnalysisResult> {
  try {
    console.log(`[Hybrid Engine] Starting analysis for ${owner}/${repo}@${branchName || 'default'} (${checkType})`);
    
    // Step 1: Fetch repository files
    const files = await fetchRelevantFiles(owner, repo, branchName);
    console.log(`[Hybrid Engine] Fetched ${Object.keys(files).filter(k => files[k]).length} files`);
    
    // Step 2: Run deterministic rules engine
    console.log(`[Hybrid Engine] Running deterministic rules engine...`);
    const violations = evaluateRules(files, checkType as RulePlatform);
    console.log(`[Hybrid Engine] Found ${violations.length} deterministic violations`);
    
    // Step 3: Convert violations to issues
    const issues: ComplianceIssue[] = violations.map(rule => ({
      ruleId: rule.ruleId,
      severity: rule.severity,
      category: rule.category,
      description: rule.description,
      solution: rule.staticSolution,
      file: findRelevantFile(rule, files),
    }));
    
    // Step 4: AI Augmentation (async, non-blocking)
    console.log(`[Hybrid Engine] Starting AI augmentation for ${issues.length} issues...`);
    const augmentedIssues = await Promise.all(
      issues.map(async (issue) => {
        try {
          const augmentation = await augmentIssueWithAI(issue, files, checkType);
          return { ...issue, ...augmentation };
        } catch (error) {
          console.error(`[Hybrid Engine] AI augmentation failed for ${issue.ruleId}:`, error);
          return issue; // Return deterministic issue without augmentation
        }
      })
    );
    
    console.log(`[Hybrid Engine] Analysis complete: ${augmentedIssues.length} issues (${violations.length} deterministic + AI enhancements)`);
    
    return {
      issues: augmentedIssues,
      success: true,
    };
  } catch (error) {
    console.error('[Hybrid Engine] Unexpected error:', error);
    return {
      issues: [],
      success: false,
    };
  }
}

/**
 * Fetch relevant files from repository
 */
async function fetchRelevantFiles(
  owner: string,
  repo: string,
  branchName?: string
): Promise<{ [key: string]: string | null }> {
  const filesToCheck = [
    'README.md',
    'package.json',
    'app.json',
    'app.config.js',
    'AndroidManifest.xml',
    'Info.plist',
    'privacy-policy.md',
    'PRIVACY.md',
    'LICENSE',
    'terms-of-service.md',
  ];

  const files: { [key: string]: string | null } = {};

  for (const file of filesToCheck) {
    try {
      const content = await getFileContent(owner, repo, file, branchName);
      files[file] = content;
      if (content) {
        console.log(`[Hybrid Engine] ✓ Fetched ${file}`);
      }
    } catch (error) {
      files[file] = null;
    }
  }

  return files;
}

/**
 * Find the most relevant file for a rule
 */
function findRelevantFile(
  rule: ComplianceRule,
  files: { [key: string]: string | null }
): string | undefined {
  if (rule.requiredFiles) {
    for (const file of rule.requiredFiles) {
      if (files[file]) {
        return file;
      }
    }
  }
  
  const category = rule.category.toLowerCase();
  if (category.includes('privacy')) {
    return files['PRIVACY.md'] ? 'PRIVACY.md' : 'README.md';
  }
  if (category.includes('permission')) {
    return files['AndroidManifest.xml'] ? 'AndroidManifest.xml' : 'README.md';
  }
  if (category.includes('description')) {
    return files['README.md'] ? 'README.md' : 'package.json';
  }
  
  return 'README.md';
}

/**
 * AI Augmentation: Enhance deterministic issue with contextual intelligence
 */
interface AIAugmentation {
  aiPinpointLocation?: {
    filePath: string;
    lineNumbers: number[];
  };
  aiSuggestedFix?: {
    explanation: string;
    codeSnippet: string;
  };
}

async function augmentIssueWithAI(
  issue: ComplianceIssue,
  files: { [key: string]: string | null },
  checkType: string
): Promise<AIAugmentation> {
  try {
    const relevantFile = issue.file;
    if (!relevantFile || !files[relevantFile]) {
      return {};
    }

    const fileContent = files[relevantFile];
    if (!fileContent) {
      return {};
    }

    // Add line numbers
    const lines = fileContent.split('\n');
    const numberedContent = lines
      .map((line, idx) => `${idx + 1}: ${line}`)
      .slice(0, 100) // Limit to first 100 lines
      .join('\n');

    console.log(`[AI Augmentation] Processing ${issue.ruleId} for ${relevantFile}...`);
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a code compliance expert. A compliance violation has been detected:

Rule ID: ${issue.ruleId}
Category: ${issue.category}
Description: ${issue.description}
Platform: ${checkType}

File: ${relevantFile}
Content (with line numbers):
\`\`\`
${numberedContent}
\`\`\`

Tasks:
1. Identify exact line numbers where this rule is violated or where a fix should be added
2. Provide a specific, actionable code fix

Respond ONLY with valid JSON:
{
  "lineNumbers": [array of line numbers],
  "explanation": "brief explanation",
  "codeSnippet": "exact code to add/modify"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const augmentation = JSON.parse(jsonMatch[0]);
      console.log(`[AI Augmentation] ✓ Success for ${issue.ruleId}`);
      return {
        aiPinpointLocation: {
          filePath: relevantFile,
          lineNumbers: augmentation.lineNumbers || [],
        },
        aiSuggestedFix: {
          explanation: augmentation.explanation || '',
          codeSnippet: augmentation.codeSnippet || '',
        },
      };
    }
    
    return {};
  } catch (error) {
    console.error(`[AI Augmentation] Error for ${issue.ruleId}:`, error);
    return {};
  }
}

/**
 * Create CheckRun record
 */
export async function createCheckRun(
  owner: string,
  repo: string,
  checkType: 'APPLE_APP_STORE' | 'GOOGLE_PLAY_STORE' | 'BOTH',
  branchName: string = 'main'
): Promise<string> {
  const checkRun = await prisma.checkRun.create({
    data: {
      repositoryId: `${owner}/${repo}`,
      owner,
      repo,
      branchName,
      status: 'IN_PROGRESS',
      checkType,
    },
  });
  
  console.log(`[Hybrid Engine] Created CheckRun ${checkRun.id}`);
  return checkRun.id;
}

/**
 * Update CheckRun with results
 */
export async function updateCheckRunWithResults(
  checkRunId: string,
  result: AnalysisResult
): Promise<void> {
  await prisma.checkRun.update({
    where: { id: checkRunId },
    data: {
      status: result.success ? 'COMPLETED' : 'FAILED',
      issues: result.issues as any,
      completedAt: new Date(),
    },
  });
  
  console.log(`[Hybrid Engine] Updated CheckRun ${checkRunId}: ${result.issues.length} issues`);
}

/**
 * Main entry point: Analyze and persist
 */
export async function analyzeAndPersistCompliance(
  owner: string,
  repo: string,
  checkType: 'APPLE_APP_STORE' | 'GOOGLE_PLAY_STORE' | 'BOTH',
  branchName: string = 'main'
): Promise<string> {
  const checkRunId = await createCheckRun(owner, repo, checkType, branchName);
  
  try {
    const result = await analyzeRepositoryCompliance(owner, repo, checkType, branchName);
    await updateCheckRunWithResults(checkRunId, result);
    return checkRunId;
  } catch (error) {
    await prisma.checkRun.update({
      where: { id: checkRunId },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      },
    });
    throw error;
  }
}
