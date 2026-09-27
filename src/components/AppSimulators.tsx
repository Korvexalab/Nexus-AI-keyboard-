import React from 'react';
import { AppTarget, KeyboardSettings, KeyboardThemeId, KeyboardHeight } from '../types';
import { Check, CheckCheck, Globe, Hand, Lock, Mail, MessageSquare, Palette, Search, Send, Settings, ShieldCheck, Smartphone, Sparkles } from 'lucide-react';

interface AppSimulatorsProps {
  target: AppTarget;
  text: string;
  cursorPos: number;
  onTextChange: (newText: string) => void;
  onClear: () => void;
  isImeEnabledInSettings: boolean;
  onToggleImeInSettings: () => void;
  isImeSelected: boolean;
  onSelectIme: () => void;
  chatMessages: Array<{ id: string; sender: 'them' | 'me'; text: string; time: string }>;
  onSendMessage: () => void;
  emailSubject: string;
  onEmailSubjectChange: (s: string) => void;
  activeField: 'primary' | 'subject';
  onSetActiveField: (f: 'primary' | 'subject') => void;
  settings: KeyboardSettings;
  onUpdateSettings: (newSettings: Partial<KeyboardSettings>) => void;
}

export const AppSimulators: React.FC<AppSimulatorsProps> = ({
  target,
  text,
  onClear,
  isImeEnabledInSettings,
  onToggleImeInSettings,
  isImeSelected,
  onSelectIme,
  chatMessages,
  onSendMessage,
  emailSubject,
  onEmailSubjectChange,
  activeField,
  onSetActiveField,
  settings,
  onUpdateSettings
}) => {
  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-950 text-slate-100">
      {/* 1. Android Basic TextField */}
      {target === 'notes' && (
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                  Aa
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">System EditText Field</h3>
                  <p className="text-[11px] text-slate-400">Direct Android InputConnection Target</p>
                </div>
              </div>
              {text.length > 0 && (
                <button
                  onClick={onClear}
                  className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded bg-rose-950/40 border border-rose-800/40"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="mt-4 p-3 bg-slate-900 border border-slate-800 rounded-xl min-h-[140px] focus-within:ring-2 focus-within:ring-blue-500/50">
              <div className="relative font-mono text-base tracking-normal text-slate-100 leading-relaxed whitespace-pre-wrap break-words min-h-[90px]">
                {text.length === 0 ? (
                  <span className="text-slate-500 not-italic select-none font-sans">
                    Tap the virtual keyboard below to type here using InputConnection...
                  </span>
                ) : (
                  text
                )}
                {/* Blinking Android cursor */}
                <span className="inline-block w-0.5 h-5 bg-blue-400 ml-0.5 align-middle animate-pulse"></span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 bg-slate-900/60 px-3 py-2 rounded-lg border border-slate-800">
            <span>Characters: <strong className="text-slate-200">{text.length}</strong></span>
            <span>Words: <strong className="text-slate-200">{text.trim() ? text.trim().split(/\s+/).length : 0}</strong></span>
            <span>Lines: <strong className="text-slate-200">{text ? text.split('\n').length : 1}</strong></span>
          </div>
        </div>
      )}

      {/* 2. WhatsApp Simulator */}
      {target === 'whatsapp' && (
        <div className="flex-1 flex flex-col justify-between bg-emerald-950/20">
          <div className="bg-emerald-900/40 px-3 py-2.5 border-b border-emerald-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-xs text-white">
                JD
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-100 leading-none">Jessica Doe</h4>
                <span className="text-[10px] text-emerald-400 font-medium">online</span>
              </div>
            </div>
            <MessageSquare className="w-4 h-4 text-emerald-400" />
          </div>

          {/* Chat Messages */}
          <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-2">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[78%] p-2 rounded-xl text-xs ${
                  msg.sender === 'me'
                    ? 'self-end bg-emerald-700/80 text-white rounded-tr-none'
                    : 'self-start bg-slate-850 bg-slate-900 text-slate-200 rounded-tl-none border border-slate-800'
                }`}
              >
                <p className="leading-snug">{msg.text}</p>
                <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-300">
                  <span>{msg.time}</span>
                  {msg.sender === 'me' && <CheckCheck className="w-3 h-3 text-emerald-300" />}
                </div>
              </div>
            ))}
          </div>

          {/* Active Input Line */}
          <div className="p-2 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2">
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-full px-3 py-1.5 text-xs text-slate-100 flex items-center min-h-[34px]">
              {text ? <span>{text}</span> : <span className="text-slate-500">Message Jessica...</span>}
              <span className="inline-block w-0.5 h-4 bg-emerald-400 ml-0.5 animate-pulse"></span>
            </div>
            <button
              onClick={onSendMessage}
              disabled={!text.trim()}
              className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 flex items-center justify-center text-white"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Gmail Simulator */}
      {target === 'gmail' && (
        <div className="p-3 flex-1 flex flex-col justify-between bg-slate-950">
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Mail className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs font-semibold text-slate-200">Compose Email</h3>
            </div>

            <div className="mt-2 flex flex-col gap-2 text-xs">
              <div className="flex items-center gap-2 py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400 text-[11px] w-12">To:</span>
                <span className="text-slate-200 font-mono text-[11px]">team@company.internal</span>
              </div>

              <div
                onClick={() => onSetActiveField('subject')}
                className={`flex items-center gap-2 py-1.5 border-b border-slate-800/80 cursor-pointer ${
                  activeField === 'subject' ? 'bg-blue-950/20 px-1 rounded' : ''
                }`}
              >
                <span className="text-slate-400 text-[11px] w-12">Subject:</span>
                <span className="flex-1 text-slate-100">{emailSubject || <span className="text-slate-600">Enter subject...</span>}</span>
                {activeField === 'subject' && <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>}
              </div>

              <div
                onClick={() => onSetActiveField('primary')}
                className={`mt-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800 min-h-[90px] cursor-pointer ${
                  activeField === 'primary' ? 'ring-1 ring-blue-500/50' : ''
                }`}
              >
                <div className="text-slate-100 text-xs whitespace-pre-wrap leading-relaxed">
                  {text || <span className="text-slate-600">Compose email body via IME...</span>}
                  {activeField === 'primary' && (
                    <span className="inline-block w-0.5 h-4 bg-blue-400 ml-0.5 align-middle animate-pulse"></span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            <span>Active Field: <strong className="text-blue-400 capitalize">{activeField}</strong></span>
            <button
              onClick={() => onSetActiveField(activeField === 'primary' ? 'subject' : 'primary')}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Switch Field
            </button>
          </div>
        </div>
      )}

      {/* 4. Chrome Simulator */}
      {target === 'chrome' && (
        <div className="p-3 flex-1 flex flex-col justify-between bg-slate-950">
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Globe className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-semibold text-slate-200">Chrome Browser URL / Search</h3>
            </div>

            <div className="mt-3 flex items-center gap-2 p-2 bg-slate-900 border border-slate-800 rounded-full focus-within:ring-2 focus-within:ring-blue-500/50">
              <Search className="w-4 h-4 text-slate-500 ml-1" />
              <div className="flex-1 text-xs text-slate-100 font-mono truncate">
                {text ? (
                  <span>{text}</span>
                ) : (
                  <span className="text-slate-500 font-sans">Search or type web address...</span>
                )}
                <span className="inline-block w-0.5 h-3.5 bg-blue-400 ml-0.5 align-middle animate-pulse"></span>
              </div>
              {text && (
                <button onClick={onClear} className="text-[10px] text-slate-400 hover:text-slate-200 mr-2">
                  ✕
                </button>
              )}
            </div>

            <div className="mt-4 p-3 bg-slate-900/40 rounded-xl border border-slate-800/80">
              <p className="text-[11px] text-slate-400 font-medium">IME Action Mode:</p>
              <p className="text-xs text-blue-300 mt-1">EditorInfo.IME_ACTION_SEARCH</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Pressing the blue enter key triggers <code className="text-blue-400 font-mono">performEditorAction(IME_ACTION_SEARCH)</code>.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
            <span>Query: <strong className="text-slate-200">{text || '(empty)'}</strong></span>
            <span className="text-emerald-400 font-medium">InputConnection Ready</span>
          </div>
        </div>
      )}

      {/* 5. Android Settings, Onboarding & Keyboard Preferences */}
      {target === 'settings' && (
        <div className="p-3 flex-1 flex flex-col justify-between bg-slate-950 overflow-y-auto">
          <div className="flex flex-col gap-3 pb-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  AI Keyboard Settings &amp; Setup
                </h3>
              </div>
              <span className="text-[10px] bg-indigo-950 border border-indigo-700/50 text-indigo-300 px-2 py-0.5 rounded-full font-semibold">
                Milestone 1C
              </span>
            </div>

            {/* SECTION 1: ONBOARDING */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                Step-by-Step Onboarding
              </span>

              {/* Step 1: Enable in Settings */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isImeEnabledInSettings ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Enable in Android Settings</h4>
                    <p className="text-[10px] text-slate-400">Settings &gt; System &gt; Languages &gt; On-screen</p>
                  </div>
                </div>
                <button
                  onClick={onToggleImeInSettings}
                  className={`w-10 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                    isImeEnabledInSettings ? 'bg-emerald-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      isImeEnabledInSettings ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Step 2: Select as Active IME */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isImeSelected ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Select as Active Keyboard</h4>
                    <p className="text-[10px] text-slate-400">InputMethodManager.showInputMethodPicker()</p>
                  </div>
                </div>
                <button
                  onClick={onSelectIme}
                  disabled={!isImeEnabledInSettings}
                  className={`text-[11px] px-2.5 py-1 rounded font-medium transition-all ${
                    isImeSelected
                      ? 'bg-blue-600 text-white'
                      : isImeEnabledInSettings
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
                  }`}
                >
                  {isImeSelected ? 'Active' : 'Select'}
                </button>
              </div>
            </div>

            {/* SECTION 2: THEMES */}
            <div className="flex flex-col gap-2 pt-1 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  Keyboard Theme
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Midnight Theme Option */}
                <button
                  id="theme-option-midnight"
                  onClick={() => onUpdateSettings({ theme: 'midnight' })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    settings.theme === 'midnight'
                      ? 'bg-indigo-950/60 border-indigo-500 ring-1 ring-indigo-500/50'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-100">Midnight</span>
                    {settings.theme === 'midnight' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                  <div className="flex gap-1 mb-1">
                    <div className="w-3 h-3 rounded bg-[#090D16] border border-slate-700"></div>
                    <div className="w-3 h-3 rounded bg-[#1E283D] border border-slate-700"></div>
                    <div className="w-3 h-3 rounded bg-[#2563EB]"></div>
                  </div>
                  <p className="text-[10px] text-slate-400">Dark navy &amp; violet</p>
                </button>

                {/* Light Theme Option */}
                <button
                  id="theme-option-light"
                  onClick={() => onUpdateSettings({ theme: 'light' })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    settings.theme === 'light'
                      ? 'bg-slate-800/60 border-blue-400 ring-1 ring-blue-400/50'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-100">Light</span>
                    {settings.theme === 'light' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </div>
                  <div className="flex gap-1 mb-1">
                    <div className="w-3 h-3 rounded bg-[#F1F5F9] border border-slate-400"></div>
                    <div className="w-3 h-3 rounded bg-white border border-slate-300"></div>
                    <div className="w-3 h-3 rounded bg-[#2563EB]"></div>
                  </div>
                  <p className="text-[10px] text-slate-400">Clean daylight mode</p>
                </button>
              </div>
            </div>

            {/* SECTION 3: KEYBOARD HEIGHT */}
            <div className="flex flex-col gap-2 pt-1 border-t border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                Keyboard Height
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(['short', 'normal', 'tall'] as KeyboardHeight[]).map((h) => {
                  const isSelected = settings.height === h;
                  return (
                    <button
                      key={h}
                      onClick={() => onUpdateSettings({ height: h })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium capitalize transition-all border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-400 font-bold shadow-xs'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850'
                      }`}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECTION 4: TOGGLES (Haptic & Key Animation) */}
            <div className="flex flex-col gap-2 pt-1 border-t border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                Feedback &amp; Polish
              </span>

              {/* Haptic Feedback */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-slate-300" />
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Haptic Feedback</h4>
                    <p className="text-[10px] text-slate-400">Vibrate when keys are tapped</p>
                  </div>
                </div>
                <button
                  onClick={() => onUpdateSettings({ hapticEnabled: !settings.hapticEnabled })}
                  className={`w-10 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                    settings.hapticEnabled ? 'bg-blue-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      settings.hapticEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Key Press Animation */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hand className="w-4 h-4 text-slate-300" />
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Key Press Animation</h4>
                    <p className="text-[10px] text-slate-400">80-150ms press feedback scale</p>
                  </div>
                </div>
                <button
                  onClick={() => onUpdateSettings({ keyAnimationEnabled: !settings.keyAnimationEnabled })}
                  className={`w-10 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                    settings.keyAnimationEnabled ? 'bg-blue-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      settings.keyAnimationEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* SECTION 5: PRIVACY COMMITMENT */}
            <div className="p-2.5 bg-slate-900/50 border border-slate-800/80 rounded-xl flex items-start gap-2 text-[10px] text-slate-400">
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>100% On-Device &amp; Private:</strong> AI Keyboard strictly runs locally. No keystrokes, messages, passwords, or personal data are collected, stored remotely, or transmitted.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
