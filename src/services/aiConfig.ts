/**
 * Centralized Gemini & Firebase AI Configuration (Milestone 3.0 Requirement 2)
 *
 * Keeps the model name in one central configuration location so it can easily
 * be updated without modifying business logic or UI components.
 */

export const AI_CONFIG = {
  /**
   * Primary Gemini Flash model for fast, high-quality, cost-efficient text generation.
   * Uses the official current Gemini Flash model.
   */
  MODEL_NAME: 'gemini-3.8-flash',

  /**
   * Fallback model name for alternative platforms or offline simulation.
   */
  FALLBACK_MODEL_NAME: 'gemini-2.5-flash',

  /**
   * Generation parameters
   */
  TEMPERATURE: 0.75,
  MAX_OUTPUT_TOKENS: 512,
  TIMEOUT_MS: 15000,
} as const;
