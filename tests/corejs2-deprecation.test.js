/**
 * Test: corejs2-built-ins removal for Babel 8
 *
 * Context: In Babel 8, core-js 2 support is dropped. The `corejs2-built-ins`
 * entry point should be removed from @babel/compat-data exports.
 *
 * This test verifies that:
 * 1. The ./corejs2-built-ins export does not exist in package.json
 * 2. The corejs2-built-ins.js file does not exist
 */

const path = require('path');
const fs = require('fs');

describe('@babel/compat-data Babel 8 migration (corejs2-built-ins)', () => {
  const compatDataDir = path.dirname(require.resolve('@babel/compat-data/package.json'));

  test('./corejs2-built-ins export should not exist in Babel 8', () => {
    const pkg = require('@babel/compat-data/package.json');
    expect(pkg.exports['./corejs2-built-ins']).toBeUndefined();
  });

  test('corejs2-built-ins.js file should not exist', () => {
    const jsPath = path.join(compatDataDir, 'corejs2-built-ins.js');
    expect(fs.existsSync(jsPath)).toBe(false);
  });

  test('corejs2-built-ins.json data file should not exist', () => {
    const jsonPath = path.join(compatDataDir, 'data', 'corejs2-built-ins.json');
    expect(fs.existsSync(jsonPath)).toBe(false);
  });
});