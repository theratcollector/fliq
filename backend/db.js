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
        roomName TEXT,
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
    const stmt = messagesDB.prepare(`
        INSERT INTO messages (sender, content, timestamp, type, room)
        VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(msg.sender, msg.content, msg.timestamp, msg.msgType, msg.roomId);

    // Gib die Nachricht mit der generierten ID zurück
    return {
        id: result.lastInsertRowid,
        sender: msg.sender,
        content: msg.content,
        timestamp: msg.timestamp,
        msgType: msg.msgType,
        roomId: msg.roomId
    };
}


function getHistoryById(roomId) {
  return messagesDB
    .prepare(`SELECT * FROM messages WHERE room = ?`).all(roomId);
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
  console.log("Adding user to room: "+user+" in room: "+room);
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

function getRoomsByUser(username) {
    try {
        const rows = roomsDB.prepare(`
            SELECT roomId FROM room_users WHERE username = ?
        `).all(username);

        return rows.map(row => row.roomId);
    } catch (err) {
        console.error("Error in DB:", err.message);
        return [];
    }
}

function findRoombyRoomId(roomId) {
    return roomsDB.prepare(`SELECT * FROM rooms WHERE roomId = ?`).get(roomId)
  };

function getUsersByRoom(roomId) {
  return roomsDB.prepare(`
      SELECT username FROM room_users WHERE roomId = ?
  `).all(roomId).map(row => row.username);
}

function checkIfUserInRoom(username, roomId){
  const result = roomsDB.prepare(`
    SELECT * FROM room_users WHERE username = ? AND roomId = ?`).get(username, roomId);
  return result ? true : false;
}

function deleteAccount(username) {
    const deletedName = "[deleted]";

    try {
        // 1. Nachrichten anonymisieren
        messagesDB.prepare(`
            UPDATE messages SET sender = ? WHERE sender = ?
        `).run(deletedName, username);

        // 2. Raumnamen anpassen, falls es 1:1-Chats waren (roomName war der Username)
        const oneToOneRooms = roomsDB.prepare(`
            SELECT r.roomId, r.roomName
            FROM rooms r
            JOIN room_users ru ON r.roomId = ru.roomId
            WHERE r.roomName = ?
        `).all(username);

        oneToOneRooms.forEach(room => {
            roomsDB.prepare(`
                UPDATE rooms SET roomName = ? WHERE roomId = ?
            `).run(deletedName, room.roomId);
        });

        // 3. Beziehungen zu Räumen entfernen
        roomsDB.prepare(`
            DELETE FROM room_users WHERE username = ?
        `).run(username);

        // 4. User löschen
        usersDB.prepare(`
            DELETE FROM users WHERE username = ?
        `).run(username);

        console.log(`✅ Account '${username}' gelöscht.`);
        return true;
    } catch (err) {
        console.error(`❌ Fehler beim Löschen von '${username}':`, err.message);
        return false;
    }
}




module.exports = { saveMessage, getHistoryById, saveUser, findUserByusername, findRoomById, saveRoom, newRoomUser, getRoomsByUser, findRoombyRoomId, getUsersByRoom, checkIfUserInRoom, deleteAccount};