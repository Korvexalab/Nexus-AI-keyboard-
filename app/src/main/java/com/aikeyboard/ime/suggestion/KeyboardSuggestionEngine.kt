package com.aikeyboard.ime.suggestion

/**
 * Gboard-style On-Device Autocorrect & Next-Word Suggestion Engine.
 *
 * Runs 100% locally on-device with 0ms latency:
 * - High-speed dictionary prefix lookup
 * - Common typographical error correction (e.g. "teh" -> "the", "recieve" -> "receive")
 * - Next-word bigram predictive suggestions (e.g. "thank" -> ["you", "so much", "for"])
 * - Case preservation (capitalization matching user input)
 */
data class SuggestionResult(
    val candidates: List<String>,
    val autocorrectCandidate: String? = null
)

object KeyboardSuggestionEngine {

    // Common English typographical errors mapped to their correct spellings
    private val commonTypos = mapOf(
        "teh" to "the",
        "recieve" to "receive",
        "recieved" to "received",
        "seperate" to "separate",
        "seperated" to "separated",
        "definately" to "definitely",
        "becuase" to "because",
        "dont" to "don't",
        "cant" to "can't",
        "wont" to "won't",
        "im" to "I'm",
        "youre" to "you're",
        "theyre" to "they're",
        "ive" to "I've",
        "id" to "I'd",
        "weve" to "we've",
        "alot" to "a lot",
        "untill" to "until",
        "occured" to "occurred",
        "truely" to "truly",
        "goverment" to "government",
        "wierd" to "weird",
        "beleive" to "believe",
        "acheive" to "achieve",
        "tommorow" to "tomorrow",
        "tommorrow" to "tomorrow",
        "alread" to "already",
        "thier" to "their",
        "feild" to "field",
        "peice" to "piece",
        "freind" to "friend",
        "freinds" to "friends",
        "neccesary" to "necessary",
        "begining" to "beginning",
        "suprise" to "surprise",
        "embarass" to "embarrass",
        "accomodate" to "accommodate",
        "appologize" to "apologize",
        "calender" to "calendar",
        "definately" to "definitely",
        "enviroment" to "environment",
        "familar" to "familiar",
        "finnaly" to "finally",
        "gaurentee" to "guarantee",
        "greatful" to "grateful",
        "incidently" to "incidentally",
        "knowlege" to "knowledge",
        "millenium" to "millennium",
        "noticable" to "noticeable",
        "ocassion" to "occasion",
        "parrallel" to "parallel",
        "persue" to "pursue",
        "posession" to "possession",
        "priviledge" to "privilege",
        "reccomend" to "recommend",
        "refering" to "referring",
        "religous" to "religious",
        "rember" to "remember",
        "resistence" to "resistance",
        "sence" to "sense",
        "succesful" to "successful",
        "thnx" to "thanks",
        "tnx" to "thanks",
        "plz" to "please",
        "pls" to "please",
        "u" to "you",
        "ur" to "your",
        "r" to "are",
        "omw" to "on my way",
        "idk" to "I don't know",
        "imo" to "in my opinion",
        "tbh" to "to be honest",
        "btw" to "by the way",
        "np" to "no problem"
    )

