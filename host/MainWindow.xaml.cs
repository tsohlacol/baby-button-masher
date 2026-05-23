using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;
using System.Windows.Media.Animation;
using Microsoft.Web.WebView2.Core;

namespace ToddlerScreenDefender
{
    public partial class MainWindow : Window
    {
        private static IntPtr _hookID = IntPtr.Zero;
        private LowLevelKeyboardProc _proc;
        private Task<CoreWebView2Environment>? _webView2EnvTask;
        private readonly TaskCompletionSource _readyTcs = new TaskCompletionSource();

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

        private const int VK_LCONTROL = 0xA2;
        private const int VK_RCONTROL = 0xA3;
        private const int VK_LMENU = 0xA4;    // Left Alt
        private const int VK_RMENU = 0xA5;    // Right Alt
        private const int VK_LSHIFT = 0xA0;
        private const int VK_RSHIFT = 0xA1;

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
                WebViewControl.CoreWebView2.WebMessageReceived += (s, args) =>
                {
                    if (args.TryGetWebMessageAsString() == "tsd:ready")
                    {
                        TsdLog.Write("Received tsd:ready from React");
                        HideSplash();
                    }
                };

                string debugFlag = TsdLog.IsEnabled ? "true" : "false";
                await WebViewControl.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync(
                    $"window.TSD_MONITORS = {monitorsJson}; window.TSD_DEBUG = {debugFlag};");

                if (Directory.Exists(localAppPath) && File.Exists(indexPath))
                {
                    TsdLog.Write($"Loading local app: {indexPath}");
                    WebViewControl.Source = new Uri(indexPath);
                }
                else
                {
                    TsdLog.Write("Local assets not found, falling back to remote URL");
                    WebViewControl.Source = new Uri("https://ais-pre-2ojkzky7dd3ixx5xjcj6g3-457582934602.us-east1.run.app");
                }
            }
            catch (Exception ex)
            {
                TsdLog.Write($"ERROR in Window_Loaded: {ex}");
                MessageBox.Show($"TSD Native WebView2 Boot Error: {ex.Message}\nFalling back to system browser redirect.", "Runtime Warn");
            }
        }

        private void OnNavigationCompleted(object? sender, CoreWebView2NavigationCompletedEventArgs e)
        {
            TsdLog.Write($"Navigation completed: success={e.IsSuccess}, httpStatus={e.HttpStatusCode}");
            // Fallback: if React never posts tsd:ready (e.g. remote fallback URL, JS error),
            // hide the splash after 3 seconds so the user isn't stuck staring at it.
            Task.Delay(3000).ContinueWith(_ => Dispatcher.Invoke(HideSplash));
        }

        private void HideSplash()
        {
            if (_splashHidden) return;
            _splashHidden = true;
            TsdLog.Write("Hiding splash");
            var fade = new DoubleAnimation(1, 0, TimeSpan.FromMilliseconds(400));
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
                    int left = mi.rcMonitor.Left;
                    int top = mi.rcMonitor.Top;
                    int width = mi.rcMonitor.Right - mi.rcMonitor.Left;
                    int height = mi.rcMonitor.Bottom - mi.rcMonitor.Top;
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
        }

        private void Window_Deactivated(object sender, EventArgs e)
        {
            // Force focus back instantly to lock the toddler in the safety sandbox
            this.Topmost = true;
            this.Activate();
            this.Focus();
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
                bool swallowKeystroke = false;

                // 1. Block Win Keys
                if (vkCode == VK_LWIN || vkCode == VK_RWIN)
                {
                    swallowKeystroke = true;
                }

                // 2. Block Alt+Tab and Alt+Esc (Alt+F4 passes through so the parent can close the app)
                bool altPressed = IsModifierKeyDown(VK_LMENU) || IsModifierKeyDown(VK_RMENU);
                if (altPressed)
                {
                    if (vkCode == VK_TAB || vkCode == VK_ESCAPE)
                    {
                        swallowKeystroke = true;
                    }
                }

                // 3. Block Ctrl+Esc (Start menu) and Ctrl+Shift+Esc (Task Manager).
                // Both sequences end with VK_ESCAPE as the triggering key while Ctrl is held,
                // so checking vkCode == VK_ESCAPE with ctrlPressed covers both.
                bool ctrlPressed = IsModifierKeyDown(VK_LCONTROL) || IsModifierKeyDown(VK_RCONTROL);
                if (ctrlPressed && vkCode == VK_ESCAPE)
                {
                    swallowKeystroke = true;
                }

                // 4. Block F11 to prevent kiosk escape
                if (vkCode == VK_F11)
                {
                    swallowKeystroke = true;
                }

                if (swallowKeystroke)
                {
                    // Return 1 to swallow keypress, breaking default OS action sequence
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
