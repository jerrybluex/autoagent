<#
  .SYNOPSIS
  Agent Swarm monitor script — Ralph Loop V2 check layer
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
        msg_type = "post"
        content = @{
            post = @{
                zh_cn = @{
                    title = $title
                    content = @(@(@{ tag = "text"; text = $content }))
                }
            }
        }
    } | ConvertTo-Json -Depth 10 -Compress
    try { Invoke-RestMethod -Uri $hook -Method POST -Body $body -ContentType "application/json" | Out-Null } catch {}
}

function Test-AgentAlive($pidOrName) {
    if ($pidOrName -match '^\d+$') {
        try { Get-Process -Id $pidOrName -ErrorAction Stop | Out-Null; return $true } catch { return $false }
    }
    $pm2List = pm2 jlist 2>$null | ConvertFrom-Json
    $proc = $pm2List | Where-Object { $_.name -eq $pidOrName }
    return ($proc -and $proc.pm2_env -and $proc.pm2_env.status -eq "online")
}

function Test-CIPassing($branch) {
    try {
        $runs = gh run list --branch $branch --json conclusion,status -L 1 | ConvertFrom-Json
        if (-not $runs) { return $false }
        return ($runs[0].status -eq "completed" -and $runs[0].conclusion -eq "success")
    } catch { return $false }
}

function Test-PRReady($branch) {
    try {
        $pr = gh pr view $branch --json state,number 2>$null | ConvertFrom-Json
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
    $ci    = Test-CIPassing $t.branch
    $pr    = Test-PRReady $t.branch

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
                $alerts += "PR #$($t.pr) ready for review: $($t.description)"
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
