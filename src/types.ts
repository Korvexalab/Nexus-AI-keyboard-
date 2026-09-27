export type KeyboardMode = 'ALPHA' | 'SYMBOLS' | 'ALT_SYMBOLS';

export type ShiftState = 'OFF' | 'SHIFTED' | 'CAPS_LOCK';

export type AppTarget = 'notes' | 'whatsapp' | 'gmail' | 'chrome' | 'settings';

export type KeyboardThemeId = 'midnight' | 'light';

export type KeyboardHeight = 'short' | 'normal' | 'tall';

export interface KeyboardSettings {
  theme: KeyboardThemeId;
  hapticEnabled: boolean;
  height: KeyboardHeight;
  keyAnimationEnabled: boolean;
}

export interface ImeEventLog {
  id: string;
  timestamp: string;
  method: string;
  detail: string;
  tag: 'commit' | 'delete' | 'action' | 'key' | 'state';
}

export interface AndroidFileEntry {
  path: string;
  name: string;
  content: string;
  language: string;
  description: string;
}

export interface KeyboardActionListener {
  onTextInput: (text: string) => void;
  onBackspace: () => void;
  onSpace: () => void;
  onPeriod: () => void;
  onEnter: () => void;
  onShiftClicked: () => void;
  onShiftDoubleClicked: () => void;
  onSwitchMode: (mode: KeyboardMode) => void;
  onEmojiClicked: () => void;

  // Milestone 1B & 1C: Toolbar Actions
  onAiClicked: () => void;
  onGifClicked: () => void;
  onClipboardClicked: () => void;
  onThemeClicked: () => void;
  onSettingsClicked: () => void;
}
