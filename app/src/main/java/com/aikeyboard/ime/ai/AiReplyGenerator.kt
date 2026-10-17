package com.aikeyboard.ime.ai

import com.google.firebase.Firebase
import com.google.firebase.FirebaseApp
import com.google.firebase.vertexai.vertexAI
import com.google.firebase.vertexai.type.generationConfig
import kotlinx.coroutines.withTimeoutOrNull

/**
 * Milestone 2 & 3 — AI Command Center Actions.
 * The user first chooses what they want AI to do.
 */
enum class AiAction(
    val id: String,
    val displayName: String,
    val emoji: String,
    val isPrimary: Boolean = true
) {
    REPLY("reply", "Reply", "💬", true),
    ASK_AI("ask_ai", "Ask AI", "🧠", true),
    CONTINUE("continue", "Continue", "🔄", true),
    START("start", "Start", "✨", true),
    REWRITE("rewrite", "Rewrite", "✏️", false),
    CREATE("create", "Create", "➕", false);

    companion object {
        fun fromId(id: String): AiAction {
            return values().firstOrNull {
                it.id.equals(id, ignoreCase = true) || it.name.equals(id, ignoreCase = true)
            } ?: REPLY
        }
    }
}

/**
 * Milestone 2 & 3 — AI Command Center Personas.
 * How the AI communicates with the recipient.
 */
enum class AiPersona(
    val id: String,
    val displayName: String,
    val emoji: String,
    val description: String
) {
    FRIENDLY("friendly", "Friendly", "😊", "Warm, conversational, and encouraging tone"),
    FREELANCER("freelancer", "Freelancer", "💼", "Clear, efficient, and business-focused tone"),
    PROFESSIONAL("professional", "Professional", "💼", "Polished, clear, professional, and concise tone"),
    FUNNY("funny", "Funny", "😂", "Playful, humorous, and light-hearted tone"),
    SHORT("short", "Short", "⚡", "Direct, concise, 1-2 sentence response"),
    NATURAL("natural", "Natural", "💬", "Casual, relaxed everyday messenger tone"),
    ROMANTIC("romantic", "Romantic", "❤️", "Affectionate, heartfelt, and warm tone");

    companion object {
        fun fromId(id: String): AiPersona {
            return values().firstOrNull {
                it.id.equals(id, ignoreCase = true) || it.name.equals(id, ignoreCase = true)
            } ?: FRIENDLY
        }
    }
}

/**
 * Legacy compatibility enum for existing unit tests.
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
 * Milestone 3.0 — AI Request specification.
 * Captures action, persona, host context, and optional user instruction.
 */
data class AiRequest(
    val action: AiAction,
    val persona: AiPersona,
    val context: String = "",
    val instruction: String = ""
)

/**
 * Milestone 3.2 — Explicit Gemini Error Hierarchy.
 *
 * Ensures safe, actionable user-facing error reporting without raw crash dumps,
 * and eliminates silent mock substitution when real Gemini calls fail.
 */
sealed class GeminiException(message: String, cause: Throwable? = null) : Exception(message, cause) {
    class MissingConfiguration(message: String) : GeminiException(message)
    class ApiNotEnabled(message: String, val enableUrl: String = "") : GeminiException(message)
    class Timeout(message: String) : GeminiException(message)
    class RateLimit(message: String) : GeminiException(message)
    class ServiceUnavailable(message: String) : GeminiException(message)
    class EmptyResponse(message: String) : GeminiException(message)
    class NetworkError(message: String, cause: Throwable? = null) : GeminiException(message, cause)
    class General(message: String, cause: Throwable? = null) : GeminiException(message, cause)
}

/**
 * Milestone 3.0 & 3.2 — Generator Abstraction Interface.
 *
 * The UI and tests depend on this abstraction, supporting seamless switching
 * between real Gemini generation via Firebase AI Logic and the offline mock generator.
 */
interface ReplyGenerator {
    suspend fun generate(request: AiRequest): String
    suspend fun generateSuggestions(request: AiRequest): List<String>
    suspend fun generateAskAi(question: String, persona: AiPersona): String
}

