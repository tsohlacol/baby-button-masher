#!/usr/bin/env bash
set -euo pipefail

mkdir -p logs

echo "==> Clearing old builds..."
rm -rf ./build-output
mkdir -p ./build-output

VERSION=$(node -p "require('./package.json').version")
echo "==> Building installer v${VERSION} in isolated Docker container..."
docker build -t bbm-pipeline -f Dockerfile.build --build-arg APP_VERSION="${VERSION}" . 2>&1 | tee logs/build-installer.log

echo "==> Copying final Windows Installer wrapper straight to ./build-output/ ..."
docker run --rm -v "$(pwd)/build-output:/output-directory" bbm-pipeline 2>&1 | tee -a logs/build-installer.log

VERSION=$(node -p "require('./package.json').version")
echo "========================================================="
echo " SUCCESS: Windows Installer assembled!"
echo " Output path: ./build-output/BBM_Setup_v${VERSION}.exe"
echo "========================================================="
