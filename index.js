#!/usr/bin/env node

// Agent Swarm Test - Entry Point

function greet(name) {
  return `Hello, ${name}!`;
}

function parseArgs(argv) {
  const parsed = { help: false, name: "World" };

  for (const arg of argv) {
    if (arg === "--help") {
      parsed.help = true;
    } else if (arg.startsWith("--name=")) {
      parsed.name = arg.slice("--name=".length);
    }
  }

  return parsed;
}

function getUsage() {
  return [
    "Usage: npx agent-swarm-test [options]",
    "",
    "Options:",
    "  --name=<value>  Greet a custom name",
    "  --help          Show this help message"
  ].join("\n");
}

function runCli(argv = process.argv.slice(2), log = console.log) {
  const args = parseArgs(argv);

  if (args.help) {
    log(getUsage());
    return;
  }

  log(greet(args.name));
}

if (require.main === module) {
  runCli();
}

module.exports = { greet, parseArgs, getUsage, runCli };
