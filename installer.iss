[Setup]
AppName=Toddler Screen Defender
AppVersion=1.0.4
AppPublisher=tsohlacol
AppPublisherURL=https://github.com/tsohlacol/toddler-screen-defender
AppSupportURL=https://github.com/tsohlacol/toddler-screen-defender/issues
AppUpdatesURL=https://github.com/tsohlacol/toddler-screen-defender/releases
DefaultDirName={autopf}\ToddlerScreenDefender
DefaultGroupName=Toddler Screen Defender
UninstallDisplayIcon={app}\ToddlerScreenDefender.exe
OutputDir=.
OutputBaseFilename=TSD_Setup_v1.0.4
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
; Displays EULA on startup and requires user acceptance to proceed
LicenseFile=EULA.txt
; Detect running TSD instances and prompt the user to close them before files are copied.
; Without this, installing over a running exe silently leaves the old binary in place.
CloseApplications=yes
; Write a full install log to %TEMP%\Setup Log <date> #NNN.txt so failures are diagnosable.
SetupLogging=yes

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "debugdesktopicon"; Description: "Create debug shortcut (writes diagnostic log to %LOCALAPPDATA%\ToddlerScreenDefender\tsd-debug.log)"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "bin\publish\ToddlerScreenDefender.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "bin\publish\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Toddler Screen Defender"; Filename: "{app}\ToddlerScreenDefender.exe"
Name: "{autodesktop}\Toddler Screen Defender"; Filename: "{app}\ToddlerScreenDefender.exe"; Tasks: desktopicon
Name: "{autodesktop}\Toddler Screen Defender (Debug)"; Filename: "{app}\ToddlerScreenDefender.exe"; Parameters: "--debug"; Tasks: debugdesktopicon

[Registry]
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "ToddlerScreenDefender"; ValueData: """{app}\ToddlerScreenDefender.exe"""; Flags: uninsdeletevalue; Tasks: runonstartup

[Run]
Filename: "{app}\ToddlerScreenDefender.exe"; Description: "{cm:LaunchProgram,Toddler Screen Defender}"; Flags: nowait postinstall skipifsilent
Filename: "notepad.exe"; Parameters: "{log}"; Description: "Open install log"; Flags: postinstall skipifsilent unchecked

[UninstallRun]
; Kill the running app instance silently prior to removing files
Filename: "taskkill"; Parameters: "/F /IM ToddlerScreenDefender.exe"; RunOnceId: "KillAppProcess"; Flags: runhidden

[UninstallDelete]
; Cleanly purge the user's local WebView2 browser data caches on uninstall
Type: filesandordirs; Name: "{localappdata}\ToddlerScreenDefender"
