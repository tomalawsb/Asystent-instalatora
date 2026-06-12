# upload_to_github.ps1
# Pomocnik Instalatora PWA
# Skrypt pobiera aktualne repozytorium, kopiuje projekt i wysyla zmiany bez pytania o opis commita.

$ErrorActionPreference = "Stop"

$RepoUrl = "https://github.com/tomalawsb/Asystent-instalatora.git"
$GitUserName = "Tomasz Wolak"
$GitUserEmail = "wolak82@gmail.com"

$ProjectPath = (Get-Location).Path
$TempRoot = Join-Path $env:TEMP "asystent_instalatora_git_upload"
$RepoWorkPath = Join-Path $TempRoot "repo"

function Stop-WithMessage($Message) {
    Write-Host ""
    Write-Host "BLAD: $Message" -ForegroundColor Red
    Write-Host ""
    Set-Location $ProjectPath -ErrorAction SilentlyContinue
    exit 1
}

function Info($Message) { Write-Host $Message -ForegroundColor Cyan }
function Ok($Message) { Write-Host $Message -ForegroundColor Green }
function Warn($Message) { Write-Host $Message -ForegroundColor Yellow }

Write-Host "=============================================="
Write-Host " Wysylanie Pomocnika Instalatora na GitHub"
Write-Host "=============================================="

Info "Folder projektu: $ProjectPath"
Info "Repozytorium: $RepoUrl"

try { git --version | Out-Null } catch { Stop-WithMessage "Git nie jest zainstalowany albo nie jest dostepny w PATH." }

$RequiredFiles = @(
    "index.html",
    "style.css",
    "manifest.json",
    "service-worker.js",
    "app-version.json",
    "cennik.json",
    "material-prices.json",
    "js\bootstrap.js",
    "js\state.js",
    "js\workflow.js"
)

foreach ($File in $RequiredFiles) {
    if (!(Test-Path (Join-Path $ProjectPath $File))) {
        Stop-WithMessage "Brak wymaganego pliku: $File. Uruchom skrypt z glownego folderu programu."
    }
}

try {
    $VersionConfig = Get-Content (Join-Path $ProjectPath "app-version.json") -Raw -Encoding UTF8 | ConvertFrom-Json
} catch {
    Stop-WithMessage "Nie mozna odczytac app-version.json: $($_.Exception.Message)"
}

$AppVersion = [string]$VersionConfig.version
if ([string]::IsNullOrWhiteSpace($AppVersion)) {
    Stop-WithMessage "W app-version.json brakuje pola version."
}

$DefaultCommitMessage = "Pomocnik Instalatora PWA $AppVersion - aktualizacja"
Info "Wersja programu: $AppVersion"
Info "Opis commita: $DefaultCommitMessage"

Info "Czyszcze katalog tymczasowy..."
if (Test-Path $TempRoot) { Remove-Item $TempRoot -Recurse -Force }
New-Item -ItemType Directory -Path $TempRoot | Out-Null

Info "Pobieram aktualne repozytorium z GitHuba..."
git clone $RepoUrl $RepoWorkPath
if ($LASTEXITCODE -ne 0) { Stop-WithMessage "Nie udalo sie pobrac repozytorium." }

Set-Location $RepoWorkPath
git config user.name "$GitUserName"
git config user.email "$GitUserEmail"
git config core.autocrlf false
git branch -M main
Ok "Autor Git: $GitUserName <$GitUserEmail>"

Info "Kopiuje aktualny projekt do repozytorium..."
$RoboArgs = @(
    $ProjectPath,
    $RepoWorkPath,
    "/MIR",
    "/XD", ".git", ".github", "node_modules", ".idea", ".vscode",
    "/XF", "*.zip", "*.sha256", ".DS_Store", "Thumbs.db"
)
robocopy @RoboArgs | Out-Null
$RoboCode = $LASTEXITCODE
if ($RoboCode -gt 7) { Stop-WithMessage "Robocopy nie skopiowal poprawnie plikow. Kod: $RoboCode" }

# Pliki usuniete w etapie 3 nie moga pozostac w repozytorium.
$ObsoleteFiles = @("pricing-data.js", "material-prices.js")
foreach ($File in $ObsoleteFiles) {
    $Target = Join-Path $RepoWorkPath $File
    if (Test-Path $Target) {
        Remove-Item $Target -Force
        Warn "Usunieto nieaktualne zrodlo danych: $File"
    }
}

Info "Sprawdzam wymagane pliki po skopiowaniu..."
foreach ($File in $RequiredFiles) {
    if (!(Test-Path (Join-Path $RepoWorkPath $File))) {
        Stop-WithMessage "Po kopiowaniu brakuje wymaganego pliku: $File"
    }
}

if (Test-Path (Join-Path $RepoWorkPath "pricing-data.js")) {
    Stop-WithMessage "pricing-data.js nadal istnieje. Cennik ma byc tylko w cennik.json."
}
if (Test-Path (Join-Path $RepoWorkPath "material-prices.js")) {
    Stop-WithMessage "material-prices.js nadal istnieje. Ceny materialow maja byc tylko w material-prices.json."
}

Info "Dodaje pliki..."
git add -A

$Status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($Status)) {
    Warn "Brak zmian do wyslania. Repozytorium jest juz aktualne."
    Set-Location $ProjectPath
    exit 0
}

Info "Zmiany wykryte przez Git:"
git status --short

Info "Tworze commit: $DefaultCommitMessage"
git commit -m "$DefaultCommitMessage"
if ($LASTEXITCODE -ne 0) { Stop-WithMessage "Nie udalo sie utworzyc commita." }

Info "Wysylam na GitHub..."
git push origin main
if ($LASTEXITCODE -ne 0) {
    Stop-WithMessage "Nie udalo sie wyslac projektu. Sprawdz logowanie GitHub lub Git Credential Manager."
}

Set-Location $ProjectPath

Write-Host "=============================================="
Ok "Gotowe. Projekt zostal wyslany na GitHub."
Write-Host "Repozytorium: $RepoUrl"
Write-Host "Wersja: $AppVersion"
Write-Host "=============================================="
