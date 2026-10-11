package com.aikeyboard.ime.ai

/**
 * Milestone 3.0 — Centralized Gemini Model & Configuration.
 *
 * Keeps the model name and generation parameters in one central location
 * so they can easily be updated or swapped without touching UI or business logic.
 */
object AiConfig {
    /**
     * Centralized Gemini Flash model for fast, low-latency mobile keyboard text generation.
     * Uses currently supported models: gemini-3.8-flash and gemini-3.1-flash-lite.
     */
    const val GEMINI_FLASH_MODEL = "gemini-3.8-flash"
    const val GEMINI_FLASH_LITE_MODEL = "gemini-3.1-flash-lite"

    /**
     * Generation configuration parameters
     */
    const val TEMPERATURE = 0.7f
    const val TOP_K = 40
    const val TOP_P = 0.95f
    const val MAX_OUTPUT_TOKENS = 500

    /**
     * Network timeout for Gemini generation requests (12 seconds)
     */
    const val REQUEST_TIMEOUT_MS = 12000L
}
