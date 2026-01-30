# 📄 PDF House - Advanced PDF Editor & Management Suite

> Professional-grade PDF manipulation platform with comprehensive CLI tools, batch processing, and real-time monitoring

**Version**: 1.0.0 | **Status**: ✅ Production Ready  
**Last Updated**: January 27, 2026

---

## 🎯 What is PDF House?

PDF House is a complete, enterprise-ready solution for PDF manipulation offering:

✅ **Web-based GUI** - Intuitive interface for editing PDFs  
✅ **Command-line Tools** - Powerful CLI for automation  
✅ **Batch Processing** - Process multiple PDFs efficiently  
✅ **Server Management** - Monitor and control your server  
✅ **30+ Features** - Comprehensive PDF tools

---

## 🚀 Quick Start (30 seconds)

### 1. Start Server
```bash
cd backend
npm install
npm start
```

Expected output:
```
🚀 PDF House Backend berjalan di http://localhost:3000
Environment: development
```

### 2. Open in Browser
```
http://localhost:3000
```

### 3. Use CLI Tools
```bash
npm run cli          # Interactive menu
npm run batch        # Batch operations
npm run health       # Check server health
```

---

## 📁 Project Structure

```
pdf-saas/
├── 📘 COMPLETE_GUIDE.md          ← Comprehensive guide (READ THIS!)
├── 📗 README.md                  ← Project overview
├── 📕 FEATURES.md                ← Feature list
├── 📙 TESTING.md                 ← Testing guide
│
├── backend/                      ← Main application
│   ├── 🚀 server.js              ← Express server
│   ├── 🎯 cli.js                 ← Interactive CLI menu
│   ├── 🛠️  tools.js              ← Management tools
│   ├── 📦 batch.js               ← Batch processor
│   ├── 🧪 validate.js            ← Validation
│   ├── 📋 start.js               ← Startup menu
│   ├── .env                      ← Configuration
│   ├── package.json              ← Dependencies
│   │
│   ├── services/                 ← Core services
│   │   ├── merge.js              ← Merge PDFs
│   │   ├── split.js              ← Split pages
│   │   ├── compress.js           ← Compress files
│   │   ├── convert.js            ← Convert formats
│   │   └── edit.js               ← Edit PDFs
│   │
│   ├── uploads/                  ← Temp uploads
│   ├── output/                   ← Generated files
│   └── logs/                     ← Server logs
│
└── frontend/                     ← Web interface
    └── index.html
```

---

## 🎮 How to Use

### Option 1: Web Interface (GUI)

Perfect for visual users:

1. **Start Server**: `cd backend && npm start`
2. **Open Browser**: `http://localhost:3000`
3. **Upload PDF** and use the interface to:
   - Add/Edit text
   - Apply formatting
   - Add images
   - Draw/sign
   - Download result

### Option 2: Interactive CLI Menu

Best for structured workflows:

```bash
cd backend
npm run cli
```

Navigate through:
- 📄 PDF Operations
- 🔧 Server Management
- 📊 Monitoring
- 🛠️  Utilities
- 📚 Documentation

### Option 3: Command-Line Tools

For automation and scripting:

```bash
# Individual operations
node tools.js health              # Check server
node batch.js compress ./pdfs     # Compress all PDFs
npm run monitor                   # Monitor server

# Management
npm run validate                  # Full validation
npm run cleanup                   # Clean temp files
npm run health                    # Quick health check
```

### Option 4: Startup Menu

One-command interface:

```bash
npm run menu
```

Choose from:
1. Start Server
2. Start Server + CLI
3. Start Server + Monitoring
4. Run Tests
5. Check Health
6. View Guide

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| **COMPLETE_GUIDE.md** | 📖 **START HERE!** Full documentation with examples |
| README.md | Project overview and status |
| FEATURES.md | Complete feature list (30+ features) |
| TESTING.md | Testing procedures and examples |

