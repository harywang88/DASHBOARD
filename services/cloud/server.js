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
        if (Array.isArray(data)) return { files: data, folders: [] };
        return data;
    } catch { return { files: [], folders: [] }; }
}

function saveMeta(data) {
    fs.writeFileSync(META_FILE, JSON.stringify(data, null, 2));
}

function getTotalUsed() {
    return loadMeta().files.reduce((sum, f) => sum + f.size, 0);
}

function hashValue(val) {
    return crypto.createHash('sha256').update(val).digest('hex');
}

// ============ FOLDER SESSIONS ============

const folderSessions = new Map(); // token -> { folderId }

function isFolderUnlocked(folderId, token) {
    if (!token) return false;
    const session = folderSessions.get(token);
    return session && session.folderId === folderId;
}

// Middleware: check folder access for protected folders
function checkFolderAccess(req, res, next) {
    const folderId = req.query.folder || req.body.folderId || null;
    if (!folderId) { next(); return; }

    const meta = loadMeta();
    const folder = meta.folders.find(f => f.id === folderId);
    if (!folder) { next(); return; }
    if (!folder.authHash) { next(); return; } // no auth on this folder

    const token = req.headers['x-folder-token'];
    if (isFolderUnlocked(folderId, token)) { next(); return; }

    return res.status(403).json({ error: 'Folder terkunci. Silakan unlock terlebih dahulu.' });
}

// ============ MULTER ============

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, STORAGE_DIR),
    filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname))
});

const upload = multer({ storage, limits: { fileSize: MAX_FILE_SIZE } });

// ============ FOLDER API ============

app.post('/api/folder', (req, res) => {
    const { name, parentId, authType, authValue } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Nama folder wajib diisi' });

    if (!authType || !authValue) {
        return res.status(400).json({ error: 'Pilih password atau PIN untuk folder' });
    }

    if (authType === 'password') {
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(authValue)) {
            return res.status(400).json({ error: 'Password harus huruf besar, kecil, dan angka, minimal 8 karakter' });
        }
    } else if (authType === 'pin') {
        if (!/^\d{6}$/.test(authValue)) {
            return res.status(400).json({ error: 'PIN harus 6 digit angka' });
        }
    } else {
        return res.status(400).json({ error: 'authType harus "password" atau "pin"' });
    }

    // If creating inside a protected folder, check access
    if (parentId) {
        const meta = loadMeta();
        const parent = meta.folders.find(f => f.id === parentId);
        if (parent && parent.authHash) {
            const token = req.headers['x-folder-token'];
            if (!isFolderUnlocked(parentId, token)) {
                return res.status(403).json({ error: 'Folder induk terkunci' });
            }
        }
    }

    const meta = loadMeta();
    const folder = {
        id: uuidv4(),
        name: name.trim(),
        parentId: parentId || null,
        authType,
        authHash: hashValue(authValue),
        createdAt: new Date().toISOString()
    };

    meta.folders.push(folder);
    saveMeta(meta);

    // Auto-unlock newly created folder
    const token = uuidv4();
    folderSessions.set(token, { folderId: folder.id });

    res.json({ success: true, folder: { id: folder.id, name: folder.name, parentId: folder.parentId, authType: folder.authType, createdAt: folder.createdAt }, folderToken: token });
});

app.post('/api/folder/:id/unlock', (req, res) => {
    const meta = loadMeta();
    const folder = meta.folders.find(f => f.id === req.params.id);
    if (!folder) return res.status(404).json({ error: 'Folder tidak ditemukan' });

    const { value } = req.body;
    if (!value) return res.status(400).json({ error: 'Masukkan password atau PIN' });

    if (hashValue(value) !== folder.authHash) {
        return res.status(401).json({ error: folder.authType === 'password' ? 'Password salah' : 'PIN salah' });
    }

    const token = uuidv4();
    folderSessions.set(token, { folderId: folder.id });

    res.json({ success: true, token });
});

// Get folder info (authType) without needing unlock
app.get('/api/folder/:id/info', (req, res) => {
    const meta = loadMeta();
    const folder = meta.folders.find(f => f.id === req.params.id);
    if (!folder) return res.status(404).json({ error: 'Folder tidak ditemukan' });

    res.json({
        id: folder.id,
        name: folder.name,
        authType: folder.authType,
        parentId: folder.parentId
    });
});

