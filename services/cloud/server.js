const express = require('express');
const multer = require('multer');
const cors = require('cors');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3003;

const STORAGE_DIR = path.join(__dirname, 'storage');
const META_FILE = path.join(__dirname, 'metadata.json');
const AUTH_FILE = path.join(__dirname, 'auth.json');
const MAX_STORAGE = 20 * 1024 * 1024 * 1024; // 20GB
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB per file

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });

// ============ DATA HELPERS ============

function loadMeta() {
    if (!fs.existsSync(META_FILE)) return { files: [], folders: [] };
    try {
        const data = JSON.parse(fs.readFileSync(META_FILE, 'utf-8'));
        if (Array.isArray(data)) return { files: data, folders: [] }; // migrate old format
        return data;
    } catch { return { files: [], folders: [] }; }
}

function saveMeta(data) {
    fs.writeFileSync(META_FILE, JSON.stringify(data, null, 2));
}

function getTotalUsed() {
    return loadMeta().files.reduce((sum, f) => sum + f.size, 0);
}

function loadAuth() {
    if (!fs.existsSync(AUTH_FILE)) return null;
    try { return JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8')); }
    catch { return null; }
}

function saveAuth(data) {
    fs.writeFileSync(AUTH_FILE, JSON.stringify(data, null, 2));
}

function hashValue(val) {
    return crypto.createHash('sha256').update(val).digest('hex');
}

// ============ AUTH ============

const sessions = new Map();

app.get('/api/auth/status', (req, res) => {
    const auth = loadAuth();
    const token = req.headers['x-auth-token'];
    res.json({
        isSetup: !!auth,
        isLoggedIn: token ? sessions.has(token) : false
    });
});

app.post('/api/auth/setup', (req, res) => {
    const auth = loadAuth();
    if (auth) return res.status(400).json({ error: 'Sudah di-setup' });

    const { password, pin } = req.body;
    if (!password || !pin) return res.status(400).json({ error: 'Password dan PIN wajib diisi' });

    if (!/^[A-Z0-9]+$/.test(password) || password.length < 4) {
        return res.status(400).json({ error: 'Password harus huruf besar + angka, minimal 4 karakter' });
    }
    if (!/^\d{6}$/.test(pin)) {
        return res.status(400).json({ error: 'PIN harus 6 digit angka' });
    }

    saveAuth({ password: hashValue(password), pin: hashValue(pin) });

    const token = uuidv4();
    sessions.set(token, Date.now());
    res.json({ success: true, token });
});

app.post('/api/auth/login', (req, res) => {
    const auth = loadAuth();
    if (!auth) return res.status(400).json({ error: 'Belum di-setup' });

    const { password, pin } = req.body;

    if (password && hashValue(password) === auth.password) {
        const token = uuidv4();
        sessions.set(token, Date.now());
        return res.json({ success: true, token });
    }
    if (pin && hashValue(pin) === auth.pin) {
        const token = uuidv4();
        sessions.set(token, Date.now());
        return res.json({ success: true, token });
    }

    res.status(401).json({ error: 'Password atau PIN salah' });
});

// Auth middleware
function requireAuth(req, res, next) {
    const token = req.headers['x-auth-token'];
    if (!token || !sessions.has(token)) {
        return res.status(401).json({ error: 'Silakan login terlebih dahulu' });
    }
    next();
}

// ============ MULTER ============

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, STORAGE_DIR),
    filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname))
});

const upload = multer({ storage, limits: { fileSize: MAX_FILE_SIZE } });

// ============ FOLDER API ============

app.post('/api/folder', requireAuth, (req, res) => {
    const { name, parentId } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Nama folder wajib diisi' });

    const meta = loadMeta();
    const folder = {
        id: uuidv4(),
        name: name.trim(),
        parentId: parentId || null,
        createdAt: new Date().toISOString()
    };

    meta.folders.push(folder);
    saveMeta(meta);
    res.json({ success: true, folder });
});

app.delete('/api/folder/:id', requireAuth, (req, res) => {
    const meta = loadMeta();
    const folderId = req.params.id;

    // Get all child folder IDs recursively
    function getChildIds(parentId) {
        const children = meta.folders.filter(f => f.parentId === parentId);
        let ids = [parentId];
        children.forEach(c => { ids = ids.concat(getChildIds(c.id)); });
        return ids;
    }

    const allIds = getChildIds(folderId);

    // Delete files in folder and subfolders
    meta.files = meta.files.filter(f => {
        if (allIds.includes(f.folderId)) {
            const filePath = path.join(STORAGE_DIR, f.filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return false;
        }
        return true;
    });

    // Delete folders
    meta.folders = meta.folders.filter(f => !allIds.includes(f.id));
    saveMeta(meta);
    res.json({ success: true });
});

// ============ FILE API ============

app.post('/api/upload', requireAuth, (req, res) => {
    const totalUsed = getTotalUsed();

    upload.single('file')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File terlalu besar (maks 500MB)' });
            return res.status(500).json({ error: err.message });
        }
        if (!req.file) return res.status(400).json({ error: 'Tidak ada file' });

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
            folderId: req.body.folderId || null,
            uploadedAt: new Date().toISOString()
        };

        meta.files.push(fileInfo);
        saveMeta(meta);
        res.json({ success: true, file: fileInfo });
    });
});

app.get('/api/files', requireAuth, (req, res) => {
    const meta = loadMeta();
    const folderId = req.query.folder || null;
    const files = meta.files.filter(f => (f.folderId || null) === folderId);
    const folders = meta.folders.filter(f => (f.parentId || null) === folderId);
    res.json({ files, folders });
});

app.get('/api/storage', requireAuth, (req, res) => {
    const meta = loadMeta();
    const used = meta.files.reduce((sum, f) => sum + f.size, 0);
    res.json({
        used,
        total: MAX_STORAGE,
        available: MAX_STORAGE - used,
        fileCount: meta.files.length,
        folderCount: meta.folders.length
    });
});

app.get('/api/download/:id', requireAuth, (req, res) => {
    const meta = loadMeta();
    const file = meta.files.find(f => f.id === req.params.id);
    if (!file) return res.status(404).json({ error: 'File tidak ditemukan' });

    const filePath = path.join(STORAGE_DIR, file.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File hilang dari storage' });

    res.download(filePath, file.originalName);
});

app.delete('/api/delete/:id', requireAuth, (req, res) => {
    const meta = loadMeta();
    const idx = meta.files.findIndex(f => f.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'File tidak ditemukan' });

    const file = meta.files[idx];
    const filePath = path.join(STORAGE_DIR, file.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    meta.files.splice(idx, 1);
    saveMeta(meta);
    res.json({ success: true });
});

// Folder path helper
app.get('/api/folder-path/:id', requireAuth, (req, res) => {
    const meta = loadMeta();
    const pathArr = [];
    let current = req.params.id;

    while (current) {
        const folder = meta.folders.find(f => f.id === current);
        if (!folder) break;
        pathArr.unshift({ id: folder.id, name: folder.name });
        current = folder.parentId;
    }

    res.json({ path: pathArr });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

app.listen(PORT, () => {
    console.log(`HarywangCloud running on port ${PORT}`);
});
