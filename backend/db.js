const Database = require("better-sqlite3");

const db = new Database("messages.db");

//messages db

db.prepare(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    type TEXT,
    room TEXT NOT NULL
  )
`).run();

//users db

db.prepare(`
    CREATE TABLE IF NOT EXISTS  users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      rooms TEXT,
      role TEXT DEFAULT 'user',
      createdAt INTEGER NOT NULL
    )
  `).run();


//messages functions

function saveMessage(msg){
    db.prepare(`
    INSERT INTO messages (sender, content, timestamp, type, room)
    VALUES (?, ?, ?, ?, ?)
  `).run(msg.sender, msg.content, msg.timestamp, msg.type, msg.room);
}

function getHistory() {
  return db.prepare(`SELECT * FROM messages ORDER BY id ASC`).all();
}

//users functions

function saveUser(user){
  db.prepare(`
      INSERT INTO users (email, password, rooms, role, createdAt)
      VALUES (?, ?, ?, ?, ?)   
    `).run(user.email, user.password, user.rooms, user.role, user.createdAt);
}

function findUserByEmail(email){
  return db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);
}

module.exports = { saveMessage, getHistory, saveUser, findUserByEmail};