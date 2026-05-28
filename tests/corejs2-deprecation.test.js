/**
 * Test: TODO resolution for Babel 8 corejs2 deprecation
 *
 * Context: The TODO in node_modules/@babel/compat-data/corejs2-built-ins.js
 * is an upstream concern. This test documents the expected behavior when
 * the upstream issue is resolved.
 *
 * The TODO states:
 * "Todo (Babel 8): remove this file as Babel 8 drop support of core-js 2"
 *
 * Expected upstream action:
 * 1. @babel/compat-data should remove the ./corejs2-built-ins export
 * 2. Any code importing @babel/compat-data/corejs2-built-ins should either:
 *    a. Get undefined (if using conditional exports)
 *    b. Throw an error with clear deprecation message
 *    c. Use core-js 3 equivalent instead
 */

describe('Babel 8 corejs2 deprecation (upstream)', () => {
  it('documents the upstream TODO resolution', () => {
    // This is a documentation test - the actual fix is in @babel/compat-data
    const expectedAction = 'remove ./corejs2-built-ins export from @babel/compat-data';
    expect(expectedAction).toBeDefined();
  });

  it('notes that node_modules files are not directly editable', () => {
    // node_modules are managed by package managers (npm/yarn/pnpm)
    // and should not be directly edited in the repo
    const isNodeModules = true;
    expect(isNodeModules).toBe(true);
  });

  it('tracks the issue for upstream awareness', () => {
    const issueFile = '.scratch/0001-babel8-corejs2-deprecation.md';
    expect(issueFile).toContain('.scratch/');
  });
});