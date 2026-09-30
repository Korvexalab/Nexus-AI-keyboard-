package com.aikeyboard.ime.ui

import androidx.compose.animation.AnimatedVisibility
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Close
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
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aikeyboard.ime.ai.AiReplyStyle
import com.aikeyboard.ime.ui.theme.AiPillGradientEnd
import com.aikeyboard.ime.ui.theme.AiPillGradientStart
import com.aikeyboard.ime.ui.theme.KeyboardColorTokens

/**
 * Milestone 2: Compact AI Reply Panel
 *
 * Docked directly above the keyboard:
 * ┌─────────────────────────────────────┐
 * │ ✨ AI Reply                    ×    │
 * ├─────────────────────────────────────┤
 * │ [ Reply ] [ Friendly ] [ Short ]   │
 * │ [ Professional ] [ Funny ]         │
 * │                                     │
 * │ Custom prompt                       │
 * │ ┌─────────────────────────────────┐ │
 * │ │ e.g. make this sound warmer... │ │
 * │ └─────────────────────────────────┘ │
 * │                                     │
 * │             Generate ✨             │
 * └─────────────────────────────────────┘
 *
 * Fast, compact, phone-friendly, completely offline mock generator for Milestone 2.
 */
@Composable
fun AiReplyPanelView(
    selectedStyle: AiReplyStyle,
    onSelectStyle: (AiReplyStyle) -> Unit,
    customPrompt: String,
    onClearPrompt: () -> Unit,
    isPromptFocused: Boolean,
    onTogglePromptFocus: (Boolean) -> Unit,
    onGenerate: (AiReplyStyle, String) -> Unit,
    onClose: () -> Unit,
    tokens: KeyboardColorTokens,
    hapticEnabled: Boolean = true,
    keyAnimationEnabled: Boolean = true,
    modifier: Modifier = Modifier
) {
    val haptic = LocalHapticFeedback.current

    val panelShape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp, bottomStart = 8.dp, bottomEnd = 8.dp)
    val panelBg = if (tokens.isDark) Color(0xFF0F172A) else Color(0xFFF8FAFC)
    val panelBorder = if (tokens.isDark) Color(0x33818CF8) else Color(0x40CBD5E1)

    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(panelShape)
            .background(panelBg)
            .border(1.dp, panelBorder, panelShape)
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // 1. Header: ✨ AI Reply + Close (×) button
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Icon(
                    imageVector = Icons.Filled.AutoAwesome,
                    contentDescription = null,
                    tint = if (tokens.isDark) Color(0xFFFDE047) else Color(0xFFD97706),
                    modifier = Modifier.size(16.dp)
                )
                Text(
                    text = "AI Reply",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = tokens.textPrimary
                )
            }

            // Close button (×)
            Box(
                modifier = Modifier
                    .size(26.dp)
                    .clip(CircleShape)
                    .background(if (tokens.isDark) Color(0xFF1E283D) else Color(0xFFE2E8F0))
                    .clickable {
                        if (hapticEnabled) haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        onClose()
                    },
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Filled.Close,
                    contentDescription = "Close AI Panel",
                    tint = tokens.textSecondary,
                    modifier = Modifier.size(14.dp)
                )
            }
        }

        // 2. Reply Style Buttons (Single Selection with subtle highlighted state)
        // Row A: [ Reply ] [ Friendly ] [ Short ]
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            listOf(AiReplyStyle.REPLY, AiReplyStyle.FRIENDLY, AiReplyStyle.SHORT).forEach { style ->
                StyleChip(
                    style = style,
                    isSelected = selectedStyle == style,
                    onClick = {
                        if (hapticEnabled) haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        onSelectStyle(style)
                    },
                    tokens = tokens,
                    keyAnimationEnabled = keyAnimationEnabled,
                    modifier = Modifier.weight(1f)
                )
            }
        }

        // Row B: [ Professional ] [ Funny ]
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            listOf(AiReplyStyle.PROFESSIONAL, AiReplyStyle.FUNNY).forEach { style ->
                StyleChip(
                    style = style,
                    isSelected = selectedStyle == style,
                    onClick = {
                        if (hapticEnabled) haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        onSelectStyle(style)
                    },
                    tokens = tokens,
                    keyAnimationEnabled = keyAnimationEnabled,
                    modifier = Modifier.weight(1f)
                )
            }
        }

        // 3. Custom Prompt Field (Works seamlessly with IME keyboard typing)
        Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Custom prompt",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium,
                    color = tokens.textSecondary
                )
                if (isPromptFocused) {
                    Text(
                        text = "Keyboard typing active",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = if (tokens.isDark) Color(0xFF818CF8) else Color(0xFF4F46E5)
                    )
                }
            }

            val promptFieldShape = RoundedCornerShape(8.dp)
            val promptBorderColor = if (isPromptFocused) {
                if (tokens.isDark) Color(0xFF818CF8) else Color(0xFF4F46E5)
            } else {
                tokens.borderRim
            }
            val promptBg = if (tokens.isDark) Color(0xFF1E283D) else Color(0xFFFFFFFF)

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(36.dp)
                    .clip(promptFieldShape)
                    .background(promptBg)
                    .border(if (isPromptFocused) 1.5.dp else 1.dp, promptBorderColor, promptFieldShape)
                    .clickable {
                        if (hapticEnabled) haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        onTogglePromptFocus(!isPromptFocused)
                    }
                    .padding(horizontal = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Box(
                    modifier = Modifier.weight(1f),
                    contentAlignment = Alignment.CenterStart
                ) {
                    if (customPrompt.isEmpty()) {
                        Text(
                            text = "e.g. make this sound warmer...",
                            fontSize = 12.sp,
                            color = tokens.textSecondary.copy(alpha = 0.7f),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    } else {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = customPrompt,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Normal,
                                color = tokens.textPrimary,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            if (isPromptFocused) {
                                Text(
                                    text = "|",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (tokens.isDark) Color(0xFF818CF8) else Color(0xFF4F46E5)
                                )
                            }
                        }
                    }
                }

                if (customPrompt.isNotEmpty()) {
                    Box(
                        modifier = Modifier
                            .size(20.dp)
                            .clip(CircleShape)
                            .background(if (tokens.isDark) Color(0xFF2E3D5B) else Color(0xFFE2E8F0))
                            .clickable {
                                if (hapticEnabled) haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                onClearPrompt()
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Clear,
                            contentDescription = "Clear Prompt",
                            tint = tokens.textSecondary,
                            modifier = Modifier.size(12.dp)
                        )
                    }
                }
            }
        }

        // 4. Generate Button: Generate ✨
        val interactionSource = remember { MutableInteractionSource() }
        val isPressed by interactionSource.collectIsPressedAsState()
        val scale by animateFloatAsState(
            targetValue = if (isPressed && keyAnimationEnabled) 0.96f else 1.0f,
            animationSpec = tween(100),
            label = "generate_btn_scale"
        )

        val btnShape = RoundedCornerShape(10.dp)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(38.dp)
                .scale(scale)
                .clip(btnShape)
                .background(
                    Brush.horizontalGradient(
                        listOf(AiPillGradientStart, AiPillGradientEnd)
                    )
                )
                .clickable(
                    interactionSource = interactionSource,
                    indication = null
                ) {
                    if (hapticEnabled) {
                        haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                    }
                    onGenerate(selectedStyle, customPrompt)
                },
            contentAlignment = Alignment.Center
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text(
                    text = "Generate",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Icon(
                    imageVector = Icons.Filled.AutoAwesome,
                    contentDescription = null,
                    tint = Color(0xFFFDE047),
                    modifier = Modifier.size(14.dp)
                )
            }
        }
    }
}

