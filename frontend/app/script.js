let username;
let friendName = "Guest";
const presence1 = document.getElementById("pre-indic");
const selectionIndicator = document.getElementById("selectionIndicator");
const input = document.getElementById("msg-input");
const inputBtn = document.getElementById("input-btn");
const usernameText = document.getElementsByClassName("isWriting-text");
const msgContainer = document.getElementById("msg-container");

let isOnline = false;



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
presence1.style.color = isOnline ? "#40AA5C" : "#ACAFC0";

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


function logout() {
    localStorage.removeItem("token");
    window.location.href = "/frontend";
}

function updateContent(){
    document.getElementById("greeting").textContent = username;
    document.getElementById("chatUserName").textContent = friendName;
    document.getElementById("chat1-name").textContent = friendName;
}