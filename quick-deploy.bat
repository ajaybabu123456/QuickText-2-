@echo off
echo 🚀 QuickText Pro - Quick Deployment Launcher
echo ================================================
echo.
echo Choose your deployment platform:
echo.
echo 1. Vercel (Free, Fast)
echo 2. Railway (Recommended) 
echo 3. Docker Local
echo 4. Heroku
echo 5. Setup MongoDB Atlas
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto vercel
if "%choice%"=="2" goto railway  
if "%choice%"=="3" goto docker
if "%choice%"=="4" goto heroku
if "%choice%"=="5" goto mongodb
goto invalid

:vercel
echo.
echo 🌊 Deploying to Vercel...
echo.
echo ⚠️  IMPORTANT: You need MongoDB Atlas connection string!
echo    1. Go to https://cloud.mongodb.com
echo    2. Create free cluster
echo    3. Get connection string
echo    4. Add to Vercel environment variables
echo.
pause
vercel
goto end

:railway
echo.
echo 🚂 Deploying to Railway...
echo.
start https://railway.app
echo Please:
echo 1. Sign up at Railway.app
echo 2. Connect your GitHub repository
echo 3. Deploy from GitHub
echo.
pause
goto end

:docker
echo.
echo 🐋 Building Docker container...
echo.
docker build -t quicktext-pro .
echo.
echo Container built! Run with:
echo docker run -p 3000:3000 -e MONGODB_URI="your-connection-string" quicktext-pro
echo.
pause
goto end

:heroku
echo.
echo 🟣 Heroku deployment requires Heroku CLI
echo Please install from: https://devcenter.heroku.com/articles/heroku-cli
echo.
pause
goto end

:mongodb
echo.
echo 🍃 Opening MongoDB Atlas setup...
start https://cloud.mongodb.com
echo.
echo Follow the setup guide in MONGODB_ATLAS_SETUP.md
echo.
pause
goto end

:invalid
echo Invalid choice. Please run the script again.
pause
goto end

:end
echo.
echo ✅ Deployment process initiated!
echo 📖 Check DEPLOYMENT_GUIDE.md for detailed instructions
pause
