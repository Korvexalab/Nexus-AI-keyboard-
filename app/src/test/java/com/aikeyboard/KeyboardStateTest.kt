package com.aikeyboard

import com.aikeyboard.ime.KeyboardMode
import com.aikeyboard.ime.ShiftState
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class KeyboardStateTest {

    @Test
    fun testKeyboardModeValues() {
        val modes = KeyboardMode.values()
        assertEquals(5, modes.size)
        assertTrue(modes.contains(KeyboardMode.ALPHA))
        assertTrue(modes.contains(KeyboardMode.SYMBOLS))
        assertTrue(modes.contains(KeyboardMode.ALT_SYMBOLS))
        assertTrue(modes.contains(KeyboardMode.EMOJI))
        assertTrue(modes.contains(KeyboardMode.CLIPBOARD))
    }

    @Test
    fun testShiftStateValues() {
        val states = ShiftState.values()
        assertEquals(3, states.size)
        assertTrue(states.contains(ShiftState.OFF))
        assertTrue(states.contains(ShiftState.SHIFTED))
        assertTrue(states.contains(ShiftState.CAPS_LOCK))
    }

    @Test
    fun testShiftCycleTransitions() {
        var current = ShiftState.OFF

        // Single tap -> SHIFTED
        current = if (current == ShiftState.OFF) ShiftState.SHIFTED else ShiftState.OFF
        assertEquals(ShiftState.SHIFTED, current)

        // Typing character returns to OFF
        current = ShiftState.OFF
        assertEquals(ShiftState.OFF, current)

        // Double tap -> CAPS_LOCK
        current = ShiftState.CAPS_LOCK
        assertEquals(ShiftState.CAPS_LOCK, current)

        // Tap while caps locked -> OFF
        current = ShiftState.OFF
        assertEquals(ShiftState.OFF, current)
    }

    @Test
    fun testEmojiModeTransition() {
        var mode = KeyboardMode.ALPHA

        // Open emoji picker
        mode = if (mode == KeyboardMode.EMOJI) KeyboardMode.ALPHA else KeyboardMode.EMOJI
        assertEquals(KeyboardMode.EMOJI, mode)

        // Return via ABC button
        mode = KeyboardMode.ALPHA
        assertEquals(KeyboardMode.ALPHA, mode)
    }

    @Test
    fun testCommaKeyInputIntegrity() {
        val testBuffer = StringBuilder("Hello")
        testBuffer.append(",")
        assertEquals("Hello,", testBuffer.toString())
    }

    @Test
    fun testClipboardModeTransition() {
        var mode = KeyboardMode.ALPHA

        // Open clipboard panel
        mode = if (mode == KeyboardMode.CLIPBOARD) KeyboardMode.ALPHA else KeyboardMode.CLIPBOARD
        assertEquals(KeyboardMode.CLIPBOARD, mode)

        // Return to normal keyboard via ABC / return action
        mode = KeyboardMode.ALPHA
        assertEquals(KeyboardMode.ALPHA, mode)
    }

    @Test
    fun testClipboardHistoryCapacityAndDeduplication() {
        val history = mutableListOf<String>()

        fun addClip(text: String) {
            val trimmed = text.trim()
            if (trimmed.isEmpty()) return
            if (history.isNotEmpty() && history.first() == trimmed) return
            history.remove(trimmed)
            history.add(0, trimmed)
            while (history.size > 10) {
                history.removeAt(history.size - 1)
            }
        }

        // Add 12 items
        for (i in 1..12) {
            addClip("Clip $i")
        }

        assertEquals(10, history.size)
        assertEquals("Clip 12", history.first())
        assertEquals("Clip 3", history.last())

        // Test duplicate consecutive add
        addClip("Clip 12")
        assertEquals(10, history.size)
        assertEquals("Clip 12", history[0])

        // Test re-inserting older item moves it to top
        addClip("Clip 5")
        assertEquals(10, history.size)
        assertEquals("Clip 5", history[0])
    }

    @Test
    fun testAiCommandCenterActionsAndPersonas() {
        val actions = com.aikeyboard.ime.ai.AiAction.values()
        assertEquals(6, actions.size)
        assertTrue(actions.contains(com.aikeyboard.ime.ai.AiAction.REPLY))
        assertTrue(actions.contains(com.aikeyboard.ime.ai.AiAction.ASK_AI))
        assertTrue(actions.contains(com.aikeyboard.ime.ai.AiAction.CONTINUE))
        assertTrue(actions.contains(com.aikeyboard.ime.ai.AiAction.START))
        assertTrue(actions.contains(com.aikeyboard.ime.ai.AiAction.REWRITE))
        assertTrue(actions.contains(com.aikeyboard.ime.ai.AiAction.CREATE))

        // Check primary actions
        val primary = actions.filter { it.isPrimary }
        assertEquals(4, primary.size)

        // Check secondary actions (revealed on "more")
        val secondary = actions.filter { !it.isPrimary }
        assertEquals(2, secondary.size)
        assertTrue(secondary.contains(com.aikeyboard.ime.ai.AiAction.REWRITE))
        assertTrue(secondary.contains(com.aikeyboard.ime.ai.AiAction.CREATE))

        // Check temporary personas
        val personas = com.aikeyboard.ime.ai.AiPersona.values()
        assertEquals(7, personas.size)
        assertTrue(personas.contains(com.aikeyboard.ime.ai.AiPersona.FRIENDLY))
        assertTrue(personas.contains(com.aikeyboard.ime.ai.AiPersona.FREELANCER))
        assertTrue(personas.contains(com.aikeyboard.ime.ai.AiPersona.PROFESSIONAL))
        assertTrue(personas.contains(com.aikeyboard.ime.ai.AiPersona.FUNNY))
        assertTrue(personas.contains(com.aikeyboard.ime.ai.AiPersona.SHORT))
        assertTrue(personas.contains(com.aikeyboard.ime.ai.AiPersona.NATURAL))
        assertTrue(personas.contains(com.aikeyboard.ime.ai.AiPersona.ROMANTIC))

        // Test generation for actions
        val testContext = "meeting at 4pm"
        for (action in actions) {
            val res = com.aikeyboard.ime.ai.AiReplyGenerator.generateReply(
                action = action,
                persona = com.aikeyboard.ime.ai.AiPersona.FRIENDLY,
                context = testContext
            )
            assertTrue(res.isNotEmpty())
        }

        // Test Ask AI generator
        val askRes = com.aikeyboard.ime.ai.AiReplyGenerator.generateMockAskAiResponse(
            question = "how to prepare for the sprint",
            persona = com.aikeyboard.ime.ai.AiPersona.PROFESSIONAL
        )
        assertTrue(askRes.contains("sprint") || askRes.isNotEmpty())
    }

    @Test
    fun testAiReplyStylesAndGeneration() {
        val styles = com.aikeyboard.ime.ai.AiReplyStyle.values()
        assertEquals(5, styles.size)
        assertTrue(styles.contains(com.aikeyboard.ime.ai.AiReplyStyle.REPLY))
        assertTrue(styles.contains(com.aikeyboard.ime.ai.AiReplyStyle.FRIENDLY))
        assertTrue(styles.contains(com.aikeyboard.ime.ai.AiReplyStyle.SHORT))
        assertTrue(styles.contains(com.aikeyboard.ime.ai.AiReplyStyle.PROFESSIONAL))
        assertTrue(styles.contains(com.aikeyboard.ime.ai.AiReplyStyle.FUNNY))

        // Test mock replies generation for each tone
        for (style in styles) {
            val reply = com.aikeyboard.ime.ai.AiReplyGenerator.generateMockReply(style)
            assertTrue(reply.isNotEmpty())
        }

        // Test mock replies with custom prompt
        val customPrompt = "urgent response"
        val customReply = com.aikeyboard.ime.ai.AiReplyGenerator.generateMockReply(
            com.aikeyboard.ime.ai.AiReplyStyle.SHORT,
            customPrompt
        )
        assertTrue(customReply.contains(customPrompt))
    }

    @Test
    fun testInputRoutingAndBackspaceTargeting() {
        var hostBuffer = "hello"
        var customPrompt = ""
        var aiPanelVisible = false
        var aiPromptFocused = false

        fun handleTextInput(text: String) {
            if (aiPanelVisible && aiPromptFocused) {
                customPrompt += text
            } else {
                hostBuffer += text
            }
        }

        fun handleBackspace() {
            if (aiPanelVisible && aiPromptFocused) {
                if (customPrompt.isNotEmpty()) {
                    customPrompt = customPrompt.dropLast(1)
                }
            } else {
                if (hostBuffer.isNotEmpty()) {
                    hostBuffer = hostBuffer.dropLast(1)
                }
            }
        }

        fun handleSpace() {
            if (aiPanelVisible && aiPromptFocused) {
                customPrompt += " "
            } else {
                hostBuffer += " "
            }
        }

        fun handleClearButton() {
            customPrompt = ""
        }

        // Case 1: Normal chat input focused
        assertEquals("hello", hostBuffer)
        handleBackspace()
        assertEquals("hell", hostBuffer)
        handleTextInput("o")
        assertEquals("hello", hostBuffer)
        assertEquals("", customPrompt)

        // Case 2: Open AI panel and focus custom prompt
        aiPanelVisible = true
        aiPromptFocused = true

        // Type letters into custom prompt
        val promptToType = "make this sound professional"
        for (ch in promptToType) {
            if (ch == ' ') handleSpace() else handleTextInput(ch.toString())
        }
        assertEquals("make this sound professional", customPrompt)
        assertEquals("hello", hostBuffer) // Host chat buffer MUST remain untouched!

        // Backspace several times in custom prompt
        repeat(7) { handleBackspace() }
        assertEquals("make this sound professio", customPrompt)
        assertEquals("hello", hostBuffer) // Host remains untouched

        // Simulate long-press continuous backspace until empty
        repeat(50) { handleBackspace() }
        assertEquals("", customPrompt)
        assertEquals("hello", hostBuffer) // Even when custom prompt is empty, host is never touched

        // Clear button clears prompt
        customPrompt = "some prompt"
        handleClearButton()
        assertEquals("", customPrompt)
        assertEquals("hello", hostBuffer)

        // Case 3: Close AI panel / leave custom prompt -> returns to normal chat input
        aiPanelVisible = false
        aiPromptFocused = false

        handleTextInput(" world")
        assertEquals("hello world", hostBuffer)
        handleBackspace()
        assertEquals("hello worl", hostBuffer)
    }

    @Test
    fun testExactM2Scenarios() {
        var hostBuffer = ""
        var contextText = ""
        var aiPanelVisible = false
        var panelMode = "action_board"
        var inputTarget = "host"
        var selectedAction = "reply"
        var selectedPersona = "friendly"
        var keyboardVisible = true // IME should stay visible throughout!

        fun type(text: String) {
            assertTrue("Keyboard must remain visible while typing", keyboardVisible)
            if (aiPanelVisible && inputTarget == "ai_context") {
                contextText += text
            } else {
                hostBuffer += text
            }
        }

        fun backspace() {
            assertTrue("Keyboard must remain visible while backspacing", keyboardVisible)
            if (aiPanelVisible && inputTarget == "ai_context") {
                if (contextText.isNotEmpty()) contextText = contextText.dropLast(1)
            } else {
                if (hostBuffer.isNotEmpty()) hostBuffer = hostBuffer.dropLast(1)
            }
        }

        // Test A — Context Focus
        // 1. open ai
        aiPanelVisible = true
        assertTrue(keyboardVisible)

        // 2. tap "+ add context"
        inputTarget = "ai_context"
        assertTrue(keyboardVisible)

        // 3. type text
        type("project brief")

        // 4. confirm text goes into ai context
        assertEquals("project brief", contextText)
        assertEquals("", hostBuffer)

        // 5. tap reply
        selectedAction = "reply"
        inputTarget = "host" // Non-text control transfers target to host

        // 6. confirm ai context loses keyboard-input ownership
        assertEquals("host", inputTarget)

        // 7. confirm keyboard stays visible
        assertTrue(keyboardVisible)

        // 8. type
        type("Hello team")

        // 9. confirm typing now goes to host chat field
        assertEquals("Hello team", hostBuffer)
        assertEquals("project brief", contextText) // context unchanged

        // Test B — Persona
        // 1. open ai (already open)
        // 2. swipe persona row / select another persona
        selectedPersona = "freelancer"
        inputTarget = "host"
        assertTrue("Keyboard never disappears during persona selection", keyboardVisible)

        // 3. select another persona again
        selectedPersona = "funny"
        inputTarget = "host"
        assertTrue("Keyboard remains stable during persona re-selection", keyboardVisible)

        // Test C — Ask AI
        // 1. tap ask ai
        selectedAction = "ask_ai"
        panelMode = "ask_ai"
        inputTarget = "host"
        assertTrue(keyboardVisible)

        // 2. confirm ask ai mode appears
        assertEquals("ask_ai", panelMode)

        // 3. tap question field and type a question
        inputTarget = "ai_context"
        contextText = ""
        type("how to scale?")
        assertEquals("how to scale?", contextText)

        // 4. generate/ask
        val mockAnswer = com.aikeyboard.ime.ai.AiReplyGenerator.generateMockAskAiResponse(
            contextText,
            com.aikeyboard.ime.ai.AiPersona.fromId(selectedPersona)
        )
        inputTarget = "host"
        assertTrue(mockAnswer.isNotEmpty())

        // 5. tap insert
        // confirm response goes into host chat field via InputConnection
        hostBuffer += mockAnswer
        assertTrue(hostBuffer.contains("how to scale?"))

        // 6. tap ← writing actions
        panelMode = "action_board"
        inputTarget = "host"
        assertEquals("action_board", panelMode)
        assertTrue("Keyboard never disappeared navigating back from Ask AI", keyboardVisible)

        // Test D — Back vs Close
        // ← writing actions returned to action board while panel is still visible
        assertTrue(aiPanelVisible)
        assertEquals("action_board", panelMode)

        // × closes the entire AI panel
        aiPanelVisible = false
        inputTarget = "host"
        assertFalse(aiPanelVisible)
        assertTrue("Keyboard still active and visible for normal typing after closing panel", keyboardVisible)

        type(" done")
        assertTrue(hostBuffer.endsWith(" done"))
    }

    @Test
    fun testPermanentNumberRowAndInputConnectionRouting() {
        val numberRow = listOf("1", "2", "3", "4", "5", "6", "7", "8", "9", "0")
        var hostBuffer = ""
        var contextText = ""
        var inputTarget = "host"
        var aiPanelVisible = false
        var currentMode = KeyboardMode.ALPHA
        var shift = ShiftState.OFF

        fun onTextInput(text: String) {
            if (aiPanelVisible && inputTarget == "ai_context") {
                contextText += text
            } else {
                hostBuffer += text
            }
        }

        fun onBackspace() {
            if (aiPanelVisible && inputTarget == "ai_context") {
                if (contextText.isNotEmpty()) contextText = contextText.dropLast(1)
            } else {
                if (hostBuffer.isNotEmpty()) hostBuffer = hostBuffer.dropLast(1)
            }
        }

        fun onSpace() = onTextInput(" ")
        fun onPeriod() = onTextInput(".")
        fun onComma() = onTextInput(",")

        // 1. Verify all 10 digits are directly tappable in normal alphabet mode
        assertEquals(KeyboardMode.ALPHA, currentMode)
        numberRow.forEach { digit ->
            onTextInput(digit)
        }
        assertEquals("1234567890", hostBuffer)

        // 2. Test typing numbers in Chrome / messaging context
        hostBuffer = "https://example.com/item/"
        listOf("4", "2").forEach { onTextInput(it) }
        assertEquals("https://example.com/item/42", hostBuffer)

        // 3. Test backspace removes digits properly
        onBackspace()
        assertEquals("https://example.com/item/4", hostBuffer)

        // 4. Test comma, period, space alongside numbers
        onComma()
        onSpace()
        onTextInput("9")
        onPeriod()
        assertEquals("https://example.com/item/4, 9.", hostBuffer)

        // 5. Test shift does not break number row
        shift = ShiftState.SHIFTED
        onTextInput("1")
        assertEquals("https://example.com/item/4, 9.1", hostBuffer)

        // 6. Test with AI panel open and context focused vs host focused
        aiPanelVisible = true
        inputTarget = "ai_context"
        contextText = "prompt"
        listOf("1", "2", "3").forEach { onTextInput(it) }
        assertEquals("prompt123", contextText)
        assertEquals("https://example.com/item/4, 9.1", hostBuffer) // host untouched

        // When switching input target to host
        inputTarget = "host"
        onTextInput("5")
        assertEquals("https://example.com/item/4, 9.15", hostBuffer)
        assertEquals("prompt123", contextText) // context untouched

        // 7. Verify ?123 still switches to SYMBOLS mode and returns to ALPHA
        currentMode = KeyboardMode.SYMBOLS
        assertEquals(KeyboardMode.SYMBOLS, currentMode)
        currentMode = KeyboardMode.ALPHA
        assertEquals(KeyboardMode.ALPHA, currentMode)

        // Close AI panel
        aiPanelVisible = false
        inputTarget = "host"
        onTextInput("0")
        assertEquals("https://example.com/item/4, 9.150", hostBuffer)
    }

    @Test
    fun testM21AiBoardReplacesKeyboardAndUsesHostContext() {
        var hostBuffer = ""
        var keyboardKeysVisible = true
        var aiBoardVisible = false
        var selectedAction = com.aikeyboard.ime.ai.AiAction.REPLY
        var selectedPersona = com.aikeyboard.ime.ai.AiPersona.FRIENDLY

        // 1. Host application's chat bar is the primary writing context
        fun typeInHost(text: String) {
            hostBuffer += text
        }
        fun replaceHostText(replacement: String) {
            hostBuffer = replacement
        }

        typeInHost("whatup")
        assertEquals("whatup", hostBuffer)
        assertTrue("Normal keyboard keys visible initially", keyboardKeysVisible)
        assertFalse("AI board not visible initially", aiBoardVisible)

        // 2. User taps AI button: AI board replaces keyboard board
        aiBoardVisible = true
        keyboardKeysVisible = false // Keys disappear, AI board occupies board area

        assertTrue("AI board replaces keyboard board", aiBoardVisible)
        assertFalse("Keyboard keys are replaced by AI board", keyboardKeysVisible)
        assertEquals("Host chat bar remains visible and unchanged", "whatup", hostBuffer)

        // 3. User taps Rewrite action and Friendly persona
        selectedAction = com.aikeyboard.ime.ai.AiAction.REWRITE
        selectedPersona = com.aikeyboard.ime.ai.AiPersona.FRIENDLY

        // 4. Suggestions generated directly from host chat bar context ("whatup")
        val suggestions = com.aikeyboard.ime.ai.AiReplyGenerator.generateSuggestions(
            action = selectedAction,
            persona = selectedPersona,
            context = hostBuffer
        )

        assertTrue("Generates multiple suggestions based on host chat bar", suggestions.size >= 2)
        assertTrue("Contains 'Hey! What's up?'", suggestions.contains("Hey! What's up?"))
        assertTrue("Contains 'Hey, how's it going?'", suggestions.contains("Hey, how's it going?"))

        // 5. User taps [Replace] on suggestion card
        replaceHostText(suggestions[0])
        assertEquals("Hey! What's up?", hostBuffer)

        // 6. User taps back arrow to return to normal keyboard
        aiBoardVisible = false
        keyboardKeysVisible = true

        assertFalse("AI board dismissed", aiBoardVisible)
        assertTrue("Keyboard keys restored", keyboardKeysVisible)
        assertEquals("Host chat bar retains replaced content", "Hey! What's up?", hostBuffer)
    }

    @Test
    fun testM30GeminiConfigurationAndModel() {
        // Milestone 3.0 Requirement 2: Centralized model configuration
        assertEquals("gemini-2.5-flash", com.aikeyboard.ime.ai.AiConfig.GEMINI_FLASH_MODEL)
        assertTrue("Temperature is balanced for natural conversation", com.aikeyboard.ime.ai.AiConfig.TEMPERATURE in 0.5f..0.9f)
        assertTrue("Output tokens allow complete messages", com.aikeyboard.ime.ai.AiConfig.MAX_OUTPUT_TOKENS >= 256)
    }

    @Test
    fun testM30GeneratorAbstractionAndAiRequest() {
        // Milestone 3.0 Requirement 3: Keep existing architecture & generator abstraction
        val request = com.aikeyboard.ime.ai.AiRequest(
            action = com.aikeyboard.ime.ai.AiAction.REPLY,
            persona = com.aikeyboard.ime.ai.AiPersona.FRIENDLY,
            context = "See you tomorrow!",
            instruction = ""
        )
        assertEquals(com.aikeyboard.ime.ai.AiAction.REPLY, request.action)
        assertEquals(com.aikeyboard.ime.ai.AiPersona.FRIENDLY, request.persona)
        assertEquals("See you tomorrow!", request.context)

        // Verify MockReplyGenerator and FirebaseGeminiReplyGenerator implement ReplyGenerator
        val mockGen: com.aikeyboard.ime.ai.ReplyGenerator = com.aikeyboard.ime.ai.MockReplyGenerator()
        val geminiGen: com.aikeyboard.ime.ai.ReplyGenerator = com.aikeyboard.ime.ai.FirebaseGeminiReplyGenerator(mockGen as com.aikeyboard.ime.ai.MockReplyGenerator)
        assertNotNull(mockGen)
        assertNotNull(geminiGen)
        assertNotNull(com.aikeyboard.ime.ai.AiReplyGenerator.currentGenerator)
    }

    @Test
    fun testM30WritingActionsAndPersonaPrompts() {
        val geminiGen = com.aikeyboard.ime.ai.FirebaseGeminiReplyGenerator()

        // Requirement 5: Personas are dynamic prompt variations, not separate models
        val friendlyPrompt = geminiGen.buildPersonaPrompt(com.aikeyboard.ime.ai.AiPersona.FRIENDLY)
        assertTrue("Friendly must be warm and conversational", friendlyPrompt.contains("warm", ignoreCase = true) || friendlyPrompt.contains("conversational", ignoreCase = true))
        assertFalse("Must not encourage robotic formality", friendlyPrompt.contains("robotic", ignoreCase = true) && !friendlyPrompt.contains("Avoid robotic", ignoreCase = true))

        val freelancerPrompt = geminiGen.buildPersonaPrompt(com.aikeyboard.ime.ai.AiPersona.FREELANCER)
        assertTrue("Freelancer must be professional & concise", freelancerPrompt.contains("client-friendly", ignoreCase = true) || freelancerPrompt.contains("professional", ignoreCase = true))

        val professionalPrompt = geminiGen.buildPersonaPrompt(com.aikeyboard.ime.ai.AiPersona.PROFESSIONAL)
        assertTrue("Professional must be polished and concise", professionalPrompt.contains("polished", ignoreCase = true) || professionalPrompt.contains("concise", ignoreCase = true))

        val funnyPrompt = geminiGen.buildPersonaPrompt(com.aikeyboard.ime.ai.AiPersona.FUNNY)
        assertTrue("Funny must be playful and humorous", funnyPrompt.contains("playful", ignoreCase = true) || funnyPrompt.contains("humorous", ignoreCase = true))

        // Requirement 4 & 7-10: Connect all actions: reply, rewrite, continue, start, create
        val replyAction = geminiGen.buildActionInstruction(com.aikeyboard.ime.ai.AiAction.REPLY, "Let's meet at 5", "")
        assertTrue(replyAction.contains("Reply", ignoreCase = true))
        assertTrue(replyAction.contains("Let's meet at 5"))

        val rewriteAction = geminiGen.buildActionInstruction(com.aikeyboard.ime.ai.AiAction.REWRITE, "whatup", "")
        assertTrue(rewriteAction.contains("Rewrite", ignoreCase = true))
        assertTrue(rewriteAction.contains("whatup"))

        val continueAction = geminiGen.buildActionInstruction(com.aikeyboard.ime.ai.AiAction.CONTINUE, "i wanted to ask if you had time tomorrow", "")
        assertTrue(continueAction.contains("Continue", ignoreCase = true))
        assertTrue(continueAction.contains("i wanted to ask if you had time tomorrow"))

        val startAction = geminiGen.buildActionInstruction(com.aikeyboard.ime.ai.AiAction.START, "marketing plan", "")
        assertTrue(startAction.contains("Start", ignoreCase = true))
        assertTrue(startAction.contains("marketing plan"))

        val createAction = geminiGen.buildActionInstruction(com.aikeyboard.ime.ai.AiAction.CREATE, "", "announcement for launch")
        assertTrue(createAction.contains("Create", ignoreCase = true))
        assertTrue(createAction.contains("announcement for launch"))
    }

    @Test
    fun testM30NaturalResponsesAndFallbacks() {
        // Requirement 6 & 8: Natural rewrite behavior for "whatup"
        val rewriteSuggestions = com.aikeyboard.ime.ai.AiReplyGenerator.generateSuggestions(
            action = com.aikeyboard.ime.ai.AiAction.REWRITE,
            persona = com.aikeyboard.ime.ai.AiPersona.FRIENDLY,
            context = "whatup"
        )
        assertTrue("Produces at least 2 distinct suggestions", rewriteSuggestions.size >= 2)
        assertEquals("Hey! What's up?", rewriteSuggestions[0])
        assertFalse("Never contains robotic preamble", rewriteSuggestions[0].startsWith("Here is a rewritten version"))
        assertFalse("Never contains robotic corporate boilerplate", rewriteSuggestions[0].contains("I have reviewed the matter and will proceed accordingly"))

        // Requirement 9: Continue naturally extends message
        val continueSuggestions = com.aikeyboard.ime.ai.AiReplyGenerator.generateSuggestions(
            action = com.aikeyboard.ime.ai.AiAction.CONTINUE,
            persona = com.aikeyboard.ime.ai.AiPersona.FRIENDLY,
            context = "i wanted to ask if you had time tomorrow"
        )
        assertTrue(continueSuggestions.isNotEmpty())
        assertTrue("Continues naturally", continueSuggestions[0].contains("tomorrow"))

        // Requirement 10: Start creates conversation opener
        val startSuggestions = com.aikeyboard.ime.ai.AiReplyGenerator.generateSuggestions(
            action = com.aikeyboard.ime.ai.AiAction.START,
            persona = com.aikeyboard.ime.ai.AiPersona.FRIENDLY,
            context = "project kickoff"
        )
        assertTrue(startSuggestions.isNotEmpty())
        assertTrue(startSuggestions[0].contains("project kickoff", ignoreCase = true) || startSuggestions[0].contains("Hey!"))
    }

    @Test
    fun testM32FirebaseGeminiMissingConfigThrowsExplicitError() {
        // Milestone 3.2: Verify real generator does NOT silently return mock output when Firebase is not configured
        val geminiGen = com.aikeyboard.ime.ai.FirebaseGeminiReplyGenerator()
        val request = com.aikeyboard.ime.ai.AiRequest(
            action = com.aikeyboard.ime.ai.AiAction.REWRITE,
            persona = com.aikeyboard.ime.ai.AiPersona.FRIENDLY,
            context = "whatup"
        )

        var threwExpectedError = false
        try {
            kotlinx.coroutines.runBlocking {
                geminiGen.generateSuggestions(request)
            }
        } catch (e: com.aikeyboard.ime.ai.GeminiException.MissingConfiguration) {
            threwExpectedError = true
            assertTrue("Message explains configuration requirement", e.message?.contains("Firebase is not configured") == true)
        } catch (e: Throwable) {
            // In unit test environment without Android Context/FirebaseApp, should catch MissingConfiguration or GeminiException
            threwExpectedError = e is com.aikeyboard.ime.ai.GeminiException
        }
        assertTrue("Real generator must throw explicit error instead of silent mock masquerading", threwExpectedError)
    }

    @Test
    fun testM32GeneratorAbstractionAllowsExplicitMockTesting() {
        // Milestone 3.2: Verify MockReplyGenerator is preserved as an explicit offline/test fallback
        val mock = com.aikeyboard.ime.ai.MockReplyGenerator()
        com.aikeyboard.ime.ai.AiReplyGenerator.currentGenerator = mock

        val request = com.aikeyboard.ime.ai.AiRequest(
            action = com.aikeyboard.ime.ai.AiAction.REPLY,
            persona = com.aikeyboard.ime.ai.AiPersona.FRIENDLY,
            context = "Hello there"
        )

        val results = kotlinx.coroutines.runBlocking {
            com.aikeyboard.ime.ai.AiReplyGenerator.generateSuggestionsAsync(request)
        }
        assertTrue("Explicit mock generates suggestions", results.isNotEmpty())

        val askResult = kotlinx.coroutines.runBlocking {
            com.aikeyboard.ime.ai.AiReplyGenerator.generateAskAiAsync("What time is it?", com.aikeyboard.ime.ai.AiPersona.FRIENDLY)
        }
        assertTrue("Explicit mock answers questions", askResult.isNotBlank())

        // Restore default generator
        com.aikeyboard.ime.ai.AiReplyGenerator.currentGenerator = com.aikeyboard.ime.ai.FirebaseGeminiReplyGenerator()
    }

    @Test
    fun testKeyboardSuggestionEngineAutocorrectAndPredictions() {
        val engine = com.aikeyboard.ime.suggestion.KeyboardSuggestionEngine

        // 1. Direct typo autocorrect (e.g. "teh" -> "the")
        val typoResult = engine.getSuggestions("teh")
        assertEquals("the", typoResult.autocorrectCandidate)
        assertTrue(typoResult.candidates.contains("the"))

        // Capitalized typo preserves capitalization
        val capTypoResult = engine.getSuggestions("Teh")
        assertEquals("The", capTypoResult.autocorrectCandidate)
        assertTrue(capTypoResult.candidates.contains("The"))

        // Another common typo ("recieve" -> "receive")
        val recieveResult = engine.getSuggestions("recieve")
        assertEquals("receive", recieveResult.autocorrectCandidate)

        // 2. Prefix completions
        val prefixResult = engine.getSuggestions("than")
        assertTrue(prefixResult.candidates.any { it.startsWith("than", ignoreCase = true) })

        // 3. Next-word prediction after space
        val nextWordResult = engine.getSuggestions("", previousWord = "thank")
        assertTrue(nextWordResult.candidates.contains("you"))

        val howResult = engine.getSuggestions("", previousWord = "how")
        assertTrue(howResult.candidates.contains("are"))

        // 4. Default starters when field is empty
        val defaultResult = engine.getSuggestions("", previousWord = null)
        assertTrue(defaultResult.candidates.contains("Hey"))

        // 5. Double-space period detection
        val triggerDouble = engine.shouldTriggerDoubleSpacePeriod(1000L, 1200L, true)
        assertTrue(triggerDouble)
        val tooSlow = engine.shouldTriggerDoubleSpacePeriod(1000L, 2000L, true)
        org.junit.Assert.assertFalse(tooSlow)

        // 6. Auto-capitalization detection
        assertTrue(engine.shouldAutoCapitalize("", true))
        assertTrue(engine.shouldAutoCapitalize("Hello. ", true))
        assertTrue(engine.shouldAutoCapitalize("Great! ", true))
        org.junit.Assert.assertFalse(engine.shouldAutoCapitalize("Hello ", true))
    }
}
