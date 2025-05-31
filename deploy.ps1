# QuickText Pro Deployment Script
# Run with: .\deploy.ps1 [platform]
# Platforms: vercel, railway, heroku, docker, local

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("vercel", "railway", "heroku", "docker", "local")]
    [string]$Platform
)

Write-Host "🚀 Deploying QuickText Pro to $Platform..." -ForegroundColor Green

# Check if required files exist
if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json not found. Are you in the correct directory?" -ForegroundColor Red
    exit 1
}

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

switch ($Platform) {
    "vercel" {
        Write-Host "🌊 Deploying to Vercel..." -ForegroundColor Cyan
        
        # Check if Vercel CLI is installed
        try {
            vercel --version | Out-Null
        } catch {
            Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
            npm install -g vercel
        }
        
        Write-Host "🔑 Make sure to set these environment variables in Vercel dashboard:" -ForegroundColor Yellow
        Write-Host "   - MONGODB_URI" -ForegroundColor White
        Write-Host "   - NODE_ENV=production" -ForegroundColor White
        Write-Host "   - JWT_SECRET" -ForegroundColor White
        Write-Host "   - RATE_LIMIT_POINTS=50" -ForegroundColor White
        Write-Host "   - RATE_LIMIT_DURATION=60" -ForegroundColor White
        
        # Deploy to Vercel
        vercel --prod
    }
    
    "railway" {
        Write-Host "🚂 Deploying to Railway..." -ForegroundColor Cyan
        
        # Check if Railway CLI is installed
        try {
            railway version | Out-Null
        } catch {
            Write-Host "Please install Railway CLI: https://docs.railway.app/develop/cli" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "🔑 Setting up Railway deployment..." -ForegroundColor Yellow
        railway login
        railway init
        railway up
    }
    
    "heroku" {
        Write-Host "🟣 Deploying to Heroku..." -ForegroundColor Magenta
        
        # Check if Heroku CLI is installed
        try {
            heroku --version | Out-Null
        } catch {
            Write-Host "Please install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli" -ForegroundColor Red
            exit 1
        }
        
        # Check if git is initialized
        if (-not (Test-Path ".git")) {
            Write-Host "Initializing git repository..." -ForegroundColor Yellow
            git init
            git add .
            git commit -m "Initial commit for Heroku deployment"
        }
        
        Write-Host "Creating Heroku app..." -ForegroundColor Yellow
        $appName = Read-Host "Enter Heroku app name (or press Enter for auto-generated)"
        
        if ([string]::IsNullOrWhiteSpace($appName)) {
            heroku create
        } else {
            heroku create $appName
        }
        
        Write-Host "Adding MongoDB addon..." -ForegroundColor Yellow
        heroku addons:create mongolab:sandbox
        
        Write-Host "Setting environment variables..." -ForegroundColor Yellow
        heroku config:set NODE_ENV=production
        heroku config:set JWT_SECRET=$(New-Guid).ToString()
        heroku config:set RATE_LIMIT_POINTS=50
        heroku config:set RATE_LIMIT_DURATION=60
        
        Write-Host "Deploying to Heroku..." -ForegroundColor Yellow
        git push heroku main
    }
    
    "docker" {
        Write-Host "🐋 Building Docker container..." -ForegroundColor Blue
        
        # Check if Docker is installed and running
        try {
            docker --version | Out-Null
        } catch {
            Write-Host "Please install Docker: https://docs.docker.com/get-docker/" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "Building Docker image..." -ForegroundColor Yellow
        docker build -t quicktext-pro:latest .
        
        Write-Host "🔑 Create a .env.production file with your environment variables" -ForegroundColor Yellow
        Write-Host "Run with: docker run -p 3000:3000 --env-file .env.production quicktext-pro:latest" -ForegroundColor Green
        
        $runNow = Read-Host "Do you want to run the container now? (y/n)"
        if ($runNow -eq "y" -or $runNow -eq "Y") {
            if (Test-Path ".env.production") {
                docker run -p 3000:3000 --env-file .env.production quicktext-pro:latest
            } else {
                Write-Host "⚠️ .env.production not found. Running with default settings..." -ForegroundColor Yellow
                docker run -p 3000:3000 -e NODE_ENV=production -e MONGODB_URI=mongodb://host.docker.internal:27017/quicktext-pro quicktext-pro:latest
            }
        }
    }
    
    "local" {
        Write-Host "🏠 Setting up local production deployment..." -ForegroundColor Green
        
        # Check if PM2 is installed
        try {
            pm2 --version | Out-Null
        } catch {
            Write-Host "Installing PM2..." -ForegroundColor Yellow
            npm install -g pm2
        }
        
        # Create logs directory
        if (-not (Test-Path "logs")) {
            New-Item -ItemType Directory -Path "logs"
        }
        
        Write-Host "Starting application with PM2..." -ForegroundColor Yellow
        pm2 start ecosystem.config.js --env production
        
        Write-Host "Setting up PM2 startup..." -ForegroundColor Yellow
        pm2 startup
        pm2 save
        
        Write-Host "✅ Application started! View logs with: pm2 logs" -ForegroundColor Green
        Write-Host "📊 Monitor with: pm2 monit" -ForegroundColor Green
    }
}

Write-Host "`n✅ Deployment to $Platform initiated!" -ForegroundColor Green
Write-Host "🌐 Your QuickText Pro application should be available shortly." -ForegroundColor Cyan

# Show next steps
Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Test the deployment at your application URL" -ForegroundColor White
Write-Host "2. Verify the /health endpoint is working" -ForegroundColor White
Write-Host "3. Test creating and retrieving shares" -ForegroundColor White
Write-Host "4. Set up monitoring and alerts" -ForegroundColor White
Write-Host "5. Configure custom domain (if needed)" -ForegroundColor White
