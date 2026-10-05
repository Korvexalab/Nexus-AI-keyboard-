package com.aikeyboard.ime

import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.view.KeyEvent
import android.view.View
import android.view.inputmethod.EditorInfo
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy
import com.aikeyboard.MainActivity
import com.aikeyboard.ime.ai.AiReplyGenerator
import com.aikeyboard.ime.ai.AiReplyStyle
import com.aikeyboard.ime.ui.ComposeKeyboardView
import com.aikeyboard.ime.ui.theme.AIKeyboardTheme
import com.aikeyboard.ime.ui.theme.KeyboardHeightOption
import com.aikeyboard.ime.ui.theme.KeyboardThemeId
import com.aikeyboard.ime.ui.theme.KeyboardThemes

/**
 * Production-ready Android InputMethodService with Milestone 1C:
 * Themes (Midnight / Light), local Settings, and haptic feedback controls.
 * Communicates strictly via InputConnection.
 */
class AiInputMethodService : ComposeLifecycleInputMethodService(), KeyboardActionListener {

    private val keyboardModeState = mutableStateOf(KeyboardMode.ALPHA)
    private val shiftState = mutableStateOf(ShiftState.OFF)
    private val aiNoticeVisible = mutableStateOf(false)
    private val aiPanelVisible = mutableStateOf(false)
    private val aiPromptFocused = mutableStateOf(false)
    private val customPromptTextState = mutableStateOf("")
    private val selectedAiStyleState = mutableStateOf(AiReplyStyle.REPLY)

    // Milestone 1C: Dynamic Local Settings
    private val themeIdState = mutableStateOf(KeyboardThemeId.MIDNIGHT)
    private val heightOptionState = mutableStateOf(KeyboardHeightOption.NORMAL)
    private val hapticEnabledState = mutableStateOf(true)
    private val keyAnimationEnabledState = mutableStateOf(true)

    private var lastShiftClickTime = 0L
    private val mainHandler = Handler(Looper.getMainLooper())
    private val hideAiNoticeRunnable = Runnable {
        aiNoticeVisible.value = false
    }

    private lateinit var preferences: KeyboardPreferences

    override fun onCreate() {
        super.onCreate()
        preferences = KeyboardPreferences(this)
        loadPreferences()
    }

    private fun loadPreferences() {
        themeIdState.value = preferences.themeId
        heightOptionState.value = preferences.keyboardHeight
        hapticEnabledState.value = preferences.hapticEnabled
        keyAnimationEnabledState.value = preferences.keyAnimationEnabled
    }

    override fun onCreateInputView(): View {
        val composeView = ComposeView(this).apply {
            setViewCompositionStrategy(
                ViewCompositionStrategy.DisposeOnLifecycleDestroyed(lifecycle)
            )
        }
        setupComposeView(composeView)

        composeView.setContent {
            val currentTokens = KeyboardThemes.get(themeIdState.value)

            AIKeyboardTheme(darkTheme = currentTokens.isDark) {
                ComposeKeyboardView(
                    keyboardMode = keyboardModeState.value,
                    shiftState = shiftState.value,
                    actionListener = this,
                    tokens = currentTokens,
                    keyHeightDp = heightOptionState.value.keyHeightDp,
                    keyAnimationEnabled = keyAnimationEnabledState.value,
                    hapticEnabled = hapticEnabledState.value,
                    aiNoticeVisible = aiNoticeVisible.value,
                    aiPanelVisible = aiPanelVisible.value,
                    aiPromptFocused = aiPromptFocused.value,
                    customPrompt = customPromptTextState.value,
                    selectedAiStyle = selectedAiStyleState.value,
                    onSelectAiStyle = { selectedAiStyleState.value = it },
                    onSetAiPromptFocused = { aiPromptFocused.value = it },
                    onClearAiPrompt = { customPromptTextState.value = "" },
                    preferences = preferences
                )
            }
        }
        return composeView
    }

    override fun onEvaluateFullscreenMode(): Boolean = false

