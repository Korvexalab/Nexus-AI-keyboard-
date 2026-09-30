import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { AI_REPLY_STYLES, AiReplyStyle } from '../services/aiReplyGenerator';
import { KeyboardThemeId } from '../types';

interface AiReplyPanelProps {
  selectedStyle: AiReplyStyle;
  onSelectStyle: (style: AiReplyStyle) => void;
  customPrompt: string;
  onClearPrompt: () => void;
  isPromptFocused: boolean;
  onTogglePromptFocus: (focused: boolean) => void;
  onGenerate: () => void;
  onClose: () => void;
  theme?: KeyboardThemeId;
  keyAnimationEnabled?: boolean;
}

export const AiReplyPanel: React.FC<AiReplyPanelProps> = ({
  selectedStyle,
  onSelectStyle,
  customPrompt,
  onClearPrompt,
  isPromptFocused,
  onTogglePromptFocus,
  onGenerate,
  onClose,
  theme = 'midnight',
  keyAnimationEnabled = true
}) => {
  const isLight = theme === 'light';

  // Theming
  const panelBg = isLight ? 'bg-white border-slate-300 shadow-md' : 'bg-[#0F172A] border-indigo-500/20 shadow-xl';
  const headerText = isLight ? 'text-slate-900' : 'text-slate-100';
  const labelText = isLight ? 'text-slate-600' : 'text-slate-400';
  const promptBg = isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#1E283D] border-slate-700/80';
  const promptFocusRing = isLight
    ? 'border-blue-500 ring-2 ring-blue-400/20'
    : 'border-indigo-400 ring-2 ring-indigo-500/20';
  const closeBtnBg = isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-800 text-slate-400';

  return (
    <div
      id="ai-reply-panel"
      className={`w-full ${panelBg} border-b p-3 flex flex-col gap-2.5 transition-all duration-200 select-none`}
    >
      {/* 1. Header: ✨ AI Reply + Close (×) Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className={`text-xs font-bold tracking-tight ${headerText}`}>AI Reply</span>
        </div>
        <button
          id="btn-close-ai-panel"
          onClick={onClose}
          className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${closeBtnBg}`}
          title="Close AI Reply Panel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Reply Style Buttons */}
      <div className="flex flex-col gap-1.5">
        {/* Row 1: [ Reply ] [ Friendly ] [ Short ] */}
        <div className="grid grid-cols-3 gap-1.5">
          {AI_REPLY_STYLES.slice(0, 3).map((style) => {
            const isSelected = selectedStyle === style.id;
            return (
              <button
                key={style.id}
                id={`ai-style-${style.id}`}
                onClick={() => onSelectStyle(style.id)}
                className={`h-7 px-2 rounded-lg text-xs font-medium transition-all duration-100 border flex items-center justify-center truncate ${
                  isSelected
                    ? isLight
                      ? 'bg-blue-100 text-blue-700 border-blue-400 shadow-xs font-semibold'
                      : 'bg-indigo-950/90 text-indigo-200 border-indigo-400 shadow-sm font-semibold'
                    : isLight
                    ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-200'
                    : 'bg-[#1E283D] hover:bg-[#25324D] text-slate-300 border-white/[0.06]'
                } ${keyAnimationEnabled ? 'active:scale-95' : ''}`}
              >
                {style.label}
              </button>
            );
          })}
        </div>

        {/* Row 2: [ Professional ] [ Funny ] */}
        <div className="grid grid-cols-2 gap-1.5">
          {AI_REPLY_STYLES.slice(3).map((style) => {
            const isSelected = selectedStyle === style.id;
            return (
              <button
                key={style.id}
                id={`ai-style-${style.id}`}
                onClick={() => onSelectStyle(style.id)}
                className={`h-7 px-2 rounded-lg text-xs font-medium transition-all duration-100 border flex items-center justify-center truncate ${
                  isSelected
                    ? isLight
                      ? 'bg-blue-100 text-blue-700 border-blue-400 shadow-xs font-semibold'
                      : 'bg-indigo-950/90 text-indigo-200 border-indigo-400 shadow-sm font-semibold'
                    : isLight
                    ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-200'
                    : 'bg-[#1E283D] hover:bg-[#25324D] text-slate-300 border-white/[0.06]'
                } ${keyAnimationEnabled ? 'active:scale-95' : ''}`}
              >
                {style.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Custom Prompt Field */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className={`font-medium ${labelText}`}>Custom prompt</span>
          {isPromptFocused && (
            <span className="text-[10px] text-indigo-400 font-semibold animate-pulse">
              Keyboard typing active
            </span>
          )}
        </div>

        <div
          id="custom-prompt-container"
          onClick={() => onTogglePromptFocus(!isPromptFocused)}
          className={`w-full h-8 px-2.5 rounded-lg border flex items-center justify-between cursor-text transition-all duration-150 ${promptBg} ${
            isPromptFocused ? promptFocusRing : ''
          }`}
        >
          <div className="flex-1 truncate text-xs flex items-center">
            {customPrompt ? (
              <span className={isLight ? 'text-slate-900 font-normal' : 'text-slate-100 font-normal'}>
                {customPrompt}
                {isPromptFocused && (
                  <span className="inline-block w-0.5 h-3.5 bg-indigo-400 ml-0.5 animate-pulse" />
                )}
              </span>
            ) : (
              <span className="text-slate-400 text-xs italic">
                e.g. make this sound warmer...
                {isPromptFocused && (
                  <span className="inline-block w-0.5 h-3.5 bg-indigo-400 ml-0.5 animate-pulse" />
                )}
              </span>
            )}
          </div>

          {customPrompt && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClearPrompt();
              }}
              className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
              title="Clear custom prompt"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Generate Button: Generate ✨ */}
      <button
        id="btn-ai-generate"
        onClick={onGenerate}
        className={`w-full h-9 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:brightness-110 active:scale-98 text-white font-bold text-xs shadow-md shadow-indigo-900/30 flex items-center justify-center gap-1.5 transition-all duration-100 ${
          keyAnimationEnabled ? 'active:scale-98' : ''
        }`}
      >
        <span>Generate</span>
        <Sparkles className="w-3.5 h-3.5 text-amber-200" />
      </button>
    </div>
  );
};