    // Contextual Bigram next-word predictions for natural conversation flow
    private val nextWordPredictions = mapOf(
        "how" to listOf("are", "is", "about"),
        "hows" to listOf("it", "your", "everything"),
        "how's" to listOf("it", "your", "everything"),
        "thank" to listOf("you", "you so much", "for"),
        "thanks" to listOf("for", "again", "a lot"),
        "let" to listOf("me", "us", "know"),
        "lets" to listOf("meet", "do", "go"),
        "let's" to listOf("meet", "do", "go"),
        "i" to listOf("am", "will", "would"),
        "im" to listOf("going", "on", "sure"),
        "i'm" to listOf("going", "on", "sure"),
        "good" to listOf("morning", "night", "job"),
        "see" to listOf("you", "what", "later"),
        "are" to listOf("you", "we", "there"),
        "what" to listOf("do", "are", "is"),
        "can" to listOf("you", "we", "i"),
        "where" to listOf("are", "is", "can"),
        "when" to listOf("are", "can", "will"),
        "why" to listOf("not", "did", "are"),
        "have" to listOf("a", "you", "been"),
        "please" to listOf("let", "find", "call"),
        "sounds" to listOf("good", "great", "like"),
        "talk" to listOf("to you soon", "later", "soon"),
        "hope" to listOf("you're", "this", "all"),
        "on" to listOf("my way", "the way", "it"),
        "nice" to listOf("to", "meeting", "job"),
        "great" to listOf("job", "to hear", "seeing"),
        "call" to listOf("me", "you", "when"),
        "text" to listOf("me", "you", "later"),
        "at" to listOf("the", "home", "work"),
        "in" to listOf("the", "a", "my"),
        "to" to listOf("the", "be", "do"),
        "for" to listOf("the", "you", "now"),
        "with" to listOf("you", "me", "the"),
        "we" to listOf("can", "will", "should"),
        "you" to listOf("can", "are", "have"),
        "they" to listOf("are", "will", "have"),
        "it" to listOf("is", "was", "would"),
        "that" to listOf("is", "was", "sounds")
    )

    // High-frequency English dictionary for prefix matching and completions
    private val commonWords = listOf(
        "the", "be", "to", "of", "and", "a", "in", "that", "have", "i",
        "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
        "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
        "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
        "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
        "when", "make", "can", "like", "time", "no", "just", "him", "know", "take",
        "people", "into", "year", "your", "good", "some", "could", "them", "see", "other",
        "than", "then", "now", "look", "only", "come", "its", "over", "think", "also",
        "back", "after", "use", "two", "how", "our", "work", "first", "well", "way",
        "even", "new", "want", "because", "any", "these", "give", "day", "most", "us",
        "great", "hello", "hi", "hey", "thanks", "thank", "please", "yes", "sure", "today",
        "tomorrow", "tonight", "morning", "afternoon", "evening", "night", "week", "meeting",
        "call", "phone", "message", "email", "send", "receive", "update", "working", "going",
        "ready", "done", "perfect", "awesome", "sounds", "looking", "check", "happy", "need",
        "help", "question", "answer", "talk", "later", "soon", "fine", "cool", "maybe",
        "definitely", "probably", "actually", "already", "always", "never", "everything",
        "something", "anything", "nothing", "someone", "anyone", "everyone", "where", "here",
        "there", "together", "friend", "family", "office", "home", "place", "school", "project",
        "plan", "number", "idea", "problem", "solution", "start", "stop", "finish", "complete",
        "important", "interesting", "possible", "difficult", "easy", "simple", "quick", "fast",
        "slow", "right", "left", "again", "much", "many", "little", "few", "more", "less"
    )

