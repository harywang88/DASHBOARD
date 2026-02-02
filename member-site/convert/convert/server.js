const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const convert = require('./services/convert');
const Queue = require('./services/queue');
const { printToolsStatus, getToolsSummary } = require('./services/toolsCheck');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from frontend directory
const frontendDir = path.join(__dirname, 'frontend');
app.use(express.static(frontendDir));

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
});

const concurrency = process.env.CONCURRENCY ? Number(process.env.CONCURRENCY) : 4;
const queue = new Queue(concurrency);
const PORT = process.env.PORT || 3001;

const API_KEY = process.env.API_KEY || 'localdev';
function authMiddleware(req, res, next) {
  const key = req.headers['x-api-key'] || req.query.api_key;
  if (!API_KEY || API_KEY === 'localdev') return next();
  if (!key) return res.status(401).json({ error: 'Unauthorized. Provide X-API-Key header.' });
  if (key === API_KEY) return next();
  return res.status(401).json({ error: 'Unauthorized. Invalid API key.' });
}

// ==================== RATE LIMITING ====================
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 requests per minute

function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return next();
  }

  const record = rateLimitMap.get(ip);

  if (now - record.windowStart > RATE_LIMIT_WINDOW) {
    // Reset window
    record.count = 1;
    record.windowStart = now;
    return next();
  }

  record.count++;

  if (record.count > RATE_LIMIT_MAX) {
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((RATE_LIMIT_WINDOW - (now - record.windowStart)) / 1000)
    });
  }

  next();
}

// Clean up rate limit map periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now - record.windowStart > RATE_LIMIT_WINDOW * 2) {
      rateLimitMap.delete(ip);
    }
  }
}, 60000);

// ==================== API ENDPOINTS ====================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: PORT,
    api_key_enabled: API_KEY && API_KEY !== 'localdev'
  });
});

// Tools status endpoint
app.get('/api/tools', async (req, res) => {
  try {
    const summary = await getToolsSummary();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: 'Failed to check tools: ' + err.message });
  }
});

// Server stats endpoint
app.get('/api/stats', (req, res) => {
  const stats = queue.getStats();
  res.json({
    queue: stats,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Supported formats endpoint
app.get('/api/formats', (req, res) => {
  res.json({
    images: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'svg', 'ico'],
    video: ['mp4', 'mkv', 'webm', 'avi', 'mov', 'wmv', 'flv', 'mpg', 'mpeg'],
    audio: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma', 'opus'],
    documents: ['pdf', 'docx', 'odt', 'html', 'txt', 'pptx', 'xlsx', 'rtf', 'doc'],
    archives: ['zip', '7z', 'rar']
  });
});

// Multer error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err.message);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum 500MB.' });
    }
    return res.status(400).json({ error: 'Upload error: ' + err.message });
  }
  next(err);
});

// ==================== FILE CONVERSION ====================

app.post('/convert', rateLimitMiddleware, upload.single('file'), authMiddleware, async (req, res) => {
  console.log('\n=== CONVERSION REQUEST ===');
  console.log('File:', req.file ? `${req.file.filename} (${req.file.size} bytes)` : 'NONE');
  console.log('Format:', req.body.targetFormat);

  try {
    if (!req.file) {
      console.error('ERROR: No file provided');
      return res.status(400).json({ error: 'file is required' });
    }

    const target = req.body.targetFormat;
    if (!target) return res.status(400).json({ error: 'targetFormat is required' });
    if (typeof target !== 'string' || target.length > 20) {
      return res.status(400).json({ error: 'Invalid targetFormat' });
    }

    let options = {};
    if (req.body.options) {
      const optionsStr = String(req.body.options).trim();

      // Skip if empty string
      if (optionsStr && optionsStr !== '{}') {
        try {
          options = JSON.parse(optionsStr);
          if (typeof options !== 'object' || options === null) {
            throw new Error('Options must be an object');
          }
          console.log('Options:', options);
        } catch (parseErr) {
          const msg = parseErr.message.includes('position')
            ? `Invalid JSON format: ${parseErr.message}`
            : `Invalid options: ${parseErr.message}`;
          console.error('OPTIONS ERROR:', msg);
          return res.status(400).json({ error: msg + '. Try: {"quality": 80}' });
        }
      }
    }

    const inputPath = req.file.path;
    console.log('Input path:', inputPath);

    const task = async () => {
      const outputPath = await convert.convertFile(inputPath, target, options);
      // Check and handle target file size
      if (options.targetFileSize) {
        return await convert.compressImageToTargetSize(outputPath, options.targetFileSize);
      }
      return outputPath;
    };

    const outputPath = await queue.enqueue(task);

    console.log('Conversion SUCCESS! Output:', outputPath);

    const filename = path.basename(outputPath);
    res.download(outputPath, filename, err => {
      if (err) console.error('Download error:', err.message);
      else console.log('File downloaded successfully');
    });
  } catch (err) {
    console.error('CONVERSION ERROR:', err.message || err);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: err.message || 'Conversion failed' });
  }
});

