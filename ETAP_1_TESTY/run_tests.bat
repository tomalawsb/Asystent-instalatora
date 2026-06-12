@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Brak Node.js. Zainstaluj Node.js LTS albo wykonaj testy reczne z pliku MANUAL_TEST_CHECKLIST.md.
  pause
  exit /b 1
)
node run_baseline_tests.js
set CODE=%ERRORLEVEL%
echo.
echo Wyniki zapisano w folderze results.
pause
exit /b %CODE%
