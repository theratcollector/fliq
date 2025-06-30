const presence1 = document.getElementById("pre-indic");
const selectionIndicator = document.getElementById("selectionIndicator");
const usernameText = document.getElementsByClassName("isWriting-text");
const msgContainer = document.getElementById("messages");
const input = document.getElementById("msg-input");
const inputBtn = document.getElementById("input-btn");

let isOnline = false;
let manuallyClosed = false;
let reconnectTimeout;
let reconnectInterval = 3000;


//environment Variables
let friendName = "Guest";

let currentRoomStatus = "Loading...";


const state = {
    currentRoomId: null,
    currentRoomName: "Loading...",
    username: "",
    rooms: [],
    messages:{}
}


//   MAIN WEBSOCKET LOGIC
let socket;

async function checkLogin() {
    const token = localStorage.getItem("token");

    if (token) {
        const res = await fetch("http://localhost:3000/checkLogin", {
            method: "POST",
            headers: {
                Authorization: "Bearer " + token
            }
        });

        const data = await res.json();


        if (!data.valid) {
            window.location.href = "../";
            return;
        }

        state.username = data.username;
        updateContent();
        
    }
}

checkLogin();

if (localStorage.getItem("token")) {
    initSocket(); // neue Funktion, die alles übernimmt
} else {
    window.location.href = "../login";
}


function initSocket() {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (socket) {
        socket.close(); // alte Verbindung schließen, um Duplikate zu vermeiden
    }

    socket = new WebSocket("ws://localhost:3000?token=" + token);

    socket.onopen = () => {
        console.log("✅ Connected to server");
        hideConnectionLostBanner();
        socket.send(JSON.stringify({ type: "getRooms", token }));

        if(state.currentRoomId){
            socket.send(JSON.stringify({
                type: "getMessages",
                token: localStorage.getItem("token"),
                roomId: state.currentRoomId
            }));
        }
    };

    socket.onmessage = handleSocketMessage;

    socket.onclose = () => {
        console.warn("❌ WebSocket closed. Trying to reconnect...");
        if (!manuallyClosed) {
            showConnectionLostBanner();
            reconnectTimeout = setTimeout(() => {
                initSocket();
            }, reconnectInterval);
        }
    };

    socket.onerror = (err) => {
        console.error("WebSocket error:", err);
        socket.close(); // Triggert `onclose` → reconnect
    };
}


    // -------------------------------------------------------------------------------------------------------------------   BACKEND MESSAGES TO FRONTEND ROUTING --------------------------------------------------  

function handleSocketMessage(event){
        const data = JSON.parse(event.data);
        console.log("Received data: ", data);
        switch(data.type){
            case "rooms":
                document.querySelectorAll(".chat-name-card").forEach(card => {
                    card.remove(); 
                });

                data.rooms.forEach(room => {
                    let renderRoomName 
                    if(room.roomName==""){
                        room.users.forEach(user => {
                            if(user !== state.username){
                                renderRoomName = user;
                            }
                        });
                    } else{
                        renderRoomName = room.roomName;
                    } 

                    room.roomName = renderRoomName;
                    state.rooms.push(room);
                    renderRooms();
                });
                break;
            case "error":
                console.error("Error: ", data.error);
                break;
            case "newRoom":
                let renderRoomName 
                if(data.room.roomName==""){
                    data.room.users.forEach(user => {
                        if(user !== state.username){
                            renderRoomName = user;
                        }
                    });
                } else{
                    renderRoomName = data.room.roomName;
                } 

                data.room.roomName = renderRoomName;
                state.rooms.push(data.room);
                addChatRoom(data.room);
                break;
            case "newMessage":
                if (data.message.roomId !== state.currentRoomId) {
                    return;
                }
                if(!state.messages[roomId]) state.messages[roomId] = [];
                state.messages[roomId].push(data.message);
                renderMessages();
                break;
            case"messageHistory":
            console.log("Message history:"+ data.messages);
                if (data.roomId !== state.currentRoomId) {
                    console.warn("Received messages for different room. Ignored.");
                    return;
                }
                if (!state.messages[data.roomId]) {
                    state.messages[data.roomId] = [];
                }

                data.messages.forEach(message => {
                    // Optional: Duplikate prüfen
                    const exists = state.messages[data.roomId].some(msg => msg.id === message.id);
                    if (!exists) {
                        state.messages[data.roomId].push(message);
                    }
                });

                if (data.roomId === state.currentRoomId) {
                    renderMessages();
                }


                break;
            default:
                console.warn("Unknown message type: ", data.type);
        }
    }






