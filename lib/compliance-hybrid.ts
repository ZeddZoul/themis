/**
 * Hybrid Compliance Engine
 * 
 * Combines deterministic rules engine with AI augmentation
 * for reliable, consistent, and intelligent compliance checking
 */

import { GoogleGenAI } from '@google/genai';
import { getFileContent } from './github';
import { prisma } from './prisma';
import { evaluateRules, type Platform as RulePlatform, type ComplianceRule } from './compliance-rules';

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

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
  aiContentValidation?: {
    isLegitimate: boolean;
    issues: string[];
    suggestions: string[];
  };
}

export interface AnalysisResult {
  issues: ComplianceIssue[];
  success: boolean;
}

/**
 * Main analysis function: Deterministic + AI Augmentation
 */
import * as fs from 'fs';
import * as path from 'path';

function logDebug(message: string) {
  const logFile = path.join(process.cwd(), 'debug-log.txt');
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
}

export async function analyzeRepositoryCompliance(
  owner: string,
  repo: string,
  checkType: 'APPLE_APP_STORE' | 'GOOGLE_PLAY_STORE' | 'CHROME_WEB_STORE' | 'MOBILE_PLATFORMS',
  branchName?: string,
  accessToken?: string
): Promise<AnalysisResult> {
  try {
    logDebug(`Starting analysis for ${owner}/${repo}@${branchName || 'default'} (${checkType})`);
    logDebug(`Access Token present: ${!!accessToken}`);
    
    // Step 1: Fetch repository files
    const files = await fetchRelevantFiles(owner, repo, branchName, accessToken);
    logDebug(`Fetched ${Object.keys(files).filter(k => files[k]).length} files`);
    logDebug(`File names: ${Object.keys(files).join(', ')}`);
    
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
    
    // Step 4: AI Content Validation (validate file legitimacy)
    console.log(`[Hybrid Engine] Running AI content validation...`);
    const contentValidationIssues = await runContentValidation(files, checkType as RulePlatform);
    console.log(`[Hybrid Engine] Found ${contentValidationIssues.length} content validation issues`);
    
    // Merge content validation issues with deterministic issues
    const allIssues = [...issues, ...contentValidationIssues];
    
    // Step 5: AI Augmentation (async, non-blocking)
    console.log(`[Hybrid Engine] Starting AI augmentation for ${allIssues.length} issues...`);
    console.log(`[Hybrid Engine] Available files for augmentation:`, Object.keys(files).length);
    console.log(`[Hybrid Engine] Available file names:`, Object.keys(files));
    
    const augmentedIssues = await Promise.all(
      allIssues.map(async (issue, index) => {
        try {
          console.log(`[Hybrid Engine] Processing issue ${index + 1}/${allIssues.length}: ${issue.ruleId}`);
          const augmentation = await augmentIssueWithAI(issue, files, checkType);
          const hasAugmentation = Object.keys(augmentation).length > 0;
          console.log(`[Hybrid Engine] Issue ${issue.ruleId} augmentation result: ${hasAugmentation ? 'SUCCESS' : 'NO_AUGMENTATION'}`);
          return { ...issue, ...augmentation };
        } catch (error) {
          console.error(`[Hybrid Engine] AI augmentation failed for ${issue.ruleId}:`, {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            ruleId: issue.ruleId,
            severity: issue.severity,
            category: issue.category,
            timestamp: new Date().toISOString(),
          });
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
    console.error('[Hybrid Engine] Unexpected error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      owner,
      repo,
      branch: branchName,
      checkType,
      timestamp: new Date().toISOString(),
    });
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
  branchName?: string,
  accessToken?: string
): Promise<{ [key: string]: string | null }> {
  const filesToCheck = [
    // Core documentation
    'README.md',
    'LICENSE',
    'index.html',
    
    // Mobile app files
    'package.json',
    'app.json',
    'app.config.js',
    'AndroidManifest.xml',
    'Info.plist',
    'build.gradle',
    'app/build.gradle',
    
    // Chrome extension files
    'manifest.json',
    
    // Privacy and legal
    'privacy-policy.md',
    'PRIVACY.md',
    'terms-of-service.md',
    'TERMS.md',
    'COMMUNITY_GUIDELINES.md',
    
    // Security configs
    'network_security_config.xml',
    'res/xml/network_security_config.xml',
    'PrivacyInfo.xcprivacy',
    
    // Additional config files
    'strings.xml',
    'res/values/strings.xml',
  ];

  const files: { [key: string]: string | null } = {};

  for (const file of filesToCheck) {
    try {
      const content = await getFileContent(owner, repo, file, branchName, accessToken);
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
  
  // Helper to find first existing file from a list
  const findFirstExisting = (candidates: string[]) => {
    for (const f of candidates) {
      if (files[f]) return f;
    }
    return undefined;
  };

  if (category.includes('privacy')) {
    return findFirstExisting(['PRIVACY.md', 'privacy-policy.md', 'README.md', 'index.html']) || 'README.md';
  }
  if (category.includes('permission')) {
    return findFirstExisting(['AndroidManifest.xml', 'Info.plist', 'app.json', 'README.md', 'index.html']) || 'README.md';
  }
  if (category.includes('description')) {
    return findFirstExisting(['README.md', 'index.html', 'package.json']) || 'README.md';
  }
  
  // General fallback: try to find any common file that exists
  return findFirstExisting(['README.md', 'index.html', 'package.json']) || 'README.md';
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
  aiContentValidation?: {
    isLegitimate: boolean;
    issues: string[];
    suggestions: string[];
  };
}

async function augmentIssueWithAI(
  issue: ComplianceIssue,
  files: { [key: string]: string | null },
  checkType: string
): Promise<AIAugmentation> {
  const relevantFile = issue.file;
  try {
    console.log(`[AI Augmentation] Starting augmentation for ${issue.ruleId}, file: ${relevantFile || 'undefined'}`);
    
    if (!relevantFile) {
      console.log(`[AI Augmentation] Skipping ${issue.ruleId} - no relevant file`);
      return {};
    }

    console.log(`[AI Augmentation] Looking for file key: "${relevantFile}" in files object`);
    console.log(`[AI Augmentation] File exists in object: ${relevantFile in files}`);
    console.log(`[AI Augmentation] File content exists: ${!!files[relevantFile]}`);
    
    if (!relevantFile) {
      console.log(`[AI Augmentation] Skipping ${issue.ruleId} - no relevant file`);
      return {};
    }

    // Note: We don't early-return if file is not found
    // The AI should provide "create this file" guidance for missing files
    // This is checked below in the fileContent conditional
    console.log(`[AI Augmentation] File in fetched collection: ${relevantFile in files ? 'YES' : 'NO'}`);

    // Logic for handling file content is below

    const fileContent = relevantFile ? files[relevantFile] : null;
    
    let prompt = '';
    
    if (fileContent) {
      // Case 1: File exists, analyze it
      const lines = fileContent.split('\n');
      const numberedContent = lines
        .map((line, idx) => `${idx + 1}: ${line}`)
        .slice(0, 300) // Increased context
        .join('\n');

      console.log(`[AI Augmentation] Processing ${issue.ruleId} for ${relevantFile}...`);
      console.log(`[AI Augmentation] File content length: ${fileContent.length} chars`);
      
      // Enhanced prompt for both location finding and content validation
      prompt = `You are a compliance expert for ${checkType} app store policies. A compliance violation has been detected:

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
1. Validate if the file content is legitimate and compliant
2. Identify exact line numbers where this rule is violated
3. Provide specific, actionable code fixes

Respond ONLY with a single valid JSON object. Do not include any other text, explanations, or markdown formatting outside the JSON.
The JSON must follow this structure:
{
  "isLegitimate": boolean,
  "contentIssues": ["list of specific content problems found"],
  "suggestions": ["list of specific improvements needed"],
  "lineNumbers": [array of line numbers where issues occur],
  "explanation": "brief explanation of the violation",
  "codeSnippet": "exact code to add/modify"
}`;
    } else {
      // Case 2: File is missing, generate it
      logDebug(`[AI Augmentation] File ${relevantFile} is missing. Requesting generation.`);
      
      prompt = `You are a compliance expert for ${checkType} app store policies. A compliance violation has been detected because a required file or section is MISSING:

Rule ID: ${issue.ruleId}
Category: ${issue.category}
Description: ${issue.description}
Platform: ${checkType}
Missing File: ${relevantFile || 'Unknown'}

Tasks:
1. Explain why this file/section is required
2. Provide a COMPLETE template or code snippet to create this file/section and satisfy the rule

Respond ONLY with a single valid JSON object. Do not include any other text, explanations, or markdown formatting outside the JSON.
The JSON must follow this structure:
{
  "isLegitimate": false,
  "contentIssues": ["File is missing"],
  "suggestions": ["Create the file with the provided content"],
  "lineNumbers": [],
  "explanation": "Explanation of why this file is needed",
  "codeSnippet": "Complete code/content for the new file"
}`;
    }

    console.log(`[AI Augmentation] Sending prompt to Gemini 2.5 Pro...`);
    
    let result;
    try {
      result = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
    } catch (apiError) {
      console.error(`[AI Augmentation] ❌ Gemini API call failed for ${issue.ruleId}:`, {
        error: apiError instanceof Error ? apiError.message : String(apiError),
        stack: apiError instanceof Error ? apiError.stack : undefined,
      });
      return {};
    }
    
    const text = result.text || '';
    
    console.log(`[AI Augmentation] ✅ Gemini response received for ${issue.ruleId}. Length: ${text.length}`);
    console.log(`[AI Augmentation] Raw response preview: ${text.substring(0, 100)}...`);
    
    // Clean up the response text to ensure we extract valid JSON
    let cleanText = text.trim();
    
    // Remove markdown code blocks if present
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Find the first '{' and last '}' to extract the JSON object
    const firstOpen = cleanText.indexOf('{');
    const lastClose = cleanText.lastIndexOf('}');
    
    let jsonString = '';
    if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
      jsonString = cleanText.substring(firstOpen, lastClose + 1);
    } else {
      jsonString = cleanText; // Try parsing the whole text if no braces found (unlikely but possible)
    }

    if (jsonString) {
      console.log(`[AI Augmentation] Attempting to parse JSON for ${issue.ruleId}...`);
      try {
        const augmentation = JSON.parse(jsonString);
        console.log(`[AI Augmentation] ✅ Successfully parsed JSON for ${issue.ruleId}`);
        console.log(`[AI Augmentation] Augmentation has explanation: ${!!augmentation.explanation}`);
        console.log(`[AI Augmentation] Augmentation has codeSnippet: ${!!augmentation.codeSnippet}`);
        console.log(`[AI Augmentation] Augmentation has lineNumbers: ${!!augmentation.lineNumbers}`);
        return {
          aiPinpointLocation: {
            filePath: relevantFile,
            lineNumbers: augmentation.lineNumbers || [],
          },
          aiSuggestedFix: {
            explanation: augmentation.explanation || '',
            codeSnippet: augmentation.codeSnippet || '',
          },
          aiContentValidation: {
            isLegitimate: augmentation.isLegitimate || false,
            issues: augmentation.contentIssues || [],
            suggestions: augmentation.suggestions || [],
          },
        };
      } catch (parseError) {
        console.error(`[AI Augmentation] ❌ JSON parse error for ${issue.ruleId}:`, parseError);
        console.log(`[AI Augmentation] Failed JSON string: ${jsonString.substring(0, 200)}`);
        return {};
      }
    } else {
      console.warn(`[AI Augmentation] ⚠️ No JSON found in response for ${issue.ruleId}`);
      console.log(`[AI Augmentation] Full response text: ${text}`);
      return {};
    }
  } catch (error) {
    console.error(`[AI Augmentation] ❌ CRITICAL ERROR for ${issue.ruleId}:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ruleId: issue.ruleId,
    });
    return {};
  }
}

/**
 * AI-powered content validation for specific file types
 */
async function validateFileContentWithAI(
  filePath: string,
  content: string,
  expectedType: 'privacy_policy' | 'manifest' | 'readme' | 'config',
  platform: string
): Promise<{
  isValid: boolean;
  issues: string[];
  suggestions: string[];
}> {
  try {

    
    const validationPrompts = {
      privacy_policy: `Analyze this privacy policy for ${platform} compliance. Check for:
- Specific data collection practices (not generic templates)
- Clear explanation of data usage
- Contact information for privacy inquiries
- Compliance with platform-specific requirements
- Legitimate, non-placeholder content`,
      
      manifest: `Analyze this manifest file for ${platform} compliance. Check for:
- Proper permission declarations with justification
- Correct configuration values (not defaults/placeholders)
- Required fields are properly filled
- Security configurations are appropriate`,
      
      readme: `Analyze this README for ${platform} app store compliance. Check for:
- Clear app description (not template text)
- Proper feature documentation
- Contact/support information
- Privacy policy links
- Legitimate project information (not placeholder)`,
      
      config: `Analyze this configuration file for ${platform} compliance. Check for:
- Proper security settings
- Non-default/placeholder values
- Required configurations are present
- Best practices are followed`
    };

    const prompt = `${validationPrompts[expectedType]}

File: ${filePath}
Content:
\`\`\`
${content.slice(0, 3000)} // Limit content for API
\`\`\`

Respond ONLY with valid JSON:
{
  "isValid": boolean,
  "issues": ["specific problems found"],
  "suggestions": ["specific improvements needed"]
}`;

    console.log(`[AI Content Validation] Sending prompt for ${filePath} (type: ${expectedType})...`);
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const text = result.text || '';
    
    console.log(`[AI Content Validation] Received response for ${filePath}. Length: ${text.length}`);
    console.log(`[AI Content Validation] Raw response preview for ${filePath}: ${text.substring(0, 100)}...`);

    // Clean the response to get just the JSON
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const firstOpen = cleanText.indexOf('{');
    const lastClose = cleanText.lastIndexOf('}');
    
    let jsonString = '';
    if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
      jsonString = cleanText.substring(firstOpen, lastClose + 1);
    } else {
      jsonString = cleanText;
    }

    if (jsonString) {
      console.log(`[AI Content Validation] Attempting to parse JSON for ${filePath}...`);
      try {
        const validation = JSON.parse(jsonString);
        console.log(`[AI Content Validation] Successfully parsed JSON for ${filePath}. IsValid: ${validation.isValid}`);
        return {
          isValid: validation.isValid || false,
          issues: validation.issues || [],
          suggestions: validation.suggestions || [],
        };
      } catch (parseError) {
        console.error(`[AI Content Validation] Failed to parse JSON for ${filePath}:`, parseError);
        console.log(`[AI Content Validation] Failed JSON string for ${filePath}: ${jsonString}`);
        return { isValid: false, issues: ['Failed to parse AI response'], suggestions: [] };
      }
    } else {
      console.warn(`[AI Content Validation] No JSON found in response for ${filePath}. Raw text preview: ${text.substring(0, 100)}...`);
      return { isValid: false, issues: ['No JSON found in AI response'], suggestions: [] };
    }
  } catch (error) {
    console.error(`[Content Validation] Error validating ${filePath}:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      filePath,
      expectedType,
      contentLength: content?.length || 0,
      timestamp: new Date().toISOString(),
    });
    return { isValid: false, issues: ['AI validation failed'], suggestions: [] };
  }
}

/**
 * Create CheckRun record
 */
export async function createCheckRun(
  owner: string,
  repo: string,
  checkType: 'APPLE_APP_STORE' | 'GOOGLE_PLAY_STORE' | 'CHROME_WEB_STORE' | 'MOBILE_PLATFORMS',
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
 * Run AI-powered content validation on all files
 */
async function runContentValidation(
  files: { [key: string]: string | null },
  platform: RulePlatform
): Promise<ComplianceIssue[]> {
  const validationIssues: ComplianceIssue[] = [];
  
  // Define file validation mappings
  const fileValidations = [
    { file: 'README.md', type: 'readme' as const, priority: 'high' as const },
    { file: 'PRIVACY.md', type: 'privacy_policy' as const, priority: 'high' as const },
    { file: 'privacy-policy.md', type: 'privacy_policy' as const, priority: 'high' as const },
    { file: 'manifest.json', type: 'manifest' as const, priority: 'high' as const },
    { file: 'AndroidManifest.xml', type: 'manifest' as const, priority: 'high' as const },
    { file: 'Info.plist', type: 'config' as const, priority: 'medium' as const },
    { file: 'package.json', type: 'config' as const, priority: 'medium' as const },
  ];
  
  for (const validation of fileValidations) {
    const content = files[validation.file];
    if (content) {
      try {
        console.log(`[Content Validation] Validating ${validation.file}...`);
        const result = await validateFileContentWithAI(
          validation.file,
          content,
          validation.type,
          platform
        );
        
        if (!result.isValid && result.issues.length > 0) {
          validationIssues.push({
            ruleId: `AI-CONTENT-${validation.file.replace(/[^A-Z0-9]/gi, '_').toUpperCase()}`,
            severity: validation.priority,
            category: 'Content Validation',
            description: `AI detected content issues in ${validation.file}: ${result.issues.join(', ')}`,
            solution: `Address the following content issues: ${result.suggestions.join('; ')}`,
            file: validation.file,
            aiContentValidation: {
              isLegitimate: result.isValid,
              issues: result.issues,
              suggestions: result.suggestions,
            },
          });
        }
      } catch (error) {
        console.error(`[Content Validation] Error validating ${validation.file}:`, {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          file: validation.file,
          expectedType: validation.type,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }
  
  return validationIssues;
}

/**
 * Main entry point: Analyze and persist
 */
export async function analyzeAndPersistCompliance(
  owner: string,
  repo: string,
  checkType: 'APPLE_APP_STORE' | 'GOOGLE_PLAY_STORE' | 'CHROME_WEB_STORE' | 'MOBILE_PLATFORMS',
  branchName: string = 'main',
  accessToken?: string
): Promise<string> {
  const checkRunId = await createCheckRun(owner, repo, checkType, branchName);
  
  try {
    const result = await analyzeRepositoryCompliance(owner, repo, checkType, branchName, accessToken);
    await updateCheckRunWithResults(checkRunId, result);
    return checkRunId;
  } catch (error) {
    console.error('[Hybrid Engine] Analysis failed:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      checkRunId,
      owner,
      repo,
      checkType,
      branchName,
      timestamp: new Date().toISOString(),
    });
    
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
