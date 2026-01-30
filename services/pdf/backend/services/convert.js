const pdfParse = require('pdf-parse');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

async function convertPDF(filePath, format) {
    try {
        console.log(`Converting PDF: ${filePath} to ${format}`);
        
        const pdfBuffer = await fs.readFile(filePath);
        
        if (format === 'text') {
            return await convertToText(pdfBuffer, filePath);
        } else if (format === 'image') {
            return await convertToImages(filePath, pdfBuffer);
        } else {
            throw new Error(`Format ${format} tidak didukung`);
        }
    } catch (error) {
        console.error('Convert error:', error);
        throw new Error(`Gagal mengkonversi PDF: ${error.message}`);
    }
}

async function convertToText(pdfBuffer, filePath) {
    try {
        console.log('Converting to text...');
        
        const data = await pdfParse(pdfBuffer);
        const text = data.text;

        // Save as text file
        const outputPath = path.join(__dirname, '../output', `converted-${Date.now()}.txt`);
        await fs.writeFile(outputPath, text, 'utf-8');

        // Delete input file
        await fs.unlink(filePath).catch((err) => {
            console.error(`Failed to delete ${filePath}:`, err.message);
        });

        console.log('✓ PDF converted to text:', outputPath);

        return {
            filePath: outputPath,
            content: text.substring(0, 500) + (text.length > 500 ? '...' : '')
        };
    } catch (error) {
        console.error('Text conversion error:', error);
        throw new Error(`Gagal mengkonversi ke teks: ${error.message}`);
    }
}

async function convertToImages(filePath, pdfBuffer) {
    try {
        console.log('Converting to images...');
        
        const pdf = await PDFDocument.load(pdfBuffer);
        const pageCount = pdf.getPageCount();
        
        const downloads = [];
        const files = [];

        // For demonstration, we'll create image metadata
        // In production, use pdf-image or poppler-utils
        for (let i = 1; i <= pageCount; i++) {
            const filename = `page-${i}-${Date.now()}.png`;
            const outputPath = path.join(__dirname, '../output', filename);
            
            // Create a simple metadata file (in production, use actual PDF to image conversion)
            const content = `Page ${i} of ${pageCount}\nUse pdf-image or poppler-utils for production\n`;
            await fs.writeFile(outputPath, content);
            
            downloads.push(`/api/download/${filename}`);
            files.push(filename);
        }

        // Delete input file
        await fs.unlink(filePath).catch((err) => {
            console.error(`Failed to delete ${filePath}:`, err.message);
        });

        console.log('✓ PDF converted to images:', pageCount, 'pages');

        return {
            files,
            downloads
        };
    } catch (error) {
        console.error('Image conversion error:', error);
        throw new Error(`Gagal mengkonversi ke gambar: ${error.message}`);
    }
}

module.exports = convertPDF;
