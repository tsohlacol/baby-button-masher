using System;
using System.IO;
using System.Linq;
using System.Windows;

namespace BabyButtonMasher
{
    public partial class App : Application
    {
        protected override void OnStartup(StartupEventArgs e)
        {
            base.OnStartup(e);
            if (e.Args.Contains("--debug", StringComparer.OrdinalIgnoreCase))
            {
                string logDir = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "ToddlerScreenDefender");
                TsdLog.Init(Path.Combine(logDir, "tsd-debug.log"));
            }
        }

        protected override void OnExit(ExitEventArgs e)
        {
            TsdLog.Write("Application exiting");
            TsdLog.Close();
            base.OnExit(e);
        }
    }
}