// ==================== URL CONVERSION ====================

app.post('/convert-url', rateLimitMiddleware, authMiddleware, async (req, res) => {
  console.log('\n=== URL CONVERSION REQUEST ===');

  try {
    const { url, targetFormat, options: optionsStr } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'url is required' });
    }

    if (!targetFormat) {
      return res.status(400).json({ error: 'targetFormat is required' });
    }

    // Validate URL
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    console.log('URL:', url);
    console.log('Format:', targetFormat);

    let options = {};
    if (optionsStr) {
      try {
        options = typeof optionsStr === 'string' ? JSON.parse(optionsStr) : optionsStr;
      } catch (e) {
        return res.status(400).json({ error: 'Invalid options JSON' });
      }
    }

    // Download file from URL
    const tempFilename = `${Date.now()}-${uuidv4()}${path.extname(parsedUrl.pathname) || '.tmp'}`;
    const tempPath = path.join(UPLOAD_DIR, tempFilename);

    console.log('Downloading to:', tempPath);

    await new Promise((resolve, reject) => {
      const protocol = parsedUrl.protocol === 'https:' ? https : http;
      const request = protocol.get(url, {
        timeout: 60000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }, (response) => {
        // Handle redirects
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          protocol.get(response.headers.location, {
            timeout: 60000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          }, (res2) => {
            const fileStream = fs.createWriteStream(tempPath);
            res2.pipe(fileStream);
            fileStream.on('finish', () => {
              fileStream.close();
              resolve();
            });
          }).on('error', reject);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
          return;
        }

        const fileStream = fs.createWriteStream(tempPath);
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
      });

      request.on('error', reject);
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Download timeout'));
      });
    });

    console.log('Download complete, starting conversion...');

    // Convert the downloaded file
    const task = async () => {
      const outputPath = await convert.convertFile(tempPath, targetFormat, options);
      if (options.targetFileSize) {
        return await convert.compressImageToTargetSize(outputPath, options.targetFileSize);
      }
      return outputPath;
    };

    const outputPath = await queue.enqueue(task);

    console.log('URL Conversion SUCCESS! Output:', outputPath);

    const filename = path.basename(outputPath);
    res.download(outputPath, filename, (err) => {
      if (err) console.error('Download error:', err.message);
      else console.log('File downloaded successfully');

      // Clean up temp file
      try { fs.unlinkSync(tempPath); } catch (e) {}
    });

  } catch (err) {
    console.error('URL CONVERSION ERROR:', err.message || err);
    res.status(500).json({ error: err.message || 'URL conversion failed' });
  }
});

// ==================== IMAGE OPTIMIZATION ====================

