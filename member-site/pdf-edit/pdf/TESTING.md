# PDF Editor Testing Guide

## Backend Testing

### 1. Text Extraction Test
```bash
# Test extract text dari PDF
curl -X POST http://localhost:3000/api/extract-text \
  -F "file=@sample.pdf"
```

Expected Response:
```json
{
  "success": true,
  "pages": [
    {
      "pageNumber": 1,
      "text": "extracted text",
      "lines": ["line1", "line2"],
      "items": [...]
    }
  ],
  "totalPages": 1
}
```

### 2. Edit Text Test (Single Page)
```bash
curl -X POST http://localhost:3000/api/edit \
  -F "file=@sample.pdf" \
  -F "editMode=add" \
  -F "text=New Text" \
  -F "fontSize=12" \
  -F "color=#FF0000"
```

### 3. Batch Edit Test (Multiple Edits)
```bash
curl -X POST http://localhost:3000/api/edit \
  -F "file=@sample.pdf" \
  -F "editMode=batch" \
  -F "edits=[{\"page\":1, \"x\":100, \"y\":100, \"width\":200, \"height\":50, \"text\":\"Edited\"}]"
```

## Frontend Testing

### 1. Edit Tools Test
- [ ] Text Tool: Click to add new text
- [ ] Edit Text Tool: Click to select, drag to move, double-click to edit
- [ ] Find & Replace: Search and replace functionality
- [ ] Export/Import: Save and load edit state

### 2. Text Formatting Test
- [ ] Bold button working
- [ ] Italic button working
- [ ] Underline button working
- [ ] Font family changing
- [ ] Font size slider working
- [ ] Color picker working

### 3. Advanced Features Test
- [ ] Copy text (Ctrl+C)
- [ ] Duplicate text (Ctrl+D)
- [ ] Delete text (Delete/Backspace)
- [ ] Undo/Redo functionality
- [ ] Text statistics updating
- [ ] Save and download with all edits

## Integration Testing

### 1. End-to-End Workflow
1. Upload PDF
2. Add text using Text tool
3. Edit existing text using Edit Text tool
4. Use Find & Replace to change text
5. Apply formatting (Bold, Italic, etc.)
6. Export edits to JSON
7. Import edits back
8. Save and download

### 2. Multi-Page Testing
1. Upload multi-page PDF
2. Navigate between pages
3. Make edits on different pages
4. Save all edits
5. Verify all pages have correct edits

### 3. Error Handling Test
- [ ] Handle invalid PDF
- [ ] Handle missing files
- [ ] Handle large files (>100MB)
- [ ] Handle concurrent requests
- [ ] Handle malformed JSON in import

## Performance Testing

- [ ] Large PDF (10+ pages)
- [ ] Multiple edits (50+)
- [ ] Large text replacements
- [ ] Memory usage monitoring
- [ ] Response time < 5 seconds for typical operations

## Quality Assurance

- [ ] No console errors
- [ ] No memory leaks
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness
- [ ] Accessibility compliance