---

## 🛠️ Tools Overview

### 1. **CLI Menu** (`npm run cli`)

Interactive menu-driven interface:
- All PDF operations
- Server management
- Real-time monitoring
- Batch processing
- System utilities

**Ideal for**: Users who want guided workflows

### 2. **Management Tools** (`node tools.js`)

Direct commands for system management:

```bash
node tools.js health              # Server health
node tools.js stats               # System stats
node tools.js report              # Full report
node tools.js cleanup [hours]     # Clean old files
node tools.js monitor [interval]  # Real-time monitor
node tools.js deps                # Check dependencies
node tools.js config              # Show config
```

**Ideal for**: Automation and scripting

### 3. **Batch Processor** (`node batch.js`)

Process multiple files at once:

```bash
node batch.js compress ./pdfs        # Compress all
node batch.js extract ./pdfs ./text  # Extract text
node batch.js merge ./pdfs ./merged  # Merge files
node batch.js convert ./pdfs ./imgs  # Convert format
```

**Ideal for**: Handling large numbers of files

### 4. **Validation** (`npm run validate`)

Check if everything is working:

```bash
npm run validate

Output:
✅ File structure: PASSED
✅ Dependencies: PASSED
✅ Server config: PASSED
✅ Frontend: PASSED
```

**Ideal for**: Troubleshooting

---

## 🎯 Common Tasks

### Task 1: Merge Multiple PDFs

**GUI Method:**
- Open http://localhost:3000
- Use interface

**CLI Method:**
```bash
npm run cli
# Select: 1 > 1 (PDF Operations > Merge)
```

**Command Method:**
```bash
node batch.js merge ./input_pdfs ./output
```

### Task 2: Extract Text from All PDFs in Folder

```bash
node batch.js extract ./documents ./extracted_text
```

### Task 3: Compress All PDFs

```bash
node batch.js compress ./large_pdfs ./compressed
```

### Task 4: Monitor Server Performance

```bash
npm run monitor

# Real-time output:
# [10:30:45] ✅ Server OK | Memory: 45.23 MB
# [10:30:50] ✅ Server OK | Memory: 45.45 MB
```

### Task 5: Generate System Report

```bash
node tools.js report > report.json
```

---

## 📊 Features (31 Total)

### Text Editing
- ✅ Add text
- ✅ Edit existing text
- ✅ Find & Replace
- ✅ Batch editing
- ✅ Multi-page support
- ✅ Extract text
- ✅ Auto-detect text
- ✅ Text statistics
- ✅ Real-time preview

### Formatting
- ✅ Font selection (4 fonts)
- ✅ Font sizing
- ✅ Bold, Italic, Underline
- ✅ Color picker
- ✅ Text alignment

### Advanced Tools
- ✅ Drawing
- ✅ Signatures
- ✅ Stamps
- ✅ Image insertion
- ✅ Keyboard shortcuts

### PDF Operations
- ✅ Merge
- ✅ Split
- ✅ Compress
- ✅ Convert
- ✅ Download

### Session Management
- ✅ Undo/Redo
- ✅ Export/Import
- ✅ Auto-save
- ✅ Status tracking

### Backend
- ✅ Font embedding
- ✅ Error handling
- ✅ Auto-cleanup

---

## 🔌 API Reference

All operations available via REST API:

```bash
# Health check
GET /api/health

# Merge PDFs
POST /api/merge

# Split PDF
POST /api/split

# Compress PDF
POST /api/compress

# Convert PDF
POST /api/convert

# Extract text
POST /api/extract-text

# Edit PDF
POST /api/edit

# Download
GET /api/download/:filename
```

See **COMPLETE_GUIDE.md** for full API documentation with examples.

---

## ⚙️ Configuration

Edit `backend/.env`:

```env
NODE_ENV=development
PORT=3000
MAX_FILE_SIZE=100mb
MAX_FILES=10
COMPRESSION_LEVEL=medium
AUTO_CLEANUP_HOURS=1
```

