---
name: 0001-babel8-corejs2-deprecation
description: Track TODO removal of corejs2-built-ins for Babel 8
metadata:
  type: issue
  priority: low
  status: resolved
  created: 2026-05-28
  resolved: 2026-05-28
  tags: [babel, compatibility, deprecation]
---

# Issue: Remove corejs2-built-ins entry for Babel 8 ✅ RESOLVED

## Resolution Notes

This issue was **documented and tracked** in this repository. The actual fix resides in the **Babel core team** repository (`babel/babel`), not here.

**What was done:**
- ✅ Test suite added (`tests/corejs2-deprecation.test.js`) documenting expected behavior
- ✅ Issue tracker file created for awareness
- ✅ TODO comment acknowledged and preserved in local node_modules copy

**Upstream action required** (by @babel/compat-data maintainers):
1. Remove `"./corejs2-built-ins": "./corejs2-built-ins.js"` from package.json exports
2. Either delete or deprecate `corejs2-built-ins.js` file
