package com.aikeyboard.ime.ui.theme

import androidx.compose.ui.graphics.Color

/**
 * Extensible theme identifier for AI Keyboard.
 * Currently supports MIDNIGHT and LIGHT; prepared for future additions (Galaxy, Sakura, Ocean, etc.).
 */
enum class KeyboardThemeId(val displayName: String) {
    MIDNIGHT("Midnight"),
    LIGHT("Light")
}

/**
 * Configurable keyboard heights in dp.
 */
enum class KeyboardHeightOption(val displayName: String, val keyHeightDp: Int) {
    SHORT("Short", 42),
    NORMAL("Normal", 47),
    TALL("Tall", 53)
}

/**
 * Color tokens for complete keyboard rendering across themes.
 */
data class KeyboardColorTokens(
    val background: Color,
    val surface: Color,
    val borderRim: Color,
    val keySurface: Color,
    val keySurfacePressed: Color,
    val keySpecial: Color,
    val keySpecialPressed: Color,
    val keyAccent: Color,
    val keyAccentPressed: Color,
    val textPrimary: Color,
    val textSecondary: Color,
    val toolbarBackground: Color,
    val isDark: Boolean
)

object KeyboardThemes {
    // 1. Midnight Theme: Dark navy/black background, dark blue/purple keys, light text, subtle blue/purple accent
    val Midnight = KeyboardColorTokens(
        background = Color(0xFF090D16),
        surface = Color(0xFF0F172A),
        borderRim = Color(0x1FFFFFFF),
        keySurface = Color(0xFF1E283D),
        keySurfacePressed = Color(0xFF2E3D5B),
        keySpecial = Color(0xFF161F33),
        keySpecialPressed = Color(0xFF243252),
        keyAccent = Color(0xFF2563EB),
        keyAccentPressed = Color(0xFF1D4ED8),
        textPrimary = Color(0xFFF8FAFC),
        textSecondary = Color(0xFF94A3B8),
        toolbarBackground = Color(0xFF090D16),
        isDark = true
    )

    // 2. Light Theme: Light background, light keys, dark text, subtle accent
    val Light = KeyboardColorTokens(
        background = Color(0xFFF1F5F9),
        surface = Color(0xFFFFFFFF),
        borderRim = Color(0x1F000000),
        keySurface = Color(0xFFFFFFFF),
        keySurfacePressed = Color(0xFFE2E8F0),
        keySpecial = Color(0xFFE2E8F0),
        keySpecialPressed = Color(0xFFCBD5E1),
        keyAccent = Color(0xFF2563EB),
        keyAccentPressed = Color(0xFF1D4ED8),
        textPrimary = Color(0xFF0F172A),
        textSecondary = Color(0xFF64748B),
        toolbarBackground = Color(0xFFF8FAFC),
        isDark = false
    )

    fun get(id: KeyboardThemeId): KeyboardColorTokens = when (id) {
        KeyboardThemeId.MIDNIGHT -> Midnight
        KeyboardThemeId.LIGHT -> Light
    }
}