var currentFilter = true;

//presence1.value = isOnline ? "Online" : "Offline";
//presence1.style.color = isOnline ? "#40AA5C" : "#5d5f69";


inputBtn.addEventListener("click", function (event){
    if(input.value !== ""){
        sendMsg();
    }
});


function toggleAddUserForm(){
    const form = document.getElementById("addUserForm");
    const chatCards = document.querySelectorAll(".chat-name-card");

    const isVisible = form.style.display === "block";
    form.style.display = isVisible ? "none" : "block";

    chatCards.forEach(card => {
        card.style.display = isVisible ? "block" : "none";
    });
}

function submitNewUserChat() {
    const newUsername = document.getElementById("newUsername").value;
    if (!newUsername) return;

    if(socket && socket.readyState === WebSocket.OPEN){
        socket.send(JSON.stringify({
            type: "newRoom",
            token: localStorage.getItem("token"),
            roomName: newUsername
        }));
    }
}





function openMenu(){
    // open the user menu
    alert("Open the User Menu")
}

function openRoom(){
    // open the chat
    alert("Open the Chat")
}

function switchFilter(){
    currentFilter = !currentFilter;
    if(!currentFilter){
        selectionIndicator.style.left = "50%";
    } else{
        selectionIndicator.style.left = "0";
    }
}
function sendMsg(){
    if(socket && socket.readyState === WebSocket.OPEN){
        socket.send(JSON.stringify({
            type:"newMessage",
            token: localStorage.getItem("token"),
            content: input.value,
            sender: state.username,
            msgType: "text",
            roomId: state.currentRoomId
        }))
        input.value = "";
    }
}

function showConnectionLostBanner() {
    const banner = document.getElementById("serverErrorOverlay");
    banner.style.display = "flex";
}
function hideConnectionLostBanner() {
    const banner = document.getElementById("serverErrorOverlay");
    banner.style.display = "none";
}


function logout() {
    manuallyClosed = true;
    if (socket) socket.close();
    localStorage.removeItem("token");
    window.location.href = "/frontend";
}

function updateContent(){
    document.getElementById("greeting").textContent = state.username;
    document.getElementById("chatUserName").textContent = state.currentRoomName || "Loading...";
    //document.getElementById("chatUserStatus").textContent = currentRoomStatus || "Loading...";
}

function renderMessages(){
    const roomId = state.currentRoomId;
    const msgs = state.messages[roomId] || [];

    if (!roomId) return;

    msgContainer.innerHTML = "";
    msgs.forEach(message => {
        const messageElement = document.createElement("div");
        messageElement.className = message.sender === state.username ? "self-send-msg" : "friend-send-msg";
        messageElement.innerHTML = `<p>${message.content}</p>`;
        msgContainer.appendChild(messageElement);
    });

    const messageElement = document.createElement("div");
    messageElement.className = "placeholder-message";
    msgContainer.appendChild(messageElement);

    // Nach dem forEach:
    msgContainer.scrollTop = msgContainer.scrollHeight;

}

