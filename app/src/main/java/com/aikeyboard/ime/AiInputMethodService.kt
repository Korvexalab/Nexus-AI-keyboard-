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
                    aiNoticeVisible = aiNoticeVisible.value
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
        }
    }

    // --- KeyboardActionListener Implementation via InputConnection ---

    override fun onTextInput(text: String) {
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

    override fun onBackspace() {
        val ic = currentInputConnection ?: return
        val selectedText = ic.getSelectedText(0)
        if (!selectedText.isNullOrEmpty()) {
            ic.commitText("", 1)
        } else {
            ic.deleteSurroundingText(1, 0)
        }
    }

    override fun onSpace() {
        currentInputConnection?.commitText(" ", 1)
    }

    override fun onPeriod() {
        currentInputConnection?.commitText(".", 1)
    }

    override fun onEnter() {
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

    // --- Toolbar Actions ---

    override fun onAiClicked() {
        mainHandler.removeCallbacks(hideAiNoticeRunnable)
        aiNoticeVisible.value = true
        mainHandler.postDelayed(hideAiNoticeRunnable, 2500)
    }

    override fun onGifClicked() {
        currentInputConnection?.commitText("[GIF]", 1)
    }

    override fun onClipboardClicked() {
        val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
        val clip = clipboard?.primaryClip
        if (clip != null && clip.itemCount > 0) {
            val text = clip.getItemAt(0).coerceToText(this).toString()
            if (text.isNotEmpty()) {
                currentInputConnection?.commitText(text, 1)
            }
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
