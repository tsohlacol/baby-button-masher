# Toddler Screen Defender (TSD) - System Architecture

This document describes the architectural design for the local desktop client of Toddler Screen Defender. It outlines how a native Windows wrapper hosts our React gameplay and uses system-level configurations to protect your computer from toddler-key-slapping.

---

## 1. Architectural Overview

At its core, Toddler Screen Defender consists of a **native host layer** and a **local front-end sandbox**. 

By packaging the React applet into a local single-page application (SPA), we run it inside a headless browser window with custom windows-messaging hooks.

```
                           +----------------------------------------+
                           |           Windows OS Kernel            |
                           +-------------------+--------------------+
                                               |
                     Crtl+Alt+Del              | Low-Level Keyboard Hook
                     (Unblockable)             | (Intercepts: Alt+Tab, Alt+F4,
                                               |  WinKey, TaskManager Block)
                                               v
                          +--------------------+--------------------+
                          |     Toddler Screen Defender Host App    |
                          | (WPF / WebView2 or Tauri Native Wrapper)|
                          +--------------------+--------------------+
                                               |
                                               | Embedded Local Channel
                                               v
                          +--------------------+--------------------+
                          |       Offline Web Gameplay View         |
                          | (Local HTML, JS, CSS, Audio Cues, etc)  |
                          +-----------------------------------------+
```

### Components:
1. **The Native Wrapper**: A lightweight C# / WPF (.NET 8+) or Tauri (Rust) application that boots up a borderless, top-most window across all active screens. 
2. **The Offline Gameplay View**: A local bundle of our React/Vite-based application served strictly from filesystem storage (`file://` or a virtual host protocol), running inside an embedded **Edge WebView2** control.
3. **The Hook Controller**: A native Windows low-level input hook thread that captures global keypress events before the OS standard window-manager processes them.

---

## 2. Low-Level Keyboard Interception & Escape Velocity

Browsers cannot intercept system hotkeys by design. To block severe shortcuts, the native TSD wrapper hooks directly into the Windows Win32 API.

### Low-Level Keyboard Hook (`WH_KEYBOARD_LL`)
The wrapper registers a global hook callback through `SetWindowsHookEx`. This callback runs on the primary thread of the native process and intercepts every keystroke:

```cpp
// Hook implementation logic concept (Win32 API)
LRESULT CALLBACK LowLevelKeyboardProc(int nCode, WPARAM wParam, LPARAM lParam) {
    if (nCode == HC_ACTION) {
        KBDLLHOOKSTRUCT* pkbhs = (KBDLLHOOKSTRUCT*)lParam;
        
        // Match unacceptable system command triggers
        bool killKey = false;
        
        // 1. Block Win Key (LWIN, RWIN)
        if (pkbhs->vkCode == VK_LWIN || pkbhs->vkCode == VK_RWIN) {
            killKey = true;
        }
        
        // 2. Block Alt+Tab, Alt+Esc, Alt+F4
        if ((pkbhs->flags & LLKHF_ALTDOWN) != 0) {
            if (pkbhs->vkCode == VK_TAB || pkbhs->vkCode == VK_ESCAPE || pkbhs->vkCode == VK_F4) {
                killKey = true;
            }
        }
        
        // 3. Block Ctrl+Esc (opens Start Menu) or Ctrl+Shift+Esc (Task Manager shortcut)
        if ((GetKeyState(VK_CONTROL) & 0x8000) != 0) {
            if (pkbhs->vkCode == VK_ESCAPE || pkbhs->vkCode == VK_SHIFT) {
                killKey = true;
            }
        }

        // 4. Block F11 (prevents breaking full-screen/kiosk mode)
        if (pkbhs->vkCode == VK_F11) {
            killKey = true;
        }
        
        if (killKey) {
            // Returning 1 breaks the hook chain, swallowing the keystroke completely
            return 1; 
        }
    }
    return CallNextHookEx(NULL, nCode, wParam, lParam);
}
```

### Why Ctrl+Alt+Del Remains Safe
The Secure Attention Sequence (SAS)—which triggers the `Ctrl+Alt+Del` GINA (Graphical Identification and Authentication) overlay screen—is handled natively in the Windows kernel by `winlogon.exe` at a hardware level. 
* User-land user hooks (`WH_KEYBOARD_LL`) are **never** permitted to capture or override this sequence.
* This acts as an architectural safety-valve. If TSD hangs or crashes, hitting `Ctrl+Alt+Del` will overlay the secure desk screen, allowing you to select **Task Manager** and force-terminate the shell process (`ToddlerScreenDefender.exe`).

---

## 3. Window Positioning & Screen Lock Guarding

To ensure your baby cannot click out or discover gaps to the background desktop:

* **Topmost & Borderless Window Style**: The host is initialized with WS_POPUP (removing frame borders, title bars, and control boxes) and positioned with the `HWND_TOPMOST` z-order flag.
* **Focus Enforcement**: If TSD loses focus (for example, if a background notifier pops up), the App listens to its own native focus events (`WM_ACTIVATE` or WPF 'Deactivated' trigger) and forces focus back to itself:
  ```csharp
  private void OnWindowDeactivated(object sender, EventArgs e) {
      this.Topmost = true;
      this.Activate();
      this.Focus();
  }
  ```
* **Dual Monitor Shielding**: In standard mode, the app detects all active screen bounds (`Screen.AllScreens` or `MonitorFromWindow`) and spans matching black overlay screens over side-monitors, preventing the child from moving the mouse to an unprotected display.
