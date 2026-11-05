@echo off
chcp 65001 >nul
title Что купить - сервер Expo
cd /d "%~dp0"
if "%EXPO_TOKEN%"=="" (
  echo Нет EXPO_TOKEN. Один раз выполните в PowerShell: setx EXPO_TOKEN "ваш_токен"
  echo и откройте этот файл заново.
  pause
  exit /b
)
npx expo start --tunnel --clear
pause