    override fun onEvaluateInputViewShown(): Boolean = true

    override fun onStartInputView(info: EditorInfo?, restarting: Boolean) {
        super.onStartInputView(info, restarting)
        // Refresh local settings on input start
        loadPreferences()

        if (!restarting) {
            keyboardModeState.value = KeyboardMode.ALPHA
            shiftState.value = ShiftState.OFF
            aiNoticeVisible.value = false
            aiPanelVisible.value = false
            aiPromptFocused.value = false
            customPromptTextState.value = ""
        }
    }

    override fun onFinishInputView(finishingInput: Boolean) {
        super.onFinishInputView(finishingInput)
        aiPanelVisible.value = false
        aiPromptFocused.value = false
    }

    // --- KeyboardActionListener Implementation with Explicit Input Routing ---

    override fun onTextInput(text: String) {
        if (aiPanelVisible.value && aiPromptFocused.value) {
            val toAdd = when (shiftState.value) {
                ShiftState.SHIFTED, ShiftState.CAPS_LOCK -> text.uppercase()
                ShiftState.OFF -> text.lowercase()
            }
            customPromptTextState.value += toAdd
            if (shiftState.value == ShiftState.SHIFTED) {
                shiftState.value = ShiftState.OFF
            }
        } else {
            val ic = currentInputConnection ?: return
            val textToCommit = when (shiftState.value) {
                ShiftState.SHIFTED, ShiftState.CAPS_LOCK -> text.uppercase()
                ShiftState.OFF -> text.lowercase()
            }
            ic.commitText(textToCommit, 1)

            if (shiftState.value == ShiftState.SHIFTED) {
                shiftState.value = ShiftState.OFF
            }
        }
    }

    override fun onBackspace() {
        if (aiPanelVisible.value && aiPromptFocused.value) {
            // Milestone 2 Fix: Route backspace to AI custom prompt state when focused, never touching host InputConnection
            if (customPromptTextState.value.isNotEmpty()) {
                customPromptTextState.value = customPromptTextState.value.dropLast(1)
            }
        } else {
            val ic = currentInputConnection ?: return
            val selectedText = ic.getSelectedText(0)
            if (!selectedText.isNullOrEmpty()) {
                ic.commitText("", 1)
            } else {
                ic.deleteSurroundingText(1, 0)
            }
        }
    }

    override fun onSpace() {
        if (aiPanelVisible.value && aiPromptFocused.value) {
            customPromptTextState.value += " "
        } else {
            currentInputConnection?.commitText(" ", 1)
        }
    }

    override fun onPeriod() {
        if (aiPanelVisible.value && aiPromptFocused.value) {
            customPromptTextState.value += "."
        } else {
            currentInputConnection?.commitText(".", 1)
        }
    }

