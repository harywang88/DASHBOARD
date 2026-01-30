# 🔍 CloudConvert-Local Comprehensive Diagnostic

## ⚠️ QUICK FIXES TO TRY FIRST

### 1. **Verify Server Is Running**
```bash
# Terminal 1: Start server
cd c:\harywang\cloudconvert-local
npm start
```

**Server should show:**
```
✅ CloudConvert-Local Server Started
📍 URL: http://localhost:3000
```

### 2. **Check Server Health**
Open browser and visit:
```
http://localhost:3000/health
```

**Should return:**
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "uptime": ...,
  "port": 3000,
  "api_key_enabled": false
}
```

### 3. **Open Frontend Correctly**
```
http://localhost:3000/
```

**NOT** `file://` or `http://127.0.0.1:3000`

---

## 🔧 DEBUGGING STEPS

### Step 1: Browser Console Inspection
1. Open `http://localhost:3000/`
2. Press `F12` → Console tab
3. Upload file → Click Convert
4. **Look for these messages:**

```javascript
Converting file: filename.ext To: target-format
Server URL: http://localhost:3000/convert
```

**If you see "CORS error":**
- Server.js might not have `app.use(cors())`
- Check [server.js](server.js) line 12

**If you see "TypeError: fetch is not a function":**
- Browser too old (need Chrome 40+, Firefox 39+)

### Step 2: Network Tab Inspection
1. Press `F12` → Network tab
2. Upload file → Click Convert
3. **Look for POST request to `/convert`**

**Check:**
- Status: Should be `200` (success) or `400`/`500` (error)
- Headers: Look for `Content-Type` in response
- Request payload: Should have file, targetFormat, options

**If POST never appears:**
- `fetch()` is not being called
- Click handler might have error
- Check frontend [index.html](frontend/index.html) line 754

### Step 3: Server Terminal Inspection
1. Look at terminal where you ran `npm start`
2. Upload file → Click Convert
3. **Look for these logs:**

```
=== CONVERSION REQUEST ===
File: 1704067200000-sample.txt (123 bytes)
Format: pdf
Input path: C:\harywang\cloudconvert-local\uploads\...
Options: {}
```

**If no log appears:**
- POST `/convert` not reaching server
- Port mismatch between frontend (trying :3000?) and server
- Firewall blocking connection

**If error appears:**
- Check which tool failed (ffmpeg, ImageMagick, LibreOffice, etc.)
- Tool may not be installed

---

## 📋 CHECKLIST

### Backend Configuration
- [ ] CORS enabled in server.js (line 12: `app.use(cors())`)
- [ ] PORT is 3000 (line 31 in server.js)
- [ ] Uploads directory exists: `c:\harywang\cloudconvert-local\uploads\`
- [ ] Multer configured correctly (lines 24-26)
- [ ] POST /convert endpoint exists (line 58)
- [ ] Error handler present (line 52-57)
- [ ] Queue system initialized (line 38: `new Queue(concurrency)`)

### Frontend Configuration
- [ ] Dynamic URL construction works (lines 782-784):
  ```javascript
  const protocol = window.location.protocol;
  const host = window.location.host;
  const baseUrl = `${protocol}//${host}`;
  ```
- [ ] FormData built correctly (lines 768-771):
  ```javascript
  formData.append('file', file);
  formData.append('targetFormat', selectedFormat);
  formData.append('options', optionsStr || '{}');
  ```
- [ ] Fetch call made to `/convert` (line 786)
- [ ] Error handler catches `Failed to fetch` (line 805)

### Conversion Services
- [ ] `convert.js` validates format (line 17-18)
- [ ] `queue.js` handles concurrency (line 20: `_next()`)
- [ ] `utils.js` spawns process correctly (line 14: `spawn(cmd, args)`)

### Required Tools
- [ ] **ImageMagick**: `magick --version` or `convert --version`
- [ ] **ffmpeg**: `ffmpeg -version`
- [ ] **LibreOffice**: `libreoffice --version` or `soffice --version`
- [ ] **7-Zip**: `7z` (for .7z support)
- [ ] **WinRAR**: `C:\Program Files\WinRAR\rar.exe` (for .rar support)

---

## 🚨 COMMON ERRORS & FIXES

### Error: "Failed to fetch"
**Cause:** Server not running or network issue
**Fix:** 
```bash
npm start
# Check http://localhost:3000/health
```

### Error: "File too large"
**Cause:** File > 500MB
**Fix:** Use smaller file or increase limit in server.js line 26

### Error: "Invalid JSON in options"
**Cause:** JSON syntax error
**Fix:** Use `{}` for no options, or valid JSON like `{"quality":80}`

### Error: "Image conversion failed; ensure ImageMagick is installed"
**Cause:** ImageMagick not installed
**Fix:** 
```bash
# Windows: Download from https://imagemagick.org/script/download.php#windows
# Or: choco install imagemagick
```

### Error: "ffmpeg exited with code 1"
**Cause:** ffmpeg installed but codec issue
**Fix:**
```bash
# Check ffmpeg:
ffmpeg -codecs
# Or reinstall: choco install ffmpeg
```

### Error: "CORS error"
**Cause:** Missing CORS middleware
**Fix:** Ensure server.js line 12 has `app.use(cors())`

---

## 🧪 MANUAL TEST

### Test 1: Server Health Check
```bash
curl http://localhost:3000/health
```

### Test 2: Test Conversion via Frontend
1. Go to `http://localhost:3000/`
2. Upload small PNG file (< 1MB)
3. Select format: `PDF`
4. Leave options empty
5. Click Convert
6. Check browser console (F12)
7. Check server terminal

### Test 3: Direct Backend Test
Create file `test-convert.js`:
```javascript
const path = require('path');
const { convertFile } = require('./services/convert');

(async () => {
  try {
    const inputFile = 'test-files/sample.txt';
    const result = await convertFile(inputFile, 'pdf', {});
    console.log('✅ Conversion success:', result);
  } catch (err) {
    console.error('❌ Conversion error:', err.message);
  }
})();
```

Run:
```bash
node test-convert.js
```

---

## 📊 DIAGNOSTIC OUTPUT

When reporting issue, provide:

1. **Browser Console Output** (F12):
   ```
   Converting file: ...
   Server URL: ...
   Error: ...
   ```

2. **Server Terminal Output**:
   ```
   === CONVERSION REQUEST ===
   File: ...
   Error: ...
   ```

3. **Tool Versions**:
   ```bash
   magick --version
   ffmpeg -version
   libreoffice --version
   ```

4. **Test File Info**:
   - Size
   - Format
   - Source format

---

## 🎯 IF STILL NOT WORKING

1. **Check PORT collision**:
   ```bash
   netstat -an | findstr 3000
   ```
   If something is on :3000, change to another port:
   ```bash
   PORT=3001 npm start
   ```

2. **Check CORS headers**:
   - Open DevTools Network tab
   - Check response headers for:
     ```
     access-control-allow-origin: *
     ```

3. **Check file upload**:
   - Look in `uploads/` directory
   - File should be there after upload

4. **Enable verbose logging** (see IMPROVEMENTS.md for details)

---

Last Updated: Phase 5 - Comprehensive Diagnostic
