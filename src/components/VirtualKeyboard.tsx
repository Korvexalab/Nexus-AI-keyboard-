import React, { useState, useRef } from 'react';
import { KeyboardMode, ShiftState, KeyboardActionListener, KeyboardThemeId, KeyboardHeight } from '../types';
import { ArrowUp, CornerDownLeft, Delete, Smile } from 'lucide-react';
import { KeyboardToolbar } from './KeyboardToolbar';

interface VirtualKeyboardProps {
  mode: KeyboardMode;
  shiftState: ShiftState;
  listener: KeyboardActionListener;
  aiNoticeVisible?: boolean;
  enterLabel?: string;
  theme?: KeyboardThemeId;
  height?: KeyboardHeight;
  keyAnimationEnabled?: boolean;
  hapticEnabled?: boolean;
}

interface PopupState {
  char: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

// Curated high-performance emoji dataset grouped by categories
const EMOJI_CATEGORIES = [
  {
    id: 'smileys',
    name: 'Smileys',
    icon: '😊',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊',
      '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😋', '😛', '😜', '🤪', '😝',
      '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒',
      '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢',
      '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓',
      '🧐', '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨',
      '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱',
      '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👻', '👽', '🤖'
    ]
  },
  {
    id: 'gestures',
    name: 'Gestures',
    icon: '👍',
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '🫱', '🫲', '🫳', '🫴', '👌', '🤌', '🤏',
      '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️',
      '🫵', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '🫶', '👐', '🤲',
      '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '👃'
    ]
  },
  {
    id: 'hearts',
    name: 'Hearts & Symbols',
    icon: '❤️',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕',
      '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️',
      '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌',
      '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '💯', '💢', '💥', '💫'
    ]
  },
  {
    id: 'objects',
    name: 'Fun & Objects',
    icon: '🔥',
    emojis: [
      '🔥', '✨', '🌟', '⚡', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉',
      '⚽', '🏀', '🏈', '⚾', '🎾', '🎮', '🎯', '🎲', '🚀', '✈️', '🚗', '🚲',
      '📱', '💻', '📷', '💡', '🔑', '💎', '🔔', '📢', '🎧', '🎸', '🎨', '🎬'
    ]
  },
  {
    id: 'food_nature',
    name: 'Food & Nature',
    icon: '🍕',
    emojis: [
      '🍕', '🍔', '🍟', '🌭', '🍿', '🥓', '🍳', '🥞', '🥐', '☕', '🍵', '🧃',
      '🥤', '🍺', '🍻', '🍷', '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒',
      '🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐸', '🦄',
      '🐝', '🦋', '🌺', '🌸', '🌼', '🌻', '🌞', '🌙', '🌈', '⭐', '🍀', '🌴'
    ]
  }
];

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  mode,
  shiftState,
  listener,
  aiNoticeVisible = false,
  enterLabel = 'Enter',
  theme = 'midnight',
  height = 'normal',
  keyAnimationEnabled = true,
  hapticEnabled = true
}) => {
  const keyboardRef = useRef<HTMLDivElement>(null);

  // Currently held-down key for visual feedback
  const [activeKey, setActiveKey] = useState<string | null>(null);
  // Measured popup position anchored to the active pressed key
  const [activePopup, setActivePopup] = useState<PopupState | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('smileys');

  const triggerHaptic = () => {
    if (hapticEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(12);
      } catch {
        // Safe fallback if permissions restrict vibration in iframe
      }
    }
  };

  /**
   * M1D Fix: Precise popup positioning using measured key layout bounds.
   * - Horizontally centered over the pressed key
   * - Positioned above the key with a consistent small gap (4px)
   * - Never covers the pressed key itself (popupBottom = keyTop - gap)
   * - Never unnecessarily overlaps neighboring keys
   * - Clamped to visible keyboard bounds (left, right, and top available space)
   */
  const computeAnchoredPopupPosition = (keyEl: HTMLElement, keyboardEl: HTMLElement, label: string): PopupState | null => {
    if (!keyAnimationEnabled || label.length > 1) return null;

    const keyRect = keyEl.getBoundingClientRect();
    const keyboardRect = keyboardEl.getBoundingClientRect();

    const popupWidth = 44;
    const defaultPopupHeight = 48;
    const gap = 4;
    const edgePadding = 4;

    const keyLeft = keyRect.left - keyboardRect.left;
    const keyTop = keyRect.top - keyboardRect.top;

    // 1. Horizontally centered over the pressed key
    const keyCenterX = keyLeft + keyRect.width / 2;
    const centeredLeft = keyCenterX - popupWidth / 2;

    // 6. Stay within visible keyboard bounds (edges)
    const minLeft = edgePadding;
    const maxLeft = Math.max(minLeft, keyboardRect.width - popupWidth - edgePadding);
    const clampedLeft = Math.max(minLeft, Math.min(centeredLeft, maxLeft));

    // 2. Appear above the pressed key with small consistent gap
    // 4. Never cover the pressed key itself
    const popupBottom = keyTop - gap;
    const availableHeight = popupBottom - edgePadding;
    const actualHeight = Math.min(defaultPopupHeight, Math.max(36, availableHeight));
    const clampedTop = Math.max(edgePadding, popupBottom - actualHeight);

    return {
      char: label,
      left: Math.round(clampedLeft),
      top: Math.round(clampedTop),
      width: popupWidth,
      height: Math.round(actualHeight)
    };
  };

  const handleKeyPointerDown = (e: React.PointerEvent<HTMLElement>, label: string) => {
    setActiveKey(label);
    triggerHaptic();

    if (!keyAnimationEnabled || label.length > 1) {
      setActivePopup(null);
      return;
    }

    if (keyboardRef.current) {
      const popup = computeAnchoredPopupPosition(e.currentTarget, keyboardRef.current, label);
      setActivePopup(popup);
    }
  };

  const handlePointerUp = () => {
    setActiveKey(null);
    setActivePopup(null);
  };

  const handleKeyPress = (
    label: string,
    action: () => void,
    e?: React.MouseEvent<HTMLElement>
  ) => {
    triggerHaptic();
    action();
    setActiveKey(label);

    if (e && keyAnimationEnabled && label.length === 1 && keyboardRef.current) {
      const popup = computeAnchoredPopupPosition(e.currentTarget, keyboardRef.current, label);
      if (popup) {
        setActivePopup(popup);
      }
    }

    // 100ms key pressed animation matching Play Store responsive typing
    setTimeout(() => {
      setActiveKey((prev) => (prev === label ? null : prev));
      setActivePopup((prev) => (prev?.char === label ? null : prev));
    }, 120);
  };

  const isLight = theme === 'light';
  const isUppercase = shiftState !== 'OFF';

  // Key Height calculation
  const heightClass = height === 'short' ? 'h-9 text-base' : height === 'tall' ? 'h-13 text-xl' : 'h-11 text-lg';
  const specialHeightClass = height === 'short' ? 'h-9' : height === 'tall' ? 'h-13' : 'h-11';

  // Theme Key Styles
  const getStandardKeyStyle = (isPressed: boolean) => {
    if (isLight) {
      return isPressed
        ? `bg-slate-200 text-slate-900 border-blue-500 shadow-sm ${keyAnimationEnabled ? 'scale-95' : ''}`
        : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-xs hover:border-slate-400';
    }
    return isPressed
      ? `bg-[#2E3D5B] text-white border-indigo-400 shadow-md ring-1 ring-indigo-400/40 ${keyAnimationEnabled ? 'scale-95' : ''}`
      : 'bg-[#1E283D] hover:bg-[#25324D] text-[#F8FAFC] border-white/[0.07] shadow-sm hover:border-white/[0.12]';
  };

  const getSpecialKeyStyle = (isPressed: boolean) => {
    if (isLight) {
      return isPressed
        ? `bg-slate-300 text-slate-900 border-slate-400 ${keyAnimationEnabled ? 'scale-95' : ''}`
        : 'bg-slate-200/90 hover:bg-slate-300/80 text-slate-700 border-slate-300 shadow-xs';
    }
    return isPressed
      ? `bg-[#243252] text-slate-100 border-white/[0.15] ${keyAnimationEnabled ? 'scale-95' : ''}`
      : 'bg-[#161F33] hover:bg-[#1C2842] text-slate-300 border-white/[0.07] shadow-sm';
  };

  const alphaRow1 = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
  const alphaRow2 = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
  const alphaRow3 = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];

  const symbolsRow1 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  const symbolsRow2 = ['@', '#', '$', '%', '&', '-', '+', '(', ')'];
  const symbolsRow3 = ['*', '"', "'", ':', ';', '!', '?'];

  const altSymbolsRow1 = ['~', '`', '|', '\\', '^', '=', '<', '>', '{', '}'];
  const altSymbolsRow2 = ['[', ']', '€', '£', '¥', '_', '§', '©', '®'];
  const altSymbolsRow3 = ['/', '%', '$', '*', ':', ';', '!', '?'];

  return (
    <div
      ref={keyboardRef}
      id="android-virtual-keyboard"
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className={`w-full select-none ${
        isLight ? 'bg-[#F1F5F9] border-slate-300 text-slate-900' : 'bg-[#090D16] border-slate-800/80 text-white'
      } border-t shadow-2xl flex flex-col font-sans transition-colors duration-200 relative`}
    >
      {/* Milestone 1B & 1C Toolbar with Theme & Settings Hooks */}
      <KeyboardToolbar
        listener={listener}
        aiNoticeVisible={aiNoticeVisible}
        theme={theme}
        keyAnimationEnabled={keyAnimationEnabled}
      />

      {/* M1D Anchored Key Press Enlarged Character Popup Preview */}
      {activePopup && keyAnimationEnabled && (
        <div
          style={{
            position: 'absolute',
            left: `${activePopup.left}px`,
            top: `${activePopup.top}px`,
            width: `${activePopup.width}px`,
            height: `${activePopup.height}px`,
          }}
          className={`pointer-events-none z-50 rounded-t-xl rounded-b-md shadow-2xl flex items-center justify-center border transition-all duration-75 ${
            isLight
              ? 'bg-white text-slate-900 border-blue-500 shadow-blue-500/25 ring-1 ring-blue-400/30'
              : 'bg-[#1E283D] text-white border-indigo-400 shadow-black/80 ring-1 ring-indigo-400/30'
          }`}
        >
          <span className="text-2xl font-bold">{activePopup.char}</span>
        </div>
      )}

      {/* Main Keys Container */}
      <div className="p-1.5 pb-2.5 flex flex-col gap-1.5">
        {/* ============================================================== */}
        {/* MODE: Alpha QWERTY                                             */}
        {/* ============================================================== */}
        {mode === 'ALPHA' && (
          <>
            {/* Row 1 */}
            <div className="flex w-full gap-1 justify-center">
              {alphaRow1.map((char) => {
                const displayChar = isUppercase ? char.toUpperCase() : char;
                const isPressed = activeKey === displayChar;
                return (
                  <div key={char} className="flex-1">
                    <button
                      id={`key-${char}`}
                      onPointerDown={(e) => handleKeyPointerDown(e, displayChar)}
                      onClick={(e) => handleKeyPress(displayChar, () => listener.onTextInput(displayChar), e)}
                      className={`w-full ${heightClass} rounded-[9px] flex items-center justify-center font-medium transition-all duration-100 border ${getStandardKeyStyle(
                        isPressed
                      )}`}
                    >
                      {displayChar}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Row 2 (Centered with inset) */}
            <div className="flex w-full gap-1 justify-center px-3">
              {alphaRow2.map((char) => {
                const displayChar = isUppercase ? char.toUpperCase() : char;
                const isPressed = activeKey === displayChar;
                return (
                  <div key={char} className="flex-1">
                    <button
                      id={`key-${char}`}
                      onPointerDown={(e) => handleKeyPointerDown(e, displayChar)}
                      onClick={(e) => handleKeyPress(displayChar, () => listener.onTextInput(displayChar), e)}
                      className={`w-full ${heightClass} rounded-[9px] flex items-center justify-center font-medium transition-all duration-100 border ${getStandardKeyStyle(
                        isPressed
                      )}`}
                    >
                      {displayChar}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Row 3: Shift, Z X C V B N M, Backspace */}
            <div className="flex w-full gap-1 justify-center">
              {/* Shift Key */}
              <button
                id="key-shift"
                onPointerDown={() => {
                  setActiveKey('shift');
                  triggerHaptic();
                }}
                onClick={() => handleKeyPress('shift', listener.onShiftClicked)}
                onDoubleClick={() => handleKeyPress('caps', listener.onShiftDoubleClicked)}
                title="Single tap for Shift, double tap for Caps Lock"
                className={`w-12 ${specialHeightClass} rounded-[9px] flex items-center justify-center transition-all duration-100 border ${
                  shiftState === 'CAPS_LOCK'
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md ring-1 ring-blue-300'
                    : shiftState === 'SHIFTED'
                    ? isLight
                      ? 'bg-blue-100 text-blue-700 border-blue-400 shadow-xs'
                      : 'bg-blue-900/60 text-blue-300 border-blue-500/50 shadow-sm'
                    : getSpecialKeyStyle(activeKey === 'shift')
                }`}
              >
                <ArrowUp className={`w-5 h-5 ${shiftState === 'CAPS_LOCK' ? 'stroke-[3]' : 'stroke-[2]'}`} />
              </button>

              {alphaRow3.map((char) => {
                const displayChar = isUppercase ? char.toUpperCase() : char;
                const isPressed = activeKey === displayChar;
                return (
                  <div key={char} className="flex-1">
                    <button
                      id={`key-${char}`}
                      onPointerDown={(e) => handleKeyPointerDown(e, displayChar)}
                      onClick={(e) => handleKeyPress(displayChar, () => listener.onTextInput(displayChar), e)}
                      className={`w-full ${heightClass} rounded-[9px] flex items-center justify-center font-medium transition-all duration-100 border ${getStandardKeyStyle(
                        isPressed
                      )}`}
                    >
                      {displayChar}
                    </button>
                  </div>
                );
              })}

              {/* Backspace Key */}
              <button
                id="key-backspace"
                onPointerDown={() => {
                  setActiveKey('backspace');
                  triggerHaptic();
                }}
                onClick={() => handleKeyPress('backspace', listener.onBackspace)}
                className={`w-12 ${specialHeightClass} rounded-[9px] flex items-center justify-center transition-all duration-100 border ${getSpecialKeyStyle(
                  activeKey === 'backspace'
                )}`}
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </>
        )}

        {/* ============================================================== */}
        {/* MODE: Symbols (?123)                                           */}
        {/* ============================================================== */}
        {mode === 'SYMBOLS' && (
          <>
            {/* Row 1 */}
            <div className="flex w-full gap-1 justify-center">
              {symbolsRow1.map((char) => {
                const isPressed = activeKey === char;
                return (
                  <button
                    key={char}
                    id={`key-sym-${char}`}
                    onPointerDown={(e) => handleKeyPointerDown(e, char)}
                    onClick={(e) => handleKeyPress(char, () => listener.onTextInput(char), e)}
                    className={`flex-1 ${heightClass} rounded-[9px] flex items-center justify-center font-medium transition-all duration-100 border ${getStandardKeyStyle(
                      isPressed
                    )}`}
                  >
                    {char}
                  </button>
                );
              })}
            </div>

            {/* Row 2 */}
            <div className="flex w-full gap-1 justify-center px-2">
              {symbolsRow2.map((char) => {
                const isPressed = activeKey === char;
                return (
                  <button
                    key={char}
                    id={`key-sym-${char}`}
                    onPointerDown={(e) => handleKeyPointerDown(e, char)}
                    onClick={(e) => handleKeyPress(char, () => listener.onTextInput(char), e)}
                    className={`flex-1 ${heightClass} rounded-[9px] flex items-center justify-center font-medium transition-all duration-100 border ${getStandardKeyStyle(
                      isPressed
                    )}`}
                  >
                    {char}
                  </button>
                );
              })}
            </div>

            {/* Row 3 */}
            <div className="flex w-full gap-1 justify-center">
              <button
                id="key-mode-altsymbols"
                onPointerDown={() => {
                  setActiveKey('altsym');
                  triggerHaptic();
                }}
                onClick={() => handleKeyPress('altsym', () => listener.onSwitchMode('ALT_SYMBOLS'))}
                className={`w-14 ${specialHeightClass} rounded-[9px] flex items-center justify-center font-semibold text-xs tracking-wider transition-all duration-100 border ${getSpecialKeyStyle(
                  activeKey === 'altsym'
                )}`}
              >
                =\&lt;
              </button>

              {symbolsRow3.map((char) => {
                const isPressed = activeKey === char;
                return (
                  <button
                    key={char}
                    id={`key-sym-${char}`}
                    onPointerDown={(e) => handleKeyPointerDown(e, char)}
                    onClick={(e) => handleKeyPress(char, () => listener.onTextInput(char), e)}
                    className={`flex-1 ${heightClass} rounded-[9px] flex items-center justify-center font-medium transition-all duration-100 border ${getStandardKeyStyle(
                      isPressed
                    )}`}
                  >
                    {char}
                  </button>
                );
              })}

              <button
                id="key-backspace"
                onPointerDown={() => {
                  setActiveKey('backspace');
                  triggerHaptic();
                }}
                onClick={() => handleKeyPress('backspace', listener.onBackspace)}
                className={`w-12 ${specialHeightClass} rounded-[9px] flex items-center justify-center transition-all duration-100 border ${getSpecialKeyStyle(
                  activeKey === 'backspace'
                )}`}
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </>
        )}

        {/* ============================================================== */}
        {/* MODE: Alt Symbols (=\<)                                         */}
        {/* ============================================================== */}
        {mode === 'ALT_SYMBOLS' && (
          <>
            {/* Row 1 */}
            <div className="flex w-full gap-1 justify-center">
              {altSymbolsRow1.map((char) => {
                const isPressed = activeKey === char;
                return (
                  <button
                    key={char}
                    id={`key-altsym-${char}`}
                    onPointerDown={(e) => handleKeyPointerDown(e, char)}
                    onClick={(e) => handleKeyPress(char, () => listener.onTextInput(char), e)}
                    className={`flex-1 ${heightClass} rounded-[9px] flex items-center justify-center font-medium transition-all duration-100 border ${getStandardKeyStyle(
                      isPressed
                    )}`}
                  >
                    {char}
                  </button>
                );
              })}
            </div>

            {/* Row 2 */}
            <div className="flex w-full gap-1 justify-center px-2">
              {altSymbolsRow2.map((char) => {
                const isPressed = activeKey === char;
                return (
                  <button
                    key={char}
                    id={`key-altsym-${char}`}
                    onPointerDown={(e) => handleKeyPointerDown(e, char)}
                    onClick={(e) => handleKeyPress(char, () => listener.onTextInput(char), e)}
                    className={`flex-1 ${heightClass} rounded-[9px] flex items-center justify-center font-medium transition-all duration-100 border ${getStandardKeyStyle(
                      isPressed
                    )}`}
                  >
                    {char}
                  </button>
                );
              })}
            </div>

            {/* Row 3 */}
            <div className="flex w-full gap-1 justify-center">
              <button
                id="key-mode-symbols"
                onPointerDown={() => {
                  setActiveKey('?123');
                  triggerHaptic();
                }}
                onClick={() => handleKeyPress('?123', () => listener.onSwitchMode('SYMBOLS'))}
                className={`w-14 ${specialHeightClass} rounded-[9px] flex items-center justify-center font-semibold text-xs tracking-wider transition-all duration-100 border ${getSpecialKeyStyle(
                  activeKey === '?123'
                )}`}
              >
                ?123
              </button>

              {altSymbolsRow3.map((char) => {
                const isPressed = activeKey === char;
                return (
                  <button
                    key={char}
                    id={`key-altsym-${char}`}
                    onPointerDown={(e) => handleKeyPointerDown(e, char)}
                    onClick={(e) => handleKeyPress(char, () => listener.onTextInput(char), e)}
                    className={`flex-1 ${heightClass} rounded-[9px] flex items-center justify-center font-medium transition-all duration-100 border ${getStandardKeyStyle(
                      isPressed
                    )}`}
                  >
                    {char}
                  </button>
                );
              })}

              <button
                id="key-backspace"
                onPointerDown={() => {
                  setActiveKey('backspace');
                  triggerHaptic();
                }}
                onClick={() => handleKeyPress('backspace', listener.onBackspace)}
                className={`w-12 ${specialHeightClass} rounded-[9px] flex items-center justify-center transition-all duration-100 border ${getSpecialKeyStyle(
                  activeKey === 'backspace'
                )}`}
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </>
        )}

        {/* ============================================================== */}
        {/* MODE: EMOJI (Milestone 1D)                                     */}
        {/* ============================================================== */}
        {mode === 'EMOJI' && (
          <div className="flex flex-col gap-1.5 animate-in fade-in duration-150">
            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 px-0.5">
              {EMOJI_CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      triggerHaptic();
                      setActiveCategory(cat.id);
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-all ${
                      isActive
                        ? isLight
                          ? 'bg-blue-600 text-white shadow-xs font-semibold'
                          : 'bg-indigo-600 text-white shadow-xs font-semibold'
                        : isLight
                        ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                        : 'bg-[#161F33] hover:bg-[#1C2842] text-slate-300'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Emoji Grid Container */}
            <div
              className={`h-40 overflow-y-auto p-1.5 rounded-lg border grid grid-cols-7 sm:grid-cols-8 gap-1.5 ${
                isLight ? 'bg-white/80 border-slate-200' : 'bg-[#0E1524] border-white/[0.08]'
              }`}
            >
              {EMOJI_CATEGORIES.find((c) => c.id === activeCategory)?.emojis.map((emoji, index) => (
                <button
                  key={`${emoji}-${index}`}
                  onClick={() => handleKeyPress(emoji, () => listener.onTextInput(emoji))}
                  className={`h-10 rounded-lg text-2xl flex items-center justify-center transition-transform hover:scale-115 active:scale-95 ${
                    isLight ? 'hover:bg-slate-100' : 'hover:bg-white/10'
                  }`}
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Bottom Row for Emoji Mode: ABC Return Button, Space, Backspace, Enter */}
            <div className="flex w-full gap-1 justify-center pt-0.5">
              <button
                id="key-emoji-return-abc"
                onClick={() => handleKeyPress('ABC', () => listener.onSwitchMode('ALPHA'))}
                className={`w-16 ${specialHeightClass} rounded-[9px] flex items-center justify-center font-bold text-xs tracking-wider transition-all duration-100 border ${
                  isLight
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                }`}
              >
                ABC
              </button>

              <button
                id="key-space"
                onPointerDown={() => {
                  setActiveKey('space');
                  triggerHaptic();
                }}
                onClick={() => handleKeyPress('space', listener.onSpace)}
                className={`flex-1 ${specialHeightClass} rounded-[9px] flex items-center justify-center text-xs tracking-wider uppercase font-medium transition-all duration-100 border ${
                  isLight
                    ? activeKey === 'space'
                      ? 'bg-slate-200 text-slate-800 border-slate-400 scale-98'
                      : 'bg-white hover:bg-slate-50 text-slate-400 border-slate-300 shadow-xs'
                    : activeKey === 'space'
                    ? 'bg-[#2E3D5B] text-white border-indigo-400/50 shadow-md scale-98'
                    : 'bg-[#1E283D] hover:bg-[#25324D] text-slate-400 border-white/[0.07] shadow-sm'
                }`}
              >
                Space
              </button>

              <button
                id="key-backspace"
                onPointerDown={() => {
                  setActiveKey('backspace');
                  triggerHaptic();
                }}
                onClick={() => handleKeyPress('backspace', listener.onBackspace)}
                className={`w-12 ${specialHeightClass} rounded-[9px] flex items-center justify-center transition-all duration-100 border ${getSpecialKeyStyle(
                  activeKey === 'backspace'
                )}`}
              >
                <Delete className="w-5 h-5" />
              </button>

              <button
                id="key-enter"
                onPointerDown={() => {
                  setActiveKey('enter');
                  triggerHaptic();
                }}
                onClick={() => handleKeyPress('enter', listener.onEnter)}
                className={`w-16 ${specialHeightClass} rounded-[9px] flex items-center justify-center font-semibold text-xs transition-all duration-100 border gap-1 shadow-md ${
                  activeKey === 'enter'
                    ? `bg-blue-700 text-white border-blue-300 ${keyAnimationEnabled ? 'scale-95' : ''}`
                    : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400/40 shadow-blue-900/30'
                }`}
              >
                <span>{enterLabel}</span>
                <CornerDownLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ROW 4 (Bottom Bar for ALPHA, SYMBOLS, and ALT_SYMBOLS)         */}
        {/* Structure: [ ?123 ] [ Emoji ] [ , ] [     Space     ] [ . ] [ Enter ] */}
        {/* ============================================================== */}
        {mode !== 'EMOJI' && (
          <div className="flex w-full gap-1 justify-center pt-0.5">
            {/* 1. Toggle between ABC and ?123 */}
            <button
              id="key-mode-toggle"
              onPointerDown={() => {
                setActiveKey('toggle-mode');
                triggerHaptic();
              }}
              onClick={() =>
                handleKeyPress('toggle-mode', () => {
                  if (mode === 'ALPHA') {
                    listener.onSwitchMode('SYMBOLS');
                  } else {
                    listener.onSwitchMode('ALPHA');
                  }
                })
              }
              className={`w-14 ${specialHeightClass} rounded-[9px] flex items-center justify-center font-semibold text-xs tracking-wider transition-all duration-100 border ${getSpecialKeyStyle(
                activeKey === 'toggle-mode'
              )}`}
            >
              {mode === 'ALPHA' ? '?123' : 'ABC'}
            </button>

            {/* 2. Emoji Button */}
            <button
              id="key-emoji"
              onPointerDown={() => {
                setActiveKey('emoji');
                triggerHaptic();
              }}
              onClick={() => handleKeyPress('emoji', listener.onEmojiClicked)}
              title="Open Emoji Picker"
              className={`w-11 ${specialHeightClass} rounded-[9px] flex items-center justify-center transition-all duration-100 border ${getSpecialKeyStyle(
                activeKey === 'emoji'
              )}`}
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* 3. COMMA KEY (Milestone 1D Required) */}
            <button
              id="key-comma"
              onPointerDown={(e) => handleKeyPointerDown(e, ',')}
              onClick={(e) => handleKeyPress(',', () => listener.onTextInput(','), e)}
              className={`w-11 ${specialHeightClass} rounded-[9px] flex items-center justify-center font-bold text-xl transition-all duration-100 border ${getStandardKeyStyle(
                activeKey === ','
              )}`}
            >
              ,
            </button>

            {/* 4. Space Bar (Largest key in bottom row) */}
            <button
              id="key-space"
              onPointerDown={() => {
                setActiveKey('space');
                triggerHaptic();
              }}
              onClick={() => handleKeyPress('space', listener.onSpace)}
              className={`flex-1 ${specialHeightClass} rounded-[9px] flex items-center justify-center text-xs tracking-wider uppercase font-medium transition-all duration-100 border ${
                isLight
                  ? activeKey === 'space'
                    ? `bg-slate-200 text-slate-800 border-slate-400 ${keyAnimationEnabled ? 'scale-95' : ''}`
                    : 'bg-white hover:bg-slate-50 text-slate-400 border-slate-300 shadow-xs'
                  : activeKey === 'space'
                  ? `bg-[#2E3D5B] text-white border-indigo-400/50 shadow-md ${keyAnimationEnabled ? 'scale-95' : ''}`
                  : 'bg-[#1E283D] hover:bg-[#25324D] text-slate-400 border-white/[0.07] shadow-sm'
              }`}
            >
              Space
            </button>

            {/* 5. Period */}
            <button
              id="key-period"
              onPointerDown={(e) => handleKeyPointerDown(e, '.')}
              onClick={(e) => handleKeyPress('.', listener.onPeriod, e)}
              className={`w-11 ${specialHeightClass} rounded-[9px] flex items-center justify-center font-bold text-xl transition-all duration-100 border ${getStandardKeyStyle(
                activeKey === '.'
              )}`}
            >
              .
            </button>

            {/* 6. Enter / Action Key */}
            <button
              id="key-enter"
              onPointerDown={() => {
                setActiveKey('enter');
                triggerHaptic();
              }}
              onClick={() => handleKeyPress('enter', listener.onEnter)}
              className={`w-16 ${specialHeightClass} rounded-[9px] flex items-center justify-center font-semibold text-xs transition-all duration-100 border gap-1 shadow-md ${
                activeKey === 'enter'
                  ? `bg-blue-700 text-white border-blue-300 ${keyAnimationEnabled ? 'scale-95' : ''}`
                  : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400/40 shadow-blue-900/30'
              }`}
            >
              <span>{enterLabel}</span>
              <CornerDownLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
