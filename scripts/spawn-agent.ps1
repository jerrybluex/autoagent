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
    # codex 从 stdin 读取 prompt，避免命令行引号问题
    $cmd = "codex exec -m $m -c `"model_reasoning_effort=high`" --dangerously-bypass-approvals-and-sandbox < .agent-prompt.md"
} else {
    $m = if ($Model) { $Model } else { "claude-opus-4.5" }
    $cmd = "claude --model $m --dangerously-skip-permissions -p `"$fullPrompt`""
}

# 写 bat 文件
$safeTaskId = $TaskId -replace '[/\\:<>"|?*]','-'
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
