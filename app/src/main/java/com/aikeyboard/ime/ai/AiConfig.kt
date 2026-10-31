package com.aikeyboard.ime.ai

/**
 * Milestone 3.0 — Centralized Gemini Model & Configuration.
 *
 * Keeps the model name and generation parameters in one central location
 * so they can easily be updated or swapped without touching UI or business logic.
 */
object AiConfig {
    /**
     * Active Gemini Flash models:
     * GEMINI_FLASH_MODEL: gemini-flash-lite-latest (fastest, low-latency text generation)
     * GEMINI_FLASH_LITE_MODEL: gemini-3-flash-preview (active high-speed model)
     * GEMINI_FALLBACK_MODEL: gemini-3.8-flash (official fallback model)
     */
    const val GEMINI_FLASH_MODEL = "gemini-flash-lite-latest"
    const val GEMINI_FLASH_LITE_MODEL = "gemini-3-flash-preview"
    const val GEMINI_FALLBACK_MODEL = "gemini-3.8-flash"
    const val DEFAULT_SERVER_URL = "https://ais-pre-5tq4muuztlo6ty57b7nkgr-551673139805.europe-west3.run.app"

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
