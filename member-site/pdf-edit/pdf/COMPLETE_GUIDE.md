# 📄 PDF House - Complete Installation & Usage Guide

## 🎯 Project Overview

**PDF House** adalah aplikasi SaaS lengkap untuk manipulasi PDF dengan fitur editing teks, merge, split, compress, convert, dan banyak lagi.

**Status**: ✅ Production Ready (v1.0.0)  
**Last Updated**: January 27, 2026

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Installation](#installation)
3. [CLI Tools](#cli-tools)
4. [Features](#features)
5. [API Reference](#api-reference)
6. [Management Tools](#management-tools)
7. [Troubleshooting](#troubleshooting)
8. [Project Structure](#project-structure)

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 14.0
- npm >= 6.0
- Windows/Mac/Linux

### Installation & Run

```bash
# 1. Navigate to backend
cd backend

# 2. Install dependencies (if not already installed)
npm install

# 3. Start server
npm start

# 4. Open in browser
# http://localhost:3000
```

**Expected Output:**
```
🚀 PDF House Backend berjalan di http://localhost:3000
Environment: development
```

---

## 📦 Installation Details

### Step 1: Clone/Download Project
```bash
cd c:\harywang\pdf-saas
```

### Step 2: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 3: Configure Environment
The `.env` file is already configured with:
```
NODE_ENV=development
PORT=3000
MAX_FILE_SIZE=100mb
MAX_FILES=10
COMPRESSION_LEVEL=medium
```

### Step 4: Start Server
```bash
npm start
# or for development with auto-reload:
npm run dev
```

---

## 🛠️ CLI Tools

### 1. Interactive CLI Menu

Start the comprehensive interactive menu:

```bash
npm run cli
# or
node cli.js
```

**Main Menu Options:**
```
1. 📄 PDF Operations
   - Merge PDFs
   - Split PDF pages
   - Compress PDF
   - Convert PDF to images
   - Extract text
   - Add text
   - Add images

2. 🔧 Server Management
   - Start/Stop/Restart server
   - View logs
   - Health check

3. 📊 Monitoring & Status
   - System status
   - Server metrics
   - Disk usage
   - Cleanup temp files
   - View configuration

4. 🛠️  Utilities & Tools
   - Run tests
   - Validate installation
   - Check dependencies
   - Install dependencies
   - Generate report
   - Batch process PDFs

5. 📚 Help & Documentation
   - View comprehensive help
   - Command reference
```

### 2. Management Tools

Check server health and system status:

```bash
# Check server health
npm run health
# or
node tools.js health

# Get system status
node tools.js stats

# Get directory stats
node tools.js dirs

# Get full report
node tools.js report

# Cleanup old files (older than 1 hour)
npm run cleanup
node tools.js cleanup [hours]

# Clear all temp files
node tools.js clear

# Validate dependencies
node tools.js deps

# Show configuration
node tools.js config

# List API endpoints
node tools.js endpoints

# Monitor server (real-time)
npm run monitor
node tools.js monitor [interval_ms]
```

**Example Outputs:**

```bash
$ node tools.js health
{
  "status": "Server PDF House berjalan dengan baik!"
}

$ node tools.js stats
{
  "uptime": 3600.5,
  "memory": { heapUsed: 45000000, ... },
  "platform": "win32",
  "arch": "x64",
  "nodeVersion": "v16.13.0",
  "pid": 12345
}
```

### 3. Batch Processing

Process multiple PDFs at once:

```bash
npm run batch compress ./input_pdfs
npm run batch extract ./input_pdfs ./text_output
npm run batch merge ./input_pdfs ./merged_output
npm run batch convert ./input_pdfs ./images
npm run batch info ./input_pdfs

# or directly
node batch.js compress ./path/to/pdfs
node batch.js extract ./input_dir ./output_dir
node batch.js merge ./input_dir ./output_dir
node batch.js convert ./input_dir ./output_dir [format]
node batch.js info ./input_dir
```

**Example Batch Processing:**

```bash
# Compress all PDFs in a folder
$ node batch.js compress ./documents

📦 Starting batch compression...

Compressing: document1.pdf
  ✓ Compressed
Compressing: document2.pdf
  ✓ Compressed
Compressing: document3.pdf
  ✓ Compressed

==================================================
📊 BATCH PROCESSING REPORT
==================================================
{
  "timestamp": "2026-01-27T10:30:00.000Z",
  "operation": "compress",
  "summary": {
    "total": 3,
    "success": 3,
    "failed": 0,
    "successRate": "100.00%"
  },
  "details": [...]
}

✅ Report saved to: ./output/report-1643270400000.json
```

### 4. Validation & Testing

```bash
# Run full validation
npm run validate
node validate.js

# Run server test
npm test
node test-health.js

# Run quick server test
node test-server.js
```

---

## ✨ Features

### Core Features (31 Total)

#### Text Editing (9 features)
- ✅ Add Text - Click to add new text
- ✅ Edit Text - Select and modify text
- ✅ Find & Replace - Search and replace text
- ✅ Batch Edit - Multiple edits at once
- ✅ Multi-page Support - Edit across pages
- ✅ Extract Text - Get text from PDF
- ✅ Smart Detection - Auto-detect text
- ✅ Statistics - Text statistics panel
- ✅ Real-time Preview - Live preview

#### Text Formatting (5 features)
- ✅ Font Selection - Choose from 4 fonts
- ✅ Font Sizing - Adjustable sizes
- ✅ Font Styling - Bold, Italic, Underline
- ✅ Color Picker - Full color support
- ✅ Alignment - Left, Center, Right

#### Advanced Tools (5 features)
- ✅ Drawing - Freehand drawing
- ✅ Signatures - Sign documents
- ✅ Stamps - Pre-made stamps
- ✅ Image Insert - Add images
- ✅ Keyboard Shortcuts - Fast operations

#### Session Management (4 features)
- ✅ Undo/Redo - Full history
- ✅ Export/Import - Save sessions
- ✅ Auto-save - Automatic saving
- ✅ Status Tracking - Track changes

#### PDF Operations (5 features)
- ✅ Merge - Combine PDFs
- ✅ Split - Extract pages
- ✅ Compress - Reduce size
- ✅ Convert - PDF to images
- ✅ Download - Save files

#### Backend (3 features)
- ✅ Font Embedding - Support for fonts
- ✅ Error Handling - Robust error handling
- ✅ Auto-cleanup - Automatic file cleanup

---

## 🌐 Web Interface

### Access the Web UI
```
http://localhost:3000
```

### Main Operations

1. **Upload PDF** - Click upload button
2. **Add/Edit Text** - Use text editor
3. **Apply Formatting** - Bold, italic, color, size
4. **Save/Download** - Export your PDF

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+C` | Copy |
| `Ctrl+D` | Duplicate |
| `Delete` | Delete selected |
| `Escape` | Cancel |

---

## 📡 API Reference

### Base URL
```
http://localhost:3000
```

### Endpoints

#### Health Check
```bash
GET /api/health

Response:
{
  "status": "Server PDF House berjalan dengan baik!"
}
```

#### Merge PDFs
```bash
POST /api/merge

Body (multipart/form-data):
- files: [file1.pdf, file2.pdf, ...]

Response:
{
  "success": true,
  "message": "PDF berhasil digabungkan",
  "file": "merged-1643270400000.pdf",
  "download": "/api/download/merged-1643270400000.pdf"
}
```

#### Split PDF
```bash
POST /api/split

Body (multipart/form-data):
- file: document.pdf
- pages: "1-5,7,9-10"

Response:
{
  "success": true,
  "message": "PDF berhasil dibagi",
  "file": "split-1643270400000.pdf",
  "download": "/api/download/split-1643270400000.pdf"
}
```

#### Compress PDF
```bash
POST /api/compress

Body (multipart/form-data):
- file: document.pdf
- level: "medium" (low, medium, high)

Response:
{
  "success": true,
  "message": "PDF berhasil dikompres",
  "file": "compressed-1643270400000.pdf",
  "download": "/api/download/compressed-1643270400000.pdf"
}
```

#### Convert PDF
```bash
POST /api/convert

Body (multipart/form-data):
- file: document.pdf
- format: "png" (png, jpeg, webp)

Response:
{
  "success": true,
  "message": "PDF berhasil dikonversi",
  "file": "converted-1643270400000",
  "download": "/api/download/converted-1643270400000"
}
```

#### Extract Text
```bash
POST /api/extract-text

Body (multipart/form-data):
- file: document.pdf

Response:
{
  "success": true,
  "pages": [...],
  "totalPages": 3,
  "fullText": "All extracted text",
  "totalTextLength": 5000
}
```

#### Edit PDF
```bash
POST /api/edit

Body (multipart/form-data):
- file: document.pdf
- editMode: "add|replace|batch"
- text: "New text"
- fontSize: 12
- color: "#000000"
- page: 1

Response:
{
  "success": true,
  "message": "PDF berhasil diedit",
  "file": "edited-1643270400000.pdf",
  "download": "/api/download/edited-1643270400000.pdf"
}
```

#### Download File
```bash
GET /api/download/:filename

Response: Binary PDF file
```

---

## 🔧 Management Tools

### Directory Structure

```
pdf-saas/
├── backend/
│   ├── server.js              # Main server file
│   ├── cli.js                 # Interactive CLI menu
│   ├── tools.js               # Management tools
│   ├── batch.js               # Batch processor
│   ├── validate.js            # Validation script
│   ├── test-health.js         # Health test
│   ├── test-server.js         # Server test
│   ├── .env                   # Configuration
│   ├── package.json           # Dependencies
│   ├── services/
│   │   ├── merge.js           # Merge service
│   │   ├── split.js           # Split service
│   │   ├── compress.js        # Compress service
│   │   ├── convert.js         # Convert service
│   │   └── edit.js            # Edit service
│   ├── uploads/               # Temp uploads
│   ├── output/                # Output files
│   └── logs/                  # Log files
├── frontend/
│   └── index.html             # Web interface
├── README.md                  # This file
├── FEATURES.md                # Features list
├── TESTING.md                 # Testing guide
```

### Configuration Files

#### .env
```
NODE_ENV=development
PORT=3000
MAX_FILE_SIZE=100mb
MAX_FILES=10
UPLOAD_TIMEOUT=300000
COMPRESSION_LEVEL=medium
AUTO_CLEANUP_HOURS=1
CORS_ORIGIN=*
LOG_LEVEL=info
```

#### package.json Scripts
```json
{
  "scripts": {
    "start": "npm start",                    // Start server
    "dev": "nodemon server.js",              // Dev mode with auto-reload
    "cli": "node cli.js",                    // Interactive CLI
    "tools": "node tools.js",                // Management tools
    "batch": "node batch.js",                // Batch processor
    "validate": "node validate.js",          // Validation
    "test": "node test-health.js",           // Health test
    "monitor": "node tools.js monitor",      // Monitor server
    "cleanup": "node tools.js cleanup",      // Cleanup temp files
    "health": "node tools.js health"         // Check health
  }
}
```

---

## 🚨 Troubleshooting

### Problem: Server won't start

**Solution:**
```bash
# Check if port is in use
netstat -ano | findstr :3000

# Kill existing process
taskkill /F /IM node.exe

# Restart server
npm start
```

### Problem: "Cannot find module" error

**Solution:**
```bash
# Reinstall dependencies
npm install

# or update them
npm update
```

### Problem: File upload fails

**Solution:**
```bash
# Check upload directory permissions
ls -la backend/uploads/

# Clear temp files
npm run cleanup

# Increase file size limit in .env
MAX_FILE_SIZE=200mb
```

### Problem: Server responds but operations fail

**Solution:**
```bash
# Validate installation
npm run validate

# Check dependencies
node tools.js deps

# View server logs
npm run dev  # Run in dev mode to see logs
```

### Problem: Out of memory

**Solution:**
```bash
# Clear temp files
node tools.js clear

# Restart server
npm start

# Process smaller files
# Split large PDFs first
node batch.js split ./large_pdfs ./split_output
```

---

## 📊 System Monitoring

### Monitor Server in Real-time

```bash
npm run monitor

# Output:
# [10:30:45] ✅ Server OK | Memory: 45.23 MB
# [10:30:50] ✅ Server OK | Memory: 45.45 MB
# [10:30:55] ✅ Server OK | Memory: 45.67 MB
```

### Get System Report

```bash
node tools.js report

{
  "timestamp": "2026-01-27T10:30:00.000Z",
  "systemStats": {
    "uptime": 3600.5,
    "memory": {...},
    "platform": "win32",
    "arch": "x64"
  },
  "uploadDir": {
    "files": 5,
    "size": 52428800,
    "sizeInMB": "50.00"
  },
  "outputDir": {
    "files": 3,
    "size": 10485760,
    "sizeInMB": "10.00"
  },
  "serverHealth": {
    "status": "Server PDF House berjalan dengan baik!"
  }
}
```

### Cleanup Old Files

```bash
# Clean files older than 1 hour
npm run cleanup

# Clean files older than 24 hours
node tools.js cleanup 24

# Clear all temp files
node tools.js clear
```

---

## 🧪 Testing

### Run Validation

```bash
npm run validate

# Output:
# 1️⃣  Checking file structure... ✅ PASSED
# 2️⃣  Checking module dependencies... ✅ PASSED
# 3️⃣  Checking edit.js exports... ✅ PASSED
# ... etc
```

### Run Health Test

```bash
npm test
node test-health.js
```

### Test Specific Endpoint

```bash
# Using curl
curl http://localhost:3000/api/health

# Using PowerShell
Invoke-WebRequest http://localhost:3000/api/health

# Using Node.js
node test-server.js
```

---

## 📚 Common Use Cases

### Use Case 1: Merge Multiple PDFs

**CLI Method:**
```bash
npm run cli
# Select: 1 > 1 (PDF Operations > Merge)
# Enter file paths
```

**Batch Method:**
```bash
node batch.js merge ./input_pdfs ./output
```

**API Method:**
```bash
curl -X POST http://localhost:3000/api/merge \
  -F "files=@file1.pdf" \
  -F "files=@file2.pdf"
```

### Use Case 2: Extract All Text from Folder

```bash
node batch.js extract ./documents ./extracted_text

# All text will be saved as .txt files in extracted_text folder
```

### Use Case 3: Compress Large PDF

**CLI Method:**
```bash
npm run cli
# Select: 1 > 3 (Compress)
# Enter file path and compression level
```

### Use Case 4: Monitor Server Performance

```bash
npm run monitor

# Real-time monitoring with memory usage
```

### Use Case 5: Generate System Report

```bash
node tools.js report > system_report.json

# Full system and server status report
```

---

## 🔐 Security Notes

1. **File Uploads**: Max 100MB (configurable in .env)
2. **CORS**: Enabled for all origins (configure in server.js for production)
3. **File Cleanup**: Automatic cleanup every hour
4. **Error Handling**: Errors logged without sensitive info

---

## 📞 Support & Resources

- **README.md** - This file
- **FEATURES.md** - Complete feature list
- **TESTING.md** - Testing guide
- **Code Comments** - In-line code documentation

---

## 📝 Version History

### v1.0.0 (January 27, 2026)
- ✅ Complete CLI menu system
- ✅ Management tools (tools.js)
- ✅ Batch processor (batch.js)
- ✅ All PDF operations
- ✅ Web interface
- ✅ API endpoints
- ✅ Monitoring & logging

---

## 📄 License

MIT License - Free to use and modify

---

## 🙏 Credits

Built with:
- Express.js - Web framework
- pdf-lib - PDF manipulation
- pdfkit - PDF generation
- sharp - Image processing
- multer - File uploads

---

**Last Updated**: January 27, 2026  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