    override fun onEnter() {
        if (aiPanelVisible.value && aiPromptFocused.value) {
            onAiGenerate(selectedAiStyleState.value.name, customPromptTextState.value)
            aiPromptFocused.value = false
            customPromptTextState.value = ""
        } else {
            val ic = currentInputConnection ?: return
            val info = currentInputEditorInfo

            val action = if (info != null) {
                info.imeOptions and (EditorInfo.IME_MASK_ACTION or EditorInfo.IME_FLAG_NO_ENTER_ACTION)
            } else {
                EditorInfo.IME_ACTION_NONE
            }

            when (action) {
                EditorInfo.IME_ACTION_GO,
                EditorInfo.IME_ACTION_SEARCH,
                EditorInfo.IME_ACTION_SEND,
                EditorInfo.IME_ACTION_NEXT,
                EditorInfo.IME_ACTION_DONE -> {
                    ic.performEditorAction(action)
                }
                else -> {
                    ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_ENTER))
                    ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_UP, KeyEvent.KEYCODE_ENTER))
                }
            }
        }
    }

    override fun onShiftClicked() {
        val now = System.currentTimeMillis()
        if (now - lastShiftClickTime < 300) {
            shiftState.value = if (shiftState.value == ShiftState.CAPS_LOCK) {
                ShiftState.OFF
            } else {
                ShiftState.CAPS_LOCK
            }
        } else {
            shiftState.value = when (shiftState.value) {
                ShiftState.OFF -> ShiftState.SHIFTED
                ShiftState.SHIFTED -> ShiftState.OFF
                ShiftState.CAPS_LOCK -> ShiftState.OFF
            }
        }
        lastShiftClickTime = now
    }

    override fun onShiftDoubleClicked() {
        shiftState.value = ShiftState.CAPS_LOCK
    }

    override fun onSwitchMode(targetMode: KeyboardMode) {
        keyboardModeState.value = targetMode
    }

    override fun onEmojiClicked() {
        keyboardModeState.value = if (keyboardModeState.value == KeyboardMode.EMOJI) {
            KeyboardMode.ALPHA
        } else {
            KeyboardMode.EMOJI
        }
    }

    // --- Toolbar & AI Reply Actions ---

    override fun onAiClicked() {
        // Milestone 2: Toggle the compact AI reply panel
        aiPanelVisible.value = !aiPanelVisible.value
        if (!aiPanelVisible.value) {
            aiPromptFocused.value = false
        }
    }

    override fun onCloseAiPanel() {
        aiPanelVisible.value = false
        aiPromptFocused.value = false
    }

    override fun onSetAiPromptFocused(focused: Boolean) {
        aiPromptFocused.value = focused
    }

    override fun onClearAiPrompt() {
        customPromptTextState.value = ""
    }

    override fun onAiReplace(replacement: String) {
        val ic = currentInputConnection ?: return
        val before = ic.getTextBeforeCursor(1000, 0) ?: ""
        val after = ic.getTextAfterCursor(1000, 0) ?: ""
        ic.deleteSurroundingText(before.length, after.length)
        ic.commitText(replacement, 1)
    }

    override fun onAiGenerate(style: String, customPrompt: String) {
        val replyStyle = AiReplyStyle.fromString(style)
        val mockReply = AiReplyGenerator.generateMockReply(replyStyle, customPrompt)

        val ic = currentInputConnection ?: return
        val selectedText = ic.getSelectedText(0)
        if (!selectedText.isNullOrEmpty()) {
            ic.commitText(mockReply, 1)
        } else {
            ic.commitText(mockReply, 1)
        }

        // Close AI panel and reset focus after insertion, leaving user on normal keyboard
        aiPanelVisible.value = false
        aiPromptFocused.value = false
        customPromptTextState.value = ""
    }

    override fun onGifClicked() {
        currentInputConnection?.commitText("[GIF]", 1)
    }

    override fun onClipboardClicked() {
        // Privacy: Only query ClipboardManager when user explicitly invokes clipboard feature
        val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
        val clip = clipboard?.primaryClip
        if (clip != null && clip.itemCount > 0) {
            val text = clip.getItemAt(0).coerceToText(this).toString()
            if (text.isNotBlank()) {
                preferences.addClipboardItem(text)
            }
        }

        // Toggle or switch to Clipboard panel mode
        keyboardModeState.value = if (keyboardModeState.value == KeyboardMode.CLIPBOARD) {
            KeyboardMode.ALPHA
        } else {
            KeyboardMode.CLIPBOARD
        }
    }

    override fun onThemeClicked() {
        // Toggle between Midnight and Light
        val nextTheme = if (themeIdState.value == KeyboardThemeId.MIDNIGHT) {
            KeyboardThemeId.LIGHT
        } else {
            KeyboardThemeId.MIDNIGHT
        }
        themeIdState.value = nextTheme
        preferences.themeId = nextTheme
    }

    override fun onSettingsClicked() {
        val intent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        startActivity(intent)
    }

    override fun onDestroy() {
        super.onDestroy()
        mainHandler.removeCallbacks(hideAiNoticeRunnable)
    }
}
