Write-Host "🚀 QuickText Pro - Quick Deployment Launcher" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Choose your deployment platform:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 🌊 Vercel (Free, Fast)" -ForegroundColor Cyan
Write-Host "2. 🚂 Railway (Recommended)" -ForegroundColor Cyan 
Write-Host "3. 🐋 Docker Local" -ForegroundColor Cyan
Write-Host "4. 🟣 Heroku" -ForegroundColor Cyan
Write-Host "5. 🍃 Setup MongoDB Atlas" -ForegroundColor Cyan
Write-Host "6. 🧪 Test Current Setup" -ForegroundColor Cyan
Write-Host ""

$choice = Read-Host "Enter your choice (1-6)"

switch ($choice) {
    "1" {
        Write-Host "`n🌊 Deploying to Vercel..." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "⚠️  IMPORTANT: You need MongoDB Atlas connection string!" -ForegroundColor Red
        Write-Host "   1. Go to https://cloud.mongodb.com" -ForegroundColor White
        Write-Host "   2. Create free cluster" -ForegroundColor White
        Write-Host "   3. Get connection string" -ForegroundColor White
        Write-Host "   4. Add to Vercel environment variables" -ForegroundColor White
        Write-Host ""
        
        $proceed = Read-Host "Do you have MongoDB Atlas ready? (y/n)"
        if ($proceed -eq "y") {
            Write-Host "Starting Vercel deployment..." -ForegroundColor Green
            vercel login
            vercel --prod
        } else {
            Write-Host "Please set up MongoDB Atlas first!" -ForegroundColor Yellow
            Start-Process "https://cloud.mongodb.com"
        }
    }
    
    "2" {
        Write-Host "`n🚂 Railway Deployment..." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Opening Railway.app..." -ForegroundColor Yellow
        Start-Process "https://railway.app"
        Write-Host "Please:" -ForegroundColor White
        Write-Host "1. Sign up at Railway.app" -ForegroundColor White
        Write-Host "2. Connect your GitHub repository" -ForegroundColor White
        Write-Host "3. Deploy from GitHub" -ForegroundColor White
        Write-Host "4. Railway will provide MongoDB automatically!" -ForegroundColor Green
    }
    
    "3" {
        Write-Host "`n🐋 Building Docker container..." -ForegroundColor Cyan
        Write-Host ""
        
        # Check if Docker is installed
        try {
            docker --version
            Write-Host "Building Docker image..." -ForegroundColor Yellow
            docker build -t quicktext-pro .
            
            Write-Host "`nContainer built successfully!" -ForegroundColor Green
            Write-Host "Run with:" -ForegroundColor Yellow
            Write-Host 'docker run -p 3000:3000 -e MONGODB_URI="your-connection-string" quicktext-pro' -ForegroundColor White
        } catch {
            Write-Host "❌ Docker not found. Please install Docker Desktop:" -ForegroundColor Red
            Write-Host "https://docs.docker.com/get-docker/" -ForegroundColor White
            Start-Process "https://docs.docker.com/get-docker/"
        }
    }
    
    "4" {
        Write-Host "`n🟣 Heroku deployment requires Heroku CLI" -ForegroundColor Magenta
        Write-Host "Please install from: https://devcenter.heroku.com/articles/heroku-cli" -ForegroundColor White
        Start-Process "https://devcenter.heroku.com/articles/heroku-cli"
    }
    
    "5" {
        Write-Host "`n🍃 Opening MongoDB Atlas setup..." -ForegroundColor Green
        Start-Process "https://cloud.mongodb.com"
        Write-Host ""
        Write-Host "📖 Follow the detailed setup guide in MONGODB_ATLAS_SETUP.md" -ForegroundColor Yellow
        Write-Host "💡 TIP: Use the free M0 tier for testing!" -ForegroundColor Cyan
    }
    
    "6" {
        Write-Host "`n🧪 Testing current setup..." -ForegroundColor Green
        npm test
        Write-Host "`n✅ If tests pass, your app is ready for deployment!" -ForegroundColor Green
    }
    
    default {
        Write-Host "`n❌ Invalid choice. Please run the script again." -ForegroundColor Red
    }
}

Write-Host "`n✅ Deployment process initiated!" -ForegroundColor Green
Write-Host "📖 Check DEPLOYMENT_GUIDE.md for detailed instructions" -ForegroundColor Cyan
Write-Host "💡 Your app will be available at the provided URL" -ForegroundColor Yellow

Read-Host "Press Enter to continue"