function renderRooms(){
    const container = document.querySelector(".chat-overview-card");
    const insertBeforeElement = document.getElementById("addUserForm");

    document.querySelectorAll(".chat-name-card").forEach(card => card.remove());

    state.rooms.forEach(room => {
        const chatCard = document.createElement("div");
        chatCard.className = "chat-name-card";
        chatCard.setAttribute("data-room-id", room.roomId);
        chatCard.onclick = () => openRoom(room.roomId);

        chatCard.innerHTML = `
            <div class="chat-name-card-content">
                <i class="fa fa-user"></i>
                <div class="chat-name-car-text">
                    <h4 class="chat-name">${room.roomName}</h4>
                    <p class="pre-indic">Online</p>  
                </div>
            </div>
            <i class="fa fa-chevron-right openChatBtn"></i>
        `;

        container.insertBefore(chatCard, insertBeforeElement);
    });

    const roomsPlaceholder = document.getElementById("chatCardPlaceholder");
    roomsPlaceholder.style.display = state.rooms.length > 0 ? "none" : "block";
}

function addMessageToRoom(roomId, message) {
    if (!message || !message.sender || !message.id) return;

    // Falls Nachrichtenliste fehlt: anlegen
    if (!state.messages[roomId]) {
        state.messages[roomId] = [];
    }

    // Duplikate vermeiden (z. B. nach reconnect)
    const alreadyExists = state.messages[roomId].some(msg => msg.id === message.id);
    if (alreadyExists) return;

    state.messages[roomId].push(message);

    // Nur rendern, wenn Raum gerade geöffnet ist
    if (roomId === state.currentRoomId) {
        const messageElement = document.createElement("div");
        messageElement.className = message.sender === state.username ? "self-send-msg" : "friend-send-msg";
        messageElement.innerHTML = `<p>${message.content}</p>`;
        msgContainer.appendChild(messageElement);
        msgContainer.scrollTop = msgContainer.scrollHeight;
    }
}


/*
function addMessage(message){
    if (!message || !message.sender) {
        console.warn("⛔ Ungültige Nachricht übersprungen:", message);
        return;
    }

    const messageElement = document.createElement("div");

    if (message.sender === state.username) {
        messageElement.className = "self-send-msg";
        messageElement.innerHTML = `<p>${message.content}</p>`;
    } else {
        messageElement.className = "friend-send-msg";
        messageElement.innerHTML = `<p>${message.content}</p>`;
    }

    msgContainer.appendChild(messageElement);
    msgContainer.scrollTop = msgContainer.scrollHeight;
}



function addChatRoom(room){
    const chatCard = document.createElement("div");
    chatCard.className = "chat-name-card";
    chatCard.setAttribute("data-room-id", room.roomId);
    chatCard.onclick = () => openRoom(room.roomId);

    chatCard.innerHTML = `
        <div class="chat-name-card-content">
            <i class="fa fa-user"></i>
            <div class="chat-name-car-text">
                <h4 class="chat-name">${room.roomName}</h4>
                <p class="pre-indic">Online</p>  
            </div>
        </div>
        <i class="fa fa-chevron-right openChatBtn"></i>
    `;

    const insertBeforeElement = document.getElementById("addUserForm");
    const container = document.querySelector(".chat-overview-card");

    container.insertBefore(chatCard, insertBeforeElement);

    const roomsPlaceholder = document.getElementById("chatCardPlaceholder");
    if(state.rooms.length > 0){
        roomsPlaceholder.style.display = "none";
    }else{
       roomsPlaceholder.style.display = "block"; 
    }
}

*/

function openRoom(roomId) {
    const room = state.rooms.find(r => r.roomId === roomId);
    if (!room) {
        console.error("Room not found: ", roomId);
        return;
    }

    state.currentRoomId = roomId;
    state.currentRoomName = room.roomName || "Loading...";

    updateContent();

    // Clear previous messages
    msgContainer.innerHTML = "";

    // Fetch and display messages for the selected room
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: "getMessages",
            token: localStorage.getItem("token"),
            roomId: state.currentRoomId
        }));
    }
}