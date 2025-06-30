const { parse } = require("dotenv");
const express = require("express");
const ws = require("ws");
const http = require("http");
const bcrypt = require("bcrypt");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const wss = new ws.Server({ server });

const {saveMessage, getHistoryById, saveUser, findUserByusername, findRoomById, newRoomUser, getRoomsByUser, saveRoom, findRoombyRoomId, getUsersByRoom, checkIfUserInRoom} = require("./db");
const {login, verifyToken} = require("./auth");
const { verify } = require("crypto");
const { url } = require("inspector");

app.use(express.json());
app.use(cors());

const users = [];

app.post("/register", async (req, res) =>{
    console.log("received request");
    const data = req.body;

    try{
        if(data.username && data.password){
            const hashedPW = await bcrypt.hash(data.password, 10)
            const newUser = {
                //id set later
                username:data.username,
                password:hashedPW,
                rooms: JSON.stringify([]),
                role:"user",
                createdAt:Date.now()
            }

            console.log(newUser);

            saveUser(newUser);
            console.log(`successfully created user ${newUser.username} with password ${newUser.password}, id ${newUser.id} created at ${newUser.createdAt}`);
            res.status(200).send("success");
        }else{
            res.send("missing username or password");
        }
    }catch{
        res.status(400).send();
    }
})

app.post("/createChat", async (req, res) => {
    console.log("room creation request received");

    const authHeader = req.headers.authorization;
    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({error: "No Token received"});
    }

    const token = authHeader.split(" ")[1];
    const tokenData = verifyToken(token);

    const newRoom = {
        roomId:generateNewRoomId,
        roomName:req.body.addedChat,
        createdAt:Date.now()
    }

    try{
        saveRoom(newRoom);
        newRoomUser(tokenData.decoded.username,newRoom.roomId)
        newRoomUser(req.body.addedChat,newRoom.roomId)
        res.status(200);
    }catch{
        console.log("error creating the room");
        res.status(500);
    }
})

app.post("/checkLogin", async (req, res)=>{
    const authHeader = req.headers.authorization;
    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({error: "No Token received"});
    }

    const token = authHeader.split(" ")[1];

    try{
        const tokenData = verifyToken(token);
        if(tokenData.valid){
            res.json({valid:true, username:tokenData.decoded.username});
        }
    }catch(err){
        console.log("error verifying token: "+err.message);
        res.status(401).json({valid:false, error:err.message});
    }
})

app.post("/login", async (req, res) => {
    console.log("login request received");
    const username = req.body.username;
    const password = req.body.password;

    try{
        const token = await login(username, password);
        res.json({token});
        console.log("success! sent out token: "+token);
    }catch(err){
        res.status(401).json({error:err.message});
        console.log("error: "+err.message);
    }
})

