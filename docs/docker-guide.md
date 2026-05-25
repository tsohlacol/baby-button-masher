# Docker Build & Compilation Guide for WSL

Since .NET and Windows installer tooling (like Inno Setup / WiX) run natively on Windows, cross-compiling windows binaries in a clean Docker container under WSL represents the ultimate developer workflow. 

This document explains how to set up the multi-stage Docker environment to compile the Baby Button Masher client automatically.

---

## 1. The Multi-Stage Dockerfile (`Dockerfile.build`)

Create this file in your root project folder. It utilizes Node to build the React application, .NET Core with cross-compilation capability, and Wine to run the Inno Setup compiler to create the Windows payload.

```dockerfile
# =========================================================
# STAGE 1: React Front-End Compilation
# =========================================================
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# =========================================================
# STAGE 2: .NET 8 WPF Host Cross-Compilation
# =========================================================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS native-builder
WORKDIR /src
# Copy source files for the C# WPF Wrapper application
COPY host/ ./host/
# Copy built static files from Stage 1 into the host resource folder
COPY --from=frontend-builder /app/dist ./host/assets/react-app/

WORKDIR /src/host
# Publish a self-contained, single-file Windows executable
RUN dotnet publish -c Release -r win-x64 --self-contained true /p:PublishSingleFile=true -o /publish

# =========================================================
# STAGE 3: Windows Installer Creation using Wine & Inno Setup
# =========================================================
FROM ubuntu:22.04 AS installer-builder
ENV DEBIAN_FRONTEND=noninteractive

# Install Wine to run Windows-based Inno Setup compiler
RUN dpkg --add-architecture i386 && apt-get update && apt-get install -y \
    wine \
    wine32 \
    wine64 \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install Inno Setup
WORKDIR /inno
RUN curl -SL "https://files.jrsoftware.org/is/6/innosetup-6.2.2.exe" -o innosetup.exe \
    && wine innosetup.exe /SILENT /VERYSILENT /SUPPRESSMSGBOXES /NORESTART \
    && rm innosetup.exe

# Copy installer specification and compiled binary
WORKDIR /build
COPY installer.iss .
COPY --from=native-builder /publish ./bin/publish/

# Compile installer setup.exe
RUN wine "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" installer.iss

# =========================================================
# FINAL RUNTIME: Output Extractor
# =========================================================
FROM alpine:latest
WORKDIR /out
# Retrieve the completed installer
COPY --from=installer-builder /build/*.exe /out/
CMD ["cp", "-r", "/out/.", "/output-directory"]
```

---

## 2. WSL Compilation Script (`build-installer.sh`)

By making a simple bash wrapper script, you run a single command in WSL to trigger the full compilation of the React app, C# backend, and Inno Setup packager inside Docker, dumping the final `setup.exe` straight back into your host filesystem.

Save this script as `./build-installer.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "==> Clearing old builds..."
rm -rf ./build-output
mkdir -p ./build-output

echo "==> Building installer in isolated Docker container..."
docker build -t tsd-pipeline -f Dockerfile.build .

echo "==> Copying final Windows Installer wrapper straight to ./build-output/ ..."
docker run --rm -v "$(pwd)/build-output:/output-directory" tsd-pipeline

echo "========================================================="
echo " SUCCESS: Windows Installer assembled!"
echo " Output path: ./build-output/BBM_Setup_v1.0.exe"
echo "========================================================="
```

### Execution Steps in WSL:
1. Make your build script executable:
   ```bash
   chmod +x ./build-installer.sh
   ```
2. Run the pipeline:
   ```bash
   ./build-installer.sh
   ```
3. Locate the finished installer in your standard Explorer panel at: `\\wsl$\Ubuntu\...\toddler-screen-defender\build-output\BBM_Setup_v1.0.exe`.
