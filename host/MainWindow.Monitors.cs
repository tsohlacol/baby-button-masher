using System;
using System.Runtime.InteropServices;

namespace BabyButtonMasher
{
    // Multi-monitor enumeration. Produces the JSON array injected as window.BBM_MONITORS,
    // converting physical pixels to WPF logical (96-DPI) coordinates so the values match
    // what the embedded browser's CSS viewport actually sees.
    public partial class MainWindow
    {
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
}
