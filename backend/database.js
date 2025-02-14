const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create a new database file
const dbPath = path.join(__dirname, 'bible.db');
const db = new sqlite3.Database(dbPath);

// Create a table for storing Bible quotations
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS quotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book TEXT NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      text TEXT NOT NULL,
      version TEXT NOT NULL
    )
  `);
});

module.exports = db;