/**
 * Mock generator implementation retained as a reliable offline fallback and for unit tests.
 */
class MockReplyGenerator : ReplyGenerator {

    override suspend fun generate(request: AiRequest): String {
        return generateSync(request.action, request.persona, request.context, request.instruction)
    }

    override suspend fun generateSuggestions(request: AiRequest): List<String> {
        return generateSuggestionsSync(request.action, request.persona, request.context, request.instruction)
    }

    override suspend fun generateAskAi(question: String, persona: AiPersona): String {
        return generateAskAiSync(question, persona)
    }

    fun generateSync(
        action: AiAction,
        persona: AiPersona,
        context: String = "",
        instruction: String = ""
    ): String {
        val trimmed = context.trim()
        val hasContext = trimmed.isNotEmpty()

        return when (action) {
            AiAction.REPLY -> when (persona) {
                AiPersona.FRIENDLY -> if (hasContext) "Hey there! Regarding '$trimmed', that sounds wonderful! 😊✨" else "Hey there! That sounds awesome, can't wait! 😊"
                AiPersona.FREELANCER -> if (hasContext) "Thanks for the update on '$trimmed'. I'm on it and will send the deliverables shortly." else "Thanks for reaching out! Reaching out with the latest updates."
                AiPersona.PROFESSIONAL -> if (hasContext) "Thank you for the update regarding '$trimmed'. I will review the details and proceed with the next steps." else "Thank you for reaching out. I will review the details and coordinate our next steps."
                AiPersona.FUNNY -> if (hasContext) "Say no more! Working my magic on '$trimmed' as we speak! 😂🚀" else "Plot twist: I actually agree with you on this one! 😂"
                AiPersona.SHORT -> if (hasContext) "Got it ($trimmed) — on it!" else "Sounds good, thanks!"
                AiPersona.NATURAL -> if (hasContext) "Yeah sounds good! Looking into '$trimmed' now." else "Sounds good to me, talk soon!"
                AiPersona.ROMANTIC -> if (hasContext) "Always brightens my day hearing from you about '$trimmed' ❤️" else "Thinking of you! Hope your day is as wonderful as you are ❤️"
            }
            AiAction.REWRITE -> when (persona) {
                AiPersona.FRIENDLY -> if (hasContext) {
                    if (trimmed.equals("whatup", ignoreCase = true)) "Hey! What's up?"
                    else "Hey there! $trimmed 😊"
                } else "Hey! What's up?"
                AiPersona.FREELANCER -> if (hasContext) "Following up regarding: $trimmed." else "Reaching out regarding our project milestones."
                AiPersona.PROFESSIONAL -> if (hasContext) "Regarding: $trimmed. Please review and advise." else "Reaching out to coordinate on our mutual deliverables."
                AiPersona.FUNNY -> if (hasContext) "Plot twist: $trimmed! 😂" else "Plot twist: wait until you hear this! 😂"
                AiPersona.SHORT -> if (hasContext) "$trimmed (updated)" else "Quick note."
                AiPersona.NATURAL -> if (hasContext) "$trimmed" else "Just wanted to check in."
                AiPersona.ROMANTIC -> if (hasContext) "$trimmed ❤️" else "Sending you love today ❤️"
            }
            AiAction.CONTINUE -> if (hasContext) {
                "$trimmed so we can align on next steps together."
            } else {
                "Let's coordinate on our next milestone together."
            }
            AiAction.START -> when (persona) {
                AiPersona.FRIENDLY -> if (hasContext) "Hey! Hope you're having a great week. Quick question about '$trimmed' 😊" else "Hey! Hope you are having a wonderful day! 😊"
                AiPersona.FREELANCER, AiPersona.PROFESSIONAL -> if (hasContext) "Hi there, reaching out regarding '$trimmed' whenever you have a moment." else "Good morning, reaching out to coordinate on our mutual deliverables."
                AiPersona.FUNNY -> if (hasContext) "Hey! Random thought about '$trimmed': brace yourself! 😂" else "Hey! Quick question before my coffee wears off! ☕"
                AiPersona.SHORT -> if (hasContext) "Quick check on '$trimmed'." else "Quick check-in."
                AiPersona.NATURAL -> if (hasContext) "Hey, was just thinking about '$trimmed'." else "Hey! How's it going?"
                AiPersona.ROMANTIC -> if (hasContext) "Hey you ❤️ Just thinking about '$trimmed'." else "Hey you! Hope you're having the sweetest day ❤️"
            }
            AiAction.CREATE -> {
                val topic = if (instruction.isNotBlank()) instruction else trimmed
                if (topic.isNotEmpty()) "Draft for '$topic': ready for your review."
                else "Here is a versatile friendly draft message ready to share! ✨"
            }
            AiAction.ASK_AI -> generateAskAiSync(instruction.ifBlank { trimmed }, persona)
        }
    }

