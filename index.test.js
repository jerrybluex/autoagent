const fs = require('fs');
const path = require('path');
const { loadConfig, ConfigError } = require('./index');

describe('loadConfig', () => {
  const testDir = path.join(__dirname, 'test-configs');
  const validConfig = JSON.stringify({ name: 'test', value: 42 });

  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up test files after each test
    const files = ['valid.json', 'invalid.json', 'empty.json', 'array.json', 'null.json'];
    files.forEach(f => {
      const p = path.join(testDir, f);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });
  });

  test('loads valid config file', async () => {
    fs.writeFileSync(path.join(testDir, 'valid.json'), validConfig);
    const config = await loadConfig(path.join(testDir, 'valid.json'));
    expect(config).toEqual({ name: 'test', value: 42 });
  });

  test('throws ConfigError for non-existent file', async () => {
    await expect(loadConfig(path.join(testDir, 'nonexistent.json')))
      .rejects.toThrow(ConfigError);
  });

  test('throws ConfigError for invalid JSON', async () => {
    fs.writeFileSync(path.join(testDir, 'invalid.json'), '{ invalid json }');
    await expect(loadConfig(path.join(testDir, 'invalid.json')))
      .rejects.toThrow(ConfigError);
  });

  test('throws ConfigError for empty file', async () => {
    fs.writeFileSync(path.join(testDir, 'empty.json'), '');
    await expect(loadConfig(path.join(testDir, 'empty.json')))
      .rejects.toThrow(ConfigError);
  });

  test('throws ConfigError for array instead of object', async () => {
    fs.writeFileSync(path.join(testDir, 'array.json'), '[1, 2, 3]');
    await expect(loadConfig(path.join(testDir, 'array.json')))
      .rejects.toThrow(ConfigError);
  });

  test('throws ConfigError for null value', async () => {
    fs.writeFileSync(path.join(testDir, 'null.json'), 'null');
    await expect(loadConfig(path.join(testDir, 'null.json')))
      .rejects.toThrow(ConfigError);
  });

  test('throws ConfigError for invalid path type', async () => {
    await expect(loadConfig(null)).rejects.toThrow(ConfigError);
    await expect(loadConfig(undefined)).rejects.toThrow(ConfigError);
    await expect(loadConfig('')).rejects.toThrow(ConfigError);
  });

  test('throws ConfigError for directory path', async () => {
    await expect(loadConfig(testDir)).rejects.toThrow(ConfigError);
  });

  test('ConfigError has correct code property', async () => {
    fs.writeFileSync(path.join(testDir, 'invalid.json'), 'not json');
    try {
      await loadConfig(path.join(testDir, 'invalid.json'));
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigError);
      expect(err.code).toBe('CONFIG_INVALID_JSON');
      expect(err.name).toBe('ConfigError');
    }
  });
});