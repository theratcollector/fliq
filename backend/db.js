const Database = require("better-sqlite3");

const db = new Database("messages.db");

db.prepare(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    type TEXT
  )
`).run();

function saveMessage(msg){
    db.prepare(`
    INSERT INTO messages (sender, content, timestamp, type)
    VALUES (?, ?, ?, ?)
  `).run(msg.sender, msg.content, msg.timestamp, msg.type);
}

function getHistory() {
  return db.prepare(`SELECT * FROM messages ORDER BY id ASC`).all();
}

module.exports = { saveMessage, getHistory };