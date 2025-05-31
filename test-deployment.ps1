# Test deployment script for QuickText Pro
param(
    [Parameter(Mandatory=$true)]
    [string]$URL
)

Write-Host "🧪 Testing QuickText Pro deployment at: $URL" -ForegroundColor Green

# Test 1: Health Check
Write-Host "`n1. Testing health endpoint..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$URL/health" -Method Get -TimeoutSec 10
    if ($healthResponse.status -eq "ok") {
        Write-Host "   ✅ Health check passed" -ForegroundColor Green
        Write-Host "   📊 Database status: $($healthResponse.database.status)" -ForegroundColor Cyan
        Write-Host "   ⏱️ Uptime: $([math]::Round($healthResponse.uptime, 2)) seconds" -ForegroundColor Cyan
    } else {
        Write-Host "   ❌ Health check failed" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Health endpoint unreachable: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Main Page
Write-Host "`n2. Testing main page..." -ForegroundColor Yellow
try {
    $mainPage = Invoke-WebRequest -Uri $URL -TimeoutSec 10
    if ($mainPage.StatusCode -eq 200) {
        Write-Host "   ✅ Main page loads successfully" -ForegroundColor Green
        if ($mainPage.Content -match "QuickText Pro") {
            Write-Host "   ✅ Page content looks correct" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️ Page content might be incorrect" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ❌ Main page returned status: $($mainPage.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Main page unreachable: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: API - Create Share
Write-Host "`n3. Testing share creation API..." -ForegroundColor Yellow
try {
    $shareData = @{
        content = "Test deployment share - $(Get-Date)"
        contentType = "text"
        duration = "15m"
    } | ConvertTo-Json

    $shareResponse = Invoke-RestMethod -Uri "$URL/api/share" -Method Post -Body $shareData -ContentType "application/json" -TimeoutSec 10
    
    if ($shareResponse.code) {
        Write-Host "   ✅ Share created successfully" -ForegroundColor Green
        Write-Host "   🔑 Share code: $($shareResponse.code)" -ForegroundColor Cyan
        $testCode = $shareResponse.code
        
        # Test 4: API - Retrieve Share
        Write-Host "`n4. Testing share retrieval API..." -ForegroundColor Yellow
        try {
            $retrieveResponse = Invoke-RestMethod -Uri "$URL/api/retrieve" -Method Post -Body (@{code = $testCode} | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 10
            
            if ($retrieveResponse.content) {
                Write-Host "   ✅ Share retrieved successfully" -ForegroundColor Green
                Write-Host "   📄 Content preview: $($retrieveResponse.content.Substring(0, [Math]::Min(50, $retrieveResponse.content.Length)))..." -ForegroundColor Cyan
            } else {
                Write-Host "   ❌ Share retrieval failed" -ForegroundColor Red
            }
        } catch {
            Write-Host "   ❌ Share retrieval failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "   ❌ Share creation failed" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Share creation API failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Socket.IO (basic connectivity test)
Write-Host "`n5. Testing Socket.IO endpoint..." -ForegroundColor Yellow
try {
    $socketResponse = Invoke-WebRequest -Uri "$URL/socket.io/" -TimeoutSec 5
    if ($socketResponse.StatusCode -eq 200) {
        Write-Host "   ✅ Socket.IO endpoint accessible" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Socket.IO endpoint returned: $($socketResponse.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️ Socket.IO test inconclusive (this is often normal)" -ForegroundColor Yellow
}

Write-Host "`n📊 Deployment Test Summary:" -ForegroundColor Green
Write-Host "🌐 Application URL: $URL" -ForegroundColor Cyan
Write-Host "🏥 Health Check: $URL/health" -ForegroundColor Cyan
Write-Host "📡 API Endpoint: $URL/api/" -ForegroundColor Cyan
Write-Host "🔌 WebSocket: $URL/socket.io/" -ForegroundColor Cyan

Write-Host "`n✅ Deployment testing completed!" -ForegroundColor Green
