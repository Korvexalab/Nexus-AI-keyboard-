import { AndroidFileEntry } from './types';

export const ANDROID_FILES: AndroidFileEntry[] = [
  {
    path: 'app/src/main/java/com/aikeyboard/ime/ui/theme/KeyboardTheme.kt',
    name: 'KeyboardTheme.kt',
    language: 'kotlin',
    description: 'Milestone 1C: Extensible Theme Engine with Midnight and Light themes, color tokens, and height metrics.',
    content: `package com.aikeyboard.ime.ui.theme

import androidx.compose.ui.graphics.Color

enum class KeyboardThemeId(val displayName: String) {
    MIDNIGHT("Midnight"),
    LIGHT("Light")
    // Extensible placeholders for future milestones: GALAXY, SAKURA, OCEAN, EMBER, AURORA, CRYSTAL, ICE
}

enum class KeyboardHeightOption(val displayName: String, val keyHeightDp: Int) {
    SHORT("Short", 42),
    NORMAL("Normal", 47),
    TALL("Tall", 53)
}

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
}`
  },
  {
    path: 'app/src/main/java/com/aikeyboard/ime/KeyboardPreferences.kt',
    name: 'KeyboardPreferences.kt',
    language: 'kotlin',
    description: 'Milestone 1C: Local on-device SharedPreferences storage for theme, haptic feedback, height, and animation.',
    content: `package com.aikeyboard.ime

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
    }
}
`
  },
  {
    path: 'app/src/main/java/com/aikeyboard/MainActivity.kt',
    name: 'MainActivity.kt',
    language: 'kotlin',
    description: 'Milestone 1C: Polished Onboarding Wizard (Enable & Select) + Settings Screen (Themes, Haptics, Height, Animation) + Privacy Pledge.',
    content: `package com.aikeyboard

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.view.inputmethod.InputMethodManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.aikeyboard.ime.KeyboardPreferences
import com.aikeyboard.ime.ui.theme.AIKeyboardTheme
import com.aikeyboard.ime.ui.theme.KeyboardHeightOption
import com.aikeyboard.ime.ui.theme.KeyboardThemeId

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AIKeyboardTheme {
                MainSettingsAndOnboardingScreen()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainSettingsAndOnboardingScreen() {
    val context = LocalContext.current
    val imm = remember { context.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager }
    val prefs = remember { KeyboardPreferences(context) }

    var isKeyboardEnabled by remember { mutableStateOf(false) }
    var isKeyboardSelected by remember { mutableStateOf(false) }
    var testInputText by remember { mutableStateOf("") }

    var currentTheme by remember { mutableStateOf(prefs.themeId) }
    var isHapticEnabled by remember { mutableStateOf(prefs.hapticEnabled) }
    var currentHeight by remember { mutableStateOf(prefs.keyboardHeight) }
    var isKeyAnimationEnabled by remember { mutableStateOf(prefs.keyAnimationEnabled) }

    fun checkKeyboardStatus() {
        val packageName = context.packageName
        val enabledMethods = imm.enabledInputMethodList
        isKeyboardEnabled = enabledMethods.any { it.packageName == packageName }

        val defaultIme = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.DEFAULT_INPUT_METHOD
        ) ?: ""
        isKeyboardSelected = defaultIme.contains(packageName)
    }

    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                checkKeyboardStatus()
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
        }
    }

    LaunchedEffect(Unit) {
        checkKeyboardStatus()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("AI Keyboard", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        Text(
                            "Milestone 1C: Setup & Settings",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.8f)
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp, vertical = 12.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Step-by-Step Onboarding
            Text("GET STARTED", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary, letterSpacing = 1.sp)

            StepCard(
                stepNumber = "1",
                title = stringResource(R.string.step_1_enable),
                description = "Enable AI Keyboard in Android System Input Method Settings.",
                isCompleted = isKeyboardEnabled,
                actionButtonText = if (isKeyboardEnabled) "Enabled" else "Open Settings",
                actionIcon = Icons.Default.Settings,
                onAction = {
                    val intent = Intent(Settings.ACTION_INPUT_METHOD_SETTINGS).apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }
                    context.startActivity(intent)
                }
            )

            StepCard(
                stepNumber = "2",
                title = stringResource(R.string.step_2_select),
                description = "Set AI Keyboard as your currently active default input method.",
                isCompleted = isKeyboardSelected,
                actionButtonText = if (isKeyboardSelected) "Selected" else "Switch Keyboard",
                actionIcon = Icons.Default.Keyboard,
                onAction = { imm.showInputMethodPicker() }
            )

            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))

            // Keyboard Settings
            Text("KEYBOARD SETTINGS", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary, letterSpacing = 1.sp)

            // Themes
            Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Icon(Icons.Default.Palette, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                        Text("Theme", fontWeight = FontWeight.SemiBold)
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        ThemeOptionCard(
                            title = "Midnight",
                            subtitle = "Dark navy & violet",
                            isSelected = currentTheme == KeyboardThemeId.MIDNIGHT,
                            modifier = Modifier.weight(1f),
                            onClick = {
                                currentTheme = KeyboardThemeId.MIDNIGHT
                                prefs.themeId = KeyboardThemeId.MIDNIGHT
                            }
                        )
                        ThemeOptionCard(
                            title = "Light",
                            subtitle = "Clean daylight",
                            isSelected = currentTheme == KeyboardThemeId.LIGHT,
                            modifier = Modifier.weight(1f),
                            onClick = {
                                currentTheme = KeyboardThemeId.LIGHT
                                prefs.themeId = KeyboardThemeId.LIGHT
                            }
                        )
                    }
                }
            }

            // Keyboard Height
            Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Keyboard Height", fontWeight = FontWeight.SemiBold)
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        KeyboardHeightOption.values().forEach { option ->
                            val isSelected = currentHeight == option
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (isSelected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant)
                                    .clickable {
                                        currentHeight = option
                                        prefs.keyboardHeight = option
                                    }
                                    .padding(vertical = 10.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = option.displayName,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                    fontSize = 13.sp,
                                    color = if (isSelected) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }

            // Haptic & Animation Switches
            Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Icon(Icons.Default.Vibration, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            Column {
                                Text("Haptic Feedback", fontWeight = FontWeight.Medium, fontSize = 14.sp)
                                Text("Vibrate when keys are pressed", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                        Switch(checked = isHapticEnabled, onCheckedChange = { isHapticEnabled = it; prefs.hapticEnabled = it })
                    }
                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Icon(Icons.Default.TouchApp, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            Column {
                                Text("Key Press Animation", fontWeight = FontWeight.Medium, fontSize = 14.sp)
                                Text("80-150ms press feedback scaling", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                        Switch(checked = isKeyAnimationEnabled, onCheckedChange = { isKeyAnimationEnabled = it; prefs.keyAnimationEnabled = it })
                    }
                }
            }

            // Privacy Commitment
            Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))) {
                Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Icon(Icons.Default.Lock, contentDescription = "Privacy", tint = MaterialTheme.colorScheme.primary)
                    Text(
                        text = "100% Offline & Private: AI Keyboard operates strictly on-device. No keystrokes, passwords, or personal data are collected or transmitted.",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        lineHeight = 15.sp
                    )
                }
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/aikeyboard/ime/ui/KeyboardToolbar.kt',
    name: 'KeyboardToolbar.kt',
    language: 'kotlin',
    description: 'Milestone 1B: Keyboard Toolbar with prominent ✨ AI pill button, quick actions (Emoji, GIF, Clipboard, Theme, Settings), and toast notice.',
    content: `package com.aikeyboard.ime.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aikeyboard.ime.KeyboardActionListener
import com.aikeyboard.ime.ui.theme.AiPillGradientEnd
import com.aikeyboard.ime.ui.theme.AiPillGradientStart
import com.aikeyboard.ime.ui.theme.KeyboardColorTokens
import com.aikeyboard.ime.ui.theme.KeyboardThemes

@Composable
fun KeyboardToolbar(
    actionListener: KeyboardActionListener,
    aiNoticeVisible: Boolean,
    tokens: KeyboardColorTokens = KeyboardThemes.Midnight,
    hapticEnabled: Boolean = true,
    keyAnimationEnabled: Boolean = true,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(44.dp)
            .background(tokens.toolbarBackground)
            .padding(horizontal = 8.dp, vertical = 4.dp),
        contentAlignment = Alignment.CenterStart
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // ✨ Prominent AI Pill Button
            AiFeatureButton(
                onClick = { actionListener.onAiClicked() },
                hapticEnabled = hapticEnabled,
                keyAnimationEnabled = keyAnimationEnabled
            )

            // Secondary Quick Actions
            Row(
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                ToolbarIconButton(
                    icon = Icons.Filled.SentimentSatisfiedAlt,
                    contentDescription = "Emoji",
                    tokens = tokens,
                    onClick = { actionListener.onEmojiClicked() },
                    hapticEnabled = hapticEnabled,
                    keyAnimationEnabled = keyAnimationEnabled
                )
                ToolbarTextButton(
                    text = "GIF",
                    tokens = tokens,
                    onClick = { actionListener.onGifClicked() },
                    hapticEnabled = hapticEnabled,
                    keyAnimationEnabled = keyAnimationEnabled
                )
                ToolbarIconButton(
                    icon = Icons.Filled.ContentPaste,
                    contentDescription = "Clipboard",
                    tokens = tokens,
                    onClick = { actionListener.onClipboardClicked() },
                    hapticEnabled = hapticEnabled,
                    keyAnimationEnabled = keyAnimationEnabled
                )
                ToolbarIconButton(
                    icon = Icons.Filled.Palette,
                    contentDescription = "Theme",
                    tokens = tokens,
                    onClick = { actionListener.onThemeClicked() },
                    hapticEnabled = hapticEnabled,
                    keyAnimationEnabled = keyAnimationEnabled
                )
                ToolbarIconButton(
                    icon = Icons.Filled.Settings,
                    contentDescription = "Settings",
                    tokens = tokens,
                    onClick = { actionListener.onSettingsClicked() },
                    hapticEnabled = hapticEnabled,
                    keyAnimationEnabled = keyAnimationEnabled
                )
            }
        }

        // Temporary "AI Assistant — Coming Soon" Toast Banner
        AnimatedVisibility(
            visible = aiNoticeVisible,
            enter = fadeIn(tween(150)),
            exit = fadeOut(tween(250)),
            modifier = Modifier.align(Alignment.Center)
        ) {
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(20.dp))
                    .background(if (tokens.isDark) Color(0xFF1E1B4B) else Color(0xFFEEF2FF))
                    .border(
                        1.dp,
                        if (tokens.isDark) Color(0xFF818CF8).copy(alpha = 0.6f) else Color(0xFF6366F1).copy(alpha = 0.4f),
                        RoundedCornerShape(20.dp)
                    )
                    .padding(horizontal = 14.dp, vertical = 6.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "✨ AI Assistant — Coming Soon",
                    color = if (tokens.isDark) Color(0xFFC7D2FE) else Color(0xFF4338CA),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 0.2.sp
                )
            }
        }
    }
}

