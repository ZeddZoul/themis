/**
 * Gemini Configuration Helper
 * 
 * Uses Gemini 2.5 Flash for reliable, fast, and cost-effective AI processing.
 */

export const GEMINI_CONFIG = {
  // Model configuration
  MODEL: 'gemini-2.5-flash',
  
  // Context window limits for 2.5 Flash
  CONTEXT: {
    INPUT_TOKENS: 1_000_000,
    OUTPUT_TOKENS: 8_192,
  },
  
  // Rate limiting recommendations
  RATE_LIMITS: {
    BATCH_SIZE: 5,
    DELAY_BETWEEN_BATCHES_MS: 1000,
  },
} as const;

/**
 * Get optimized config for different use cases
 */
export function getGeminiConfig(useCase?: 'batch' | 'individual' | 'validation' | 'complex') {
  return {
    model: GEMINI_CONFIG.MODEL,
  };
}

/**
 * Configuration notes for Gemini 2.5 Flash:
 * 
 * 1. ✅ Using gemini-2.5-flash for optimal speed and cost efficiency
 * 2. ✅ Reliable free tier with good rate limits
 * 3. ✅ Fast responses suitable for compliance checking
 * 4. ✅ 1M token input context window
 * 5. ✅ 8K token output limit (sufficient for compliance responses)
 * 
 * Benefits:
 * - Fast and reliable responses
 * - Good free tier limits
 * - Proven performance for JSON parsing tasks
 * - Cost-effective for production use
 * - Consistent configuration across the application
 */