    fun generateSuggestionsSync(
        action: AiAction,
        persona: AiPersona,
        context: String = "",
        instruction: String = ""
    ): List<String> {
        val primary = generateSync(action, persona, context, instruction)
        val trimmed = context.trim()

        if (action == AiAction.REWRITE) {
            return when (persona) {
                AiPersona.FRIENDLY -> if (trimmed.equals("whatup", ignoreCase = true)) {
                    listOf("Hey! What's up?", "Hey, how's it going?", "What's up? Hope you're having a great day! 😊")
                } else if (trimmed.isNotEmpty()) {
                    listOf("Hey there! $trimmed 😊", "Hey! $trimmed", "Just wanted to say: $trimmed ✨")
                } else {
                    listOf("Hey! What's up?", "Hey, how's it going?", "Hope you're having a great day! 😊")
                }
                AiPersona.FREELANCER, AiPersona.PROFESSIONAL -> if (trimmed.isNotEmpty()) {
                    listOf("Following up regarding: $trimmed.", "Please find the latest update: '$trimmed'.", "Regarding $trimmed — please advise at your convenience.")
                } else {
                    listOf("Reaching out regarding our project milestones.", "Please review the attached deliverables.", "Following up on our recent action items.")
                }
                AiPersona.FUNNY -> if (trimmed.isNotEmpty()) {
                    listOf("Plot twist: $trimmed! 😂", "Breaking news: $trimmed! 🚀", "Spiced-up version: $trimmed 🎉")
                } else {
                    listOf("Plot twist: wait until you hear this! 😂", "Now with 200% more pizzazz! 🎉")
                }
                AiPersona.SHORT -> if (trimmed.isNotEmpty()) {
                    listOf("$trimmed (updated)", "Quick note: $trimmed", "Noted: $trimmed")
                } else {
                    listOf("Got it.", "Noted.", "All set.")
                }
                else -> listOf(primary, "$primary 😊", "Quick update: $primary")
            }
        }

        if (action == AiAction.REPLY) {
            return when (persona) {
                AiPersona.FRIENDLY -> listOf(
                    primary,
                    if (trimmed.isNotEmpty()) "Totally agree on '$trimmed'! Let's do it! 🙌" else "Totally agree! Let's do it! 🙌",
                    if (trimmed.isNotEmpty()) "Thanks so much for the update on '$trimmed'! 😊" else "Thanks so much for reaching out! 😊"
                )
                AiPersona.FREELANCER, AiPersona.PROFESSIONAL -> listOf(
                    primary,
                    if (trimmed.isNotEmpty()) "Understood regarding '$trimmed'. I've updated the milestones accordingly." else "Understood. I will follow up with the next deliverables.",
                    if (trimmed.isNotEmpty()) "Thanks for sharing. I'll review '$trimmed' and follow up shortly." else "Thank you for the update. I will proceed with next steps."
                )
                AiPersona.FUNNY -> listOf(
                    primary,
                    if (trimmed.isNotEmpty()) "Challenge accepted for '$trimmed'! 😂" else "Challenge accepted! 😂",
                    if (trimmed.isNotEmpty()) "And boom! '$trimmed' is officially in motion! 🍿" else "And boom! We are on it! 🍿"
                )
                AiPersona.SHORT -> listOf(
                    primary,
                    if (trimmed.isNotEmpty()) "Sounds good regarding $trimmed." else "Sounds good, thanks!",
                    "All set!"
                )
                else -> listOf(primary, "Sounds great, talk soon!", "Understood, thank you!")
            }
        }

        if (action == AiAction.CONTINUE) {
            return listOf(
                primary,
                if (trimmed.isNotEmpty()) "$trimmed whenever you have a quick moment today." else "Looking forward to following up soon.",
                if (trimmed.isNotEmpty()) "$trimmed and coordinate whenever you have a quick moment." else "Agreed, let's keep going!"
            )
        }

        if (action == AiAction.START) {
            return listOf(
                primary,
                if (trimmed.isNotEmpty()) "Hey! Hope you're having a great week. Quick question on '$trimmed':" else "Hey! Hope you are having a fantastic day! 😊",
                if (trimmed.isNotEmpty()) "Hi! Wanted to touch base regarding '$trimmed' whenever you have a moment." else "Hi there! Reaching out to see how things are going."
            )
        }

        return listOf(primary)
    }

