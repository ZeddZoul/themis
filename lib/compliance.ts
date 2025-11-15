import { GoogleGenerativeAI } from '@google/generative-ai';
import { getFileContent } from './github';
import { prisma } from './prisma';
import { evaluateRules, COMPLIANCE_RULES, type Platform as RulePlatform } from './compliance-rules';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface ComplianceIssue {
  // Deterministic fields (from rules engine)
  ruleId: string;
  severity: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  solution: string; // Static solution from rule
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

export enum ComplianceErrorType {
  MISSING_FILE = 'MISSING_FILE',
  GITHUB_API_ERROR = 'GITHUB_API_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  INVALID_CONTENT = 'INVALID_CONTENT',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  UNKNOWN = 'UNKNOWN',
}

export interface ComplianceError {
  type: ComplianceErrorType;
  message: string;
  details?: string;
  file?: string;
  retryAfter?: number; // For rate limit errors (in seconds)
}

export interface FetchFilesResult {
  files: { [key: string]: string | null };
  errors: ComplianceError[];
}

/**
 * Categorizes an error into a ComplianceErrorType with appropriate details
 */
export function categorizeError(error: any, file?: string): ComplianceError {
  // GitHub API errors
  if (error.status) {
    switch (error.status) {
      case 403:
        return {
          type: ComplianceErrorType.GITHUB_API_ERROR,
          message: 'Permission denied to access repository',
          details: error.message || 'GitHub API returned 403 Forbidden',
          file,
        };
      case 404:
        return {
          type: ComplianceErrorType.MISSING_FILE,
          message: file ? `File '${file}' not found in repository` : 'Resource not found',
          details: error.message,
          file,
        };
      case 429:
        // Extract retry-after header if available
        const retryAfter = error.response?.headers?.['retry-after'] 
          ? parseInt(error.response.headers['retry-after']) 
          : 3600; // Default to 1 hour
        return {
          type: ComplianceErrorType.RATE_LIMIT,
          message: 'GitHub API rate limit exceeded',
          details: `Rate limit reached. Retry after ${Math.ceil(retryAfter / 60)} minutes`,
          retryAfter,
          file,
        };
      case 500:
      case 502:
      case 503:
        return {
          type: ComplianceErrorType.GITHUB_API_ERROR,
          message: 'GitHub API server error',
          details: error.message || `GitHub API returned ${error.status}`,
          file,
        };
      default:
        return {
          type: ComplianceErrorType.GITHUB_API_ERROR,
          message: 'GitHub API error',
          details: error.message || `Status: ${error.status}`,
          file,
        };
    }
  }

  // Network errors
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return {
      type: ComplianceErrorType.GITHUB_API_ERROR,
      message: 'Network error connecting to GitHub',
      details: error.message || error.code,
      file,
    };
  }

  // AI service errors
  if (error.message?.includes('Gemini') || error.message?.includes('API key')) {
    return {
      type: ComplianceErrorType.AI_SERVICE_ERROR,
      message: 'AI service error',
      details: error.message,
      file,
    };
  }

  // Invalid content errors
  if (error instanceof SyntaxError || error.message?.includes('parse') || error.message?.includes('invalid')) {
    return {
      type: ComplianceErrorType.INVALID_CONTENT,
      message: 'Invalid or malformed content',
      details: error.message,
      file,
    };
  }

  // Unknown errors
  return {
    type: ComplianceErrorType.UNKNOWN,
    message: 'An unexpected error occurred',
    details: error.message || String(error),
    file,
  };
}

export interface AnalysisResult {
  issues: ComplianceIssue[];
  errors: ComplianceError[];
  success: boolean;
}

export async function analyzeRepositoryCompliance(
  owner: string,
  repo: string,
  checkType: 'APPLE_APP_STORE' | 'GOOGLE_PLAY_STORE' | 'BOTH',
  branchName?: string
): Promise<AnalysisResult> {
  const allErrors: ComplianceError[] = [];
  
  try {
    console.log(`Starting compliance analysis for ${owner}/${repo}@${branchName || 'default'} (${checkType})`);
    
    // Fetch relevant files from the repository
    const { files, errors: fetchErrors } = await fetchRelevantFiles(owner, repo, branchName);
    allErrors.push(...fetchErrors);
    
    // Check for critical errors that prevent analysis
    const criticalErrors = fetchErrors.filter(
      e => e.type === ComplianceErrorType.RATE_LIMIT || 
           e.type === ComplianceErrorType.GITHUB_API_ERROR
    );
    
    if (criticalErrors.length > 0) {
      console.error('Critical errors prevent analysis:', criticalErrors);
      return {
        issues: [],
        errors: allErrors,
        success: false,
      };
    }
    
    // Prepare context for Gemini
    const context = prepareComplianceContext(files, checkType);
    
    // Analyze with Gemini AI
    const { issues, errors: aiErrors } = await analyzeWithGemini(context, checkType);
    allErrors.push(...aiErrors);
    
    console.log(`Analysis complete: ${issues.length} issues found, ${allErrors.length} errors encountered`);
    
    return {
      issues,
      errors: allErrors,
      success: true,
    };
  } catch (error) {
    console.error('Unexpected error during repository analysis:', error);
    const complianceError = categorizeError(error);
    allErrors.push(complianceError);
    
    return {
      issues: [],
      errors: allErrors,
      success: false,
    };
  }
}

