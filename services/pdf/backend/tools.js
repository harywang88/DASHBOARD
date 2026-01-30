#!/usr/bin/env node

/**
 * PDF House Management Tools
 * Advanced utilities for server management and monitoring
 */

const fs = require('fs');
const path = require('path');
const { spawn, spawnSync, exec } = require('child_process');
const http = require('http');

class PDFHouseManager {
    constructor() {
        this.PORT = process.env.PORT || 3000;
        this.uploadDir = path.join(__dirname, 'uploads');
        this.outputDir = path.join(__dirname, 'output');
        this.logDir = path.join(__dirname, 'logs');
        
        // Create log directory if not exists
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    /**
     * Get server health status
     */
    async getHealthStatus() {
        return new Promise((resolve) => {
            const options = {
                hostname: 'localhost',
                port: this.PORT,
                path: '/api/health',
                method: 'GET',
                timeout: 5000
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch {
                        resolve({ error: 'Invalid response' });
                    }
                });
            });

            req.on('error', () => {
                resolve({ error: 'Server not responding' });
            });

            req.end();
        });
    }

    /**
     * Check if port is in use
     */
    isPortInUse() {
        return new Promise((resolve) => {
            const server = require('net').createServer()
                .once('error', () => resolve(true))
                .once('listening', () => {
                    server.close();
                    resolve(false);
                })
                .listen(this.PORT);
        });
    }

    /**
     * Get system statistics
     */
    getSystemStats() {
        const stats = {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version,
            pid: process.pid
        };

        return stats;
    }

    /**
     * Get directory statistics
     */
    getDirectoryStats(dir) {
        if (!fs.existsSync(dir)) {
            return { files: 0, size: 0, error: 'Directory not found' };
        }

        const files = fs.readdirSync(dir);
        let size = 0;

        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);
            size += stats.size;
        });

        return {
            path: dir,
            files: files.length,
            size: size,
            sizeInMB: (size / 1024 / 1024).toFixed(2)
        };
    }

    /**
     * Get full system report
     */
    async getSystemReport() {
        const report = {
            timestamp: new Date().toISOString(),
            systemStats: this.getSystemStats(),
            uploadDir: this.getDirectoryStats(this.uploadDir),
            outputDir: this.getDirectoryStats(this.outputDir),
            serverHealth: await this.getHealthStatus(),
            portInUse: await this.isPortInUse()
        };

        return report;
    }

    /**
     * Cleanup old files
     */
    cleanupOldFiles(ageHours = 1) {
        const ageMs = ageHours * 60 * 60 * 1000;
        const now = Date.now();
        const result = { deleted: 0, failed: 0 };

        const cleanDir = (dir) => {
            if (!fs.existsSync(dir)) return;

            fs.readdirSync(dir).forEach(file => {
                const filePath = path.join(dir, file);
                const stats = fs.statSync(filePath);

                if (now - stats.mtimeMs > ageMs) {
                    try {
                        fs.unlinkSync(filePath);
                        result.deleted++;
                    } catch (err) {
                        result.failed++;
                    }
                }
            });
        };

        cleanDir(this.uploadDir);
        cleanDir(this.outputDir);

        return result;
    }

    /**
     * Clear all temp files
     */
    clearAllTempFiles() {
        const result = { uploadDeleted: 0, outputDeleted: 0 };

        const clearDir = (dir) => {
            if (!fs.existsSync(dir)) return 0;

            let count = 0;
            fs.readdirSync(dir).forEach(file => {
                try {
                    fs.unlinkSync(path.join(dir, file));
                    count++;
                } catch (err) {
                    // Ignore
                }
            });
            return count;
        };

        result.uploadDeleted = clearDir(this.uploadDir);
        result.outputDeleted = clearDir(this.outputDir);

        return result;
    }

    /**
     * Get process info
     */
    getProcessInfo() {
        return {
            pid: process.pid,
            version: process.version,
            versions: process.versions,
            executable: process.execPath,
            cwd: process.cwd(),
            env: process.env.NODE_ENV || 'development'
        };
    }

    /**
     * Get memory info
     */
    getMemoryInfo() {
        const mem = process.memoryUsage();
        return {
            heapTotal: (mem.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
            heapUsed: (mem.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
            external: (mem.external / 1024 / 1024).toFixed(2) + ' MB',
            rss: (mem.rss / 1024 / 1024).toFixed(2) + ' MB'
        };
    }

    /**
     * Get API endpoints info
     */
    getAPIEndpoints() {
        return [
            { method: 'GET', path: '/api/health', description: 'Server health check' },
            { method: 'POST', path: '/api/merge', description: 'Merge multiple PDFs' },
            { method: 'POST', path: '/api/split', description: 'Split PDF pages' },
            { method: 'POST', path: '/api/compress', description: 'Compress PDF' },
            { method: 'POST', path: '/api/convert', description: 'Convert PDF to images' },
            { method: 'POST', path: '/api/extract-text', description: 'Extract text from PDF' },
            { method: 'POST', path: '/api/edit', description: 'Edit PDF text' },
            { method: 'GET', path: '/api/download/:filename', description: 'Download file' },
            { method: 'GET', path: '/', description: 'Web interface' }
        ];
    }

    /**
     * Validate dependencies
     */
    validateDependencies() {
        const dependencies = [
            'express',
            'multer',
            'cors',
            'pdf-lib',
            'pdfkit',
            'pdf-parse',
            'sharp',
            'dotenv'
        ];

        const results = {};

        dependencies.forEach(dep => {
            try {
                require.resolve(dep);
                results[dep] = { installed: true };
            } catch (err) {
                results[dep] = { installed: false, error: err.message };
            }
        });

        return results;
    }

    /**
     * Get configuration
     */
    getConfiguration() {
        const envFile = path.join(__dirname, '.env');
        const config = {};

        if (fs.existsSync(envFile)) {
            const content = fs.readFileSync(envFile, 'utf8');
            content.split('\n').forEach(line => {
                if (line && !line.startsWith('#')) {
                    const [key, value] = line.split('=');
                    if (key && value) {
                        config[key.trim()] = value.trim();
                    }
                }
            });
        }

        return config;
    }

    /**
     * Start monitoring
     */
    startMonitoring(interval = 5000) {
        console.log('📊 Starting monitoring...');

        const monitor = setInterval(async () => {
            const health = await this.getHealthStatus();
            const memory = this.getMemoryInfo();
            const time = new Date().toLocaleTimeString();

            if (health.error) {
                console.log(`[${time}] ❌ Server offline`);
            } else {
                console.log(`[${time}] ✅ Server OK | Memory: ${memory.heapUsed}`);
            }
        }, interval);

        return monitor;
    }

    /**
     * Stop monitoring
     */
    stopMonitoring(monitor) {
        clearInterval(monitor);
        console.log('📊 Monitoring stopped');
    }
}

// Export for use as module
module.exports = PDFHouseManager;

// CLI usage
if (require.main === module) {
    const manager = new PDFHouseManager();
    const command = process.argv[2];

    switch(command) {
        case 'health':
            manager.getHealthStatus().then(status => {
                console.log(JSON.stringify(status, null, 2));
            });
            break;

        case 'stats':
            console.log(JSON.stringify(manager.getSystemStats(), null, 2));
            break;

        case 'dirs':
            console.log('Upload:', manager.getDirectoryStats(manager.uploadDir));
            console.log('Output:', manager.getDirectoryStats(manager.outputDir));
            break;

        case 'report':
            manager.getSystemReport().then(report => {
                console.log(JSON.stringify(report, null, 2));
            });
            break;

        case 'cleanup':
            const hours = parseInt(process.argv[3]) || 1;
            const result = manager.cleanupOldFiles(hours);
            console.log(`Cleaned up files older than ${hours} hour(s):`);
            console.log(`  Deleted: ${result.deleted}`);
            console.log(`  Failed: ${result.failed}`);
            break;

        case 'clear':
            const cleared = manager.clearAllTempFiles();
            console.log('Cleared temp files:');
            console.log(`  Upload: ${cleared.uploadDeleted}`);
            console.log(`  Output: ${cleared.outputDeleted}`);
            break;

        case 'deps':
            console.log(JSON.stringify(manager.validateDependencies(), null, 2));
            break;

        case 'config':
            console.log(JSON.stringify(manager.getConfiguration(), null, 2));
            break;

        case 'endpoints':
            console.log(JSON.stringify(manager.getAPIEndpoints(), null, 2));
            break;

        case 'monitor':
            const interval = parseInt(process.argv[3]) || 5000;
            const mon = manager.startMonitoring(interval);
            console.log(`Monitoring every ${interval}ms. Press Ctrl+C to stop.`);
            process.on('SIGINT', () => {
                manager.stopMonitoring(mon);
                process.exit(0);
            });
            break;

        default:
            console.log(`
PDF House Management Tools

Usage: node tools.js <command> [options]

Commands:
  health              Check server health status
  stats               Show system statistics
  dirs                Show directory usage
  report              Generate full system report
  cleanup [hours]     Clean files older than hours (default: 1)
  clear               Clear all temp files
  deps                Validate dependencies
  config              Show configuration
  endpoints           List API endpoints
  monitor [ms]        Monitor server (interval in ms, default: 5000)

Examples:
  node tools.js health
  node tools.js cleanup 24
  node tools.js monitor 10000
            `);
    }
}
