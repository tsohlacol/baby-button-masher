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

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "runonstartup"; Description: "Launch Toddler Screen Defender automatically on Windows startup"; GroupDescription: "Additional options:"

[Files]
Source: "bin\publish\ToddlerScreenDefender.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "bin\publish\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Toddler Screen Defender"; Filename: "{app}\ToddlerScreenDefender.exe"
Name: "{autodesktop}\Toddler Screen Defender"; Filename: "{app}\ToddlerScreenDefender.exe"; Tasks: desktopicon

[Registry]
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "ToddlerScreenDefender"; ValueData: """{app}\ToddlerScreenDefender.exe"""; Flags: uninsdeletevalue; Tasks: runonstartup

[Run]
Filename: "{app}\ToddlerScreenDefender.exe"; Description: "{cm:LaunchProgram,Toddler Screen Defender}"; Flags: nowait postinstall skipifsilent

[UninstallRun]
; Kill the running app instance silently prior to removing files
Filename: "taskkill"; Parameters: "/F /IM ToddlerScreenDefender.exe"; RunOnceId: "KillAppProcess"; Flags: runhidden

[UninstallDelete]
; Cleanly purge the user's local WebView2 browser data caches on uninstall
Type: filesandordirs; Name: "{userlocalappdata}\ToddlerScreenDefender"
