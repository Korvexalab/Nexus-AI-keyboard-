package com.aikeyboard.ime.ui

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.layout.LayoutCoordinates
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import com.aikeyboard.ime.KeyboardActionListener
import com.aikeyboard.ime.KeyboardMode
import com.aikeyboard.ime.ShiftState
import com.aikeyboard.ime.ui.theme.KeyboardColorTokens
import com.aikeyboard.ime.ui.theme.KeyboardThemes

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
                        text = "${emojis.first()} $name",
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

            // Backspace Key
            SpecialKey(
                icon = Icons.Filled.Backspace,
                modifier = Modifier.weight(1.4f),
                tokens = tokens,
                keyHeightDp = keyHeightDp,
                keyAnimationEnabled = keyAnimationEnabled,
                hapticEnabled = hapticEnabled,
                onClick = { listener.onBackspace() }
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