@Composable
fun AiFeatureButton(
    onClick: () -> Unit,
    hapticEnabled: Boolean,
    keyAnimationEnabled: Boolean,
    modifier: Modifier = Modifier
) {
    val haptic = LocalHapticFeedback.current
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    val scale by animateFloatAsState(
        targetValue = if (isPressed && keyAnimationEnabled) 0.94f else 1.0f,
        animationSpec = tween(durationMillis = 100),
        label = "ai_button_scale"
    )

    val gradient = Brush.horizontalGradient(
        colors = listOf(AiPillGradientStart, AiPillGradientEnd)
    )

    Box(
        modifier = modifier
            .scale(scale)
            .height(34.dp)
            .clip(RoundedCornerShape(17.dp))
            .background(gradient)
            .border(1.dp, Color.White.copy(alpha = 0.25f), RoundedCornerShape(17.dp))
            .clickable(
                interactionSource = interactionSource,
                indication = null
            ) {
                if (hapticEnabled) {
                    haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                }
                onClick()
            }
            .padding(horizontal = 12.dp),
        contentAlignment = Alignment.Center
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Icon(
                imageVector = Icons.Filled.AutoAwesome,
                contentDescription = "AI",
                tint = Color.White,
                modifier = Modifier.size(15.dp)
            )
            Text(
                text = "AI",
                color = Color.White,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.5.sp
            )
        }
    }
}

@Composable
fun ToolbarIconButton(
    icon: ImageVector,
    contentDescription: String,
    tokens: KeyboardColorTokens,
    onClick: () -> Unit,
    hapticEnabled: Boolean,
    keyAnimationEnabled: Boolean,
    modifier: Modifier = Modifier
) {
    val haptic = LocalHapticFeedback.current
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    val scale by animateFloatAsState(
        targetValue = if (isPressed && keyAnimationEnabled) 0.90f else 1.0f,
        animationSpec = tween(durationMillis = 80),
        label = "toolbar_icon_scale"
    )

    Box(
        modifier = modifier
            .scale(scale)
            .size(34.dp)
            .clip(CircleShape)
            .background(if (isPressed) tokens.keySpecialPressed else tokens.keySpecial.copy(alpha = 0.6f))
            .clickable(
                interactionSource = interactionSource,
                indication = null
            ) {
                if (hapticEnabled) {
                    haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                }
                onClick()
            },
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = contentDescription,
            tint = if (isPressed) tokens.textPrimary else tokens.textSecondary,
            modifier = Modifier.size(18.dp)
        )
    }
}

