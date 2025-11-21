
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function testAIAugmentation() {
  console.log('Testing AI Augmentation with Gemini 3.0 Pro...');
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not found in environment');
    }
    
    const genAI = new GoogleGenAI({
      apiKey: apiKey,
    });

    const modelName = 'gemini-2.5-pro';
    console.log(`Using model: ${modelName}`);

    // Mock data similar to what's used in compliance-hybrid.ts
    const checkType = 'MOBILE_PLATFORMS';
    const issue = {
      ruleId: 'TEST-RULE-001',
      category: 'Privacy',
      description: 'Privacy policy is missing contact information.',
    };
    const relevantFile = 'PRIVACY.md';
    const numberedContent = `1: # Privacy Policy
2: 
3: We respect your privacy.
4: 
5: ## Data Collection
6: We collect email addresses.
7: 
8: ## Usage
9: We use emails for newsletters.
`;

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
1. Validate if the file content is legitimate and compliant (not just placeholder/fake content)
2. Identify exact line numbers where this rule is violated or where a fix should be added
3. Provide specific, actionable code fixes

For content validation, check for:
- Placeholder text (e.g., "Lorem ipsum", "TODO", "Coming soon", "Your app name here")
- Generic/template content that hasn't been customized
- Missing required information for the compliance rule
- Fake or insufficient privacy policy content
- Incomplete or non-functional configuration

Respond ONLY with valid JSON:
{
  "isLegitimate": boolean,
  "contentIssues": ["list of specific content problems found"],
  "suggestions": ["list of specific improvements needed"],
  "lineNumbers": [array of line numbers where issues occur],
  "explanation": "brief explanation of the violation",
  "codeSnippet": "exact code to add/modify"
}`;

    console.log('Sending prompt to AI...');
    const result = await genAI.models.generateContent({
      model: modelName,
      contents: prompt,
    });

    const text = result.text || '';
    console.log('AI Response received.');
    console.log('Raw Response Length:', text.length);
    console.log('Raw Response Preview:', text.substring(0, 500));
    console.log('---------------------------------------------------');
    console.log(text);
    console.log('---------------------------------------------------');

    // Test Regex Matching
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      console.log('JSON Match Found!');
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('JSON Parsed Successfully:', parsed);
      } catch (e) {
        console.error('JSON Parsing Failed:', e);
      }
    } else {
      console.error('NO JSON Match Found in response!');
    }

  } catch (error) {
    console.error('Error testing AI Augmentation:', error);
  }
}

testAIAugmentation();
