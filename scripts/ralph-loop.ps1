<#
  .SYNOPSIS
  Ralph Loop V2 — 主动发现工作并 spawn agent
  建议每 30 分钟运行一次
#>
$ErrorActionPreference = "Stop"

$RepoPath = $env:AGENT_SWARM_REPO
if (-not $RepoPath) {
    # 默认使用 autoagent
    $RepoPath = "C:\Users\MLTZ\autoagent"
}

if (-not (Test-Path $RepoPath)) {
    Write-Error "Repo not found: $RepoPath"
    exit 1
}

$Spawned = 0

# --- 1. 扫描 Sentry 新错误（需配置 SENTRY_AUTH_TOKEN） ---
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
    Write-Host "[Ralph] Sentry not configured (set SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT)"
}

# --- 2. 扫描 TODO/FIXME（Windows 兼容版） ---
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

    # 避免重复 spawn 同一个 TODO
    $key = "$file`:$line"
    if ($seen.ContainsKey($key)) { continue }
    $seen[$key] = $true

    # 生成任务ID
    $safeFile = (Split-Path $file -Leaf) -replace "[^a-zA-Z0-9]","-"
    $taskId = "ralph-todo-$safeFile-$line"

    $prompt = "Resolve TODO/FIXME in file '$file' line $line`: $text`n`nPlease implement the fix and add appropriate tests."
    Write-Host "[Ralph] Found TODO: $file`:$line — spawning agent"
    & "$PSScriptRoot\spawn-agent.ps1" -TaskId $taskId -Agent "claude" -Prompt $prompt -Repo $RepoPath
    $Spawned = $Spawned + 1
}

# --- 3. 扫描 README 缺失或过时 ---
$readmePath = Join-Path $RepoPath "README.md"
if (-not (Test-Path $readmePath)) {
    $taskId = "ralph-readme-$(Get-Date -Format yyyyMMdd)"
    $prompt = "Create a README.md for this project. Include: project description, installation, usage, and basic API docs."
    Write-Host "[Ralph] No README found — spawning agent"
    & "$PSScriptRoot\spawn-agent.ps1" -TaskId $taskId -Agent "claude" -Prompt $prompt -Repo $RepoPath
    $Spawned = $Spawned + 1
}

# --- 4. 更新 changelog（每晚8点） ---
$hour = (Get-Date).Hour
if ($hour -eq 20) {
    $taskId = "ralph-changelog-$(Get-Date -Format yyyyMMdd)"
    $prompt = "Update CHANGELOG.md based on today's git log. Summarize user-facing changes."
    Write-Host "[Ralph] Evening changelog update — spawning agent"
    & "$PSScriptRoot\spawn-agent.ps1" -TaskId $taskId -Agent "claude" -Prompt $prompt -Repo $RepoPath
    $Spawned = $Spawned + 1
}

Write-Host "[Ralph] Scan complete at $(Get-Date). Spawned $Spawned agent(s)."
