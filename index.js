// Agent Swarm Test - Entry Point

function validateConfig(config) {
  if (!config) {
    throw new Error('Configuration is null or undefined');
  }
  if (typeof config !== 'object') {
    throw new Error('Configuration must be an object');
  }
  return true;
}

function loadConfig(path) {
  try {
    const fs = require('fs');
    const content = fs.readFileSync(path, 'utf8');
    const config = JSON.parse(content);
    validateConfig(config);
    return config;
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`Configuration file not found: ${path}`);
    }
    if (err instanceof SyntaxError) {
      throw new Error(`Invalid JSON in configuration file: ${path}`);
    }
    throw err;
  }
}

function greet(name) {
  if (typeof name !== 'string') {
    throw new Error('name must be a string');
  }
  return `Hello, ${name}!`;
}

console.log(greet("World"));
module.exports = { greet, loadConfig, validateConfig };