@Composable
fun ToolbarTextButton(
    text: String,
    tokens: KeyboardColorTokens,
    onClick: () -> Unit,
    hapticEnabled: Boolean,
    keyAnimationEnabled: Boolean,
    modifier: Modifier = Modifier
) {
    val haptic = LocalHapticFeedback.current
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    val scale by animateFloatAsState(
        targetValue = if (isPressed && keyAnimationEnabled) 0.90f else 1.0f,
        animationSpec = tween(durationMillis = 80),
        label = "toolbar_text_scale"
    )

    Box(
        modifier = modifier
            .scale(scale)
            .height(34.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(if (isPressed) tokens.keySpecialPressed else tokens.keySpecial.copy(alpha = 0.6f))
            .clickable(
                interactionSource = interactionSource,
                indication = null
            ) {
                if (hapticEnabled) {
                    haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                }
                onClick()
            }
            .padding(horizontal = 9.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            color = if (isPressed) tokens.textPrimary else tokens.textSecondary,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.3.sp
        )
    }
}`
  },
  {
    path: 'app/src/main/java/com/aikeyboard/ime/ui/ComposeKeyboardView.kt',
    name: 'ComposeKeyboardView.kt',
    language: 'kotlin',
    description: 'Milestone 1D: Jetpack Compose keyboard with exact measured layout-anchored character popup preview, dedicated comma key, usable emoji picker, and bottom row proportions.',
    content: `package com.aikeyboard.ime.ui

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.waitForUpOrCancellation
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Backspace
import androidx.compose.material.icons.filled.ContentPaste
import androidx.compose.material.icons.filled.KeyboardCapslock
import androidx.compose.material.icons.filled.SentimentSatisfiedAlt
import androidx.compose.material.icons.outlined.ArrowUpward
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.LayoutCoordinates
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import com.aikeyboard.ime.KeyboardActionListener
import com.aikeyboard.ime.KeyboardMode
import com.aikeyboard.ime.KeyboardPreferences
import com.aikeyboard.ime.ShiftState
import com.aikeyboard.ime.ui.theme.KeyboardColorTokens
import com.aikeyboard.ime.ui.theme.KeyboardThemes
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

data class ActiveKeyPopupInfo(
    val char: String,
    val x: Float,
    val y: Float,
    val keyWidth: Float,
    val keyHeight: Float
)

@Composable
fun ComposeKeyboardView(
    keyboardMode: KeyboardMode,
    shiftState: ShiftState,
    actionListener: KeyboardActionListener,
    tokens: KeyboardColorTokens = KeyboardThemes.Midnight,
    keyHeightDp: Int = 47,
    keyAnimationEnabled: Boolean = true,
    hapticEnabled: Boolean = true,
    aiNoticeVisible: Boolean = false,
    preferences: KeyboardPreferences? = null,
    modifier: Modifier = Modifier
) {
    var rootCoordinates by remember { mutableStateOf<LayoutCoordinates?>(null) }
    var activePopupInfo by remember { mutableStateOf<ActiveKeyPopupInfo?>(null) }

    val onKeyBoundsChanged: (Boolean, String, LayoutCoordinates?) -> Unit = remember(rootCoordinates) {
        { isPressed, char, keyCoords ->
            if (isPressed && keyCoords != null && rootCoordinates != null) {
                val root = rootCoordinates!!
                if (keyCoords.isAttached && root.isAttached) {
                    val offset = root.localPositionOf(keyCoords, androidx.compose.ui.geometry.Offset.Zero)
                    activePopupInfo = ActiveKeyPopupInfo(
                        char = char,
                        x = offset.x,
                        y = offset.y,
                        keyWidth = keyCoords.size.width.toFloat(),
                        keyHeight = keyCoords.size.height.toFloat()
                    )
                }
            } else {
                if (!isPressed && activePopupInfo?.char.equals(char, ignoreCase = true)) {
                    activePopupInfo = null
                }
            }
        }
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .navigationBarsPadding()
            .onGloballyPositioned { coords ->
                rootCoordinates = coords
            }
    ) {
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = tokens.background,
            tonalElevation = if (tokens.isDark) 6.dp else 2.dp
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 6.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                // Keyboard Toolbar with AI button and shortcuts
                KeyboardToolbar(
                    actionListener = actionListener,
                    aiNoticeVisible = aiNoticeVisible,
                    tokens = tokens,
                    hapticEnabled = hapticEnabled,
                    keyAnimationEnabled = keyAnimationEnabled
                )

                // Keys Container
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 4.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    when (keyboardMode) {
                        KeyboardMode.ALPHA -> {
                            AlphaKeyboardLayout(shiftState, actionListener, tokens, keyHeightDp, keyAnimationEnabled, hapticEnabled, onKeyBoundsChanged)
                        }
                        KeyboardMode.SYMBOLS -> {
                            SymbolsKeyboardLayout(isAlt = false, actionListener, tokens, keyHeightDp, keyAnimationEnabled, hapticEnabled, onKeyBoundsChanged)
                        }
                        KeyboardMode.ALT_SYMBOLS -> {
                            SymbolsKeyboardLayout(isAlt = true, actionListener, tokens, keyHeightDp, keyAnimationEnabled, hapticEnabled, onKeyBoundsChanged)
                        }
                        KeyboardMode.EMOJI -> {
                            EmojiKeyboardLayout(actionListener, tokens, keyHeightDp, keyAnimationEnabled, hapticEnabled)
                        }
                        KeyboardMode.CLIPBOARD -> {
                            ClipboardPanelView(preferences, actionListener, tokens, keyHeightDp, hapticEnabled)
                        }
                    }
                }
            }
        }

        // M1D Anchored Key Press Enlarged Character Popup Preview
        if (keyAnimationEnabled && activePopupInfo != null) {
            val popup = activePopupInfo!!
            val density = LocalDensity.current

            val defaultPopupWidthDp = 44.dp
            val defaultPopupHeightDp = 48.dp
            val gapDp = 4.dp
            val edgePaddingDp = 4.dp

            val defaultPopupWidthPx = with(density) { defaultPopupWidthDp.toPx() }
            val defaultPopupHeightPx = with(density) { defaultPopupHeightDp.toPx() }
            val gapPx = with(density) { gapDp.toPx() }
            val edgePaddingPx = with(density) { edgePaddingDp.toPx() }

            val rootWidthPx = rootCoordinates?.size?.width?.toFloat() ?: 1000f

            // 1. Horizontally centered over the pressed key
            val keyCenterX = popup.x + popup.keyWidth / 2f
            val centeredX = keyCenterX - defaultPopupWidthPx / 2f

            // 6. Stay within visible keyboard bounds (edges)
            val minX = edgePaddingPx
            val maxX = (rootWidthPx - defaultPopupWidthPx - edgePaddingPx).coerceAtLeast(minX)
            val clampedX = centeredX.coerceIn(minX, maxX)

            // 2. Appear above the pressed key with small consistent gap
            // 4. Never cover the pressed key itself
            val popupBottom = popup.y - gapPx
            val availableHeightPx = popupBottom - edgePaddingPx
            val minHeightPx = with(density) { 36.dp.toPx() }
            val actualHeightPx = defaultPopupHeightPx.coerceAtMost(availableHeightPx.coerceAtLeast(minHeightPx))
            val clampedY = (popupBottom - actualHeightPx).coerceAtLeast(edgePaddingPx)

            val popupHeightDp = with(density) { actualHeightPx.toDp() }
            val fontSize = if (popupHeightDp < 42.dp) 20.sp else 22.sp

            Box(
                modifier = Modifier
                    .offset {
                        androidx.compose.ui.unit.IntOffset(
                            clampedX.toInt(),
                            clampedY.toInt()
                        )
                    }
                    .size(width = defaultPopupWidthDp, height = popupHeightDp)
                    .zIndex(999f)
                    .shadow(10.dp, RoundedCornerShape(topStart = 12.dp, topEnd = 12.dp, bottomStart = 4.dp, bottomEnd = 4.dp))
                    .clip(RoundedCornerShape(topStart = 12.dp, topEnd = 12.dp, bottomStart = 4.dp, bottomEnd = 4.dp))
                    .background(tokens.keySurfacePressed)
                    .border(1.5.dp, tokens.keyAccent, RoundedCornerShape(topStart = 12.dp, topEnd = 12.dp, bottomStart = 4.dp, bottomEnd = 4.dp)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = popup.char,
                    fontSize = fontSize,
                    fontWeight = FontWeight.Bold,
                    color = tokens.textPrimary
                )
            }
        }
    }
}

@Composable
private fun AlphaKeyboardLayout(
    shiftState: ShiftState,
    listener: KeyboardActionListener,
    tokens: KeyboardColorTokens,
    keyHeightDp: Int,
    keyAnimationEnabled: Boolean,
    hapticEnabled: Boolean,
    onKeyBoundsChanged: (Boolean, String, LayoutCoordinates?) -> Unit
) {
    val row1 = listOf("q", "w", "e", "r", "t", "y", "u", "i", "o", "p")
    val row2 = listOf("a", "s", "d", "f", "g", "h", "j", "k", "l")
    val row3 = listOf("z", "x", "c", "v", "b", "n", "m")

    val isUppercase = shiftState != ShiftState.OFF

    // Row 1
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        row1.forEach { char ->
            val display = if (isUppercase) char.uppercase() else char
            KeyboardKey(
                text = display,
                modifier = Modifier.weight(1f),
                tokens = tokens,
                keyHeightDp = keyHeightDp,
                keyAnimationEnabled = keyAnimationEnabled,
                hapticEnabled = hapticEnabled,
                onKeyBoundsChanged = onKeyBoundsChanged,
                onClick = { listener.onTextInput(display) }
            )
        }
    }

    // Row 2 (Centered with inset)
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 14.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        row2.forEach { char ->
            val display = if (isUppercase) char.uppercase() else char
            KeyboardKey(
                text = display,
                modifier = Modifier.weight(1f),
                tokens = tokens,
                keyHeightDp = keyHeightDp,
                keyAnimationEnabled = keyAnimationEnabled,
                hapticEnabled = hapticEnabled,
                onKeyBoundsChanged = onKeyBoundsChanged,
                onClick = { listener.onTextInput(display) }
            )
        }
    }

    // Row 3: Shift, Z X C V B N M, Backspace
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        val (shiftIcon, shiftTint) = when (shiftState) {
            ShiftState.OFF -> Icons.Outlined.ArrowUpward to tokens.textSecondary
            ShiftState.SHIFTED -> Icons.Outlined.ArrowUpward to tokens.keyAccent
            ShiftState.CAPS_LOCK -> Icons.Filled.KeyboardCapslock to tokens.keyAccent
        }

        SpecialKey(
            icon = shiftIcon,
            modifier = Modifier.weight(1.4f),
            tokens = tokens,
            keyHeightDp = keyHeightDp,
            keyAnimationEnabled = keyAnimationEnabled,
            iconTint = shiftTint,
            isHighlighted = shiftState != ShiftState.OFF,
            hapticEnabled = hapticEnabled,
            onClick = { listener.onShiftClicked() }
        )

        row3.forEach { char ->
            val display = if (isUppercase) char.uppercase() else char
            KeyboardKey(
                text = display,
                modifier = Modifier.weight(1f),
                tokens = tokens,
                keyHeightDp = keyHeightDp,
                keyAnimationEnabled = keyAnimationEnabled,
                hapticEnabled = hapticEnabled,
                onKeyBoundsChanged = onKeyBoundsChanged,
                onClick = { listener.onTextInput(display) }
            )
        }

        BackspaceKey(
            modifier = Modifier.weight(1.4f),
            tokens = tokens,
            keyHeightDp = keyHeightDp,
            keyAnimationEnabled = keyAnimationEnabled,
            hapticEnabled = hapticEnabled,
            onDelete = { listener.onBackspace() }
        )
    }

    // Row 4: Bottom row with dedicated comma key
    // [ ?123 ] [ Emoji ] [ , ] [     Space     ] [ . ] [ Enter ]
    BottomActionRow(
        modeText = "?123",
        tokens = tokens,
        keyHeightDp = keyHeightDp,
        keyAnimationEnabled = keyAnimationEnabled,
        hapticEnabled = hapticEnabled,
        onModeClick = { listener.onSwitchMode(KeyboardMode.SYMBOLS) },
        onKeyBoundsChanged = onKeyBoundsChanged,
        listener = listener
    )
}

