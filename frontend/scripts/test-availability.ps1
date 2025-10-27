param(
  [string]$startDate = (Get-Date).AddDays(7).ToString('yyyy-MM-dd'),
  [string]$endDate = (Get-Date).AddDays(10).ToString('yyyy-MM-dd')
)

$start = [DateTime]::Parse($startDate).ToString('o')
$end = [DateTime]::Parse($endDate).ToString('o')
$url = "http://localhost:3000/api/availability?startDate=$([System.Uri]::EscapeDataString($start))&endDate=$([System.Uri]::EscapeDataString($end))"
Write-Host "Calling $url"
try {
  $resp = Invoke-RestMethod -Uri $url -Method Get
  Write-Host "Response:" -ForegroundColor Green
  $resp | ConvertTo-Json -Depth 5 | Write-Host
} catch {
  Write-Host "Error calling endpoint:" -ForegroundColor Red
  Write-Host $_.Exception.Message
}
