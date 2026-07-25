using System;
using System.Diagnostics;
using System.Runtime.InteropServices;

namespace BabyButtonMasher
{
    // Global low-level keyboard hook (WH_KEYBOARD_LL). Swallows OS shortcuts that could
    // break a toddler out of the sandbox (Win, Alt+*, Ctrl+*, F1-F12, PrintScreen, context
    // menu) and re-injects the bare key so React still receives it. Alt+F4 is the parent exit.
    public partial class MainWindow
    {
        private static IntPtr _hookID = IntPtr.Zero;
        private LowLevelKeyboardProc _proc;
        // Manual Alt key tracking: set true when we swallow VK_LMENU/VK_RMENU keydown,
        // false on keyup. GetKeyState is unreliable inside WH_KEYBOARD_LL (state is updated
        // after CallNextHookEx, not before), so we track it ourselves to detect Alt+F4.
        private volatile bool _altTracked = false;
        private volatile bool _ctrlTracked = false;

        // Win32 API Constants
        private const int WH_KEYBOARD_LL = 13;
        private const int HC_ACTION = 0;
        private const int WM_KEYDOWN = 0x0100;
        private const int WM_SYSKEYDOWN = 0x0104;
        private const int VK_LWIN = 0x5B;
        private const int VK_RWIN = 0x5C;
        private const int VK_TAB = 0x09;
        private const int VK_ESCAPE = 0x1B;
        private const int VK_F11 = 0x7A;
        private const int VK_SHIFT = 0x10;
        private const int VK_CONTROL = 0x11;

        private const int VK_F4 = 0x73;       // F4 (for Alt+F4 parent exit)

        private const int VK_LCONTROL = 0xA2;
        private const int VK_RCONTROL = 0xA3;
        private const int VK_LMENU = 0xA4;    // Left Alt
        private const int VK_RMENU = 0xA5;    // Right Alt
        private const int VK_LSHIFT = 0xA0;
        private const int VK_RSHIFT = 0xA1;

        private const int VK_SNAPSHOT = 0x2C;  // Print Screen — triggers OS screen capture, steals WebView2 focus
        private const int VK_APPS     = 0x5D;  // Context menu key — can surface OS context menus

        private const int VK_MENU  = 0x12;    // Generic Alt — used in IsModifierVk
        private const int VK_F1    = 0x70;    // First function key
        private const int VK_F12   = 0x7B;    // Last function key

        // Embedded in dwExtraInfo of keystrokes injected by BBM via SendInput.
        // The hook skips re-processing events carrying this marker to prevent
        // infinite re-injection loops.
        private const int SYNTHETIC_KEY_MAGIC = 0xBBFF;
        private const uint INPUT_KEYBOARD = 1;
        private const uint KEYEVENTF_KEYUP = 0x0002;

        private static bool IsModifierKeyDown(int vk)
        {
            return (GetKeyState(vk) & 0x8000) != 0;
        }

        public delegate IntPtr LowLevelKeyboardProc(int nCode, IntPtr wParam, IntPtr lParam);

        // --- WIN32 SYSTEM KEY INTERCEPTION HOOK ---
        private IntPtr SetHook(LowLevelKeyboardProc proc)
        {
            using (Process curProcess = Process.GetCurrentProcess())
            using (ProcessModule curModule = curProcess.MainModule!)
            {
                return SetWindowsHookEx(WH_KEYBOARD_LL, proc, GetModuleHandle(curModule.ModuleName), 0);
            }
        }

