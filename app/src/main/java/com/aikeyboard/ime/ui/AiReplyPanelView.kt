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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
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
import com.aikeyboard.ime.ai.AiAction
import com.aikeyboard.ime.ai.AiPersona
import com.aikeyboard.ime.ai.AiReplyGenerator
import com.aikeyboard.ime.ai.AiReplyStyle
import com.aikeyboard.ime.ui.theme.AiPillGradientEnd
import com.aikeyboard.ime.ui.theme.AiPillGradientStart
import com.aikeyboard.ime.ui.theme.KeyboardColorTokens

enum class AiPanelMode {
    ACTION_BOARD,
    ASK_AI
}

enum class InputTarget {
    HOST,
    AI_CONTEXT
}

/**
 * Milestone 2: AI Command Center Panel
 *
 * Two main UI modes:
 * Mode A: AI Action Board
 * Mode B: Ask AI
 *
 * Explicit InputTarget architecture:
 * - When context/question field is tapped: inputTarget = AI_CONTEXT
 * - When non-text controls (actions, persona, more, generate, back, close) are tapped: inputTarget = HOST
 * - The IME keyboard remains completely stable and never hides/reopens.
 * - In-panel horizontal scrolling for persona selector (NO dropdowns).
 */
@Composable
fun AiReplyPanelView(
    panelMode: AiPanelMode = AiPanelMode.ACTION_BOARD,
    onSetPanelMode: (AiPanelMode) -> Unit = {},
    selectedAction: AiAction = AiAction.REPLY,
    onSelectAction: (AiAction) -> Unit = {},
    selectedPersona: AiPersona = AiPersona.FRIENDLY,
    onSelectPersona: (AiPersona) -> Unit = {},
    contextText: String = "",
    onClearPrompt: () -> Unit = {},
    inputTarget: InputTarget = InputTarget.HOST,
    onSetInputTarget: (InputTarget) -> Unit = {},
    isContextExpanded: Boolean = false,
    onToggleContextExpanded: (Boolean) -> Unit = {},
    isMoreExpanded: Boolean = false,
    onToggleMoreExpanded: (Boolean) -> Unit = {},
    onGenerate: (AiAction, AiPersona, String) -> Unit,
    onInsertAskAiResult: ((String) -> Unit)? = null,
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

    var askAiResponse by remember { mutableStateOf<String?>(null) }
    val isContextFocused = inputTarget == InputTarget.AI_CONTEXT

    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(panelShape)
            .background(panelBg)
            .border(1.dp, panelBorder, panelShape)
            .padding(horizontal = 12.dp, vertical = 7.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        // ==========================================
        // MODE B: ASK AI MODE
        // ==========================================
        if (panelMode == AiPanelMode.ASK_AI) {
            // Header: [← writing actions]               [🧠 ask ai] [×]
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(if (tokens.isDark) Color(0xFF1E283D) else Color(0xFFE2E8F0))
                        .clickable {
                            if (hapticEnabled) haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            onSetInputTarget(InputTarget.HOST)
                            onSetPanelMode(AiPanelMode.ACTION_BOARD)
                        }
                        .padding(horizontal = 8.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        imageVector = Icons.Filled.ArrowBack,
                        contentDescription = "Return to action board",
                        tint = tokens.textSecondary,
                        modifier = Modifier.size(12.dp)
                    )
                    Text(
                        text = "writing actions",
                        fontSize = 11.sp,
                        color = tokens.textPrimary,
                        fontWeight = FontWeight.Medium
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(text = "🧠", fontSize = 13.sp)
                        Text(
                            text = "ask ai",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = tokens.textPrimary
                        )
                    }

                    Box(
                        modifier = Modifier
                            .size(22.dp)
                            .clip(CircleShape)
                            .background(if (tokens.isDark) Color(0xFF1E283D) else Color(0xFFE2E8F0))
                            .clickable {
                                if (hapticEnabled) haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                onSetInputTarget(InputTarget.HOST)
                                onClose()
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Close,
                            contentDescription = "Close AI Panel",
                            tint = tokens.textSecondary,
                            modifier = Modifier.size(12.dp)
                        )
                    }
                }
            }

            // Question prompt field
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    text = "ask or instruct ai",
                    fontSize = 11.sp,
                    color = tokens.textSecondary,
                    fontWeight = FontWeight.Medium
                )

                val promptFieldShape = RoundedCornerShape(8.dp)
                val promptBorderColor = if (isContextFocused) {
                    if (tokens.isDark) Color(0xFF818CF8) else Color(0xFF4F46E5)
                } else {
                    tokens.borderRim
                }
                val promptBg = if (tokens.isDark) Color(0xFF1E283D) else Color(0xFFFFFFFF)

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(34.dp)
                        .clip(promptFieldShape)
                        .background(promptBg)
                        .border(if (isContextFocused) 1.5.dp else 1.dp, promptBorderColor, promptFieldShape)
                        .clickable {
                            if (hapticEnabled) haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            onSetInputTarget(InputTarget.AI_CONTEXT)
                        }
                        .padding(horizontal = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Box(modifier = Modifier.weight(1f)) {
                        if (contextText.isEmpty()) {
                            Text(
                                text = "type your question...",
                                fontSize = 11.sp,
                                color = tokens.textSecondary.copy(alpha = 0.7f),
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        } else {
                            Text(
                                text = contextText,
                                fontSize = 11.sp,
                                color = tokens.textPrimary,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }

                    if (contextText.isNotEmpty()) {
                        Box(
                            modifier = Modifier
                                .size(18.dp)
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
                                contentDescription = "Clear",
                                tint = tokens.textSecondary,
                                modifier = Modifier.size(10.dp)
                            )
                        }
                    }
                }
            }

            // Ask ✨ Button
            ActionPrimaryButton(
                label = "ask",
                onClick = {
                    onSetInputTarget(InputTarget.HOST)
                    val answer = AiReplyGenerator.generateMockAskAiResponse(contextText, selectedPersona)
                    askAiResponse = answer
                },
                tokens = tokens,
                hapticEnabled = hapticEnabled,
                keyAnimationEnabled = keyAnimationEnabled
            )

            // AI Response Card (proper response card/container with insert button)
            askAiResponse?.let { resp ->
                Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(
                        text = "ai response",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = tokens.textSecondary
                    )
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (tokens.isDark) Color(0xFF141E30) else Color(0xFFF1F5F9))
                            .border(1.dp, if (tokens.isDark) Color(0x33818CF8) else Color(0x40CBD5E1), RoundedCornerShape(8.dp))
                            .padding(8.dp)
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(
                                text = resp,
                                fontSize = 11.sp,
                                color = tokens.textPrimary,
                                lineHeight = 15.sp
                            )
                            onInsertAskAiResult?.let { insertFn ->
                                Box(
                                    modifier = Modifier
                                        .align(Alignment.End)
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(Color(0xFF4F46E5))
                                        .clickable {
                                            if (hapticEnabled) haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                            onSetInputTarget(InputTarget.HOST)
                                            insertFn(resp)
                                        }
                                        .padding(horizontal = 8.dp, vertical = 3.dp)
                                ) {
                                    Text(
                                        text = "insert",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White
                                    )
                                }
                            }
                        }
                    }
                }
            }

        } else {
            // ==========================================
            // MODE A: ACTION BOARD (DEFAULT)
            // ==========================================
            // 1. Header: ✨ ai command center + Close (×)
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
                        modifier = Modifier.size(15.dp)
                    )
                    Text(
                        text = "ai command center",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = tokens.textPrimary
                    )
                }

                Box(
                    modifier = Modifier
                        .size(22.dp)
                        .clip(CircleShape)
                        .background(if (tokens.isDark) Color(0xFF1E283D) else Color(0xFFE2E8F0))
                        .clickable {
                            if (hapticEnabled) haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            onSetInputTarget(InputTarget.HOST)
                            onClose()
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Filled.Close,
                        contentDescription = "Close AI Panel",
                        tint = tokens.textSecondary,
                        modifier = Modifier.size(12.dp)
                    )
                }
            }

            // 2. Primary Actions: 2x2 Grid
            // [ reply ]       [ ask ai ]
            // [ continue ]    [ start ]
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    ActionChip(
                        action = AiAction.REPLY,
                        isSelected = selectedAction == AiAction.REPLY,
                        onClick = {
                            onSetInputTarget(InputTarget.HOST)
                            onSelectAction(AiAction.REPLY)
                        },
                        tokens = tokens,
                        keyAnimationEnabled = keyAnimationEnabled,
                        hapticEnabled = hapticEnabled,
                        modifier = Modifier.weight(1f)
                    )
                    ActionChip(
                        action = AiAction.ASK_AI,
                        isSelected = selectedAction == AiAction.ASK_AI,
                        onClick = {
                            onSetInputTarget(InputTarget.HOST)
                            onSetPanelMode(AiPanelMode.ASK_AI)
                        },
                        tokens = tokens,
                        keyAnimationEnabled = keyAnimationEnabled,
                        hapticEnabled = hapticEnabled,
                        modifier = Modifier.weight(1f)
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    ActionChip(
                        action = AiAction.CONTINUE,
                        isSelected = selectedAction == AiAction.CONTINUE,
                        onClick = {
                            onSetInputTarget(InputTarget.HOST)
                            onSelectAction(AiAction.CONTINUE)
                        },
                        tokens = tokens,
                        keyAnimationEnabled = keyAnimationEnabled,
                        hapticEnabled = hapticEnabled,
                        modifier = Modifier.weight(1f)
                    )
                    ActionChip(
                        action = AiAction.START,
                        isSelected = selectedAction == AiAction.START,
                        onClick = {
                            onSetInputTarget(InputTarget.HOST)
                            onSelectAction(AiAction.START)
                        },
                        tokens = tokens,
                        keyAnimationEnabled = keyAnimationEnabled,
                        hapticEnabled = hapticEnabled,
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            // 3. More Actions (Collapsible)
            Row(
                modifier = Modifier
                    .clickable {
                        if (hapticEnabled) haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        onSetInputTarget(InputTarget.HOST)
                        onToggleMoreExpanded(!isMoreExpanded)
                    }
                    .padding(vertical = 1.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(3.dp)
            ) {
                Text(
                    text = "more",
                    fontSize = 11.sp,
                    color = tokens.textSecondary,
                    fontWeight = FontWeight.Medium
                )
                Icon(
                    imageVector = if (isMoreExpanded) Icons.Filled.ExpandLess else Icons.Filled.ExpandMore,
                    contentDescription = null,
                    tint = tokens.textSecondary,
                    modifier = Modifier.size(14.dp)
                )
            }

            if (isMoreExpanded) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    ActionChip(
                        action = AiAction.REWRITE,
                        isSelected = selectedAction == AiAction.REWRITE,
                        onClick = {
                            onSetInputTarget(InputTarget.HOST)
                            onSelectAction(AiAction.REWRITE)
                        },
                        tokens = tokens,
                        keyAnimationEnabled = keyAnimationEnabled,
                        hapticEnabled = hapticEnabled,
                        modifier = Modifier.weight(1f)
                    )
                    ActionChip(
                        action = AiAction.CREATE,
                        isSelected = selectedAction == AiAction.CREATE,
                        onClick = {
                            onSetInputTarget(InputTarget.HOST)
                            onSelectAction(AiAction.CREATE)
                        },
                        tokens = tokens,
                        keyAnimationEnabled = keyAnimationEnabled,
                        hapticEnabled = hapticEnabled,
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            // 4. In-Panel Horizontal Scrolling Persona Selector (NO DROPDOWN!)
            // persona
            // [😊 friendly] [💼 freelancer] [😂 funny] [⚡ short] [💬 natural] [❤️ romantic]
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    text = "persona",
                    fontSize = 11.sp,
                    color = tokens.textSecondary,
                    fontWeight = FontWeight.Medium
                )

                LazyRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    items(AiPersona.values()) { persona ->
                        val isSelected = selectedPersona == persona
                        val chipBg = if (isSelected) {
                            if (tokens.isDark) Color(0xFF261D52) else Color(0xFFDBEAFE)
                        } else {
                            if (tokens.isDark) Color(0xFF1E283D) else Color(0xFFF1F5F9)
                        }
                        val chipBorder = if (isSelected) {
                            if (tokens.isDark) Color(0xFF818CF8) else Color(0xFF3B82F6)
                        } else {
                            tokens.borderRim
                        }
                        val chipText = if (isSelected) {
                            if (tokens.isDark) Color(0xFFC7D2FE) else Color(0xFF1D4ED8)
                        } else {
                            tokens.textPrimary
                        }

                        Row(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(chipBg)
                                .border(1.dp, chipBorder, RoundedCornerShape(6.dp))
                                .clickable {
                                    if (hapticEnabled) haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                    onSetInputTarget(InputTarget.HOST)
                                    onSelectPersona(persona)
                                }
                                .padding(horizontal = 8.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Text(text = persona.emoji, fontSize = 11.sp)
                            Text(
                                text = persona.displayName,
                                fontSize = 11.sp,
                                fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                                color = chipText
                            )
                        }
                    }
                }
            }

            // 5. Context / Instruction (Collapsible by default)
            if (!isContextExpanded && contextText.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(30.dp)
                        .clip(RoundedCornerShape(6.dp))
                        .background(if (tokens.isDark) Color(0xFF131D31) else Color(0xFFF1F5F9))
                        .border(
                            1.dp,
                            if (tokens.isDark) Color(0x40818CF8) else Color(0x40CBD5E1),
                            RoundedCornerShape(6.dp)
                        )
                        .clickable {
                            if (hapticEnabled) haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            onToggleContextExpanded(true)
                            onSetInputTarget(InputTarget.AI_CONTEXT)
                        }
                        .padding(horizontal = 8.dp),
                    contentAlignment = Alignment.CenterStart
                ) {
                    Text(
                        text = "+ add context or instruction...",
                        fontSize = 11.sp,
                        color = tokens.textSecondary,
                        fontWeight = FontWeight.Medium
                    )
                }
            } else {
                Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "what should ai work with?",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium,
                            color = tokens.textSecondary
                        )
                        if (isContextFocused) {
                            Text(
                                text = "Keyboard typing active",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = if (tokens.isDark) Color(0xFF818CF8) else Color(0xFF4F46E5)
                            )
                        }
                    }

                    val promptFieldShape = RoundedCornerShape(8.dp)
                    val promptBorderColor = if (isContextFocused) {
                        if (tokens.isDark) Color(0xFF818CF8) else Color(0xFF4F46E5)
                    } else {
                        tokens.borderRim
                    }
                    val promptBg = if (tokens.isDark) Color(0xFF1E283D) else Color(0xFFFFFFFF)

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(34.dp)
                            .clip(promptFieldShape)
                            .background(promptBg)
                            .border(if (isContextFocused) 1.5.dp else 1.dp, promptBorderColor, promptFieldShape)
                            .clickable {
                                if (hapticEnabled) haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                onSetInputTarget(InputTarget.AI_CONTEXT)
                            }
                            .padding(horizontal = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Box(
                            modifier = Modifier.weight(1f),
                            contentAlignment = Alignment.CenterStart
                        ) {
                            if (contextText.isEmpty()) {
                                Text(
                                    text = "type or paste context here...",
                                    fontSize = 11.sp,
                                    color = tokens.textSecondary.copy(alpha = 0.7f),
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            } else {
                                Text(
                                    text = contextText,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Normal,
                                    color = tokens.textPrimary,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            if (contextText.isNotEmpty()) {
                                Box(
                                    modifier = Modifier
                                        .size(18.dp)
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
                                        modifier = Modifier.size(10.dp)
                                    )
                                }
                            }
                            if (contextText.isEmpty()) {
                                Box(
                                    modifier = Modifier
                                        .size(18.dp)
                                        .clip(CircleShape)
                                        .clickable {
                                            onToggleContextExpanded(false)
                                            onSetInputTarget(InputTarget.HOST)
                                        },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Filled.KeyboardArrowUp,
                                        contentDescription = "Collapse",
                                        tint = tokens.textSecondary,
                                        modifier = Modifier.size(12.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // 6. Generate Button: generate ✨
            ActionPrimaryButton(
                label = "generate",
                onClick = {
                    onSetInputTarget(InputTarget.HOST)
                    onGenerate(selectedAction, selectedPersona, contextText)
                },
                tokens = tokens,
                hapticEnabled = hapticEnabled,
                keyAnimationEnabled = keyAnimationEnabled
            )
        }
    }
}

/**
 * Action button chip with highlighted selection state
 */
@Composable
private fun ActionChip(
    action: AiAction,
    isSelected: Boolean,
    onClick: () -> Unit,
    tokens: KeyboardColorTokens,
    keyAnimationEnabled: Boolean,
    hapticEnabled: Boolean,
    modifier: Modifier = Modifier
) {
    val haptic = LocalHapticFeedback.current
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (isPressed && keyAnimationEnabled) 0.95f else 1.0f,
        animationSpec = tween(80),
        label = "action_chip_scale"
    )

    val chipShape = RoundedCornerShape(8.dp)
    val bg = if (isSelected) {
        if (tokens.isDark) Color(0xFF261D52) else Color(0xFFDBEAFE)
    } else {
        if (tokens.isDark) Color(0xFF1E283D) else Color(0xFFF1F5F9)
    }
    val border = if (isSelected) {
        if (tokens.isDark) Color(0xFF818CF8) else Color(0xFF3B82F6)
    } else {
        tokens.borderRim
    }
    val textColor = if (isSelected) {
        if (tokens.isDark) Color(0xFFC7D2FE) else Color(0xFF1D4ED8)
    } else {
        tokens.textPrimary
    }

    Box(
        modifier = modifier
            .height(30.dp)
            .scale(scale)
            .clip(chipShape)
            .background(bg)
            .border(1.dp, border, chipShape)
            .clickable(
                interactionSource = interactionSource,
                indication = null
            ) {
                if (hapticEnabled) haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                onClick()
            },
        contentAlignment = Alignment.Center
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            modifier = Modifier.padding(horizontal = 6.dp)
        ) {
            Text(text = action.emoji, fontSize = 11.sp)
            Text(
                text = action.displayName,
                fontSize = 11.sp,
                fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Medium,
                color = textColor,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

/**
 * Gradient Action Button for generate / ask
 */
@Composable
private fun ActionPrimaryButton(
    label: String,
    onClick: () -> Unit,
    tokens: KeyboardColorTokens,
    hapticEnabled: Boolean,
    keyAnimationEnabled: Boolean
) {
    val haptic = LocalHapticFeedback.current
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (isPressed && keyAnimationEnabled) 0.96f else 1.0f,
        animationSpec = tween(100),
        label = "btn_scale"
    )

    val btnShape = RoundedCornerShape(8.dp)
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(34.dp)
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
                if (hapticEnabled) haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                onClick()
            },
        contentAlignment = Alignment.Center
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(
                text = label,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
            Icon(
                imageVector = Icons.Filled.AutoAwesome,
                contentDescription = null,
                tint = Color(0xFFFDE047),
                modifier = Modifier.size(13.dp)
            )
        }
    }
}

/**
 * Backwards compatibility overload for legacy unit tests
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
    AiReplyPanelView(
        panelMode = AiPanelMode.ACTION_BOARD,
        onSetPanelMode = {},
        selectedAction = AiAction.REPLY,
        onSelectAction = { },
        selectedPersona = when (selectedStyle) {
            AiReplyStyle.REPLY -> AiPersona.FRIENDLY
            AiReplyStyle.FRIENDLY -> AiPersona.FRIENDLY
            AiReplyStyle.SHORT -> AiPersona.SHORT
            AiReplyStyle.PROFESSIONAL -> AiPersona.PROFESSIONAL
            AiReplyStyle.FUNNY -> AiPersona.FUNNY
        },
        onSelectPersona = { persona ->
            val style = when (persona) {
                AiPersona.FRIENDLY -> AiReplyStyle.FRIENDLY
                AiPersona.FREELANCER, AiPersona.PROFESSIONAL -> AiReplyStyle.PROFESSIONAL
                AiPersona.FUNNY -> AiReplyStyle.FUNNY
                AiPersona.SHORT -> AiReplyStyle.SHORT
                AiPersona.NATURAL -> AiReplyStyle.FRIENDLY
                AiPersona.ROMANTIC -> AiReplyStyle.FRIENDLY
            }
            onSelectStyle(style)
        },
        contextText = customPrompt,
        onClearPrompt = onClearPrompt,
        inputTarget = if (isPromptFocused) InputTarget.AI_CONTEXT else InputTarget.HOST,
        onSetInputTarget = { target -> onTogglePromptFocus(target == InputTarget.AI_CONTEXT) },
        onGenerate = { _, persona, ctx ->
            val style = when (persona) {
                AiPersona.FRIENDLY -> AiReplyStyle.FRIENDLY
                AiPersona.FREELANCER, AiPersona.PROFESSIONAL -> AiReplyStyle.PROFESSIONAL
                AiPersona.FUNNY -> AiReplyStyle.FUNNY
                AiPersona.SHORT -> AiReplyStyle.SHORT
                AiPersona.NATURAL -> AiReplyStyle.FRIENDLY
                AiPersona.ROMANTIC -> AiReplyStyle.FRIENDLY
            }
            onGenerate(style, ctx)
        },
        onClose = onClose,
        tokens = tokens,
        hapticEnabled = hapticEnabled,
        keyAnimationEnabled = keyAnimationEnabled,
        modifier = modifier
    )
}
