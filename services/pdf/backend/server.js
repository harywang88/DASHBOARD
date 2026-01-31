const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import services
const mergePDF = require('./services/merge');
const splitPDF = require('./services/split');
const compressPDF = require('./services/compress');
const convertPDF = require('./services/convert');
const { editPDF, extractTextFromPDF } = require('./services/edit');

const app = express();
const PORT = process.env.PORT || 3000;

// Create required directories
const uploadDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// Middleware
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

// Setup storage untuk upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Hanya file PDF yang diizinkan'));
        }
    }
});

// Special uploader for edit route: allow one PDF plus multiple overlay images
const uploadEdit = multer({
    storage: storage,
    limits: { fileSize: 200 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        // allow PDF for 'file' field and PNG/JPEG for 'overlays'
        if (file.fieldname === 'file' && file.mimetype === 'application/pdf') return cb(null, true);
        if (file.fieldname === 'overlays' && (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg')) return cb(null, true);
        return cb(null, false);
    }
});

// Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server PDF House berjalan dengan baik!' });
});

// MERGE PDF
app.post('/api/merge', upload.array('files', 10), async (req, res) => {
    try {
        console.log('Merge request received. Files:', req.files?.length || 0);
        
        if (!req.files || req.files.length < 2) {
            console.log('Not enough files');
            return res.status(400).json({ error: 'Minimal 2 file PDF diperlukan' });
        }

        const filePaths = req.files.map(f => f.path);
        console.log('Processing files:', filePaths);
        
        const outputPath = await mergePDF(filePaths);
        const filename = path.basename(outputPath);
        
        console.log('Merge successful:', filename);
        
        res.json({
            success: true,
            message: 'PDF berhasil digabungkan',
            file: filename,
            download: `/api/download/${filename}`
        });
    } catch (error) {
        console.error('Merge error:', error);
        res.status(500).json({ error: 'Gagal menggabungkan PDF: ' + error.message });
    }
});

// SPLIT PDF
app.post('/api/split', upload.single('file'), async (req, res) => {
    try {
        const { pages } = req.body; // Format: "1-5,7,9-10"
        
        if (!req.file) {
            return res.status(400).json({ error: 'File PDF diperlukan' });
        }
        
        if (!pages) {
            return res.status(400).json({ error: 'Masukkan halaman yang ingin diambil' });
        }

        const outputPath = await splitPDF(req.file.path, pages);
        
        res.json({
            success: true,
            message: 'PDF berhasil dibagi',
            file: path.basename(outputPath),
            download: `/api/download/${path.basename(outputPath)}`
        });
    } catch (error) {
        res.status(500).json({ error: 'Gagal membagi PDF: ' + error.message });
    }
});

// COMPRESS PDF
app.post('/api/compress', upload.single('file'), async (req, res) => {
    try {
        const { level = 'medium' } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ error: 'File PDF diperlukan' });
        }

        const outputPath = await compressPDF(req.file.path, level);
        
        res.json({
            success: true,
            message: 'PDF berhasil dikompres',
            file: path.basename(outputPath),
            download: `/api/download/${path.basename(outputPath)}`
        });
    } catch (error) {
        res.status(500).json({ error: 'Gagal mengompres PDF: ' + error.message });
    }
});

// CONVERT PDF
app.post('/api/convert', upload.single('file'), async (req, res) => {
    try {
        const { format } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ error: 'File PDF diperlukan' });
        }
        
        if (!format) {
            return res.status(400).json({ error: 'Format konversi diperlukan' });
        }

        const result = await convertPDF(req.file.path, format);
        
        if (format === 'image') {
            res.json({
                success: true,
                message: 'PDF berhasil dikonversi ke gambar',
                files: result.files,
                downloads: result.downloads
            });
        } else if (format === 'text') {
            res.json({
                success: true,
                message: 'PDF berhasil dikonversi ke teks',
                file: path.basename(result.filePath),
                download: `/api/download/${path.basename(result.filePath)}`,
                content: result.content
            });
        }
    } catch (error) {
        res.status(500).json({ error: 'Gagal mengkonversi PDF: ' + error.message });
    }
});

// EXTRACT TEXT FROM PDF
app.post('/api/extract-text', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'File PDF diperlukan' });
        }

        const pages = await extractTextFromPDF(req.file.path);
        
        // Clean up uploaded file
        try { fs.unlinkSync(req.file.path); } catch (e) {}

        res.json({
            success: true,
            pages: pages,
            totalPages: pages.length
        });
    } catch (error) {
        res.status(500).json({ error: 'Gagal extract text: ' + error.message });
    }
});

// EDIT PDF
app.post('/api/edit', uploadEdit.fields([{ name: 'file', maxCount: 1 }, { name: 'overlays', maxCount: 50 }]), async (req, res) => {
    try {
        const { page, text, fontSize = 12, color = '#000000', findText = '', replaceText = '', editMode = 'add', edits } = req.body;

        const uploadedPdf = req.files && req.files['file'] && req.files['file'][0];
        if (!uploadedPdf) {
            return res.status(400).json({ error: 'File PDF diperlukan' });
        }

        // Collect overlays (if any)
        const overlays = [];
        if (req.files && req.files['overlays']) {
            for (const f of req.files['overlays']) {
                overlays.push({ path: f.path, originalname: f.originalname });
            }
        }

        const result = await editPDF(uploadedPdf.path, {
            page: parseInt(page) || 1,
            text,
            fontSize: parseInt(fontSize),
            color,
            findText,
            replaceText,
            editMode,
            edits: edits || [],
            overlays
        });
        
        res.json({
            success: true,
            message: result.message,
            file: result.file,
            download: `/api/download/${result.file}`
        });
    } catch (error) {
        res.status(500).json({ error: 'Gagal mengedit PDF: ' + error.message });
    }
});

// DOWNLOAD FILE
app.get('/api/download/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        console.log(`Download request for: ${filename}`);
        
        // Security: prevent directory traversal
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return res.status(400).json({ error: 'Invalid filename' });
        }

        const filePath = path.join(__dirname, 'output', filename);
        
        console.log(`Looking for file at: ${filePath}`);
        console.log(`File exists: ${fs.existsSync(filePath)}`);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File tidak ditemukan' });
        }

        res.download(filePath, filename, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                return;
            }
            // Delete file after 5 minutes (allow slow downloads)
            setTimeout(() => {
                fs.unlink(filePath, (unlinkErr) => {
                    if (unlinkErr) console.error('Gagal menghapus file:', unlinkErr);
                    else console.log('File deleted:', filename);
                });
            }, 300000);
        });
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Gagal mengunduh file: ' + error.message });
    }
});

// Cleanup old files every hour
setInterval(() => {
    const uploadDir = path.join(__dirname, 'uploads');
    const outputDir = path.join(__dirname, 'output');
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    [uploadDir, outputDir].forEach(dir => {
        if (fs.existsSync(dir)) {
            fs.readdirSync(dir).forEach(file => {
                const filePath = path.join(dir, file);
                const stats = fs.statSync(filePath);
                if (stats.mtimeMs < oneHourAgo) {
                    fs.unlinkSync(filePath);
                }
            });
        }
    });
}, 60 * 60 * 1000);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: err.message || 'Terjadi kesalahan pada server' });
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`🚀 PDF House Backend berjalan di http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Error handling
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} sudah digunakan!`);
    } else {
        console.error('Server error:', error);
    }
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
