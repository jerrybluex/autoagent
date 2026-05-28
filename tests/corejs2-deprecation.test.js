/**
 * Test: Babel 8 corejs2 deprecation - expect removal of corejs2-built-ins
 *
 * Context: @babel/compat-data contains a TODO in corejs2-built-ins.js:
 * "Todo (Babel 8): remove this file as Babel 8 drop support of core-js 2"
 *
 * This test asserts the expected Babel 8 behavior:
 * 1. @babel/compat-data should NOT export ./corejs2-built-ins
 * 2. The corejs2-built-ins.js file should not exist (or not be exported)
 */

const path = require('path');
const fs = require('fs');

describe('Babel 8 corejs2 deprecation', () => {
  const compatDataDir = path.join(__dirname, '..', 'node_modules', '@babel', 'compat-data');

  it('corejs2-built-ins.js wrapper file should not exist in Babel 8', () => {
    // Babel 8: corejs2-built-ins removed - core-js 2 is no longer supported
    const jsPath = path.join(compatDataDir, 'corejs2-built-ins.js');
    expect(fs.existsSync(jsPath)).toBe(false);
  });

  it('./corejs2-built-ins is not exported from @babel/compat-data', () => {
    // Babel 8: this export was removed
    const pkg = require('@babel/compat-data/package.json');
    expect(pkg.exports && pkg.exports['./corejs2-built-ins']).toBeUndefined();
  });
});
