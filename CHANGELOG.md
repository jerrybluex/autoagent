# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Config Loading**: `loadConfig()` function in `index.js` that:
  - Resolves absolute paths for config files
  - Validates file existence with descriptive errors
  - Parses JSON with structured error handling
  - Validates config structure (requires `name` field as non-empty string)
- **Test Coverage**: `index.test.js` with 5 test cases covering:
  - `greet()` function behavior
  - Valid config loading
  - Missing file error handling
  - Invalid JSON error handling
  - Invalid config structure validation

### Changed

- **Dependencies**: Updated test script in `package.json` from placeholder to `node --test index.test.js`

### Documentation

- **Agent Swarm Setup**: Added `docs/SETUP.md` with complete configuration guide including:
  - Prerequisites and directory structure
  - 5 core PowerShell scripts (spawn-agent, check-agents, ralph-loop, review-pr, notify-feishu)
  - OpenClaw cron configuration
  - Environment variables and GitHub/Feishu integration

### Infrastructure

- **Git Ignore**: Added `.gitignore` to exclude `node_modules/`
- **Issue Tracking**: Added `.scratch/0001-babel8-corejs2-deprecation.md` for tracking Babel 8 compatibility work

[Unreleased]: https://github.com/MLTZ/autoagent/compare/main...HEAD