app.post('/optimize', rateLimitMiddleware, upload.single('file'), authMiddleware, async (req, res) => {
  console.log('\n=== IMAGE OPTIMIZATION REQUEST ===');

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'file is required' });
    }

    const inputPath = req.file.path;
    const quality = parseInt(req.body.quality) || 80;
    const maxWidth = parseInt(req.body.maxWidth) || null;
    const maxHeight = parseInt(req.body.maxHeight) || null;
    const targetSize = parseInt(req.body.targetSize) || null; // in KB

    console.log('File:', req.file.filename);
    console.log('Quality:', quality);
    console.log('Max dimensions:', maxWidth, 'x', maxHeight);
    console.log('Target size:', targetSize, 'KB');

    let sharp;
    try {
      sharp = require('sharp');
    } catch (e) {
      return res.status(500).json({ error: 'Sharp module not available for optimization' });
    }

    const ext = path.extname(inputPath).toLowerCase().slice(1);
    const outputFilename = `${uuidv4()}.${ext === 'jpeg' ? 'jpg' : ext}`;
    const outputPath = path.join(UPLOAD_DIR, outputFilename);

    let transform = sharp(inputPath);

    // Get metadata for resizing
    const metadata = await transform.metadata();

    // Resize if needed
    if (maxWidth || maxHeight) {
      const newWidth = maxWidth && metadata.width > maxWidth ? maxWidth : null;
      const newHeight = maxHeight && metadata.height > maxHeight ? maxHeight : null;

      if (newWidth || newHeight) {
        transform = transform.resize(newWidth, newHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }
    }

    // Apply format-specific optimization
    if (ext === 'jpg' || ext === 'jpeg') {
      transform = transform.jpeg({ quality, progressive: true });
    } else if (ext === 'png') {
      transform = transform.png({ compressionLevel: 9, palette: quality < 50 });
    } else if (ext === 'webp') {
      transform = transform.webp({ quality });
    } else if (ext === 'gif') {
      transform = transform.gif();
    } else {
      return res.status(400).json({ error: 'Unsupported format for optimization. Use JPG, PNG, WebP, or GIF.' });
    }

    await transform.toFile(outputPath);

    // If target size specified, compress further
    if (targetSize && fs.existsSync(outputPath)) {
      const currentSize = fs.statSync(outputPath).size;
      const targetBytes = targetSize * 1024;

      if (currentSize > targetBytes) {
        const finalPath = await convert.compressImageToTargetSize(outputPath, targetBytes);
        const finalSize = fs.statSync(finalPath).size;

        console.log(`Optimized: ${(currentSize / 1024).toFixed(2)}KB -> ${(finalSize / 1024).toFixed(2)}KB`);

        return res.download(finalPath, outputFilename, (err) => {
          if (err) console.error('Download error:', err.message);
        });
      }
    }

    const finalSize = fs.statSync(outputPath).size;
    const originalSize = fs.statSync(inputPath).size;
    const savings = ((1 - finalSize / originalSize) * 100).toFixed(1);

    console.log(`Optimized: ${(originalSize / 1024).toFixed(2)}KB -> ${(finalSize / 1024).toFixed(2)}KB (${savings}% smaller)`);

    res.download(outputPath, outputFilename, (err) => {
      if (err) console.error('Download error:', err.message);
    });

  } catch (err) {
    console.error('OPTIMIZATION ERROR:', err.message || err);
    res.status(500).json({ error: err.message || 'Optimization failed' });
  }
});

// ==================== FILE COMPRESSION (SAME FORMAT) ====================

app.post('/compress', rateLimitMiddleware, upload.single('file'), authMiddleware, async (req, res) => {
  console.log('\n=== FILE COMPRESSION REQUEST ===');

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'file is required' });
    }

    const targetSizeKB = parseInt(req.body.targetSize);
    if (!targetSizeKB || targetSizeKB < 10) {
      return res.status(400).json({ error: 'targetSize is required (minimum 10 KB)' });
    }

    const inputPath = req.file.path;
    const ext = path.extname(inputPath).toLowerCase().slice(1);
    const targetBytes = targetSizeKB * 1024;

    console.log('File:', req.file.filename, `(${(req.file.size / 1024).toFixed(2)} KB)`);
    console.log('Target:', targetSizeKB, 'KB');
    console.log('Format:', ext);

    // Check if format is supported
    const supportedFormats = ['gif', 'jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm'];
    if (!supportedFormats.includes(ext)) {
      return res.status(400).json({
        error: `Unsupported format: ${ext}. Supported: ${supportedFormats.join(', ')}`
      });
    }

    // Compress the file
    const task = async () => {
      return await convert.compressToTargetSize(inputPath, targetBytes, ext);
    };

    const outputPath = await queue.enqueue(task);

    const outputSize = fs.statSync(outputPath).size;
    console.log(`Compression SUCCESS! ${(req.file.size / 1024).toFixed(2)}KB -> ${(outputSize / 1024).toFixed(2)}KB`);

    const filename = path.basename(outputPath);
    res.download(outputPath, filename, (err) => {
      if (err) console.error('Download error:', err.message);
      else console.log('File downloaded successfully');
    });

  } catch (err) {
    console.error('COMPRESSION ERROR:', err.message || err);
    res.status(500).json({ error: err.message || 'Compression failed' });
  }
});

