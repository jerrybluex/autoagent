// Tests for index.js
const { greet, validateConfig, loadConfig } = require('./index.js');

// Test greet
console.log('Testing greet():', greet('World') === 'Hello, World!' ? 'PASS' : 'FAIL');

// Test validateConfig - valid input
try {
  validateConfig({ key: 'value' });
  console.log('Testing validateConfig(valid):', 'PASS');
} catch (e) {
  console.log('Testing validateConfig(valid):', 'FAIL -', e.message);
}

// Test validateConfig - null input
try {
  validateConfig(null);
  console.log('Testing validateConfig(null):', 'FAIL - should have thrown');
} catch (e) {
  console.log('Testing validateConfig(null):', 'PASS - correctly threw:', e.message);
}

// Test validateConfig - undefined input
try {
  validateConfig(undefined);
  console.log('Testing validateConfig(undefined):', 'FAIL - should have thrown');
} catch (e) {
  console.log('Testing validateConfig(undefined):', 'PASS - correctly threw:', e.message);
}

// Test validateConfig - non-object input
try {
  validateConfig('string');
  console.log('Testing validateConfig(non-object):', 'FAIL - should have thrown');
} catch (e) {
  console.log('Testing validateConfig(non-object):', 'PASS - correctly threw:', e.message);
}

console.log('All tests completed');