/**
 * Agent Swarm Test - Entry Point
 *
 * This is the main entry point for the Agent Swarm Test application.
 * It exports a greet function that returns a personalized greeting message.
 * When run directly (node index.js), it outputs "Hello, World!" to the console.
 */

function greet(name) {
  return `Hello, ${name}!`;
}

console.log(greet("World"));
module.exports = { greet };