    fun generateAskAiSync(
        question: String,
        persona: AiPersona = AiPersona.FRIENDLY
    ): String {
        val q = question.trim()
        if (q.isEmpty()) return "Ask me anything or provide an instruction!"
        return when (persona) {
            AiPersona.FREELANCER, AiPersona.PROFESSIONAL -> "Analysis for \"$q\": The recommended approach is to outline clear objectives, align stakeholder expectations, and proceed methodically."
            AiPersona.FUNNY -> "According to my calculations on \"$q\": 42! Just kidding — here is the fun answer: definitely go for it, but bring snacks! 🍕✨"
            AiPersona.SHORT -> "\"$q\" — Summary: Verified and recommended."
            AiPersona.NATURAL -> "On \"$q\": I would recommend keeping it simple and straightforward."
            AiPersona.ROMANTIC -> "Regarding \"$q\": Whatever you choose, follow your heart! I believe in you ❤️✨"
            AiPersona.FRIENDLY -> "Great question about \"$q\"! Here is a helpful breakdown: you can achieve this by breaking the goal into simple steps and tackling the most important piece first! 😊✨"
        }
    }
}

/**
 * Milestone 3.0 & 3.2 — Real Gemini-powered implementation using Firebase AI Logic.
 *
 * Uses Firebase AI Logic with the Google AI / Gemini developer backend.
 * No raw API keys are stored in client code.
 * Personas are dynamic prompt variations, not separate models.
 * Never silently substitutes mock responses when real Gemini fails.
 */