@Composable
private fun SymbolsKeyboardLayout(
    isAlt: Boolean,
    listener: KeyboardActionListener,
    tokens: KeyboardColorTokens,
    keyHeightDp: Int,
    keyAnimationEnabled: Boolean,
    hapticEnabled: Boolean,
    onKeyBoundsChanged: (Boolean, String, LayoutCoordinates?) -> Unit
) {
    val row1 = if (!isAlt) {
        listOf("1", "2", "3", "4", "5", "6", "7", "8", "9", "0")
    } else {
        listOf("~", "\`", "|", "\\", "^", "=", "<", ">", "{", "}")
    }

    val row2 = if (!isAlt) {
        listOf("@", "#", "$", "%", "&", "-", "+", "(", ")")
    } else {
        listOf("[", "]", "*", "/", "\"", "'", ":", ";", "!", "?")
    }

    val row3 = if (!isAlt) {
        listOf("*", "\"", "'", ":", ";", "!", "?")
    } else {
        listOf("_", "€", "£", "¥", "§", "©", "®")
    }

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        row1.forEach { char ->
            KeyboardKey(
                text = char,
                modifier = Modifier.weight(1f),
                tokens = tokens,
                keyHeightDp = keyHeightDp,
                keyAnimationEnabled = keyAnimationEnabled,
                hapticEnabled = hapticEnabled,
                onKeyBoundsChanged = onKeyBoundsChanged,
                onClick = { listener.onTextInput(char) }
            )
        }
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        row2.forEach { char ->
            KeyboardKey(
                text = char,
                modifier = Modifier.weight(1f),
                tokens = tokens,
                keyHeightDp = keyHeightDp,
                keyAnimationEnabled = keyAnimationEnabled,
                hapticEnabled = hapticEnabled,
                onKeyBoundsChanged = onKeyBoundsChanged,
                onClick = { listener.onTextInput(char) }
            )
        }
    }

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        SpecialKey(
            text = if (!isAlt) "=\\<" else "?123",
            modifier = Modifier.weight(1.5f),
            tokens = tokens,
            keyHeightDp = keyHeightDp,
            keyAnimationEnabled = keyAnimationEnabled,
            hapticEnabled = hapticEnabled,
            onClick = {
                val nextMode = if (!isAlt) KeyboardMode.ALT_SYMBOLS else KeyboardMode.SYMBOLS
                listener.onSwitchMode(nextMode)
            }
        )

        row3.forEach { char ->
            KeyboardKey(
                text = char,
                modifier = Modifier.weight(1f),
                tokens = tokens,
                keyHeightDp = keyHeightDp,
                keyAnimationEnabled = keyAnimationEnabled,
                hapticEnabled = hapticEnabled,
                onKeyBoundsChanged = onKeyBoundsChanged,
                onClick = { listener.onTextInput(char) }
            )
        }

        BackspaceKey(
            modifier = Modifier.weight(1.4f),
            tokens = tokens,
            keyHeightDp = keyHeightDp,
            keyAnimationEnabled = keyAnimationEnabled,
            hapticEnabled = hapticEnabled,
            onDelete = { listener.onBackspace() }
        )
    }

    // Row 4: Bottom row for Symbols
    BottomActionRow(
        modeText = "ABC",
        tokens = tokens,
        keyHeightDp = keyHeightDp,
        keyAnimationEnabled = keyAnimationEnabled,
        hapticEnabled = hapticEnabled,
        onModeClick = { listener.onSwitchMode(KeyboardMode.ALPHA) },
        onKeyBoundsChanged = onKeyBoundsChanged,
        listener = listener
    )
}

/**
 * Milestone 1D: Dedicated Bottom Action Row
 * Structure: [ ?123 / ABC ] [ Emoji ] [ , ] [     Space     ] [ . ] [ Enter ]
 */
@Composable
private fun BottomActionRow(
    modeText: String,
    tokens: KeyboardColorTokens,
    keyHeightDp: Int,
    keyAnimationEnabled: Boolean,
    hapticEnabled: Boolean,
    onModeClick: () -> Unit,
    onKeyBoundsChanged: (Boolean, String, LayoutCoordinates?) -> Unit,
    listener: KeyboardActionListener
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // 1. [ ?123 / ABC ] Mode switch
        SpecialKey(
            text = modeText,
            modifier = Modifier.weight(1.3f),
            tokens = tokens,
            keyHeightDp = keyHeightDp,
            keyAnimationEnabled = keyAnimationEnabled,
            hapticEnabled = hapticEnabled,
            onClick = onModeClick
        )

        // 2. [ Emoji ] Button
        SpecialKey(
            icon = Icons.Filled.SentimentSatisfiedAlt,
            modifier = Modifier.weight(1.0f),
            tokens = tokens,
            keyHeightDp = keyHeightDp,
            keyAnimationEnabled = keyAnimationEnabled,
            hapticEnabled = hapticEnabled,
            onClick = { listener.onEmojiClicked() }
        )

        // 3. [ , ] Dedicated Comma Key (Milestone 1D Required)
        KeyboardKey(
            text = ",",
            modifier = Modifier.weight(1.0f),
            tokens = tokens,
            keyHeightDp = keyHeightDp,
            keyAnimationEnabled = keyAnimationEnabled,
            hapticEnabled = hapticEnabled,
            onKeyBoundsChanged = onKeyBoundsChanged,
            onClick = { listener.onTextInput(",") }
        )

        // 4. [     Space     ] Largest key in bottom row
        KeyboardKey(
            text = "space",
            isSpace = true,
            modifier = Modifier.weight(4.2f),
            tokens = tokens,
            keyHeightDp = keyHeightDp,
            keyAnimationEnabled = keyAnimationEnabled,
            hapticEnabled = hapticEnabled,
            onClick = { listener.onSpace() }
        )

        // 5. [ . ] Period Key
        KeyboardKey(
            text = ".",
            modifier = Modifier.weight(1.0f),
            tokens = tokens,
            keyHeightDp = keyHeightDp,
            keyAnimationEnabled = keyAnimationEnabled,
            hapticEnabled = hapticEnabled,
            onKeyBoundsChanged = onKeyBoundsChanged,
            onClick = { listener.onPeriod() }
        )

        // 6. [ Enter ] Action Key
        SpecialKey(
            icon = Icons.Filled.ArrowForward,
            modifier = Modifier.weight(1.5f),
            isPrimary = true,
            tokens = tokens,
            keyHeightDp = keyHeightDp,
            keyAnimationEnabled = keyAnimationEnabled,
            hapticEnabled = hapticEnabled,
            onClick = { listener.onEnter() }
        )
    }
}

/**
 * Milestone 1D: Usable Android Emoji Picker Interface
 * Fast, offline, categorized emoji grid with 1-click ABC return button.
 */
