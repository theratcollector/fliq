const { parse } = require("dotenv");
const express = require("express");
const ws = require("ws");
const http = require("http");
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const wss = new ws.Server({ server });

const {saveMessage, getHistory} = require("./db");

app.use(express.json());
app.use(cors());

const users = [];

app.post("/register", async (req, res) =>{
    console.log("received request");
    const data = req.body;

    const lastId = users.length;
    let newId = 1;

    if(lastId==0){
        newId=1
    }else{
        newId=lastId+1;
    }

    try{
        if(data.email || data.password){
            const hashedPW = await bcrypt.hash(data.password, 10)
            const newUser = {
                id:newId,
                email:data.email,
                password:hashedPW,
                rooms:"",
                role:"user",
                createdAt:Date.now()
            }

            users.push(newUser);
            console.log(`successfully created user ${newUser.email} with password ${newUser.password}, id ${newUser.id} created at ${newUser.createdAt}`);
            res.status(200).send("success");
        }else{
            res.send("missing username or password");
        }
    }catch{
        res.status(400).send();
    }
})

wss.on("connection", socket =>{
    const history = getHistory();
    socket.send(JSON.stringify(history));
    socket.on("message", async (msg) => {
        const parsedMsg = JSON.parse(msg);

        if(!parsedMsg.sender || !parsedMsg.content || !parsedMsg.room){
            socket.send(JSON.stringify({
                type:"error",
                error:"Missing sender, content or room field"
            }))
            return;
        }
        
        const lastId = history.length;
        let newId = 1;

        if(lastId==0){
            newId=1
        }else{
            newId=lastId+1;
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
    })
})

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server alive on port ${PORT}`);
})