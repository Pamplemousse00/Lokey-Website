$ErrorActionPreference = "Stop"
$Base = "https://lokey.ca"

Write-Host "`n1. Live robots.txt" -ForegroundColor Cyan
(Invoke-WebRequest "$Base/robots.txt").Content

Write-Host "`n2. Homepage discovery headers" -ForegroundColor Cyan
$home = Invoke-WebRequest "$Base/" -Method Head
$home.Headers | Format-List

Write-Host "`n3. Markdown for Agents" -ForegroundColor Cyan
$markdown = Invoke-WebRequest "$Base/" -Headers @{ Accept = "text/markdown" }
Write-Host "Content-Type:" $markdown.Headers["Content-Type"]
Write-Host "x-markdown-tokens:" $markdown.Headers["x-markdown-tokens"]
Write-Host "Content-Signal:" $markdown.Headers["Content-Signal"]
$markdown.Content.Substring(0, [Math]::Min(500, $markdown.Content.Length))

Write-Host "`n4. API catalog" -ForegroundColor Cyan
$catalog = Invoke-WebRequest "$Base/.well-known/api-catalog" -Headers @{ Accept = "application/linkset+json" }
Write-Host "Content-Type:" $catalog.Headers["Content-Type"]
$catalog.Content

Write-Host "`n5. OpenAPI" -ForegroundColor Cyan
(Invoke-WebRequest "$Base/openapi.json").StatusCode

Write-Host "`n6. Agent skills" -ForegroundColor Cyan
(Invoke-WebRequest "$Base/.well-known/agent-skills/index.json").Content

Write-Host "`n7. Compatibility API" -ForegroundColor Cyan
(Invoke-WebRequest "$Base/api/agent/compatibility?year=2017&make=Hyundai&model=Tucson").Content

Write-Host "`n8. API status" -ForegroundColor Cyan
(Invoke-WebRequest "$Base/api/status").Content
