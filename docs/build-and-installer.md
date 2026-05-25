# WSL & Docker Build Engine & Installer Strategy

This document details how we compile Baby Button Masher into a single, executable enterprise installer (`setup.exe` or `BabyButtonMasher.msi`) within a WSL-compatible Docker container.

---

## 1. Single-Command Build Pipeline

The design aims for **zero environment dependencies** on your local machine. You only need Docker installed on WSL. Every dependency—including .NET compilers, Node.js packages, and MSI package assemblers—is baked directly into the Docker compiling image.

```
+---------------------------------------------------------------------------------+
|                               WSL / HOST MACHINE                                |
|   Runs simply: "docker build -t tsd-builder ." & "docker run -v $(pwd):/out"    |
+------------------------------------------------------+--------------------------+
                                                       |
                                                       v
+---------------------------------------------------------------------------------+
|                                 DOCKER STAGE 1                                  |
|  - Reads: package.json / Vite React config                                       |
|  - Compiles: Static HTML/JS/CSS index bundle inside alpine-node                 |
+------------------------------------------------------+--------------------------+
                                                       | Outputs local static code
                                                       v
+---------------------------------------------------------------------------------+
|                                 DOCKER STAGE 2                                  |
|  - Merges: Static code into WPF host source directory                           |
|  - Runs: .NET Core SDK CLI command to build "BabyButtonMasher.exe"         |
+------------------------------------------------------+--------------------------+
                                                       | Outputs native executable
                                                       v
+---------------------------------------------------------------------------------+
|                                 DOCKER STAGE 3                                  |
|  - Wraps: Executable & dependencies into WiX Toolset / Inno Setup compiler      |
|  - Outputs: "BBM_Setup_v1.0.exe" or "BabyButtonMasher_v1.0.msi"            |
+---------------------------------------------------------------------------------+
```

---

## 2. Installer Mechanics (Inno Setup / Wix Toolset)

We use **Inno Setup** or the **WiX Toolset** inside Docker to generate the installation package. These tools support standard Windows lifecycle features natively:

### A. Fresh Installation
* Unpacks `BabyButtonMasher.exe` and its internal assets (local WebView2 assemblies) into `%PROGRAMFILES%\BabyButtonMasher`.
* Registers the application in the Windows Registry under `SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall` so it appears in "Add or Remove Programs."
* Creates Desktop & Start Menu shortcuts.

### B. Smooth Uninstallation
* Registers a dedicated uninstaller executable (`unins000.exe`).
* Removing the program stops any currently running `BabyButtonMasher` process.
* Safely unregisters hooks, removes folder structures, and deletes desktop shortcuts.

### C. Updates (Overwrites/Upgrades)
* When you run a new version of the installer, it checks the registry for a previously installed version.
* Automatically halts the active running instance, replaces outdated files with new versions, and registers updated metadata—without requiring a prior manual ununinstall.

### D. System Repairs
* The MSI/setup checks internal file hashes (`App.exe`, `WebView2.dll`). If a file is missing or corrupted, running the installer again allows you to select **Repair** to reconstruct missing files.

---

## 3. Installer Script Template (Inno Setup Example)

Below is the compilation directive file (`installer.iss`) built dynamically inside our Docker container:

```ini
[Setup]
AppName=Baby Button Masher
AppVersion=1.0.4
AppPublisher=tsohlacol
AppPublisherURL=https://github.com/tsohlacol/toddler-screen-defender
AppSupportURL=https://github.com/tsohlacol/toddler-screen-defender/issues
AppUpdatesURL=https://github.com/tsohlacol/toddler-screen-defender/releases
DefaultDirName={autopf}\BabyButtonMasher
DefaultGroupName=Baby Button Masher
UninstallDisplayIcon={app}\BabyButtonMasher.exe
OutputDir=.
OutputBaseFilename=BBM_Setup_v1.0.4
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
; Displays EULA on startup and requires user acceptance to proceed
LicenseFile=EULA.txt

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "bin\publish\BabyButtonMasher.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "bin\publish\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Baby Button Masher"; Filename: "{app}\BabyButtonMasher.exe"
Name: "{autodesktop}\Baby Button Masher"; Filename: "{app}\BabyButtonMasher.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\BabyButtonMasher.exe"; Description: "{cm:LaunchProgram,Baby Button Masher}"; Flags: nowait postinstall skipifsilent

[UninstallRun]
; Kill the running app instance silently prior to removing files
Filename: "taskkill"; Parameters: "/F /IM BabyButtonMasher.exe"; RunOnceId: "KillAppProcess"; Flags: runhidden
```
