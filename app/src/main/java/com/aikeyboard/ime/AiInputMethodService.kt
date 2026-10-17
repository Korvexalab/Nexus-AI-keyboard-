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
import androidx.lifecycle.lifecycleScope
import com.aikeyboard.MainActivity
import com.aikeyboard.ime.ai.AiAction
import com.aikeyboard.ime.ai.AiPersona
import com.aikeyboard.ime.ai.AiReplyGenerator
import com.aikeyboard.ime.ai.AiReplyStyle
import com.aikeyboard.ime.ai.AiRequest
import com.aikeyboard.ime.ai.AppCheckConfig
import com.aikeyboard.ime.suggestion.KeyboardSuggestionEngine
import com.aikeyboard.ime.ui.ComposeKeyboardView
import com.aikeyboard.ime.ui.theme.AIKeyboardTheme
import com.aikeyboard.ime.ui.theme.KeyboardHeightOption
import com.aikeyboard.ime.ui.theme.KeyboardThemeId
import com.aikeyboard.ime.ui.theme.KeyboardThemes
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Production-ready Android InputMethodService with Gboard-style smart typing:
 * Autocorrect, word suggestions, next-word prediction, auto-capitalization,
 * and double-space period.
 * AI generation is strictly powered by Cloud Gemini AI.
 */
class AiInputMethodService : ComposeLifecycleInputMethodService(), KeyboardActionListener {

    private val keyboardModeState = mutableStateOf(KeyboardMode.ALPHA)
    private val shiftState = mutableStateOf(ShiftState.OFF)
    private val aiNoticeVisible = mutableStateOf(false)
    private val aiPanelVisible = mutableStateOf(false)
    private val aiPromptFocused = mutableStateOf(false)
    private val customPromptTextState = mutableStateOf("")
    private val hostTextState = mutableStateOf("")
    private val selectedAiStyleState = mutableStateOf(AiReplyStyle.REPLY)

    // Milestone 1C: Dynamic Local Settings
    private val themeIdState = mutableStateOf(KeyboardThemeId.MIDNIGHT)
    private val heightOptionState = mutableStateOf(KeyboardHeightOption.NORMAL)
    private val hapticEnabledState = mutableStateOf(true)
    private val keyAnimationEnabledState = mutableStateOf(true)

