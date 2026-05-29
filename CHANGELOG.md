# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Config Loading**: `loadConfig()` function in `index.js`:
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
- **Agent Swarm Core Scripts** (`scripts/`)
  - `spawn-agent.ps1`: Spawn AI agents (Codex or Claude) with independent worktrees
  - `check-agents.ps1`: Monitor agent status every 10 minutes, auto-retry on failure
  - `ralph-loop.ps1`: Auto-discover TODO/FIXME comments and errors every 30 minutes
  - `review-pr.ps1`: AI triple-review for pull requests
  - `notify-feishu.ps1`: Feishu bot notifications for task completion
- **Complete README.md**: Agent Swarm user guide with quick start, core concepts, and usage examples
- **Documentation** (`docs/`)
  - `SETUP.md`: Complete configuration guide with installation scripts
- **Babel 8 Compatibility Tests**
  - `corejs2-deprecation.test.js`: Verify corejs2 built-ins removal in Babel 8

### Changed

- **README.md**: Complete rewrite as Agent Swarm user guide (from test project to AI agent orchestration)
- `.gitignore`: Ignore `node_modules/` directory

### Removed

- **Test Coverage**: Removed `index.test.js` and `loadConfig()` function (deprioritized for Agent Swarm focus)
- **Test Script**: Simplified `package.json` test script to placeholder

### Documentation

- **Babel 8 Deprecation**: Clarified upstream concern regarding `@babel/compat-data` corejs2-built-ins.js

### Infrastructure

- **Issue Tracking**: Added `.scratch/0001-babel8-corejs2-deprecation.md` for tracking Babel 8 compatibility work