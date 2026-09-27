# AI Keyboard — Milestone 1A

**Android InputMethodService (IME) Foundation + Material 3 Jetpack Compose Keyboard**

This project provides the complete, production-grade Android IME implementation for **AI Keyboard (Milestone 1A)**. It connects directly to the Android operating system using `InputMethodService` and interacts with system text fields via `InputConnection`.

---

## 🏗 Architecture & Technologies

- **Language:** Kotlin 2.0.0
- **Android Target:** Android 14 (API 34), Min SDK 26 (Android 8.0+)
- **System Service:** `android.inputmethodservice.InputMethodService`
- **Text Communication:** `android.view.inputmethod.InputConnection`
- **UI Toolkit:** Jetpack Compose with Material 3
- **Build System:** Gradle Kotlin DSL (`build.gradle.kts`, `settings.gradle.kts`)

---

## 📁 Project Structure

```
├── app/
│   ├── build.gradle.kts              # Application module Gradle Kotlin DSL
│   ├── proguard-rules.pro            # Service keep rules
│   └── src/
│       └── main/
│           ├── AndroidManifest.xml   # Registers BIND_INPUT_METHOD service & MainActivity
│           ├── res/
│           │   ├── xml/method.xml    # Android IME subtype & settings configuration
│           │   └── values/           # strings.xml, colors.xml, themes.xml
│           └── java/com/aikeyboard/
│               ├── MainActivity.kt   # Setup wizard (Enable IME, Select IME, Test field)
│               └── ime/
│                   ├── AiInputMethodService.kt             # InputMethodService + InputConnection handling
│                   ├── ComposeLifecycleInputMethodService.kt # LifecycleOwner / SavedState bridge for ComposeView
│                   ├── KeyboardState.kt                    # KeyboardMode (Alpha/Symbols), ShiftState, Action contract
│                   └── ui/
│                       ├── ComposeKeyboardView.kt          # Material 3 QWERTY & Symbols keyboard layout
│                       └── theme/                          # Theme.kt, Color.kt, Type.kt
├── build.gradle.kts                  # Root project build file
├── settings.gradle.kts               # Module and repository configuration
└── gradle.properties
```

---

## ⌨️ Features Implemented in Milestone 1A

1. **System-Level IME Service:** Registered in `AndroidManifest.xml` with `android.permission.BIND_INPUT_METHOD` and `<action android:name="android.view.InputMethod" />`.
2. **Standard QWERTY Layout:**
   - Row 1: `Q W E R T Y U I O P`
   - Row 2: `A S D F G H J K L`
   - Row 3: `Shift`, `Z X C V B N M`, `Backspace`
   - Row 4: `?123` (Symbols), `Emoji`, `Space`, `Period (.)`, `Enter`
3. **Symbols & Numbers Layout:**
   - Numbers `1-0`, standard symbols `@ # $ % & - + ( )`, `* " ' : ; ! ?`
   - Alternate symbols toggle (`=\<` and `?123`) for `~ ` | \ ^ = < > { } [ ] _ € £ ¥`
   - Return to alphabet (`ABC`)
4. **Shift Behavior:**
   - Single tap: Uppercase one-shot (auto-returns to lowercase after typing one character)
   - Double tap: Persistent Caps Lock
   - Third tap: Lowercase
5. **Accurate InputConnection Integration:**
   - `commitText(text, 1)` for text insertion and space/period
   - `deleteSurroundingText(1, 0)` and selection deletion for Backspace
   - `performEditorAction()` / `sendKeyEvent(KEYCODE_ENTER)` for Enter/Search/Send/Done actions

---

## 🚀 How to Build & Run in Android Studio

1. Open this repository folder in **Android Studio** (Hedgehog, Iguana, Jellyfish, or newer).
2. Allow Gradle to sync.
3. Connect an Android device with USB debugging enabled, or start an Android Emulator.
4. Run:
   ```bash
   ./gradlew assembleDebug
   ./gradlew installDebug
   ```
5. Launch **AI Keyboard** on your device to open the Setup Wizard:
   - Tap **Open Settings** to enable AI Keyboard under *System > Languages & input > On-screen keyboard*.
   - Tap **Switch Keyboard** to select AI Keyboard as your default input method.
   - Test typing in any external app (WhatsApp, Chrome, Gmail, Telegram, etc.).

---

## ⚡ GitHub Actions CI/CD: Automated Debug APK on Push

This repository includes a fully automated GitHub Actions pipeline in [`.github/workflows/android-apk.yml`](.github/workflows/android-apk.yml).

### 🔄 Immediate Trigger
The workflow triggers **immediately** whenever you push commits to any branch or tag:
- **Push Triggers:** `branches: ['**']`, `tags: ['**']`
- **Manual Trigger:** `workflow_dispatch` (Trigger manually from GitHub UI)

### 🛠 Pipeline Stages
1. **JDK 17 & Gradle 8.7 Setup:** Automatically provisioned on `ubuntu-latest` with build caching.
2. **Unit Tests:** Runs `./gradlew testDebugUnitTest` to verify IME state transitions.
3. **Debug APK Build:** Compiles the complete Android application with `./gradlew assembleDebug`.
4. **Integrity Check:** Validates the APK exists in `app/build/outputs/apk/debug/` and exceeds 500 KB.
5. **Artifact Upload:** Publishes `aikeyboard-debug.apk` with a 30-day retention period.
6. **Release Publishing:** Automatically attaches the APK to GitHub Releases when a version tag (e.g. `v1.0.0`) is pushed.

### 📥 Connecting Your GitHub Repository & Pushing Changes

If you created your **AI keyboard** repository on GitHub, run these commands to push the project:

```bash
# 1. Add your GitHub remote repository (replace <username> with your GitHub username)
git remote add origin https://github.com/<username>/AI-keyboard.git

# 2. Set the default branch to main
git branch -M main

# 3. Push your commits (triggers the APK build workflow immediately!)
git push -u origin main
```

### 📱 How to Download the APK to Your Android Device
1. On GitHub, navigate to the **Actions** tab of your repository.
2. Click on the latest workflow run: **Build & Verify Debug APK**.
3. Scroll down to the **Artifacts** section at the bottom.
4. Click **aikeyboard-debug-apk** to download the zip file.
5. Extract the zip to get `aikeyboard-debug.apk` and tap to install on your Android device!

