import React, { useRef, useState, useMemo } from 'react';
import {
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CornerDownLeft,
  Check,
  RotateCcw
} from 'lucide-react';
import {
  AiActionId,
  AiPersonaId,
  AI_PRIMARY_ACTIONS,
  AI_SECONDARY_ACTIONS,
  AI_TEMPORARY_PERSONAS,
  defaultAiGenerator
} from '../services/aiReplyGenerator';
import { KeyboardThemeId, KeyboardHeight } from '../types';

export type InputTarget = 'host' | 'ai_context';
export type AiPanelMode = 'action_board' | 'ask_ai';

interface AiReplyPanelProps {
  panelMode: AiPanelMode;
  onSetPanelMode: (mode: AiPanelMode) => void;
  selectedAction: AiActionId;
  onSelectAction: (action: AiActionId) => void;
  selectedPersona: AiPersonaId;
  onSelectPersona: (persona: AiPersonaId) => void;
  contextText: string;
  onClearPrompt: () => void;
  inputTarget: InputTarget;
  onSetInputTarget: (target: InputTarget) => void;
  isMoreExpanded: boolean;
  onToggleMoreExpanded: (expanded: boolean) => void;
  hostText?: string;
  onReplaceText: (replacement: string) => void;
  onInsertAskAiResult?: (text: string) => void;
  onClose: () => void;
  theme?: KeyboardThemeId;
  height?: KeyboardHeight;
  keyAnimationEnabled?: boolean;
}

