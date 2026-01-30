# 🔧 CloudConvert Local - Troubleshooting Guide

## Error: "Conversion failed - Failed to fetch"

Ini adalah error yang paling umum. Berikut solusinya:

### 1️⃣ **Check: Is Server Running?**

Pastikan server sudah started:

```bash
npm start
```

Anda harus melihat output seperti ini:
```
✅ CloudConvert-Local Server Started
📍 URL: http://localhost:3000
🔑 API Key: Not required
⚡ Concurrency: 2
📁 Upload dir: ...
```

**Jika tidak muncul**, ada error saat start. Lihat error message di terminal.

### 2️⃣ **Check: Port Sudah Digunakan?**

Jika port 3000 sudah digunakan oleh aplikasi lain:

**Windows:**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (replace PID dengan nomor dari output atas)
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
# Find and kill
lsof -i :3000
kill -9 <PID>
```

**Atau gunakan port berbeda:**
```powershell
set PORT=3001
npm start
```

Kemudian buka browser di `http://localhost:3001`

### 3️⃣ **Check: Browser Console**

Buka browser DevTools dan lihat Console tab:

**Windows/Linux:** `F12` atau `Ctrl+Shift+I`
**Mac:** `Cmd+Option+I`

Anda akan melihat log seperti:
```
Converting file: image.jpg To: png
Server URL: http://localhost:3000/convert
```

**Jika ada error merah**, itu adalah clue untuk debugging.

### 4️⃣ **Check: Server Logs**

Buka terminal dimana server berjalan dan lihat logs:

```
=== CONVERSION REQUEST ===
File: 1706xxx-image.jpg (2056234 bytes)
Format: png
Input path: uploads/1706xxx-image.jpg
```

**Jika ada ERROR dalam log**, itu adalah issue di server.

### 5️⃣ **Check: File Terlalu Besar?**

Maximum file size adalah 500MB.

Jika file lebih besar, akan error:
```
ERROR: File too large. Maximum 500MB.
```

**Solusi:** Gunakan file yang lebih kecil.

### 6️⃣ **Check: Format Didukung?**

Pastikan format yang dipilih didukung.

**Supported formats:**
- Images: JPG, PNG, WebP, GIF, BMP, TIFF, ICO, SVG
- Video: MP4, WebM, AVI, MOV, MKV, FLV, MPEG, WMV
- Audio: MP3, WAV, FLAC, AAC, OGG, M4A, OPUS, WMA
- Documents: PDF, DOCX, XLSX, PPTX, ODT, RTF, HTML, TXT, DOC
- Archives: ZIP, 7Z, RAR

**Jika format tidak ada**, akan error.

### 7️⃣ **Check: Conversion Tool Terinstall?**

Error sering terjadi karena tool tidak terinstall.

**Untuk Images (ImageMagick):**
```bash
magick -version
# atau
convert -version
```

**Untuk Video/Audio (ffmpeg):**
```bash
ffmpeg -version
```

**Untuk Documents (LibreOffice):**
```bash
soffice --version
```

**Jika tidak ada**, install tools:

**Windows:**
```powershell
choco install ffmpeg imagemagick libreoffice
```

**Mac:**
```bash
brew install ffmpeg imagemagick libreoffice
```

**Linux:**
```bash
sudo apt-get install ffmpeg imagemagick libreoffice
```

### 8️⃣ **Check: File Format Valid?**

Pastikan file tidak corrupt.

**Contoh:** Jika convert JPG ke PNG, pastikan file adalah JPG yang valid.

Jika file corrupt atau format salah, akan error:
```
ERROR: Conversion failed; ensure [tool] is installed
```

### 9️⃣ **Check: CORS Issue?**

Jika dari domain berbeda, mungkin ada CORS issue.

**Solusi:** Server sudah support CORS, jadi biasanya tidak ada masalah.

Tapi jika muncul CORS error di console, cek server.js:
```javascript
app.use(cors());
```

Harus ada di paling atas aplikasi.

### 🔟 **Check: JSON Options Invalid?**

Jika menggunakan Advanced Options, pastikan JSON valid.

**Valid:**
```json
{"quality": 80}
{"quality": 80, "bitrate": "192k"}
```

**Invalid:**
```json
{quality: 80}        // Missing quotes around key
{'quality': 80}      // Single quotes
{"quality": 80,}     // Trailing comma
```

---

## Common Error Messages

### ❌ "file is required"
**Artinya:** File tidak terupload.
**Solusi:** 
- Pastikan file dipilih
- File tidak terlalu besar (>500MB)
- Browser sudah support file upload

