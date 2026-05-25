using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;
using System.Windows.Media.Animation;
using Microsoft.Web.WebView2.Core;

namespace BabyButtonMasher
{
    public partial class MainWindow : Window
    {
        private static IntPtr _hookID = IntPtr.Zero;
        private LowLevelKeyboardProc _proc;
        private Task<CoreWebView2Environment>? _webView2EnvTask;
        private readonly TaskCompletionSource _readyTcs = new TaskCompletionSource();
        // Manual Alt key tracking: set true when we swallow VK_LMENU/VK_RMENU keydown,
        // false on keyup. GetKeyState is unreliable inside WH_KEYBOARD_LL (state is updated
        // after CallNextHookEx, not before), so we track it ourselves to detect Alt+F4.
        private volatile bool _altTracked = false;

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

        // Accessibility hotkey suppression (Sticky Keys, Filter Keys, Toggle Keys).
        // These accessibility shortcuts can be triggered by a toddler mashing keys (e.g. 5x Shift
        // activates Sticky Keys, which then makes Ctrl "stick" and drops all subsequent input).
        // We disable only the keyboard shortcut that *toggles* each feature; the feature itself
        // is left in whatever state the user configured outside of TSD.
        private const uint SPI_GETSTICKYKEYS = 0x003A;
        private const uint SPI_SETSTICKYKEYS = 0x003B;
        private const uint SPI_GETFILTERKEYS = 0x0032;
        private const uint SPI_SETFILTERKEYS = 0x0033;
        private const uint SPI_GETTOGGLEKEYS = 0x0034;
        private const uint SPI_SETTOGGLEKEYS = 0x0035;
        private const uint SKF_HOTKEYACTIVE  = 0x0004;  // Sticky Keys: "press Shift 5 times"
        private const uint FKF_HOTKEYACTIVE  = 0x0004;  // Filter Keys: "hold Right Shift 8 s"
        private const uint TKF_HOTKEYACTIVE  = 0x0004;  // Toggle Keys: "hold NumLock 5 s"

        [StructLayout(LayoutKind.Sequential)]
        private struct STICKYKEYS { public uint cbSize; public uint dwFlags; }

        [StructLayout(LayoutKind.Sequential)]
        private struct FILTERKEYS { public uint cbSize; public uint dwFlags; public uint iWaitMSec; public uint iDelayMSec; public uint iRepeatMSec; public uint iBounceMSec; }

        [StructLayout(LayoutKind.Sequential)]
        private struct TOGGLEKEYS { public uint cbSize; public uint dwFlags; }

        // Saved at startup so we can restore the user's accessibility preferences on exit.
        private STICKYKEYS _savedStickyKeys;
        private FILTERKEYS _savedFilterKeys;
        private TOGGLEKEYS _savedToggleKeys;

        // Three EntryPoint-aliased overloads for SystemParametersInfo so C# can resolve
        // the correct struct type at each call site without runtime marshalling overhead.
        [DllImport("user32.dll", EntryPoint = "SystemParametersInfoW")]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool SpiStickyKeys(uint uiAction, uint uiParam, ref STICKYKEYS pvParam, uint fWinIni);

        [DllImport("user32.dll", EntryPoint = "SystemParametersInfoW")]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool SpiFilterKeys(uint uiAction, uint uiParam, ref FILTERKEYS pvParam, uint fWinIni);

        [DllImport("user32.dll", EntryPoint = "SystemParametersInfoW")]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool SpiToggleKeys(uint uiAction, uint uiParam, ref TOGGLEKEYS pvParam, uint fWinIni);

