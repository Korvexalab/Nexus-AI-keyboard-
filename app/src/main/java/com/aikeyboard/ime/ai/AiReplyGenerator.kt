package com.aikeyboard.ime.ai

/**
 * Milestone 2: Fast AI Reply Styles.
 * Supported reply tones for one-tap smart generation.
 */
enum class AiReplyStyle(val displayName: String) {
    REPLY("Reply"),
    FRIENDLY("Friendly"),
    SHORT("Short"),
    PROFESSIONAL("Professional"),
    FUNNY("Funny");

    companion object {
        fun fromString(name: String): AiReplyStyle {
            return values().firstOrNull { it.name.equals(name, ignoreCase = true) } ?: REPLY
        }
    }
}

/**
 * Milestone 2 — Fast AI Reply Generator.
 *
 * Provides structured mock generation logic for testing the compact UI interaction
 * and direct InputConnection insertion.
 * Designed with a clean modular interface so it can be seamlessly replaced with
 * the real Gemini generation function in subsequent milestone prompts.
 *
 * No network calls, no background threads, no external dependencies.
 */
object AiReplyGenerator {

    /**
     * Generates a realistic mock reply based on the selected tone and optional user instruction.
     */
    fun generateMockReply(style: AiReplyStyle, customPrompt: String = ""): String {
        val prompt = customPrompt.trim()

        return if (prompt.isNotEmpty()) {
            when (style) {
                AiReplyStyle.REPLY -> "Thanks for reaching out! Regarding '$prompt', I'll get back to you shortly."
                AiReplyStyle.FRIENDLY -> "Hey there! That sounds awesome ($prompt), can't wait! 😊✨"
                AiReplyStyle.SHORT -> "Got it ($prompt) — on it!"
                AiReplyStyle.PROFESSIONAL -> "Thank you for the update. With regard to '$prompt', I have reviewed the details and will follow up accordingly."
                AiReplyStyle.FUNNY -> "Say no more! Working my magic on '$prompt' as we speak! 😂🚀"
            }
        } else {
            when (style) {
                AiReplyStyle.REPLY -> "Sounds good! I'll get back to you shortly."
                AiReplyStyle.FRIENDLY -> "Hey there! That sounds awesome, can't wait to catch up! 😊"
                AiReplyStyle.SHORT -> "Sounds good, thanks!"
                AiReplyStyle.PROFESSIONAL -> "Thank you for the update. I have reviewed the details and will proceed accordingly."
                AiReplyStyle.FUNNY -> "Plot twist: I actually agree with you on this one! 😂"
            }
        }
    }
}
