import React, { useState, useRef, useCallback } from 'react';
import {
  KeyboardMode,
  ShiftState,
  AppTarget,
  ImeEventLog,
  KeyboardActionListener,
  KeyboardSettings,
  KeyboardThemeId
} from './types';
import { AndroidDeviceFrame } from './components/AndroidDeviceFrame';
import { InputConnectionLog } from './components/InputConnectionLog';
import { SourceCodeViewer } from './components/SourceCodeViewer';
import { GitHubWorkflowViewer } from './components/GitHubWorkflowViewer';
import {
  CheckCircle2,
  Code2,
  Download,
  GitBranch,
  Github,
  Palette,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Volume2,
  VolumeX
} from 'lucide-react';
import JSZip from 'jszip';
import { ANDROID_FILES } from './androidSources';

export default function App() {
  // Navigation tabs for desktop view
  const [activeTab, setActiveTab] = useState<'simulator' | 'code' | 'cicd'>('simulator');

  // Active Android app inside phone
  const [appTarget, setAppTarget] = useState<AppTarget>('notes');

  // Text buffer & Cursor state (simulating Android InputConnection buffer)
  const [text, setText] = useState<string>('Hello Android! Testing Milestone 1C.');
  const [cursorPos, setCursorPos] = useState<number>(36);

  // Email app specific fields
  const [emailSubject, setEmailSubject] = useState<string>('Milestone 1C Themes & Settings');
  const [activeField, setActiveField] = useState<'primary' | 'subject'>('primary');

  // WhatsApp chat messages
  const [chatMessages, setChatMessages] = useState<
    Array<{ id: string; sender: 'them' | 'me'; text: string; time: string }>
  >([
    {
      id: '1',
      sender: 'them',
      text: 'Have you tested the Midnight and Light themes in Milestone 1C?',
      time: '12:28'
    },
    {
      id: '2',
      sender: 'me',
      text: 'Yes! Both Midnight and Light look crisp, and settings persist locally without any telemetry.',
      time: '12:29'
    }
  ]);

  // Keyboard layout modes & shift states
  const [keyboardMode, setKeyboardMode] = useState<KeyboardMode>('ALPHA');
  const [shiftState, setShiftState] = useState<ShiftState>('OFF');
  const lastShiftClickRef = useRef<number>(0);

  // Milestone 1C: Local Keyboard Settings
  const [settings, setSettings] = useState<KeyboardSettings>({
    theme: 'midnight',
    hapticEnabled: true,
    height: 'normal',
    keyAnimationEnabled: true
  });

  // AI Notice Banner
  const [aiNoticeVisible, setAiNoticeVisible] = useState<boolean>(false);
  const aiNoticeTimeoutRef = useRef<number | null>(null);

  // Android Settings status
  const [isImeEnabledInSettings, setIsImeEnabledInSettings] = useState<boolean>(true);
  const [isImeSelected, setIsImeSelected] = useState<boolean>(true);

  // Sound feedback toggle
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Live InputConnection trace logs
  const [logs, setLogs] = useState<ImeEventLog[]>([
    {
      id: 'init-1',
      timestamp: '12:30:01',
      method: 'onCreateInputView()',
      detail: 'ComposeView initialized with ViewTreeLifecycleOwner',
      tag: 'state'
    },
    {
      id: 'init-2',
      timestamp: '12:30:02',
      method: 'KeyboardPreferences',
      detail: 'Loaded local prefs: Theme=MIDNIGHT, Haptic=ON, Height=NORMAL, Anim=ON',
      tag: 'state'
    },
    {
      id: 'init-3',
      timestamp: '12:30:03',
      method: 'onStartInputView()',
      detail: 'EditorInfo: TYPE_CLASS_TEXT | IME_ACTION_DONE',
      tag: 'state'
    },
    {
      id: 'init-4',
      timestamp: '12:30:04',
      method: 'KeyboardToolbar',
      detail: '✨ AI pill + Quick actions (Emoji, GIF, Clipboard, Theme, Settings) loaded',
      tag: 'state'
    }
  ]);

  const addLog = useCallback(
    (method: string, detail: string, tag: 'commit' | 'delete' | 'action' | 'key' | 'state') => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
      setLogs((prev) => [
        {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: timeStr,
          method,
          detail,
          tag
        },
        ...prev.slice(0, 49) // Keep last 50 logs
      ]);
    },
    []
  );

  const handleUpdateSettings = useCallback(
    (partial: Partial<KeyboardSettings>) => {
      setSettings((prev) => {
        const updated = { ...prev, ...partial };
        if (partial.theme !== undefined) {
          addLog('Preferences', `Theme changed to: ${partial.theme.toUpperCase()}`, 'state');
        }
        if (partial.hapticEnabled !== undefined) {
          addLog('Preferences', `Haptic feedback: ${partial.hapticEnabled ? 'ENABLED' : 'DISABLED'}`, 'state');
          setSoundEnabled(partial.hapticEnabled);
        }
        if (partial.height !== undefined) {
          addLog('Preferences', `Keyboard height set to: ${partial.height.toUpperCase()}`, 'state');
        }
        if (partial.keyAnimationEnabled !== undefined) {
          addLog('Preferences', `Key press animation: ${partial.keyAnimationEnabled ? 'ENABLED' : 'DISABLED'}`, 'state');
        }
        return updated;
      });
    },
    [addLog]
  );

  // Synthesize key click & haptic sound
  const playClickSound = useCallback(() => {
    if (!soundEnabled || !settings.hapticEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.03);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } catch {
      // Audio not permitted or supported
    }
  }, [soundEnabled, settings.hapticEnabled]);

  // InputConnection implementation mapped to virtual keyboard actions
  const keyboardListener: KeyboardActionListener = {
    onTextInput: (char: string) => {
      playClickSound();

      if (appTarget === 'gmail' && activeField === 'subject') {
        setEmailSubject((prev) => prev + char);
        addLog('ic.commitText()', `commitText("${char}", 1) to Subject`, 'commit');
      } else {
        setText((prev) => prev + char);
        setCursorPos((prev) => prev + char.length);
        addLog('ic.commitText()', `commitText("${char}", 1)`, 'commit');
      }

      // One-shot shift auto reset
      if (shiftState === 'SHIFTED') {
        setShiftState('OFF');
        addLog('ShiftState', 'Reset to OFF (lowercase) after single key commit', 'state');
      }
    },

    onBackspace: () => {
      playClickSound();

      if (appTarget === 'gmail' && activeField === 'subject') {
        setEmailSubject((prev) => prev.slice(0, -1));
        addLog('ic.deleteSurroundingText()', 'deleteSurroundingText(1, 0) from Subject', 'delete');
      } else {
        setText((prev) => (prev.length > 0 ? prev.slice(0, -1) : ''));
        setCursorPos((prev) => Math.max(0, prev - 1));
        addLog('ic.deleteSurroundingText()', 'deleteSurroundingText(1, 0)', 'delete');
      }
    },

    onSpace: () => {
      playClickSound();
      if (appTarget === 'gmail' && activeField === 'subject') {
        setEmailSubject((prev) => prev + ' ');
        addLog('ic.commitText()', 'commitText(" ", 1)', 'commit');
      } else {
        setText((prev) => prev + ' ');
        setCursorPos((prev) => prev + 1);
        addLog('ic.commitText()', 'commitText(" ", 1)', 'commit');
      }
    },

    onPeriod: () => {
      playClickSound();
      if (appTarget === 'gmail' && activeField === 'subject') {
        setEmailSubject((prev) => prev + '.');
      } else {
        setText((prev) => prev + '.');
        setCursorPos((prev) => prev + 1);
      }
      addLog('ic.commitText()', 'commitText(".", 1)', 'commit');
    },

    onEnter: () => {
      playClickSound();

      if (appTarget === 'whatsapp') {
        if (text.trim()) {
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          setChatMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              sender: 'me',
              text: text.trim(),
              time: timeStr
            }
          ]);
          setText('');
          setCursorPos(0);
          addLog('ic.performEditorAction()', 'performEditorAction(IME_ACTION_SEND)', 'action');
        }
      } else if (appTarget === 'chrome') {
        addLog('ic.performEditorAction()', `performEditorAction(IME_ACTION_SEARCH): "${text}"`, 'action');
      } else if (appTarget === 'gmail') {
        if (activeField === 'subject') {
          setActiveField('primary');
          addLog('ic.performEditorAction()', 'performEditorAction(IME_ACTION_NEXT) -> Switched to Body', 'action');
        } else {
          setText((prev) => prev + '\n');
          setCursorPos((prev) => prev + 1);
          addLog('ic.sendKeyEvent()', 'sendKeyEvent(KeyEvent.KEYCODE_ENTER)', 'key');
        }
      } else {
        // Default text field: newline
        setText((prev) => prev + '\n');
        setCursorPos((prev) => prev + 1);
        addLog('ic.sendKeyEvent()', 'sendKeyEvent(KeyEvent.KEYCODE_ENTER) -> committed newline', 'key');
      }
    },

    onShiftClicked: () => {
      playClickSound();
      const now = Date.now();
      if (now - lastShiftClickRef.current < 300) {
        setShiftState((prev) => (prev === 'CAPS_LOCK' ? 'OFF' : 'CAPS_LOCK'));
        addLog('ShiftState', 'Double click: Toggled CAPS_LOCK', 'state');
      } else {
        setShiftState((prev) => (prev === 'OFF' ? 'SHIFTED' : 'OFF'));
        addLog('ShiftState', 'Single click: Toggled SHIFTED', 'state');
      }
      lastShiftClickRef.current = now;
    },

    onShiftDoubleClicked: () => {
      playClickSound();
      setShiftState('CAPS_LOCK');
      addLog('ShiftState', 'CAPS_LOCK enabled', 'state');
    },

    onSwitchMode: (targetMode: KeyboardMode) => {
      playClickSound();
      setKeyboardMode(targetMode);
      addLog('KeyboardMode', `Switched layout to ${targetMode}`, 'state');
    },

    onEmojiClicked: () => {
      playClickSound();
      const emoji = '😀';
      setText((prev) => prev + emoji);
      setCursorPos((prev) => prev + emoji.length);
      addLog('ic.commitText()', `commitText("${emoji}", 1)`, 'commit');
    },

    // Milestone 1B & 1C: Toolbar Actions
    onAiClicked: () => {
      playClickSound();
      if (aiNoticeTimeoutRef.current) {
        window.clearTimeout(aiNoticeTimeoutRef.current);
      }
      setAiNoticeVisible(true);
      addLog('Toolbar: AI', '✨ AI button clicked -> Showing "AI Assistant — Coming Soon"', 'action');
      aiNoticeTimeoutRef.current = window.setTimeout(() => {
        setAiNoticeVisible(false);
      }, 2500);
    },

    onGifClicked: () => {
      playClickSound();
      addLog('Toolbar: GIF', 'GIF picker triggered', 'state');
    },

    onClipboardClicked: () => {
      playClickSound();
      const sampleClip = '📋 [Pasted Clipboard Text]';
      setText((prev) => prev + sampleClip);
      setCursorPos((prev) => prev + sampleClip.length);
      addLog('Toolbar: Clipboard', `Pasted "${sampleClip}" via InputConnection`, 'commit');
    },

    onThemeClicked: () => {
      playClickSound();
      const nextTheme: KeyboardThemeId = settings.theme === 'midnight' ? 'light' : 'midnight';
      handleUpdateSettings({ theme: nextTheme });
    },

    onSettingsClicked: () => {
      playClickSound();
      setAppTarget('settings');
      addLog('Toolbar: Settings', 'Navigated to AI Keyboard Settings & Onboarding', 'state');
    }
  };

  const handleSendMessage = () => {
    if (!text.trim()) return;
    keyboardListener.onEnter();
  };

  // Download all Android files as a ZIP
  const handleDownloadZip = async () => {
    try {
      const zip = new JSZip();
      for (const file of ANDROID_FILES) {
        zip.file(file.path, file.content);
      }
      zip.file(
        'gradle.properties',
        'org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8\nandroid.useAndroidX=true\nandroid.nonTransitiveRClass=true\n'
      );
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'AIKeyboard-Android-Milestone1C.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* App Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-30 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 flex items-center justify-center shadow-lg shadow-indigo-500/25 text-white font-bold text-lg">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-100 tracking-tight">AI Keyboard</h1>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
                  Milestone 1C
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20 hidden sm:inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Themes + Settings + Onboarding
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Midnight &amp; Light Themes • On-Device Settings • Onboarding Setup • 100% Private
              </p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2.5">
            {/* Theme quick switch button */}
            <button
              onClick={() => handleUpdateSettings({ theme: settings.theme === 'midnight' ? 'light' : 'midnight' })}
              className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 text-xs font-medium flex items-center gap-1.5 hover:bg-slate-750 transition-colors"
              title="Quick Toggle Theme"
            >
              <Palette className="w-3.5 h-3.5 text-indigo-400" />
              <span className="capitalize">{settings.theme}</span>
            </button>

            {/* Audio Toggle */}
            <button
              onClick={() => handleUpdateSettings({ hapticEnabled: !settings.hapticEnabled })}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                settings.hapticEnabled
                  ? 'bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
              title={settings.hapticEnabled ? 'Haptic/Key Click: On' : 'Haptic/Key Click: Off'}
            >
              {settings.hapticEnabled ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* View switcher tabs */}
            <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800">
              <button
                onClick={() => setActiveTab('simulator')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                  activeTab === 'simulator'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Emulator</span>
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                  activeTab === 'code'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Code Files</span>
              </button>
              <button
                onClick={() => setActiveTab('cicd')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                  activeTab === 'cicd'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub Actions CI</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </button>
            </div>

            {/* Export Zip */}
            <button
              onClick={handleDownloadZip}
              className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-md shadow-indigo-900/30 transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Android Project (.ZIP)</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 flex flex-col gap-6">
        {/* Verification Checklist Bar */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Milestone 1C Deliverables</h2>
              <p className="text-xs text-slate-400">
                Midnight &amp; Light themes, local SharedPreferences, interactive Onboarding wizard, and zero telemetry.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Themes: Midnight &amp; Light
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Height: Short / Normal / Tall
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Haptic &amp; Animation Toggles
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Onboarding Setup Wizard
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Local &amp; Private
            </span>
            <button
              onClick={() => setActiveTab('cicd')}
              className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 flex items-center gap-1 transition-colors"
            >
              <GitBranch className="w-3.5 h-3.5 text-indigo-400" /> CI/CD: Push &rarr; Debug APK
            </button>
          </div>
        </div>

        {/* Content Layout */}
        {activeTab === 'cicd' ? (
          <div className="w-full flex-1 min-h-[600px]">
            <GitHubWorkflowViewer />
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Android Device Emulator */}
            <div
              className={`lg:col-span-5 flex flex-col items-center justify-center ${
                activeTab === 'code' ? 'hidden lg:flex' : 'flex'
              }`}
            >
              <div className="w-full flex items-center justify-between mb-2 px-1 text-xs text-slate-400">
                <span>Android 14 (API 34) Runtime</span>
                <span className="text-emerald-400 font-mono">
                  Theme: <span className="uppercase font-bold">{settings.theme}</span>
                </span>
              </div>

              <AndroidDeviceFrame
                appTarget={appTarget}
                onSelectApp={setAppTarget}
                text={text}
                cursorPos={cursorPos}
                onTextChange={setText}
                onClear={() => {
                  setText('');
                  setCursorPos(0);
                  addLog('ic.commitText()', 'commitText("", 1) -> Cleared buffer', 'commit');
                }}
                keyboardMode={keyboardMode}
                shiftState={shiftState}
                keyboardListener={keyboardListener}
                aiNoticeVisible={aiNoticeVisible}
                isImeEnabledInSettings={isImeEnabledInSettings}
                onToggleImeInSettings={() => {
                  const next = !isImeEnabledInSettings;
                  setIsImeEnabledInSettings(next);
                  if (!next) setIsImeSelected(false);
                  addLog('Settings.Secure', `AI Keyboard IME status changed to: ${next ? 'ENABLED' : 'DISABLED'}`, 'state');
                }}
                isImeSelected={isImeSelected}
                onSelectIme={() => {
                  setIsImeSelected(true);
                  addLog('InputMethodManager', 'showInputMethodPicker() -> Selected AI Keyboard as active IME', 'state');
                }}
                chatMessages={chatMessages}
                onSendMessage={handleSendMessage}
                emailSubject={emailSubject}
                onEmailSubjectChange={setEmailSubject}
                activeField={activeField}
                onSetActiveField={setActiveField}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
              />
            </div>

            {/* Right Column: InputConnection Trace & Android Studio Project Files */}
            <div
              className={`lg:col-span-7 flex flex-col gap-6 ${
                activeTab === 'simulator' ? 'hidden lg:flex' : 'flex'
              }`}
            >
              {/* InputConnection Live Trace */}
              <div className="h-[280px]">
                <InputConnectionLog logs={logs} onClear={() => setLogs([])} />
              </div>

              {/* Android Studio Source Code & Manifest Inspector */}
              <div className="h-[475px]">
                <SourceCodeViewer />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 px-4 text-center text-xs text-slate-500">
        AI Keyboard Project • Milestone 1C: Themes &amp; Settings • Ready for physical device verification before Milestone 2
      </footer>
    </div>
  );
}
