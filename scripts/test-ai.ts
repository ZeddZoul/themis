
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function testAI() {
  console.log('Testing AI SDK...');
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not found in environment');
    }
    
    const genAI = new GoogleGenAI({
      apiKey: apiKey,
    });

    console.log('SDK initialized. Testing model...');
    
    console.log('SDK initialized. Listing models...');
    
    // List available models
    // Note: The API might be different depending on the SDK version
    // Trying the standard listModels method
    try {
      // @ts-ignore
      const models = await genAI.models.list();
      console.log('Available models:');
      for await (const model of models) {
        console.log(`- ${model.name}`);
      }
    } catch (e) {
      console.log('Error listing models with genAI.models.list():', e);
    }

    // Also try generating with a very basic model if list fails or to confirm
    const modelName = 'gemini-1.5-flash'; 
    console.log(`\nAttempting to generate content with model: ${modelName}`);

    const result = await genAI.models.generateContent({
      model: modelName,
      contents: 'Hello, are you working?',
    });

    console.log('Success!');
    console.log('Response:', result.text);
  } catch (error) {
    console.error('Error testing AI:', error);
  }
}

testAI();
