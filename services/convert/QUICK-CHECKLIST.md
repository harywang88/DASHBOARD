# ⚡ QUICK START CHECKLIST

## 🔴 PROBLEM
```
"Conversion failed - Failed to fetch" error
```

## 🟢 SOLUTION
Install system tools (2 min read, 10-15 min install)

---

## ✅ STEP-BY-STEP

### Step 1: Install ImageMagick (5 minutes)
```
1. Visit: https://imagemagick.org/script/download.php#windows
2. Download: Latest "Windows Installer"
3. Run installer
4. ✅ Check: "Install legacy utilities"
5. Finish → Next tool
```

### Step 2: Install FFmpeg (3 minutes)
```
1. Visit: https://ffmpeg.org/download.html
2. Download: Windows build
3. Extract to: C:\ffmpeg
4. Add to PATH (see step below)
5. Next tool
```

### Add FFmpeg to PATH
```
1. Press: Win + X
2. Select: System Settings
3. Search: Environment Variables
4. Click: Edit system environment variables
5. Click: Environment Variables...
6. In "System variables", select "Path" → Edit
7. Click: New
8. Type: C:\ffmpeg\bin
9. Click: OK → OK → OK
```

### Step 3: Install LibreOffice (5 minutes)
```
1. Visit: https://www.libreoffice.org/download
2. Download: .msi installer for Windows
3. Run installer
4. Default settings → Finish
5. Wait for installation...
6. Next tool
```

### Step 4: Install 7-Zip (Optional, 2 minutes)
```
1. Visit: https://www.7-zip.org/download.html
2. Download: .exe for your Windows version
3. Run installer
4. Default settings → Finish
```

### Step 5: Restart Terminal ⚠️ IMPORTANT
```
Close and reopen PowerShell / Terminal
(New PATH won't work until restart!)
```

### Step 6: Verify Installation
```bash
magick --version      # Should show version
ffmpeg -version      # Should show version
soffice --version    # Should show version
```

### Step 7: Start Server
```bash
cd c:\harywang\cloudconvert-local
npm start
```

Should show:
```
✅ CloudConvert-Local Server Started
📍 URL: http://localhost:3000
```

### Step 8: Test It!
```
1. Open: http://localhost:3000
2. Upload: Any PNG/JPG file
3. Select: JPG or PDF format
4. Click: Convert
5. Download: Converted file
6. ✅ Success!
```

---

## 🆘 If Something Doesn't Work

### Tools still not found?
```bash
# Check PATH
echo %PATH%

# Or run diagnostic
node diagnostic.js
```

### Restart didn't help?
```bash
# Restart computer (restart PATH in Windows)
# Then test again
```

### Still getting error?
```
1. Check browser console (F12)
2. Check server terminal
3. See: DIAGNOSTIC.md
```

---

## 📚 Documentation

- **INSTALL-TOOLS.md** - Detailed installation guide
- **DIAGNOSTIC.md** - Debugging & troubleshooting
- **ROOT-CAUSE-ANALYSIS.md** - Technical details
- **AUDIT-COMPLETE.md** - Full audit report

---

## ⏱️ Total Time Needed

- Reading this: 2 minutes
- Installing tools: 10-15 minutes
- Restarting: 1 minute
- Testing: 2 minutes

**Total: ~20-25 minutes** ⏰

After that, CloudConvert works perfectly! 🚀