        private void SuppressAccessibilityHotkeys()
        {
            _savedStickyKeys = new STICKYKEYS { cbSize = (uint)Marshal.SizeOf<STICKYKEYS>() };
            _savedFilterKeys = new FILTERKEYS { cbSize = (uint)Marshal.SizeOf<FILTERKEYS>() };
            _savedToggleKeys = new TOGGLEKEYS { cbSize = (uint)Marshal.SizeOf<TOGGLEKEYS>() };
            SpiStickyKeys(SPI_GETSTICKYKEYS, (uint)Marshal.SizeOf<STICKYKEYS>(), ref _savedStickyKeys, 0);
            SpiFilterKeys(SPI_GETFILTERKEYS, (uint)Marshal.SizeOf<FILTERKEYS>(), ref _savedFilterKeys, 0);
            SpiToggleKeys(SPI_GETTOGGLEKEYS, (uint)Marshal.SizeOf<TOGGLEKEYS>(), ref _savedToggleKeys, 0);

            var sk = _savedStickyKeys; sk.dwFlags &= ~SKF_HOTKEYACTIVE;
            var fk = _savedFilterKeys; fk.dwFlags &= ~FKF_HOTKEYACTIVE;
            var tk = _savedToggleKeys; tk.dwFlags &= ~TKF_HOTKEYACTIVE;
            SpiStickyKeys(SPI_SETSTICKYKEYS, (uint)Marshal.SizeOf<STICKYKEYS>(), ref sk, 0);
            SpiFilterKeys(SPI_SETFILTERKEYS, (uint)Marshal.SizeOf<FILTERKEYS>(), ref fk, 0);
            SpiToggleKeys(SPI_SETTOGGLEKEYS, (uint)Marshal.SizeOf<TOGGLEKEYS>(), ref tk, 0);
            TsdLog.Write("Accessibility hotkeys suppressed (Sticky/Filter/Toggle Keys)");
        }

        private void RestoreAccessibilityHotkeys()
        {
            SpiStickyKeys(SPI_SETSTICKYKEYS, (uint)Marshal.SizeOf<STICKYKEYS>(), ref _savedStickyKeys, 0);
            SpiFilterKeys(SPI_SETFILTERKEYS, (uint)Marshal.SizeOf<FILTERKEYS>(), ref _savedFilterKeys, 0);
            SpiToggleKeys(SPI_SETTOGGLEKEYS, (uint)Marshal.SizeOf<TOGGLEKEYS>(), ref _savedToggleKeys, 0);
            TsdLog.Write("Accessibility hotkeys restored");
        }

        private static bool IsModifierKeyDown(int vk)
        {
            return (GetKeyState(vk) & 0x8000) != 0;
        }

        public delegate IntPtr LowLevelKeyboardProc(int nCode, IntPtr wParam, IntPtr lParam);

        public MainWindow()
        {
            InitializeComponent();
            _proc = HookCallback;

            // Prevent the default white WebView2 background from flashing before content loads
            WebViewControl.DefaultBackgroundColor = System.Drawing.Color.Black;

            // Go to full screen across active size
            this.WindowStyle = WindowStyle.None;
            this.WindowState = WindowState.Maximized;
            this.Topmost = true;
            this.ResizeMode = ResizeMode.NoResize;
            this.ShowInTaskbar = false;

            // Kick off WebView2 environment creation immediately so it runs in parallel with window setup
            string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            string udataFolder = Path.Combine(localAppData, "ToddlerScreenDefender");
            _webView2EnvTask = CoreWebView2Environment.CreateAsync(null, udataFolder);
            TsdLog.Write("WebView2 environment creation started");
        }

