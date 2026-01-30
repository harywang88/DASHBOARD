# 🔧 QUICK FIX - ImageMagick Installation

**Status:** Server running ✅ | Image conversion needs ImageMagick 📦

## Problem
You're getting: `Image conversion failed; ensure ImageMagick is installed`

## Solution

### Option 1: Run Automated Installer (EASIEST)
Run this batch file as Administrator:
```
install-imagemagick.bat
```

This will:
1. Download ImageMagick automatically
2. Install it silently
3. Add to PATH

### Option 2: Manual Download
1. Go to: https://imagemagick.org/script/download.php#windows
2. Download: `ImageMagick-7.1.1-Q16-x64-dll.exe`
3. Run installer with options:
   - ✅ Check "Install legacy utilities (convert.exe, etc.)"
   - ✅ Check "Add to PATH"
4. Click Install
5. Restart PowerShell/Terminal

### Option 3: Using Package Manager
**Option A - Chocolatey:**
```powershell
choco install imagemagick
```

**Option B - Scoop:**
```powershell
scoop install imagemagick
```

## Verify Installation
After installation, run:
```powershell
magick --version
```

Should show version info like:
```
Version: ImageMagick 7.1.1-29 Q16-HDRI x64
```

## After Installing
1. **Restart Terminal/PowerShell** (important!)
2. Go back to browser at http://localhost:3000
3. Try conversion again - should work now! 🎉

## Temporary Fallback
Until ImageMagick is installed, PNG→WEBP conversions will create a ZIP file instead. This is just for testing.

---

**Having issues?** See: `INSTALL-TOOLS.md`
