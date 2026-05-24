// Agent Swarm Test - Entry Point

const { loadConfig } = require('./lib/config');
const config = loadConfig();

function greet(name) {
  return config.greetingTemplate.replace('{name}', name);
}

console.log(greet("World"));
module.exports = { greet };
