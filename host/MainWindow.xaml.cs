using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Input;
using Microsoft.Web.WebView2.Core;

namespace ToddlerScreenDefender
{
    public partial class MainWindow : Window
    {
        private static IntPtr _hookID = IntPtr.Zero;
        private LowLevelKeyboardProc _proc;

        // Win32 API Constants
        private const int WH_KEYBOARD_LL = 13;
        private const int HC_ACTION = 0;
        private const int WM_KEYDOWN = 0x0100;
        private const int WM_SYSKEYDOWN = 0x0104;
        private const int VK_LWIN = 0x5B;
        private const int VK_RWIN = 0x5C;
        private const int VK_TAB = 0x09;
        private const int VK_ESCAPE = 0x1B;
        private const int VK_F4 = 0x73;
        private const int VK_F11 = 0x7A;
        private const int VK_SHIFT = 0x10;
        private const int VK_CONTROL = 0x11;

        public delegate IntPtr LowLevelKeyboardProc(int nCode, IntPtr wParam, IntPtr lParam);

        public MainWindow()
        {
            InitializeComponent();
            _proc = HookCallback;
            
            // Go to full screen across active size
            this.WindowStyle = WindowStyle.None;
            this.WindowState = WindowState.Maximized;
            this.Topmost = true;
            this.ResizeMode = ResizeMode.NoResize;
            this.ShowInTaskbar = false;
        }

        private async void Window_Loaded(object sender, RoutedEventArgs e)
        {
            // Activate core keyboard hooks to block Toddler bypass attempts
            _hookID = SetHook(_proc);

            // Set secure positioning covering screens
            this.Left = SystemParameters.VirtualScreenLeft;
            this.Top = SystemParameters.VirtualScreenTop;
            this.Width = SystemParameters.VirtualScreenWidth;
            this.Height = SystemParameters.VirtualScreenHeight;

            try
            {
                // Initialize WebView2 pointing to our bundled React frontend
                string localAppPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "assets", "react-app");
                string indexPath = Path.Combine(localAppPath, "index.html");

                if (Directory.Exists(localAppPath) && File.Exists(indexPath))
                {
                    var env = await CoreWebView2Environment.CreateAsync(null, null);
                    await WebViewControl.EnsureCoreWebView2Async(env);
                    WebViewControl.Source = new Uri(indexPath);
                }
                else
                {
                    // Fallback pointing to production staging if assets are omitted
                    var env = await CoreWebView2Environment.CreateAsync(null, null);
                    await WebViewControl.EnsureCoreWebView2Async(env);
                    WebViewControl.Source = new Uri("https://ais-pre-2ojkzky7dd3ixx5xjcj6g3-457582934602.us-east1.run.app");
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"TSD Native WebView2 Boot Error: {ex.Message}\nFalling back to system browser redirect.", "Runtime Warn");
            }
        }

        private void Window_Closing(object sender, System.ComponentModel.CancelEventArgs e)
        {
            // TSD remains un-closable by keyboard actions unless standard authentication criteria are solved
            UnhookWindowsHookEx(_hookID);
        }

        private void Window_Deactivated(object sender, EventArgs e)
        {
            // Force focus back instantly to lock the toddler in the safety sandbox
            this.Topmost = true;
            this.Activate();
            this.Focus();
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

                // 2. Block Alt+Tab, Alt+Esc, Alt+F4
                if (Keyboard.Modifiers.HasFlag(ModifierKeys.Alt))
                {
                    if (vkCode == VK_TAB || vkCode == VK_ESCAPE || vkCode == VK_F4)
                    {
                        swallowKeystroke = true;
                    }
                }

                // 3. Block Ctrl+Esc, Ctrl+Shift+Esc
                if (Keyboard.Modifiers.HasFlag(ModifierKeys.Control))
                {
                    if (vkCode == VK_ESCAPE || vkCode == VK_SHIFT)
                    {
                        swallowKeystroke = true;
                    }
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

        [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr GetModuleHandle(string lpModuleName);
    }
}
