# WSL & Docker Build Engine & Installer Strategy

This document details how we compile Toddler Screen Defender into a single, executable enterprise installer (`setup.exe` or `ToddlerScreenDefender.msi`) within a WSL-compatible Docker container.

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
|  - Runs: .NET Core SDK CLI command to build "ToddlerScreenDefender.exe"         |
+------------------------------------------------------+--------------------------+
                                                       | Outputs native executable
                                                       v
+---------------------------------------------------------------------------------+
|                                 DOCKER STAGE 3                                  |
|  - Wraps: Executable & dependencies into WiX Toolset / Inno Setup compiler      |
|  - Outputs: "TSD_Setup_v1.0.exe" or "ToddlerScreenDefender_v1.0.msi"            |
+---------------------------------------------------------------------------------+
```

---

## 2. Installer Mechanics (Inno Setup / Wix Toolset)

We use **Inno Setup** or the **WiX Toolset** inside Docker to generate the installation package. These tools support standard Windows lifecycle features natively:

### A. Fresh Installation
* Unpacks `ToddlerScreenDefender.exe` and its internal assets (local WebView2 assemblies) into `%PROGRAMFILES%\ToddlerScreenDefender`.
* Registers the application in the Windows Registry under `SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall` so it appears in "Add or Remove Programs."
* Creates Desktop & Start Menu shortcuts.

### B. Smooth Uninstallation
* Registers a dedicated uninstaller executable (`unins000.exe`).
* Removing the program stops any currently running `ToddlerScreenDefender` process.
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
AppName=Toddler Screen Defender
AppVersion=1.0.4
DefaultDirName={autopf}\ToddlerScreenDefender
DefaultGroupName=Toddler Screen Defender
UninstallDisplayIcon={app}\ToddlerScreenDefender.exe
OutputDir=.
OutputBaseFilename=TSD_Setup_v1.0.4
Compression=lzma2
SolidCompression=yes
WizardStyle=modern

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "bin\publish\ToddlerScreenDefender.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "bin\publish\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Toddler Screen Defender"; Filename: "{app}\ToddlerScreenDefender.exe"
Name: "{autodesktop}\Toddler Screen Defender"; Filename: "{app}\ToddlerScreenDefender.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\ToddlerScreenDefender.exe"; Description: "{cm:LaunchProgram,Toddler Screen Defender}"; Flags: nowait postinstall skipifsilent

[UninstallRun]
; Kill the running app instance silently prior to removing files
Filename: "taskkill"; Parameters: "/F /IM ToddlerScreenDefender.exe"; RunOnceId: "KillAppProcess"; Flags: runhidden
```
