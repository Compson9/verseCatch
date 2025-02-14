const fs = require('fs');
const path = require('path');
const db = require('./database');

// Path to the BibleTranslations data
const dataPath = path.join(__dirname, 'AKJV_bible.json');

// Read and parse the data
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Populate the database
db.serialize(() => {
  const stmt = db.prepare(`
    INSERT INTO quotations (book, chapter, verse, text, version)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const book in data) {
    for (const chapter in data[book]) {
      for (const verse in data[book][chapter]) {
        const text = data[book][chapter][verse];
        stmt.run(book, chapter, verse, text, 'AKJV');
      }
    }
  }

  stmt.finalize();
});

console.log('Database populated successfully.');
db.close();