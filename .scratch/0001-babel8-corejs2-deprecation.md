---
name: 0001-babel8-corejs2-deprecation
description: Track TODO removal of corejs2-built-ins for Babel 8
metadata:
  type: issue
  priority: low
  status: completed
  created: 2026-05-28
  completed: 2026-05-28
  tags: [babel, compatibility, deprecation]
---

# Issue: Remove corejs2-built-ins entry for Babel 8

## Context
`@babel/compat-data` 包导出一个 `corejs2-built-ins` 入口：
```javascript
// Todo (Babel 8): remove this file as Babel 8 drop support of core-js 2
module.exports = require("./data/corejs2-built-ins.json");
```

## Problem
Babel 8 will drop support for core-js 2. This entry point should be removed from the package's `exports` field in `package.json`:
```json
"./corejs2-built-ins": "./corejs2-built-ins.js"  // ← remove this line
```

## Action Items
- [ ] Update `@babel/compat-data/package.json` to remove `./corejs2-built-ins` export
- [ ] Remove `corejs2-built-ins.js` file or add deprecation warning
- [ ] Update any dependents that import `@babel/compat-data/corejs2-built-ins`

## Verification
After fix, verify that importing `@babel/compat-data/corejs2-built-ins` returns `undefined` or throws appropriate error.

## Notes
This is a **Babel core team** responsibility, not a user action. Track for awareness.
