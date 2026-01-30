const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 80;

// Port untuk services
const CONVERT_PORT = 3001;
const PDF_PORT = 3002;

// Serve static dashboard files
app.use(express.static(path.join(__dirname, 'public')));

// Proxy untuk Convert service
app.use('/convert', createProxyMiddleware({
    target: `http://localhost:${CONVERT_PORT}`,
    changeOrigin: true,
    pathRewrite: { '^/convert': '' },
    onError: (err, req, res) => {
        console.error('[Convert Proxy Error]', err.message);
        res.status(502).json({ error: 'Convert service unavailable' });
    }
}));

// Proxy untuk PDF service
app.use('/pdf', createProxyMiddleware({
    target: `http://localhost:${PDF_PORT}`,
    changeOrigin: true,
    pathRewrite: { '^/pdf': '' },
    onError: (err, req, res) => {
        console.error('[PDF Proxy Error]', err.message);
        res.status(502).json({ error: 'PDF service unavailable' });
    }
}));

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        services: {
            dashboard: 'running',
            convert: `http://localhost:${CONVERT_PORT}`,
            pdf: `http://localhost:${PDF_PORT}`
        },
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log('\n=========================================');
    console.log('   Harywang Dashboard');
    console.log('=========================================\n');
    console.log(`   Main:    http://localhost:${PORT}`);
    console.log(`   Convert: http://localhost:${PORT}/convert`);
    console.log(`   PDF:     http://localhost:${PORT}/pdf`);
    console.log('\n=========================================\n');
});
