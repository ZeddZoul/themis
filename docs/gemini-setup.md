# Gemini 2.5 Flash Configuration

This document outlines the Gemini AI configuration for the Themis compliance checker.

## Model Choice: Gemini 2.5 Flash

We've chosen **Gemini 2.5 Flash** for the following reasons:

- ✅ **Reliable free tier** with good rate limits
- ✅ **Fast responses** suitable for compliance checking
- ✅ **1M token input** context window
- ✅ **8K token output** limit (sufficient for compliance responses)
- ✅ **Proven performance** for JSON parsing tasks
- ✅ **Cost-effective** for both development and production

## Configuration

### Core Configuration (`lib/gemini-config.ts`)

```typescript
export const GEMINI_CONFIG = {
  MODEL: 'gemini-2.5-flash',
  CONTEXT: {
    INPUT_TOKENS: 1_000_000,
    OUTPUT_TOKENS: 8_192,
  },
  RATE_LIMITS: {
    BATCH_SIZE: 5,
    DELAY_BETWEEN_BATCHES_MS: 1000,
  },
} as const;
```

### Usage

```typescript
import { getGeminiConfig } from './lib/gemini-config';

const result = await genAI.models.generateContent({
  ...getGeminiConfig(),
  contents: prompt,
});
```

## Testing

Run the test suite to verify your setup:

```bash
npm run test:gemini
```

This will test:
1. Basic AI responses
2. JSON parsing (critical for compliance checking)
3. Batch configuration

## Rate Limits

- **Free tier**: 15 requests per minute, 1,500 requests per day
- **Batch processing**: 5 requests per batch with 1-second delays
- **Error handling**: Graceful fallback when rate limits are hit

## Files Updated

1. `lib/gemini-config.ts` - Central configuration
2. `lib/compliance-hybrid.ts` - Main compliance engine
3. `components/home/HowItWorks.tsx` - UI text updates
4. `scripts/test-*.ts` - All test scripts
5. `package.json` - Test commands

## Benefits

- **Consistent**: All AI calls use the same configuration
- **Reliable**: Proven model with good uptime
- **Cost-effective**: Free tier suitable for development
- **Fast**: Quick responses for better user experience
- **Maintainable**: Centralized configuration makes updates easy

## Migration Notes

If you previously used Gemini 3.0 Pro or other models:
- No thinking_level configuration needed (2.5 Flash doesn't support it)
- Simpler configuration without complex parameters
- Better rate limits for development and testing
- Same JSON parsing capabilities for compliance checking