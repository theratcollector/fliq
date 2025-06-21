const express = require("express");
const ws = require("ws");
const Message = require("./message.model");
require("./db");

const app = express();
const wss = WebSocket.Server({ server });

wss.on("connection", socket =>{
    socket.on("Message", async (msg) => {
        const parsedMsg = JSON.parse(msg);

        const tempMsg = await Message.create({
            roomId: parsedMsg.roomId,
            sender: parsedMsg.sender,
            data: parsedMsg.data,
        })
    })
})