$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host 'Brak Node.js. Zainstaluj Node.js LTS albo wykonaj testy ręczne z pliku MANUAL_TEST_CHECKLIST.md.' -ForegroundColor Red
    exit 1
}
node .\run_baseline_tests.js
$exitCode = $LASTEXITCODE
Write-Host "Wyniki zapisano w folderze results."
exit $exitCode
