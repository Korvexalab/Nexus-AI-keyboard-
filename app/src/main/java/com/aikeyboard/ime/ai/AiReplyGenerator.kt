package com.aikeyboard.ime.ai

/**
 * Milestone 2 — AI Command Center Actions.
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
 * Milestone 2 — AI Command Center Personas.
 * How the AI communicates with the recipient.
 */
enum class AiPersona(
    val id: String,
    val displayName: String,
    val emoji: String,
    val description: String
) {
    FRIENDLY("friendly", "Friendly", "😊", "Warm, conversational, and encouraging tone"),
    PROFESSIONAL("professional", "Professional", "💼", "Formal, concise, polite, and business-appropriate tone"),
    FUNNY("funny", "Funny", "😂", "Witty, humorous, and light-hearted tone"),
    SHORT("short", "Short", "⚡", "Direct, concise, 1-2 sentence response"),
    NATURAL("natural", "Natural", "💬", "Casual, relaxed everyday messenger tone");

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
 * Milestone 2 — AI Command Center Generator.
 *
 * Provides structured mock generation logic for testing:
 * action + persona + context -> generate.
 *
 * No network calls, no background threads, no external dependencies.
 */
object AiReplyGenerator {

    /**
     * Primary generator interface: action + persona + context
     */
    fun generateReply(
        action: AiAction,
        persona: AiPersona,
        context: String = ""
    ): String {
        val trimmed = context.trim()
        val hasContext = trimmed.isNotEmpty()

        return when (action) {
            AiAction.REPLY -> when (persona) {
                AiPersona.FRIENDLY -> if (hasContext) "Hey there! Regarding '$trimmed', that sounds wonderful! 😊✨" else "Hey there! That sounds awesome, can't wait! 😊"
                AiPersona.PROFESSIONAL -> if (hasContext) "Thank you for the update. With regard to '$trimmed', I have reviewed the details and will proceed accordingly." else "Thank you for reaching out. I have reviewed the matter and will proceed accordingly."
                AiPersona.FUNNY -> if (hasContext) "Say no more! Working my magic on '$trimmed' as we speak! 😂🚀" else "Plot twist: I actually agree with you on this one! 😂"
                AiPersona.SHORT -> if (hasContext) "Got it ($trimmed) — on it!" else "Sounds good, thanks!"
                AiPersona.NATURAL -> if (hasContext) "Yeah sounds good! Looking into '$trimmed' now." else "Sounds good to me, talk soon!"
            }
            AiAction.CONTINUE -> when (persona) {
                AiPersona.FRIENDLY -> if (hasContext) "Totally with you on '$trimmed'! How should we tackle the next steps together? 🙌" else "That makes a lot of sense! How did the rest of it go? 😊"
                AiPersona.PROFESSIONAL -> if (hasContext) "Building upon '$trimmed', we should coordinate our subsequent milestones." else "Following up on our earlier discussion, let us establish the timeline."
                AiPersona.FUNNY -> if (hasContext) "And just when you thought '$trimmed' was settled... boom, part two! 🍿" else "And then what happened? The suspense is killing me! 🍿"
                AiPersona.SHORT -> if (hasContext) "Next step on '$trimmed':" else "Agreed. What is next?"
                AiPersona.NATURAL -> if (hasContext) "Yeah, and about '$trimmed', I was thinking we could follow up tomorrow." else "Totally. What are you thinking for the next move?"
            }
            AiAction.START -> when (persona) {
                AiPersona.FRIENDLY -> if (hasContext) "Hey! Hope your day is going great! Quick question about '$trimmed' 😊" else "Hey! Hope you are having a wonderful day! 😊"
                AiPersona.PROFESSIONAL -> if (hasContext) "Good day. I am writing to initiate our discussion regarding '$trimmed'." else "Good day. I hope this message finds you well."
                AiPersona.FUNNY -> if (hasContext) "Knock knock! Who is there? Me, asking about '$trimmed' 😂" else "Knock knock! Just dropping in to say hi! 👋"
                AiPersona.SHORT -> if (hasContext) "Hi — quick note regarding '$trimmed':" else "Hi, reaching out briefly:"
                AiPersona.NATURAL -> if (hasContext) "Hey! Was just thinking about '$trimmed'." else "Hey! How is everything going?"
            }
            AiAction.REWRITE -> when (persona) {
                AiPersona.FRIENDLY -> if (hasContext) "Here is a warmer take: '$trimmed — let us make it happen!' 😊" else "Let us make it happen! 😊"
                AiPersona.PROFESSIONAL -> if (hasContext) "Formal revision: Please be advised regarding '$trimmed'." else "Please note the formal update as requested."
                AiPersona.FUNNY -> if (hasContext) "Spiced-up version: '$trimmed' (now with 200% more pizzazz) 🎉" else "Now with 200% more pizzazz! 🎉"
                AiPersona.SHORT -> if (hasContext) "'$trimmed' (condensed)" else "Noted."
                AiPersona.NATURAL -> if (hasContext) "Rewritten naturally: '$trimmed'" else "Sounds good!"
            }
            AiAction.CREATE -> when (persona) {
                AiPersona.FRIENDLY -> if (hasContext) "Here is a fun draft on '$trimmed'! ✨ What do you think?" else "Here is a friendly draft to share! ✨"
                AiPersona.PROFESSIONAL -> if (hasContext) "Proposal draft regarding '$trimmed'. Please review." else "Draft proposal prepared for review."
                AiPersona.FUNNY -> if (hasContext) "Brand new masterpiece inspired by '$trimmed' 🎨" else "Hot off the press! 📰🔥"
                AiPersona.SHORT -> if (hasContext) "Draft ($trimmed): Ready." else "Draft ready."
                AiPersona.NATURAL -> if (hasContext) "Put together a quick message about '$trimmed'." else "Here is a quick draft for you."
            }
            AiAction.ASK_AI -> generateMockAskAiResponse(trimmed, persona)
        }
    }

    /**
     * Dedicated Ask AI generator: question + persona
     */
    fun generateMockAskAiResponse(
        question: String,
        persona: AiPersona = AiPersona.FRIENDLY
    ): String {
        val q = question.trim()
        if (q.isEmpty()) return "Ask me anything or provide an instruction!"
        return when (persona) {
            AiPersona.PROFESSIONAL -> "Analysis for \"$q\": Based on the provided inquiry, the recommended approach is to outline clear objectives, align stakeholder expectations, and proceed methodically."
            AiPersona.FUNNY -> "According to my calculations on \"$q\": 42! Just kidding — here is the fun answer: definitely go for it, but bring snacks! 🍕✨"
            AiPersona.SHORT -> "\"$q\" — Summary: Verified and recommended."
            AiPersona.NATURAL -> "On \"$q\": I would recommend keeping it simple and straightforward."
            AiPersona.FRIENDLY -> "Great question about \"$q\"! Here is a helpful breakdown: you can achieve this by breaking the goal into simple steps and tackling the most important piece first! 😊✨"
        }
    }

    /**
     * Legacy generator method preserved for backwards compatibility with tests.
     */
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
}