async function fetchRelevantFiles(owner: string, repo: string, branchName?: string): Promise<FetchFilesResult> {
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
  const errors: ComplianceError[] = [];

  for (const file of filesToCheck) {
    try {
      const content = await getFileContent(owner, repo, file, branchName);
      if (content) {
        files[file] = content;
        console.log(`✓ Successfully fetched ${file}`);
      } else {
        // File exists but is empty
        console.log(`⚠ File ${file} is empty`);
      }
    } catch (error) {
      const complianceError = categorizeError(error, file);
      
      // Only log non-404 errors as they are more critical
      if (complianceError.type !== ComplianceErrorType.MISSING_FILE) {
        console.error(`✗ Error fetching ${file}:`, {
          type: complianceError.type,
          message: complianceError.message,
          details: complianceError.details,
        });
        errors.push(complianceError);
      } else {
        // Missing files are expected, just log at info level
        console.log(`ℹ File ${file} not found (expected for some repositories)`);
      }
      
      // Continue analysis even if files are missing
      files[file] = null;
    }
  }

  console.log(`Fetched ${Object.values(files).filter(f => f !== null).length}/${filesToCheck.length} files`);
  if (errors.length > 0) {
    console.log(`Encountered ${errors.length} critical errors during file fetching`);
  }

  return { files, errors };
}

function prepareComplianceContext(
  files: { [key: string]: string | null },
  checkType: string
): string {
  let context = `Analyzing a mobile app repository for ${checkType} compliance.\n\n`;
  context += 'Repository files:\n\n';

  for (const [filename, content] of Object.entries(files)) {
    if (content) {
      context += `--- ${filename} ---\n`;
      context += content.substring(0, 2000); // Limit content length
      context += '\n\n';
    }
  }

  return context;
}

interface AnalyzeWithGeminiResult {
  issues: ComplianceIssue[];
  errors: ComplianceError[];
}

