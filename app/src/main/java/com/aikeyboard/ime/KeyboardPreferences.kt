package com.aikeyboard.ime

import android.content.Context
import android.content.SharedPreferences
import com.aikeyboard.ime.ui.theme.KeyboardHeightOption
import com.aikeyboard.ime.ui.theme.KeyboardThemeId

/**
 * Local-only preferences storage for AI Keyboard settings.
 * Strictly operates offline on-device with SharedPreferences.
 */
class KeyboardPreferences(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("ai_keyboard_local_prefs", Context.MODE_PRIVATE)

    var themeId: KeyboardThemeId
        get() = try {
            val name = prefs.getString(KEY_THEME, KeyboardThemeId.MIDNIGHT.name)
            KeyboardThemeId.valueOf(name ?: KeyboardThemeId.MIDNIGHT.name)
        } catch (e: Exception) {
            KeyboardThemeId.MIDNIGHT
        }
        set(value) = prefs.edit().putString(KEY_THEME, value.name).apply()

    var hapticEnabled: Boolean
        get() = prefs.getBoolean(KEY_HAPTIC, true)
        set(value) = prefs.edit().putBoolean(KEY_HAPTIC, value).apply()

    var keyboardHeight: KeyboardHeightOption
        get() = try {
            val name = prefs.getString(KEY_HEIGHT, KeyboardHeightOption.NORMAL.name)
            KeyboardHeightOption.valueOf(name ?: KeyboardHeightOption.NORMAL.name)
        } catch (e: Exception) {
            KeyboardHeightOption.NORMAL
        }
        set(value) = prefs.edit().putString(KEY_HEIGHT, value.name).apply()

    var keyAnimationEnabled: Boolean
        get() = prefs.getBoolean(KEY_ANIMATION, true)
        set(value) = prefs.edit().putBoolean(KEY_ANIMATION, value).apply()

    var autocorrectEnabled: Boolean
        get() = prefs.getBoolean(KEY_AUTOCORRECT, true)
        set(value) = prefs.edit().putBoolean(KEY_AUTOCORRECT, value).apply()

    var wordSuggestionsEnabled: Boolean
        get() = prefs.getBoolean(KEY_WORD_SUGGESTIONS, true)
        set(value) = prefs.edit().putBoolean(KEY_WORD_SUGGESTIONS, value).apply()

    var nextWordPredictionEnabled: Boolean
        get() = prefs.getBoolean(KEY_NEXT_WORD_PREDICTION, true)
        set(value) = prefs.edit().putBoolean(KEY_NEXT_WORD_PREDICTION, value).apply()

    var doubleSpacePeriodEnabled: Boolean
        get() = prefs.getBoolean(KEY_DOUBLE_SPACE_PERIOD, true)
        set(value) = prefs.edit().putBoolean(KEY_DOUBLE_SPACE_PERIOD, value).apply()

    var autoCapitalizationEnabled: Boolean
        get() = prefs.getBoolean(KEY_AUTO_CAPITALIZATION, true)
        set(value) = prefs.edit().putBoolean(KEY_AUTO_CAPITALIZATION, value).apply()

    fun getClipboardHistory(): List<String> {
        val raw = prefs.getString(KEY_CLIPBOARD_HISTORY, null) ?: return emptyList()
        return try {
            val jsonArray = org.json.JSONArray(raw)
            val list = mutableListOf<String>()
            for (i in 0 until jsonArray.length()) {
                list.add(jsonArray.getString(i))
            }
            list
        } catch (e: Exception) {
            emptyList()
        }
    }

    fun addClipboardItem(text: String) {
        val trimmed = text.trim()
        if (trimmed.isEmpty()) return
        val current = getClipboardHistory().toMutableList()
        // Avoid storing duplicate consecutive items
        if (current.isNotEmpty() && current.first() == trimmed) {
            return
        }
        current.remove(trimmed)
        current.add(0, trimmed)
        val maxItems = current.take(10)
        val jsonArray = org.json.JSONArray(maxItems)
        prefs.edit().putString(KEY_CLIPBOARD_HISTORY, jsonArray.toString()).apply()
    }

    fun clearClipboardHistory() {
        prefs.edit().remove(KEY_CLIPBOARD_HISTORY).apply()
    }

    companion object {
        private const val KEY_THEME = "pref_theme"
        private const val KEY_HAPTIC = "pref_haptic"
        private const val KEY_HEIGHT = "pref_height"
        private const val KEY_ANIMATION = "pref_key_animation"
        private const val KEY_CLIPBOARD_HISTORY = "pref_clipboard_history"
        private const val KEY_AUTOCORRECT = "pref_autocorrect"
        private const val KEY_WORD_SUGGESTIONS = "pref_word_suggestions"
        private const val KEY_NEXT_WORD_PREDICTION = "pref_next_word_prediction"
        private const val KEY_DOUBLE_SPACE_PERIOD = "pref_double_space_period"
        private const val KEY_AUTO_CAPITALIZATION = "pref_auto_capitalization"
    }
}
