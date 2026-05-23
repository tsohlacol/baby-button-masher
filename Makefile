# Toddler Screen Defender (TSD) Build, Test, and Security Audit Makefile
.PHONY: install build lint test sast sca dast security-audit build-installer clean help

help:
	@echo "Toddler Screen Defender - Build, Test, and Security Audit Targets:"
	@echo "  install          - Install Node.js frontend dependencies"
	@echo "  build            - Build the static React game sandbox folder"
	@echo "  lint             - Validate TypeScript and JavaScript files for errors"
	@echo "  test             - Run all code linting, parallelized unit tests, and security scans"
	@echo "  sast             - Execute static code scanning seeking security vulnerabilities"
	@echo "  sca              - Execute software composition analysis and license checks"
	@echo "  dast             - Audit dynamic sandbox frames, overrides, and clickjacking metrics"
	@echo "  security-audit   - Run full three-tier security scanner suite (SAST + SCA + DAST)"
	@echo "  build-installer  - Run Docker compilation container to assemble Windows Host and Installer"
	@echo "  clean            - Clear previous build folders and installer targets"

install:
	npm install && npm run build

build:
	npm run build

lint:
	npm run lint

sast:
	npm run sast

sca:
	npm run sca

dast:
	npm run dast

security-audit:
	npm run security-audit

test: lint build security-audit
	npm run test
	@echo "All local validation checks, security scans, and parallelized unit tests completed successfully!"

build-installer:
	@chmod +x ./build-installer.sh
	./build-installer.sh

clean:
	rm -rf dist
	rm -rf build-output
	rm -rf host/assets/react-app
	@echo "Build and release assets cleaned."