class FirebaseGeminiReplyGenerator(
    val fallback: MockReplyGenerator = MockReplyGenerator()
) : ReplyGenerator {

    var isOfflineMode: Boolean = false

    /**
     * Checks if Firebase is initialized with authentic (non-placeholder) project credentials.
     */
    fun isFirebaseConfigured(): Boolean {
        return try {
            val app = FirebaseApp.getInstance()
            val apiKey = app.options.apiKey
            apiKey.isNotBlank() &&
                !apiKey.contains("Dummy", ignoreCase = true) &&
                !apiKey.contains("Placeholder", ignoreCase = true) &&
                !apiKey.contains("example", ignoreCase = true)
        } catch (_: Throwable) {
            false
        }
    }

    /**
     * Builds dynamic persona prompt instructions conforming to Milestone 3.0 Section 5.
     */
    fun buildPersonaPrompt(persona: AiPersona): String {
        return when (persona) {
            AiPersona.FRIENDLY ->
                "Persona: Friendly. Tone must be warm, natural, conversational, and genuinely human. Avoid robotic formality and stiff corporate speak. A subtle friendly emoji is welcome if natural."
            AiPersona.FREELANCER ->
                "Persona: Freelancer. Tone must be professional, concise, client-friendly, confident, proactive, and natural."
            AiPersona.PROFESSIONAL ->
                "Persona: Professional. Tone must be polished, clear, professional, and concise. Never sound stiff, bureaucratic, or robotic."
            AiPersona.FUNNY ->
                "Persona: Funny. Tone must be playful, witty, and humorous in a natural everyday way. Avoid forcing jokes."
            AiPersona.SHORT ->
                "Persona: Short. Tone must be ultra-concise, direct, and minimal (1 short sentence or brief phrase only)."
            AiPersona.NATURAL ->
                "Persona: Natural. Tone must be casual, relaxed everyday messenger tone. Like chatting with a close colleague or friend."
            AiPersona.ROMANTIC ->
                "Persona: Romantic. Tone must be affectionate, heartfelt, warm, and sweet."
        }
    }

    /**
     * Builds dynamic action instructions conforming to Milestone 3.0 Sections 4, 7-10.
     */
    fun buildActionInstruction(action: AiAction, context: String, instruction: String): String {
        val trimmed = context.trim()
        val hasContext = trimmed.isNotEmpty()

        return when (action) {
            AiAction.REPLY -> {
                if (hasContext) {
                    "Task: Reply. Use the user's current draft or message context: \"$trimmed\". Generate a direct, natural conversational reply."
                } else {
                    "Task: Reply. The draft is empty. Generate an appropriate conversational reply or follow-up based on context."
                }
            }
            AiAction.REWRITE -> {
                if (hasContext) {
                    "Task: Rewrite. Rewrite the text: \"$trimmed\". Preserve the exact meaning while applying the persona style naturally."
                } else {
                    "Task: Rewrite. Provide a natural friendly message."
                }
            }
            AiAction.CONTINUE -> {
                if (hasContext) {
                    "Task: Continue. Continue the user's message naturally: \"$trimmed\". Complete the thought or sentence seamlessly without changing the original intent."
                } else {
                    "Task: Continue. Continue the conversation with a natural next step."
                }
            }
            AiAction.START -> {
                if (hasContext) {
                    "Task: Start. Generate a natural opening message or conversation starter about: \"$trimmed\"."
                } else {
                    "Task: Start. Generate a natural opening conversation starter."
                }
            }
            AiAction.CREATE -> {
                val topic = if (instruction.isNotBlank()) instruction else trimmed
                if (topic.isNotEmpty()) {
                    "Task: Create. Draft a fresh message based on the topic/instruction: \"$topic\"."
                } else {
                    "Task: Create. Create a versatile friendly draft message."
                }
            }
            AiAction.ASK_AI -> {
                val q = if (instruction.isNotBlank()) instruction else trimmed
                "Task: Ask AI. Answer the question directly and concisely: \"$q\"."
            }
        }
    }

    override suspend fun generate(request: AiRequest): String {
        val suggestions = generateSuggestions(request)
        return suggestions.firstOrNull()
            ?: throw GeminiException.EmptyResponse("Gemini returned no response.")
    }

    override suspend fun generateSuggestions(request: AiRequest): List<String> {
        if (!isFirebaseConfigured()) {
            throw GeminiException.MissingConfiguration(
                "Firebase is not configured. Connect your active Firebase project to enable live Gemini generation."
            )
        }

        val personaGuidance = buildPersonaPrompt(request.persona)
        val actionGuidance = buildActionInstruction(request.action, request.context, request.instruction)

        val prompt = """
You are Nexora AI Keyboard's communication assistant.
$personaGuidance
$actionGuidance

CRITICAL INSTRUCTIONS:
1. Provide 3 distinct natural response variations formatted as a JSON array of strings:
   ["Variation 1", "Variation 2", "Variation 3"]
2. Output ONLY the raw JSON array. Do not include markdown codeblocks, no explanations, no commentary.
3. Natural human responses only. NEVER produce generic robotic phrases like "I have reviewed the matter and will proceed accordingly".
4. For writing actions, do NOT return "Here is a rewritten version:". Return only the ready-to-insert message.
5. Preserve the user's meaning and tone.
""".trimIndent()

        return try {
            val result = withTimeoutOrNull(AiConfig.REQUEST_TIMEOUT_MS) {
                try {
                    val model = Firebase.vertexAI.generativeModel(
                        modelName = AiConfig.GEMINI_FLASH_MODEL,
                        generationConfig = generationConfig {
                            temperature = AiConfig.TEMPERATURE
                            topK = AiConfig.TOP_K
                            topP = AiConfig.TOP_P
                            maxOutputTokens = AiConfig.MAX_OUTPUT_TOKENS
                        }
                    )
                    model.generateContent(prompt).text
                } catch (primaryEx: Throwable) {
                    val pMsg = primaryEx.message ?: ""
                    // If it's an API not enabled issue, let it bubble up
                    if (pMsg.contains("firebasevertexai.googleapis.com", ignoreCase = true) ||
                        pMsg.contains("has not been used in project", ignoreCase = true) ||
                        pMsg.contains("API has not been enabled", ignoreCase = true) ||
                        pMsg.contains("SERVICE_DISABLED", ignoreCase = true)) {
                        throw primaryEx
                    }
                    // Fallback to GEMINI_FLASH_LITE_MODEL (gemini-1.5-flash)
                    val fallbackModel = Firebase.vertexAI.generativeModel(
                        modelName = AiConfig.GEMINI_FLASH_LITE_MODEL,
                        generationConfig = generationConfig {
                            temperature = AiConfig.TEMPERATURE
                            topK = AiConfig.TOP_K
                            topP = AiConfig.TOP_P
                            maxOutputTokens = AiConfig.MAX_OUTPUT_TOKENS
                        }
                    )
                    fallbackModel.generateContent(prompt).text
                }
            }

            if (result == null) {
                throw GeminiException.Timeout("Gemini generation timed out. Please tap retry.")
            }
            if (result.isBlank()) {
                throw GeminiException.EmptyResponse("Gemini returned an empty response. Please tap retry.")
            }

            val parsed = parseSuggestions(result)
            if (parsed.isEmpty()) {
                throw GeminiException.EmptyResponse("Unable to parse suggestions from Gemini. Please tap retry.")
            }
            parsed
        } catch (e: GeminiException) {
            throw e
        } catch (e: Throwable) {
            val msg = e.message ?: ""
            when {
                msg.contains("firebasevertexai.googleapis.com", ignoreCase = true) ||
                msg.contains("has not been used in project", ignoreCase = true) ||
                msg.contains("API has not been enabled", ignoreCase = true) ||
                msg.contains("SERVICE_DISABLED", ignoreCase = true) ->
                    throw GeminiException.ApiNotEnabled(
                        "Vertex AI in Firebase API is not enabled in your Firebase project. Please enable firebasevertexai.googleapis.com in Google Cloud Console.",
                        "https://console.developers.google.com/apis/api/firebasevertexai.googleapis.com/overview"
                    )
                msg.contains("429") || msg.contains("RESOURCE_EXHAUSTED") || msg.contains("quota", ignoreCase = true) ->
                    throw GeminiException.RateLimit("Gemini rate limit reached. Please wait a moment and tap retry.")
                msg.contains("503") || msg.contains("UNAVAILABLE", ignoreCase = true) || msg.contains("high demand", ignoreCase = true) ->
                    throw GeminiException.ServiceUnavailable("Gemini is currently experiencing high demand. Please tap retry in a moment.")
                msg.contains("timeout", ignoreCase = true) ->
                    throw GeminiException.Timeout("Gemini request timed out. Please tap retry.")
                msg.contains("network", ignoreCase = true) || msg.contains("UnknownHost", ignoreCase = true) ->
                    throw GeminiException.NetworkError("No internet connection. Please check your network and tap retry.", e)
                else ->
                    throw GeminiException.General(e.message ?: "Unable to generate response with Gemini. Please tap retry.", e)
            }
        }
    }

    override suspend fun generateAskAi(question: String, persona: AiPersona): String {
        val q = question.trim()
        if (q.isEmpty()) return "Please enter a question or instruction to ask AI."

        if (!isFirebaseConfigured()) {
            throw GeminiException.MissingConfiguration(
                "Firebase is not configured. Connect your active Firebase project to enable live Gemini generation."
            )
        }

        val personaGuidance = buildPersonaPrompt(persona)
        val prompt = """
You are an AI assistant integrated directly into Nexora mobile keyboard.
$personaGuidance

The user asks: "$q"

Instructions:
- Provide a direct, helpful, and concise answer (1-3 short paragraphs).
- Suitable for reading on a mobile keyboard screen.
- Avoid preamble like "Sure, here is your answer:".
- Directly answer the question.
""".trimIndent()

        return try {
            val result = withTimeoutOrNull(AiConfig.REQUEST_TIMEOUT_MS) {
                try {
                    val model = Firebase.vertexAI.generativeModel(
                        modelName = AiConfig.GEMINI_FLASH_MODEL,
                        generationConfig = generationConfig {
                            temperature = AiConfig.TEMPERATURE
                            topK = AiConfig.TOP_K
                            topP = AiConfig.TOP_P
                            maxOutputTokens = AiConfig.MAX_OUTPUT_TOKENS
                        }
                    )
                    model.generateContent(prompt).text
                } catch (primaryEx: Throwable) {
                    val pMsg = primaryEx.message ?: ""
                    if (pMsg.contains("firebasevertexai.googleapis.com", ignoreCase = true) ||
                        pMsg.contains("has not been used in project", ignoreCase = true) ||
                        pMsg.contains("API has not been enabled", ignoreCase = true) ||
                        pMsg.contains("SERVICE_DISABLED", ignoreCase = true)) {
                        throw primaryEx
                    }
                    val fallbackModel = Firebase.vertexAI.generativeModel(
                        modelName = AiConfig.GEMINI_FLASH_LITE_MODEL,
                        generationConfig = generationConfig {
                            temperature = AiConfig.TEMPERATURE
                            topK = AiConfig.TOP_K
                            topP = AiConfig.TOP_P
                            maxOutputTokens = AiConfig.MAX_OUTPUT_TOKENS
                        }
                    )
                    fallbackModel.generateContent(prompt).text
                }
            }

            if (result == null) {
                throw GeminiException.Timeout("Gemini generation timed out. Please tap retry.")
            }
            val trimmed = result.trim()
            if (trimmed.isEmpty()) {
                throw GeminiException.EmptyResponse("Gemini returned an empty response. Please tap retry.")
            }
            trimmed
        } catch (e: GeminiException) {
            throw e
        } catch (e: Throwable) {
            val msg = e.message ?: ""
            when {
                msg.contains("firebasevertexai.googleapis.com", ignoreCase = true) ||
                msg.contains("has not been used in project", ignoreCase = true) ||
                msg.contains("API has not been enabled", ignoreCase = true) ||
                msg.contains("SERVICE_DISABLED", ignoreCase = true) ->
                    throw GeminiException.ApiNotEnabled(
                        "Vertex AI in Firebase API is not enabled in your Firebase project. Please enable firebasevertexai.googleapis.com or use Offline AI.",
                        "https://console.developers.google.com/apis/api/firebasevertexai.googleapis.com/overview"
                    )
                msg.contains("429") || msg.contains("RESOURCE_EXHAUSTED") || msg.contains("quota", ignoreCase = true) ->
                    throw GeminiException.RateLimit("Gemini rate limit reached. Please wait a moment and tap retry.")
                msg.contains("503") || msg.contains("UNAVAILABLE", ignoreCase = true) || msg.contains("high demand", ignoreCase = true) ->
                    throw GeminiException.ServiceUnavailable("Gemini is currently experiencing high demand. Please tap retry in a moment.")
                msg.contains("timeout", ignoreCase = true) ->
                    throw GeminiException.Timeout("Gemini request timed out. Please tap retry.")
                msg.contains("network", ignoreCase = true) || msg.contains("UnknownHost", ignoreCase = true) ->
                    throw GeminiException.NetworkError("No internet connection. Please check your network and tap retry.", e)
                else ->
                    throw GeminiException.General(e.message ?: "Unable to answer with Gemini. Please tap retry.", e)
            }
        }
    }

    /**
     * Parses the LLM response into individual suggestion strings.
     */
    private fun parseSuggestions(raw: String): List<String> {
        val cleaned = raw.trim()
            .removePrefix("```json")
            .removePrefix("```")
            .removeSuffix("```")
            .trim()

        // Attempt JSON array parsing
        if (cleaned.startsWith("[") && cleaned.endsWith("]")) {
            val items = cleaned.substring(1, cleaned.length - 1)
                .split(Regex("""(?<!\\)","|(?<!\\)','"""))
                .map {
                    it.trim()
                        .removePrefix("\"")
                        .removeSuffix("\"")
                        .removePrefix("'")
                        .removeSuffix("'")
                        .replace("\\\"", "\"")
                }
                .filter { it.isNotBlank() }
            if (items.isNotEmpty()) return items.take(3)
        }

        // Line-based fallback
        val lines = cleaned.lines()
            .map { it.replace(Regex("""^[-*•\d.]+\s*"""), "").trim().removeSurrounding("\"").removeSurrounding("'") }
            .filter { it.isNotBlank() }

        return if (lines.isNotEmpty()) lines.take(3) else listOf(cleaned)
    }
}

