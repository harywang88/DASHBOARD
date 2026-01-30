const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3003;

const STORAGE_DIR = path.join(__dirname, 'storage');
const META_FILE = path.join(__dirname, 'metadata.json');
const MAX_STORAGE = 20 * 1024 * 1024 * 1024; // 20GB
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB per file

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// Ensure directories exist
if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });

// Metadata helpers
function loadMeta() {
    if (!fs.existsSync(META_FILE)) return [];
    try { return JSON.parse(fs.readFileSync(META_FILE, 'utf-8')); }
    catch { return []; }
}

function saveMeta(data) {
    fs.writeFileSync(META_FILE, JSON.stringify(data, null, 2));
}

function getTotalUsed() {
    const files = loadMeta();
    return files.reduce((sum, f) => sum + f.size, 0);
}

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, STORAGE_DIR),
    filename: (req, file, cb) => {
        const id = uuidv4();
        const ext = path.extname(file.originalname);
        cb(null, id + ext);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE }
});

// Upload file
app.post('/api/upload', (req, res) => {
    const totalUsed = getTotalUsed();

    upload.single('file')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).json({ error: 'File terlalu besar (maks 500MB)' });
            }
            return res.status(500).json({ error: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Tidak ada file' });
        }

        if (totalUsed + req.file.size > MAX_STORAGE) {
            fs.unlinkSync(req.file.path);
            return res.status(507).json({ error: 'Storage penuh (maks 20GB)' });
        }

        const meta = loadMeta();
        const fileInfo = {
            id: path.parse(req.file.filename).name,
            originalName: req.file.originalname,
            filename: req.file.filename,
            size: req.file.size,
            mimetype: req.file.mimetype,
            uploadedAt: new Date().toISOString()
        };

        meta.push(fileInfo);
        saveMeta(meta);

        res.json({ success: true, file: fileInfo });
    });
});

// List files
app.get('/api/files', (req, res) => {
    const meta = loadMeta();
    res.json({ files: meta });
});

// Storage info
app.get('/api/storage', (req, res) => {
    const used = getTotalUsed();
    res.json({
        used,
        total: MAX_STORAGE,
        available: MAX_STORAGE - used,
        fileCount: loadMeta().length
    });
});

// Download file
app.get('/api/download/:id', (req, res) => {
    const meta = loadMeta();
    const file = meta.find(f => f.id === req.params.id);

    if (!file) return res.status(404).json({ error: 'File tidak ditemukan' });

    const filePath = path.join(STORAGE_DIR, file.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File hilang dari storage' });

    res.download(filePath, file.originalName);
});

// Delete file
app.delete('/api/delete/:id', (req, res) => {
    const meta = loadMeta();
    const idx = meta.findIndex(f => f.id === req.params.id);

    if (idx === -1) return res.status(404).json({ error: 'File tidak ditemukan' });

    const file = meta[idx];
    const filePath = path.join(STORAGE_DIR, file.filename);

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    meta.splice(idx, 1);
    saveMeta(meta);

    res.json({ success: true });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

app.listen(PORT, () => {
    console.log(`HarywangCloud running on port ${PORT}`);
});
