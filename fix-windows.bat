@echo off
echo ========================================
echo   Fixing Tailwind CSS Setup on Windows
echo ========================================
echo.

echo [1/4] Cleaning old files...
if exist node_modules rmdir /s /q node_modules
if exist .next rmdir /s /q .next
if exist package-lock.json del package-lock.json

echo.
echo [2/4] Clearing npm cache...
call npm cache clean --force

echo.
echo [3/4] Installing all packages...
call npm install

echo.
echo [4/4] Verifying installation...
call npm list tailwindcss tailwindcss-animate autoprefixer

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Now run: npm run dev
echo.
pause
