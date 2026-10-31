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
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aikeyboard.ime.ai.AiAction
import com.aikeyboard.ime.ai.AiPersona
import com.aikeyboard.ime.ai.AiReplyGenerator
import com.aikeyboard.ime.ai.AiReplyStyle
import com.aikeyboard.ime.ai.AiRequest
import com.aikeyboard.ime.ai.GeminiException
import com.aikeyboard.ime.ui.theme.AiPillGradientEnd
import com.aikeyboard.ime.ui.theme.AiPillGradientStart
import com.aikeyboard.ime.ui.theme.KeyboardColorTokens
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

enum class AiPanelMode {
    ACTION_BOARD,
    ASK_AI
}

enum class InputTarget {
    HOST,
    AI_CONTEXT
}

/**
 * Milestone 3.2 — Explicit UI state for Writing Action suggestions.
 */
sealed interface AiGenerationState {
    object Idle : AiGenerationState
    object Loading : AiGenerationState
    data class Success(val suggestions: List<String>) : AiGenerationState
    data class Error(val message: String) : AiGenerationState
}

/**
 * Milestone 3.2 — Explicit UI state for Ask AI queries.
 */
sealed interface AskAiState {
    object Idle : AskAiState
    object Loading : AskAiState
    data class Success(val answer: String) : AskAiState
    data class Error(val message: String) : AskAiState
}