app.delete('/api/folder/:id', (req, res) => {
    const meta = loadMeta();
    const folderId = req.params.id;
    const folder = meta.folders.find(f => f.id === folderId);
    if (!folder) return res.status(404).json({ error: 'Folder tidak ditemukan' });

    // Check access
    if (folder.authHash) {
        const token = req.headers['x-folder-token'];
        if (!isFolderUnlocked(folderId, token)) {
            return res.status(403).json({ error: 'Folder terkunci. Unlock dulu untuk menghapus.' });
        }
    }

    function getChildIds(parentId) {
        const children = meta.folders.filter(f => f.parentId === parentId);
        let ids = [parentId];
        children.forEach(c => { ids = ids.concat(getChildIds(c.id)); });
        return ids;
    }

    const allIds = getChildIds(folderId);

    meta.files = meta.files.filter(f => {
        if (allIds.includes(f.folderId)) {
            const filePath = path.join(STORAGE_DIR, f.filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return false;
        }
        return true;
    });

    meta.folders = meta.folders.filter(f => !allIds.includes(f.id));
    saveMeta(meta);

    // Clean up sessions for deleted folders
    for (const [tok, sess] of folderSessions) {
        if (allIds.includes(sess.folderId)) folderSessions.delete(tok);
    }

    res.json({ success: true });
});

// ============ FILE API ============

app.post('/api/upload', (req, res) => {
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

        // Check folder access if uploading to a protected folder
        const folderId = req.body.folderId || null;
        if (folderId) {
            const meta = loadMeta();
            const folder = meta.folders.find(f => f.id === folderId);
            if (folder && folder.authHash) {
                const token = req.headers['x-folder-token'];
                if (!isFolderUnlocked(folderId, token)) {
                    fs.unlinkSync(req.file.path);
                    return res.status(403).json({ error: 'Folder terkunci' });
                }
            }
        }

        const meta = loadMeta();
        const fileInfo = {
            id: path.parse(req.file.filename).name,
            originalName: req.file.originalname,
            filename: req.file.filename,
            size: req.file.size,
            mimetype: req.file.mimetype,
            folderId: folderId,
            uploadedAt: new Date().toISOString()
        };

        meta.files.push(fileInfo);
        saveMeta(meta);
        res.json({ success: true, file: fileInfo });
    });
});

app.get('/api/files', (req, res) => {
    const meta = loadMeta();
    const folderId = req.query.folder || null;

    // Check folder access if browsing a protected folder
    if (folderId) {
        const folder = meta.folders.find(f => f.id === folderId);
        if (folder && folder.authHash) {
            const token = req.headers['x-folder-token'];
            if (!isFolderUnlocked(folderId, token)) {
                return res.status(403).json({ error: 'Folder terkunci' });
            }
        }
    }

    const files = meta.files.filter(f => (f.folderId || null) === folderId);
    const folders = meta.folders
        .filter(f => (f.parentId || null) === folderId)
        .map(f => ({ id: f.id, name: f.name, parentId: f.parentId, authType: f.authType, createdAt: f.createdAt }));

    res.json({ files, folders });
});

app.get('/api/storage', (req, res) => {
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

app.get('/api/download/:id', (req, res) => {
    const meta = loadMeta();
    const file = meta.files.find(f => f.id === req.params.id);
    if (!file) return res.status(404).json({ error: 'File tidak ditemukan' });

    // Check folder access if file is in a protected folder
    if (file.folderId) {
        const folder = meta.folders.find(f => f.id === file.folderId);
        if (folder && folder.authHash) {
            const token = req.headers['x-folder-token'];
            if (!isFolderUnlocked(file.folderId, token)) {
                return res.status(403).json({ error: 'Folder terkunci' });
            }
        }
    }

    const filePath = path.join(STORAGE_DIR, file.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File hilang dari storage' });

    res.download(filePath, file.originalName);
});

app.delete('/api/delete/:id', (req, res) => {
    const meta = loadMeta();
    const idx = meta.files.findIndex(f => f.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'File tidak ditemukan' });

    const file = meta.files[idx];

    // Check folder access
    if (file.folderId) {
        const folder = meta.folders.find(f => f.id === file.folderId);
        if (folder && folder.authHash) {
            const token = req.headers['x-folder-token'];
            if (!isFolderUnlocked(file.folderId, token)) {
                return res.status(403).json({ error: 'Folder terkunci' });
            }
        }
    }

    const filePath = path.join(STORAGE_DIR, file.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    meta.files.splice(idx, 1);
    saveMeta(meta);
    res.json({ success: true });
});

// Folder path helper
app.get('/api/folder-path/:id', (req, res) => {
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
