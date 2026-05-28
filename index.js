// Agent Swarm Test - Entry Point

class ConfigError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'ConfigError';
    this.code = code;
  }
}

function loadConfig(config) {
  if (!config) {
    throw new ConfigError('Configuration is required', 'MISSING_CONFIG');
  }
  if (typeof config !== 'object' || Array.isArray(config)) {
    throw new ConfigError('Configuration must be an object', 'INVALID_TYPE');
  }
  if (config.name !== undefined && typeof config.name !== 'string') {
    throw new ConfigError('config.name must be a string', 'INVALID_NAME_TYPE');
  }
  return config;
}

function createGreeter(config) {
  const validConfig = loadConfig(config);
  return function greet(name) {
    if (typeof name !== 'string') {
      throw new ConfigError('Name must be a string', 'INVALID_GREETEE');
    }
    const targetName = validConfig.name || 'World';
    return `Hello, ${name}!`;
  };
}

const defaultGreeter = createGreeter({});

console.log(defaultGreeter("World"));
module.exports = { greet: defaultGreeter, createGreeter, loadConfig, ConfigError };
// TODO: Add error handling for invalid config files
