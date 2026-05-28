// Agent Swarm Test - Entry Point
const fs = require('fs');
const path = require('path');

/**
 * Load and validate configuration from package.json
 * @param {string} configPath - Path to config file (default: package.json)
 * @returns {Object} Validated configuration object
 * @throws {Error} If config file is missing, invalid JSON, or missing required fields
 */
function loadConfig(configPath = 'package.json') {
  const fullPath = path.resolve(process.cwd(), configPath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  let config;
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    config = JSON.parse(content);
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error(`Invalid JSON in config file: ${configPath}`);
    }
    throw new Error(`Failed to read config file: ${err.message}`);
  }

  // Validate required fields
  const requiredFields = ['name', 'version'];
  const missingFields = requiredFields.filter(field => !(field in config));

  if (missingFields.length > 0) {
    throw new Error(`Config missing required fields: ${missingFields.join(', ')}`);
  }

  // Validate field types
  if (typeof config.name !== 'string' || config.name.trim() === '') {
    throw new Error('Config field "name" must be a non-empty string');
  }
  if (typeof config.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(config.version)) {
    throw new Error('Config field "version" must be a valid semver string (e.g., "1.0.0")');
  }

  return config;
}

function greet(name) {
  return `Hello, ${name}!`;
}

function greetWithConfig(name) {
  const config = loadConfig();
  return `Hello, ${name}! (${config.name} v${config.version})`;
}

console.log(greet("World"));
module.exports = { greet, loadConfig, greetWithConfig };
