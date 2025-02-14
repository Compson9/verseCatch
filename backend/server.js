const express = require('express');
const cors = require('cors'); // Import cors
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const db = require('./database'); // Import the database module
require('dotenv').config();

const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors());

// Initialize OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Make sure to set your OpenAI API key in the environment variables
});

// Configure multer for file uploads
const upload = multer({ dest: path.join(__dirname, 'uploads') });

app.post('/api/upload', upload.single('audio'), async (req, res) => {
  const file = req.file;
  if (!file) {
    console.error('No file uploaded');
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const filePath = file.path;
  console.log('File uploaded to:', filePath);

  try {
    // Read the audio file
    const audioData = fs.createReadStream(filePath);

    // Transcribe the audio using OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioData,
      model: 'whisper-1', // Specify the Whisper model
      response_format: 'text', // Ensure the response format is text
    });

    console.log('Transcription:', transcription.text);

    // Extract Bible quote addresses using regular expressions
    const bibleQuotePattern = /\b([A-Za-z]+)\s(\d+:\d+)\b/g;
    const bibleQuotes = [];
    let match;
    while ((match = bibleQuotePattern.exec(transcription.text)) !== null) {
      bibleQuotes.push({ name: `${match[1]} ${match[2]}` });
    }

    console.log('Bible Quotes:', bibleQuotes);

    // Query the database for the full quotations
    const quotations = await Promise.all(bibleQuotes.map(quote => {
      return new Promise((resolve, reject) => {
        const [book, chapterVerse] = quote.name.split(' ');
        const [chapter, verse] = chapterVerse.split(':').map(Number);

        const query = `SELECT text FROM quotations WHERE book = ? AND chapter = ? AND verse = ?`;
        db.get(query, [book, chapter, verse], (err, row) => {
          if (err) {
            console.error('Error querying the database:', err);
            return reject(err);
          }
          if (row) {
            resolve({ reference: quote.name, text: row.text });
          } else {
            resolve(null);
          }
        });
      });
    }));

    // Filter out null values
    const filteredQuotations = quotations.filter(q => q !== null);

    // Send the transcription and extracted Bible quotes back to the client
    res.status(200).json({
      message: 'File uploaded and transcribed successfully',
      transcription: transcription.text,
      bibleQuotes: filteredQuotations,
    });
  } catch (error) {
    console.error('Error processing the audio:', error);
    res.status(500).json({ message: 'Error processing the audio', error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});