/**
 * Milestone 2 & 3 — AI Reply Generator Facade.
 *
 * Keeps all existing signatures intact for UI, tests, and backward compatibility,
 * while delegating to the current real Gemini / Firebase AI Logic implementation.
 */
object AiReplyGenerator {

    val mockGenerator = MockReplyGenerator()
    val firebaseGenerator = FirebaseGeminiReplyGenerator(mockGenerator)
    var currentGenerator: ReplyGenerator = firebaseGenerator

    var isOfflineMode: Boolean
        get() = false
        set(_) {
            // AI generation is powered by Cloud AI
        }

    fun setOfflineMode(enabled: Boolean) {
        // AI generation is powered by Cloud AI
    }

    /**
     * Synchronous generator method (used by unit tests and offline testing).
     */
    fun generateSuggestions(
        action: AiAction,
        persona: AiPersona,
        context: String = "",
        instruction: String = ""
    ): List<String> {
        return mockGenerator.generateSuggestionsSync(action, persona, context, instruction)
    }

    fun generateReply(
        action: AiAction,
        persona: AiPersona,
        context: String = ""
    ): String {
        return mockGenerator.generateSync(action, persona, context)
    }

    fun generateMockAskAiResponse(
        question: String,
        persona: AiPersona = AiPersona.FRIENDLY
    ): String {
        return mockGenerator.generateAskAiSync(question, persona)
    }

    fun generateMockReply(style: AiReplyStyle, customPrompt: String = ""): String {
        val persona = when (style) {
            AiReplyStyle.REPLY -> AiPersona.FRIENDLY
            AiReplyStyle.FRIENDLY -> AiPersona.FRIENDLY
            AiReplyStyle.SHORT -> AiPersona.SHORT
            AiReplyStyle.PROFESSIONAL -> AiPersona.PROFESSIONAL
            AiReplyStyle.FUNNY -> AiPersona.FUNNY
        }
        return generateReply(AiAction.REPLY, persona, customPrompt)
    }

    /**
     * Coroutine-based asynchronous generator calling currentGenerator (Firebase Gemini).
     */
    suspend fun generateSuggestionsAsync(request: AiRequest): List<String> {
        return currentGenerator.generateSuggestions(request)
    }

    suspend fun generateAskAiAsync(question: String, persona: AiPersona): String {
        return currentGenerator.generateAskAi(question, persona)
    }

    suspend fun generateReplyAsync(request: AiRequest): String {
        return currentGenerator.generate(request)
    }
}
