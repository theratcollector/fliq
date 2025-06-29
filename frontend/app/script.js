let friendName = "Guest";
const presence1 = document.getElementById("pre-indic");
const selectionIndicator = document.getElementById("selectionIndicator");
const usernameText = document.getElementsByClassName("isWriting-text");
const msgContainer = document.getElementById("messages");

let isOnline = false;
let manuallyClosed = false;
let reconnectTimeout;
let reconnectInterval = 3000;


//environment Variables

let username;
let localRooms = []

let currentRoomId;
let currentRoomName;
let currentRoomStatus = "Loading...";



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

        username = data.username;
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
                data.rooms.forEach(room => {
                    let renderRoomName 
                    if(room.roomName==""){
                        room.users.forEach(user => {
                            if(user !== username){
                                renderRoomName = user;
                            }
                        });
                    } else{
                        renderRoomName = room.roomName;
                    } 

                    room.roomName = renderRoomName;
                    localRooms.push(room);
                    addChatRoom(room);
                });
                break;
            case "error":
                console.error("Error: ", data.error);
                break;
            case "newRoom":
                let renderRoomName 
                if(data.room.roomName==""){
                    data.room.users.forEach(user => {
                        if(user !== username){
                            renderRoomName = user;
                        }
                    });
                } else{
                    renderRoomName = data.room.roomName;
                } 

                data.room.roomName = renderRoomName;
                localRooms.push(data.room);
                addChatRoom(data.room);
                break;
            case "newMessage":
                addMessage(data.message);
                break;
            case"messageHistory":
                if (data.roomId !== currentRoomId) {
                    console.warn("Received messages for different room. Ignored.");
                    return;
                }
                data.messages.forEach(message => {
                    addMessage(message);
                });
                break;
            default:
                console.warn("Unknown message type: ", data.type);
        }
    }






var currentFilter = true;

presence1.value = isOnline ? "Online" : "Offline";
presence1.style.color = isOnline ? "#40AA5C" : "#5d5f69";


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
    const input = document.getElementById("msg-input");
    const inputBtn = document.getElementById("input-btn");

    if(socket && socket.readyState === WebSocket.OPEN){
        socket.send(JSON.stringify({
            type:"newMessage",
            token: localStorage.getItem("token"),
            content: input.value,
            sender: username,
            msgType: "text",
            roomId: currentRoomId
        }))
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
    document.getElementById("greeting").textContent = username;
    document.getElementById("chatUserName").textContent = currentRoomName || "Loading...";
    //document.getElementById("chatUserStatus").textContent = currentRoomStatus || "Loading...";
}

function addMessage(message){
    const messageElement = document.createElement("div");

    if(message.sender === username){
        messageElement.className = "self-send-msg";
        messageElement.innerHTML = `
            <p>${message.content}</p>
        `;
    }else{
        messageElement.className = "friend-send-msg";
        messageElement.innerHTML = `
            <p>${message.content}</p>
        `;
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
    if(localRooms.length > 0){
        roomsPlaceholder.style.display = "none";
    }else{
       roomsPlaceholder.style.display = "block"; 
    }
}

function openRoom(roomId) {
    const room = localRooms.find(r => r.roomId === roomId);
    if (!room) {
        console.error("Room not found: ", roomId);
        return;
    }

    currentRoomId = room.roomId;
    currentRoomName = room.roomName || "Loading...";
    currentRoomStatus = "Loading...";

    updateContent();

    // Clear previous messages
    msgContainer.innerHTML = "";

    // Fetch and display messages for the selected room
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: "getMessages",
            token: localStorage.getItem("token"),
            roomId: currentRoomId
        }));
    }
}

document.getElementById("msg-input").addEventListener("keydown", function(e) {
    alert("Key pressed");
    if (e.key === "Enter") {
        e.preventDefault(); // verhindert den Reload!
        sendMsg();
    }
});
