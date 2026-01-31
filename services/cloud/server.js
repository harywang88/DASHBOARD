const express = require('express');
const multer = require('multer');
const cors = require('cors');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3003;

const STORAGE_DIR = path.join(__dirname, 'storage');
const META_FILE = path.join(__dirname, 'metadata.json');
const USERS_FILE = path.join(__dirname, '..', '..', 'users.json');
const JWT_SECRET = 'harywangcloud2026secret';
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

function loadUsers() {
    if (!fs.existsSync(USERS_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    } catch { return []; }
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function getTotalUsed(username) {
    const meta = loadMeta();
    if (username === 'harywang') {
        // Master user sees all
        return meta.files.reduce((sum, f) => sum + f.size, 0);
    }
    // Regular user sees only their files
    return meta.files.filter(f => f.owner === username).reduce((sum, f) => sum + f.size, 0);
}

// ============ AUTH MIDDLEWARE ============

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token tidak ada' });
    }

    const token = authHeader.substring(7);
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { username }
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token tidak valid' });
    }
}

// ============ MASTER PANEL MIDDLEWARE ============

const MASTER_PANEL_IP = '27.111.11.11';
const MASTER_TOKENS = new Set(); // Valid tokens untuk IP whitelist

function generateMasterToken() {
    const token = crypto.randomBytes(32).toString('hex');
    MASTER_TOKENS.add(token);
    return token;
}

function checkMasterAccess(req, res, next) {
    // Get IP (handle proxy headers)
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
                req.headers['x-real-ip'] || 
                req.socket.remoteAddress || 
                req.connection.remoteAddress;

    console.log('[MASTER PANEL] Access attempt from IP:', ip);

    // Check IP whitelist
    if (ip !== MASTER_PANEL_IP && ip !== '::1' && ip !== '127.0.0.1') {
        console.log('[MASTER PANEL] BLOCKED - IP not whitelisted');
        return res.status(403).json({ error: 'Access denied' });
    }

    // Check token
    const token = req.headers['x-master-token'];
    if (!token || !MASTER_TOKENS.has(token)) {
        console.log('[MASTER PANEL] BLOCKED - Invalid or missing token');
        return res.status(403).json({ error: 'Invalid token' });
    }

    // Check if user is harywang
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const decoded = jwt.verify(authHeader.substring(7), JWT_SECRET);
            if (decoded.username !== 'harywang') {
                console.log('[MASTER PANEL] BLOCKED - Not master user');
                return res.status(403).json({ error: 'Not authorized' });
            }
            req.user = decoded;
        } catch (err) {
            return res.status(401).json({ error: 'Invalid auth token' });
        }
    }

    console.log('[MASTER PANEL] Access GRANTED');
    next();
}

// Generate initial master token (log it on startup)
const INITIAL_MASTER_TOKEN = generateMasterToken();
console.log('\n========================================');
console.log('MASTER PANEL TOKEN:', INITIAL_MASTER_TOKEN);
console.log('Save this token securely!');
console.log('========================================\n');

// ============ MULTER ============

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, STORAGE_DIR),
    filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname))
});

const upload = multer({ storage, limits: { fileSize: MAX_FILE_SIZE } });

// ============ FOLDER API ============

app.post('/api/folder', verifyToken, (req, res) => {
    const { name, parentId } = req.body;
    const username = req.user.username;
    
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Nama folder wajib diisi' });
    }

    // If creating inside another folder, verify parent ownership
    if (parentId) {
        const meta = loadMeta();
        const parent = meta.folders.find(f => f.id === parentId);
        if (!parent) {
            return res.status(404).json({ error: 'Folder parent tidak ditemukan' });
        }
        // Check ownership (unless master user)
        if (username !== 'harywang' && parent.owner !== username) {
            return res.status(403).json({ error: 'Tidak ada akses ke folder parent' });
        }
    }

    const meta = loadMeta();
    const folder = {
        id: uuidv4(),
        name: name.trim(),
        parentId: parentId || null,
        owner: username,
        createdAt: new Date().toISOString()
    };

    meta.folders.push(folder);
    saveMeta(meta);

    res.json({ success: true, folder });
});