        private async void Window_Loaded(object sender, RoutedEventArgs e)
        {
            TsdLog.Write("Window_Loaded: registering keyboard hook");
            _hookID = SetHook(_proc);
            TsdLog.Write($"Keyboard hook: 0x{_hookID:X}");
            SuppressAccessibilityHotkeys();

            // Set secure positioning covering screens
            this.Left = SystemParameters.VirtualScreenLeft;
            this.Top = SystemParameters.VirtualScreenTop;
            this.Width = SystemParameters.VirtualScreenWidth;
            this.Height = SystemParameters.VirtualScreenHeight;
            TsdLog.Write($"Window: {this.Width}x{this.Height} at ({this.Left},{this.Top})");

            TryPinToAllVirtualDesktops();

            SplashStatus.Text = "Initializing display engine…";

            try
            {
                string localAppPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "assets", "react-app");
                string indexPath = Path.Combine(localAppPath, "index.html");

                TsdLog.Write("Awaiting WebView2 environment");
                var env = await _webView2EnvTask!;
                TsdLog.Write("WebView2 environment ready");

                string monitorsJson = GetMonitorsJson();
                TsdLog.Write($"Monitors: {monitorsJson}");

                await WebViewControl.EnsureCoreWebView2Async(env);
                TsdLog.Write("CoreWebView2 initialized");

                WebViewControl.CoreWebView2.NavigationStarting += (s, args) =>
                    TsdLog.Write($"Navigation starting: {args.Uri}");
                WebViewControl.CoreWebView2.NavigationCompleted += OnNavigationCompleted;

                // Primary signal: React posts 'tsd:ready' after its first paint via setTimeout(0).
                // In debug mode all JS console output is also forwarded as web messages.
                WebViewControl.CoreWebView2.WebMessageReceived += (s, args) =>
                {
                    var raw = args.TryGetWebMessageAsString();
                    if (raw == "tsd:ready")
                    {
                        TsdLog.Write("Received tsd:ready from React");
                        _readyTcs.TrySetResult();
                    }
                    else if (TsdLog.IsEnabled && raw != null)
                    {
                        TsdLog.Write(raw);
                    }
                };

                string debugFlag = TsdLog.IsEnabled ? "true" : "false";

                // In debug mode, patch console.log/warn/error to forward messages to TsdLog
                // via the WebMessageReceived channel (ConsoleMessageReceived requires a newer SDK).
                string consoleOverride = TsdLog.IsEnabled ? @"
(function(){
    ['log','warn','error'].forEach(function(lvl){
        var orig = console[lvl].bind(console);
        console[lvl] = function(){
            orig.apply(console, arguments);
            try {
                var msg = '[JS:' + lvl + '] ' + Array.prototype.slice.call(arguments).join(' ');
                if (window.chrome && window.chrome.webview) window.chrome.webview.postMessage(msg);
            } catch(e) {}
        };
    });
})();" : "";

                await WebViewControl.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync(
                    $"window.TSD_MONITORS = {monitorsJson}; window.TSD_DEBUG = {debugFlag}; {consoleOverride}");

                if (Directory.Exists(localAppPath) && File.Exists(indexPath))
                {
                    // Serve the local folder over a synthetic HTTPS origin so Vite's
                    // type="module" + crossorigin scripts pass Chromium's CORS check.
                    // Direct file:// navigation silently drops module scripts, leaving a blank page.
                    WebViewControl.CoreWebView2.SetVirtualHostNameToFolderMapping(
                        "app.local", localAppPath, CoreWebView2HostResourceAccessKind.Allow);
                    TsdLog.Write($"Virtual host mapped: app.local -> {localAppPath}");
                    WebViewControl.Source = new Uri("https://app.local/index.html");
                }
                else
                {
                    TsdLog.Write("Local assets not found, falling back to remote URL");
                    WebViewControl.Source = new Uri("https://ais-pre-2ojkzky7dd3ixx5xjcj6g3-457582934602.us-east1.run.app");
                }

                // Hold the splash for at least 8 s AND until React signals ready —
                // whichever finishes last wins, so fast machines still see the splash.
                await Task.WhenAll(Task.Delay(12000), _readyTcs.Task);
                HideSplash();
            }
            catch (Exception ex)
            {
                TsdLog.Write($"ERROR in Window_Loaded: {ex}");
                HideSplash(); // Always dismiss so the error dialog is reachable
                MessageBox.Show($"TSD Native WebView2 Boot Error: {ex.Message}\nFalling back to system browser redirect.", "Runtime Warn");
            }
        }

        private void OnNavigationCompleted(object? sender, CoreWebView2NavigationCompletedEventArgs e)
        {
            TsdLog.Write($"Navigation completed: success={e.IsSuccess}, httpStatus={e.HttpStatusCode}");
            // Fallback: if React never posts tsd:ready (JS error, remote URL), unblock the wait after 3 s.
            Task.Delay(3000).ContinueWith(_ => _readyTcs.TrySetResult());
        }

        private void HideSplash()
        {
            TsdLog.Write("Hiding splash");
            var fade = new DoubleAnimation(1, 0, TimeSpan.FromMilliseconds(1500));
            fade.Completed += (s, e) => SplashOverlay.Visibility = Visibility.Collapsed;
            SplashOverlay.BeginAnimation(OpacityProperty, fade);
        }

