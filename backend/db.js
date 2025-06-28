const Database = require("better-sqlite3");

const messagesDB = new Database("db/messages.db");
const usersDB = new Database("db/users.db");
const roomsDB = new Database("db/rooms.db");

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
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      rooms TEXT,
      role TEXT DEFAULT 'user',
      createdAt INTEGER NOT NULL
    )
  `).run();

  //rooms db

  roomsDB.prepare(`
      CREATE TABLE IF NOT EXISTS rooms(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        roomId TEXT NOT NULL,
        roomName TEXT NOT NULL,
        createdAt INTEGER NOT NULL
      );
    `).run();

  roomsDB.prepare(`
      CREATE TABLE IF NOT EXISTS room_users(
        roomId TEXT NOT NULL,
        username TEXT NOT NULL,
        PRIMARY KEY (roomId, username)
      );
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
        INSERT INTO users (username, password, rooms, role, createdAt)
        VALUES (?, ?, ?, ?, ?)   
      `).run(user.username, user.password, user.rooms, user.role, user.createdAt);

      return 200;
  }catch (err){
    console.log("error: "+err.message);
    return 500;
  }
}

function findUserByusername(username){
  return usersDB.prepare(`SELECT * FROM users WHERE username = ?`).get(username);
}

//rooms functions

function findRoomById(id){
  return roomsDB.prepare(`SELECT id FROM rooms WHERE id = ?`).get(id);
}

function saveRoom(room){
  try{
    roomsDB.prepare(`
        INSERT INTO rooms (roomId, roomName, createdAt)
        VALUES (?, ?, ?)   
      `).run(room.roomId, room.roomName, room.createdAt);

      return 200;
  }catch (err){
    console.log("error: "+err.message);
    return 500;
  }
}

function newRoomUser(user, room){
  try{
    roomsDB.prepare(`
        INSERT INTO room_users  (roomId, username)
        VALUES (?, ?)
      `).run(room, user);
      return(200);
  }catch(err){
    console.log("error in db: "+err.message);
    return(500)
  }
}

module.exports = { saveMessage, getHistory, saveUser, findUserByusername, findRoomById, saveRoom, newRoomUser};