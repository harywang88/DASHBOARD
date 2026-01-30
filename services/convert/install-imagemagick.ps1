# Install ImageMagick on Windows
# Run this as Administrator

Write-Host "Installing ImageMagick for CloudConvert-Local..." -ForegroundColor Green

# Download ImageMagick installer
$url = "https://imagemagick.org/script/download.php#windows"
Write-Host "Downloading ImageMagick..."
Write-Host "Please visit: $url" -ForegroundColor Yellow
Write-Host ""
Write-Host "Download 'ImageMagick-7.1.0-61-Q16-x64-dll.exe' and run it"
Write-Host "Make sure to check the box: 'Install legacy utilities (convert.exe, etc.)'"
Write-Host ""
Write-Host "Then run this command to verify:"
Write-Host "magick --version" -ForegroundColor Cyan

# Alternative: using Chocolatey if available
if (Get-Command choco -ErrorAction SilentlyContinue) {
    Write-Host ""
    Write-Host "Or use Chocolatey:" -ForegroundColor Green
    Write-Host "choco install imagemagick" -ForegroundColor Cyan
}
