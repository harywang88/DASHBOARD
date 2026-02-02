#!/usr/bin/env node

/**
 * PDF Batch Processor
 * Process multiple PDFs with various operations
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

class BatchProcessor {
    constructor() {
        this.PORT = process.env.PORT || 3000;
    }

    /**
     * Process files with API call
     */
    async processFile(filePath, apiEndpoint, data = {}) {
        return new Promise((resolve, reject) => {
            const fileContent = fs.readFileSync(filePath);
            
            // For simplicity, we'll make API calls
            // In production, you might want to use a proper HTTP library
            const options = {
                hostname: 'localhost',
                port: this.PORT,
                path: apiEndpoint,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            const req = http.request(options, (res) => {
                let responseData = '';
                res.on('data', chunk => responseData += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(responseData));
                    } catch (err) {
                        reject(new Error('Invalid response'));
                    }
                });
            });

            req.on('error', reject);
            req.write(JSON.stringify({ file: filePath, ...data }));
            req.end();
        });
    }

    /**
     * Compress batch
     */
    async compressBatch(inputDir, outputDir, level = 'medium') {
        const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.pdf'));
        const results = { success: 0, failed: 0, files: [] };

        for (const file of files) {
            try {
                const filePath = path.join(inputDir, file);
                console.log(`Compressing: ${file}`);

                const result = await this.processFile(filePath, '/api/compress', { level });
                
                if (result.success) {
                    results.success++;
                    results.files.push({
                        original: file,
                        output: result.file,
                        status: 'success'
                    });
                    console.log(`  ✓ Compressed`);
                } else {
                    results.failed++;
                    results.files.push({
                        original: file,
                        status: 'failed',
                        error: result.error
                    });
                    console.log(`  ✗ Failed: ${result.error}`);
                }
            } catch (err) {
                results.failed++;
                results.files.push({
                    original: file,
                    status: 'error',
                    error: err.message
                });
                console.log(`  ✗ Error: ${err.message}`);
            }
        }

        return results;
    }

    /**
     * Extract text batch
     */
    async extractTextBatch(inputDir, outputDir) {
        const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.pdf'));
        const results = { success: 0, failed: 0, files: [] };

        for (const file of files) {
            try {
                const filePath = path.join(inputDir, file);
                console.log(`Extracting from: ${file}`);

                const result = await this.processFile(filePath, '/api/extract-text', {});
                
                if (result.success) {
                    const outputFile = path.join(outputDir, file.replace('.pdf', '.txt'));
                    fs.writeFileSync(outputFile, result.fullText);
                    
                    results.success++;
                    results.files.push({
                        original: file,
                        output: path.basename(outputFile),
                        pages: result.totalPages,
                        status: 'success'
                    });
                    console.log(`  ✓ Extracted (${result.totalPages} pages)`);
                } else {
                    results.failed++;
                    results.files.push({
                        original: file,
                        status: 'failed',
                        error: result.error
                    });
                    console.log(`  ✗ Failed: ${result.error}`);
                }
            } catch (err) {
                results.failed++;
                results.files.push({
                    original: file,
                    status: 'error',
                    error: err.message
                });
                console.log(`  ✗ Error: ${err.message}`);
            }
        }

        return results;
    }

    /**
     * Merge batch - merge PDFs in groups
     */
    async mergeBatch(inputDir, outputDir, groupSize = 5) {
        const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.pdf'));
        const results = { success: 0, failed: 0, files: [], groups: 0 };

        for (let i = 0; i < files.length; i += groupSize) {
            const group = files.slice(i, i + groupSize);
            const groupNum = Math.floor(i / groupSize) + 1;

            try {
                console.log(`\nMerging group ${groupNum} (${group.length} files)`);

                const result = await this.processFile(
                    path.join(inputDir, group[0]),
                    '/api/merge',
                    { files: group.map(f => path.join(inputDir, f)) }
                );

                if (result.success) {
                    results.success++;
                    results.groups++;
                    results.files.push({
                        group: groupNum,
                        inputFiles: group.length,
                        output: result.file,
                        status: 'success'
                    });
                    console.log(`  ✓ Group merged`);
                } else {
                    results.failed++;
                    console.log(`  ✗ Failed: ${result.error}`);
                }
            } catch (err) {
                results.failed++;
                console.log(`  ✗ Error: ${err.message}`);
            }
        }

        return results;
    }

    /**
     * Convert batch
     */
    async convertBatch(inputDir, outputDir, format = 'png') {
        const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.pdf'));
        const results = { success: 0, failed: 0, files: [] };

        for (const file of files) {
            try {
                const filePath = path.join(inputDir, file);
                console.log(`Converting: ${file} to ${format}`);

                const result = await this.processFile(filePath, '/api/convert', { format });

                if (result.success) {
                    results.success++;
                    results.files.push({
                        original: file,
                        output: result.file,
                        format,
                        status: 'success'
                    });
                    console.log(`  ✓ Converted`);
                } else {
                    results.failed++;
                    results.files.push({
                        original: file,
                        status: 'failed',
                        error: result.error
                    });
                    console.log(`  ✗ Failed: ${result.error}`);
                }
            } catch (err) {
                results.failed++;
                console.log(`  ✗ Error: ${err.message}`);
            }
        }

        return results;
    }

    /**
     * Get file info batch
     */
    getFileInfoBatch(inputDir) {
        const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.pdf'));
        const results = [];

        for (const file of files) {
            const filePath = path.join(inputDir, file);
            const stats = fs.statSync(filePath);

            results.push({
                name: file,
                size: stats.size,
                sizeInMB: (stats.size / 1024 / 1024).toFixed(2),
                created: stats.birthtime,
                modified: stats.mtime
            });
        }

        return results;
    }

    /**
     * Report generation
     */
    generateReport(results, operation) {
        const report = {
            timestamp: new Date().toISOString(),
            operation,
            summary: {
                total: results.files.length,
                success: results.success,
                failed: results.failed,
                successRate: `${((results.success / results.files.length) * 100).toFixed(2)}%`
            },
            details: results.files
        };

        return report;
    }
}

