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

    companion object {
        private const val KEY_THEME = "pref_theme"
        private const val KEY_HAPTIC = "pref_haptic"
        private const val KEY_HEIGHT = "pref_height"
        private const val KEY_ANIMATION = "pref_key_animation"
    }
}
