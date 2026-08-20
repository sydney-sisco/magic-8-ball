// Shared SQLite connection for the bot's local data.
// All modules that need persistence (conversation context, reminders) use this
// single connection to avoid concurrent writers on the same database file.
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, 'conversations.db'));

// close the database cleanly on shutdown
process.on('exit', () => {
  try {
    db.close();
  } catch (e) {
    // database already closed
  }
});

module.exports = db;
