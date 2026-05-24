# Agent Swarm 完整配置指南

> 本文档包含从零开始搭建 Agent Swarm 的全部配置，可直接用于在新电脑上复刻整套环境。

---

## 目录

1. [前置依赖](#一前置依赖)
2. [目录结构](#二目录结构)
3. [核心脚本（5个）](#三核心脚本5个)
4. [OpenClaw Cron 配置](#四openclaw-cron-配置)
5. [环境变量](#五环境变量)
6. [GitHub 配置](#六github-配置)
7. [飞书 Webhook 配置](#七飞书-webhook-配置)
8. [OpenClaw 网关配置](#八openclaw-网关配置)
9. [Registry 格式说明](#九registry-格式说明)
10. [一键安装脚本](#十一键安装脚本)
11. [验证步骤](#十一验证步骤)
12. [故障排查](#十二故障排查)

---

## 一、前置依赖

### 1.1 必需软件

| 软件 | 版本 | 安装命令/方式 | 验证 |
|------|------|---------------|------|
| **Git** | >= 2.30 | [git-scm.com](https://git-scm.com/) | `git --version` |
| **GitHub CLI (gh)** | >= 2.0 | `winget install GitHub.cli` | `gh --version` |
| **Node.js** | >= 18 | [nodejs.org](https://nodejs.org/) | `node --version` |
| **npm** | >= 9 | 随 Node.js 安装 | `npm --version` |
| **Codex CLI** | >= 0.130 | `npm install -g @openai/codex` | `codex --version` |
| **Claude Code** | >= 2.1 | `npm install -g @anthropic-ai/claude-code` | `claude --version` |
| **OpenClaw** | >= 2026.5 | [openclaw.io](https://openclaw.io) | `openclaw --version` |
| **PowerShell** | >= 5.1 | Windows 自带 | `$PSVersionTable.PSVersion` |

### 1.2 网络要求

- GitHub 可访问（`git clone` 和 `gh` 命令正常）
- OpenAI API 可访问（Codex 需要连接 `chatgpt.com`）
- Anthropic API 可访问（Claude Code 需要连接 `api.anthropic.com`）

> 如有代理，需配置 `HTTP_PROXY` / `HTTPS_PROXY` 环境变量。

---

## 二、目录结构

```
C:\Users\{用户名}\
├── .clawdbot\                          # Agent Swarm 主目录
│   ├── active-tasks.json               # 任务注册表（自动生成）
│   ├── AGENT_SWARM_SETUP.md            # 配置说明
│   ├── HOW_IT_WORKS.md                 # 工作流程说明
│   ├── EXAMPLES.md                     # 具体例子
│   ├── scripts\                        # 核心脚本目录
│   │   ├── spawn-agent.ps1            # 派活脚本
│   │   ├── check-agents.ps1           # 监控脚本（每10分钟）
│   │   ├── ralph-loop.ps1             # 主动发现（每30分钟）
│   │   ├── review-pr.ps1              # PR 三审
│   │   └── notify-feishu.ps1          # 飞书通知
│   ├── worktrees\                      # Agent 独立工作区（自动生成）
│   │   └── feat-xxx/                   # 每个任务的独立目录
│   └── logs\                           # 运行日志（自动生成）
│       └── feat-xxx.log                # 每个任务的日志
│
├── .openclaw\                          # OpenClaw 配置
│   └── openclaw.json                   # 网关配置文件
│
├── autoagent\                          # 你的代码仓库（示例）
│   ├── .git/
│   ├── index.js
│   ├── package.json
│   └── README.md
│
├── .codex\                             # Codex CLI 配置（自动创建）
│   └── .codex-global-state.json
│
└── .claude\                            # Claude Code 配置（自动创建）
    ├── sessions/
    └── config.json
```

### 2.1 创建主目录

```powershell
# 创建 .clawdbot 目录结构
$BaseDir = "$env:USERPROFILE\.clawdbot"
New-Item -ItemType Directory -Force -Path "$BaseDir\scripts" | Out-Null
New-Item -ItemType Directory -Force -Path "$BaseDir\worktrees" | Out-Null
New-Item -ItemType Directory -Force -Path "$BaseDir\logs" | Out-Null

# 创建空的任务注册表
"[]" | Set-Content "$BaseDir\active-tasks.json"

Write-Host "Directory structure created at $BaseDir"
```

---

## 三、核心脚本（5个）

将以下脚本保存到 `C:\Users\{用户名}\.clawdbot\scripts\` 目录。

### 3.1 spawn-agent.ps1（派活脚本）

```powershell
<#
  .SYNOPSIS
  生成独立 worktree 并 spawn Claude Code / Codex agent
#>
param(
    [Parameter(Mandatory)] [string] $TaskId,
    [Parameter(Mandatory)] [ValidateSet("claude","codex")] [string] $Agent,
    [Parameter(Mandatory)] [string] $Prompt,
    [Parameter(Mandatory)] [string] $Repo,
    [string] $Model,
    [switch] $Resume
)

$ErrorActionPreference = "Stop"
$RegistryPath = "$env:USERPROFILE\.clawdbot\active-tasks.json"
$WorktreeBase = "$env:USERPROFILE\.clawdbot\worktrees"

$branch = $TaskId -replace "_","-"
$wtPath = Join-Path $WorktreeBase $TaskId

if (-not $Resume) {
    if (Test-Path $wtPath) { Remove-Item -Recurse -Force $wtPath }
    New-Item -ItemType Directory -Force -Path $wtPath | Out-Null

    Push-Location $Repo
    $oldEA = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    git fetch origin main 2>&1 | Out-Null
    git worktree add $wtPath -b $branch origin/main 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        git worktree add $wtPath $branch 2>&1 | Out-Null
    }
    $ErrorActionPreference = $oldEA
    Pop-Location

    $pkgJson = Join-Path $wtPath "package.json"
    if (Test-Path $pkgJson) {
        Push-Location $wtPath
        try { pnpm install 2>$null } catch { npm install 2>$null }
        Pop-Location
    }
}

$header = "Context: Repo=$Repo Branch=$branch Worktree=$wtPath`n`n" +
          "TASK (implement this first, do not explain DoD to me):`n" + $Prompt + "`n`n" +
          "Definition of Done:`n" +
          "- PR created with gh pr create --fill`n" +
          "- Branch synced to main (no merge conflicts)`n" +
          "- CI passing (lint, types, unit tests)`n" +
          "- Include screenshots if UI changed`n" +
          "- Do NOT merge; stop and wait for human review`n"
$fullPrompt = $header

$promptFile = Join-Path $wtPath ".agent-prompt.md"
Set-Content -Path $promptFile -Value $fullPrompt

$sessionName = "agent-$TaskId"
$logFile = "$env:USERPROFILE\.clawdbot\logs\$TaskId.log"
$logDir = Split-Path $logFile
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Force -Path $logDir | Out-Null }

if ($Agent -eq "codex") {
    $m = if ($Model) { $Model } else { "gpt-5.3-codex" }
    $cmd = "codex exec -m $m -c `"model_reasoning_effort=high`" --dangerously-bypass-approvals-and-sandbox < .agent-prompt.md"
} else {
    $m = if ($Model) { $Model } else { "claude-opus-4.5" }
    $cmd = "claude --model $m --dangerously-skip-permissions -p `"$fullPrompt`""
}

# 写 bat 文件
$safeTaskId = $TaskId -replace '[/\\:<">|?*]','-'
$batFile = Join-Path $env:TEMP "agent-$safeTaskId.bat"
Set-Content -Path $batFile -Value "@echo off`ncd /d `"$wtPath`"`n$cmd > `"$logFile`" 2>&1"

# 用 Start-Process 后台运行
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "cmd.exe"
$psi.Arguments = "/c `"$batFile`""
$psi.WorkingDirectory = $wtPath
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $true
$proc = [System.Diagnostics.Process]::Start($psi)
$sessionName = $proc.Id

$tasks = @()
if (Test-Path $RegistryPath) {
    $raw = Get-Content $RegistryPath | ConvertFrom-Json
    if ($raw) {
        if ($raw -is [System.Array]) { $tasks = $raw } else { $tasks = @($raw) }
    }
}

$existing = $tasks | Where-Object { $_.id -eq $TaskId }
if ($existing) {
    $existing.status = "running"
    $existing.startedAt = (Get-Date -Format "o")
    $existing.retries = 0
} else {
    $newTask = New-Object PSObject -Property @{
        id = $TaskId
        tmuxSession = $sessionName
        agent = $Agent
        description = ($Prompt -split "`n")[0]
        repo = $Repo
        worktree = $wtPath
        branch = $branch
        startedAt = (Get-Date -Format "o")
        status = "running"
        notifyOnComplete = $true
        retries = 0
        lastCheck = (Get-Date -Format "o")
    }
    $tasks += $newTask
}
$tasks | ConvertTo-Json -Depth 10 | Set-Content $RegistryPath

Write-Host "Agent spawned: $sessionName"
Write-Host "Worktree: $wtPath"
Write-Host "Log: $logFile"
Write-Host "Registry: $RegistryPath"
```

### 3.2 check-agents.ps1（监控脚本）

```powershell
<#
  .SYNOPSIS
  Agent Swarm monitor script - Ralph Loop V2 check layer
  Runs every 10 minutes, checks all active agent status and auto-recovers
#>
$ErrorActionPreference = "Stop"

$RegistryPath = "$env:USERPROFILE\.clawdbot\active-tasks.json"
$LogPath      = "$env:USERPROFILE\.clawdbot\logs\check-agents.log"
$MaxRetries   = 3

function Write-Log($msg) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$ts] $msg"
    Add-Content -Path $LogPath -Value $line -ErrorAction SilentlyContinue
    Write-Host $line
}

function Send-Feishu($title, $content) {
    $hook = $env:FEISHU_WEBHOOK
    if (-not $hook) { $hook = "https://open.feishu.cn/open-apis/bot/v2/hook/78240b0b-0478-4aa0-9f6d-a49a123c4614" }
    if (-not $hook) { return }
    $body = @{
        msg_type = "text"
        content = @{ text = $content }
    } | ConvertTo-Json -Compress
    try { Invoke-RestMethod -Uri $hook -Method POST -Body $body -ContentType "application/json" | Out-Null } catch {}
}

function Test-AgentAlive($pidOrName) {
    if ($pidOrName -match '^\d+$') {
        try { Get-Process -Id $pidOrName -ErrorAction Stop | Out-Null; return $true } catch { return $false }
    }
    return $false
}

function Test-CIPassing($branch, $repo) {
    try {
        $runs = gh run list --branch $branch --repo $repo --json conclusion,status -L 1 | ConvertFrom-Json
        if (-not $runs) { return $false }
        return ($runs[0].status -eq "completed" -and $runs[0].conclusion -eq "success")
    } catch { return $false }
}

function Test-PRReady($branch, $repo) {
    try {
        $pr = gh pr view $branch --repo $repo --json state,number 2>$null | ConvertFrom-Json
        return ($pr.state -eq "OPEN")
    } catch { return $false }
}

# --- main ---
New-Item -ItemType Directory -Force -Path (Split-Path $LogPath) | Out-Null
if (-not (Test-Path $RegistryPath)) {
    Write-Log "Registry not found. Exiting."
    exit 0
}

$tasks = Get-Content $RegistryPath | ConvertFrom-Json
$updated = @()
$alerts  = @()

foreach ($t in $tasks) {
    $alive = Test-AgentAlive $t.tmuxSession
    $repoName = if ($t.repo -match "[^\\]+$") { $matches[0] } else { "jerrybluex/autoagent" }
    $ci    = Test-CIPassing $t.branch $repoName
    $pr    = Test-PRReady $t.branch $repoName

    $retries = 0
    if ($t.retries) { $retries = $t.retries }

    switch ($t.status) {
        "running" {
            if (-not $alive) {
                $retries = $retries + 1
                $t.retries = $retries
                if ($retries -ge $MaxRetries) {
                    $t.status = "failed"
                    $alerts += "Agent $($t.id) failed after $MaxRetries retries"
                } else {
                    Write-Log "Respawning agent $($t.id) (retry $retries)"
                    & "$PSScriptRoot\spawn-agent.ps1" -TaskId $t.id -Agent $t.agent -Prompt $t.description -Repo $t.repo -Resume
                }
            } elseif ($pr -and $ci) {
                $t.status = "ready"
                $alerts += "PR for $($t.id) ready for review: $($t.description)"
            }
        }
        "ready" {
            # waiting for manual merge, no auto action
        }
        "failed" {
            # manual intervention required before cleanup
        }
    }

    $t.lastCheck = (Get-Date -Format "o")
    $updated += $t
}

$updated | ConvertTo-Json -Depth 10 | Set-Content $RegistryPath

foreach ($a in $alerts) {
    Send-Feishu "Agent Swarm Alert" $a
}

Write-Log "Check complete. $($tasks.Count) tasks scanned, $($alerts.Count) alerts."
```

### 3.3 ralph-loop.ps1（主动发现）

```powershell
<#
  .SYNOPSIS
  Ralph Loop V2 - 主动发现工作并 spawn agent
  建议每 30 分钟运行一次
#>
$ErrorActionPreference = "Stop"

$RepoPath = $env:AGENT_SWARM_REPO
if (-not $RepoPath) {
    $RepoPath = "C:\Users\$env:USERNAME\autoagent"
}

if (-not (Test-Path $RepoPath)) {
    Write-Error "Repo not found: $RepoPath"
    exit 1
}

$Spawned = 0

# --- 1. 扫描 Sentry 新错误 ---
if ($env:SENTRY_AUTH_TOKEN -and $env:SENTRY_ORG -and $env:SENTRY_PROJECT) {
    try {
        $sentryUrl = "https://sentry.io/api/0/projects/$env:SENTRY_ORG/$env:SENTRY_PROJECT/issues/?statsPeriod=1h"
        $issues = Invoke-RestMethod -Uri $sentryUrl -Headers @{ Authorization = "Bearer $env:SENTRY_AUTH_TOKEN" } -ErrorAction SilentlyContinue
        foreach ($issue in $issues | Select-Object -First 3) {
            $taskId = "bugfix-$($issue.shortId)"
            $prompt = "Fix Sentry issue: $($issue.title)`n`nCulprit: $($issue.culprit)`n`nSee: $($issue.permalink)"
            Write-Host "[Ralph] Spawning bugfix agent for Sentry issue: $($issue.shortId)"
            & "$PSScriptRoot\spawn-agent.ps1" -TaskId $taskId -Agent "codex" -Prompt $prompt -Repo $RepoPath
            $Spawned = $Spawned + 1
        }
    } catch {
        Write-Host "[Ralph] Sentry scan failed: $_"
    }
} else {
    Write-Host "[Ralph] Sentry not configured"
}

# --- 2. 扫描 TODO/FIXME ---
Write-Host "[Ralph] Scanning for TODO/FIXME in $RepoPath..."

$todoMatches = Get-ChildItem -Path $RepoPath -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object {
        $ext = $_.Extension
        $ext -in @('.ts','.tsx','.js','.jsx','.py','.java','.go','.rs','.md')
    } |
    Select-String -Pattern "TODO|FIXME" -ErrorAction SilentlyContinue |
    Select-Object -First 5

$seen = @{}
foreach ($match in $todoMatches) {
    $file = $match.Path
    $line = $match.LineNumber
    $text = $match.Line.Trim()

    $key = "$file`:$line"
    if ($seen.ContainsKey($key)) { continue }
    $seen[$key] = $true

    $safeFile = (Split-Path $file -Leaf) -replace "[^a-zA-Z0-9]","-"
    $taskId = "ralph-todo-$safeFile-$line"

    $prompt = "Resolve TODO/FIXME in file '$file' line $line`: $text`n`nPlease implement the fix and add appropriate tests."
    Write-Host "[Ralph] Found TODO: $file`:$line - spawning agent"
    & "$PSScriptRoot\spawn-agent.ps1" -TaskId $taskId -Agent "claude" -Prompt $prompt -Repo $RepoPath
    $Spawned = $Spawned + 1
}

# --- 3. 扫描 README 缺失 ---
$readmePath = Join-Path $RepoPath "README.md"
if (-not (Test-Path $readmePath)) {
    $taskId = "ralph-readme-$(Get-Date -Format yyyyMMdd)"
    $prompt = "Create a README.md for this project. Include: project description, installation, usage, and basic API docs."
    Write-Host "[Ralph] No README found - spawning agent"
    & "$PSScriptRoot\spawn-agent.ps1" -TaskId $taskId -Agent "claude" -Prompt $prompt -Repo $RepoPath
    $Spawned = $Spawned + 1
}

# --- 4. 更新 changelog（每晚8点） ---
$hour = (Get-Date).Hour
if ($hour -eq 20) {
    $taskId = "ralph-changelog-$(Get-Date -Format yyyyMMdd)"
    $prompt = "Update CHANGELOG.md based on today's git log. Summarize user-facing changes."
    Write-Host "[Ralph] Evening changelog update - spawning agent"
    & "$PSScriptRoot\spawn-agent.ps1" -TaskId $taskId -Agent "claude" -Prompt $prompt -Repo $RepoPath
    $Spawned = $Spawned + 1
}

Write-Host "[Ralph] Scan complete at $(Get-Date). Spawned $Spawned agent(s)."
```

### 3.4 review-pr.ps1（PR 三审）

```powershell
<#
  .SYNOPSIS
  自动化三审 Code Review
  1. Codex Reviewer - 逻辑/边界 case
  2. Gemini Code Assist - 已在 GitHub 自动评论（GitHub App）
  3. Claude Code Reviewer - 复核（只标记 critical）
#>
param(
    [Parameter(Mandatory)] [int] $PRNumber,
    [Parameter(Mandatory)] [string] $Repo
)

$ErrorActionPreference = "Stop"

$diff = gh pr diff $PRNumber --repo $Repo
if (-not $diff) {
    Write-Error "Failed to get diff for PR #$PRNumber"
    exit 1
}

# 保存 diff 到临时文件
$diffFile = Join-Path $env:TEMP "pr-$PRNumber-diff.txt"
Set-Content -Path $diffFile -Value $diff

# --- Reviewer 1: Codex ---
$codexPromptFile = Join-Path $env:TEMP "pr-$PRNumber-codex-prompt.txt"
@"
你是一位严格的代码审查员。审查以下 PR diff，重点关注：
1. 逻辑错误、边界 case、竞态条件
2. 错误处理是否完善
3. 性能隐患
4. 测试覆盖

请输出结构化的 review 评论，每条必须标注严重程度：
- [CRITICAL] - 必须修复，阻塞合并
- [WARNING] - 建议修复
- [NIT] - 可忽略的小问题

DIFF:
"@ | Set-Content -Path $codexPromptFile
Add-Content -Path $codexPromptFile -Value (Get-Content $diffFile -Raw)

$codexReviewFile = Join-Path $env:TEMP "pr-$PRNumber-codex-review.txt"
try {
    codex exec -m gpt-5.3-codex --dangerously-bypass-approvals-and-sandbox -p (Get-Content $codexPromptFile -Raw) > $codexReviewFile 2>$null
} catch {
    Write-Host "Codex review skipped: $_"
    "Codex review unavailable" | Set-Content $codexReviewFile
}

# --- Reviewer 2: Claude ---
$claudePromptFile = Join-Path $env:TEMP "pr-$PRNumber-claude-prompt.txt"
$codexReview = Get-Content $codexReviewFile -Raw
@"
你是一位保守的代码审查员。基于以下 review，只输出你认为真正 critical 的问题。
如果没有什么 critical 的，回复 "LGTM" 即可。

Review:
$codexReview
"@ | Set-Content -Path $claudePromptFile

$claudeReviewFile = Join-Path $env:TEMP "pr-$PRNumber-claude-review.txt"
try {
    claude --dangerously-skip-permissions -p (Get-Content $claudePromptFile -Raw) > $claudeReviewFile 2>$null
} catch {
    Write-Host "Claude review skipped: $_"
    "LGTM" | Set-Content $claudeReviewFile
}

# 合并 review 并评论到 PR
$combined = @"
## AI Code Review (Auto-generated)

### Codex Reviewer (Logic & Edge Cases)
$(Get-Content $codexReviewFile -Raw)

### Claude Reviewer (Critical Only)
$(Get-Content $claudeReviewFile -Raw)

---
*Generated by Agent Swarm Review Pipeline*
"@

$commentFile = Join-Path $env:TEMP "pr-$PRNumber-comment.txt"
Set-Content -Path $commentFile -Value $combined
gh pr comment $PRNumber --repo $Repo --body-file $commentFile
Remove-Item $commentFile -ErrorAction SilentlyContinue

Write-Host "Review posted to PR #$PRNumber"
```

### 3.5 notify-feishu.ps1（飞书通知）

```powershell
<#
  .SYNOPSIS
  飞书机器人通知封装
#>
param(
    [Parameter(Mandatory)] [string] $Title,
    [Parameter(Mandatory)] [string] $Content,
    [string] $Webhook = $env:FEISHU_WEBHOOK
)

$DefaultWebhook = "https://open.feishu.cn/open-apis/bot/v2/hook/78240b0b-0478-4aa0-9f6d-a49a123c4614"
if (-not $Webhook) {
    $Webhook = $DefaultWebhook
}

$body = @{
    msg_type = "text"
    content = @{ text = "$Title`n`n$Content" }
} | ConvertTo-Json -Compress

Invoke-RestMethod -Uri $Webhook -Method POST -Body $body -ContentType "application/json"
```

---

## 四、OpenClaw Cron 配置

在 OpenClaw 网关配置中添加两个 Cron Job：

### 4.1 Agent Babysitter（每10分钟）

```json
{
  "name": "agent-babysitter",
  "enabled": true,
  "schedule": {
    "kind": "every",
    "everyMs": 600000
  },
  "sessionTarget": "isolated",
  "wakeMode": "now",
  "payload": {
    "kind": "agentTurn",
    "message": "Run: powershell -NoProfile -ExecutionPolicy Bypass -File C:\\Users\\{USERNAME}\\.clawdbot\\scripts\\check-agents.ps1",
    "timeoutSeconds": 120
  },
  "delivery": {
    "mode": "none"
  }
}
```

### 4.2 Ralph Loop V2（每30分钟）

```json
{
  "name": "ralph-loop-v2",
  "enabled": true,
  "schedule": {
    "kind": "every",
    "everyMs": 1800000
  },
  "sessionTarget": "current",
  "wakeMode": "now",
  "payload": {
    "kind": "agentTurn",
    "message": "Run: powershell -NoProfile -ExecutionPolicy Bypass -File C:\\Users\\{USERNAME}\\.clawdbot\\scripts\\ralph-loop.ps1",
    "timeoutSeconds": 600
  },
  "delivery": {
    "mode": "none"
  }
}
```

### 4.3 添加 Cron Job 的命令

```powershell
# Babysitter
openclaw cron add --name "agent-babysitter" --every 600000 `
  --message 'Run: powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\{USERNAME}\.clawdbot\scripts\check-agents.ps1' `
  --timeout 120 --target isolated

# Ralph Loop
openclaw cron add --name "ralph-loop-v2" --every 1800000 `
  --message 'Run: powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\{USERNAME}\.clawdbot\scripts\ralph-loop.ps1' `
  --timeout 600 --target current
```

---

## 五、环境变量

### 5.1 必需环境变量

| 变量名 | 值 | 用途 |
|--------|-----|------|
| `AGENT_SWARM_REPO` | `C:\Users\{USERNAME}\autoagent` | Ralph Loop 默认扫描的仓库 |
| `FEISHU_WEBHOOK` | `https://open.feishu.cn/open-apis/bot/v2/hook/...` | 飞书机器人 Webhook |

### 5.2 可选环境变量（Sentry 集成）

| 变量名 | 值 | 用途 |
|--------|-----|------|
| `SENTRY_AUTH_TOKEN` | `your-sentry-token` | Sentry API 认证 |
| `SENTRY_ORG` | `your-org` | Sentry 组织名 |
| `SENTRY_PROJECT` | `your-project` | Sentry 项目名 |

### 5.3 代理环境变量（如需要）

| 变量名 | 值 | 用途 |
|--------|-----|------|
| `HTTP_PROXY` | `http://127.0.0.1:7890` | HTTP 代理 |
| `HTTPS_PROXY` | `http://127.0.0.1:7890` | HTTPS 代理 |

### 5.4 设置环境变量（PowerShell）

```powershell
# 永久设置（系统级别，需要管理员权限）
[Environment]::SetEnvironmentVariable("AGENT_SWARM_REPO", "C:\Users\$env:USERNAME\autoagent", "User")
[Environment]::SetEnvironmentVariable("FEISHU_WEBHOOK", "https://open.feishu.cn/open-apis/bot/v2/hook/78240b0b-0478-4aa0-9f6d-a49a123c4614", "User")

# 当前会话临时设置
$env:AGENT_SWARM_REPO = "C:\Users\$env:USERNAME\autoagent"
$env:FEISHU_WEBHOOK = "https://open.feishu.cn/open-apis/bot/v2/hook/78240b0b-0478-4aa0-9f6d-a49a123c4614"
```

---

## 六、GitHub 配置

### 6.1 登录 GitHub CLI

```powershell
gh auth login
# 选择：GitHub.com -> HTTPS -> 浏览器登录 -> 授权
```

### 6.2 验证登录

```powershell
gh auth status
# 应显示：Logged in to github.com account {你的用户名}
```

### 6.3 创建测试仓库（可选）

```powershell
# 创建新仓库
gh repo create autoagent --public --description "Agent Swarm test repo" --clone

# 或克隆已有仓库
git clone https://github.com/{你的用户名}/autoagent.git C:\Users\{USERNAME}\autoagent
```

### 6.4 仓库初始化

```powershell
cd C:\Users\{USERNAME}\autoagent

# 基础文件
git init
"# Autoagent\n\nAgent Swarm test repository." | Set-Content README.md
'{"name":"autoagent","version":"1.0.0","main":"index.js","scripts":{"test":"echo \\"No tests yet\\""}}' | Set-Content package.json
"// Autoagent entry point\nfunction greet(name) {\n  return \`Hello, \${name}!\`;\n}\nconsole.log(greet('World'));\nmodule.exports = { greet };" | Set-Content index.js

git add .
git commit -m "init"
git push -u origin main
```

---

## 七、飞书 Webhook 配置

### 7.1 获取 Webhook URL

1. 打开飞书，进入目标群聊
2. 点击群设置 -> 群机器人 -> 添加机器人
3. 选择 "自定义机器人"
4. 复制 Webhook URL（格式：`https://open.feishu.cn/open-apis/bot/v2/hook/xxxxx`）

### 7.2 配置到脚本

编辑 `C:\Users\{USERNAME}\.clawdbot\scripts\notify-feishu.ps1`：

```powershell
$DefaultWebhook = "https://open.feishu.cn/open-apis/bot/v2/hook/你的-webhook-token"
```

### 7.3 测试飞书通知

```powershell
& C:\Users\{USERNAME}\.clawdbot\scripts\notify-feishu.ps1 `
  -Title "测试通知" `
  -Content "Agent Swarm 飞书通知配置成功"
```

---

## 八、OpenClaw 网关配置

### 8.1 配置文件位置

```
C:\Users\{USERNAME}\.openclaw\openclaw.json
```

### 8.2 关键配置项

```json
{
  "channels": {
    "feishu": {
      "enabled": true,
      "appId": "cli_a923b37b18785cc1",
      "appSecret": "your-app-secret",
      "connectionMode": "websocket",
      "domain": "feishu",
      "groupPolicy": "open",
      "dmPolicy": "open"
    }
  },
  "plugins": {
    "allow": [
      "openai",
      "kimi",
      "codex",
      "memory-core",
      "browser"
    ],
    "entries": {
      "codex": {
        "enabled": true,
        "config": {
          "codexDynamicToolsLoading": "searchable"
        }
      }
    }
  }
}
```

### 8.3 重启网关

```powershell
# 使用自定义脚本重启（不要用 openclaw gateway restart）
C:\Users\{USERNAME}\Documents\trae_projects\openclaw\restart-gateway.ps1
```

---

## 九、Registry 格式说明

`active-tasks.json` 是任务登记本，格式如下：

```json
[
  {
    "id": "feat-add-logger",
    "tmuxSession": 51232,
    "agent": "codex",
    "description": "Add a simple logger module...",
    "repo": "C:\\Users\\MLTZ\\autoagent",
    "worktree": "C:\\Users\\MLTZ\\.clawdbot\\worktrees\\feat-add-logger",
    "branch": "feat-add-logger",
    "startedAt": "2026-05-24T06:32:58.0000000+08:00",
    "status": "ready",
    "notifyOnComplete": true,
    "retries": 0,
    "lastCheck": "2026-05-24T07:00:00.0000000+08:00"
  }
]
```

### 状态流转

```
running -> ready (Agent 完成，PR 已创建)
running -> failed (重试3次后停止)
ready -> done (人工合并后手动更新)
```

---

## 十、一键安装脚本

保存为 `install-agent-swarm.ps1`，在新电脑上运行：

```powershell
<#
  .SYNOPSIS
  Agent Swarm 一键安装脚本
  在新电脑上运行此脚本即可完整配置环境
#>
param(
    [string]$RepoUrl = "https://github.com/jerrybluex/autoagent.git",
    [string]$RepoName = "autoagent",
    [string]$FeishuWebhook = "https://open.feishu.cn/open-apis/bot/v2/hook/78240b0b-0478-4aa0-9f6d-a49a123c4614"
)

$ErrorActionPreference = "Stop"
Write-Host "=== Agent Swarm 安装程序 ===" -ForegroundColor Cyan

# 1. 检查依赖
Write-Host "`n[1/8] 检查依赖..." -ForegroundColor Yellow
$deps = @("git","gh","node","npm","codex","claude","openclaw")
foreach ($dep in $deps) {
    try {
        $ver = Invoke-Expression "$dep --version" 2>$null
        Write-Host "  ✅ $dep`: $ver"
    } catch {
        Write-Host "  ❌ $dep 未安装，请先安装" -ForegroundColor Red
        exit 1
    }
}

# 2. 创建目录结构
Write-Host "`n[2/8] 创建目录结构..." -ForegroundColor Yellow
$BaseDir = "$env:USERPROFILE\.clawdbot"
New-Item -ItemType Directory -Force -Path "$BaseDir\scripts" | Out-Null
New-Item -ItemType Directory -Force -Path "$BaseDir\worktrees" | Out-Null
New-Item -ItemType Directory -Force -Path "$BaseDir\logs" | Out-Null
"[]" | Set-Content "$BaseDir\active-tasks.json"
Write-Host "  ✅ 目录结构创建完成"

# 3. 克隆仓库
Write-Host "`n[3/8] 克隆仓库..." -ForegroundColor Yellow
$RepoPath = "$env:USERPROFILE\$RepoName"
if (-not (Test-Path $RepoPath)) {
    git clone $RepoUrl $RepoPath
    Write-Host "  ✅ 仓库克隆完成: $RepoPath"
} else {
    Write-Host "  ⚠️  仓库已存在: $RepoPath"
}

# 4. 设置环境变量
Write-Host "`n[4/8] 设置环境变量..." -ForegroundColor Yellow
[Environment]::SetEnvironmentVariable("AGENT_SWARM_REPO", $RepoPath, "User")
[Environment]::SetEnvironmentVariable("FEISHU_WEBHOOK", $FeishuWebhook, "User")
$env:AGENT_SWARM_REPO = $RepoPath
$env:FEISHU_WEBHOOK = $FeishuWebhook
Write-Host "  ✅ 环境变量已设置"

# 5. GitHub 登录检查
Write-Host "`n[5/8] 检查 GitHub 登录..." -ForegroundColor Yellow
$ghStatus = gh auth status 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ GitHub 已登录"
} else {
    Write-Host "  ⚠️  请先运行: gh auth login" -ForegroundColor Yellow
}

# 6. 下载脚本
Write-Host "`n[6/8] 配置脚本..." -ForegroundColor Yellow
$ScriptsBase = "https://raw.githubusercontent.com/jerrybluex/autoagent/main/scripts"
$scripts = @("spawn-agent","check-agents","ralph-loop","review-pr","notify-feishu")
foreach ($script in $scripts) {
    $url = "$ScriptsBase/$script.ps1"
    $dest = "$BaseDir\scripts\$script.ps1"
    try {
        Invoke-WebRequest -Uri $url -OutFile $dest -ErrorAction Stop
        Write-Host "  ✅ $script.ps1"
    } catch {
        Write-Host "  ⚠️  $script.ps1 下载失败，请手动复制" -ForegroundColor Yellow
    }
}

# 7. 配置 Cron Job
Write-Host "`n[7/8] 配置 OpenClaw Cron..." -ForegroundColor Yellow
Write-Host "  请手动在 OpenClaw 网关配置中添加以下 Cron Job："
Write-Host @"

  1. agent-babysitter（每10分钟）
     Command: powershell -NoProfile -ExecutionPolicy Bypass -File $BaseDir\scripts\check-agents.ps1

  2. ralph-loop-v2（每30分钟）
     Command: powershell -NoProfile -ExecutionPolicy Bypass -File $BaseDir\scripts\ralph-loop.ps1

"@ -ForegroundColor Cyan

# 8. 验证
Write-Host "`n[8/8] 验证安装..." -ForegroundColor Yellow
& "$BaseDir\scripts\spawn-agent.ps1" `
  -TaskId "test-install" `
  -Agent "codex" `
  -Prompt "Add a comment to index.js saying 'Installed by Agent Swarm'" `
  -Repo $RepoPath

Write-Host "`n=== 安装完成 ===" -ForegroundColor Green
Write-Host "目录: $BaseDir"
Write-Host "仓库: $RepoPath"
Write-Host "`n下一步："
Write-Host "  1. 检查 OpenClaw Cron 配置"
Write-Host "  2. 配置飞书 Webhook"
Write-Host "  3. 查看测试任务进度: Get-Content $BaseDir\active-tasks.json"
```

---

## 十一、验证步骤

安装完成后，按以下步骤验证：

### 11.1 基础验证

```powershell
# 1. 检查目录
Get-ChildItem $env:USERPROFILE\.clawdbot

# 2. 检查脚本
Get-ChildItem $env:USERPROFILE\.clawdbot\scripts

# 3. 检查仓库
gh repo view jerrybluex/autoagent --json name

# 4. 检查环境变量
$env:AGENT_SWARM_REPO
$env:FEISHU_WEBHOOK
```

### 11.2 功能验证

```powershell
# 1. 手动派活测试
& $env:USERPROFILE\.clawdbot\scripts\spawn-agent.ps1 `
  -TaskId "test-verify" `
  -Agent "codex" `
  -Prompt "Add a comment 'Agent Swarm verified' to the top of index.js" `
  -Repo $env:AGENT_SWARM_REPO

# 2. 等待2分钟后检查
Start-Sleep -Seconds 120
Get-Content $env:USERPROFILE\.clawdbot\active-tasks.json

# 3. 检查 PR 是否创建
gh pr list --repo jerrybluex/autoagent --state open

# 4. 测试飞书通知
& $env:USERPROFILE\.clawdbot\scripts\notify-feishu.ps1 `
  -Title "Agent Swarm 验证" `
  -Content "安装验证成功"
```

### 11.3 Cron 验证

```powershell
# 查看 Cron Job 列表
openclaw cron list

# 手动触发 babysitter
openclaw cron run agent-babysitter

# 手动触发 ralph-loop
openclaw cron run ralph-loop-v2
```

---

## 十二、故障排查

### 12.1 常见问题

| 问题 | 原因 | 解决 |
|------|------|------|
| spawn-agent 报错 | gh 未登录 | `gh auth login` |
| Codex 连接超时 | 网络/API 问题 | 检查代理或 API 密钥 |
| Claude 不执行 | prompt 格式问题 | 确保以 TASK 开头 |
| 飞书没通知 | Webhook 未配置 | 检查 `FEISHU_WEBHOOK` |
| worktree 冲突 | 分支已存在 | 删除 `$env:USERPROFILE\.clawdbot\worktrees\任务ID` |
| Cron 不运行 | OpenClaw 未配置 | 检查网关配置中的 Cron 设置 |
| 进程启动后退出 | bat 文件格式问题 | 检查引号和路径 |

### 12.2 日志位置

| 日志 | 路径 |
|------|------|
| Agent 执行日志 | `C:\Users\{USERNAME}\.clawdbot\logs\{任务ID}.log` |
| 监控脚本日志 | `C:\Users\{USERNAME}\.clawdbot\logs\check-agents.log` |
| OpenClaw 网关日志 | `C:\Users\{USERNAME}\.openclaw\logs\` |
| Codex CLI 日志 | `C:\Users\{USERNAME}\.codex\` |
| Claude Code 日志 | `C:\Users\{USERNAME}\.claude\sessions\` |

### 12.3 重置方法

```powershell
# 清理所有 worktree
Get-ChildItem $env:USERPROFILE\.clawdbot\worktrees -Directory | ForEach-Object {
    Remove-Item -Recurse -Force $_.FullName
}

# 清空任务注册表
"[]" | Set-Content $env:USERPROFILE\.clawdbot\active-tasks.json

# 清理日志
Remove-Item $env:USERPROFILE\.clawdbot\logs\* -Recurse -Force
```

---

## 附录：配置清单

在新电脑上配置时，按以下清单逐项确认：

- [ ] Git 安装并配置
- [ ] GitHub CLI 安装并登录
- [ ] Node.js 和 npm 安装
- [ ] Codex CLI 安装 (`npm install -g @openai/codex`)
- [ ] Claude Code 安装 (`npm install -g @anthropic-ai/claude-code`)
- [ ] OpenClaw 安装并配置
- [ ] 创建 `.clawdbot` 目录结构
- [ ] 复制 5 个核心脚本
- [ ] 设置 `AGENT_SWARM_REPO` 环境变量
- [ ] 设置 `FEISHU_WEBHOOK` 环境变量
- [ ] 克隆目标仓库
- [ ] GitHub CLI 登录 (`gh auth login`)
- [ ] 配置 OpenClaw Cron（babysitter + ralph-loop）
- [ ] 测试 spawn-agent
- [ ] 测试飞书通知
- [ ] 验证端到端流程

---

*配置版本：2026-05-24*
*适用系统：Windows 10/11 + PowerShell 5.1+*