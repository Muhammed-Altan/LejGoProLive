# Error Handling Test Script
# Run this after starting your dev server

Write-Host "🧪 Testing Error Handling..." -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "`n1. Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method Get
    if ($health.services.supabase -eq "up") {
        Write-Host "✅ Health check passed" -ForegroundColor Green
    } else {
        Write-Host "❌ Health check failed: Supabase is $($health.services.supabase)" -ForegroundColor Red
    }
    Write-Host ($health | ConvertTo-Json -Depth 5)
} catch {
    Write-Host "❌ Health check error: $_" -ForegroundColor Red
}

# Test 2: Invalid Data (400 Error)
Write-Host "`n2. Testing Invalid Data Handling..." -ForegroundColor Yellow
try {
    $body = @{
        startDate = "invalid"
        endDate = "invalid"
        models = @()
        accessories = @()
    } | ConvertTo-Json

    Invoke-RestMethod -Uri "http://localhost:3000/api/booking" -Method Post -Body $body -ContentType "application/json"
    Write-Host "❌ Should have failed with 400 error" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✅ 400 error handled correctly" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Unexpected error: $_" -ForegroundColor Yellow
    }
}

# Test 3: Products API (Network Test)
Write-Host "`n3. Testing Products API..." -ForegroundColor Yellow
try {
    $start = Get-Date
    $products = Invoke-RestMethod -Uri "http://localhost:3000/api/products" -Method Get
    $duration = ((Get-Date) - $start).TotalMilliseconds
    Write-Host "✅ Products loaded in $([math]::Round($duration))ms" -ForegroundColor Green
} catch {
    Write-Host "❌ Products API error: $_" -ForegroundColor Red
}

Write-Host "`n✅ Automated tests complete!" -ForegroundColor Cyan
Write-Host "📋 For manual tests, see ERROR_HANDLING_IMPROVEMENTS.md" -ForegroundColor Gray
Write-Host "🌐 Visit http://localhost:3000/test-errors for interactive tests" -ForegroundColor Gray
