using System.Runtime.InteropServices;

namespace BabyButtonMasher
{
    // Accessibility hotkey suppression (Sticky Keys, Filter Keys, Toggle Keys).
    // These accessibility shortcuts can be triggered by a toddler mashing keys (e.g. 5x Shift
    // activates Sticky Keys, which then makes Ctrl "stick" and drops all subsequent input).
    // We disable only the keyboard shortcut that *toggles* each feature; the feature itself
    // is left in whatever state the user configured outside of BBM. Restored on exit.
    public partial class MainWindow
    {
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
    }
}