### ❌ "targetFormat is required"
**Artinya:** Format tidak dipilih atau tidak dikirim.
**Solusi:**
- Pilih format dari list
- Refresh halaman jika format tidak muncul

### ❌ "Invalid targetFormat"
**Artinya:** Format tidak valid (mungkin terlalu panjang atau punya karakter invalid).
**Solusi:**
- Pilih format dari tombol yang tersedia
- Jangan input format manual

### ❌ "Invalid JSON in options"
**Artinya:** JSON options tidak valid.
**Solusi:**
- Biarkan kosong jika tidak perlu
- Pastikan JSON syntax benar

### ❌ "Conversion produced no output"
**Artinya:** Tool menjalankan tapi tidak produce output file.
**Solusi:**
- File input mungkin corrupt
- Tool mungkin tidak terinstall dengan benar
- Coba dengan file berbeda

### ❌ "ensure [tool] is installed"
**Artinya:** Conversion tool tidak ditemukan.
**Solusi:**
- Install tool yang diperlukan
- Pastikan di PATH

### ❌ "Failed to fetch"
**Artinya:** Browser tidak bisa connect ke server.
**Solusi:**
- Pastikan server sudah running
- Cek port (default 3000)
- Cek firewall/antivirus

---

## Debugging Steps

### Step 1: Clear Browser Cache
```
Ctrl+Shift+Delete (atau Cmd+Shift+Delete di Mac)
```

### Step 2: Restart Server
```bash
# Stop server (Ctrl+C di terminal)
# Restart
npm start
```

### Step 3: Check Console Logs
Lihat browser console (`F12`) dan server terminal untuk error messages.

### Step 4: Try Test File
Download sample file dari `test-files/` folder dan coba convert.

### Step 5: Try Different Format
Jika format tertentu gagal, coba format berbeda untuk confirm.

### Step 6: Check System Resources
Buka Task Manager (Windows) atau Activity Monitor (Mac):
- CPU usage tinggi?
- Memory usage tinggi?
- Disk space full?

---

## Server Logs Interpretation

### INFO Logs (Normal)
```
✅ CloudConvert-Local Server Started
=== CONVERSION REQUEST ===
Conversion SUCCESS!
File downloaded successfully
```

### ERROR Logs (Problem)
```
CONVERSION ERROR: [error message]
Stack trace: [detailed error]
```

Salin error message dan cari solusinya di guide ini.

---

## Performance Issues

### ❌ Conversion Lambat
**Penyebab:**
- File besar
- CPU overload
- Disk I/O bottleneck

**Solusi:**
- Gunakan file lebih kecil
- Close aplikasi lain
- Increase CONCURRENCY: `set CONCURRENCY=1` (untuk single thread)

### ❌ Multiple Conversions Timeout
**Penyebab:**
- Concurrency terlalu tinggi
- Server resources terbatas

**Solusi:**
```bash
set CONCURRENCY=1
npm start
```

---

## Testing Checklist

Sebelum assume ada bug, test:

- [ ] Server running? (`npm start`)
- [ ] Port correct? (default 3000)
- [ ] Tools installed? (ffmpeg, ImageMagick, LibreOffice)
- [ ] File size < 500MB?
- [ ] File format valid? (not corrupt)
- [ ] Format supported?
- [ ] JSON options valid? (if used)
- [ ] Browser console clear? (no errors)
- [ ] Server logs clear? (no errors)

---

## Advanced: Enable Debug Mode

Edit `server.js` dan uncomment debug logs:

```javascript
console.log('REQUEST:', req.body);
console.log('FILE:', req.file);
console.log('OPTIONS:', options);
```

Setiap conversion akan log lebih banyak detail.

---

## Still Not Working?

Jika semua sudah dicoba tapi masih error:

1. **Catat error message persis** yang muncul
2. **Screenshot** browser console dan server logs
3. **Check README.md** untuk info setup lebih lengkap
4. **Check QUICKSTART.md** untuk setup step by step

---

## Quick Reference

### Commands
```bash
npm install          # Install dependencies
npm start           # Start server
npm stop            # Stop server (Ctrl+C)
```

### Ports
```bash
set PORT=3001       # Use different port
```

### Environment
```bash
set API_KEY=mykey
set CONCURRENCY=2
set CLEANUP_MINUTES=60
```

### Tools Check
```bash
ffmpeg -version
magick -version
convert -version
soffice --version
```

---

**Need more help?** Check other documentation files atau buat issue dengan details error message.

Made with ❤️ - Troubleshooting Guide
