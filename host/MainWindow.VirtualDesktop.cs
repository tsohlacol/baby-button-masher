using System;
using System.Runtime.InteropServices;

namespace BabyButtonMasher
{
    // Pins the window to every virtual desktop so switching desktops cannot leave the
    // sandbox behind. Uses undocumented Windows shell COM interfaces; silently no-ops on
    // OS versions where they are unavailable.
    public partial class MainWindow
    {
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
