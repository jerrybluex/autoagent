// Agent Swarm Test - Entry Point

const fs = require('fs');
const path = require('path');

/**
 * Load and parse a JSON config file with full error handling
 * @param {string} configPath - Path to the config file
 * @returns {Promise<Object>} Parsed config object
 * @throws {ConfigError} When file doesn't exist, is invalid, or unreadable
 */
async function loadConfig(configPath) {
  // Validate input
  if (!configPath || typeof configPath !== 'string') {
    throw new ConfigError('CONFIG_INVALID_PATH', 'Config path must be a non-empty string');
  }

  // Check if file exists
  if (!fs.existsSync(configPath)) {
    throw new ConfigError('CONFIG_FILE_NOT_FOUND', `Config file not found: ${configPath}`);
  }

  // Check if path is a file (not directory)
  const stats = fs.statSync(configPath);
  if (!stats.isFile()) {
    throw new ConfigError('CONFIG_NOT_A_FILE', `Path is not a file: ${configPath}`);
  }

  // Check read permissions
  try {
    fs.accessSync(configPath, fs.constants.R_OK);
  } catch (err) {
    throw new ConfigError('CONFIG_PERMISSION_DENIED', `Cannot read config file: ${configPath}`);
  }

  // Read file content
  let content;
  try {
    content = fs.readFileSync(configPath, 'utf8');
  } catch (err) {
    throw new ConfigError('CONFIG_READ_ERROR', `Failed to read config file: ${err.message}`);
  }

  // Handle empty file
  if (!content || content.trim() === '') {
    throw new ConfigError('CONFIG_EMPTY_FILE', 'Config file is empty');
  }

  // Parse JSON
  let config;
  try {
    config = JSON.parse(content);
  } catch (err) {
    throw new ConfigError('CONFIG_INVALID_JSON', `Invalid JSON in config file: ${err.message}`);
  }

  // Validate parsed config is an object
  if (typeof config !== 'object' || config === null || Array.isArray(config)) {
    throw new ConfigError('CONFIG_INVALID_STRUCTURE', 'Config file must contain a JSON object');
  }

  return config;
}

/**
 * Custom error class for config-related errors
 */
class ConfigError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ConfigError';
    this.code = code;
  }
}

function greet(name) {
  return `Hello, ${name}!`;
}

console.log(greet("World"));
module.exports = { greet, loadConfig, ConfigError };
