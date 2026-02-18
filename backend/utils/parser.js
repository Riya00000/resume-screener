const mammoth = require('mammoth');
const fs = require('fs');
const { PdfReader } = require('pdfreader');

// pdf reader works with callbacks so we wrap it in a Promise
const parsePdf = (filePath) => {
  return new Promise((resolve, reject) => {
    const rows = {};

    new PdfReader().parseFileItems(filePath, (err, item) => {
      if (err) {
        reject(err);
        return;
      }

      // item is null when parsing is complete
      if (!item) {
        // Join all collected text rows into one string
        const text = Object.values(rows)
          .map(row => row.join(' '))
          .join('\n');
        resolve(text);
        return;
      }

      // item.text means it's a text element
      if (item.text) {
        // Group text by vertical position (item.y) to preserve lines
        const row = item.y;
        if (!rows[row]) rows[row] = [];
        rows[row].push(item.text);
      }
    });
  });
};

const parseResume = async (filePath, mimeType) => {

  // --- PDF ---
  if (mimeType === 'application/pdf') {
    const text = await parsePdf(filePath);
    return text;
  }

  // --- DOCX ---
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const fileBuffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return result.value;
  }

  throw new Error('Unsupported file type');
};

module.exports = { parseResume };