/**
 * Individual Reply Tone Style Chip with subtle selected highlight.
 */
@Composable
private fun StyleChip(
    style: AiReplyStyle,
    isSelected: Boolean,
    onClick: () -> Unit,
    tokens: KeyboardColorTokens,
    keyAnimationEnabled: Boolean,
    modifier: Modifier = Modifier
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (isPressed && keyAnimationEnabled) 0.95f else 1.0f,
        animationSpec = tween(80),
        label = "chip_scale"
    )

    val chipShape = RoundedCornerShape(8.dp)

    val bgColor = if (isSelected) {
        if (tokens.isDark) Color(0xFF312E81) else Color(0xFFDBEAFE)
    } else {
        tokens.keySurface
    }

    val borderColor = if (isSelected) {
        if (tokens.isDark) Color(0xFF818CF8) else Color(0xFF3B82F6)
    } else {
        tokens.borderRim
    }

    val textColor = if (isSelected) {
        if (tokens.isDark) Color(0xFFEEF2FF) else Color(0xFF1E40AF)
    } else {
        tokens.textSecondary
    }

    Box(
        modifier = modifier
            .height(30.dp)
            .scale(scale)
            .clip(chipShape)
            .background(bgColor)
            .border(if (isSelected) 1.5.dp else 1.dp, borderColor, chipShape)
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = onClick
            ),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = style.displayName,
            fontSize = 11.sp,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
            color = textColor,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}