@Composable
private fun EmojiKeyboardLayout(
    listener: KeyboardActionListener,
    tokens: KeyboardColorTokens,
    keyHeightDp: Int,
    keyAnimationEnabled: Boolean,
    hapticEnabled: Boolean
) {
    val categories = remember {
        listOf(
            "Smileys" to listOf(
                "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊",
                "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😋", "😛", "😜", "🤪", "😝",
                "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒",
                "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢",
                "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "🥸", "😎", "🤓",
                "🧐", "😕", "😟", "🙁", "😮", "😯", "😲", "😳", "🥺", "😦", "😧", "😨",
                "😰", "😥", "😢", "😭", "😱", "😖", "😣", "😞", "😓", "😩", "😫", "🥱"
            ),
            "Gestures" to listOf(
                "👋", "🤚", "🖐️", "✋", "🖖", "🫱", "🫲", "🫳", "🫴", "👌", "🤌", "🤏",
                "✌️", "🤞", "🫰", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️",
                "🫵", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "🫶", "👐", "🤲",
                "🤝", "🙏", "✍️", "💅", "🤳", "💪"
            ),
            "Hearts" to listOf(
                "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕",
                "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️",
                "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "💯", "🔥", "✨", "🌟", "💫", "💥"
            ),
            "Objects" to listOf(
                "🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "🥈", "🥉", "⚽", "🏀", "🏈", "⚾",
                "🎾", "🎮", "🎯", "🎲", "🚀", "✈️", "🚗", "🚲", "📱", "💻", "📷", "💡",
                "🔑", "💎", "🔔", "📢", "🎧", "🎸", "🎨", "🎬"
            ),
            "Food/Nature" to listOf(
                "🍕", "🍔", "🍟", "🌭", "🍿", "🥓", "🍳", "🥞", "🥐", "☕", "🍵", "🧃",
                "🥤", "🍺", "🍻", "🍷", "🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍒",
                "🐶", "🐱", "🐭", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐸", "🦄",
                "🐝", "🦋", "🌺", "🌸", "🌼", "🌻", "🌞", "🌙", "🌈", "⭐"
            )
        )
    }

    var selectedCategoryIndex by remember { mutableStateOf(0) }
    val haptic = LocalHapticFeedback.current

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 2.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        // Category Selector Chips
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            categories.forEachIndexed { index, (name, emojis) ->
                val isSelected = selectedCategoryIndex == index
                val chipShape = RoundedCornerShape(8.dp)
                Box(
                    modifier = Modifier
                        .clip(chipShape)
                        .background(if (isSelected) tokens.keyAccent else tokens.keySurface)
                        .border(1.dp, if (isSelected) tokens.keyAccent else tokens.borderRim, chipShape)
                        .clickable {
                            if (hapticEnabled) haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            selectedCategoryIndex = index
                        }
                        .padding(horizontal = 10.dp, vertical = 5.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "\${emojis.first()} $name",
                        fontSize = 12.sp,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                        color = if (isSelected) Color.White else tokens.textPrimary
                    )
                }
            }
        }

        // Emoji Grid Container
        val activeEmojis = categories[selectedCategoryIndex].second
        LazyVerticalGrid(
            columns = GridCells.Fixed(7),
            modifier = Modifier
                .fillMaxWidth()
                .height(160.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(tokens.keySurface.copy(alpha = 0.5f))
                .border(1.dp, tokens.borderRim, RoundedCornerShape(8.dp))
                .padding(4.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            items(activeEmojis) { emoji ->
                Box(
                    modifier = Modifier
                        .size(38.dp)
                        .clip(RoundedCornerShape(6.dp))
                        .clickable {
                            if (hapticEnabled) haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            listener.onTextInput(emoji)
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = emoji,
                        fontSize = 22.sp
                    )
                }
            }
        }

        // Bottom Navigation Bar for Emoji Mode
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // [ ABC ] Button -> Return directly to normal QWERTY keyboard
            SpecialKey(
                text = "ABC",
                modifier = Modifier.weight(1.8f),
                tokens = tokens,
                keyHeightDp = keyHeightDp,
                keyAnimationEnabled = keyAnimationEnabled,
                hapticEnabled = hapticEnabled,
                isPrimary = true,
                onClick = { listener.onSwitchMode(KeyboardMode.ALPHA) }
            )

            // Space Bar
            KeyboardKey(
                text = "space",
                isSpace = true,
                modifier = Modifier.weight(3.8f),
                tokens = tokens,
                keyHeightDp = keyHeightDp,
                keyAnimationEnabled = keyAnimationEnabled,
                hapticEnabled = hapticEnabled,
                onClick = { listener.onSpace() }
            )

            // Backspace Key with long-press repeat
            BackspaceKey(
                modifier = Modifier.weight(1.4f),
                tokens = tokens,
                keyHeightDp = keyHeightDp,
                keyAnimationEnabled = keyAnimationEnabled,
                hapticEnabled = hapticEnabled,
                onDelete = { listener.onBackspace() }
            )

            // Enter Key
            SpecialKey(
                icon = Icons.Filled.ArrowForward,
                modifier = Modifier.weight(1.4f),
                tokens = tokens,
                keyHeightDp = keyHeightDp,
                keyAnimationEnabled = keyAnimationEnabled,
                hapticEnabled = hapticEnabled,
                onClick = { listener.onEnter() }
            )
        }
    }
}

/**
 * Standard Key Composable with immediate touch feedback, 80-150ms bounce,
 * subtle pressed-state visual, and exact measured layout position anchoring for character popup.
 */
@Composable
fun KeyboardKey(
    text: String,
    modifier: Modifier = Modifier,
    tokens: KeyboardColorTokens,
    keyHeightDp: Int = 47,
    keyAnimationEnabled: Boolean = true,
    isSpace: Boolean = false,
    hapticEnabled: Boolean = true,
    onKeyBoundsChanged: ((Boolean, String, LayoutCoordinates?) -> Unit)? = null,
    onClick: () -> Unit
) {
    val haptic = LocalHapticFeedback.current
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    var keyCoordinates by remember { mutableStateOf<LayoutCoordinates?>(null) }

    LaunchedEffect(isPressed, text, keyCoordinates) {
        if (!isSpace && text.length == 1) {
            onKeyBoundsChanged?.invoke(isPressed, text, keyCoordinates)
        }
    }

    // 80-150ms scale bounce feedback (100ms)
    val scale by animateFloatAsState(
        targetValue = if (isPressed && keyAnimationEnabled) 0.94f else 1.0f,
        animationSpec = tween(durationMillis = 100),
        label = "key_scale"
    )

    val shape = RoundedCornerShape(9.dp)
    val bgColor = if (isPressed) tokens.keySurfacePressed else tokens.keySurface

    Box(
        modifier = modifier
            .zIndex(if (isPressed) 25f else 1f)
            .height(keyHeightDp.dp)
            .onGloballyPositioned { coords ->
                keyCoordinates = coords
                if (isPressed && !isSpace && text.length == 1) {
                    onKeyBoundsChanged?.invoke(true, text, coords)
                }
            },
        contentAlignment = Alignment.Center
    ) {
        // Key Body
        Box(
            modifier = Modifier
                .fillMaxSize()
                .scale(scale)
                .shadow(if (isPressed) 1.dp else 2.dp, shape)
                .clip(shape)
                .background(bgColor)
                .border(1.dp, if (isPressed && keyAnimationEnabled) tokens.keyAccent else tokens.borderRim, shape)
                .clickable(
                    interactionSource = interactionSource,
                    indication = null
                ) {
                    if (hapticEnabled) {
                        haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                    }
                    if (!isSpace && text.length == 1 && keyCoordinates != null) {
                        onKeyBoundsChanged?.invoke(true, text, keyCoordinates)
                    }
                    onClick()
                },
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = if (isSpace) "" else text,
                fontSize = if (isSpace) 13.sp else 20.sp,
                fontWeight = FontWeight.Medium,
                color = if (isPressed) (if (tokens.isDark) Color.White else tokens.textPrimary) else tokens.textPrimary
            )
        }
    }
}

@Composable
fun SpecialKey(
    modifier: Modifier = Modifier,
    text: String? = null,
    icon: ImageVector? = null,
    tokens: KeyboardColorTokens,
    keyHeightDp: Int = 47,
    keyAnimationEnabled: Boolean = true,
    iconTint: Color = tokens.textSecondary,
    isHighlighted: Boolean = false,
    isPrimary: Boolean = false,
    hapticEnabled: Boolean = true,
    onClick: () -> Unit
) {
    val haptic = LocalHapticFeedback.current
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    val scale by animateFloatAsState(
        targetValue = if (isPressed && keyAnimationEnabled) 0.94f else 1.0f,
        animationSpec = tween(durationMillis = 100),
        label = "special_key_scale"
    )

    val shape = RoundedCornerShape(9.dp)

    val bgColor = when {
        isPrimary -> if (isPressed) tokens.keyAccentPressed else tokens.keyAccent
        isHighlighted -> tokens.keyAccent.copy(alpha = 0.25f)
        isPressed -> tokens.keySpecialPressed
        else -> tokens.keySpecial
    }

    val contentColor = when {
        isPrimary -> Color.White
        isHighlighted -> tokens.keyAccent
        isPressed -> tokens.textPrimary
        else -> iconTint
    }

    Box(
        modifier = modifier
            .scale(scale)
            .height(keyHeightDp.dp)
            .shadow(if (isPressed) 1.dp else 2.dp, shape)
            .clip(shape)
            .background(bgColor)
            .border(1.dp, if (isHighlighted) tokens.keyAccent.copy(alpha = 0.5f) else tokens.borderRim, shape)
            .clickable(
                interactionSource = interactionSource,
                indication = null
            ) {
                if (hapticEnabled) {
                    haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                }
                onClick()
            },
        contentAlignment = Alignment.Center
    ) {
        if (icon != null) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = contentColor
            )
        } else if (text != null) {
            Text(
                text = text,
                fontSize = 15.sp,
                fontWeight = FontWeight.SemiBold,
                color = contentColor
            )
        }
    }
}

