@echo off
chcp 65001 > nul

node server.js

if %errorlevel% neq 0 (
    echo [ERROR] Failed to start the server. Please check if Node.js is installed properly.
)
echo.
pause
