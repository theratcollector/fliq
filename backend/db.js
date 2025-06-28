const Database = require("better-sqlite3");

const messagesDB = new Database("messages.db");
const usersDB = new Database("users.db");

//messages db

messagesDB.prepare(`
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

usersDB.prepare(`
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
    messagesDB.prepare(`
    INSERT INTO messages (sender, content, timestamp, type, room)
    VALUES (?, ?, ?, ?, ?)
  `).run(msg.sender, msg.content, msg.timestamp, msg.type, msg.room);
}

function getHistory() {
  return messagesDB.prepare(`SELECT * FROM messages ORDER BY id ASC`).all();
}

//users functions

function saveUser(user){
  try{
    usersDB.prepare(`
        INSERT INTO users (email, password, rooms, role, createdAt)
        VALUES (?, ?, ?, ?, ?)   
      `).run(user.email, user.password, user.rooms, user.role, user.createdAt);

      return 200;
  }catch (err){
    console.log("error: "+err.message);
    return 500;
  }
}

function findUserByEmail(email){
  return usersDB.prepare(`SELECT * FROM users WHERE email = ?`).get(email);
}

module.exports = { saveMessage, getHistory, saveUser, findUserByEmail};