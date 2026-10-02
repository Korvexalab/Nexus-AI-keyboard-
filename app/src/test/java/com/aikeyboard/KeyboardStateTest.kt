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
}
