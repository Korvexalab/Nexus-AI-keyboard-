import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  Brain,
  MessageSquare,
  Repeat,
  Send,
  Plus,
  ArrowRight,
  CornerDownLeft,
  Check
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

interface AiReplyPanelProps {
  selectedAction: AiActionId;
  onSelectAction: (action: AiActionId) => void;
  selectedPersona: AiPersonaId;
  onSelectPersona: (persona: AiPersonaId) => void;
  contextText: string;
  onClearPrompt: () => void;
  isPromptFocused: boolean;
  onTogglePromptFocus: (focused: boolean) => void;
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
  selectedAction,
  onSelectAction,
  selectedPersona,
  onSelectPersona,
  contextText,
  onClearPrompt,
  isPromptFocused,
  onTogglePromptFocus,
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

  // Persona popover dropdown state
  const [isPersonaOpen, setIsPersonaOpen] = useState(false);
  const personaRef = useRef<HTMLDivElement>(null);

  // Ask AI local response state
  const [askAiAnswer, setAskAiAnswer] = useState<string | null>(null);

  // Reset ask AI answer when question changes or action switches
  useEffect(() => {
    if (selectedAction !== 'ask_ai') {
      setAskAiAnswer(null);
    }
  }, [selectedAction]);

  // Close persona dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (personaRef.current && !personaRef.current.contains(e.target as Node)) {
        setIsPersonaOpen(false);
      }
    };
    if (isPersonaOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isPersonaOpen]);

  // Current persona object
  const activePersona =
    AI_TEMPORARY_PERSONAS.find((p) => p.id === selectedPersona) || AI_TEMPORARY_PERSONAS[0];

  // Theming colors
  const panelBg = isLight ? 'bg-white border-slate-300 shadow-md' : 'bg-[#0F172A] border-indigo-500/20 shadow-xl';
  const headerText = isLight ? 'text-slate-900' : 'text-slate-100';
  const labelText = isLight ? 'text-slate-500' : 'text-slate-400';
  const closeBtnBg = isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-800 text-slate-400';
  const chipBgDefault = isLight
    ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-200'
    : 'bg-[#1E283D] hover:bg-[#25324D] text-slate-300 border-white/[0.06]';
  const chipBgSelected = isLight
    ? 'bg-blue-100 text-blue-700 border-blue-400 shadow-xs font-semibold'
    : 'bg-indigo-950/90 text-indigo-200 border-indigo-400 shadow-sm font-semibold';
  const promptBg = isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#1E283D] border-slate-700/80';
  const promptFocusRing = isLight
    ? 'border-blue-500 ring-2 ring-blue-400/20'
    : 'border-indigo-400 ring-2 ring-indigo-500/20';

  // Ask AI execution
  const handleAskAiSubmit = () => {
    const answer = defaultAiGenerator.generateAskAi(contextText, selectedPersona);
    setAskAiAnswer(answer);
  };

  // Render Ask AI Mode UI
  if (selectedAction === 'ask_ai') {
    return (
      <div
        id="ai-reply-panel"
        className={`w-full ${panelBg} border-b p-3 flex flex-col gap-2.5 transition-all duration-200 select-none`}
      >
        {/* Ask AI Header: 🧠 ask ai + Action switcher + Close */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">🧠</span>
            <span className={`text-xs font-bold tracking-tight ${headerText}`}>ask ai</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Command Center
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onSelectAction('reply')}
              className={`text-[11px] px-2 py-0.5 rounded border ${
                isLight ? 'border-slate-300 text-slate-600 hover:bg-slate-100' : 'border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
              title="Switch back to writing actions"
            >
              Writing Mode
            </button>
            <button
              id="btn-close-ai-panel"
              onClick={onClose}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${closeBtnBg}`}
              title="Close AI Panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Persona row in Ask AI */}
        <div className="flex items-center justify-between text-xs">
          <span className={`text-[11px] font-medium ${labelText}`}>persona</span>
          <div className="relative" ref={personaRef}>
            <button
              id="btn-persona-selector-ask"
              onClick={() => setIsPersonaOpen(!isPersonaOpen)}
              className={`h-6 px-2 rounded-md border text-xs flex items-center gap-1 transition-colors ${
                isLight
                  ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700'
                  : 'bg-[#1E283D] hover:bg-[#25324D] border-slate-700 text-slate-200'
              }`}
            >
              <span>{activePersona.icon}</span>
              <span className="font-medium text-[11px]">{activePersona.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {isPersonaOpen && (
              <div
                className={`absolute right-0 bottom-full mb-1 z-50 w-36 rounded-lg border shadow-xl py-1 text-xs ${
                  isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#1E283D] border-slate-700 text-slate-100'
                }`}
              >
                {AI_TEMPORARY_PERSONAS.map((persona) => (
                  <button
                    key={persona.id}
                    onClick={() => {
                      onSelectPersona(persona.id);
                      setIsPersonaOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 text-left flex items-center justify-between gap-1.5 transition-colors ${
                      selectedPersona === persona.id
                        ? isLight
                          ? 'bg-blue-50 text-blue-600 font-semibold'
                          : 'bg-indigo-900/50 text-indigo-300 font-semibold'
                        : isLight
                        ? 'hover:bg-slate-100'
                        : 'hover:bg-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span>{persona.icon}</span>
                      <span className="text-[11px]">{persona.name}</span>
                    </div>
                    {selectedPersona === persona.id && <Check className="w-3 h-3 text-indigo-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Question prompt instruction */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className={`font-medium ${labelText}`}>ask or instruct ai...</span>
            {isPromptFocused && (
              <span className="text-[10px] text-indigo-400 font-semibold animate-pulse">
                Keyboard typing active
              </span>
            )}
          </div>

          <div
            id="custom-prompt-container"
            onClick={() => onTogglePromptFocus(true)}
            className={`w-full min-h-[34px] px-2.5 py-1.5 rounded-lg border flex items-center justify-between cursor-text transition-all duration-150 ${promptBg} ${
              isPromptFocused ? promptFocusRing : ''
            }`}
          >
            <div className="flex-1 text-xs flex items-center">
              {contextText ? (
                <span className={isLight ? 'text-slate-900 font-normal break-all' : 'text-slate-100 font-normal break-all'}>
                  {contextText}
                  {isPromptFocused && (
                    <span className="inline-block w-0.5 h-3.5 bg-indigo-400 ml-0.5 animate-pulse" />
                  )}
                </span>
              ) : (
                <span className="text-slate-400 text-xs italic">
                  type your question...
                  {isPromptFocused && (
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
        </div>

        {/* Ask Button: ask ✨ */}
        <button
          id="btn-ai-generate"
          onClick={handleAskAiSubmit}
          className={`w-full h-8 rounded-lg bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:brightness-110 text-white font-bold text-xs shadow-md shadow-indigo-900/30 flex items-center justify-center gap-1.5 transition-all duration-100 ${
            keyAnimationEnabled ? 'active:scale-98' : ''
          }`}
        >
          <span>ask</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-200" />
        </button>

        {/* Ask AI Result Card (Local response display) */}
        {askAiAnswer && (
          <div
            id="ask-ai-result"
            className={`p-2 rounded-lg border text-xs flex flex-col gap-1.5 ${
              isLight ? 'bg-blue-50/80 border-blue-200 text-slate-800' : 'bg-[#182337] border-indigo-500/30 text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-400">
              <span className="flex items-center gap-1">
                <span>{activePersona.icon}</span> AI Response
              </span>
              {onInsertAskAiResult && (
                <button
                  onClick={() => onInsertAskAiResult(askAiAnswer)}
                  className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-medium flex items-center gap-1 transition-colors"
                  title="Insert into message"
                >
                  <CornerDownLeft className="w-2.5 h-2.5" />
                  <span>Insert</span>
                </button>
              )}
            </div>
            <p className="text-[11px] leading-relaxed select-text">{askAiAnswer}</p>
          </div>
        )}
      </div>
    );
  }

  // Render Writing Actions Command Center (Default Panel)
  return (
    <div
      id="ai-reply-panel"
      className={`w-full ${panelBg} border-b p-2.5 flex flex-col gap-2 transition-all duration-200 select-none`}
    >
      {/* 1. Header: ✨ ai + close (×) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className={`text-xs font-bold tracking-tight ${headerText}`}>ai</span>
          <span className="text-[10px] text-slate-400 font-normal">command center</span>
        </div>
        <button
          id="btn-close-ai-panel"
          onClick={onClose}
          className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${closeBtnBg}`}
          title="Close AI Panel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Primary Actions: 2x2 Grid */}
      {/* [ 💬 reply ]      [ 🧠 ask ai ] */}
      {/* [ 🔄 continue ]   [ ✨ start ] */}
      <div className="grid grid-cols-2 gap-1.5">
        {AI_PRIMARY_ACTIONS.map((action) => {
          const isSelected = selectedAction === action.id;
          return (
            <button
              key={action.id}
              id={`ai-action-${action.id}`}
              onClick={() => onSelectAction(action.id)}
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

      {/* 3. More Actions Expandable Section */}
      <div className="flex flex-col gap-1">
        <button
          id="btn-more-actions"
          onClick={() => onToggleMoreExpanded(!isMoreExpanded)}
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
                  onClick={() => onSelectAction(action.id)}
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

      {/* 4. Persona Selector Row */}
      {/* persona [ 😊 friendly ▾ ] */}
      <div className="flex items-center justify-between text-xs py-0.5">
        <span className={`text-[11px] font-medium ${labelText}`}>persona</span>
        <div className="relative" ref={personaRef}>
          <button
            id="btn-persona-selector"
            onClick={() => setIsPersonaOpen(!isPersonaOpen)}
            className={`h-6 px-2 rounded-md border text-xs flex items-center gap-1 transition-colors ${
              isLight
                ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700'
                : 'bg-[#1E283D] hover:bg-[#25324D] border-slate-700 text-slate-200'
            }`}
          >
            <span>{activePersona.icon}</span>
            <span className="font-medium text-[11px]">{activePersona.name}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>

          {isPersonaOpen && (
            <div
              className={`absolute right-0 bottom-full mb-1 z-50 w-36 rounded-lg border shadow-xl py-1 text-xs ${
                isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#1E283D] border-slate-700 text-slate-100'
              }`}
            >
              {AI_TEMPORARY_PERSONAS.map((persona) => (
                <button
                  key={persona.id}
                  onClick={() => {
                    onSelectPersona(persona.id);
                    setIsPersonaOpen(false);
                  }}
                  className={`w-full px-2.5 py-1.5 text-left flex items-center justify-between gap-1.5 transition-colors ${
                    selectedPersona === persona.id
                      ? isLight
                        ? 'bg-blue-50 text-blue-600 font-semibold'
                        : 'bg-indigo-900/50 text-indigo-300 font-semibold'
                      : isLight
                      ? 'hover:bg-slate-100'
                      : 'hover:bg-slate-700/60'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span>{persona.icon}</span>
                    <span className="text-[11px]">{persona.name}</span>
                  </div>
                  {selectedPersona === persona.id && <Check className="w-3 h-3 text-indigo-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. Context / Instruction (Collapsible by default) */}
      <div className="flex flex-col gap-1">
        {!isContextExpanded && !contextText ? (
          <button
            id="btn-add-context"
            onClick={() => {
              onToggleContextExpanded(true);
              onTogglePromptFocus(true);
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
              {isPromptFocused && (
                <span className="text-[10px] text-indigo-400 font-semibold animate-pulse">
                  Keyboard typing active
                </span>
              )}
            </div>

            <div
              id="custom-prompt-container"
              onClick={() => onTogglePromptFocus(true)}
              className={`w-full min-h-[32px] px-2.5 py-1.5 rounded-lg border flex items-center justify-between cursor-text transition-all duration-150 ${promptBg} ${
                isPromptFocused ? promptFocusRing : ''
              }`}
            >
              <div className="flex-1 text-xs flex items-center">
                {contextText ? (
                  <span className={isLight ? 'text-slate-900 font-normal break-all' : 'text-slate-100 font-normal break-all'}>
                    {contextText}
                    {isPromptFocused && (
                      <span className="inline-block w-0.5 h-3.5 bg-indigo-400 ml-0.5 animate-pulse" />
                    )}
                  </span>
                ) : (
                  <span className="text-slate-400 text-xs italic">
                    type or paste context here...
                    {isPromptFocused && (
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
                      onTogglePromptFocus(false);
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

      {/* 6. Generate Button: generate ✨ */}
      <button
        id="btn-ai-generate"
        onClick={onGenerate}
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
