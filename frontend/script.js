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
document.getElementById("chat2-name").textContent = friendName + "2";



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




function openMenu(){
    // open the user menu
    alert("Open the User Menu")
}

function openChat(){
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

function createMessages(){
    msgContainer.appendChild(msgContainer);
}
