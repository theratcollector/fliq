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

const {saveMessage, getHistory, saveUser, findUserByusername, findRoomById, newRoomUser} = require("./db");
const {login, verifyToken} = require("./auth");
const { verify } = require("crypto");

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
    const history = getHistory();
    socket.send(JSON.stringify(history));
    socket.on("message", async (msg) => {
        let parsedMsg

        try{
            parsedMsg = JSON.parse(msg);
        }catch{
            return socket.send(JSON.stringify({
                type:"error",
                error:"Invalid JSON format"
            }))
        }

        const type = parsedMsg.type;

        switch(type){
            case "newMessage":
                newMessage();
                break;
            case "newRoom":
                newRoomUser();
            default:
                socket.send(JSON.stringify({ type:"error", error:"Unknown message type"}));
        }

        function newMessage(){
            if(!parsedMsg.sender || !parsedMsg.content || !parsedMsg.room){
                socket.send(JSON.stringify({
                    type:"error",
                    error:"Missing sender, content or room field"
                }))
                return;
            }

            const newMessage = {
                id:newId,
                sender:parsedMsg.sender,
                content:parsedMsg.content,
                timestamp:Date.now(),
                type:parsedMsg.type,
                room:parsedMsg.room
            }

            saveMessage(newMessage);
            console.log(newMessage);

            wss.clients.forEach(client => {
                if (client.readyState === ws.OPEN) {
                    client.send(JSON.stringify(newMessage));
                }
            })
        }
    })
})

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server alive on port ${PORT}`);
})


function generateNewRoomId(){
    let exsists = true
    let id;

    while(exists){
        id = crypto.randomBytes(24).toString("hex");
        exists = findRoomById(id);
    }
    console.log("generated unique roomid: "+id);
    
}