/**
 * Test: native-modules.js wrapper removal for Babel 8
 *
 * Context: In Babel 8, users import the .json files directly instead of
 * going through .js wrapper files. The TODO comment in native-modules.js
 * stated: "Todo (Babel 8): remove this file, in Babel 8 users import
 * the .json directly"
 *
 * This test verifies that:
 * 1. The .js wrapper files no longer exist in @babel/compat-data
 * 2. The exports in package.json point to .json files directly
 */

const path = require('path');
const fs = require('fs');
const pkg = require('@babel/compat-data/package.json');

describe('@babel/compat-data Babel 8 migration (native-modules)', () => {
  const compatDataDir = path.dirname(require.resolve('@babel/compat-data/package.json'));

  const jsWrappers = [
    'native-modules.js',
    'plugins.js',
    'overlapping-plugins.js',
    'plugin-bugfixes.js'
  ];

  test.each(jsWrappers)('%s wrapper should not exist in Babel 8', (wrapperFile) => {
    const wrapperPath = path.join(compatDataDir, wrapperFile);
    expect(fs.existsSync(wrapperPath)).toBe(false);
  });

  test('native-modules export points to .json directly', () => {
    expect(pkg.exports['./native-modules']).toBe('./data/native-modules.json');
  });

  test('native-modules.json exists and is valid', () => {
    const jsonPath = path.join(compatDataDir, 'data', 'native-modules.json');
    expect(fs.existsSync(jsonPath)).toBe(true);

    const data = require('@babel/compat-data/native-modules');
    expect(data).toBeDefined();
    expect(data['es6.module']).toBeDefined();
  });
});