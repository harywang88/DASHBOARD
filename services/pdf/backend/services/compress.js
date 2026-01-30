const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

async function compressPDF(filePath, level = 'medium') {
    try {
        console.log(`Compressing PDF: ${filePath}, level: ${level}`);
        
        // Load the PDF
        const pdfBuffer = await fs.readFile(filePath);
        const pdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });

        // Save with basic compression
        const compressedBuffer = await pdf.save();
        
        // Save the output PDF
        const outputPath = path.join(__dirname, '../output', `compressed-${Date.now()}.pdf`);
        await fs.writeFile(outputPath, compressedBuffer);

        // Delete input file
        await fs.unlink(filePath).catch((err) => {
            console.error(`Failed to delete ${filePath}:`, err.message);
        });

        console.log('✓ PDF compressed successfully:', outputPath);
        return outputPath;
    } catch (error) {
        console.error('Compress error:', error);
        throw new Error(`Gagal mengompres PDF: ${error.message}`);
    }
}

module.exports = compressPDF;
