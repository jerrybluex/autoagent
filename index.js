const fs = require('fs');
const path = require('path');

function greet(name) {
  return `Hello, ${name}!`;
}

function loadConfig(configPath) {
  const absolutePath = path.resolve(configPath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Config file not found: ${absolutePath}`);
  }
  let content;
  try {
    content = fs.readFileSync(absolutePath, 'utf-8');
  } catch (err) {
    throw new Error(`Cannot read config file: ${absolutePath} (${err.message})`);
  }
  let config;
  try {
    config = JSON.parse(content);
  } catch (err) {
    throw new Error(`Invalid config file: ${err.message}`);
  }
  if (!config.name || typeof config.name !== 'string') {
    throw new Error('Invalid config: "name" must be a non-empty string');
  }
  return config;
}

console.log(greet("World"));
module.exports = { greet, loadConfig };
