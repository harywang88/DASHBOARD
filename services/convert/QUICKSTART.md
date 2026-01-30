# 🚀 Quick Start Guide - CloudConvert Local

Panduan cepat untuk memulai CloudConvert Local dengan tema pink yang cantik!

## ⚡ 5 Menit Setup

### Step 1: Install Prerequisites (Windows)
Jika belum install, buka PowerShell sebagai Administrator dan jalankan:

```powershell
# Install Chocolatey (jika belum ada)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install semua tools yang dibutuhkan
choco install nodejs ffmpeg imagemagick libreoffice -y

# (Optional) Untuk RAR & 7z support
choco install winrar 7zip -y
```

### Step 2: Setup Project
```bash
cd c:\harywang\cloudconvert-local
npm install
```

### Step 3: Run Server
```bash
npm start
```

Anda akan melihat:
```
cloudconvert-local listening on http://localhost:3000
```

### Step 4: Buka di Browser
Buka browser dan navigasi ke:
```
http://localhost:3000
```

✅ Done! Aplikasi CloudConvert Local siap digunakan!

## 🎨 UI Overview

### Header (Pink Gradient)
- Logo dan deskripsi aplikasi
- Beautiful gradient background

### Upload Section (Kiri)
- Drag & drop area
- Click untuk browse file
- Tampilkan file yang dipilih
- Remove button untuk setiap file

### Format Selection (Kanan)
Pilih format dari kategori:
- **Images**: JPG, PNG, WebP, GIF, BMP, TIFF, ICO, SVG
- **Video**: MP4, WebM, AVI, MOV, MKV, FLV, MPEG, WMV
- **Audio**: MP3, WAV, FLAC, AAC, OGG, M4A, OPUS, WMA
- **Documents**: PDF, DOCX, XLSX, PPTX, ODT, RTF, HTML, TXT
- **Archive**: ZIP, 7Z, RAR

### Advanced Options
Untuk settings khusus, gunakan JSON format:
```json
{
  "quality": 80,
  "bitrate": "192k"
}
```

### Convert Button
Tombol gradien pink - klik untuk mulai konversi!

## 📊 Contoh Penggunaan

### Convert Image ke PNG
1. Drag image (jpg, bmp, dll) ke upload area
2. Klik format "PNG"
3. (Optional) Tambah options: `{"quality": 90}`
4. Klik "Convert File"
5. Download hasil PNG

### Convert Video ke MP4
1. Upload video file
2. Pilih format "MP4"
3. Klik Convert
4. Download hasil MP4

### Convert Document ke PDF
1. Upload dokumen (DOCX, XLSX, dll)
2. Pilih "PDF"
3. Klik Convert
4. Download PDF

### Create ZIP Archive
1. Upload file atau folder
2. Pilih "ZIP"
3. Klik Convert
4. Download ZIP archive

## ⚙️ Environment Variables

Ubah behavior server dengan environment variables:

### Windows PowerShell
```powershell
$env:API_KEY = "localdev"
$env:CONCURRENCY = "2"
$env:CLEANUP_MINUTES = "60"
npm start
```

### Linux/Mac
```bash
export API_KEY=localdev
export CONCURRENCY=2
export CLEANUP_MINUTES=60
npm start
```

### Penjelasan:
- `API_KEY`: Kunci API untuk keamanan (default: "localdev")
- `CONCURRENCY`: Jumlah konversi paralel (default: 2)
- `CLEANUP_MINUTES`: Hapus file lama setiap N menit (default: 60)

## 🔌 REST API Usage

### Menggunakan cURL
```bash
curl -X POST http://localhost:3000/convert \
  -H "X-API-Key: localdev" \
  -F "file=@input.jpg" \
  -F "targetFormat=png" \
  -F "options={\"quality\":85}" \
  -o output.png
```

### Menggunakan JavaScript/Node.js
```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

const form = new FormData();
form.append('file', fs.createReadStream('input.jpg'));
form.append('targetFormat', 'png');
form.append('options', JSON.stringify({ quality: 85 }));

axios.post('http://localhost:3000/convert', form, {
  headers: {
    ...form.getHeaders(),
    'X-API-Key': 'localdev'
  },
  responseType: 'arraybuffer'
}).then(res => {
  fs.writeFileSync('output.png', res.data);
  console.log('Konversi berhasil!');
});
```

### Menggunakan Python
```python
import requests

with open('input.jpg', 'rb') as f:
    files = {'file': f}
    data = {
        'targetFormat': 'png',
        'options': '{"quality": 85}'
    }
    headers = {'X-API-Key': 'localdev'}
    
    r = requests.post(
        'http://localhost:3000/convert',
        files=files,
        data=data,
        headers=headers
    )
    
    with open('output.png', 'wb') as out:
        out.write(r.content)
```

## 🎨 Customize Theme

Edit `frontend/index.html` untuk mengubah warna:

```css
:root {
  --primary-pink: #ff006e;      /* Main pink color */
  --primary-purple: #b60ea8;    /* Secondary purple */
  --light-pink: #ffb3d9;        /* Light pink accent */
  --dark-bg: #0f0f1e;           /* Background color */
  --card-bg: #1a1a2e;           /* Card background */
  /* ... more colors ... */
}
```

## 🐛 Common Issues & Solutions

### Error: "ffmpeg not found"
```bash
# Windows
choco install ffmpeg

# macOS
brew install ffmpeg

# Linux
sudo apt-get install ffmpeg
```

### Error: "ImageMagick not found"
```bash
# Windows
choco install imagemagick

# macOS
brew install imagemagick

# Linux
sudo apt-get install imagemagick
```

### Error: "LibreOffice not found"
```bash
# Windows
choco install libreoffice

# macOS
brew install libreoffice

# Linux
sudo apt-get install libreoffice
```

### Server tidak muncul di browser
- Pastikan server running: `npm start`
- Buka: `http://localhost:3000`
- Cek port 3000 tidak digunakan: `netstat -an | findstr :3000`

### File tidak bisa diupload
- Pastikan file tidak corrupt
- Cek ukuran file (recommended max 500MB)
- Cek disk space tersedia

## 📈 Performance Tips

1. **Increase Concurrency** untuk batch processing:
   ```bash
   set CONCURRENCY=4
   npm start
   ```

2. **Gunakan quality lebih rendah** untuk konversi cepat:
   ```json
   {"quality": 50}
   ```

3. **Monitor disk space** - cleanup otomatis setiap 60 menit

4. **Close other apps** untuk free up resources

## 🔒 Security Notes

- ✅ 100% local processing
- ✅ No cloud uploads
- ✅ No tracking
- ✅ API key support
- ✅ Input validation
- ✅ Auto file cleanup

## 📚 More Resources

- [README.md](./README.md) - Complete documentation
- [CHANGELOG.md](./CHANGELOG.md) - Version history
- [IMPROVEMENTS.md](./IMPROVEMENTS.md) - Technical improvements

## 🎯 Next Steps

1. ✅ Setup selesai
2. 📤 Try upload file
3. 🎨 Select target format
4. ⚡ Click Convert
5. ⬇️ Download hasil

Enjoy! 🎉

---

**Butuh bantuan?**
- Buka issue di repository
- Check troubleshooting section
- Read full README.md

**Like this? ⭐ Star the project!**
