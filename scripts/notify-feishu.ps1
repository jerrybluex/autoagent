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
    msg_type = "post"
    content = @{
        post = @{
            zh_cn = @{
                title = $Title
                content = @(
                    @(@{ tag = "text"; text = $Content })
                )
            }
        }
    }
} | ConvertTo-Json -Depth 10 -Compress

Invoke-RestMethod -Uri $Webhook -Method POST -Body $body -ContentType "application/json"
