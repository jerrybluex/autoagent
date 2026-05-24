const test = require('node:test');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { greet, loadConfig } = require('./index');

test('greet returns greeting', () => {
  assert.strictEqual(greet('World'), 'Hello, World!');
  assert.strictEqual(greet('Alice'), 'Hello, Alice!');
});

test('loadConfig loads valid config', () => {
  const tmpPath = path.join(__dirname, 'test-config.json');
  fs.writeFileSync(tmpPath, JSON.stringify({ name: 'test' }));
  try {
    const config = loadConfig(tmpPath);
    assert.deepStrictEqual(config, { name: 'test' });
  } finally {
    fs.unlinkSync(tmpPath);
  }
});

test('loadConfig throws for missing file', () => {
  assert.throws(() => loadConfig('/nonexistent/path/config.json'), /not found/);
});

test('loadConfig throws for invalid JSON', () => {
  const tmpPath = path.join(__dirname, 'test-config.json');
  fs.writeFileSync(tmpPath, 'not valid json');
  try {
    assert.throws(() => loadConfig(tmpPath), /Invalid config file/);
  } finally {
    fs.unlinkSync(tmpPath);
  }
});

test('loadConfig throws for invalid config structure', () => {
  const tmpPath = path.join(__dirname, 'test-config.json');
  fs.writeFileSync(tmpPath, JSON.stringify({}));
  try {
    assert.throws(() => loadConfig(tmpPath), /Invalid config/);
  } finally {
    fs.unlinkSync(tmpPath);
  }
});
