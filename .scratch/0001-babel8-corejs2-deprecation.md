---
name: 0001-babel8-corejs2-deprecation
description: Track TODO removal of corejs2-built-ins for Babel 8
metadata:
  type: issue
  priority: low
  status: resolved
  created: 2026-05-28
  resolved: 2026-05-28
  resolution: Upstream handled - @babel/compat-data v8.0.0-rc.6 already removed corejs2-built-ins
  tags: [babel, compatibility, deprecation]
---

# Issue: Remove corejs2-built-ins entry for Babel 8

## Status: RESOLVED ✅

This issue is **upstream** - handled by the Babel team in `@babel/compat-data` v8.0.0-rc.6.

## Verification

```bash
# File does not exist
ls node_modules/@babel/compat-data/corejs2-built-ins.js  # → No such file

# Export not in package.json
grep corejs2-built-ins node_modules/@babel/compat-data/package.json  # → No match

# Test passes (Babel 8 behavior confirmed)
npm test  # → PASS corejs2-deprecation.test.js
```

## Context
`@babel/compat-data` v8.0.0-rc.6 does NOT export `corejs2-built-ins`:
- The `corejs2-built-ins.js` file was removed
- The `./corejs2-built-ins` export was removed from `package.json`

This is correct Babel 8 behavior - core-js 2 support is dropped.

## Action Items
- [x] Update `@babel/compat-data/package.json` to remove `./corejs2-built-ins` export — **Done by upstream**
- [x] Remove `corejs2-built-ins.js` file — **Done by upstream**
- [x] Update any dependents that import `@babel/compat-data/corejs2-built-ins` — **N/A (no dependents in this repo)**

## Notes
This is a **Babel core team** responsibility, not a user action. Tracked for awareness only.
