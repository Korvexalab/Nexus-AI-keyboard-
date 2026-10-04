import React, { useRef } from 'react';
import {
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  Plus,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CornerDownLeft
} from 'lucide-react';
import {
  AiActionId,
  AiPersonaId,
  AI_PRIMARY_ACTIONS,
  AI_SECONDARY_ACTIONS,
  AI_TEMPORARY_PERSONAS,
  defaultAiGenerator
} from '../services/aiReplyGenerator';
import { KeyboardThemeId } from '../types';

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
  isContextExpanded: boolean;
  onToggleContextExpanded: (expanded: boolean) => void;
  isMoreExpanded: boolean;
  onToggleMoreExpanded: (expanded: boolean) => void;
  onGenerate: () => void;
  onInsertAskAiResult?: (text: string) => void;
  onClose: () => void;
  theme?: KeyboardThemeId;
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
  isContextExpanded,
  onToggleContextExpanded,
  isMoreExpanded,
  onToggleMoreExpanded,
  onGenerate,
  onInsertAskAiResult,
  onClose,
  theme = 'midnight',
  keyAnimationEnabled = true
}) => {
  const isLight = theme === 'light';
  const personaScrollRef = useRef<HTMLDivElement>(null);

  // Ask AI local response state
  const [askAiAnswer, setAskAiAnswer] = React.useState<string | null>(null);

  // Current persona object
  const activePersona =
    AI_TEMPORARY_PERSONAS.find((p) => p.id === selectedPersona) || AI_TEMPORARY_PERSONAS[0];

  // Theming colors
  const panelBg = isLight
    ? 'bg-white border-slate-300 shadow-md'
    : 'bg-[#0F172A] border-indigo-500/20 shadow-xl';
  const headerText = isLight ? 'text-slate-900' : 'text-slate-100';
  const labelText = isLight ? 'text-slate-500' : 'text-slate-400';
  const closeBtnBg = isLight
    ? 'hover:bg-slate-100 text-slate-500 active:scale-95'
    : 'hover:bg-slate-800 text-slate-400 active:scale-95';
  const chipBgDefault = isLight
    ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-200'
    : 'bg-[#1E283D] hover:bg-[#25324D] text-slate-300 border-white/[0.06]';
  const chipBgSelected = isLight
    ? 'bg-blue-100 text-blue-700 border-blue-400 shadow-xs font-semibold'
    : 'bg-indigo-950/90 text-indigo-200 border-indigo-400 shadow-sm font-semibold';
  const promptBg = isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#1E283D] border-slate-700/80';
  const isContextFocused = inputTarget === 'ai_context';
  const promptFocusRing = isLight
    ? 'border-blue-500 ring-2 ring-blue-400/20'
    : 'border-indigo-400 ring-2 ring-indigo-500/20';

  // Smooth scroll helper for persona carousel
  const scrollPersonas = (direction: 'left' | 'right') => {
    if (personaScrollRef.current) {
      const scrollAmount = direction === 'left' ? -120 : 120;
      personaScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Ask AI submission
  const handleAskAiSubmit = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onSetInputTarget('host');
    const answer = defaultAiGenerator.generateAskAi(contextText, selectedPersona);
    setAskAiAnswer(answer);
  };

  // ==========================================
  // MODE B: ASK AI MODE
  // ==========================================
  if (panelMode === 'ask_ai') {
    return (
      <div
        id="ai-reply-panel"
        className={`w-full ${panelBg} border-b p-2.5 flex flex-col gap-2 transition-all duration-200 select-none`}
      >
        {/* Ask AI Header:
            [← writing actions]               [🧠 ask ai] [×]
            Important: "← writing actions" returns to Mode A.
            "×" closes the entire AI panel.
        */}
        <div className="flex items-center justify-between">
          <button
            id="btn-return-writing-actions"
            onClick={(e) => {
              e.stopPropagation();
              onSetInputTarget('host');
              onSetPanelMode('action_board');
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                : 'bg-[#1E283D] hover:bg-[#25324D] text-slate-300 border border-slate-700'
            }`}
            title="Return to AI Action Board"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>writing actions</span>
          </button>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 text-xs font-bold text-indigo-400">
              <span>🧠</span>
              <span className={headerText}>ask ai</span>
            </div>
            <button
              id="btn-close-ai-panel"
              onClick={(e) => {
                e.stopPropagation();
                onSetInputTarget('host');
                onClose();
              }}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${closeBtnBg}`}
              title="Close AI Panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Ask or instruct instruction label */}
        <div className="flex items-center justify-between text-[11px]">
          <span className={`font-medium ${labelText}`}>ask or instruct ai</span>
          {isContextFocused && (
            <span className="text-[10px] text-indigo-400 font-semibold animate-pulse">
              typing into question field
            </span>
          )}
        </div>

        {/* Question Input Field (Tapping transfers keyboard target to ai_context) */}
        <div
          id="custom-prompt-container"
          onClick={() => onSetInputTarget('ai_context')}
          className={`w-full min-h-[32px] px-2.5 py-1.5 rounded-lg border flex items-center justify-between cursor-text transition-all duration-150 ${promptBg} ${
            isContextFocused ? promptFocusRing : ''
          }`}
        >
          <div className="flex-1 text-xs flex items-center">
            {contextText ? (
              <span
                className={
                  isLight
                    ? 'text-slate-900 font-normal break-all'
                    : 'text-slate-100 font-normal break-all'
                }
              >
                {contextText}
                {isContextFocused && (
                  <span className="inline-block w-0.5 h-3.5 bg-indigo-400 ml-0.5 animate-pulse" />
                )}
              </span>
            ) : (
              <span className="text-slate-400 text-xs italic">
                type your question...
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
              className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 ml-1.5 shrink-0"
              title="Clear question"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Ask ✨ Button */}
        <button
          id="btn-ai-ask-submit"
          onClick={handleAskAiSubmit}
          className={`w-full h-8 rounded-lg bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:brightness-110 active:scale-98 text-white font-bold text-xs shadow-md shadow-indigo-900/30 flex items-center justify-center gap-1.5 transition-all duration-100 ${
            keyAnimationEnabled ? 'active:scale-98' : ''
          }`}
        >
          <span>ask</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-200" />
        </button>

        {/* AI Response Card/Container (Not a giant button) */}
        {askAiAnswer && (
          <div className="flex flex-col gap-1 pt-0.5 animate-fadeIn">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${labelText}`}>
              ai response
            </span>
            <div
              id="ask-ai-result-card"
              className={`p-2.5 rounded-lg border text-xs flex flex-col gap-2 ${
                isLight
                  ? 'bg-blue-50/80 border-blue-200 text-slate-800'
                  : 'bg-[#141E30] border-indigo-500/30 text-slate-200'
              }`}
            >
              <p className="text-[11px] leading-relaxed whitespace-pre-line select-text">
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
                    className="px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-[11px] font-semibold flex items-center gap-1 shadow-sm transition-all"
                    title="Insert response into message"
                  >
                    <CornerDownLeft className="w-3 h-3" />
                    <span>insert</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // MODE A: ACTION BOARD (DEFAULT)
  // ==========================================
  return (
    <div
      id="ai-reply-panel"
      className={`w-full ${panelBg} border-b p-2.5 flex flex-col gap-2 transition-all duration-200 select-none`}
    >
      {/* 1. Header: ✨ ai command center + Close (×) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className={`text-xs font-bold tracking-tight ${headerText}`}>
            ai command center
          </span>
        </div>
        <button
          id="btn-close-ai-panel"
          onClick={(e) => {
            e.stopPropagation();
            onSetInputTarget('host');
            onClose();
          }}
          className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${closeBtnBg}`}
          title="Close AI Panel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Primary Actions: 2x2 Grid
          [ 💬 reply ]       [ 🧠 ask ai ]
          [ 🔄 continue ]    [ ✨ start ]
          Non-text action buttons change state and transfer input target to host.
      */}
      <div className="grid grid-cols-2 gap-1.5">
        {AI_PRIMARY_ACTIONS.map((action) => {
          const isSelected = selectedAction === action.id;
          return (
            <button
              key={action.id}
              id={`ai-action-${action.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onSetInputTarget('host');
                if (action.id === 'ask_ai') {
                  onSetPanelMode('ask_ai');
                } else {
                  onSelectAction(action.id);
                }
              }}
              className={`h-7 px-2 rounded-lg text-xs font-medium transition-all duration-100 border flex items-center justify-center gap-1.5 truncate ${
                isSelected ? chipBgSelected : chipBgDefault
              } ${keyAnimationEnabled ? 'active:scale-95' : ''}`}
            >
              <span className="text-xs">{action.icon}</span>
              <span className="capitalize">{action.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Collapsible More Actions */}
      <div className="flex flex-col gap-1">
        <button
          id="btn-more-actions"
          onClick={(e) => {
            e.stopPropagation();
            onSetInputTarget('host');
            onToggleMoreExpanded(!isMoreExpanded);
          }}
          className={`self-start text-[11px] font-medium flex items-center gap-1 py-0.5 px-1 rounded transition-colors ${
            isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>more</span>
          {isMoreExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {isMoreExpanded && (
          <div className="grid grid-cols-2 gap-1.5 pt-0.5 animate-fadeIn">
            {AI_SECONDARY_ACTIONS.map((action) => {
              const isSelected = selectedAction === action.id;
              return (
                <button
                  key={action.id}
                  id={`ai-action-${action.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetInputTarget('host');
                    onSelectAction(action.id);
                  }}
                  className={`h-7 px-2 rounded-lg text-xs font-medium transition-all duration-100 border flex items-center justify-center gap-1.5 truncate ${
                    isSelected ? chipBgSelected : chipBgDefault
                  } ${keyAnimationEnabled ? 'active:scale-95' : ''}`}
                >
                  <span className="text-xs">{action.icon}</span>
                  <span className="capitalize">{action.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. In-Panel Horizontally Scrolling Persona Selector (NO DROPDOWN!)
          persona
          ← [😊 friendly] [💼 freelancer] [😂 funny] [⚡ short] [💬 natural] [❤️ romantic] →
          Requirements:
          - Horizontal scrolling (LazyRow / scrollable flex)
          - Selecting a persona only changes UI state
          - No text-field focus, no InputConnection changes, no keyboard hide/show, no activity navigation
      */}
      <div className="flex flex-col gap-1 py-0.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className={`font-medium ${labelText}`}>persona</span>
          <span className="text-[10px] text-indigo-400 font-medium">
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
                    // Selecting a persona only changes UI state and ensures keyboard targets host
                    onSetInputTarget('host');
                    onSelectPersona(persona.id);
                  }}
                  className={`h-6 px-2 rounded-md border text-xs font-medium shrink-0 flex items-center gap-1 transition-all duration-100 ${
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

      {/* 5. Context / Instruction (Collapsible by default)
          + add context or instruction...
          When tapped, inputTarget = 'ai_context' and keyboard input routes to context.
      */}
      <div className="flex flex-col gap-1">
        {!isContextExpanded && !contextText ? (
          <button
            id="btn-add-context"
            onClick={(e) => {
              e.stopPropagation();
              onToggleContextExpanded(true);
              onSetInputTarget('ai_context');
            }}
            className={`w-full h-7 px-2.5 rounded-lg border border-dashed flex items-center gap-1 text-[11px] font-medium transition-colors ${
              isLight
                ? 'border-slate-300 text-slate-500 hover:text-slate-800 hover:border-slate-400 bg-slate-50/50'
                : 'border-slate-700/90 text-slate-400 hover:text-slate-200 hover:border-slate-600 bg-slate-800/30'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>+ add context or instruction...</span>
          </button>
        ) : (
          <div className="flex flex-col gap-1 animate-fadeIn">
            <div className="flex items-center justify-between text-[11px]">
              <span className={`font-medium ${labelText}`}>what should ai work with?</span>
              {isContextFocused && (
                <span className="text-[10px] text-indigo-400 font-semibold animate-pulse">
                  typing into context
                </span>
              )}
            </div>

            <div
              id="custom-prompt-container"
              onClick={() => onSetInputTarget('ai_context')}
              className={`w-full min-h-[32px] px-2.5 py-1.5 rounded-lg border flex items-center justify-between cursor-text transition-all duration-150 ${promptBg} ${
                isContextFocused ? promptFocusRing : ''
              }`}
            >
              <div className="flex-1 text-xs flex items-center">
                {contextText ? (
                  <span
                    className={
                      isLight
                        ? 'text-slate-900 font-normal break-all'
                        : 'text-slate-100 font-normal break-all'
                    }
                  >
                    {contextText}
                    {isContextFocused && (
                      <span className="inline-block w-0.5 h-3.5 bg-indigo-400 ml-0.5 animate-pulse" />
                    )}
                  </span>
                ) : (
                  <span className="text-slate-400 text-xs italic">
                    type or paste context here...
                    {isContextFocused && (
                      <span className="inline-block w-0.5 h-3.5 bg-indigo-400 ml-0.5 animate-pulse" />
                    )}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 ml-1 shrink-0">
                {contextText && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearPrompt();
                    }}
                    className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                    title="Clear context"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                {!contextText && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleContextExpanded(false);
                      onSetInputTarget('host');
                    }}
                    className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                    title="Collapse context"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 6. Generate Button: generate ✨
          When clicked, generates mock result, inserts directly into host chat field,
          and reverts input target to host. Keyboard stays up!
      */}
      <button
        id="btn-ai-generate"
        onClick={(e) => {
          e.stopPropagation();
          onSetInputTarget('host');
          onGenerate();
        }}
        className={`w-full h-8 rounded-lg bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:brightness-110 active:scale-98 text-white font-bold text-xs shadow-md shadow-indigo-900/30 flex items-center justify-center gap-1.5 transition-all duration-100 ${
          keyAnimationEnabled ? 'active:scale-98' : ''
        }`}
      >
        <span>generate</span>
        <Sparkles className="w-3.5 h-3.5 text-amber-200" />
      </button>
    </div>
  );
};
