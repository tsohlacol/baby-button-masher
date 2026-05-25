#!/usr/bin/env bash
set -euo pipefail

mkdir -p logs

echo "==> Clearing old builds..."
rm -rf ./build-output
mkdir -p ./build-output

echo "==> Building installer in isolated Docker container..."
docker build -t bbm-pipeline -f Dockerfile.build . 2>&1 | tee logs/build-installer.log

echo "==> Copying final Windows Installer wrapper straight to ./build-output/ ..."
docker run --rm -v "$(pwd)/build-output:/output-directory" bbm-pipeline 2>&1 | tee -a logs/build-installer.log

echo "========================================================="
echo " SUCCESS: Windows Installer assembled!"
echo " Output path: ./build-output/TSD_Setup_v1.0.exe"
echo "========================================================="
