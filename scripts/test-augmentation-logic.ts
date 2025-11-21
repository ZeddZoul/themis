
import { analyzeRepositoryCompliance } from '../lib/compliance-hybrid';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Mock the file fetching to avoid needing a real GitHub repo for this test
// We'll mock fetchRelevantFiles by intercepting it or just relying on the fact that 
// analyzeRepositoryCompliance calls it. 
// Actually, it's better to mock the file fetching part if possible, but since we can't easily mock imports here,
// we will try to run it against a real public repo if possible, or just rely on the fact that it will fail fetching but we want to see if it even TRIES to augment.
//
// Wait, if file fetching fails, augmentation is skipped.
// So we need a way to test augmentIssueWithAI directly or mock the file fetching.
//
// Let's create a script that imports augmentIssueWithAI if it was exported, but it's not.
//
// Plan B: We will modify compliance-hybrid.ts temporarily to export augmentIssueWithAI for testing, 
// OR we will just run the reproduction script which I ALREADY HAVE and it DOES call the AI.
//
// The previous reproduction script `scripts/reproduce-ai-issue.ts` manually constructed the prompt and called the AI.
// It didn't use `augmentIssueWithAI`.
//
// To test `augmentIssueWithAI` logic (including the parsing I just changed), I should copy the `augmentIssueWithAI` function 
// into a test script and run it there to see if it works with the new parsing logic.

import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

interface ComplianceIssue {
  ruleId: string;
  severity: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  solution: string;
  file?: string;
}

async function augmentIssueWithAI(
  issue: ComplianceIssue,
  files: { [key: string]: string | null },
  checkType: string
) {
  const relevantFile = issue.file;
  try {
    console.log(`[AI Augmentation] Starting augmentation for ${issue.ruleId}, file: ${relevantFile || 'undefined'}`);
    
    if (!relevantFile || !files[relevantFile]) {
      console.log(`[AI Augmentation] Skipping ${issue.ruleId} - no relevant file`);
      return {};
    }

    const fileContent = files[relevantFile];
    if (!fileContent) return {};

    const lines = fileContent.split('\n');
    const numberedContent = lines
      .map((line, idx) => `${idx + 1}: ${line}`)
      .slice(0, 200)
      .join('\n');

    const prompt = `You are a compliance expert for ${checkType} app store policies. A compliance violation has been detected:

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

    console.log(`[AI Augmentation] Sending prompt to Gemini 2.5 Pro...`);
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
    });
    const text = result.text || '';
    
    console.log(`[AI Augmentation] Gemini response received. Length: ${text.length}`);
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
      jsonString = cleanText; 
    }

    if (jsonString) {
      try {
        const augmentation = JSON.parse(jsonString);
        console.log(`[AI Augmentation] ✅ Successfully parsed JSON for ${issue.ruleId}`);
        return augmentation;
      } catch (parseError) {
        console.error(`[AI Augmentation] ❌ JSON parse error for ${issue.ruleId}:`, parseError);
        console.log(`[AI Augmentation] Failed JSON string: ${jsonString}`);
        return {};
      }
    } else {
      console.warn(`[AI Augmentation] ⚠️ No JSON found in response for ${issue.ruleId}`);
      console.log(`[AI Augmentation] Full text response: ${text}`);
      return {};
    }
  } catch (error) {
    console.error(`[AI Augmentation] ❌ CRITICAL ERROR for ${issue.ruleId}:`, error);
    return {};
  }
}

async function runTest() {
  const issue: ComplianceIssue = {
    ruleId: 'TEST-001',
    severity: 'high',
    category: 'Privacy',
    description: 'Privacy policy missing contact info',
    solution: 'Add contact info',
    file: 'PRIVACY.md'
  };

  const files = {
    'PRIVACY.md': '# Privacy Policy\n\nWe collect data.'
  };

  console.log('Running test...');
  const result = await augmentIssueWithAI(issue, files, 'MOBILE_PLATFORMS');
  console.log('Result:', JSON.stringify(result, null, 2));
}

runTest();
