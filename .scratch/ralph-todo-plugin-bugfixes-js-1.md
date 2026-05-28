---
name: ralph-todo-plugin-bugfixes-js-1
description: Track TODO removal of plugin-bugfixes.js wrapper for Babel 8
metadata:
  type: issue
  priority: low
  status: completed
  created: 2026-05-28
  completed: 2026-05-28
  tags: [babel, compatibility, babel8]
---

# Issue: Remove plugin-bugfixes.js wrapper for Babel 8

## Context
`@babel/compat-data` 包的旧版本导出一个 `plugin-bugfixes.js` 包装文件：
```javascript
// Todo (Babel 8): remove this file, in Babel 8 users import the .json directly
module.exports = require("./data/plugin-bugfixes.json");
```

## Problem
Babel 8 直接导入 `.json` 文件，不需要 `.js` 包装器。

## Solution
- 添加 `overrides` 字段强制所有 `@babel/compat-data` 使用 v8.0.0-rc.6
- 在 package.json 中添加 `@babel/compat-data` 作为 devDependency
- 添加测试验证 `.js` 文件不存在

## Verification
- npm test 通过（6 tests passed）
- 所有 `.js` 包装器文件不存在
- 导出指向 `.json` 文件

## Files Changed
- `package.json` - 添加 @babel/compat-data 和 overrides
- `tests/plugin-bugfixes-babel8.test.js` - 新增测试文件