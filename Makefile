# Toddler Screen Defender (TSD) Build and Test Makefile
.PHONY: install build lint test build-installer clean help

help:
	@echo "Toddler Screen Defender - Build and Test Targets:"
	@echo "  install          - Install Node.js frontend dependencies"
	@echo "  build            - Build the static React game sandbox folder"
	@echo "  lint             - Validate TypeScript and JavaScript files for errors"
	@echo "  test             - Run all code validation and build checks"
	@echo "  build-installer  - Run Docker compilation container to assemble Windows Host and Installer"
	@echo "  clean            - Clear previous build folders and installer targets"

install:
	npm install && npm run build

build:
	npm run build

lint:
	npm run lint

test: lint build
	@echo "All local validation tests and React builds completed successfully!"

build-installer:
	@chmod +x ./build-installer.sh
	./build-installer.sh

clean:
	rm -rf dist
	rm -rf build-output
	rm -rf host/assets/react-app
	@echo "Build and release assets cleaned."