app.delete('/api/folder/:id', verifyToken, (req, res) => {
    const meta = loadMeta();
    const folderId = req.params.id;
    const username = req.user.username;
    
    const folder = meta.folders.find(f => f.id === folderId);
    if (!folder) return res.status(404).json({ error: 'Folder tidak ditemukan' });

    // Check ownership (master can delete anything)
    if (username !== 'harywang' && folder.owner !== username) {
        return res.status(403).json({ error: 'Tidak ada akses' });
    }

    function getChildIds(parentId) {
        const children = meta.folders.filter(f => f.parentId === parentId);
        let ids = [parentId];
        children.forEach(c => { ids = ids.concat(getChildIds(c.id)); });
        return ids;
    }

    const allIds = getChildIds(folderId);

    // Delete all files in folder and subfolders
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

app.post('/api/upload', verifyToken, (req, res) => {
    const username = req.user.username;
    const totalUsed = getTotalUsed(username);

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

        const folderId = req.body.folderId || null;
        
        // Verify folder ownership if uploading to a folder
        if (folderId) {
            const meta = loadMeta();
            const folder = meta.folders.find(f => f.id === folderId);
            if (!folder) {
                fs.unlinkSync(req.file.path);
                return res.status(404).json({ error: 'Folder tidak ditemukan' });
            }
            if (username !== 'harywang' && folder.owner !== username) {
                fs.unlinkSync(req.file.path);
                return res.status(403).json({ error: 'Tidak ada akses ke folder ini' });
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
            owner: username,
            uploadedAt: new Date().toISOString()
        };

        meta.files.push(fileInfo);
        saveMeta(meta);
        res.json({ success: true, file: fileInfo });
    });
});

app.get('/api/files', verifyToken, (req, res) => {
    const meta = loadMeta();
    const username = req.user.username;
    const folderId = req.query.folder || null;

    // Verify folder ownership if browsing specific folder
    if (folderId) {
        const folder = meta.folders.find(f => f.id === folderId);
        if (!folder) {
            return res.status(404).json({ error: 'Folder tidak ditemukan' });
        }
        if (username !== 'harywang' && folder.owner !== username) {
            return res.status(403).json({ error: 'Tidak ada akses' });
        }
    }

    // Filter based on ownership
    let files, folders;
    if (username === 'harywang') {
        // Master sees all
        files = meta.files.filter(f => (f.folderId || null) === folderId);
        folders = meta.folders.filter(f => (f.parentId || null) === folderId);
    } else {
        // Regular user sees only their own
        files = meta.files.filter(f => (f.folderId || null) === folderId && f.owner === username);
        folders = meta.folders.filter(f => (f.parentId || null) === folderId && f.owner === username);
    }

    res.json({ 
        files, 
        folders: folders.map(f => ({ 
            id: f.id, 
            name: f.name, 
            parentId: f.parentId, 
            owner: f.owner,
            createdAt: f.createdAt 
        }))
    });
});

app.get('/api/storage', verifyToken, (req, res) => {
    const username = req.user.username;
    const meta = loadMeta();
    
    let used, fileCount, folderCount;
    if (username === 'harywang') {
        used = meta.files.reduce((sum, f) => sum + f.size, 0);
        fileCount = meta.files.length;
        folderCount = meta.folders.length;
    } else {
        const userFiles = meta.files.filter(f => f.owner === username);
        used = userFiles.reduce((sum, f) => sum + f.size, 0);
        fileCount = userFiles.length;
        folderCount = meta.folders.filter(f => f.owner === username).length;
    }

    res.json({
        used,
        total: MAX_STORAGE,
        available: MAX_STORAGE - used,
        fileCount,
        folderCount
    });
});

app.get('/api/download/:id', verifyToken, (req, res) => {
    const meta = loadMeta();
    const username = req.user.username;
    const file = meta.files.find(f => f.id === req.params.id);
    
    if (!file) return res.status(404).json({ error: 'File tidak ditemukan' });

    // Check ownership (master can download anything)
    if (username !== 'harywang' && file.owner !== username) {
        return res.status(403).json({ error: 'Tidak ada akses' });
    }

    const filePath = path.join(STORAGE_DIR, file.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File hilang dari storage' });

    res.download(filePath, file.originalName);
});

app.delete('/api/delete/:id', verifyToken, (req, res) => {
    const meta = loadMeta();
    const username = req.user.username;
    const idx = meta.files.findIndex(f => f.id === req.params.id);
    
    if (idx === -1) return res.status(404).json({ error: 'File tidak ditemukan' });

    const file = meta.files[idx];

    // Check ownership (master can delete anything)
    if (username !== 'harywang' && file.owner !== username) {
        return res.status(403).json({ error: 'Tidak ada akses' });
    }

    const filePath = path.join(STORAGE_DIR, file.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    meta.files.splice(idx, 1);
    saveMeta(meta);
    res.json({ success: true });
});

app.get('/api/folder-path/:id', verifyToken, (req, res) => {
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

// ============ MASTER PANEL API ============

// Get master token (requires master auth)
app.post('/api/master/generate-token', verifyToken, (req, res) => {
    if (req.user.username !== 'harywang') {
        return res.status(403).json({ error: 'Not authorized' });
    }
    const token = generateMasterToken();
    res.json({ token });
});

// Get all users
app.get('/api/master/users', checkMasterAccess, (req, res) => {
    const users = loadUsers();
    const meta = loadMeta();
    
    const usersWithStats = users.map(user => {
        const userFiles = meta.files.filter(f => f.owner === user.username);
        const userFolders = meta.folders.filter(f => f.owner === user.username);
        const storage = userFiles.reduce((sum, f) => sum + f.size, 0);
        
        return {
            username: user.username,
            registeredAt: user.registeredAt || 'N/A',
            fileCount: userFiles.length,
            folderCount: userFolders.length,
            storageUsed: storage
        };
    });

    res.json({ users: usersWithStats });
});

// Reset user password
app.post('/api/master/reset-password', checkMasterAccess, (req, res) => {
    const { username, newPassword } = req.body;
    
    if (!username || !newPassword) {
        return res.status(400).json({ error: 'Username dan password baru wajib diisi' });
    }

    const users = loadUsers();
    const user = users.find(u => u.username === username);
    
    if (!user) {
        return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    // Hash new password
    user.password = crypto.createHash('sha256').update(newPassword).digest('hex');
    saveUsers(users);

    res.json({ success: true, message: `Password untuk ${username} berhasil direset` });
});

// Delete user and all their data
app.delete('/api/master/user/:username', checkMasterAccess, (req, res) => {
    const { username } = req.params;
    
    if (username === 'harywang') {
        return res.status(400).json({ error: 'Cannot delete master user' });
    }

    // Delete user from users.json
    let users = loadUsers();
    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex === -1) {
        return res.status(404).json({ error: 'User tidak ditemukan' });
    }
    users.splice(userIndex, 1);
    saveUsers(users);

    // Delete all user's files and folders
    const meta = loadMeta();
    
    // Delete physical files
    meta.files.filter(f => f.owner === username).forEach(file => {
        const filePath = path.join(STORAGE_DIR, file.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    // Remove from metadata
    meta.files = meta.files.filter(f => f.owner !== username);
    meta.folders = meta.folders.filter(f => f.owner !== username);
    saveMeta(meta);

    res.json({ success: true, message: `User ${username} dan semua datanya berhasil dihapus` });
});

// Get dashboard statistics
app.get('/api/master/stats', checkMasterAccess, (req, res) => {
    const users = loadUsers();
    const meta = loadMeta();
    
    const totalStorage = meta.files.reduce((sum, f) => sum + f.size, 0);
    
    res.json({
        totalUsers: users.length,
        totalFiles: meta.files.length,
        totalFolders: meta.folders.length,
        totalStorage,
        maxStorage: MAX_STORAGE,
        storagePercentage: ((totalStorage / MAX_STORAGE) * 100).toFixed(2)
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// Serve master panel
app.get('/masterpanel', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'masterpanel.html'));
});

app.listen(PORT, () => {
    console.log(`HarywangCloud running on port ${PORT}`);
});