async function analyzeWithGemini(
  context: string,
  checkType: string
): Promise<AnalyzeWithGeminiResult> {
  const errors: ComplianceError[] = [];
  
  try {
    console.log('Calling Gemini AI for compliance analysis...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a mobile app compliance expert. Analyze the following repository for ${checkType} compliance issues.

${context}

Check for the following compliance requirements:

For Apple App Store:
1. Privacy Policy - Must have a publicly accessible privacy policy URL
2. Data Collection Disclosure - Must clearly disclose what data is collected
3. App Description - Must accurately describe app functionality
4. Age Rating - Must have appropriate age rating information
5. Third-party SDKs - Must disclose third-party data collection

For Google Play Store:
1. Privacy Policy - Must have a privacy policy link
2. Data Safety Section - Must declare data collection and sharing practices
3. Permissions - Must justify all requested permissions
4. Target API Level - Must target recent Android API level
5. Content Rating - Must have appropriate content rating

Analyze the repository and return a JSON array of compliance issues found. Each issue should have:
- severity: "high" | "medium" | "low"
- category: string (e.g., "Privacy Policy", "Data Collection")
- description: string (what the issue is)
- solution: string (how to fix it)
- file: string (which file has the issue, if applicable)

Return ONLY valid JSON array, no other text. If no issues found, return empty array [].`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    console.log('Received response from Gemini AI');
    
    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const issues = JSON.parse(jsonMatch[0]);
        console.log(`✓ Successfully parsed ${issues.length} issues from AI response`);
        return { issues, errors };
      } catch (parseError) {
        console.error('Failed to parse JSON from AI response:', parseError);
        const error: ComplianceError = {
          type: ComplianceErrorType.INVALID_CONTENT,
          message: 'Failed to parse AI response',
          details: parseError instanceof Error ? parseError.message : String(parseError),
        };
        errors.push(error);
        
        // Return fallback issues
        console.log('Using fallback issues due to parse error');
        return { issues: getFallbackIssues(checkType), errors };
      }
    }
    
    console.warn('No JSON array found in AI response, using fallback issues');
    return { issues: getFallbackIssues(checkType), errors };
    
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    
    const complianceError: ComplianceError = {
      type: ComplianceErrorType.AI_SERVICE_ERROR,
      message: 'AI service error during analysis',
      details: error instanceof Error ? error.message : String(error),
    };
    errors.push(complianceError);
    
    // Return fallback issues if AI fails
    console.log('Using fallback issues due to AI service error');
    return { issues: getFallbackIssues(checkType), errors };
  }
}

function getFallbackIssues(checkType: string): ComplianceIssue[] {
  return [
    {
      severity: 'high',
      category: 'Privacy Policy',
      description: 'Could not verify privacy policy presence. Ensure you have a publicly accessible privacy policy.',
      solution: 'Add a privacy policy URL in your app store listing and include a PRIVACY.md file in your repository',
      file: 'README.md',
    },
    {
      severity: 'medium',
      category: 'Data Collection',
      description: 'Unable to verify data collection disclosures',
      solution: 'Clearly document all data collection practices in your privacy policy and app store listing',
    },
  ];
}

/**
 * Determines if an error is retryable based on its type
 */
export function isErrorRetryable(error: ComplianceError): boolean {
  switch (error.type) {
    case ComplianceErrorType.RATE_LIMIT:
    case ComplianceErrorType.AI_SERVICE_ERROR:
      return true;
    case ComplianceErrorType.GITHUB_API_ERROR:
      // Some GitHub API errors are retryable (500, 502, 503)
      return error.details?.includes('500') || 
             error.details?.includes('502') || 
             error.details?.includes('503') ||
             error.message?.includes('server error') ||
             false;
    case ComplianceErrorType.MISSING_FILE:
    case ComplianceErrorType.INVALID_CONTENT:
    case ComplianceErrorType.UNKNOWN:
    default:
      return false;
  }
}

/**
 * Gets the primary error from a list of errors (most critical)
 */
export function getPrimaryError(errors: ComplianceError[]): ComplianceError | null {
  if (errors.length === 0) return null;
  
  // Priority order: RATE_LIMIT > GITHUB_API_ERROR > AI_SERVICE_ERROR > others
  const priorityOrder = [
    ComplianceErrorType.RATE_LIMIT,
    ComplianceErrorType.GITHUB_API_ERROR,
    ComplianceErrorType.AI_SERVICE_ERROR,
    ComplianceErrorType.INVALID_CONTENT,
    ComplianceErrorType.MISSING_FILE,
    ComplianceErrorType.UNKNOWN,
  ];
  
  for (const type of priorityOrder) {
    const error = errors.find(e => e.type === type);
    if (error) return error;
  }
  
  return errors[0];
}

/**
 * Formats error details for storage in the database
 */
export function formatErrorDetails(errors: ComplianceError[]): string {
  return JSON.stringify(errors, null, 2);
}

/**
 * Creates a new CheckRun record in the database
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
  
  console.log(`Created CheckRun ${checkRun.id} for ${owner}/${repo}@${branchName}`);
  return checkRun.id;
}

/**
 * Updates a CheckRun record with analysis results
 */
export async function updateCheckRunWithResults(
  checkRunId: string,
  result: AnalysisResult
): Promise<void> {
  const primaryError = result.errors.length > 0 ? getPrimaryError(result.errors) : null;
  const isRetryable = primaryError ? isErrorRetryable(primaryError) : false;
  
  await prisma.checkRun.update({
    where: { id: checkRunId },
    data: {
      status: result.success ? 'COMPLETED' : 'FAILED',
      issues: result.issues as any, // Prisma Json type
      errorType: primaryError?.type || null,
      errorMessage: primaryError?.message || null,
      errorDetails: result.errors.length > 0 ? formatErrorDetails(result.errors) : null,
      retryable: isRetryable,
      completedAt: new Date(),
    },
  });
  
  console.log(`Updated CheckRun ${checkRunId}: status=${result.success ? 'COMPLETED' : 'FAILED'}, issues=${result.issues.length}, errors=${result.errors.length}`);
}

/**
 * Updates a CheckRun record with an error
 */
export async function updateCheckRunWithError(
  checkRunId: string,
  error: ComplianceError
): Promise<void> {
  await prisma.checkRun.update({
    where: { id: checkRunId },
    data: {
      status: 'FAILED',
      errorType: error.type,
      errorMessage: error.message,
      errorDetails: formatErrorDetails([error]),
      retryable: isErrorRetryable(error),
      completedAt: new Date(),
    },
  });
  
  console.log(`Updated CheckRun ${checkRunId} with error: ${error.type} - ${error.message}`);
}

/**
 * Analyzes repository compliance and persists results to database
 */
export async function analyzeAndPersistCompliance(
  owner: string,
  repo: string,
  checkType: 'APPLE_APP_STORE' | 'GOOGLE_PLAY_STORE' | 'BOTH',
  branchName: string = 'main'
): Promise<string> {
  // Create CheckRun record
  const checkRunId = await createCheckRun(owner, repo, checkType, branchName);
  
  try {
    // Run analysis
    const result = await analyzeRepositoryCompliance(owner, repo, checkType, branchName);
    
    // Update CheckRun with results
    await updateCheckRunWithResults(checkRunId, result);
    
    return checkRunId;
  } catch (error) {
    // Update CheckRun with error
    const complianceError = categorizeError(error);
    await updateCheckRunWithError(checkRunId, complianceError);
    
    throw error;
  }
}
