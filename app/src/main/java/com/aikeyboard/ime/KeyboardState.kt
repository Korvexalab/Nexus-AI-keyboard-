package com.aikeyboard.ime

/**
 * Represents the current active keyboard layout mode.
 */
enum class KeyboardMode {
    ALPHA,
    SYMBOLS,
    ALT_SYMBOLS
}

/**
 * Represents the shift key state for alpha typing.
 */
enum class ShiftState {
    OFF,        // lowercase
    SHIFTED,    // one-shot uppercase
    CAPS_LOCK   // persistent uppercase
}

/**
 * Contract between the Compose UI and the InputMethodService.
 * Maps UI user interactions directly to Android InputConnection operations
 * and manages toolbar feature invocations.
 */
interface KeyboardActionListener {
    fun onTextInput(text: String)
    fun onBackspace()
    fun onSpace()
    fun onPeriod()
    fun onEnter()
    fun onShiftClicked()
    fun onShiftDoubleClicked()
    fun onSwitchMode(targetMode: KeyboardMode)
    fun onEmojiClicked()

    // Milestone 1B: Toolbar Actions
    fun onAiClicked()
    fun onGifClicked()
    fun onClipboardClicked()
    fun onThemeClicked()
    fun onSettingsClicked()
}
