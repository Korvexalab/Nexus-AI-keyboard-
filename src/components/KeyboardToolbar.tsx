import React from 'react';
import { KeyboardActionListener, KeyboardThemeId } from '../types';
import { Clipboard, Palette, Settings, Smile, Sparkles } from 'lucide-react';

interface KeyboardToolbarProps {
  listener: KeyboardActionListener;
  aiNoticeVisible: boolean;
  theme?: KeyboardThemeId;
  keyAnimationEnabled?: boolean;
}

export const KeyboardToolbar: React.FC<KeyboardToolbarProps> = ({
  listener,
  aiNoticeVisible,
  theme = 'midnight',
  keyAnimationEnabled = true
}) => {
  const isLight = theme === 'light';

  const containerBg = isLight ? 'bg-slate-100/90 border-slate-300' : 'bg-slate-950/80 border-slate-800/80';
  const iconBtnClass = isLight
    ? `w-8 h-8 rounded-full bg-white/90 hover:bg-white active:bg-slate-200 ${keyAnimationEnabled ? 'active:scale-90' : ''} text-slate-700 hover:text-slate-950 flex items-center justify-center transition-all duration-100 border border-slate-300 shadow-xs`
    : `w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 active:bg-slate-700 ${keyAnimationEnabled ? 'active:scale-90' : ''} text-slate-300 hover:text-slate-100 flex items-center justify-center transition-all duration-100 border border-slate-800`;

  const textBtnClass = isLight
    ? `h-8 px-2 rounded-xl bg-white/90 hover:bg-white active:bg-slate-200 ${keyAnimationEnabled ? 'active:scale-90' : ''} text-slate-700 hover:text-slate-950 font-bold text-[10px] tracking-wider flex items-center justify-center transition-all duration-100 border border-slate-300 shadow-xs`
    : `h-8 px-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 active:bg-slate-700 ${keyAnimationEnabled ? 'active:scale-90' : ''} text-slate-300 hover:text-slate-100 font-bold text-[10px] tracking-wider flex items-center justify-center transition-all duration-100 border border-slate-800`;

  return (
    <div className={`relative w-full px-2 py-1.5 border-b ${containerBg} backdrop-blur flex items-center justify-between gap-1 select-none transition-colors duration-200`}>
      {/* Prominent AI Pill Button */}
      <button
        id="toolbar-btn-ai"
        onClick={listener.onAiClicked}
        className={`relative group flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white font-semibold text-xs shadow-md shadow-indigo-900/30 border border-white/20 ${keyAnimationEnabled ? 'active:scale-95' : ''} transition-all duration-100 hover:brightness-110`}
        title="AI Assistant (Coming Soon)"
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
        <span className="tracking-wide text-[11px]">AI</span>
        <span className="absolute -top-1 -right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
        </span>
      </button>

      {/* Secondary Quick Action Icons */}
      <div className="flex items-center gap-1">
        {/* 😀 Emoji */}
        <button
          id="toolbar-btn-emoji"
          onClick={listener.onEmojiClicked}
          className={iconBtnClass}
          title="Emoji Picker"
        >
          <Smile className="w-4 h-4" />
        </button>

        {/* GIF */}
        <button
          id="toolbar-btn-gif"
          onClick={listener.onGifClicked}
          className={textBtnClass}
          title="GIF Search"
        >
          GIF
        </button>

        {/* 📋 Clipboard */}
        <button
          id="toolbar-btn-clipboard"
          onClick={listener.onClipboardClicked}
          className={iconBtnClass}
          title="Clipboard"
        >
          <Clipboard className="w-4 h-4" />
        </button>

        {/* 🎨 Theme */}
        <button
          id="toolbar-btn-theme"
          onClick={listener.onThemeClicked}
          className={iconBtnClass}
          title={`Switch Theme (Current: ${isLight ? 'Light' : 'Midnight'})`}
        >
          <Palette className="w-4 h-4" />
        </button>

        {/* ⚙ Settings */}
        <button
          id="toolbar-btn-settings"
          onClick={listener.onSettingsClicked}
          className={iconBtnClass}
          title="Keyboard Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Temporary "AI Assistant — Coming Soon" Toast Banner */}
      {aiNoticeVisible && (
        <div className={`absolute inset-0 ${isLight ? 'bg-white/95' : 'bg-slate-950/95'} backdrop-blur-md flex items-center justify-center z-20 animate-in fade-in zoom-in-95 duration-150`}>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${isLight ? 'bg-indigo-50 border border-indigo-300 text-indigo-800' : 'bg-indigo-950/80 border border-indigo-500/50 text-indigo-200'} text-xs font-semibold shadow-lg`}>
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>✨ AI Assistant — Coming Soon</span>
          </div>
        </div>
      )}
    </div>
  );
};