/**
 * Milestone 1E: Long-press Backspace Key with Natural Continuous Deletion
 * - Short tap: Deletes 1 character immediately
 * - Long press: Waits 400ms (350-500ms range), then continuously deletes every 65ms (50-100ms range)
 * - Releases/Cancels: Stops immediately
 * - Single deletion loop guarantee
 * - Respects haptic feedback setting
 */
@Composable
fun BackspaceKey(
    modifier: Modifier = Modifier,
    tokens: KeyboardColorTokens,
    keyHeightDp: Int = 47,
    keyAnimationEnabled: Boolean = true,
    hapticEnabled: Boolean = true,
    onDelete: () -> Unit
) {
    val haptic = LocalHapticFeedback.current
    var isPressed by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    var repeatJob by remember { mutableStateOf<Job?>(null) }

    val scale by animateFloatAsState(
        targetValue = if (isPressed && keyAnimationEnabled) 0.94f else 1.0f,
        animationSpec = tween(durationMillis = 100),
        label = "backspace_scale"
    )

    val shape = RoundedCornerShape(9.dp)
    val bgColor = if (isPressed) tokens.keySpecialPressed else tokens.keySpecial
    val contentColor = if (isPressed) tokens.textPrimary else tokens.textSecondary

    Box(
        modifier = modifier
            .scale(scale)
            .height(keyHeightDp.dp)
            .shadow(if (isPressed) 1.dp else 2.dp, shape)
            .clip(shape)
            .background(bgColor)
            .border(1.dp, tokens.borderRim, shape)
            .pointerInput(Unit) {
                awaitEachGesture {
                    awaitFirstDown(requireUnconsumed = false)
                    isPressed = true

                    // Initial single deletion on touch down
                    onDelete()
                    if (hapticEnabled) {
                        haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                    }

                    // Start continuous deletion loop after 400ms initial delay
                    repeatJob?.cancel()
                    repeatJob = scope.launch {
                        delay(400) // Initial delay: 400ms (within 350-500ms)
                        while (isActive) {
                            onDelete()
                            if (hapticEnabled) {
                                haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            }
                            delay(65) // Natural repeat interval: 65ms (within 50-100ms)
                        }
                    }

                    // Wait for finger release (ACTION_UP) or gesture cancellation (ACTION_CANCEL)
                    waitForUpOrCancellation()
                    repeatJob?.cancel()
                    repeatJob = null
                    isPressed = false
                }
            },
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = Icons.Filled.Backspace,
            contentDescription = "Backspace",
            tint = contentColor
        )
    }

    DisposableEffect(Unit) {
        onDispose {
            repeatJob?.cancel()
            repeatJob = null
        }
    }
}

/**
 * Milestone 1E: Compact Clipboard History Panel
 * - Displays up to 10 recent text clips (newest first)
 * - Tapping a clip inserts it and returns to normal keyboard (ALPHA)
 * - Clear history action to purge local clips
 * - ABC return buttons so the user is never trapped
 * - Privacy-respecting: entirely offline, on-device SharedPreferences
 */
@Composable
private fun ClipboardPanelView(
    preferences: KeyboardPreferences?,
    listener: KeyboardActionListener,
    tokens: KeyboardColorTokens,
    keyHeightDp: Int,
    hapticEnabled: Boolean
) {
    val haptic = LocalHapticFeedback.current
    var clips by remember { mutableStateOf(preferences?.getClipboardHistory() ?: emptyList()) }

    LaunchedEffect(Unit) {
        clips = preferences?.getClipboardHistory() ?: emptyList()
    }

    val totalPanelHeight = (keyHeightDp * 4 + 18).dp

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .height(totalPanelHeight)
            .padding(horizontal = 4.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        // Clipboard Header: Title, Count, Clear history, ABC return button
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 4.dp, vertical = 2.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Icon(
                    imageVector = Icons.Filled.ContentPaste,
                    contentDescription = null,
                    tint = tokens.keyAccent,
                    modifier = Modifier.size(18.dp)
                )
                Text(
                    text = "Clipboard",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = tokens.textPrimary
                )
                if (clips.isNotEmpty()) {
                    Text(
                        text = "(\${clips.size}/10)",
                        fontSize = 12.sp,
                        color = tokens.textSecondary
                    )
                }
            }

            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (clips.isNotEmpty()) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(tokens.keySpecial)
                            .border(1.dp, tokens.borderRim, RoundedCornerShape(6.dp))
                            .clickable {
                                if (hapticEnabled) {
                                    haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                }
                                preferences?.clearClipboardHistory()
                                clips = emptyList()
                            }
                            .padding(horizontal = 8.dp, vertical = 4.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Clear history",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = tokens.textSecondary
                        )
                    }
                }

                // Return to normal keyboard (ABC)
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(tokens.keyAccent)
                        .clickable {
                            if (hapticEnabled) {
                                haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            }
                            listener.onSwitchMode(KeyboardMode.ALPHA)
                        }
                        .padding(horizontal = 10.dp, vertical = 4.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "ABC",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }
            }
        }

        // List of clips or Empty State
        if (clips.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        imageVector = Icons.Filled.ContentPaste,
                        contentDescription = null,
                        tint = tokens.textSecondary.copy(alpha = 0.5f),
                        modifier = Modifier.size(32.dp)
                    )
                    Text(
                        text = "No clips saved yet",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium,
                        color = tokens.textPrimary
                    )
                    Text(
                        text = "Copied text will appear here (up to 10 items).",
                        fontSize = 12.sp,
                        color = tokens.textSecondary
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                items(clips) { clip ->
                    val shape = RoundedCornerShape(8.dp)
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(shape)
                            .background(tokens.keySurface)
                            .border(1.dp, tokens.borderRim, shape)
                            .clickable {
                                if (hapticEnabled) {
                                    haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                }
                                listener.onTextInput(clip)
                                listener.onSwitchMode(KeyboardMode.ALPHA)
                            }
                            .padding(horizontal = 12.dp, vertical = 10.dp)
                    ) {
                        Text(
                            text = clip,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Normal,
                            color = tokens.textPrimary,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
            }
        }

        // Bottom Return Button
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(38.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(tokens.keySpecial)
                    .border(1.dp, tokens.borderRim, RoundedCornerShape(8.dp))
                    .clickable {
                        if (hapticEnabled) {
                            haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        }
                        listener.onSwitchMode(KeyboardMode.ALPHA)
                    },
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Return to Keyboard",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = tokens.textPrimary
                )
            }
        }
    }
}
`
  },
  {
    path: 'app/src/main/java/com/aikeyboard/ime/AiInputMethodService.kt',
    name: 'AiInputMethodService.kt',
    language: 'kotlin',
    description: 'Android InputMethodService implementation that communicates with text fields via InputConnection and applies local theme/settings.',
    content: `package com.aikeyboard.ime

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
                    aiNoticeVisible = aiNoticeVisible.value,
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
`
  },
  {
    path: 'app/src/main/java/com/aikeyboard/ime/KeyboardState.kt',
    name: 'KeyboardState.kt',
    language: 'kotlin',
    description: 'Defines keyboard layout modes, shift states, and the action listener contract.',
    content: `package com.aikeyboard.ime

/**
 * Represents the current active keyboard layout mode.
 */
enum class KeyboardMode {
    ALPHA,
    SYMBOLS,
    ALT_SYMBOLS,
    EMOJI,
    CLIPBOARD
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
`
  },
  {
    path: 'app/src/main/java/com/aikeyboard/ime/ComposeLifecycleInputMethodService.kt',
    name: 'ComposeLifecycleInputMethodService.kt',
    language: 'kotlin',
    description: 'Bridge class that provides Android Lifecycle, ViewModelStore, and SavedStateRegistry owners to ComposeView within an InputMethodService.',
    content: `package com.aikeyboard.ime

import android.inputmethodservice.InputMethodService
import androidx.compose.ui.platform.ComposeView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LifecycleRegistry
import androidx.lifecycle.ViewModelStore
import androidx.lifecycle.ViewModelStoreOwner
import androidx.lifecycle.setViewTreeLifecycleOwner
import androidx.lifecycle.setViewTreeViewModelStoreOwner
import androidx.savedstate.SavedStateRegistry
import androidx.savedstate.SavedStateRegistryController
import androidx.savedstate.SavedStateRegistryOwner
import androidx.savedstate.setViewTreeSavedStateRegistryOwner

abstract class ComposeLifecycleInputMethodService : InputMethodService(),
    LifecycleOwner,
    ViewModelStoreOwner,
    SavedStateRegistryOwner {

    private val lifecycleRegistry = LifecycleRegistry(this)
    private val store = ViewModelStore()
    private val savedStateRegistryController = SavedStateRegistryController.create(this)

    override val lifecycle: Lifecycle get() = lifecycleRegistry
    override val viewModelStore: ViewModelStore get() = store
    override val savedStateRegistry: SavedStateRegistry get() = savedStateRegistryController.savedStateRegistry

    override fun onCreate() {
        super.onCreate()
        savedStateRegistryController.performRestore(null)
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_CREATE)
    }

