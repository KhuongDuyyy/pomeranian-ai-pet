@echo off
cd /d "%~dp0"
if exist "%~dp0.tools\node.exe" set "PATH=%~dp0.tools;%PATH%"
call npm.cmd run ui
if errorlevel 1 pause
