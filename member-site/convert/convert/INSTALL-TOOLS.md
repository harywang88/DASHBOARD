# 🔧 Installation Guide - CloudConvert-Local Required Tools

**⚠️ IMPORTANT:** These tools MUST be installed for CloudConvert to work!

---

## 📋 Summary

Your system is missing these conversion tools:
- ❌ **ImageMagick** (for image formats: JPG, PNG, WEBP, GIF, TIFF, etc.)
- ❌ **FFmpeg** (for video/audio formats: MP4, MKV, MP3, WAV, etc.)
- ❌ **LibreOffice** (for documents: PDF, DOCX, XLSX, PPTX, etc.)
- ❌ **7-Zip** (for .7z archives)

Without these tools, **all conversions will fail** with:
```
Failed to fetch - Conversion failed; ensure [TOOL] is installed
```

---

## ✅ Installation Instructions

### Option 1: Quick Manual Installation (Recommended for Windows)

#### 1. ImageMagick
1. Go to: https://imagemagick.org/script/download.php#windows
2. Download latest "Windows Dynamic Libraries" or "Windows Installer"
3. Run installer → Select "Install legacy utilities (convert.exe, etc.)"
4. **Important:** Check the box to add to PATH

```bash
# Verify installation
magick --version
```

#### 2. FFmpeg
1. Go to: https://ffmpeg.org/download.html
2. Download Windows build (ffmpeg-full or ffmpeg-shared)
3. Extract ZIP to: `C:\ffmpeg`
4. Add to PATH:
   - Right-click "This PC" → Properties → Advanced System Settings
   - Environment Variables → New User Variable
   - Variable name: `Path`, Value: `C:\ffmpeg\bin`
5. **Restart PowerShell/CMD**

```bash
# Verify installation
ffmpeg -version
```

#### 3. LibreOffice
1. Go to: https://www.libreoffice.org/download
2. Download and run `.msi` installer
3. Full installation (default settings OK)
4. **Restart after installation**

```bash
# Verify installation
soffice --version
```

#### 4. 7-Zip (Optional - for .7z support)
1. Go to: https://www.7-zip.org/download.html
2. Download `.exe` for your Windows version (32-bit or 64-bit)
3. Run installer → default location OK

```bash
# Verify installation
7z
```

---

### Option 2: Using WinGet (Windows 10/11+)

If you have WinGet installed:

```powershell
# Run as Administrator
winget install ImageMagick.ImageMagick
winget install Gyan.FFmpeg
winget install TheDocumentFoundation.LibreOffice
winget install 7zip.7zip
```

After installation, **restart PowerShell** and verify:
```bash
magick --version
ffmpeg -version
soffice --version
7z
```

---

### Option 3: Using Scoop (Advanced)

If you have Scoop installed:

```powershell
scoop install imagemagick ffmpeg libreoffice 7zip
```

---

## ✅ Verification

After installing, verify everything works:

```bash
# Run diagnostic
node diagnostic.js
```

Should show all green ✅

**Or test individually:**
```bash
magick --version
ffmpeg -version
soffice --version
7z
```

---

## 🚀 After Installation

1. **Restart PowerShell/Terminal** (important for PATH updates)
2. Go to project folder:
   ```bash
   cd c:\harywang\cloudconvert-local
   ```
3. Start server:
   ```bash
   npm start
   ```
4. Open browser:
   ```
   http://localhost:3000
   ```

---

## 🔍 Troubleshooting

### Error: "magick: command not found"
- ImageMagick not in PATH
- Restart PowerShell after installation
- Or manually add `C:\Program Files\ImageMagick-7.x.x-Q16\` to PATH

### Error: "ffmpeg: command not found"
- FFmpeg not in PATH
- Extract ZIP to `C:\ffmpeg`
- Add `C:\ffmpeg\bin` to Environment Variables
- Restart PowerShell

### Error: "soffice: command not found"
- LibreOffice not in PATH
- Default installation should work, but may need to restart
- Or add `C:\Program Files\LibreOffice\program` to PATH

### Error: "7z: command not found"
- 7-Zip not in PATH (can be optional)
- Try running as `C:\Program Files\7-Zip\7z.exe`
- Or reinstall choosing "Add 7-Zip to PATH"

---

## 📊 Check Installation Paths

### Windows Typical Paths

**ImageMagick:**
- `C:\Program Files\ImageMagick-7.x.x-Q16\magick.exe`
- Or `C:\Program Files (x86)\ImageMagick-6.x.x-Q16\convert.exe`

**FFmpeg:**
- `C:\ffmpeg\bin\ffmpeg.exe`
- Or `C:\Program Files\ffmpeg\bin\ffmpeg.exe`
- Or installed via WinGet/Scoop

**LibreOffice:**
- `C:\Program Files\LibreOffice\program\soffice.exe`
- Or `C:\Program Files (x86)\LibreOffice\program\soffice.exe`

**7-Zip:**
- `C:\Program Files\7-Zip\7z.exe`
- Or `C:\Program Files (x86)\7-Zip\7z.exe`

---

## ⚡ Environment Variables (Advanced)

If tools are installed but not in PATH, add them:

1. Press `Win + X` → System Settings
2. Search for "Environment Variables"
3. Click "Edit the system environment variables"
4. Click "Environment Variables"
5. Under "System variables", select "Path" → Edit
6. Click "New" and add each tool path:
   - `C:\Program Files\ImageMagick-7.x.x-Q16`
   - `C:\ffmpeg\bin`
   - `C:\Program Files\LibreOffice\program`
   - `C:\Program Files\7-Zip`
7. Click OK → OK → OK
8. **Restart PowerShell/CMD/Terminal**

---

## 🧪 Test After Installation

```bash
# Test server
npm start

# In another terminal
curl http://localhost:3000/health

# Should see
{
  "status": "ok",
  "timestamp": "...",
  "port": 3000
}
```

Then upload a file in browser and convert!

---

## 📝 What Each Tool Does

| Tool | Purpose | Formats |
|------|---------|---------|
| **ImageMagick** | Image conversion | JPG, PNG, WEBP, GIF, TIFF, BMP, SVG, ICO |
| **FFmpeg** | Video/Audio conversion | MP4, MKV, WEBM, AVI, MOV, MP3, WAV, FLAC, AAC, OGG |
| **LibreOffice** | Document conversion | PDF, DOCX, ODT, HTML, TXT, PPTX, XLSX, RTF |
| **7-Zip** | Archive creation | 7z, ZIP, RAR (ZIP works without) |

---

## ❓ Still Having Issues?

1. Run: `node diagnostic.js` and share output
2. Check server terminal for error messages
3. Check browser F12 console for network errors
4. Read [DIAGNOSTIC.md](DIAGNOSTIC.md) for detailed debugging

---

Last Updated: Phase 5 - Tool Installation Guide