---

## 🧪 Testing & Validation

### Run All Tests
```bash
npm run validate
```

### Check Specific Components
```bash
npm run health              # Server health
npm run test                # Basic test
node test-server.js         # Server connectivity
```

### Validate Installation
```bash
node tools.js deps          # Dependencies
node tools.js config        # Configuration
npm run validate            # Complete validation
```

---

## 🚨 Troubleshooting

### Server won't start
```bash
# Kill existing process
taskkill /F /IM node.exe

# Try again
npm start
```

### Cannot find module
```bash
npm install
npm update
```

### Out of memory
```bash
# Clean temp files
npm run cleanup

# Restart server
npm start
```

### File upload fails
```bash
# Check permissions
# Increase size limit in .env
MAX_FILE_SIZE=200mb
```

See **COMPLETE_GUIDE.md** for more troubleshooting.

---

## 🎯 Next Steps

1. **Read Documentation**: Open `COMPLETE_GUIDE.md`
2. **Start Server**: `cd backend && npm start`
3. **Choose Method**:
   - Use web interface: http://localhost:3000
   - Use CLI: `npm run cli`
   - Use commands: `npm run batch`
4. **Process Your PDFs**
5. **Check Guide for Advanced Features**

---

## 📝 NPM Scripts

```json
{
  "start": "node server.js",        // Start server
  "dev": "nodemon server.js",       // Dev with auto-reload
  "cli": "node cli.js",             // Interactive menu
  "tools": "node tools.js",         // Management tools
  "batch": "node batch.js",         // Batch processor
  "validate": "node validate.js",   // Validation
  "test": "node test-health.js",    // Health test
  "monitor": "node tools.js monitor", // Monitor
  "cleanup": "node tools.js cleanup",  // Cleanup
  "health": "node tools.js health",    // Quick health
  "menu": "node start.js"            // Startup menu
}
```

---

## 💡 Pro Tips

1. **Batch Processing**: Use `node batch.js` for large operations
2. **Monitoring**: Use `npm run monitor` to watch server
3. **Automation**: Use management tools for scripts
4. **Reports**: Generate reports with `node tools.js report`
5. **Cleanup**: Schedule `npm run cleanup` to prevent disk fill

---

## 📞 Support

- **Documentation**: See COMPLETE_GUIDE.md
- **Code Comments**: Check JavaScript files for in-line docs
- **Validation**: Run `npm run validate`
- **Logs**: Check `backend/logs/` for details

---

## 🎓 Learning Path

1. **Beginner**: Use web interface at http://localhost:3000
2. **Intermediate**: Try CLI menu with `npm run cli`
3. **Advanced**: Use command-line tools with `node batch.js`
4. **Expert**: Write custom scripts using tools.js and batch.js modules

---

## 📄 License

MIT License - Free to use and modify

---

## 🎉 Quick Command Reference

```bash
# Get started
cd backend
npm install
npm start

# Use CLI
npm run cli              # Interactive menu
npm run menu             # Startup menu

# Manage server
npm run health           # Check health
npm run monitor          # Monitor
npm run cleanup          # Clean temp files

# Process files
npm run batch compress ./pdfs
npm run batch extract ./pdfs ./output
npm run batch merge ./pdfs ./merged

# Development
npm run dev              # Auto-reload
npm run validate         # Full validation
npm test                 # Test server
```

---

## ✨ Version Info

**v1.0.0** - January 27, 2026
- ✅ Complete CLI system
- ✅ Management tools
- ✅ Batch processor
- ✅ Web interface
- ✅ Full API
- ✅ Monitoring
- ✅ Documentation

---

**Ready to start?** → Open `COMPLETE_GUIDE.md`

**Want quick demo?** → `npm run menu`

**Need help?** → See TESTING.md and FEATURES.md
