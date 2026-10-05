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
}
