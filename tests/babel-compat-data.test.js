const path = require('path');
const fs = require('fs');

describe('@babel/compat-data overlapping-plugins', () => {
  const compatDataDir = path.join(__dirname, '..', 'node_modules', '@babel', 'compat-data');
  const dataDir = path.join(compatDataDir, 'data');

  test('can import overlapping-plugins directly from JSON', () => {
    // This test verifies the Babel 8 migration: .js wrapper removed, .json imported directly
    const data = require('@babel/compat-data/overlapping-plugins');
    
    // Verify data structure
    expect(typeof data).toBe('object');
    expect(data).not.toBeNull();
    
    // Verify expected keys exist
    expect(data['transform-async-to-generator']).toBeDefined();
    expect(data['transform-parameters']).toBeDefined();
    expect(data['transform-function-name']).toBeDefined();
    expect(data['transform-block-scoping']).toBeDefined();
    expect(data['transform-destructuring']).toBeDefined();
    
    // Verify values are arrays
    expect(Array.isArray(data['transform-async-to-generator'])).toBe(true);
    expect(Array.isArray(data['transform-parameters'])).toBe(true);
    
    // Verify specific plugin entries
    expect(data['transform-async-to-generator']).toContain('bugfix/transform-async-arrows-in-class');
  });

  test('overlapping-plugins.js wrapper file should not exist', () => {
    // Babel 8: users import .json directly, .js wrapper removed
    const jsWrapperPath = path.join(compatDataDir, 'overlapping-plugins.js');
    expect(fs.existsSync(jsWrapperPath)).toBe(false);
  });

  test('overlapping-plugins.json should exist and be importable', () => {
    const jsonPath = path.join(dataDir, 'overlapping-plugins.json');
    expect(fs.existsSync(jsonPath)).toBe(true);
    const data = require('@babel/compat-data/overlapping-plugins');
    expect(Object.keys(data).length).toBeGreaterThan(0);
  });
});
