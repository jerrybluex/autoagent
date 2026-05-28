const path = require('path');
const fs = require('fs');

describe('@babel/compat-data corejs3-shipped-proposals', () => {
  const compatDataDir = path.join(__dirname, '..', 'node_modules', '@babel', 'compat-data');

  test('corejs3-shipped-proposals.js wrapper file should not exist', () => {
    // Babel 8: corejs3-shipped-proposals removed - functionality moved to babel-plugin-polyfill-corejs3
    const jsWrapperPath = path.join(compatDataDir, 'corejs3-shipped-proposals.js');
    expect(fs.existsSync(jsWrapperPath)).toBe(false);
  });

  test('corejs3-shipped-proposals is not exported', () => {
    // Babel 8: this export was removed
    const pkg = require('@babel/compat-data/package.json');
    expect(pkg.exports && pkg.exports['./corejs3-shipped-proposals']).toBeUndefined();
  });
});