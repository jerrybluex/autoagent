const { loadConfig, greet } = require('../index');
const path = require('path');

// Test fixtures - use a temp directory approach
const os = require('os');
const fs = require('fs');

describe('loadConfig', () => {
  const tmpDir = path.join(os.tmpdir(), 'config-test-' + Date.now());
  let originalCwd;

  beforeAll(() => {
    fs.mkdirSync(tmpDir, { recursive: true });
    originalCwd = process.cwd();
  });

  afterAll(() => {
    process.chdir(originalCwd);
    // Clean up temp files
    const files = fs.readdirSync(tmpDir);
    files.forEach(file => fs.unlinkSync(path.join(tmpDir, file)));
    fs.rmdirSync(tmpDir);
  });

  beforeEach(() => {
    process.chdir(tmpDir);
    // Clear any cached module
    jest.resetModules();
  });

  describe('when config file exists and is valid', () => {
    test('returns parsed config object', () => {
      const validConfig = { name: 'test-package', version: '1.0.0' };
      fs.writeFileSync('package.json', JSON.stringify(validConfig));

      const config = loadConfig('package.json');
      expect(config).toEqual(validConfig);
    });

    test('throws error for missing config file', () => {
      expect(() => loadConfig('missing.json')).toThrow('Config file not found: missing.json');
    });

    test('throws error for invalid JSON', () => {
      fs.writeFileSync('bad.json', '{ invalid json }');
      expect(() => loadConfig('bad.json')).toThrow('Invalid JSON in config file');
    });

    test('throws error for missing required fields', () => {
      fs.writeFileSync('missing-fields.json', JSON.stringify({ name: 'test' }));
      expect(() => loadConfig('missing-fields.json')).toThrow('Config missing required fields');
    });

    test('throws error for empty name field', () => {
      fs.writeFileSync('empty-name.json', JSON.stringify({ name: '', version: '1.0.0' }));
      expect(() => loadConfig('empty-name.json')).toThrow('name" must be a non-empty string');
    });

    test('throws error for invalid version format', () => {
      fs.writeFileSync('bad-version.json', JSON.stringify({ name: 'test', version: 'invalid' }));
      expect(() => loadConfig('bad-version.json')).toThrow('version" must be a valid semver string');
    });
  });
});

describe('greet', () => {
  test('returns greeting with name', () => {
    expect(greet('World')).toBe('Hello, World!');
  });

  test('returns greeting with custom name', () => {
    expect(greet('Alice')).toBe('Hello, Alice!');
  });
});