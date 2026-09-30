import React from 'react';
import { AppTarget, KeyboardMode, ShiftState, KeyboardActionListener, KeyboardSettings } from '../types';
import { VirtualKeyboard } from './VirtualKeyboard';
import { AppSimulators } from './AppSimulators';
import { Battery, MessageSquare, Mail, Globe, Settings, FileText, Wifi, Signal } from 'lucide-react';

interface AndroidDeviceFrameProps {
  appTarget: AppTarget;
  onSelectApp: (app: AppTarget) => void;
  text: string;
  cursorPos: number;
  onTextChange: (newText: string) => void;
  onClear: () => void;
  keyboardMode: KeyboardMode;
  shiftState: ShiftState;
  keyboardListener: KeyboardActionListener;
  aiNoticeVisible?: boolean;
  aiPanelVisible?: boolean;
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

export const AndroidDeviceFrame: React.FC<AndroidDeviceFrameProps> = ({
  appTarget,
  onSelectApp,
  text,
  cursorPos,
  onTextChange,
  onClear,
  keyboardMode,
  shiftState,
  keyboardListener,
  aiNoticeVisible = false,
  aiPanelVisible = false,
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
  const enterLabel =
    appTarget === 'whatsapp' ? 'Send' : appTarget === 'chrome' ? 'Search' : 'Enter';

  return (
    <div
      id="android-device-container"
      className="relative w-full max-w-[420px] h-[780px] bg-slate-900 rounded-[44px] p-3 shadow-2xl border-4 border-slate-700/80 flex flex-col justify-between select-none ring-1 ring-white/10"
    >
      {/* Device Inner Screen */}
      <div className="relative w-full h-full bg-slate-950 rounded-[34px] overflow-hidden flex flex-col justify-between border border-slate-800">
        {/* Top Status Bar */}
        <div className="h-9 px-6 bg-slate-950/80 backdrop-blur flex items-center justify-between text-xs text-slate-300 z-10 shrink-0 select-none">
          <span className="font-semibold text-[11px] tracking-tight">12:30</span>

          {/* Notch / Front Camera */}
          <div className="w-18 h-4 bg-black rounded-full flex items-center justify-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800"></div>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* App Switcher Bar inside Android Screen */}
        <div className="px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-1 shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
            <button
              id="app-tab-notes"
              onClick={() => onSelectApp('notes')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 shrink-0 transition-colors ${
                appTarget === 'notes' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>EditText</span>
            </button>

            <button
              id="app-tab-whatsapp"
              onClick={() => onSelectApp('whatsapp')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 shrink-0 transition-colors ${
                appTarget === 'whatsapp' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              <span>WhatsApp</span>
            </button>

            <button
              id="app-tab-gmail"
              onClick={() => onSelectApp('gmail')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 shrink-0 transition-colors ${
                appTarget === 'gmail' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Mail className="w-3 h-3" />
              <span>Gmail</span>
            </button>

            <button
              id="app-tab-chrome"
              onClick={() => onSelectApp('chrome')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 shrink-0 transition-colors ${
                appTarget === 'chrome' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>Chrome</span>
            </button>

            <button
              id="app-tab-settings"
              onClick={() => onSelectApp('settings')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 shrink-0 transition-colors ${
                appTarget === 'settings' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Settings className="w-3 h-3" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Main Content Area (Active Application) */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <AppSimulators
            target={appTarget}
            text={text}
            cursorPos={cursorPos}
            onTextChange={onTextChange}
            onClear={onClear}
            isImeEnabledInSettings={isImeEnabledInSettings}
            onToggleImeInSettings={onToggleImeInSettings}
            isImeSelected={isImeSelected}
            onSelectIme={onSelectIme}
            chatMessages={chatMessages}
            onSendMessage={onSendMessage}
            emailSubject={emailSubject}
            onEmailSubjectChange={onEmailSubjectChange}
            activeField={activeField}
            onSetActiveField={onSetActiveField}
            settings={settings}
            onUpdateSettings={onUpdateSettings}
          />
        </div>

        {/* Docked Android System Keyboard with dynamic Theme & Height */}
        <div className="shrink-0">
          <VirtualKeyboard
            mode={keyboardMode}
            shiftState={shiftState}
            listener={keyboardListener}
            aiNoticeVisible={aiNoticeVisible}
            aiPanelVisible={aiPanelVisible}
            enterLabel={enterLabel}
            theme={settings.theme}
            height={settings.height}
            keyAnimationEnabled={settings.keyAnimationEnabled}
            hapticEnabled={settings.hapticEnabled}
          />

          {/* Android Gesture Navigation Pill */}
          <div className={`h-4 ${settings.theme === 'light' ? 'bg-[#F1F5F9]' : 'bg-[#090D16]'} flex items-center justify-center transition-colors duration-200`}>
            <div className={`w-28 h-1 ${settings.theme === 'light' ? 'bg-slate-400' : 'bg-slate-700'} rounded-full`}></div>
          </div>
        </div>
      </div>
    </div>
  );
};
