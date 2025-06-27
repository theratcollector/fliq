const { parse } = require("dotenv");
const express = require("express");
const ws = require("ws");
const http = require("http");

const app = express();
const server = http.createServer(app);
const wss = new ws.Server({ server });

const {saveMessage, getHistory} = require("./db");

app.use(express.json());

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