wss.on("connection", socket =>{
    console.log("New client connected");
    socket.on("message", async (msg) => {
        let parsedMsg

        try{
            parsedMsg = JSON.parse(msg);
        }catch{
            console.log("error parsing message: ",msg.toString());
            return socket.send(JSON.stringify({
                type:"error",
                error:"Invalid JSON format"
            }))
        }

        const type = parsedMsg.type;

        //route functions

        function getRooms() {
            console.log("get rooms request received");
            if(parsedMsg.token){
                const token = parsedMsg.token;
                let tokenData;
                try {
                    tokenData = verifyToken(token);
                }catch (err) {
                    console.log("error verifying token: "+err.message);
                    return socket.send(JSON.stringify({
                        type: "error",
                        error: "Invalid token"
                    }));
                }

                const username = tokenData.decoded.username;
                console.log(`New connection from ${username}`);

                const rooms = getRoomsByUser(username);
                let roomsArray = [];
                
                rooms.forEach(roomId => {
                    const room = findRoombyRoomId(roomId);
                    const users = getUsersByRoom(room.roomId);                

                    if(room){
                        roomsArray.push({
                            roomId: room.roomId,
                            roomName: room.roomName,
                            createdAt: room.createdAt,
                            users: users
                        });
                    }else{
                        console.log(`Room with ID ${roomId} not found for user ${username}`);
                    }
                })
                
                /*
                if(!rooms || rooms.length === 0){
                    console.log(`No rooms found for user ${username}`);
                    socket.send(JSON.stringify({
                        type: "rooms",
                        rooms: "",
                        users: []
                    }));
                    return;
                }
                */
                socket.send(JSON.stringify({
                    type: "rooms",
                    rooms: roomsArray,
                }));
            }else{
                return socket.send(JSON.stringify({
                    type: "error",
                    error: "No auth provided"
                }));
            }
        }

        function getRoomUsers(){
            if(parsedMsg.token){
                const token = parsedMsg.token;
                let tokenData;

                try{
                    tokenData = verifyToken(token);
                }catch (err) {
                    console.log("error verifying token: "+err.message);
                    return socket.send(JSON.stringify({
                        type: "error",
                        error: "Invalid token"
                    }));
                }

                const roomId = parsedMsg.roomId;
                const username = tokenData.decoded.username;

                console.log("get room users request from "+username+" for room "+roomId);

                if(checkIfUserInRoom(username, roomId)){
                    const users = getUsersByRoom(roomId);

                    if(users){
                        console.log(`Users in room ${roomId}: `, users);
                        socket.send(JSON.stringify({
                            type: "roomUsers",
                            roomId: roomId,
                            users: users
                        }));
                    }
                }
            }
        };

        function newRoom() {
            const token = parsedMsg.token;
            const addedChat = parsedMsg.roomName;

            if (!token) {
                return socket.send(JSON.stringify({
                    type: "error",
                    error: "No token provided"
                }));
            }

            let tokenData;
            try {
                tokenData = verifyToken(token);
            } catch (err) {
                return socket.send(JSON.stringify({
                    type: "error",
                    error: "Invalid token"
                }));
            }

            const username = tokenData?.decoded?.username;
            if (!username || !addedChat) {
                return socket.send(JSON.stringify({
                    type: "error",
                    error: "Missing username or addedChat"
                }));
            }

            const newRoom = {
                roomId: generateNewRoomId(),
                roomName: "",
                createdAt: Date.now()
            };

            try {
                console.log("DEBUG IMPORTANT: "+newRoom.roomId);
                saveRoom(newRoom);
                newRoomUser(username, newRoom.roomId);
                newRoomUser(addedChat, newRoom.roomId);

                newRoom.users = getUsersByRoom(newRoom.roomId);

                const message = {
                    type: "newRoom",
                    room: newRoom,
                };

                wss.clients.forEach(client => {
                    if (client.readyState === ws.OPEN) {
                        client.send(JSON.stringify(message));
                    }
                });

            } catch (err) {
                console.log("Error creating the room:", err);
                socket.send(JSON.stringify({
                    type: "error",
                    error: "Room creation failed"
                }));
            }
        }

        function newMessage(){
            console.log("new message request received: ", parsedMsg);

            const token = parsedMsg.token;
            const addedChat = parsedMsg.roomName;

            if (!token) {
                return socket.send(JSON.stringify({
                    type: "error",
                    error: "No token provided"
                }));
            }

            let tokenData;
            try {
                tokenData = verifyToken(token);
            } catch (err) {
                return socket.send(JSON.stringify({
                    type: "error",
                    error: "Invalid token"
                }));
            }




            if(!tokenData.decoded.username || !parsedMsg.content || !parsedMsg.roomId){
                socket.send(JSON.stringify({
                    type:"error",
                    error:"Missing sender, content or room field"
                }))
                return;
            }

            const newMessage = {
                sender:tokenData.decoded.username,
                content:parsedMsg.content,
                timestamp:Date.now(),
                msgType:parsedMsg.msgType,
                room:parsedMsg.roomId
            }

            saveMessage(newMessage);
            console.log(newMessage);

            const messageToClients = {
                type:"newMessage",
                sender:tokenData.decoded.sender,
                content:parsedMsg.content,
                timestamp:Date.now(),
                msgType:parsedMsg.msgType,
                room:parsedMsg.roomId
            }

            wss.clients.forEach(client => {
                if (client.readyState === ws.OPEN) {
                    client.send(JSON.stringify(messageToClients));
                }
            })
        }

        function getMessages(){
            const token = parsedMsg.token;
            const addedChat = parsedMsg.roomName;

            if (!token) {
                return socket.send(JSON.stringify({
                    type: "error",
                    error: "No token provided"
                }));
            }

            let tokenData;
            try {
                tokenData = verifyToken(token);
            } catch (err) {
                return socket.send(JSON.stringify({
                    type: "error",
                    error: "Invalid token"
                }));
            }

            const roomId = parsedMsg.roomId;
            const username = tokenData.decoded.username;

            if(checkIfUserInRoom(username, roomId)){
                let messages = getHistoryById(roomId);

                const messageToClients = {
                    type:"messageHistory",
                    messages:messages,
                    roomId: roomId
                }

                wss.clients.forEach(client => {
                    if (client.readyState === ws.OPEN) {
                        client.send(JSON.stringify(messageToClients));
                    }
                })
            }else{
                return socket.send(JSON.stringify({
                    type: "error",
                    error: "Unauthorized access to room messages"
                }));
            }
        }

        //------------------------------------------------------------------------------------------------          ROUTING 

        switch(type){
            case "newMessage":
                console.log("send new message");
                newMessage();
                break;
            case "newRoom":
                console.log("create new room");
                newRoom();
                break;
            case "getRooms":
                console.log("get rooms");
                getRooms();
                break;
            case "getRoomUsers":
                console.log("get room users");
                getRoomUsers();
                break;
            case "getMessages":
                console.log("get messages")
                getMessages();
                break;
            default:
                socket.send(JSON.stringify({ type:"error", error:"Unknown message type"}));
        }
    });
})

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server alive on port ${PORT}`);
})


function generateNewRoomId(){
    let exists = true
    let id;

    while(exists){
        id = crypto.randomBytes(24).toString("hex");
        exists = findRoomById(id);
    }
    console.log("generated unique roomid: "+id);
    return id;
    
}