        private string GetMonitorsJson()
        {
            var monitors = new System.Collections.Generic.List<string>();
            EnumDisplayMonitors(IntPtr.Zero, IntPtr.Zero, delegate (IntPtr hMonitor, IntPtr hdcMonitor, ref RECT lprcMonitor, IntPtr dwData)
            {
                MONITORINFOEX mi = new MONITORINFOEX();
                mi.cbSize = Marshal.SizeOf(mi);
                if (GetMonitorInfo(hMonitor, ref mi))
                {
                    bool isPrimary = (mi.dwFlags & MONITORINFOF_PRIMARY) != 0;
                    int physLeft   = mi.rcMonitor.Left;
                    int physTop    = mi.rcMonitor.Top;
                    int physWidth  = mi.rcMonitor.Right  - mi.rcMonitor.Left;
                    int physHeight = mi.rcMonitor.Bottom - mi.rcMonitor.Top;

                    // EnumDisplayMonitors returns physical pixels; React's CSS viewport uses
                    // WPF logical pixels (96-DPI basis). Divide by the per-monitor DPI scale
                    // so the coordinates match what the browser actually sees.
                    double scaleX = 1.0, scaleY = 1.0;
                    if (GetDpiForMonitor(hMonitor, MDT_EFFECTIVE_DPI, out uint dpiX, out uint dpiY) == 0)
                    {
                        scaleX = dpiX / 96.0;
                        scaleY = dpiY / 96.0;
                    }

                    int left   = (int)Math.Round(physLeft   / scaleX);
                    int top    = (int)Math.Round(physTop    / scaleY);
                    int width  = (int)Math.Round(physWidth  / scaleX);
                    int height = (int)Math.Round(physHeight / scaleY);

                    TsdLog.Write($"Monitor: phys={physWidth}x{physHeight} dpi={dpiX}x{dpiY} logical={width}x{height} primary={isPrimary}");
                    monitors.Add($"{{\"left\":{left},\"top\":{top},\"width\":{width},\"height\":{height},\"isPrimary\":{(isPrimary ? "true" : "false")}}}");
                }
                return true;
            }, IntPtr.Zero);

            return "[" + string.Join(",", monitors) + "]";
        }

        private void Window_Closing(object sender, System.ComponentModel.CancelEventArgs e)
        {
            TsdLog.Write("Window_Closing: unhooking keyboard hook");
            UnhookWindowsHookEx(_hookID);
            RestoreAccessibilityHotkeys();
        }

        private void Window_Deactivated(object sender, EventArgs e)
        {
            // Force focus back instantly to lock the toddler in the safety sandbox
            this.Topmost = true;
            this.Activate();
            this.Focus();
            // Re-focus the WebView2 control specifically so keyboard events resume flowing into
            // React. Window.Focus() restores WPF window activation but does not guarantee that
            // the embedded Chromium process recaptures keyboard delivery — WebViewControl.Focus()
            // does that explicitly.
            WebViewControl.Focus();
        }

        private static readonly Guid _clsidVirtualDesktopPinnedApps = new Guid("AA509086-5CA9-4C25-8F95-589D3C07B48A");
        private static readonly Guid _iidIVirtualDesktopPinnedApps  = new Guid("4CE81583-1E4C-4632-A621-07A53543148F");

        private void TryPinToAllVirtualDesktops()
        {
            try
            {
                var hwnd = new System.Windows.Interop.WindowInteropHelper(this).Handle;
                var shell = (IShellServiceProvider)(object)new CImmersiveShell();
                var clsid = _clsidVirtualDesktopPinnedApps;
                var iid  = _iidIVirtualDesktopPinnedApps;
                shell.QueryService(ref clsid, ref iid, out object ppv);
                ((IVirtualDesktopPinnedApps)ppv).PinWindow(hwnd);
                TsdLog.Write("Pinned to all virtual desktops");
            }
            catch (Exception ex)
            {
                // Pinning uses internal Windows shell COM interfaces; silently no-op if unavailable.
                TsdLog.Write($"Virtual desktop pinning unavailable: {ex.Message}");
            }
        }

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
                int vkCode = Marshal.ReadInt32(lParam);
                bool isKeyDown = wParam == (IntPtr)WM_KEYDOWN || wParam == (IntPtr)WM_SYSKEYDOWN;
                bool swallowKeystroke = false;

                // 1. Block Win keys.
                if (vkCode == VK_LWIN || vkCode == VK_RWIN)
                {
                    swallowKeystroke = true;
                }

                // 2. Block Alt key itself and all Alt+key combinations.
                //
                // WHY explicit VK_LMENU/VK_RMENU swallow: when Alt first goes down,
                // GetKeyState(VK_LMENU) returns 0 because the key-state table is updated AFTER
                // CallNextHookEx, not before. The previous "altPressed && vkCode != VK_F4" check
                // therefore missed the Alt keydown, letting it reach the OS menu system or tools
                // like Razer Synapse, which stole WebView2 focus and broke subsequent key input.
                //
                // WHY _altTracked for Alt+F4: we track Alt state ourselves (set on keydown,
                // cleared on keyup) instead of using GetAsyncKeyState, which is not reliably
                // settled inside a WH_KEYBOARD_LL callback.
                if (vkCode == VK_LMENU || vkCode == VK_RMENU)
                {
                    _altTracked = isKeyDown;   // true on keydown, false on keyup
                    swallowKeystroke = true;
                }
                // Belt-and-suspenders: if GetKeyState already reflects Alt as held (possible when
                // Alt has been physically down long enough for the state table to catch up), block
                // any remaining Alt+key combos that slipped past the explicit check above.
                if (IsModifierKeyDown(VK_LMENU) || IsModifierKeyDown(VK_RMENU))
                {
                    swallowKeystroke = true;
                }

