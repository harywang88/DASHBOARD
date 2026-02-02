const PDFDocument = require('pdfkit');
const fs = require('fs');

// Create test PDF
const doc = new PDFDocument();
const filename = 'test.pdf';
doc.pipe(fs.createWriteStream(filename));

doc.fontSize(25).text('Test PDF Document', 100, 100);
doc.fontSize(12).text('This is a test PDF file for testing.', 100, 150);
doc.text('Page 1 - Testing Merge, Split, Compress, Convert, and Edit features', 100, 200);

doc.addPage();
doc.fontSize(25).text('Page 2 - Second Page', 100, 100);
doc.fontSize(12).text('This is the second page of the test document.', 100, 150);

doc.end();
console.log('Test PDF created successfully!');