// ==================== BATCH CONVERSION ====================

app.post('/convert-batch', rateLimitMiddleware, upload.array('files', 20), authMiddleware, async (req, res) => {
  console.log('\n=== BATCH CONVERSION REQUEST ===');

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'files are required' });
    }

    const targetFormat = req.body.targetFormat?.toLowerCase();
    if (!targetFormat) {
      return res.status(400).json({ error: 'targetFormat is required' });
    }

    let options = {};
    if (req.body.options) {
      try {
        options = JSON.parse(req.body.options);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid options JSON' });
      }
    }

    console.log(`Converting ${req.files.length} files to ${targetFormat}`);
    console.log('Options:', options);

    const results = [];
    const AdmZip = require('adm-zip');
    const zip = new AdmZip();

    // Special handling for archive formats (ZIP, 7Z)
    // Just add original files to the archive without conversion
    const isArchiveFormat = ['zip', '7z'].includes(targetFormat);

    if (isArchiveFormat) {
      console.log(`Archive mode: Adding ${req.files.length} files directly to ${targetFormat.toUpperCase()}`);

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        console.log(`[${i + 1}/${req.files.length}] Adding: ${file.originalname}`);

        try {
          // Add original file to zip with original name
          zip.addLocalFile(file.path, '', file.originalname);
          results.push({ file: file.originalname, success: true });
        } catch (err) {
          console.error(`Failed to add: ${file.originalname} - ${err.message}`);
          results.push({ file: file.originalname, success: false, error: err.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      if (successCount === 0) {
        return res.status(500).json({ error: 'Failed to create archive', results });
      }

      // Create the archive
      const archiveFilename = `harywang_archive_${Date.now()}.${targetFormat}`;
      const archivePath = path.join(UPLOAD_DIR, archiveFilename);

      if (targetFormat === 'zip') {
        zip.writeZip(archivePath);
      } else if (targetFormat === '7z') {
        // For 7z, first create zip then try to convert (or just use zip)
        zip.writeZip(archivePath.replace('.7z', '.zip'));
        // Note: 7z creation requires 7-Zip installed
        try {
          const { runCmd } = require('./services/utils');
          const tempZip = archivePath.replace('.7z', '.zip');
          await runCmd('7z', ['a', archivePath, `${tempZip}/*`]);
          fs.unlinkSync(tempZip);
        } catch (e) {
          // Fallback: just rename zip to 7z (not ideal but works)
          console.log('7z command not available, using zip format');
          fs.renameSync(archivePath.replace('.7z', '.zip'), archivePath);
        }
      }

      console.log(`Archive created: ${archiveFilename} with ${successCount} files`);

      return res.download(archivePath, archiveFilename, (err) => {
        if (err) console.error('Download error:', err.message);
        setTimeout(() => {
          try { fs.unlinkSync(archivePath); } catch (e) {}
          req.files.forEach(f => { try { fs.unlinkSync(f.path); } catch (e) {} });
        }, 5000);
      });
    }

    // Normal conversion flow for non-archive formats
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      console.log(`[${i + 1}/${req.files.length}] Converting: ${file.originalname}`);

      try {
        const outputPath = await convert.convertFile(file.path, targetFormat, options);

        if (options.targetFileSize) {
          const compressed = await convert.compressImageToTargetSize(outputPath, options.targetFileSize);
          zip.addLocalFile(compressed, '', `harywang_${i + 1}.${targetFormat}`);
        } else {
          zip.addLocalFile(outputPath, '', `harywang_${i + 1}.${targetFormat}`);
        }

        results.push({ file: file.originalname, success: true });
      } catch (err) {
        console.error(`Failed: ${file.originalname} - ${err.message}`);
        results.push({ file: file.originalname, success: false, error: err.message });
      }
    }

    const successCount = results.filter(r => r.success).length;

    if (successCount === 0) {
      return res.status(500).json({
        error: 'All conversions failed',
        results
      });
    }

    // Create zip with all converted files
    const zipFilename = `harywang_batch_${Date.now()}.zip`;
    const zipPath = path.join(UPLOAD_DIR, zipFilename);
    zip.writeZip(zipPath);

    console.log(`Batch conversion complete: ${successCount}/${req.files.length} successful`);

    res.download(zipPath, zipFilename, (err) => {
      if (err) console.error('Download error:', err.message);

      // Clean up
      setTimeout(() => {
        try { fs.unlinkSync(zipPath); } catch (e) {}
        req.files.forEach(f => {
          try { fs.unlinkSync(f.path); } catch (e) {}
        });
      }, 5000);
    });

  } catch (err) {
    console.error('BATCH CONVERSION ERROR:', err.message || err);
    res.status(500).json({ error: err.message || 'Batch conversion failed' });
  }
});

