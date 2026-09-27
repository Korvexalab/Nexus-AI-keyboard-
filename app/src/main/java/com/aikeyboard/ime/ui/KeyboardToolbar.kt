package com.aikeyboard.ime.ui

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
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.ContentPaste
import androidx.compose.material.icons.filled.Palette
import androidx.compose.material.icons.filled.SentimentSatisfiedAlt
import androidx.compose.material.icons.filled.Settings
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
}
