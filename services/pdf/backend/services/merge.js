const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

async function mergePDFs(filePaths) {
    try {
        // Create a new PDF document
        const mergedPdf = await PDFDocument.create();

        // Copy pages from each PDF
        for (const filePath of filePaths) {
            try {
                const pdfBuffer = await fs.readFile(filePath);
                const pdf = await PDFDocument.load(pdfBuffer);
                const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                pages.forEach((page) => mergedPdf.addPage(page));
            } catch (fileError) {
                console.error(`Error processing file ${filePath}:`, fileError.message);
            }
        }

        // Save the merged PDF
        const outputPath = path.join(__dirname, '../output', `merged-${Date.now()}.pdf`);
        const pdfBuffer = await mergedPdf.save();
        await fs.writeFile(outputPath, pdfBuffer);

        // Delete input files
        for (const filePath of filePaths) {
            await fs.unlink(filePath).catch((err) => {
                console.error(`Failed to delete ${filePath}:`, err.message);
            });
        }

        console.log('✓ PDF merged successfully:', outputPath);
        return outputPath;
    } catch (error) {
        console.error('Merge error:', error);
        throw new Error(`Gagal menggabungkan PDF: ${error.message}`);
    }
}

module.exports = mergePDFs;
