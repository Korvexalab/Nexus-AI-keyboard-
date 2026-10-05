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
    FREELANCER("freelancer", "Freelancer", "💼", "Clear, efficient, and business-focused tone"),
    PROFESSIONAL("professional", "Professional", "💼", "Formal, concise, polite, and business-appropriate tone"),
    FUNNY("funny", "Funny", "😂", "Witty, humorous, and light-hearted tone"),
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
                AiPersona.FREELANCER, AiPersona.PROFESSIONAL -> if (hasContext) "Thank you for the update. With regard to '$trimmed', I have reviewed the details and will proceed accordingly." else "Thank you for reaching out. I have reviewed the matter and will proceed accordingly."
                AiPersona.FUNNY -> if (hasContext) "Say no more! Working my magic on '$trimmed' as we speak! 😂🚀" else "Plot twist: I actually agree with you on this one! 😂"
                AiPersona.SHORT -> if (hasContext) "Got it ($trimmed) — on it!" else "Sounds good, thanks!"
                AiPersona.NATURAL -> if (hasContext) "Yeah sounds good! Looking into '$trimmed' now." else "Sounds good to me, talk soon!"
                AiPersona.ROMANTIC -> if (hasContext) "Thinking of you! Regarding '$trimmed', that makes me smile ❤️" else "Thinking of you, hope your day is as sweet as you are! ❤️✨"
            }
            AiAction.CONTINUE -> when (persona) {
                AiPersona.FRIENDLY -> if (hasContext) "Totally with you on '$trimmed'! How should we tackle the next steps together? 🙌" else "That makes a lot of sense! How did the rest of it go? 😊"
                AiPersona.FREELANCER, AiPersona.PROFESSIONAL -> if (hasContext) "Building upon '$trimmed', we should coordinate our subsequent milestones." else "Following up on our earlier discussion, let us establish the timeline."
                AiPersona.FUNNY -> if (hasContext) "And just when you thought '$trimmed' was settled... boom, part two! 🍿" else "And then what happened? The suspense is killing me! 🍿"
                AiPersona.SHORT -> if (hasContext) "Next step on '$trimmed':" else "Agreed. What is next?"
                AiPersona.NATURAL -> if (hasContext) "Yeah, and about '$trimmed', I was thinking we could follow up tomorrow." else "Totally. What are you thinking for the next move?"
                AiPersona.ROMANTIC -> if (hasContext) "Can't stop thinking about what you said about '$trimmed'... tell me more ❤️" else "Tell me more, I love hearing about your day ❤️"
            }
            AiAction.START -> when (persona) {
                AiPersona.FRIENDLY -> if (hasContext) "Hey! Hope your day is going great! Quick question about '$trimmed' 😊" else "Hey! Hope you are having a wonderful day! 😊"
                AiPersona.FREELANCER, AiPersona.PROFESSIONAL -> if (hasContext) "Good day. I am writing to initiate our discussion regarding '$trimmed'." else "Good day. I hope this message finds you well."
                AiPersona.FUNNY -> if (hasContext) "Knock knock! Who is there? Me, asking about '$trimmed' 😂" else "Knock knock! Just dropping in to say hi! 👋"
                AiPersona.SHORT -> if (hasContext) "Hi — quick note regarding '$trimmed':" else "Hi, reaching out briefly:"
                AiPersona.NATURAL -> if (hasContext) "Hey! Was just thinking about '$trimmed'." else "Hey! How is everything going?"
                AiPersona.ROMANTIC -> if (hasContext) "Hey sweetheart ❤️ Was just thinking about '$trimmed'." else "Hey sweetheart, just wanted to send you a little love today ❤️"
            }
            AiAction.REWRITE -> when (persona) {
                AiPersona.FRIENDLY -> if (hasContext) "Here is a warmer take: '$trimmed — let us make it happen!' 😊" else "Let us make it happen! 😊"
                AiPersona.FREELANCER, AiPersona.PROFESSIONAL -> if (hasContext) "Formal revision: Please be advised regarding '$trimmed'." else "Please note the formal update as requested."
                AiPersona.FUNNY -> if (hasContext) "Spiced-up version: '$trimmed' (now with 200% more pizzazz) 🎉" else "Now with 200% more pizzazz! 🎉"
                AiPersona.SHORT -> if (hasContext) "'$trimmed' (condensed)" else "Noted."
                AiPersona.NATURAL -> if (hasContext) "Rewritten naturally: '$trimmed'" else "Sounds good!"
                AiPersona.ROMANTIC -> if (hasContext) "'$trimmed' — with all my love ❤️" else "With all my love ❤️"
            }
            AiAction.CREATE -> when (persona) {
                AiPersona.FRIENDLY -> if (hasContext) "Here is a fun draft on '$trimmed'! ✨ What do you think?" else "Here is a friendly draft to share! ✨"
                AiPersona.FREELANCER, AiPersona.PROFESSIONAL -> if (hasContext) "Proposal draft regarding '$trimmed'. Please review." else "Draft proposal prepared for review."
                AiPersona.FUNNY -> if (hasContext) "Brand new masterpiece inspired by '$trimmed' 🎨" else "Hot off the press! 📰🔥"
                AiPersona.SHORT -> if (hasContext) "Draft ($trimmed): Ready." else "Draft ready."
                AiPersona.NATURAL -> if (hasContext) "Put together a quick message about '$trimmed'." else "Here is a quick draft for you."
                AiPersona.ROMANTIC -> if (hasContext) "A heartfelt note about '$trimmed' just for you ❤️" else "A special note just for you ❤️"
            }
            AiAction.ASK_AI -> generateMockAskAiResponse(trimmed, persona)
        }
    }

    /**
     * M2.1: Multiple AI suggestion variations for card selection
     */
    fun generateSuggestions(
        action: AiAction,
        persona: AiPersona,
        context: String = ""
    ): List<String> {
        val trimmed = context.trim()
        val primary = generateReply(action, persona, context)

        if (action == AiAction.REWRITE) {
            if (trimmed.isNotEmpty()) {
                if (persona == AiPersona.FRIENDLY) {
                    return listOf(
                        "Hey! What's up?",
                        "Hey, how's it going?",
                        "Hey there! Hope you are having an awesome day 😊"
                    )
                } else if (persona == AiPersona.FREELANCER || persona == AiPersona.PROFESSIONAL) {
                    return listOf(
                        "Deliverable update: '$trimmed'. Ready for your review.",
                        "Regarding '$trimmed': following up with milestone details.",
                        "Please review the latest project update regarding '$trimmed'."
                    )
                } else if (persona == AiPersona.FUNNY) {
                    return listOf(
                        "Spiced-up version: '$trimmed' (now with 200% more pizzazz) 🎉",
                        "Plot twist: '$trimmed'! 😂",
                        "Breaking news: '$trimmed'! 🚀"
                    )
                } else if (persona == AiPersona.SHORT) {
                    return listOf(
                        "$trimmed (updated)",
                        "Quick update: $trimmed",
                        "All set."
                    )
                } else if (persona == AiPersona.ROMANTIC) {
                    return listOf(
                        "Thinking of you: '$trimmed' ❤️",
                        "Hey sweetheart, about '$trimmed' ❤️✨",
                        "Just wanted to send you love: '$trimmed' 💕"
                    )
                }
            }
        }

        if (action == AiAction.REPLY) {
            if (trimmed.isNotEmpty()) {
                if (persona == AiPersona.FRIENDLY) {
                    return listOf(
                        primary,
                        "Hey! Thanks for the update on '$trimmed'! 😊",
                        "Sounds awesome! Let's definitely do '$trimmed'! ✨"
                    )
                } else if (persona == AiPersona.FREELANCER || persona == AiPersona.PROFESSIONAL) {
                    return listOf(
                        primary,
                        "Noted regarding '$trimmed'. I will incorporate this into the current sprint.",
                        "Understood. Proceeding with '$trimmed' as discussed."
                    )
                } else if (persona == AiPersona.FUNNY) {
                    return listOf(
                        primary,
                        "Say no more, my friend! '$trimmed' is already in motion! 🚀",
                        "Challenge accepted for '$trimmed'! 😂"
                    )
                } else if (persona == AiPersona.SHORT) {
                    return listOf(
                        primary,
                        "Got it, thanks!",
                        "Understood."
                    )
                } else if (persona == AiPersona.ROMANTIC) {
                    return listOf(
                        primary,
                        "Always brightens my day hearing from you about '$trimmed' ❤️",
                        "Can't wait to see you! About '$trimmed', count me in ❤️"
                    )
                }
            }
        }

        if (action == AiAction.CONTINUE) {
            return listOf(
                primary,
                if (trimmed.isNotEmpty()) "Also, regarding '$trimmed', how would you like to handle next steps?" else "What do you think should be our next move?",
                if (trimmed.isNotEmpty()) "Let's keep the momentum going on '$trimmed'!" else "Agreed, let's keep going!"
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
            AiPersona.FREELANCER, AiPersona.PROFESSIONAL -> "Analysis for \"$q\": Based on the provided inquiry, the recommended approach is to outline clear objectives, align stakeholder expectations, and proceed methodically."
            AiPersona.FUNNY -> "According to my calculations on \"$q\": 42! Just kidding — here is the fun answer: definitely go for it, but bring snacks! 🍕✨"
            AiPersona.SHORT -> "\"$q\" — Summary: Verified and recommended."
            AiPersona.NATURAL -> "On \"$q\": I would recommend keeping it simple and straightforward."
            AiPersona.ROMANTIC -> "Regarding \"$q\": Whatever you choose, follow your heart! I believe in you ❤️✨"
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