/**
 * Milestone 2 & 3.2: AI Command Center Panel
 *
 * Exclusively connected to real Google Gemini AI via ReplyGenerator abstraction.
 * Uses Kotlin coroutines and explicit UI states (Idle, Loading, Success, Error).
 * Never blocks the main/rendering thread and avoids accidental duplicate requests.
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
    isMoreExpanded: Boolean = false,
    onToggleMoreExpanded: (Boolean) -> Unit = {},
    hostText: String = "",
    onReplace: ((String) -> Unit)? = null,
    onGenerate: (AiAction, AiPersona, String) -> Unit = { _, _, _ -> },
    onInsertAskAiResult: ((String) -> Unit)? = null,
    onClose: () -> Unit,
    tokens: KeyboardColorTokens,
    hapticEnabled: Boolean = true,
    keyAnimationEnabled: Boolean = true,
    modifier: Modifier = Modifier
) {
    val haptic = LocalHapticFeedback.current
    val coroutineScope = rememberCoroutineScope()

    val panelShape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp, bottomStart = 8.dp, bottomEnd = 8.dp)
    val panelBg = if (tokens.isDark) Color(0xFF0F172A) else Color(0xFFF8FAFC)
    val panelBorder = if (tokens.isDark) Color(0x33818CF8) else Color(0x40CBD5E1)

    // State management for real async Gemini generation
    var actionGenerationState by remember { mutableStateOf<AiGenerationState>(AiGenerationState.Idle) }
    var askAiState by remember { mutableStateOf<AskAiState>(AskAiState.Idle) }
    var retryTrigger by remember { mutableStateOf(0) }
    var replacedIdx by remember { mutableStateOf<Int?>(null) }

    val isContextFocused = inputTarget == InputTarget.AI_CONTEXT
    val isActionLoading = actionGenerationState is AiGenerationState.Loading

    // Trigger asynchronous generation via ReplyGenerator abstraction when action, persona, host context, or retry changes
    LaunchedEffect(panelMode, selectedAction, selectedPersona, hostText, retryTrigger) {
        if (panelMode == AiPanelMode.ACTION_BOARD) {
            actionGenerationState = AiGenerationState.Loading
            replacedIdx = null
            try {
                val request = AiRequest(
                    action = selectedAction,
                    persona = selectedPersona,
                    context = hostText
                )
                val results = withContext(Dispatchers.IO) {
                    AiReplyGenerator.currentGenerator.generateSuggestions(request)
                }
                actionGenerationState = if (results.isNotEmpty()) {
                    AiGenerationState.Success(results)
                } else {
                    AiGenerationState.Error("Gemini was unable to generate suggestions. Please tap retry.")
                }
            } catch (e: Throwable) {
                actionGenerationState = AiGenerationState.Error(
                    e.message ?: "Unable to connect to Gemini AI. Please check your network and tap retry."
                )
            }
        }
    }

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
                        contentDescription = "Back",
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

                    // Static Gemini badge for Ask AI mode
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (tokens.isDark) Color(0xFF312E81) else Color(0xFFE0E7FF))
                            .border(
                                1.dp,
                                if (tokens.isDark) Color(0xFF818CF8) else Color(0xFF6366F1),
                                RoundedCornerShape(6.dp)
                            )
                            .padding(horizontal = 6.dp, vertical = 2.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "✨ Gemini Flash",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (tokens.isDark) Color(0xFFC7D2FE) else Color(0xFF4338CA)
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

            // Ask ✨ Button (debounced during generation)
            val isAskLoading = askAiState is AskAiState.Loading
            ActionPrimaryButton(
                label = if (isAskLoading) "thinking ✨" else "ask",
                enabled = !isAskLoading && contextText.isNotBlank(),
                onClick = {
                    val q = contextText.trim()
                    if (q.isNotEmpty() && !isAskLoading) {
                        onSetInputTarget(InputTarget.HOST)
                        askAiState = AskAiState.Loading
                        coroutineScope.launch {
                            try {
                                val answer = withContext(Dispatchers.IO) {
                                    AiReplyGenerator.currentGenerator.generateAskAi(q, selectedPersona)
                                }
                                askAiState = AskAiState.Success(answer)
                            } catch (e: Throwable) {
                                askAiState = AskAiState.Error(
                                    e.message ?: "Unable to reach Gemini AI right now. Please tap retry."
                                )
                            }
                        }
                    }
                },
                tokens = tokens,
                hapticEnabled = hapticEnabled,
                keyAnimationEnabled = keyAnimationEnabled
            )

            // Ask AI Response or Loading / Error Card
            when (val state = askAiState) {
                is AskAiState.Loading -> {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (tokens.isDark) Color(0xFF141E30) else Color(0xFFF1F5F9))
                            .padding(10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "thinking ✨",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = if (tokens.isDark) Color(0xFF818CF8) else Color(0xFF4F46E5)
                        )
                    }
                }
                is AskAiState.Error -> {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (tokens.isDark) Color(0xFF261218) else Color(0xFFFEF2F2))
                            .border(1.dp, Color(0xFFF87171), RoundedCornerShape(8.dp))
                            .padding(8.dp)
                    ) {
                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            verticalArrangement = Arrangement.spacedBy(5.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = state.message,
                                fontSize = 10.sp,
                                color = Color(0xFFEF4444),
                                textAlign = TextAlign.Center
                            )
                            val q = contextText.trim()
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(Color(0xFFDC2626))
                                    .clickable {
                                        if (hapticEnabled) haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                        if (q.isNotEmpty()) {
                                            askAiState = AskAiState.Loading
                                            coroutineScope.launch {
                                                try {
                                                    val answer = withContext(Dispatchers.IO) {
                                                        AiReplyGenerator.currentGenerator.generateAskAi(q, selectedPersona)
                                                    }
                                                    askAiState = AskAiState.Success(answer)
                                                } catch (e: Throwable) {
                                                    askAiState = AskAiState.Error(
                                                        e.message ?: "Unable to reach Gemini AI right now. Please tap retry."
                                                    )
                                                }
                                            }
                                        }
                                    }
                                    .padding(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Text(
                                    text = "Retry Gemini 🔄",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            }
                        }
                    }
                }
                is AskAiState.Success -> {
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
                                    text = state.answer,
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
                                                insertFn(state.answer)
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
                is AskAiState.Idle -> { /* Idle */ }
            }

        } else {
            // ==========================================
            // MODE A: ACTION BOARD (DEFAULT)
            // ==========================================
            // 1. Header: ← ✨ AI + Close (×)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(24.dp)
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
                            imageVector = Icons.Filled.ArrowBack,
                            contentDescription = "Back to Keyboard",
                            tint = tokens.textSecondary,
                            modifier = Modifier.size(13.dp)
                        )
                    }

                    Text(text = "✨", fontSize = 13.sp)
                    Text(
                        text = "AI Command Center",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = tokens.textPrimary
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (tokens.isDark) Color(0xFF312E81) else Color(0xFFE0E7FF))
                            .border(
                                1.dp,
                                if (tokens.isDark) Color(0xFF818CF8) else Color(0xFF6366F1),
                                RoundedCornerShape(6.dp)
                            )
                            .padding(horizontal = 7.dp, vertical = 2.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "✨ Gemini Flash",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (tokens.isDark) Color(0xFFC7D2FE) else Color(0xFF4338CA)
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

            // 2. Primary Actions: Reply, Rewrite + More (collapsible)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                ActionChip(
                    action = AiAction.REPLY,
                    isSelected = selectedAction == AiAction.REPLY,
                    enabled = !isActionLoading,
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
                    action = AiAction.REWRITE,
                    isSelected = selectedAction == AiAction.REWRITE,
                    enabled = !isActionLoading,
                    onClick = {
                        onSetInputTarget(InputTarget.HOST)
                        onSelectAction(AiAction.REWRITE)
                    },
                    tokens = tokens,
                    keyAnimationEnabled = keyAnimationEnabled,
                    hapticEnabled = hapticEnabled,
                    modifier = Modifier.weight(1f)
                )

                // More toggle chip
                val moreSelected = isMoreExpanded || (selectedAction != AiAction.REPLY && selectedAction != AiAction.REWRITE)
                val moreBg = if (moreSelected) {
                    if (tokens.isDark) Color(0xFF261D52) else Color(0xFFDBEAFE)
                } else {
                    if (tokens.isDark) Color(0xFF1E283D) else Color(0xFFF1F5F9)
                }
                val moreBorder = if (moreSelected) {
                    if (tokens.isDark) Color(0xFF818CF8) else Color(0xFF3B82F6)
                } else {
                    tokens.borderRim
                }
                val moreText = if (moreSelected) {
                    if (tokens.isDark) Color(0xFFC7D2FE) else Color(0xFF1D4ED8)
                } else {
                    tokens.textPrimary
                }

                Box(
                    modifier = Modifier
                        .height(30.dp)
                        .weight(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .background(moreBg)
                        .border(1.dp, moreBorder, RoundedCornerShape(8.dp))
                        .clickable {
                            if (hapticEnabled) haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            onSetInputTarget(InputTarget.HOST)
                            onToggleMoreExpanded(!isMoreExpanded)
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(3.dp)
                    ) {
                        Text(
                            text = "More",
                            fontSize = 11.sp,
                            fontWeight = if (moreSelected) FontWeight.SemiBold else FontWeight.Normal,
                            color = moreText
                        )
                        Icon(
                            imageVector = if (isMoreExpanded) Icons.Filled.ExpandLess else Icons.Filled.ExpandMore,
                            contentDescription = null,
                            tint = moreText,
                            modifier = Modifier.size(13.dp)
                        )
                    }
                }
            }

            // 3. Secondary Actions Collapsible: Continue, Start, Ask AI, Create
            if (isMoreExpanded) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        ActionChip(
                            action = AiAction.CONTINUE,
                            isSelected = selectedAction == AiAction.CONTINUE,
                            enabled = !isActionLoading,
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
                            enabled = !isActionLoading,
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
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        ActionChip(
                            action = AiAction.ASK_AI,
                            isSelected = selectedAction == AiAction.ASK_AI,
                            enabled = !isActionLoading,
                            onClick = {
                                onSetInputTarget(InputTarget.HOST)
                                onSetPanelMode(AiPanelMode.ASK_AI)
                            },
                            tokens = tokens,
                            keyAnimationEnabled = keyAnimationEnabled,
                            hapticEnabled = hapticEnabled,
                            modifier = Modifier.weight(1f)
                        )
                        ActionChip(
                            action = AiAction.CREATE,
                            isSelected = selectedAction == AiAction.CREATE,
                            enabled = !isActionLoading,
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
            }

            // 4. In-Panel Horizontal Scrolling Persona Selector (NO DROPDOWN!)
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
                                .clickable(enabled = !isActionLoading) {
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

            // 5. AI RESULTS SECTION
            // Explicit states: Loading (generating ✨), Error (retry), Success (result cards)
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (hostText.isNotBlank()) "AI RESULTS • CONTEXT: \"${hostText.take(20)}\"" else "AI RESULTS",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = tokens.textSecondary
                    )
                    Text(
                        text = when (val state = actionGenerationState) {
                            is AiGenerationState.Loading -> "generating..."
                            is AiGenerationState.Success -> "${state.suggestions.size} suggestions (Gemini Flash)"
                            is AiGenerationState.Error -> "error"
                            is AiGenerationState.Idle -> ""
                        },
                        fontSize = 10.sp,
                        color = if (tokens.isDark) Color(0xFF818CF8) else Color(0xFF4F46E5)
                    )
                }

                when (val state = actionGenerationState) {
                    is AiGenerationState.Loading -> {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (tokens.isDark) Color(0xFF141E30) else Color(0xFFF1F5F9))
                                .padding(vertical = 14.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(2.dp)
                            ) {
                                Text(
                                    text = "generating ✨",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = if (tokens.isDark) Color(0xFF818CF8) else Color(0xFF4F46E5)
                                )
                                Text(
                                    text = "crafting natural responses with gemini flash...",
                                    fontSize = 10.sp,
                                    color = tokens.textSecondary
                                )
                            }
                        }
                    }

                    is AiGenerationState.Error -> {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (tokens.isDark) Color(0xFF261218) else Color(0xFFFEF2F2))
                                .border(1.dp, Color(0xFFF87171), RoundedCornerShape(8.dp))
                                .padding(10.dp)
                        ) {
                            Column(
                                modifier = Modifier.fillMaxWidth(),
                                verticalArrangement = Arrangement.spacedBy(6.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    text = state.message,
                                    fontSize = 10.sp,
                                    color = Color(0xFFEF4444),
                                    textAlign = TextAlign.Center
                                )
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(Color(0xFFDC2626))
                                        .clickable {
                                            if (hapticEnabled) haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                            retryTrigger++
                                        }
                                        .padding(horizontal = 14.dp, vertical = 6.dp)
                                ) {
                                    Text(
                                        text = "Retry Gemini 🔄",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White
                                    )
                                }
                            }
                        }
                    }

                    is AiGenerationState.Success -> {
                        state.suggestions.forEachIndexed { idx, suggestion ->
                            val isReplaced = replacedIdx == idx
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (tokens.isDark) Color(0xFF141E30) else Color(0xFFFFFFFF))
                                    .border(
                                        1.dp,
                                        if (isReplaced) Color(0xFF10B981) else if (tokens.isDark) Color(0x33818CF8) else Color(0x40CBD5E1),
                                        RoundedCornerShape(8.dp)
                                    )
                                    .padding(8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = suggestion,
                                    fontSize = 11.sp,
                                    color = tokens.textPrimary,
                                    modifier = Modifier.weight(1f).padding(end = 8.dp)
                                )

                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(if (isReplaced) Color(0xFF059669) else Color(0xFF4F46E5))
                                        .clickable {
                                            if (hapticEnabled) haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                            onSetInputTarget(InputTarget.HOST)
                                            replacedIdx = idx
                                            onReplace?.invoke(suggestion)
                                        }
                                        .padding(horizontal = 8.dp, vertical = 4.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = if (isReplaced) "Replaced" else "Replace",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White
                                    )
                                }
                            }
                        }
                    }

                    is AiGenerationState.Idle -> { /* Idle */ }
                }
            }
        }
    }
}

/**
 * Action button chip with highlighted selection state and disable support during generation
 */
@Composable
private fun ActionChip(
    action: AiAction,
    isSelected: Boolean,
    enabled: Boolean = true,
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
        targetValue = if (isPressed && keyAnimationEnabled && enabled) 0.95f else 1.0f,
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
                enabled = enabled,
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
 * Gradient Action Button for generate / ask with disabled/loading state
 */
@Composable
private fun ActionPrimaryButton(
    label: String,
    enabled: Boolean = true,
    onClick: () -> Unit,
    tokens: KeyboardColorTokens,
    hapticEnabled: Boolean,
    keyAnimationEnabled: Boolean
) {
    val haptic = LocalHapticFeedback.current
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (isPressed && keyAnimationEnabled && enabled) 0.96f else 1.0f,
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
                if (enabled) {
                    Brush.horizontalGradient(
                        listOf(AiPillGradientStart, AiPillGradientEnd)
                    )
                } else {
                    Brush.horizontalGradient(
                        listOf(AiPillGradientStart.copy(alpha = 0.5f), AiPillGradientEnd.copy(alpha = 0.5f))
                    )
                }
            )
            .clickable(
                enabled = enabled,
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
