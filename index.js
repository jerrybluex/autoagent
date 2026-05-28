// Agent Swarm Test - Entry Point
const logger = require("./lib/logger");

function greet(name) {
  return `Hello, ${name}!`;
}

logger.info(greet("World"));
module.exports = { greet };
// TODO: Add error handling for invalid config files