// ==================== FILE MANAGEMENT ====================

app.get('/download/:file', (req, res) => {
  const filename = req.params.file;
  // Security: prevent directory traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  const file = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(file)) return res.status(404).send('Not found');
  res.download(file);
});

// Cleanup old files periodically
const CLEANUP_MINUTES = process.env.CLEANUP_MINUTES ? Number(process.env.CLEANUP_MINUTES) : 60;
function cleanupOldFiles() {
  try {
    const cutoff = Date.now() - CLEANUP_MINUTES * 60 * 1000;
    fs.readdir(UPLOAD_DIR, (err, files) => {
      if (err) return console.error('Cleanup read error:', err.message);
      if (!Array.isArray(files) || files.length === 0) return;
      files.forEach(f => {
        const p = path.join(UPLOAD_DIR, f);
        fs.stat(p, (err2, st) => {
          if (err2) return console.debug('Stat error for', f, ':', err2.message);
          if (st && st.mtimeMs < cutoff) {
            fs.unlink(p, e => {
              if (e) console.error('Cleanup unlink error for', f, ':', e.message);
              else console.log('Cleaned up old file:', f);
            });
          }
        });
      });
    });
  } catch (err) {
    console.error('Cleanup error:', err.message);
  }
}
setInterval(cleanupOldFiles, 15 * 60 * 1000);

// ==================== SERVER STARTUP ====================

async function startServer() {
  // Check tools at startup
  await printToolsStatus();

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('\n===========================================');
    console.log('   HarywangConvert - File Conversion Server');
    console.log('===========================================\n');
    console.log(`   URL: http://localhost:${PORT}`);
    console.log(`   Access from: http://127.0.0.1:${PORT}`);
    console.log(`   API Key: ${API_KEY === 'localdev' ? 'Not required' : 'Required'}`);
    console.log(`   Concurrency: ${concurrency}`);
    console.log(`   Upload dir: ${UPLOAD_DIR}`);
    console.log(`   Rate limit: ${RATE_LIMIT_MAX} req/min`);
    console.log(`   CORS: Enabled\n`);
    console.log('   API Endpoints:');
    console.log('   - POST /convert         - Convert single file');
    console.log('   - POST /convert-batch   - Convert multiple files');
    console.log('   - POST /convert-url     - Convert file from URL');
    console.log('   - POST /optimize        - Optimize image');
    console.log('   - GET  /api/tools       - Check tools status');
    console.log('   - GET  /api/stats       - Server stats');
    console.log('   - GET  /api/formats     - Supported formats');
    console.log('   - GET  /health          - Health check\n');
    console.log('===========================================\n');
  });

  server.on('error', (err) => {
    console.error('Server error:', err.message);
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Try: PORT=8080 node server.js`);
    }
    process.exit(1);
  });
}

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

// Start the server
startServer();