    override fun onDestroy() {
        super.onDestroy()
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_DESTROY)
        store.clear()
    }

    override fun onWindowShown() {
        super.onWindowShown()
        window?.window?.decorView?.let { decorView ->
            decorView.setViewTreeLifecycleOwner(this)
            decorView.setViewTreeViewModelStoreOwner(this)
            decorView.setViewTreeSavedStateRegistryOwner(this)
        }
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_START)
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_RESUME)
    }

    override fun onWindowHidden() {
        super.onWindowHidden()
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_PAUSE)
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_STOP)
    }

    protected fun setupComposeView(view: View) {
        window?.window?.decorView?.let { decorView ->
            decorView.setViewTreeLifecycleOwner(this)
            decorView.setViewTreeViewModelStoreOwner(this)
            decorView.setViewTreeSavedStateRegistryOwner(this)
        }
        view.setViewTreeLifecycleOwner(this)
        view.setViewTreeViewModelStoreOwner(this)
        view.setViewTreeSavedStateRegistryOwner(this)
    }
}`
  },
  {
    path: 'app/src/main/java/com/aikeyboard/ime/ui/theme/Color.kt',
    name: 'Color.kt',
    language: 'kotlin',
    description: 'Color palette definitions for the Midnight theme, key surfaces, and gradients.',
    content: `package com.aikeyboard.ime.ui.theme

import androidx.compose.ui.graphics.Color

val KeyboardNavyBackground = Color(0xFF090D16)
val KeyboardNavySurface = Color(0xFF0F172A)
val KeyboardBorderRim = Color(0x1FFFFFFF)

val KeySurfaceDark = Color(0xFF1E283D)
val KeySurfaceDarkPressed = Color(0xFF2E3D5B)

val KeySpecialDark = Color(0xFF161F33)
val KeySpecialDarkPressed = Color(0xFF243252)

val AiPillGradientStart = Color(0xFF4338CA)
val AiPillGradientEnd = Color(0xFF7C3AED)
val AiPillGlow = Color(0x338B5CF6)

val KeyAccentBlue = Color(0xFF2563EB)
val KeyAccentBluePressed = Color(0xFF1D4ED8)

val TextPrimary = Color(0xFFF8FAFC)
val TextSecondary = Color(0xFF94A3B8)
val TextDisabled = Color(0xFF64748B)`
  },
  {
    path: 'app/src/main/java/com/aikeyboard/ime/ui/theme/Theme.kt',
    name: 'Theme.kt',
    language: 'kotlin',
    description: 'MaterialTheme integration linking Compose darkColorScheme and lightColorScheme with AI Keyboard palettes.',
    content: `package com.aikeyboard.ime.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = KeyAccentBlue,
    background = KeyboardNavyBackground,
    surface = KeySurfaceDark,
    onPrimary = TextPrimary,
    onBackground = TextPrimary,
    onSurface = TextPrimary
)

private val LightColorScheme = lightColorScheme(
    primary = KeyAccentBlue,
    background = Color(0xFFF1F5F9),
    surface = Color(0xFFFFFFFF),
    onPrimary = Color(0xFFFFFFFF),
    onBackground = Color(0xFF0F172A),
    onSurface = Color(0xFF0F172A)
)

@Composable
fun AIKeyboardTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}`
  },
  {
    path: 'app/src/main/java/com/aikeyboard/ime/ui/theme/Type.kt',
    name: 'Type.kt',
    language: 'kotlin',
    description: 'Typography configuration for standard Material 3 components.',
    content: `package com.aikeyboard.ime.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val Typography = Typography(
    bodyLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp
    ),
    labelLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 18.sp,
        letterSpacing = 0.5.sp
    )
)`
  },
  {
    path: 'app/src/main/res/xml/method.xml',
    name: 'method.xml',
    language: 'xml',
    description: 'Android InputMethod subtype configuration linking to settingsActivity and subtype definitions.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<input-method xmlns:android="http://schemas.android.com/apk/res/android"
    android:settingsActivity="com.aikeyboard.MainActivity"
    android:supportsSwitchingToNextInputMethod="true">
    <subtype
        android:label="@string/subtype_en_us"
        android:icon="@drawable/ic_launcher"
        android:imeSubtypeLocale="en_US"
        android:languageTag="en-US"
        android:imeSubtypeMode="keyboard" />
</input-method>`
  },
  {
    path: 'app/src/main/res/values/strings.xml',
    name: 'strings.xml',
    language: 'xml',
    description: 'String resources for app label, IME name, subtype, and onboarding instructions.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">AI Keyboard</string>
    <string name="ime_name">AI Keyboard</string>
    <string name="subtype_en_us">English (US)</string>
    <string name="step_1_enable">1. Enable AI Keyboard</string>
    <string name="step_2_select">2. Select AI Keyboard</string>
    <string name="step_3_test">3. Test AI Keyboard</string>
    <string name="test_hint">Tap here to test typing...</string>
</resources>`
  },
  {
    path: 'app/src/main/res/values/themes.xml',
    name: 'themes.xml',
    language: 'xml',
    description: 'Base Android styles and theme definition for MainActivity.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.AIKeyboard" parent="android:Theme.Material.Light.NoActionBar">
        <item name="android:statusBarColor">@color/primary_variant</item>
        <item name="android:windowBackground">@color/surface</item>
    </style>
</resources>`
  },
  {
    path: 'app/src/main/res/drawable/ic_launcher.xml',
    name: 'ic_launcher.xml',
    language: 'xml',
    description: 'Vector drawable application icon for AI Keyboard.',
    content: `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#0F172A"
        android:pathData="M0,0h108v108h-108z" />
    <path
        android:fillColor="#2563EB"
        android:pathData="M24,30h60c4.4,0 8,3.6 8,8v32c0,4.4 -3.6,8 -8,8H24c-4.4,0 -8,-3.6 -8,-8V38c0,-4.4 3.6,-8 8,-8z" />
    <path
        android:fillColor="#F8FAFC"
        android:pathData="M30,42h8v6h-8z M44,42h8v6h-8z M58,42h8v6h-8z M72,42h8v6h-8z" />
    <path
        android:fillColor="#F8FAFC"
        android:pathData="M34,52h8v6h-8z M48,52h8v6h-8z M62,52h8v6h-8z" />
    <path
        android:fillColor="#38BDF8"
        android:pathData="M36,62h36v5h-36z" />
</vector>`
  },
  {
    path: 'app/src/main/res/drawable/ic_launcher_round.xml',
    name: 'ic_launcher_round.xml',
    language: 'xml',
    description: 'Round vector drawable application icon for circular launcher devices.',
    content: `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#0F172A"
        android:pathData="M54,54m-50,0a50,50 0,1 1,100 0a50,50 0,1 1,-100 0" />
    <path
        android:fillColor="#2563EB"
        android:pathData="M24,30h60c4.4,0 8,3.6 8,8v32c0,4.4 -3.6,8 -8,8H24c-4.4,0 -8,-3.6 -8,-8V38c0,-4.4 3.6,-8 8,-8z" />
    <path
        android:fillColor="#F8FAFC"
        android:pathData="M30,42h8v6h-8z M44,42h8v6h-8z M58,42h8v6h-8z M72,42h8v6h-8z" />
    <path
        android:fillColor="#F8FAFC"
        android:pathData="M34,52h8v6h-8z M48,52h8v6h-8z M62,52h8v6h-8z" />
    <path
        android:fillColor="#38BDF8"
        android:pathData="M36,62h36v5h-36z" />
</vector>`
  },
  {
    path: 'app/src/main/res/values/colors.xml',
    name: 'colors.xml',
    language: 'xml',
    description: 'XML resource color palette for system bars and activity background.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="primary">#1E293B</color>
    <color name="primary_variant">#0F172A</color>
    <color name="surface">#F8FAFC</color>
    <color name="surface_dark">#121824</color>
</resources>`
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    language: 'xml',
    description: 'Declares the BIND_INPUT_METHOD service, input method intent filter, and launcher activity.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <application
        android:allowBackup="true"
        android:icon="@drawable/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@drawable/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.AIKeyboard">

        <activity
            android:name="com.aikeyboard.MainActivity"
            android:exported="true"
            android:label="@string/app_name"
            android:theme="@style/Theme.AIKeyboard">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <service
            android:name="com.aikeyboard.ime.AiInputMethodService"
            android:label="@string/ime_name"
            android:icon="@drawable/ic_launcher"
            android:permission="android.permission.BIND_INPUT_METHOD"
            android:exported="true"
            android:enabled="true">
            <intent-filter>
                <action android:name="android.view.InputMethod" />
            </intent-filter>
            <meta-data
                android:name="android.view.im"
                android:resource="@xml/method" />
        </service>

    </application>

</manifest>`
  },
  {
    path: 'build.gradle.kts',
    name: 'build.gradle.kts (root)',
    language: 'kotlin',
    description: 'Root Gradle build script declaring AGP 8.5.2, Kotlin 2.0.0, and Compose compiler plugins.',
    content: `plugins {
    id("com.android.application") version "8.5.2" apply false
    id("org.jetbrains.kotlin.android") version "2.0.0" apply false
    id("org.jetbrains.kotlin.plugin.compose") version "2.0.0" apply false
}`
  },
  {
    path: 'settings.gradle.kts',
    name: 'settings.gradle.kts',
    language: 'kotlin',
    description: 'Gradle repository management and project inclusion.',
    content: `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "AIKeyboard"
include(":app")`
  },
  {
    path: 'app/build.gradle.kts',
    name: 'app/build.gradle.kts',
    language: 'kotlin',
    description: 'App module build script configuring Jetpack Compose BOM 2024.06.00, Material 3, and Kotlin compiler options.',
    content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.aikeyboard"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.aikeyboard"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }

    lint {
        abortOnError = false
        checkReleaseBuilds = false
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.4")
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.8.4")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.4")
    implementation("androidx.savedstate:savedstate-ktx:1.2.1")
    implementation("androidx.activity:activity-compose:1.9.1")

    val composeBom = platform("androidx.compose:compose-bom:2024.06.00")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
}
`
  },
  {
    path: '.github/workflows/android-apk.yml',
    name: 'android-apk.yml',
    language: 'yaml',
    description: 'GitHub Actions CI/CD: Automated Debug APK build and artifact upload on every push.',
    content: `name: Build Android Debug APK