                // Alt+F4 parent exit — placed after the VK_LMENU block so _altTracked is fresh.
                // We close via the dispatcher because the OS message queue never saw the Alt
                // keydown (we swallowed it), so the normal WM_SYSCOMMAND SC_CLOSE path is dead.
                if (isKeyDown && vkCode == VK_F4 && _altTracked)
                {
                    Dispatcher.BeginInvoke(() => this.Close());
                    _altTracked = false;
                    return (IntPtr)1;
                }

                // 3. Block Ctrl+Esc (Start menu) and Ctrl+Shift+Esc (Task Manager).
                // Both sequences end with VK_ESCAPE as the triggering key while Ctrl is held.
                bool ctrlPressed = IsModifierKeyDown(VK_LCONTROL) || IsModifierKeyDown(VK_RCONTROL);
                if (ctrlPressed && vkCode == VK_ESCAPE)
                {
                    swallowKeystroke = true;
                }

                // 4. Block F11 to prevent kiosk escape.
                if (vkCode == VK_F11)
                {
                    swallowKeystroke = true;
                }

                // 5. Block Print Screen and the context-menu key.
                // Print Screen triggers an OS-level screen-capture action that briefly pulls focus
                // away from WebView2, dropping all subsequent keyboard events until the child
                // physically taps the screen again.
                if (vkCode == VK_SNAPSHOT || vkCode == VK_APPS)
                {
                    swallowKeystroke = true;
                }

                if (swallowKeystroke)
                {
                    return (IntPtr)1;
                }
            }
            return CallNextHookEx(_hookID, nCode, wParam, lParam);
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

        // --- MULTI-MONITOR SUPPORT PINVOKES & TYPES ---
        [DllImport("user32.dll")]
        private static extern bool EnumDisplayMonitors(IntPtr hdc, IntPtr lprcClip, MonitorEnumProc lpfnEnum, IntPtr dwData);

        [DllImport("user32.dll", CharSet = CharSet.Auto)]
        private static extern bool GetMonitorInfo(IntPtr hMonitor, ref MONITORINFOEX lpmi);

        [DllImport("shcore.dll")]
        private static extern int GetDpiForMonitor(IntPtr hMonitor, int dpiType, out uint dpiX, out uint dpiY);

        private const int MDT_EFFECTIVE_DPI = 0;

        private delegate bool MonitorEnumProc(IntPtr hMonitor, IntPtr hdcMonitor, ref RECT lprcMonitor, IntPtr dwData);

        [StructLayout(LayoutKind.Sequential)]
        public struct RECT
        {
            public int Left;
            public int Top;
            public int Right;
            public int Bottom;
        }

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Auto)]
        public struct MONITORINFOEX
        {
            public int cbSize;
            public RECT rcMonitor;
            public RECT rcWork;
            public int dwFlags;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)]
            public string szDevice;
        }

        private const int MONITORINFOF_PRIMARY = 0x00000001;
    }

    [ComImport]
    [Guid("C2F03A33-21F5-47FA-B4BB-156362A2F239")]
    internal class CImmersiveShell { }

    [ComImport]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    [Guid("6D5140C1-7436-11CE-8034-00AA006009FA")]
    internal interface IShellServiceProvider
    {
        void QueryService(ref Guid guidService, ref Guid riid,
                          [MarshalAs(UnmanagedType.Interface)] out object ppvObject);
    }

    [ComImport]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    [Guid("4CE81583-1E4C-4632-A621-07A53543148F")]
    internal interface IVirtualDesktopPinnedApps
    {
        void IsAppIdPinned([MarshalAs(UnmanagedType.LPWStr)] string appId, [MarshalAs(UnmanagedType.Bool)] out bool result);
        void PinAppID([MarshalAs(UnmanagedType.LPWStr)] string appId);
        void UnpinAppID([MarshalAs(UnmanagedType.LPWStr)] string appId);
        void IsWindowPinned(IntPtr hWnd, [MarshalAs(UnmanagedType.Bool)] out bool result);
        void PinWindow(IntPtr hWnd);
        void UnpinWindow(IntPtr hWnd);
    }
}
