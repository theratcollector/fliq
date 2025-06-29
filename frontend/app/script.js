let friendName = "Guest";
const presence1 = document.getElementById("pre-indic");
const selectionIndicator = document.getElementById("selectionIndicator");
const input = document.getElementById("msg-input");
const inputBtn = document.getElementById("input-btn");
const usernameText = document.getElementsByClassName("isWriting-text");
const msgContainer = document.getElementById("msg-container");

let isOnline = false;

//localStorage

let username;
let rooms = []


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

if(localStorage.getItem("token")){
    socket = new WebSocket("ws://localhost:3000?token=" + localStorage.getItem("token"));
    socket.addEventListener("open", () => {
        console.log("sending rooms request")
        socket.send(JSON.stringify({ type:"getRooms", token: localStorage.getItem("token") }));
    });
    
    //hier einen websocket call starten

    socket.addEventListener("message", (event) => {
        const data = JSON.parse(event.data);
        console.log("Received data: ", data);
        switch(data.type){
            case "rooms":
                console.log("Rooms received: ", data.rooms);
                // Handle rooms data
                rooms.forEach(room => {
                    rooms.push(room);
                    if(room.roomName == ""){
                        addChatRoom(room.roomName, room.status);
                    } else {
                        friendName = room.roomName;
                        document.getElementById("chatUserName").textContent = friendName;
                        document.getElementById("chat-name").textContent = friendName;
                    }
                });
                break;
            case "error":
                console.error("Error: ", data.error);
                break;
            default:
                console.warn("Unknown message type: ", data.type);
        }
    });
}else{
    window.location.href="../login";
}






var currentFilter = true;

presence1.value = isOnline ? "Online" : "Offline";
presence1.style.color = isOnline ? "#40AA5C" : "#5d5f69";

input.addEventListener("keydown", function (event){
    if(event.key === "Enter"){
        sendMsg();
    }
});

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
    // send a message
    input.value = "";
    alert("Sende message to chat partner");
}

const messageContainer = document.querySelector('.message-container');
messageContainer.scrollTop = messageContainer.scrollHeight;


window.addEventListener("load", () => {
    const msgContainer = document.querySelector('.messages');
    msgContainer.scrollTop = msgContainer.scrollHeight;
})

function logout() {
    localStorage.removeItem("token");
    window.location.href = "/frontend";
}

function updateContent(){
    document.getElementById("greeting").textContent = username;
    document.getElementById("chatUserName").textContent = friendName;
    document.getElementById("chat-name").textContent = friendName;
}

function addChatRoom(username, status = "offline"){
    const chatCard = document.createElement("div");
    chatCard.className = "chat-name-card";
    chatCard.onclick = () => openRoom(chatroom.roomId);

    chatCard.innerHTML = `
        <div class="chat-name-card-content">
            <i class="fa fa-user"></i>
            <div class="chat-name-car-text">
                <h4 class="chat-name">${username}</h4>
                <p class="pre-indic">${status}</p>  
            </div>
        </div>
        <i class="fa fa-chevron-right openChatBtn"></i>
    `;

    const insertBeforeElement = document.getElementById("addUserForm");
    const container = document.querySelector(".chat-overview-card");

    container.insertBefore(chatCard, insertBeforeElement);
}