export const AiReplyPanel: React.FC<AiReplyPanelProps> = ({
  panelMode,
  onSetPanelMode,
  selectedAction,
  onSelectAction,
  selectedPersona,
  onSelectPersona,
  contextText,
  onClearPrompt,
  inputTarget,
  onSetInputTarget,
  isMoreExpanded,
  onToggleMoreExpanded,
  hostText = '',
  onReplaceText,
  onInsertAskAiResult,
  onClose,
  theme = 'midnight',
  height = 'normal',
  keyAnimationEnabled = true
}) => {
  const isLight = theme === 'light';
  const personaScrollRef = useRef<HTMLDivElement>(null);

  // Track which suggestion was replaced for visual feedback
  const [replacedIndex, setReplacedIndex] = useState<number | null>(null);

  // Ask AI local response state
  const [askAiAnswer, setAskAiAnswer] = useState<string | null>(null);

  // Current active persona object
  const activePersona =
    AI_TEMPORARY_PERSONAS.find((p) => p.id === selectedPersona) || AI_TEMPORARY_PERSONAS[0];

  // Theming colors
  const panelBg = isLight
    ? 'bg-slate-100 text-slate-900'
    : 'bg-[#090D16] text-slate-100';
  const headerBorder = isLight ? 'border-slate-200' : 'border-slate-800/80';
  const chipBgDefault = isLight
    ? 'bg-white hover:bg-slate-200/70 text-slate-700 border-slate-200 shadow-2xs'
    : 'bg-[#161F33] hover:bg-[#1E283D] text-slate-300 border-white/[0.07] shadow-2xs';
  const chipBgSelected = isLight
    ? 'bg-blue-600 text-white border-blue-500 shadow-sm font-semibold'
    : 'bg-indigo-600 text-white border-indigo-400 shadow-sm font-semibold';
  const cardBg = isLight
    ? 'bg-white border-slate-200/90 text-slate-800 shadow-2xs'
    : 'bg-[#141E30] border-white/[0.08] text-slate-200 shadow-sm';
  const labelText = isLight ? 'text-slate-500' : 'text-slate-400';

  // Smooth scroll helper for persona carousel
  const scrollPersonas = (direction: 'left' | 'right') => {
    if (personaScrollRef.current) {
      const scrollAmount = direction === 'left' ? -120 : 120;
      personaScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Generate multiple AI suggestions based on the host chat bar text
  const suggestions = useMemo(() => {
    return defaultAiGenerator.generateSuggestions({
      action: selectedAction,
      persona: selectedPersona,
      context: hostText
    });
  }, [selectedAction, selectedPersona, hostText]);

  // Handle Replace click
  const handleReplace = (suggestionText: string, index: number) => {
    onReplaceText(suggestionText);
    setReplacedIndex(index);
    setTimeout(() => {
      setReplacedIndex(null);
    }, 1500);
  };

  // Ask AI submission
  const handleAskAiSubmit = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onSetInputTarget('host');
    const answer = defaultAiGenerator.generateAskAi(contextText, selectedPersona);
    setAskAiAnswer(answer);
  };

  // Height container mapping
  const heightContainerClass =
    height === 'short'
      ? 'h-[240px]'
      : height === 'tall'
      ? 'h-[310px]'
      : 'h-[275px]';

  // ==========================================
  // MODE B: ASK AI MODE
  // ==========================================
  if (panelMode === 'ask_ai') {
    const isContextFocused = inputTarget === 'ai_context';
    const promptBg = isLight ? 'bg-white border-slate-300' : 'bg-[#161F33] border-slate-700/80';
    const promptFocusRing = isLight
      ? 'border-blue-500 ring-2 ring-blue-400/20'
      : 'border-indigo-400 ring-2 ring-indigo-500/20';

    return (
      <div
        id="nexora-ai-board"
        className={`w-full ${heightContainerClass} ${panelBg} flex flex-col transition-all duration-200 select-none overflow-hidden`}
      >
        {/* Ask AI Header:
            [← writing actions]               [🧠 ask ai] [×]
        */}
        <div className={`h-10 px-3 flex items-center justify-between border-b ${headerBorder} shrink-0`}>
          <button
            id="btn-return-writing-actions"
            onClick={(e) => {
              e.stopPropagation();
              onSetInputTarget('host');
              onSetPanelMode('action_board');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              isLight
                ? 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-2xs'
                : 'bg-[#1E283D] hover:bg-[#25324D] text-slate-300 border border-white/[0.08]'
            }`}
            title="Return to AI Action Board"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Writing actions</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs font-bold text-indigo-400">
              <span>🧠</span>
              <span className={isLight ? 'text-slate-900' : 'text-slate-100'}>Ask AI</span>
            </div>
            <button
              id="btn-close-ai-panel"
              onClick={(e) => {
                e.stopPropagation();
                onSetInputTarget('host');
                onClose();
              }}
              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
              title="Close AI Board"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Ask AI Body */}
        <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className={`font-semibold uppercase tracking-wider ${labelText}`}>Ask or instruct AI</span>
            {isContextFocused && (
              <span className="text-[10px] text-indigo-400 font-semibold animate-pulse">
                Keyboard typing into question field
              </span>
            )}
          </div>

          {/* AI-specific Question Input Field (Only in Ask AI mode) */}
          <div
            id="custom-prompt-container"
            onClick={() => onSetInputTarget('ai_context')}
            className={`w-full min-h-[38px] px-3 py-2 rounded-xl border flex items-center justify-between cursor-text transition-all duration-150 ${promptBg} ${
              isContextFocused ? promptFocusRing : ''
            }`}
          >
            <div className="flex-1 text-xs flex items-center">
              {contextText ? (
                <span className={isLight ? 'text-slate-900 break-all' : 'text-slate-100 break-all'}>
                  {contextText}
                  {isContextFocused && (
                    <span className="inline-block w-0.5 h-3.5 bg-indigo-400 ml-0.5 animate-pulse" />
                  )}
                </span>
              ) : (
                <span className="text-slate-400 text-xs italic">
                  Type your question or instruction...
                  {isContextFocused && (
                    <span className="inline-block w-0.5 h-3.5 bg-indigo-400 ml-0.5 animate-pulse" />
                  )}
                </span>
              )}
            </div>

            {contextText && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClearPrompt();
                }}
                className="w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-200 ml-1.5 shrink-0"
                title="Clear question"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Ask ✨ Button */}
          <button
            id="btn-ai-ask-submit"
            onClick={handleAskAiSubmit}
            className={`w-full h-8.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:brightness-110 active:scale-98 text-white font-bold text-xs shadow-md shadow-indigo-900/30 flex items-center justify-center gap-1.5 transition-all duration-100 ${
              keyAnimationEnabled ? 'active:scale-98' : ''
            }`}
          >
            <span>Ask AI</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
          </button>

          {/* Ask AI Response Card */}
          {askAiAnswer && (
            <div className="flex flex-col gap-1 pt-1 animate-fadeIn">
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${labelText}`}>
                AI Answer
              </span>
              <div
                id="ask-ai-result-card"
                className={`p-3 rounded-xl border text-xs flex flex-col gap-2.5 ${cardBg}`}
              >
                <p className="text-[11px] leading-relaxed whitespace-pre-line select-text font-sans">
                  {askAiAnswer}
                </p>

                <div className="flex items-center justify-end">
                  {onInsertAskAiResult && (
                    <button
                      id="btn-insert-ask-ai"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetInputTarget('host');
                        onInsertAskAiResult(askAiAnswer);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                      title="Insert answer into host message"
                    >
                      <CornerDownLeft className="w-3.5 h-3.5" />
                      <span>Insert</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // MODE A: AI BOARD (REPLACES KEYBOARD BOARD)
  // ==========================================
  return (
    <div
      id="nexora-ai-board"
      className={`w-full ${heightContainerClass} ${panelBg} flex flex-col transition-all duration-200 select-none overflow-hidden`}
    >
      {/* 1. AI Board Header: ← ✨ AI                         × */}
      <div className={`h-9 px-3 flex items-center justify-between border-b ${headerBorder} shrink-0`}>
        <div className="flex items-center gap-1.5">
          <button
            id="btn-ai-back-to-keyboard"
            onClick={(e) => {
              e.stopPropagation();
              onSetInputTarget('host');
              onClose();
            }}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
              isLight ? 'hover:bg-slate-200 text-slate-700' : 'hover:bg-slate-800 text-slate-300'
            }`}
            title="Back to normal keyboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 font-bold text-xs tracking-tight text-indigo-400">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className={isLight ? 'text-slate-900' : 'text-slate-100'}>AI</span>
          </div>
        </div>

        <button
          id="btn-close-ai-panel"
          onClick={(e) => {
            e.stopPropagation();
            onSetInputTarget('host');
            onClose();
          }}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
            isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-slate-800 text-slate-400'
          }`}
          title="Close AI"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Top Controls Area: Actions & Persona Selector */}
      <div className={`p-2.5 pb-2 flex flex-col gap-2 border-b ${headerBorder} shrink-0`}>
        {/* Actions Row: [ Reply ] [ Rewrite ] [ More ▾ ] */}
        <div className="flex items-center gap-2">
          {/* Reply */}
          <button
            id="ai-action-reply"
            onClick={(e) => {
              e.stopPropagation();
              onSetInputTarget('host');
              onSelectAction('reply');
            }}
            className={`flex-1 h-7.5 px-2.5 rounded-lg text-xs font-medium transition-all duration-100 border flex items-center justify-center gap-1.5 ${
              selectedAction === 'reply' ? chipBgSelected : chipBgDefault
            } ${keyAnimationEnabled ? 'active:scale-95' : ''}`}
          >
            <span>💬</span>
            <span>Reply</span>
          </button>

          {/* Rewrite */}
          <button
            id="ai-action-rewrite"
            onClick={(e) => {
              e.stopPropagation();
              onSetInputTarget('host');
              onSelectAction('rewrite');
            }}
            className={`flex-1 h-7.5 px-2.5 rounded-lg text-xs font-medium transition-all duration-100 border flex items-center justify-center gap-1.5 ${
              selectedAction === 'rewrite' ? chipBgSelected : chipBgDefault
            } ${keyAnimationEnabled ? 'active:scale-95' : ''}`}
          >
            <span>✏️</span>
            <span>Rewrite</span>
          </button>

          {/* More Actions Toggle */}
          <button
            id="btn-more-actions"
            onClick={(e) => {
              e.stopPropagation();
              onSetInputTarget('host');
              onToggleMoreExpanded(!isMoreExpanded);
            }}
            className={`flex-1 h-7.5 px-2 rounded-lg text-xs font-medium transition-all duration-100 border flex items-center justify-center gap-1 ${
              isMoreExpanded || (selectedAction !== 'reply' && selectedAction !== 'rewrite')
                ? chipBgSelected
                : chipBgDefault
            }`}
          >
            <span>More</span>
            {isMoreExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Secondary Actions Collapsible: Continue, Start, Ask AI, Create */}
        {isMoreExpanded && (
          <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto no-scrollbar animate-fadeIn">
            {/* Continue */}
            <button
              id="ai-action-continue"
              onClick={(e) => {
                e.stopPropagation();
                onSetInputTarget('host');
                onSelectAction('continue');
              }}
              className={`h-7 px-2.5 rounded-lg text-xs font-medium transition-all duration-100 border flex items-center gap-1 shrink-0 ${
                selectedAction === 'continue' ? chipBgSelected : chipBgDefault
              } ${keyAnimationEnabled ? 'active:scale-95' : ''}`}
            >
              <span>🔄</span>
              <span>Continue</span>
            </button>

            {/* Start */}
            <button
              id="ai-action-start"
              onClick={(e) => {
                e.stopPropagation();
                onSetInputTarget('host');
                onSelectAction('start');
              }}
              className={`h-7 px-2.5 rounded-lg text-xs font-medium transition-all duration-100 border flex items-center gap-1 shrink-0 ${
                selectedAction === 'start' ? chipBgSelected : chipBgDefault
              } ${keyAnimationEnabled ? 'active:scale-95' : ''}`}
            >
              <span>✨</span>
              <span>Start</span>
            </button>

            {/* Ask AI */}
            <button
              id="ai-action-ask-ai"
              onClick={(e) => {
                e.stopPropagation();
                onSetInputTarget('ai_context');
                onSelectAction('ask_ai');
                onSetPanelMode('ask_ai');
              }}
              className={`h-7 px-2.5 rounded-lg text-xs font-medium transition-all duration-100 border flex items-center gap-1 shrink-0 ${
                selectedAction === 'ask_ai' ? chipBgSelected : chipBgDefault
              } ${keyAnimationEnabled ? 'active:scale-95' : ''}`}
            >
              <span>🧠</span>
              <span>Ask AI</span>
            </button>

            {/* Create */}
            <button
              id="ai-action-create"
              onClick={(e) => {
                e.stopPropagation();
                onSetInputTarget('host');
                onSelectAction('create');
              }}
              className={`h-7 px-2.5 rounded-lg text-xs font-medium transition-all duration-100 border flex items-center gap-1 shrink-0 ${
                selectedAction === 'create' ? chipBgSelected : chipBgDefault
              } ${keyAnimationEnabled ? 'active:scale-95' : ''}`}
            >
              <span>➕</span>
              <span>Create</span>
            </button>
          </div>
        )}

        {/* In-Panel Horizontal Persona Selector (NO DROPDOWN)
            PERSONA
            ← 😊 Friendly   💼 Freelancer   😂 Funny   ❤️ Romantic →
        */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className={`font-bold uppercase tracking-wider ${labelText}`}>Persona</span>
            <span className="text-indigo-400 font-semibold">
              {activePersona.icon} {activePersona.name}
            </span>
          </div>

          <div className="flex items-center gap-1 w-full">
            <button
              onClick={() => scrollPersonas('left')}
              className={`w-5 h-6 rounded flex items-center justify-center shrink-0 transition-colors ${
                isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-slate-800 text-slate-400'
              }`}
              title="Scroll left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div
              ref={personaScrollRef}
              className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {AI_TEMPORARY_PERSONAS.map((persona) => {
                const isSelected = selectedPersona === persona.id;
                return (
                  <button
                    key={persona.id}
                    id={`persona-chip-${persona.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetInputTarget('host');
                      onSelectPersona(persona.id);
                    }}
                    className={`h-6.5 px-2.5 rounded-md border text-xs font-medium shrink-0 flex items-center gap-1 transition-all duration-100 ${
                      isSelected ? chipBgSelected : chipBgDefault
                    } ${keyAnimationEnabled ? 'active:scale-95' : ''}`}
                  >
                    <span className="text-xs">{persona.icon}</span>
                    <span className="text-[11px] whitespace-nowrap">{persona.name}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => scrollPersonas('right')}
              className={`w-5 h-6 rounded flex items-center justify-center shrink-0 transition-colors ${
                isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-slate-800 text-slate-400'
              }`}
              title="Scroll right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. AI RESULTS SECTION
          Displays selectable result cards based on the host chat bar text.
          Each result provides a clear [ Replace ] action.
          There is NO second chat bar or permanent text field.
      */}
      <div className="flex-1 p-2.5 overflow-y-auto flex flex-col gap-2">
        <div className="flex items-center justify-between text-[10px] px-0.5">
          <span className={`font-bold uppercase tracking-wider ${labelText}`}>
            AI Results {hostText.trim() ? `• Context: "${hostText.trim().slice(0, 22)}${hostText.trim().length > 22 ? '...' : ''}"` : ''}
          </span>
          <span className="text-indigo-400 text-[10px]">
            {suggestions.length} {suggestions.length === 1 ? 'suggestion' : 'suggestions'}
          </span>
        </div>

        {/* Suggestion Cards */}
        {suggestions.map((suggestion, idx) => {
          const isReplaced = replacedIndex === idx;
          return (
            <div
              key={idx}
              id={`ai-suggestion-card-${idx}`}
              className={`p-2.5 rounded-xl border flex flex-col justify-between gap-2 transition-all duration-150 ${cardBg} ${
                isReplaced ? (isLight ? 'ring-2 ring-emerald-500/50 border-emerald-400' : 'ring-2 ring-emerald-400/50 border-emerald-500') : ''
              }`}
            >
              <p className={`text-xs leading-relaxed font-sans select-text ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
                {suggestion}
              </p>

              <div className="flex items-center justify-end">
                <button
                  id={`btn-replace-suggestion-${idx}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetInputTarget('host');
                    handleReplace(suggestion, idx);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                    isReplaced
                      ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                      : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white shadow-indigo-600/25'
                  }`}
                  title="Replace message text with this result"
                >
                  {isReplaced ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Replaced</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Replace</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
