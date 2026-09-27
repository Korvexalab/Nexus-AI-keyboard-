package com.aikeyboard.ime.ui

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Backspace
import androidx.compose.material.icons.filled.KeyboardCapslock
import androidx.compose.material.icons.filled.SentimentSatisfiedAlt
import androidx.compose.material.icons.outlined.ArrowUpward
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aikeyboard.ime.KeyboardActionListener
import com.aikeyboard.ime.KeyboardMode
import com.aikeyboard.ime.ShiftState
import com.aikeyboard.ime.ui.theme.KeyboardColorTokens
import com.aikeyboard.ime.ui.theme.KeyboardThemes

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
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .navigationBarsPadding(),
        color = tokens.background,
        tonalElevation = if (tokens.isDark) 6.dp else 2.dp
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 6.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            // Keyboard Toolbar with prominent AI button
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
                        AlphaKeyboardLayout(shiftState, actionListener, tokens, keyHeightDp, keyAnimationEnabled, hapticEnabled)
                    }
                    KeyboardMode.SYMBOLS -> {
                        SymbolsKeyboardLayout(isAlt = false, actionListener, tokens, keyHeightDp, keyAnimationEnabled, hapticEnabled)
                    }
                    KeyboardMode.ALT_SYMBOLS -> {
                        SymbolsKeyboardLayout(isAlt = true, actionListener, tokens, keyHeightDp, keyAnimationEnabled, hapticEnabled)
                    }
                }
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
    hapticEnabled: Boolean
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
                onClick = { listener.onTextInput(display) }
            )
        }

        SpecialKey(
            icon = Icons.Filled.Backspace,
            modifier = Modifier.weight(1.4f),
            tokens = tokens,
            keyHeightDp = keyHeightDp,
            keyAnimationEnabled = keyAnimationEnabled,
            hapticEnabled = hapticEnabled,
            onClick = { listener.onBackspace() }
        )
    }

    // Row 4
    BottomActionRow(
        modeText = "?123",
        tokens = tokens,
        keyHeightDp = keyHeightDp,
        keyAnimationEnabled = keyAnimationEnabled,
        hapticEnabled = hapticEnabled,
        onModeClick = { listener.onSwitchMode(KeyboardMode.SYMBOLS) },
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
    hapticEnabled: Boolean
) {
    val row1 = if (!isAlt) {
        listOf("1", "2", "3", "4", "5", "6", "7", "8", "9", "0")
    } else {
        listOf("~", "`", "|", "\\", "^", "=", "<", ">", "{", "}")
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
                onClick = { listener.onTextInput(char) }
            )
        }
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 6.dp),
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
            modifier = Modifier.weight(1.4f),
            tokens = tokens,
            keyHeightDp = keyHeightDp,
            keyAnimationEnabled = keyAnimationEnabled,
            hapticEnabled = hapticEnabled,
            onClick = {
                listener.onSwitchMode(if (!isAlt) KeyboardMode.ALT_SYMBOLS else KeyboardMode.SYMBOLS)
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
                onClick = { listener.onTextInput(char) }
            )
        }

        SpecialKey(
            icon = Icons.Filled.Backspace,
            modifier = Modifier.weight(1.4f),
            tokens = tokens,
            keyHeightDp = keyHeightDp,
            keyAnimationEnabled = keyAnimationEnabled,
            hapticEnabled = hapticEnabled,
            onClick = { listener.onBackspace() }
        )
    }

    BottomActionRow(
        modeText = "ABC",
        tokens = tokens,
        keyHeightDp = keyHeightDp,
        keyAnimationEnabled = keyAnimationEnabled,
        hapticEnabled = hapticEnabled,
        onModeClick = { listener.onSwitchMode(KeyboardMode.ALPHA) },
        listener = listener
    )
}

@Composable
private fun BottomActionRow(
    modeText: String,
    tokens: KeyboardColorTokens,
    keyHeightDp: Int,
    keyAnimationEnabled: Boolean,
    hapticEnabled: Boolean,
    onModeClick: () -> Unit,
    listener: KeyboardActionListener
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        SpecialKey(
            text = modeText,
            modifier = Modifier.weight(1.5f),
            tokens = tokens,
            keyHeightDp = keyHeightDp,
            keyAnimationEnabled = keyAnimationEnabled,
            hapticEnabled = hapticEnabled,
            onClick = onModeClick
        )

        SpecialKey(
            icon = Icons.Filled.SentimentSatisfiedAlt,
            modifier = Modifier.weight(1.1f),
            tokens = tokens,
            keyHeightDp = keyHeightDp,
            keyAnimationEnabled = keyAnimationEnabled,
            hapticEnabled = hapticEnabled,
            onClick = { listener.onEmojiClicked() }
        )

        KeyboardKey(
            text = "space",
            isSpace = true,
            modifier = Modifier.weight(4.5f),
            tokens = tokens,
            keyHeightDp = keyHeightDp,
            keyAnimationEnabled = keyAnimationEnabled,
            hapticEnabled = hapticEnabled,
            onClick = { listener.onSpace() }
        )

        KeyboardKey(
            text = ".",
            modifier = Modifier.weight(1.1f),
            tokens = tokens,
            keyHeightDp = keyHeightDp,
            keyAnimationEnabled = keyAnimationEnabled,
            hapticEnabled = hapticEnabled,
            onClick = { listener.onPeriod() }
        )

        SpecialKey(
            icon = Icons.Filled.ArrowForward,
            modifier = Modifier.weight(1.6f),
            isPrimary = true,
            tokens = tokens,
            keyHeightDp = keyHeightDp,
            keyAnimationEnabled = keyAnimationEnabled,
            hapticEnabled = hapticEnabled,
            onClick = { listener.onEnter() }
        )
    }
}

@Composable
fun KeyboardKey(
    text: String,
    modifier: Modifier = Modifier,
    tokens: KeyboardColorTokens,
    keyHeightDp: Int = 47,
    keyAnimationEnabled: Boolean = true,
    isSpace: Boolean = false,
    hapticEnabled: Boolean = true,
    onClick: () -> Unit
) {
    val haptic = LocalHapticFeedback.current
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    val scale by animateFloatAsState(
        targetValue = if (isPressed && keyAnimationEnabled) 0.95f else 1.0f,
        animationSpec = tween(durationMillis = 100),
        label = "key_scale"
    )

    val shape = RoundedCornerShape(9.dp)
    val bgColor = if (isPressed) tokens.keySurfacePressed else tokens.keySurface

    Box(
        modifier = modifier
            .scale(scale)
            .height(keyHeightDp.dp)
            .shadow(if (isPressed) 1.dp else 2.dp, shape)
            .clip(shape)
            .background(bgColor)
            .border(1.dp, tokens.borderRim, shape)
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
        Text(
            text = if (isSpace) "" else text,
            fontSize = if (isSpace) 13.sp else 20.sp,
            fontWeight = FontWeight.Medium,
            color = if (isPressed) (if (tokens.isDark) Color.White else tokens.textPrimary) else tokens.textPrimary
        )
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