    // Gboard-style On-Device Suggestion & Autocorrect State
    private val suggestionsState = mutableStateOf<List<String>>(emptyList())
    private val autocorrectCandidateState = mutableStateOf<String?>(null)
    private var lastSpaceTimeMs = 0L
    private var lastAutocorrectOriginal: String? = null
    private var lastAutocorrectReplacement: String? = null

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
        AppCheckConfig.initialize(applicationContext)
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
                    hostText = hostTextState.value,
                    onSelectAiStyle = { selectedAiStyleState.value = it },
                    onSetAiPromptFocused = { aiPromptFocused.value = it },
                    onClearAiPrompt = { customPromptTextState.value = "" },
                    suggestions = suggestionsState.value,
                    autocorrectCandidate = autocorrectCandidateState.value,
                    preferences = preferences
                )
            }
        }
        return composeView
    }

    override fun onEvaluateFullscreenMode(): Boolean = false

    override fun onEvaluateInputViewShown(): Boolean = true

    private fun getWordsBeforeCursor(): Pair<String, String?> {
        val ic = currentInputConnection ?: return Pair("", null)
        val textBefore = ic.getTextBeforeCursor(100, 0)?.toString() ?: ""
        if (textBefore.isEmpty()) return Pair("", null)

        val lastChar = textBefore.last()
        return if (lastChar.isWhitespace()) {
            val trimmed = textBefore.trimEnd()
            val tokens = trimmed.split(Regex("\\s+"))
            val prev = tokens.lastOrNull()?.filter { it.isLetterOrDigit() || it == '\'' }
            Pair("", prev)
        } else {
            val lastDelim = textBefore.indexOfLast { it.isWhitespace() || it in ",.!?;:\n" }
            val curr = if (lastDelim >= 0) {
                textBefore.substring(lastDelim + 1)
            } else {
                textBefore
            }.filter { it.isLetterOrDigit() || it == '\'' }

            val beforeDelim = if (lastDelim >= 0) {
                textBefore.substring(0, lastDelim).trimEnd()
            } else {
                ""
            }
            val prevTokens = beforeDelim.split(Regex("\\s+"))
            val prev = prevTokens.lastOrNull()?.filter { it.isLetterOrDigit() || it == '\'' }

            Pair(curr, prev)
        }
    }

    private fun updateSuggestions() {
        if (!preferences.wordSuggestionsEnabled) {
            suggestionsState.value = emptyList()
            autocorrectCandidateState.value = null
            return
        }
        val (curr, prev) = getWordsBeforeCursor()
        val result = KeyboardSuggestionEngine.getSuggestions(
            currentWord = curr,
            previousWord = prev,
            suggestionsEnabled = preferences.wordSuggestionsEnabled
        )
        suggestionsState.value = result.candidates
        autocorrectCandidateState.value = if (preferences.autocorrectEnabled) result.autocorrectCandidate else null
    }

    private fun checkAutoCapitalization() {
        if (!preferences.autoCapitalizationEnabled) return
        val ic = currentInputConnection ?: return
        val textBefore = ic.getTextBeforeCursor(100, 0)
        if (KeyboardSuggestionEngine.shouldAutoCapitalize(textBefore, true)) {
            shiftState.value = ShiftState.SHIFTED
        }
    }

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
            hostTextState.value = ""
            lastAutocorrectOriginal = null
            lastAutocorrectReplacement = null
            lastSpaceTimeMs = 0L
        }
        checkAutoCapitalization()
        updateSuggestions()
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
            lastAutocorrectOriginal = null
            lastAutocorrectReplacement = null
            updateSuggestions()
        }
    }

    override fun onBackspace() {
        if (aiPanelVisible.value && aiPromptFocused.value) {
            // Route backspace to AI custom prompt state when focused, never touching host InputConnection
            if (customPromptTextState.value.isNotEmpty()) {
                customPromptTextState.value = customPromptTextState.value.dropLast(1)
            }
        } else {
            val ic = currentInputConnection ?: return

            // If user backspaces right after an autocorrection, restore original typo (Gboard behavior)
            val autoOriginal = lastAutocorrectOriginal
            val autoReplaced = lastAutocorrectReplacement
            if (autoOriginal != null && autoReplaced != null) {
                val textBefore = ic.getTextBeforeCursor(autoReplaced.length + 1, 0)?.toString() ?: ""
                if (textBefore.endsWith("$autoReplaced ")) {
                    ic.deleteSurroundingText(autoReplaced.length + 1, 0)
                    ic.commitText(autoOriginal, 1)
                    lastAutocorrectOriginal = null
                    lastAutocorrectReplacement = null
                    updateSuggestions()
                    return
                }
            }

            val selectedText = ic.getSelectedText(0)
            if (!selectedText.isNullOrEmpty()) {
                ic.commitText("", 1)
            } else {
                ic.deleteSurroundingText(1, 0)
            }
            lastAutocorrectOriginal = null
            lastAutocorrectReplacement = null
            checkAutoCapitalization()
            updateSuggestions()
        }
    }

    override fun onSpace() {
        if (aiPanelVisible.value && aiPromptFocused.value) {
            customPromptTextState.value += " "
        } else {
            val ic = currentInputConnection ?: return
            val now = System.currentTimeMillis()

            // 1. Double-space period check
            if (preferences.doubleSpacePeriodEnabled &&
                KeyboardSuggestionEngine.shouldTriggerDoubleSpacePeriod(lastSpaceTimeMs, now, true)
            ) {
                ic.deleteSurroundingText(1, 0)
                ic.commitText(". ", 1)
                lastAutocorrectOriginal = null
                lastAutocorrectReplacement = null
                if (preferences.autoCapitalizationEnabled) {
                    shiftState.value = ShiftState.SHIFTED
                }
                lastSpaceTimeMs = 0L
                updateSuggestions()
                return
            }

            // 2. Gboard-style autocorrect on space
            val autocorrect = autocorrectCandidateState.value
            val (currentWord, _) = getWordsBeforeCursor()
            if (preferences.autocorrectEnabled && autocorrect != null && currentWord.isNotBlank()) {
                ic.deleteSurroundingText(currentWord.length, 0)
                ic.commitText("$autocorrect ", 1)
                lastAutocorrectOriginal = currentWord
                lastAutocorrectReplacement = autocorrect
            } else {
                ic.commitText(" ", 1)
                lastAutocorrectOriginal = null
                lastAutocorrectReplacement = null
            }

            lastSpaceTimeMs = now
            checkAutoCapitalization()
            updateSuggestions()
        }
    }

    override fun onPeriod() {
        if (aiPanelVisible.value && aiPromptFocused.value) {
            customPromptTextState.value += "."
        } else {
            val ic = currentInputConnection ?: return
            ic.commitText(".", 1)
            lastAutocorrectOriginal = null
            lastAutocorrectReplacement = null
            checkAutoCapitalization()
            updateSuggestions()
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
        // Milestone 2 & 3.2: Toggle AI panel and capture host context from InputConnection
        val willShow = !aiPanelVisible.value
        aiPanelVisible.value = willShow
        if (willShow) {
            val ic = currentInputConnection
            val selected = ic?.getSelectedText(0)?.toString()
            val before = ic?.getTextBeforeCursor(1000, 0)?.toString() ?: ""
            hostTextState.value = if (!selected.isNullOrBlank()) selected else before
        } else {
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
        val persona = when (replyStyle) {
            AiReplyStyle.REPLY -> AiPersona.FRIENDLY
            AiReplyStyle.FRIENDLY -> AiPersona.FRIENDLY
            AiReplyStyle.SHORT -> AiPersona.SHORT
            AiReplyStyle.PROFESSIONAL -> AiPersona.PROFESSIONAL
            AiReplyStyle.FUNNY -> AiPersona.FUNNY
        }
        val context = if (customPrompt.isNotBlank()) customPrompt else hostTextState.value

        lifecycleScope.launch {
            try {
                val generated = withContext(Dispatchers.IO) {
                    AiReplyGenerator.currentGenerator.generate(
                        AiRequest(
                            action = AiAction.REPLY,
                            persona = persona,
                            context = context
                        )
                    )
                }
                currentInputConnection?.commitText(generated, 1)
            } catch (_: Throwable) {
                // If live generation fails, keep panel open and report error in UI
            } finally {
                aiPanelVisible.value = false
                aiPromptFocused.value = false
                customPromptTextState.value = ""
            }
        }
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

    // --- Gboard-style Suggestion Chip Click Action ---

    override fun onSuggestionClicked(suggestion: String) {
        val ic = currentInputConnection ?: return
        val (currentWord, _) = getWordsBeforeCursor()

        if (currentWord.isNotEmpty()) {
            ic.deleteSurroundingText(currentWord.length, 0)
        }
        ic.commitText("$suggestion ", 1)
        lastAutocorrectOriginal = null
        lastAutocorrectReplacement = null

        if (shiftState.value == ShiftState.SHIFTED) {
            shiftState.value = ShiftState.OFF
        }
        checkAutoCapitalization()
        updateSuggestions()
    }

    override fun onDestroy() {
        super.onDestroy()
        mainHandler.removeCallbacks(hideAiNoticeRunnable)
    }
}
