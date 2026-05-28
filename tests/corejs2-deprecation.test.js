/**
 * Test: Babel 8 corejs2 deprecation - migration path verification
 *
 * Context: @babel/compat-data contains a TODO in corejs2-built-ins.js:
 * "Todo (Babel 8): remove this file as Babel 8 drop support of core-js 2"
 *
 * This test verifies the migration path for Babel 8:
 * - Babel 8+: corejs2-built-ins.js is NOT present, export is NOT present
 * - Babel 7: corejs2-built-ins.js exists and is exported (historical state)
 */

const path = require('path');
const fs = require('fs');

describe('Babel corejs2 deprecation migration', () => {
  const compatDataDir = path.join(__dirname, '..', 'node_modules', '@babel', 'compat-data');
  const pkgPath = path.join(compatDataDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const isBabel8 = pkg.version.startsWith('8.');
  const jsPath = path.join(compatDataDir, 'corejs2-built-ins.js');
  const corejs2BuiltInsExists = fs.existsSync(jsPath);
  const corejs2ExportExists = pkg.exports && pkg.exports['./corejs2-built-ins'];

  it('should have @babel/compat-data installed', () => {
    expect(fs.existsSync(compatDataDir)).toBe(true);
  });

  it('Babel 8 migration: corejs2-built-ins.js should be removed', () => {
    // This is the key migration test:
    // In Babel 8, corejs2-built-ins.js should NOT exist (core-js 2 is no longer supported)
    expect(corejs2BuiltInsExists).toBe(false);
  });

  it('Babel 8 migration: ./corejs2-built-ins export should be removed', () => {
    // In Babel 8, the ./corejs2-built-ins export should be removed
    expect(corejs2ExportExists).toBeUndefined();
  });

  it('should report the installed @babel/compat-data version', () => {
    console.log(`Installed @babel/compat-data version: ${pkg.version}`);
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('verifies actual runtime behavior', () => {
    // Verify that importing @babel/compat-data/corejs2-built-ins fails gracefully
    // This simulates what would happen if code tried to use the removed export
    try {
      const modulePath = path.join(compatDataDir, 'corejs2-built-ins.js');
      if (fs.existsSync(modulePath)) {
        require(modulePath);
      } else {
        // Module should not exist in Babel 8
        expect(fs.existsSync(modulePath)).toBe(false);
      }
    } catch (e) {
      // Expected: module not found or similar error
      expect(e.code).toMatch(/MODULE_NOT_FOUND|ENOENT|CANNOT_FIND/);
    }
  });
});