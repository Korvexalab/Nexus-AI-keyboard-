import React, { useState } from 'react';
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
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const handleKeyPress = (label: string, action: () => void) => {
    setActiveKey(label);
    action();
    // 100ms key pressed animation matching Play Store responsive typing
    setTimeout(() => setActiveKey(null), 100);
  };

  const isLight = theme === 'light';
  const isUppercase = shiftState !== 'OFF';

  // Key Height calculation
  const heightClass = height === 'short' ? 'h-9 text-base' : height === 'tall' ? 'h-13 text-xl' : 'h-11 text-lg';
  const specialHeightClass = height === 'short' ? 'h-9' : height === 'tall' ? 'h-13' : 'h-11';
  const animClass = keyAnimationEnabled ? 'active:scale-95' : '';

  // Theme Key Styles
  const getStandardKeyStyle = (isPressed: boolean) => {
    if (isLight) {
      return isPressed
        ? `bg-slate-200 text-slate-900 border-slate-400 shadow-sm ${keyAnimationEnabled ? 'scale-95' : ''}`
        : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-xs hover:border-slate-400';
    }
    return isPressed
      ? `bg-[#2E3D5B] text-white border-indigo-400/50 shadow-md ring-1 ring-indigo-400/40 ${keyAnimationEnabled ? 'scale-95' : ''}`
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
      id="android-virtual-keyboard"
      className={`w-full select-none ${
        isLight ? 'bg-[#F1F5F9] border-slate-300 text-slate-900' : 'bg-[#090D16] border-slate-800/80 text-white'
      } border-t shadow-2xl flex flex-col font-sans transition-colors duration-200`}
    >
      {/* Milestone 1B & 1C Toolbar with Theme & Settings Hooks */}
      <KeyboardToolbar
        listener={listener}
        aiNoticeVisible={aiNoticeVisible}
        theme={theme}
        keyAnimationEnabled={keyAnimationEnabled}
      />

      {/* Main Keys Container */}
      <div className="p-1.5 pb-2.5 flex flex-col gap-1.5">
        {/* Mode: Alpha QWERTY */}
        {mode === 'ALPHA' && (
          <>
            {/* Row 1 */}
            <div className="flex w-full gap-1 justify-center">
              {alphaRow1.map((char) => {
                const displayChar = isUppercase ? char.toUpperCase() : char;
                const isPressed = activeKey === displayChar;
                return (
                  <button
                    key={char}
                    id={`key-${char}`}
                    onClick={() => handleKeyPress(displayChar, () => listener.onTextInput(displayChar))}
                    className={`flex-1 ${heightClass} rounded-[9px] flex items-center justify-center font-medium transition-all duration-100 border ${getStandardKeyStyle(isPressed)}`}
                  >
                    {displayChar}
                  </button>
                );
              })}
            </div>

            {/* Row 2 (Centered with inset) */}
            <div className="flex w-full gap-1 justify-center px-3">
              {alphaRow2.map((char) => {
                const displayChar = isUppercase ? char.toUpperCase() : char;
                const isPressed = activeKey === displayChar;
                return (
                  <button
                    key={char}
                    id={`key-${char}`}
                    onClick={() => handleKeyPress(displayChar, () => listener.onTextInput(displayChar))}
                    className={`flex-1 ${heightClass} rounded-[9px] flex items-center justify-center font-medium transition-all duration-100 border ${getStandardKeyStyle(isPressed)}`}
                  >
                    {displayChar}
                  </button>
                );
              })}
            </div>

            {/* Row 3: Shift, Z X C V B N M, Backspace */}
            <div className="flex w-full gap-1 justify-center">
              {/* Shift Key */}
              <button
                id="key-shift"
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
                  <button
                    key={char}
                    id={`key-${char}`}
                    onClick={() => handleKeyPress(displayChar, () => listener.onTextInput(displayChar))}
                    className={`flex-1 ${heightClass} rounded-[9px] flex items-center justify-center font-medium transition-all duration-100 border ${getStandardKeyStyle(isPressed)}`}
                  >
                    {displayChar}
                  </button>
                );
              })}

              {/* Backspace Key */}
              <button
                id="key-backspace"
                onClick={() => handleKeyPress('backspace', listener.onBackspace)}
                className={`w-12 ${specialHeightClass} rounded-[9px] flex items-center justify-center transition-all duration-100 border ${getSpecialKeyStyle(activeKey === 'backspace')}`}
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </>
        )}

        {/* Mode: Symbols (?123) */}
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
                    onClick={() => handleKeyPress(char, () => listener.onTextInput(char))}
                    className={`flex-1 ${heightClass} rounded-[9px] flex items-center justify-center font-medium transition-all duration-100 border ${getStandardKeyStyle(isPressed)}`}
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
                    onClick={() => handleKeyPress(char, () => listener.onTextInput(char))}
                    className={`flex-1 ${heightClass} rounded-[9px] flex items-center justify-center font-medium transition-all duration-100 border ${getStandardKeyStyle(isPressed)}`}
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
                onClick={() => handleKeyPress('altsym', () => listener.onSwitchMode('ALT_SYMBOLS'))}
                className={`w-14 ${specialHeightClass} rounded-[9px] flex items-center justify-center font-semibold text-xs tracking-wider transition-all duration-100 border ${getSpecialKeyStyle(activeKey === 'altsym')}`}
              >
                =\&lt;
              </button>

              {symbolsRow3.map((char) => {
                const isPressed = activeKey === char;
                return (
                  <button
                    key={char}
                    id={`key-sym-${char}`}
                    onClick={() => handleKeyPress(char, () => listener.onTextInput(char))}
                    className={`flex-1 ${heightClass} rounded-[9px] flex items-center justify-center font-medium transition-all duration-100 border ${getStandardKeyStyle(isPressed)}`}
                  >
                    {char}
                  </button>
                );
              })}

              <button
                id="key-backspace"
                onClick={() => handleKeyPress('backspace', listener.onBackspace)}
                className={`w-12 ${specialHeightClass} rounded-[9px] flex items-center justify-center transition-all duration-100 border ${getSpecialKeyStyle(activeKey === 'backspace')}`}
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </>
        )}

        {/* Mode: Alt Symbols (=\<) */}
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
                    onClick={() => handleKeyPress(char, () => listener.onTextInput(char))}
                    className={`flex-1 ${heightClass} rounded-[9px] flex items-center justify-center font-medium transition-all duration-100 border ${getStandardKeyStyle(isPressed)}`}
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
                    onClick={() => handleKeyPress(char, () => listener.onTextInput(char))}
                    className={`flex-1 ${heightClass} rounded-[9px] flex items-center justify-center font-medium transition-all duration-100 border ${getStandardKeyStyle(isPressed)}`}
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
                onClick={() => handleKeyPress('?123', () => listener.onSwitchMode('SYMBOLS'))}
                className={`w-14 ${specialHeightClass} rounded-[9px] flex items-center justify-center font-semibold text-xs tracking-wider transition-all duration-100 border ${getSpecialKeyStyle(activeKey === '?123')}`}
              >
                ?123
              </button>

              {altSymbolsRow3.map((char) => {
                const isPressed = activeKey === char;
                return (
                  <button
                    key={char}
                    id={`key-altsym-${char}`}
                    onClick={() => handleKeyPress(char, () => listener.onTextInput(char))}
                    className={`flex-1 ${heightClass} rounded-[9px] flex items-center justify-center font-medium transition-all duration-100 border ${getStandardKeyStyle(isPressed)}`}
                  >
                    {char}
                  </button>
                );
              })}

              <button
                id="key-backspace"
                onClick={() => handleKeyPress('backspace', listener.onBackspace)}
                className={`w-12 ${specialHeightClass} rounded-[9px] flex items-center justify-center transition-all duration-100 border ${getSpecialKeyStyle(activeKey === 'backspace')}`}
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </>
        )}

        {/* Row 4: 123 / ABC toggle, Emoji, Space, Period, Enter */}
        <div className="flex w-full gap-1 justify-center pt-0.5">
          {/* Toggle between ABC and ?123 */}
          <button
            id="key-mode-toggle"
            onClick={() =>
              handleKeyPress('toggle-mode', () => {
                if (mode === 'ALPHA') {
                  listener.onSwitchMode('SYMBOLS');
                } else {
                  listener.onSwitchMode('ALPHA');
                }
              })
            }
            className={`w-14 ${specialHeightClass} rounded-[9px] flex items-center justify-center font-semibold text-xs tracking-wider transition-all duration-100 border ${getSpecialKeyStyle(activeKey === 'toggle-mode')}`}
          >
            {mode === 'ALPHA' ? '?123' : 'ABC'}
          </button>

          {/* Emoji Button */}
          <button
            id="key-emoji"
            onClick={() => handleKeyPress('emoji', listener.onEmojiClicked)}
            className={`w-11 ${specialHeightClass} rounded-[9px] flex items-center justify-center transition-all duration-100 border ${getSpecialKeyStyle(activeKey === 'emoji')}`}
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Space Bar */}
          <button
            id="key-space"
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

          {/* Period */}
          <button
            id="key-period"
            onClick={() => handleKeyPress('.', listener.onPeriod)}
            className={`w-11 ${specialHeightClass} rounded-[9px] flex items-center justify-center font-bold text-xl transition-all duration-100 border ${getStandardKeyStyle(activeKey === '.')}`}
          >
            .
          </button>

          {/* Enter / Action Key */}
          <button
            id="key-enter"
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
    </div>
  );
};