// CLI
if (require.main === module) {
    const processor = new BatchProcessor();
    const command = process.argv[2];
    const inputDir = process.argv[3];
    const outputDir = process.argv[4] || './output';

    // Create output dir if not exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const showUsage = () => {
        console.log(`
PDF Batch Processor

Usage: node batch.js <command> <inputDir> [outputDir]

Commands:
  compress <dir>      Compress all PDFs in directory
  extract <dir>       Extract text from all PDFs
  merge <dir>         Merge PDFs in groups
  convert <dir>       Convert PDFs to PNG
  info <dir>          Get info about PDFs

Examples:
  node batch.js compress ./pdfs
  node batch.js extract ./pdfs ./text_output
  node batch.js merge ./pdfs ./merged_output
  node batch.js convert ./pdfs ./images
  node batch.js info ./pdfs
        `);
    };

    if (!command || !inputDir) {
        showUsage();
        process.exit(1);
    }

    if (!fs.existsSync(inputDir)) {
        console.error(`Error: Directory not found: ${inputDir}`);
        process.exit(1);
    }

    (async () => {
        try {
            let results;

            switch(command) {
                case 'compress':
                    console.log('\n📦 Starting batch compression...\n');
                    results = await processor.compressBatch(inputDir, outputDir);
                    break;

                case 'extract':
                    console.log('\n📄 Starting batch text extraction...\n');
                    results = await processor.extractTextBatch(inputDir, outputDir);
                    break;

                case 'merge':
                    console.log('\n🔀 Starting batch merge...\n');
                    results = await processor.mergeBatch(inputDir, outputDir);
                    break;

                case 'convert':
                    console.log('\n🎨 Starting batch conversion...\n');
                    results = await processor.convertBatch(inputDir, outputDir, 'png');
                    break;

                case 'info':
                    console.log('\n📊 File Information\n');
                    results = processor.getFileInfoBatch(inputDir);
                    console.log(JSON.stringify(results, null, 2));
                    process.exit(0);

                default:
                    console.error(`Unknown command: ${command}`);
                    showUsage();
                    process.exit(1);
            }

            console.log('\n' + '='.repeat(50));
            console.log('📊 BATCH PROCESSING REPORT');
            console.log('='.repeat(50));

            const report = processor.generateReport(results, command);
            console.log(JSON.stringify(report, null, 2));

            // Save report
            const reportFile = path.join(outputDir, `report-${Date.now()}.json`);
            fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
            console.log(`\n✅ Report saved to: ${reportFile}`);

        } catch (err) {
            console.error('Error:', err.message);
            process.exit(1);
        }
    })();
}

module.exports = BatchProcessor;
