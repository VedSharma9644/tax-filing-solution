# PowerShell script to build iOS with proper temp directory
# This fixes the "ENOSPC: no space left on device" error

Write-Host "Setting temp directory to E: drive (has more space)..." -ForegroundColor Green
$env:TEMP = "E:\TheGrowWellTax\thegrowwelltax\.temp"
$env:TMP = "E:\TheGrowWellTax\thegrowwelltax\.temp"

# Create temp directory if it doesn't exist
if (-not (Test-Path ".temp")) {
    New-Item -ItemType Directory -Path ".temp" -Force | Out-Null
    Write-Host "Created .temp directory" -ForegroundColor Green
}

Write-Host "Temp directory: $env:TEMP" -ForegroundColor Cyan
Write-Host "Starting EAS build..." -ForegroundColor Green
Write-Host ""

# Run the build
eas build --platform ios