    /**
     * Generates Gboard-like suggestions based on current word prefix and previous context word.
     */
    fun getSuggestions(
        currentWord: String,
        previousWord: String? = null,
        suggestionsEnabled: Boolean = true
    ): SuggestionResult {
        if (!suggestionsEnabled) {
            return SuggestionResult(emptyList())
        }

        val trimmedCurrent = currentWord.trim()

        // 1. If currently typing a word (prefix matching and typo correction)
        if (trimmedCurrent.isNotEmpty()) {
            val lowerCurrent = trimmedCurrent.lowercase()
            val isCapitalized = trimmedCurrent.first().isUpperCase()
            val isAllUpper = trimmedCurrent.length > 1 && trimmedCurrent.all { it.isUpperCase() }

            fun matchCase(word: String): String {
                return when {
                    isAllUpper -> word.uppercase()
                    isCapitalized -> word.replaceFirstChar { it.uppercase() }
                    else -> word
                }
            }

            // Check direct typo match
            val typoMatch = commonTypos[lowerCurrent]
            val autocorrect = typoMatch?.let { matchCase(it) }

            val candidates = mutableListOf<String>()

            // If it's a known typo, place the autocorrect candidate front and center
            if (autocorrect != null) {
                candidates.add(trimmedCurrent) // Literal typed word
                candidates.add(autocorrect)   // Corrected word
                // Find next completion for the corrected word
                val nextWords = nextWordPredictions[autocorrect.lowercase()] ?: emptyList()
                if (nextWords.isNotEmpty()) {
                    candidates.add(nextWords.first())
                }
            } else {
                // Find prefix completions from common dictionary
                val prefixMatches = commonWords.filter { it.startsWith(lowerCurrent) && it != lowerCurrent }
                    .take(3)
                    .map { matchCase(it) }

                if (prefixMatches.isNotEmpty()) {
                    // Center is top completion, Left is literal or second, Right is third
                    if (prefixMatches.size == 1) {
                        candidates.add(trimmedCurrent)
                        candidates.add(prefixMatches[0])
                        // Add next word prediction for the top completion
                        val next = nextWordPredictions[prefixMatches[0].lowercase()]?.firstOrNull()
                        if (next != null) candidates.add(next)
                    } else if (prefixMatches.size == 2) {
                        candidates.add(trimmedCurrent)
                        candidates.add(prefixMatches[0])
                        candidates.add(prefixMatches[1])
                    } else {
                        candidates.add(prefixMatches[1])
                        candidates.add(prefixMatches[0])
                        candidates.add(prefixMatches[2])
                    }
                } else {
                    // Exact match or unfamiliar word: offer capitalized or literal
                    candidates.add(trimmedCurrent)
                    if (!isCapitalized) {
                        candidates.add(trimmedCurrent.replaceFirstChar { it.uppercase() })
                    }
                }
            }

            return SuggestionResult(
                candidates = candidates.distinct().take(3),
                autocorrectCandidate = autocorrect
            )
        }

        // 2. If at a word boundary (space just typed), offer Next-Word Predictions
        if (!previousWord.isNullOrBlank()) {
            val lowerPrev = previousWord.trim().lowercase().removeSuffix(".").removeSuffix(",").removeSuffix("!").removeSuffix("?")
            val predictions = nextWordPredictions[lowerPrev]
            if (!predictions.isNullOrEmpty()) {
                return SuggestionResult(
                    candidates = predictions.take(3),
                    autocorrectCandidate = null
                )
            }
            // Fallback continuations for arbitrary preceding words
            return SuggestionResult(
                candidates = listOf("and", "is", "to"),
                autocorrectCandidate = null
            )
        }

        // Default conversational starters when starting a sentence or input is empty
        return SuggestionResult(
            candidates = listOf("Hey", "Sounds good", "Thanks!"),
            autocorrectCandidate = null
        )
    }

    /**
     * Determines if a double-space was pressed within threshold to trigger ". "
     */
    fun shouldTriggerDoubleSpacePeriod(
        lastSpaceTimeMs: Long,
        currentTimeMs: Long,
        doubleSpaceEnabled: Boolean
    ): Boolean {
        if (!doubleSpaceEnabled) return false
        val delta = currentTimeMs - lastSpaceTimeMs
        return delta in 50..450
    }

    /**
     * Checks if the previous text indicates the start of a sentence for auto-capitalization.
     */
    fun shouldAutoCapitalize(
        textBeforeCursor: CharSequence?,
        autoCapEnabled: Boolean
    ): Boolean {
        if (!autoCapEnabled || textBeforeCursor == null) return false
        val trimmed = textBeforeCursor.toString()
        if (trimmed.isEmpty()) return true
        val endsWithSentenceEnd = trimmed.endsWith(". ") ||
                trimmed.endsWith("! ") ||
                trimmed.endsWith("? ") ||
                trimmed.endsWith("\n") ||
                trimmed.endsWith(".  ")
        return endsWithSentenceEnd
    }
}
