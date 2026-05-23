# Toddler Screen Defender (TSD) Build, Test, and Security Audit Makefile
SHELL := /bin/bash
LOG_DIR := logs

.PHONY: all setup build lint test sast sca dast secrets malware security-audit build-installer run clean help

all: setup test build-installer
	@echo "==> Packaging local installer and creating a zipped package..."
	@mkdir -p build-output
	@EXE_FILE=$$(find build-output -name "*.exe" | head -n 1); \
	if [ -n "$$EXE_FILE" ]; then \
		echo "Found installer: $$EXE_FILE. Creating TSD_Setup_v1.0.4.zip..."; \
		if command -v zip >/dev/null 2>&1; then \
			zip -j build-output/TSD_Setup_v1.0.4.zip "$$EXE_FILE"; \
		elif command -v python3 >/dev/null 2>&1; then \
			python3 -c "import zipfile, os; z = zipfile.ZipFile('build-output/TSD_Setup_v1.0.4.zip', 'w', zipfile.ZIP_DEFLATED); z.write('$$EXE_FILE', os.path.basename('$$EXE_FILE')); z.close()"; \
		else \
			echo "Warning: Neither zip nor python3 found in environment. Could not generate zip archive."; \
		fi; \
	else \
		echo "Error: No compiled Windows installer .exe found in build-output/ folder."; \
		exit 1; \
	fi
	@echo "All deliverables (local installer copy and zip package) ready under ./build-output/!"

help:
	@echo "Toddler Screen Defender - Build, Test, and Security Audit Targets:"
	@echo "  all              - Setup, test, build installer, and compile upload zip package"
	@echo "  setup            - Install Node.js frontend dependencies"
	@echo "  build            - Build the static React game sandbox folder"
	@echo "  lint             - Validate TypeScript and JavaScript files for errors"
	@echo "  test             - Run all code linting, parallelized unit tests, and security scans"
	@echo "  sast             - Execute static code scanning seeking security vulnerabilities"
	@echo "  sca              - Execute software composition analysis and license checks"
	@echo "  dast             - Audit dynamic sandbox frames, overrides, and clickjacking metrics"
	@echo "  secrets          - Inspect workspace files scanning for hardcoded secrets/API keys"
	@echo "  malware          - Scan workspace scripts and binaries for signatures, mines, and backdoors"
	@echo "  security-audit   - Run full five-tier security scanner suite (SAST + SCA + DAST + Secrets + Malware)"
	@echo "  build-installer  - Run Docker compilation container to assemble Windows Host and Installer"
	@echo "  run              - Build the React frontend, sync assets, and boot the WPF app locally via dotnet run"
	@echo "  clean            - Clear previous build folders and installer targets"

setup:
	@mkdir -p $(LOG_DIR)
	npm install && npm run build 2>&1 | tee $(LOG_DIR)/setup.log; exit $${PIPESTATUS[0]}

build:
	@mkdir -p $(LOG_DIR)
	npm run build 2>&1 | tee $(LOG_DIR)/build.log; exit $${PIPESTATUS[0]}

lint:
	@mkdir -p $(LOG_DIR)
	npm run lint 2>&1 | tee $(LOG_DIR)/lint.log; exit $${PIPESTATUS[0]}

sast:
	@mkdir -p $(LOG_DIR)
	npm run sast 2>&1 | tee $(LOG_DIR)/sast.log; exit $${PIPESTATUS[0]}

sca:
	@mkdir -p $(LOG_DIR)
	npm run sca 2>&1 | tee $(LOG_DIR)/sca.log; exit $${PIPESTATUS[0]}

dast:
	@mkdir -p $(LOG_DIR)
	npm run dast 2>&1 | tee $(LOG_DIR)/dast.log; exit $${PIPESTATUS[0]}

secrets:
	@mkdir -p $(LOG_DIR)
	npm run secrets 2>&1 | tee $(LOG_DIR)/secrets.log; exit $${PIPESTATUS[0]}

malware:
	@mkdir -p $(LOG_DIR)
	npm run malware 2>&1 | tee $(LOG_DIR)/malware.log; exit $${PIPESTATUS[0]}

security-audit: sast sca dast secrets malware

test: lint build security-audit
	@mkdir -p $(LOG_DIR)
	npm run test 2>&1 | tee $(LOG_DIR)/test.log; exit $${PIPESTATUS[0]}
	@echo "All local validation checks, security scans, and parallelized unit tests completed successfully!"

build-installer:
	@chmod +x ./build-installer.sh
	./build-installer.sh

run: build
	@echo "==> Syncing React build outputs to C# WPF layout asset folders..."
	@mkdir -p host/assets/react-app
	@cp -R dist/* host/assets/react-app/
	@echo "==> Booting Toddler Screen Defender locally..."
	dotnet run --project host/ToddlerScreenDefender.csproj

clean:
	rm -rf dist
	rm -rf build-output
	rm -rf host/assets/react-app
	@echo "Build and release assets cleaned."
