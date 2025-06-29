const username = "Oskar";
const friendName = "Daniel";
const presence1 = document.getElementById("pre-indic");
const selectionIndicator = document.getElementById("selectionIndicator");
const input = document.getElementById("msg-input");
const inputBtn = document.getElementById("input-btn");
const usernameText = document.getElementsByClassName("isWriting-text");
const msgContainer = document.getElementById("msg-container");

var isOnline = false;

document.getElementById("greeting").textContent = username;
document.getElementById("chatUserName").textContent = friendName;
document.getElementById("chat1-name").textContent = friendName;


//   MAIN WEBSOCKET LOGIC
let socket;

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

usernameText.value = username;

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
    const username = document.getElementById("newUsername").value;
    if (!username) return;

    if(socket && socket.readyState === WebSocket.OPEN){
        socket.send(JSON.stringify({
            type: "newRoom",
            token: localStorage.getItem("token"),
            roomName: username
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
    window.location.href = "/";
}