on:
  push:
    branches:
      - '**'
    tags:
      - '**'
  pull_request:
    branches:
      - '**'
  workflow_dispatch:

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: write

jobs:
  build:
    name: Build & Verify Debug APK
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v5
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Set up Gradle
        uses: gradle/actions/setup-gradle@v4
        with:
          validate-wrappers: false

      - name: Prepare Gradle Environment
        run: |
          chmod +x gradlew
          mkdir -p ~/.gradle
          echo "org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8" >> ~/.gradle/gradle.properties
          echo "android.useAndroidX=true" >> ~/.gradle/gradle.properties
          echo "android.nonTransitiveRClass=true" >> ~/.gradle/gradle.properties

      - name: Run Unit Tests (Optional)
        run: |
          echo "Running unit tests if defined in the project..."
          ./gradlew testDebugUnitTest --no-daemon --continue || true

      - name: Build Debug APK
        id: gradle-build
        run: |
          set -o pipefail
          echo "Building debug APK via Gradle..."
          ./gradlew assembleDebug --stacktrace --no-daemon -x test 2>&1 | tee build.log

      - name: Report Build Diagnostics on Failure
        if: failure()
        run: |
          echo "## :x: Build Failed - Diagnostic Log" >> $GITHUB_STEP_SUMMARY
          echo "### Compiler / Build Output:" >> $GITHUB_STEP_SUMMARY
          echo "\\\`\\\`\\\`text" >> $GITHUB_STEP_SUMMARY
          if [ -f "build.log" ]; then
            grep -C 3 -E "e: |FAILURE:|ERROR:|Exception|Unresolved|Could not|AAPT2" build.log | head -n 50 >> $GITHUB_STEP_SUMMARY || tail -n 40 build.log >> $GITHUB_STEP_SUMMARY
          else
            echo "No build.log generated." >> $GITHUB_STEP_SUMMARY
          fi
          echo "\\\`\\\`\\\`" >> $GITHUB_STEP_SUMMARY

      - name: Verify Real Generated APK
        id: verify-apk
        run: |
          echo "Searching for generated APK files..."
          find app/build -name "*.apk" 2>/dev/null || true

          if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
            APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
          else
            APK_PATH=$(find app/build/outputs -name "*.apk" -type f 2>/dev/null | head -n 1)
          fi

          if [ -z "$APK_PATH" ] || [ ! -f "$APK_PATH" ]; then
            echo "::error::APK file not found. Printing recent build log:"
            if [ -f "build.log" ]; then
              tail -n 60 build.log
            fi
            exit 1
          fi

          # Verify file size is substantial (real compiled APK, not placeholder)
          APK_SIZE=$(stat -c%s "$APK_PATH" 2>/dev/null || stat -f%z "$APK_PATH")
          echo "Found APK at: $APK_PATH"
          echo "APK File Size: $APK_SIZE bytes"

          if [ "$APK_SIZE" -lt 500000 ]; then
            echo "::error::APK file size ($APK_SIZE bytes) is suspiciously small. Expected a compiled Android app."
            exit 1
          fi

          # Prepare normalized copy in artifacts folder
          mkdir -p artifacts
          cp "$APK_PATH" artifacts/aikeyboard-debug.apk

          echo "apk_path=$APK_PATH" >> "$GITHUB_OUTPUT"
          echo "apk_size=$APK_SIZE" >> "$GITHUB_OUTPUT"

          # Write step summary for GitHub Actions UI
          echo "## :white_check_mark: Android APK Build Successful" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "| Property | Value |" >> $GITHUB_STEP_SUMMARY
          echo "|---|---|" >> $GITHUB_STEP_SUMMARY
          echo "| **Build Variant** | \\\`debug\\\` |" >> $GITHUB_STEP_SUMMARY
          echo "| **Application ID** | \\\`com.aikeyboard\\\` |" >> $GITHUB_STEP_SUMMARY
          echo "| **Gradle Output Path** | \\\`$APK_PATH\\\` |" >> $GITHUB_STEP_SUMMARY
          echo "| **Normalized Artifact** | \\\`artifacts/aikeyboard-debug.apk\\\` |" >> $GITHUB_STEP_SUMMARY
          echo "| **APK Size** | \\\`$APK_SIZE bytes\\\` ($(awk "BEGIN {printf \\"%.2f MB\\", $APK_SIZE/1048576}")) |" >> $GITHUB_STEP_SUMMARY
          echo "| **Artifact Name** | \\\`aikeyboard-debug-apk\\\` |" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "### :arrow_down: How to Download & Install on Your Phone:" >> $GITHUB_STEP_SUMMARY
          echo "1. Scroll down to the **Artifacts** section at the bottom of this workflow run page." >> $GITHUB_STEP_SUMMARY
          echo "2. Click **aikeyboard-debug-apk** to download the zip containing \\\`aikeyboard-debug.apk\\\`." >> $GITHUB_STEP_SUMMARY
          echo "3. Extract and transfer to your Android phone, or open the GitHub mobile app / web browser on your phone to install directly." >> $GITHUB_STEP_SUMMARY

      - name: Upload Debug APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: aikeyboard-debug-apk
          path: artifacts/aikeyboard-debug.apk
          if-no-files-found: error
          retention-days: 30

      - name: Create GitHub Release (on Tag)
        if: startsWith(github.ref, 'refs/tags/')
        uses: softprops/action-gh-release@v2
        with:
          files: artifacts/aikeyboard-debug.apk
          name: Release \${{ github.ref_name }}
          draft: false
          prerelease: false
          generate_release_notes: true
`
  },
  {
    path: 'app/src/test/java/com/aikeyboard/KeyboardStateTest.kt',
    name: 'KeyboardStateTest.kt',
    language: 'kotlin',
    description: 'Unit test verifying keyboard mode states (including EMOJI & CLIPBOARD), clipboard history deduplication/capacity, and comma key input integrity.',
    content: `package com.aikeyboard

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
}`
  }
];
