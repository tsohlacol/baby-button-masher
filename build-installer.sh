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
echo " Output path: ./build-output/TSD_Setup_v1.0.exe"
echo "========================================================="
