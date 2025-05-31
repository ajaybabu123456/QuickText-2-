Write-Host "🚀 QuickText Pro - Deployment Options" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Choose your deployment platform:" -ForegroundColor Yellow
Write-Host "1. Vercel (Free & Fast)" -ForegroundColor Cyan
Write-Host "2. Railway (Recommended)" -ForegroundColor Cyan
Write-Host "3. Test Local Setup" -ForegroundColor Cyan
Write-Host ""

$choice = Read-Host "Enter choice (1-3)"

if ($choice -eq "1") {
    Write-Host "`nDeploying to Vercel..." -ForegroundColor Cyan
    Write-Host "You'll need MongoDB Atlas for the database." -ForegroundColor Yellow
    $proceed = Read-Host "Do you have MongoDB Atlas connection string? (y/n)"
    
    if ($proceed -eq "y") {
        Write-Host "Starting Vercel deployment..." -ForegroundColor Green
        vercel login
        vercel --prod
    }
    else {
        Write-Host "Setting up MongoDB Atlas..." -ForegroundColor Yellow
        Start-Process "https://cloud.mongodb.com"
        Write-Host "Please create a free cluster and get your connection string."
    }
}
elseif ($choice -eq "2") {
    Write-Host "`nOpening Railway..." -ForegroundColor Cyan
    Start-Process "https://railway.app"
    Write-Host "Railway provides both hosting and database!"
}
elseif ($choice -eq "3") {
    Write-Host "`nTesting current setup..." -ForegroundColor Green
    npm test
}
else {
    Write-Host "Invalid choice." -ForegroundColor Red
}

Write-Host "`nDeployment guide available in DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan
