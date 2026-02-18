const fs = require('fs');
const { evaluateResume } = require('../utils/evaluator');
const express = require('express');
const multer = require('multer');
const router = express.Router();
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if(allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Unsupported file type'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

const { parseResume } = require('../utils/parser');
const { scoreResume } = require('../utils/scorer');


router.post('/screen', upload.array('resumes', 10), async (req, res) => {


  try {
    const { jobDescription } = req.body; 
    const files = req.files; 

    // --- Validation ---
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Please upload at least one resume' });
    }

    if (!jobDescription || jobDescription.trim() === '') {
      return res.status(400).json({ error: 'Please provide a job description' });
    }

    const results = [];

    for (const file of files) {
   
      const resumeText = await parseResume(file.path, file.mimetype);
     
      const score = await scoreResume(resumeText, jobDescription);
        const  evaluation = evaluateResume(resumeText, score);
      results.push({
        filename: file.originalname,
        ...evaluation // spread the evaluation object (which includes score, category, etc.)
      });
      fs.unlinkSync(file.path);
    }

    // Sort results by score, highest first
    results.sort((a, b) => b.score - a.score);

    // Send back the ranked results
    res.json({
      success: true,
      totalResumes: files.length,
      results: results
    });

  } catch (error) {
    console.error('Screening error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Handle multer errors (file too large, wrong type etc.)
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Max size is 5MB' });
    }
  }
  res.status(400).json({ error: err.message });
});


module.exports = router;