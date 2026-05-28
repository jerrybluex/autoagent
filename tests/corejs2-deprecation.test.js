/**
 * Test: Babel 8 corejs2 deprecation - migration path verification
 *
 * Context: @babel/compat-data contains a TODO in corejs2-built-ins.js:
 * "Todo (Babel 8): remove this file as Babel 8 drop support of core-js 2"
 *
 * This test verifies the migration path for Babel 8:
 * 1. Babel 7 (current): corejs2-built-ins.js exists and is exported
 * 2. Babel 8 (future): corejs2-built-ins.js should be removed
 *
 * Run with SKIP_BABEL8_CHECK=true to skip version-gated assertions.
 */

const path = require('path');
const fs = require('fs');

const SKIP_BABEL8_CHECK = process.env.SKIP_BABEL8_CHECK === 'true';

describe('Babel corejs2 deprecation migration', () => {
  const compatDataDir = path.join(__dirname, '..', 'node_modules', '@babel', 'compat-data');
  const pkgPath = path.join(compatDataDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  it('should have @babel/compat-data installed', () => {
    expect(fs.existsSync(compatDataDir)).toBe(true);
  });

  it('corejs2-built-ins.js exists in Babel 7 (pre-migration state)', () => {
    const jsPath = path.join(compatDataDir, 'corejs2-built-ins.js');
    // Babel 7: corejs2-built-ins exists as migration path
    const exists = fs.existsSync(jsPath);
    // In Babel 8, this will be false - the TODO says remove it
    // Current state reflects Babel 7.29.7 which still has it
    expect(exists).toBe(true);
  });

  it('./corejs2-built-ins is exported from @babel/compat-data (Babel 7)', () => {
    // Babel 7: this export is present
    // Babel 8: this export should be removed
    expect(pkg.exports && pkg.exports['./corejs2-built-ins']).toBeDefined();
  });

  it('corejs2-built-ins.js contains Babel 8 TODO marker', () => {
    const jsPath = path.join(compatDataDir, 'corejs2-built-ins.js');
    const content = fs.readFileSync(jsPath, 'utf8');
    // Verify the TODO comment exists - this documents the migration
    expect(content).toContain('Babel 8');
    expect(content).toContain('core-js 2');
  });

  (SKIP_BABEL8_CHECK ? it.skip : it)('Babel 8 migration: corejs2-built-ins.js should be removed', () => {
    // This test documents the expected Babel 8 behavior:
    // When @babel/compat-data reaches a major version >= 8.0.0,
    // corejs2-built-ins.js should not exist
    const majorVersion = parseInt(pkg.version.split('.')[0], 10);
    if (majorVersion < 8) {
      // Babel 7: expect file to exist (current state)
      const jsPath = path.join(compatDataDir, 'corejs2-built-ins.js');
      expect(fs.existsSync(jsPath)).toBe(true);
    } else {
      // Babel 8+: expect file to be removed
      const jsPath = path.join(compatDataDir, 'corejs2-built-ins.js');
      expect(fs.existsSync(jsPath)).toBe(false);
    }
  });

  (SKIP_BABEL8_CHECK ? it.skip : it)('Babel 8 migration: ./corejs2-built-ins export should be removed', () => {
    const majorVersion = parseInt(pkg.version.split('.')[0], 10);
    if (majorVersion < 8) {
      // Babel 7: export exists
      expect(pkg.exports && pkg.exports['./corejs2-built-ins']).toBeDefined();
    } else {
      // Babel 8+: export removed
      expect(pkg.exports && pkg.exports['./corejs2-built-ins']).toBeUndefined();
    }
  });
});