using System;
using System.IO;
using System.Threading.Tasks;
using System.Windows;
using Microsoft.Web.WebView2.Core;

namespace BabyButtonMasher
{
    // Window lifecycle and WebView2 orchestration. The keyboard hook, accessibility
    // suppression, monitor enumeration, and virtual-desktop pinning live in sibling
    // partial-class files (MainWindow.KeyboardHook.cs, MainWindow.Accessibility.cs,
    // MainWindow.Monitors.cs, MainWindow.VirtualDesktop.cs).
    public partial class MainWindow : Window
    {
        private Task<CoreWebView2Environment>? _webView2EnvTask;
        private readonly TaskCompletionSource _readyTcs = new TaskCompletionSource();

        // Fallback used only when the bundled local React build is missing. Kept as a named
        // constant so it is easy to find/update; a shipped exe pointing at a dead URL fails
        // silently otherwise.
        private const string RemoteFallbackUrl = "https://ais-pre-2ojkzky7dd3ixx5xjcj6g3-457582934602.us-east1.run.app";

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
            string udataFolder = Path.Combine(localAppData, "BabyButtonMasher");
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
                    $"window.BBM_MONITORS = {monitorsJson}; window.BBM_DEBUG = {debugFlag}; {consoleOverride}");

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
                    WebViewControl.Source = new Uri(RemoteFallbackUrl);
                }

                // Hold the splash for at least 12 s AND until React signals ready —
                // whichever finishes last wins, so fast machines still see the splash.
                await Task.WhenAll(Task.Delay(3000), _readyTcs.Task);

                // Signal React to fade out its own startup splash overlay.
                // The WPF airspace problem means WebView2's Win32 HWND always renders in
                // front of WPF elements, so the WPF SplashOverlay is invisible behind the
                // WebView2 black HWND after ~1-2 s. React renders its own matching splash
                // overlay and waits for this call before fading it out, eliminating the gap.
                await WebViewControl.CoreWebView2.ExecuteScriptAsync(
                    "window.__bbmReveal && window.__bbmReveal()");

                HideSplash();
            }
            catch (Exception ex)
            {
                TsdLog.Write($"ERROR in Window_Loaded: {ex}");
                HideSplash(); // Always dismiss so the error dialog is reachable
                MessageBox.Show($"BBM Native WebView2 Boot Error: {ex.Message}\nFalling back to system browser redirect.", "Runtime Warn");
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
            // Collapse the WPF splash instantly — the React overlay handles the visible
            // fade-out, so no WPF animation is needed here. The WPF splash has been
            // hidden behind the WebView2 HWND since shortly after startup anyway.
            SplashOverlay.Visibility = Visibility.Collapsed;
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
    }
}
