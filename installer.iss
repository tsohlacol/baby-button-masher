#define MyAppVersion "1.1.0"

[Setup]
AppName=Baby Button Masher
AppVersion={#MyAppVersion}
AppPublisher=tsohlacol
AppPublisherURL=https://github.com/tsohlacol/toddler-screen-defender
AppSupportURL=https://github.com/tsohlacol/toddler-screen-defender/issues
AppUpdatesURL=https://github.com/tsohlacol/toddler-screen-defender/releases
DefaultDirName={autopf}\BabyButtonMasher
DefaultGroupName=Baby Button Masher
UninstallDisplayIcon={app}\BabyButtonMasher.exe
; SetupIconFile brands the installer wizard window and taskbar button during setup.
SetupIconFile=bbm.ico
OutputDir=.
OutputBaseFilename=BBM_Setup_v{#MyAppVersion}
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
; Displays EULA on startup and requires user acceptance to proceed
LicenseFile=EULA.txt
; Detect running BBM instances and prompt the user to close them before files are copied.
; Without this, installing over a running exe silently leaves the old binary in place.
CloseApplications=yes
; Write a full install log to %TEMP%\Setup Log <date> #NNN.txt so failures are diagnosable.
SetupLogging=yes

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "debugdesktopicon"; Description: "Create debug shortcut (writes diagnostic log to %LOCALAPPDATA%\BabyButtonMasher\bbm-debug.log)"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "bin\publish\BabyButtonMasher.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "bin\publish\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Baby Button Masher"; Filename: "{app}\BabyButtonMasher.exe"; IconFilename: "{app}\BabyButtonMasher.exe"
Name: "{autodesktop}\Baby Button Masher"; Filename: "{app}\BabyButtonMasher.exe"; IconFilename: "{app}\BabyButtonMasher.exe"; Tasks: desktopicon
Name: "{autodesktop}\Baby Button Masher (Debug)"; Filename: "{app}\BabyButtonMasher.exe"; Parameters: "--debug"; IconFilename: "{app}\BabyButtonMasher.exe"; Tasks: debugdesktopicon


[Run]
Filename: "{app}\BabyButtonMasher.exe"; Description: "{cm:LaunchProgram,Baby Button Masher}"; Flags: nowait postinstall skipifsilent
Filename: "notepad.exe"; Parameters: "{log}"; Description: "Open install log"; Flags: postinstall skipifsilent unchecked

[UninstallRun]
; Kill the running app instance silently prior to removing files
Filename: "taskkill"; Parameters: "/F /IM BabyButtonMasher.exe"; RunOnceId: "KillAppProcess"; Flags: runhidden

[UninstallDelete]
; Cleanly purge the user's local WebView2 browser data caches on uninstall
Type: filesandordirs; Name: "{localappdata}\BabyButtonMasher"
