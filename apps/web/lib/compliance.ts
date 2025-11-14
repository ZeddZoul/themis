import { GoogleGenerativeAI } from '@google/generative-ai';
import { getFileContent, getGithubClient } from './github';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface ComplianceIssue {
  severity: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  solution: string;
  file?: string;
}

export async function analyzeRepositoryCompliance(
  owner: string,
  repo: string,
  checkType: 'APPLE_APP_STORE' | 'GOOGLE_PLAY_STORE' | 'BOTH'
): Promise<ComplianceIssue[]> {
  try {
    // Fetch relevant files from the repository
    const files = await fetchRelevantFiles(owner, repo);
    
    // Prepare context for Gemini
    const context = prepareComplianceContext(files, checkType);
    
    // Analyze with Gemini AI
    const issues = await analyzeWithGemini(context, checkType);
    
    return issues;
  } catch (error) {
    console.error('Error analyzing repository:', error);
    throw error;
  }
}

async function fetchRelevantFiles(owner: string, repo: string) {
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
      const content = await getFileContent(owner, repo, file);
      if (content) {
        files[file] = content;
      }
    } catch (error) {
      // File doesn't exist, skip
    }
  }

  return files;
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

async function analyzeWithGemini(
  context: string,
  checkType: string
): Promise<ComplianceIssue[]> {
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

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const issues = JSON.parse(jsonMatch[0]);
      return issues;
    }
    
    return [];
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    // Return fallback issues if AI fails
    return getFallbackIssues(checkType);
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