        private IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam)
        {
            if (nCode >= HC_ACTION)
            {
                var ks = Marshal.PtrToStructure<KBDLLHOOKSTRUCT>(lParam);
                int vkCode = (int)ks.vkCode;

                // Skip keystrokes that BBM itself injected via SendInput — they already
                // have their modifier stripped and should flow straight to WebView2/React.
                if (ks.dwExtraInfo == (IntPtr)SYNTHETIC_KEY_MAGIC)
                    return CallNextHookEx(_hookID, nCode, wParam, lParam);

                bool isKeyDown = wParam == (IntPtr)WM_KEYDOWN || wParam == (IntPtr)WM_SYSKEYDOWN;
                bool swallow = false;
                bool injectBase = false; // when true, re-inject vkCode without the modifier

                // 1. Win keys — swallow silently; no re-injection (these are pure OS shortcuts).
                if (vkCode == VK_LWIN || vkCode == VK_RWIN)
                    swallow = true;

                // 2. Alt key itself and all Alt+key combinations.
                //
                // WHY explicit VK_LMENU/VK_RMENU swallow: when Alt first goes down,
                // GetKeyState(VK_LMENU) returns 0 because the key-state table is updated AFTER
                // CallNextHookEx, not before. Tracking it ourselves (_altTracked) is the only
                // reliable approach inside WH_KEYBOARD_LL.
                if (vkCode == VK_LMENU || vkCode == VK_RMENU)
                {
                    _altTracked = isKeyDown;
                    swallow = true;          // Alt itself is always swallowed, never re-injected
                }
                if (_altTracked || IsModifierKeyDown(VK_LMENU) || IsModifierKeyDown(VK_RMENU))
                {
                    swallow = true;
                    injectBase = true;       // Strip Alt and send the bare key to React
                }

                // Alt+F4 parent exit — checked after _altTracked is set so it is always fresh.
                // Close via the dispatcher because the OS never saw the Alt keydown (we swallowed
                // it), so the normal WM_SYSCOMMAND SC_CLOSE path is dead.
                if (isKeyDown && vkCode == VK_F4 && _altTracked)
                {
                    Dispatcher.BeginInvoke(() => this.Close());
                    _altTracked = false;
                    return (IntPtr)1;        // Early exit: don't re-inject F4 on exit
                }

                // 3. Ctrl key and ALL Ctrl+key combos.
                // WebView2 exposes browser shortcuts (Ctrl+F find, Ctrl+W close, Ctrl+R reload,
                // etc.) that can break out of the sandbox. We swallow Ctrl itself and all combos,
                // but re-inject the bare key so React still sees it as a normal keypress.
                if (vkCode == VK_LCONTROL || vkCode == VK_RCONTROL)
                {
                    _ctrlTracked = isKeyDown;
                    swallow = true;          // Ctrl itself is always swallowed, never re-injected
                }
                if (_ctrlTracked || IsModifierKeyDown(VK_LCONTROL) || IsModifierKeyDown(VK_RCONTROL))
                {
                    swallow = true;
                    injectBase = true;       // Strip Ctrl and send the bare key to React
                }

                // 4. Function keys (F1-F12).
                // Swallow the OS-level event (preventing F5 refresh, F12 DevTools, etc.) and
                // re-inject the bare key code so React can still react to function key presses.
                if (vkCode >= VK_F1 && vkCode <= VK_F12)
                {
                    swallow = true;
                    injectBase = true;
                }

                // 5. Print Screen and context-menu key — swallow silently, no re-injection.
                if (vkCode == VK_SNAPSHOT || vkCode == VK_APPS)
                    swallow = true;

                if (swallow)
                {
                    // Re-inject the bare key so React sees it, but only when the key itself
                    // is not a modifier (we never want to send bare Alt/Ctrl/Win/Shift events).
                    if (injectBase && !IsModifierVk(vkCode))
                        InjectKey(vkCode, isKeyDown);
                    return (IntPtr)1;
                }
            }
            return CallNextHookEx(_hookID, nCode, wParam, lParam);
        }

        private static bool IsModifierVk(int vk) =>
            vk is VK_LWIN or VK_RWIN
               or VK_SHIFT or VK_LSHIFT or VK_RSHIFT
               or VK_CONTROL or VK_LCONTROL or VK_RCONTROL
               or VK_MENU or VK_LMENU or VK_RMENU;

        private void InjectKey(int vkCode, bool keyDown)
        {
            var input = new INPUT
            {
                type = INPUT_KEYBOARD,
                u = new INPUT_UNION
                {
                    ki = new KEYBDINPUT
                    {
                        wVk = (ushort)vkCode,
                        wScan = 0,
                        dwFlags = keyDown ? 0u : KEYEVENTF_KEYUP,
                        time = 0,
                        dwExtraInfo = (IntPtr)SYNTHETIC_KEY_MAGIC,
                    }
                }
            };
            SendInput(1, new[] { input }, Marshal.SizeOf(typeof(INPUT)));
        }

        // --- DLL IMPORTS FROM USER32 & KERNEL32 ---
        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelKeyboardProc lpfn, IntPtr hMod, uint dwThreadId);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool UnhookWindowsHookEx(IntPtr hhk);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

        [DllImport("user32.dll", CharSet = CharSet.Auto, ExactSpelling = true)]
        private static extern short GetKeyState(int keyCode);

        [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr GetModuleHandle(string lpModuleName);

        // --- KEYBOARD INJECTION SUPPORT (SendInput + KBDLLHOOKSTRUCT) ---

        // Read dwExtraInfo from the hook's lParam to detect synthetic keystrokes.
        [StructLayout(LayoutKind.Sequential)]
        private struct KBDLLHOOKSTRUCT
        {
            public uint vkCode;
            public uint scanCode;
            public uint flags;
            public uint time;
            public IntPtr dwExtraInfo; // ULONG_PTR — IntPtr is the correct managed mapping
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct KEYBDINPUT
        {
            public ushort wVk;
            public ushort wScan;
            public uint dwFlags;
            public uint time;
            public IntPtr dwExtraInfo;
        }

        // LayoutKind.Explicit with all fields at offset 0 mirrors the Win32 INPUT union.
        [StructLayout(LayoutKind.Explicit)]
        private struct INPUT_UNION
        {
            [FieldOffset(0)] public KEYBDINPUT ki;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct INPUT
        {
            public uint type;
            public INPUT_UNION u;
        }

        [DllImport("user32.dll")]
        private static extern uint SendInput(uint nInputs,
            [MarshalAs(UnmanagedType.LPArray), In] INPUT[] pInputs, int cbSize);
    }
}
