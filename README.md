# Agent Swarm

> 一句话：你给一句话任务 → AI 自动写代码 → 推送到 GitHub → 创建 PR → 飞书通知你 → 你 Review 合并

[![GitHub](https://img.shields.io/badge/GitHub-jerrybluex%2Fautoagent-blue)](https://github.com/jerrybluex/autoagent)

## 快速开始

```powershell
# 1. 给 AI 派活（一句话描述需求）
& .\scripts\spawn-agent.ps1 `
  -TaskId "feat-add-logger" `
  -Agent "codex" `
  -Prompt "Add a simple logger module with info/warn/error levels and timestamps" `
  -Repo "C:\Users\$env:USERNAME\autoagent"

# 2. 等 2-3 分钟，飞书通知响了

# 3. 去 GitHub 上 Review PR → Merge
```

---

## 核心概念

| 术语 | 含义 |
|------|------|
| **spawn-agent** | 派活命令，启动一个 AI 程序员 |
| **Agent** | AI 程序员，可选 `codex`（快）或 `claude`（稳） |
| **Worktree** | 每个 Agent 独立的工作目录，互不干扰 |
| **Registry** | 任务登记本，记录谁在做什么 |
| **Ralph Loop** | 每30分钟扫描 TODO/错误，主动派活 |
| **Babysitter** | 每10分钟检查 Agent 死活，死了就重启 |

---

## 目录结构

```
autoagent/
├── README.md                 # 本文件
├── index.js                  # 项目入口（示例）
├── package.json              # 项目配置
├── scripts/                  # Agent Swarm 核心脚本
│   ├── spawn-agent.ps1       # 派活：启动 AI 程序员
│   ├── check-agents.ps1      # 监控：每10分钟检查 Agent 状态
│   ├── ralph-loop.ps1        # 主动发现：每30分钟扫描 TODO/错误
│   ├── review-pr.ps1         # PR 三审：AI 自动 Code Review
│   └── notify-feishu.ps1     # 通知：飞书机器人推送
├── docs/                     # 详细文档
│   └── SETUP.md              # 完整配置指南
└── .clawdbot/                # Agent Swarm 运行时（自动生成）
    ├── active-tasks.json     # 任务注册表
    ├── worktrees/            # Agent 独立工作区
    └── logs/                 # 运行日志
```

---

## 手动派活（最常用）

### 基本命令

```powershell
& .\scripts\spawn-agent.ps1 `
  -TaskId "feat-你的任务名" `
  -Agent "codex" `            # codex（快）或 claude（稳）
  -Prompt "具体要做什么..." `
  -Repo "C:\Users\$env:USERNAME\autoagent"
```

### 参数说明

| 参数 | 必填 | 说明 |
|------|------|------|
| `-TaskId` | ✅ | 任务ID，也是分支名 |
| `-Agent` | ✅ | `codex` 或 `claude` |
| `-Prompt` | ✅ | 任务描述，越具体越好 |
| `-Repo` | ✅ | 仓库路径 |

### 例子

#### 加新功能

```powershell
& .\scripts\spawn-agent.ps1 `
  -TaskId "feat-add-logger" `
  -Agent "codex" `
  -Prompt "Add a simple logger module (lib/logger.js) that supports info/warn/error levels with timestamps. Update index.js to use the logger. Add tests in tests/logger.test.js." `
  -Repo "C:\Users\$env:USERNAME\autoagent"
```

#### 修 Bug

```powershell
& .\scripts\spawn-agent.ps1 `
  -TaskId "fix-empty-args-crash" `
  -Agent "claude" `
  -Prompt "Fix a bug where index.js crashes when process.argv has no arguments. Add proper validation and a test case." `
  -Repo "C:\Users\$env:USERNAME\autoagent"
```

#### 写文档

```powershell
& .\scripts\spawn-agent.ps1 `
  -TaskId "docs-api" `
  -Agent "claude" `
  -Prompt "Write API documentation in docs/API.md. Document all exported functions with parameters and usage examples." `
  -Repo "C:\Users\$env:USERNAME\autoagent"
```

---

## 自动发现工作（Ralph Loop）

Ralph Loop 每 **30 分钟**自动扫描仓库，发现待办工作后自动 spawn agent。

### 扫描内容

| 扫描源 | 触发条件 | 配置 |
|--------|----------|------|
| **TODO/FIXME** | 代码里有 `// TODO:` 或 `// FIXME:` | 无需配置 ✅ |
| **Sentry 错误** | 1小时内新错误 | 需 `SENTRY_AUTH_TOKEN` |
| **缺少 README** | 仓库没有 `README.md` | 无需配置 ✅ |
| **Changelog** | 每晚8点自动更新 | 无需配置 ✅ |

### 手动触发

```powershell
$env:AGENT_SWARM_REPO = "C:\Users\$env:USERNAME\autoagent"
& .\scripts\ralph-loop.ps1
```

---

## 查看进度

```powershell
# 查看所有任务
Get-Content .clawdbot\active-tasks.json | ConvertFrom-Json | Format-Table id,agent,status

# 查看 Agent 日志
Get-Content .clawdbot\logs\你的任务ID.log -Tail 50

# 查看 GitHub PR
gh pr list --repo jerrybluex/autoagent --state open
```

---

## PR Review 三审

```powershell
& .\scripts\review-pr.ps1 -PRNumber 4 -Repo "jerrybluex/autoagent"
```

1. **Codex** — 逻辑错误、边界 case、性能隐患
2. **Gemini Code Assist** — 安全/性能（GitHub App，自动评论）
3. **Claude** — 只提 critical 问题

---

## 飞书通知

```powershell
& .\scripts\notify-feishu.ps1 `
  -Title "Agent 任务完成" `
  -Content "PR #4 已就绪，请 Review"
```

---

## 状态流转

```
你说：加个功能 → Agent 开始干活（running）
                    ↓
            Agent 完成 → PR 已创建（ready）
                    ↓
            飞书通知你 → 你 Review → Merge → done
```

Agent 挂了：
```
running → failed（重试3次后停止）
```

---

## Codex vs Claude

| | Codex | Claude |
|--|-------|--------|
| **速度** | 快（2-3分钟） | 慢（5-10分钟） |
| **适合** | 小功能、快速迭代 | 复杂逻辑、架构设计 |
| **网络** | OpenAI（chatgpt.com） | Anthropic（api.anthropic.com） |

**建议**：小功能用 codex，复杂任务用 claude。

---

## 常见问题

### Agent 会改我的主分支吗？

不会。Agent 从 `origin/main` 切出新分支，只在分支上工作。

### 多个 Agent 会冲突吗？

不会。每个 Agent 有独立的 worktree：
```
worktrees/
├── feat-add-logger/       ← Agent A
├── feat-add-config-file/  ← Agent B
└── feat-ui-button/        ← Agent C
```

### 失败了怎么办？

```powershell
# 查看日志找原因
Get-Content .clawdbot\logs\失败的任务ID.log -Tail 30

# 重新派活（换个 TaskId）
& .\scripts\spawn-agent.ps1 -TaskId "feat-xxx-v2" -Agent "codex" -Prompt "..." -Repo "..."
```

---

## 详细配置

完整配置指南见 [docs/SETUP.md](docs/SETUP.md)，包含：

- 前置依赖安装
- 目录结构创建
- 5 个核心脚本源码
- OpenClaw Cron 配置
- 环境变量设置
- GitHub / 飞书配置
- 一键安装脚本
- 故障排查

---

## 核心脚本

| 脚本 | 用途 | 频率 |
|------|------|------|
| `spawn-agent.ps1` | 生成 worktree + spawn AI agent | 手动触发 |
| `check-agents.ps1` | 检查 Agent 状态 + 自动重试 | 每10分钟（Cron） |
| `ralph-loop.ps1` | 扫描 TODO/错误 + 自动派活 | 每30分钟（Cron） |
| `review-pr.ps1` | AI 三审 Code Review | 手动触发 |
| `notify-feishu.ps1` | 飞书机器人通知 | 手动/自动触发 |

---

*最后更新：2026-05-24*