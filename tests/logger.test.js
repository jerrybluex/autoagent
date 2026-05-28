const test = require("node:test");
const assert = require("node:assert/strict");

const logger = require("../lib/logger");

function withMockedConsole(method, fn) {
  const original = console[method];
  const calls = [];

  console[method] = (...args) => {
    calls.push(args);
  };

  try {
    fn(calls);
  } finally {
    console[method] = original;
  }
}

test("info logs a timestamped message with INFO level", () => {
  withMockedConsole("info", (calls) => {
    const entry = logger.info("hello");
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], entry);
    assert.match(entry, /^\[\d{4}-\d{2}-\d{2}T.*Z\] \[INFO\] hello$/);
  });
});

test("warn logs a timestamped message with WARN level", () => {
  withMockedConsole("warn", (calls) => {
    const entry = logger.warn("careful");
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], entry);
    assert.match(entry, /^\[\d{4}-\d{2}-\d{2}T.*Z\] \[WARN\] careful$/);
  });
});

test("error logs a timestamped message with ERROR level", () => {
  withMockedConsole("error", (calls) => {
    const entry = logger.error("boom");
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], entry);
    assert.match(entry, /^\[\d{4}-\d{2}-\d{2}T.*Z\] \[ERROR\] boom$/);
  });
});
