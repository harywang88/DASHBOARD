const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

function parsePageRange(pagesStr, maxPages) {
    const pages = new Set();
    const parts = pagesStr.split(',').map(p => p.trim());

    for (let part of parts) {
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(p => parseInt(p.trim()));
            for (let i = start; i <= end && i <= maxPages; i++) {
                if (i > 0) pages.add(i);
            }
        } else {
            const page = parseInt(part);
            if (page > 0 && page <= maxPages) pages.add(page);
        }
    }

    return Array.from(pages).sort((a, b) => a - b);
}

async function splitPDF(filePath, pagesStr) {
    try {
        console.log(`Splitting PDF: ${filePath}, pages: ${pagesStr}`);
        
        // Load the PDF
        const pdfBuffer = await fs.readFile(filePath);
        const pdf = await PDFDocument.load(pdfBuffer);
        const totalPages = pdf.getPageCount();

        console.log(`Total pages: ${totalPages}`);

        // Parse page numbers
        const pagesToExtract = parsePageRange(pagesStr, totalPages);

        console.log(`Pages to extract: ${pagesToExtract.join(',')}`);

        if (pagesToExtract.length === 0) {
            throw new Error('Halaman yang dipilih tidak valid');
        }

        // Create new PDF with selected pages
        const newPdf = await PDFDocument.create();
        for (const pageIndex of pagesToExtract) {
            const [copiedPage] = await newPdf.copyPages(pdf, [pageIndex - 1]);
            newPdf.addPage(copiedPage);
        }

        // Save the output PDF
        const outputPath = path.join(__dirname, '../output', `split-${Date.now()}.pdf`);
        const pdfOutputBuffer = await newPdf.save();
        await fs.writeFile(outputPath, pdfOutputBuffer);

        // Delete input file
        await fs.unlink(filePath).catch((err) => {
            console.error(`Failed to delete ${filePath}:`, err.message);
        });

        console.log('✓ PDF split successfully:', outputPath);
        return outputPath;
    } catch (error) {
        console.error('Split error:', error);
        throw new Error(`Gagal membagi PDF: ${error.message}`);
    }
}

module.exports = splitPDF;
