using System;
using System.IO;

namespace ToddlerScreenDefender
{
    internal static class TsdLog
    {
        private static StreamWriter? _writer;

        public static bool IsEnabled { get; private set; }

        public static void Init(string logPath)
        {
            IsEnabled = true;
            Directory.CreateDirectory(Path.GetDirectoryName(logPath)!);
            _writer = new StreamWriter(
                new FileStream(logPath, FileMode.Create, FileAccess.Write, FileShare.Read))
            {
                AutoFlush = true
            };
            var ver = System.Reflection.Assembly.GetExecutingAssembly().GetName().Version;
            Write($"TSD {ver} debug log started");
            Write($"OS: {Environment.OSVersion}");
            Write($"Args: {string.Join(" ", Environment.GetCommandLineArgs())}");
        }

        public static void Write(string message)
        {
            if (!IsEnabled || _writer == null) return;
            _writer.WriteLine($"[{DateTime.Now:HH:mm:ss.fff}] {message}");
        }

        public static void Close()
        {
            _writer?.Dispose();
            _writer = null;
        }
    }
}
