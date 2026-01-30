# 🎨 CloudConvert Local - File Converter

Modern, fast, and secure local file converter with a beautiful pink-themed UI. Convert images, videos, audio, documents, and archives - all in your browser, locally.

> 🚨 **Getting "Conversion failed" error?** Tools not installed! See [QUICK-CHECKLIST.md](QUICK-CHECKLIST.md) for 20-minute setup guide.

![Pink Theme](https://img.shields.io/badge/Theme-Pink%20Gradient-ff006e)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

- 🎨 **Beautiful UI**: Modern, smooth, responsive design with pink gradient theme
- 📁 **Drag & Drop**: Intuitive file upload with drag-and-drop support
- 🖼️ **Image Conversion**: JPG, PNG, WebP, GIF, BMP, TIFF, ICO, SVG
- 🎬 **Video Conversion**: MP4, WebM, AVI, MOV, MKV, FLV, MPEG, WMV
- 🎵 **Audio Conversion**: MP3, WAV, FLAC, AAC, OGG, M4A, OPUS, WMA
- 📄 **Document Conversion**: PDF, DOCX, XLSX, PPTX, ODT, RTF, HTML, TXT
- 📦 **Archive Conversion**: ZIP, RAR, 7Z
- ⚙️ **Advanced Options**: JSON-based settings for quality, bitrate, and more
- 📊 **Progress Tracking**: Real-time progress bar with percentage
- 🔒 **Secure**: 100% local processing, no cloud uploads
- 🚀 **Queue System**: Concurrent conversion with configurable concurrency
- 🧹 **Auto Cleanup**: Automatic removal of old files

## 📋 Requirements

Before running CloudConvert Local, install these tools on your machine:

### Windows
```powershell
# Install Node.js from https://nodejs.org

# Install ffmpeg (required for video/audio)
choco install ffmpeg

# Install ImageMagick (required for images)
choco install imagemagick

# Install LibreOffice (required for documents)
choco install libreoffice

# Install 7-Zip (optional, for 7z support)
choco install 7zip

# Install WinRAR (optional, for RAR support)
choco install winrar
```

### macOS
```bash
brew install node ffmpeg imagemagick libreoffice p7zip rar
```

### Linux (Ubuntu/Debian)
```bash
sudo apt-get install nodejs npm ffmpeg imagemagick libreoffice p7zip-full rar
```

### Linux (Fedora/RHEL)
```bash
sudo dnf install nodejs npm ffmpeg ImageMagick libreoffice p7zip p7zip-plugins rar
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd cloudconvert-local
npm install
```

### 2. Start the Server
```bash
npm start
```

Server will run on `http://localhost:3000`

### 3. Open in Browser
- Open `frontend/index.html` in your browser
- Or navigate to `http://localhost:3000` (make sure server serves frontend)

## 📖 Usage

1. **Upload a file**
   - Click the upload area or drag and drop a file
   - Supported formats: Images, Videos, Audio, Documents, Archives

2. **Select target format**
   - Browse available formats by category
   - Click to select (active format is highlighted)

3. **Configure options (optional)**
   - Add JSON options for advanced settings
   - Example: `{"quality": 80, "bitrate": "192k"}`

4. **Convert**
   - Click "Convert File" button
   - Wait for conversion to complete
   - Download converted file

## ⚙️ Configuration

Set environment variables to customize behavior:

```bash
# Set API Key (default: 'localdev')
set API_KEY=your-secret-key

# Set concurrent conversions (default: 2)
set CONCURRENCY=4

# Set cleanup interval in minutes (default: 60)
set CLEANUP_MINUTES=30

# Then start server
npm start
```

### Example (PowerShell)
```powershell
$env:API_KEY = "localdev"
$env:CONCURRENCY = "2"
$env:CLEANUP_MINUTES = "60"
npm start
```

### Example (Linux/macOS)
```bash
export API_KEY=localdev
export CONCURRENCY=2
export CLEANUP_MINUTES=60
npm start
```

## 🔌 API

### POST /convert
Convert a file to target format.

**Headers:**
- `X-API-Key`: API key (optional if API_KEY=localdev)

**Body (multipart/form-data):**
- `file`: File to convert (required)
- `targetFormat`: Target format (required) - e.g., "mp4", "pdf", "png"
- `options`: JSON string with conversion options (optional)

**Response:**
- Success: Downloaded file with appropriate content-type
- Error: JSON with error message

**Example:**
```bash
curl -X POST http://localhost:3000/convert \
  -H "X-API-Key: localdev" \
  -F "file=@input.jpg" \
  -F "targetFormat=png" \
  -F "options={\"quality\":85}" \
  -o output.png
```

### GET /health
Check server health status.

**Response:**
```json
{
  "status": "ok"
}
```

## 🎨 Customization

### Change Theme Colors
Edit `frontend/index.html` and modify CSS variables in `:root`:

```css
:root {
  --primary-pink: #ff006e;
  --primary-purple: #b60ea8;
  --light-pink: #ffb3d9;
  /* ... other colors ... */
}
```

### Add More Formats
1. Add format to `frontend/index.html` format buttons
2. Add support in `services/convert.js` format arrays
3. Implement conversion logic using appropriate tool

## 📁 Project Structure

```
cloudconvert-local/
├── server.js              # Express server
├── frontend/
│   └── index.html        # Beautiful React-like UI
├── services/
│   ├── convert.js        # Conversion engine
│   ├── queue.js          # Job queue system
│   └── utils.js          # Utility functions
├── uploads/              # Temporary file storage
├── test-files/           # Sample files for testing
├── tools/
│   └── run_local_convert.js
├── package.json
├── README.md
└── IMPROVEMENTS.md
```

## 🛡️ Security

- **Local Processing**: All conversions happen locally, no cloud uploads
- **API Key**: Optional authentication via `X-API-Key` header
- **Input Validation**: Strict format and option validation
- **File Cleanup**: Automatic removal of old temporary files
- **No External Calls**: No external API calls or trackers

## 🐛 Troubleshooting

### "ImageMagick not found"
- Ensure ImageMagick is installed and in PATH
- Windows: `magick` or `convert` command
- Linux/Mac: `convert` or `magick` command

### "ffmpeg not found"
- Install ffmpeg: `sudo apt-get install ffmpeg` (Linux) or `brew install ffmpeg` (Mac)

### "LibreOffice not found"
- Install LibreOffice: `sudo apt-get install libreoffice` (Linux)
- Ensure `soffice` command is available in PATH

### Conversion fails with "invalid format"
- Check supported formats in the UI
- Verify input file is not corrupted
- Check conversion logs for detailed errors

### Files not being cleaned up
- Verify `CLEANUP_MINUTES` environment variable is set
- Check permissions on `uploads/` folder
- Check available disk space

## 📊 Performance Tips

1. **Increase Concurrency**: Set `CONCURRENCY=4` or higher for faster batch processing
2. **Optimize File Size**: Large files take longer to convert
3. **Use Appropriate Quality**: Lower quality settings = faster conversion
4. **Monitor Resources**: CPU and memory usage increase with concurrent tasks

## 🤝 Contributing

Feel free to:
- Report bugs and issues
- Suggest new features
- Improve documentation
- Optimize code

## 📝 License

MIT License - Feel free to use for personal and commercial projects.

## 🎯 Future Enhancements

- [ ] User authentication and accounts
- [ ] Conversion history
- [ ] Batch upload and download
- [ ] Preset conversion profiles
- [ ] File preview before conversion
- [ ] Cloud storage integration (optional)
- [ ] REST API documentation with Swagger
- [ ] Docker containerization

---

**Made with ❤️ and lots of pink.**

For support and more info, visit [cloudconvert.com](https://cloudconvert.com)