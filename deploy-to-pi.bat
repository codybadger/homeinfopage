@echo off
echo ========================================
echo  Home Dashboard Deployment to Pi
echo ========================================
echo.

REM Configuration
set PI_USER=cody
set PI_IP=192.168.44.63
set PI_PATH=/home/cody/dashboard
set WEB_PATH=/var/www/dashboard

echo Deploying to %PI_USER%@%PI_IP%...
echo.

REM Check if files exist
if not exist "index.html" (
    echo ERROR: index.html not found!
    echo Please run this script from the directory containing your dashboard files.
    pause
    exit /b 1
)

if not exist "config.js" (
    echo ERROR: config.js not found!
    echo Please make sure you have configured your API keys in config.js
    pause
    exit /b 1
)

echo Copying files to Raspberry Pi...
scp *.html *.css *.js %PI_USER%@%PI_IP%:%PI_PATH%/

if %errorlevel% neq 0 (
    echo ERROR: Failed to copy files to Pi
    echo Make sure SSH is working: ssh %PI_USER%@%PI_IP%
    pause
    exit /b 1
)

echo.
echo Files copied successfully!
echo.

echo Moving files to web directory and setting permissions...
ssh %PI_USER%@%PI_IP% "sudo cp %PI_PATH%/* %WEB_PATH%/ && sudo chown -R www-data:www-data %WEB_PATH% && sudo chmod -R 755 %WEB_PATH%"

if %errorlevel% neq 0 (
    echo ERROR: Failed to move files to web directory
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Deployment Complete!
echo ========================================
echo.
echo Your dashboard is now available at:
echo   http://%PI_IP%
echo.
echo Next steps:
echo 1. Open http://%PI_IP% in your browser
echo 2. Sign in to Google when prompted
echo 3. Your dashboard should now show your data!
echo.
echo To update files in the future, just run this script again.
echo.
pause

