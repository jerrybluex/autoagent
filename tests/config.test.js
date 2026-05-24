const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { loadConfig } = require('../lib/config');

function runTests() {
  // Test: loadConfig loads default.json
  {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-test-'));
    fs.mkdirSync(path.join(dir, 'config'));
    fs.writeFileSync(
      path.join(dir, 'config', 'default.json'),
      '{"greetingTemplate": "Hey {name}!"}'
    );

    const cfg = loadConfig(dir);
    assert.strictEqual(cfg.greetingTemplate, 'Hey {name}!');

    fs.rmSync(dir, { recursive: true, force: true });
  }

  // Test: missing local.json falls back to default (no error)
  {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-test-'));
    fs.mkdirSync(path.join(dir, 'config'));
    fs.writeFileSync(
      path.join(dir, 'config', 'default.json'),
      '{"greetingTemplate": "Hi {name}!"}'
    );

    const cfg = loadConfig(dir);
    assert.strictEqual(cfg.greetingTemplate, 'Hi {name}!');

    fs.rmSync(dir, { recursive: true, force: true });
  }

  // Test: local.json overrides default values
  {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-test-'));
    fs.mkdirSync(path.join(dir, 'config'));
    fs.writeFileSync(
      path.join(dir, 'config', 'default.json'),
      '{"greetingTemplate": "Hello {name}!", "other": 1}'
    );
    fs.writeFileSync(
      path.join(dir, 'config', 'local.json'),
      '{"greetingTemplate": "Howdy {name}!"}'
    );

    const cfg = loadConfig(dir);
    assert.strictEqual(cfg.greetingTemplate, 'Howdy {name}!');
    assert.strictEqual(cfg.other, 1);

    fs.rmSync(dir, { recursive: true, force: true });
  }

  // Test: index.js greet uses config template
  {
    const { greet } = require('../index');
    assert.strictEqual(greet('World'), 'Hello, World!');
  }

  console.log('All tests passed.');
}

runTests();
