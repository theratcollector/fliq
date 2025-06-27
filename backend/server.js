const { parse } = require("dotenv");
const express = require("express");
const ws = require("ws");

const app = express();
const wss = WebSocket.Server({ server });

app.use(express.json());

const history = [];



wss.on("connection", socket =>{
    socket.send(history);
    socket.on("Message", async (msg) => {
        const parsedMsg = JSON.parse(msg);
        
        const lastId = history.length;
        const newId = 1;

        if(lastId=0){
            newId=1
        }else{
            newId=lastId+1;
        }

        const newMessage = {
            id:newId,
            sender:parsedMsg.sender,
            content:parsedMsg.content,
            timestamp:Date.now(),
            type:parsedMsg.type
        }

        history.push(newMessage);

        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(newMessage);
            }
        })
    })
})