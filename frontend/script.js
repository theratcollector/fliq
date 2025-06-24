const username = "Oskar";
const friendName = "Daniel";
const presence = document.getElementById("presence1");
const presence2 = document.getElementById("presence2")
const selectionIndicator = document.getElementById("selectionIndicator")
const input = document.getElementById("msg-input");
const inputBtn = document.getElementById("input-btn");
const usernameText = document.getElementsByClassName("isWriting-text");

var isOnline = false;

document.getElementById("greeting").textContent = username;
document.getElementById("chatUserName").textContent = friendName;
document.getElementById("chat1-name").textContent = friendName;
document.getElementById("chat2-name").textContent = friendName + "2";



var currentFilter = true;

presence.textContent = isOnline ? "Online" : "Offline";
presence.style.color = isOnline ? "#40AA5C" : "#ACAFC0";

presence2.textContent = isOnline ? "Online" : "Offline";
presence2.style.color = isOnline ? "#40AA5C" : "#ACAFC0";

usernameText.value = username;

input.addEventListener("keydown", function (event){
    if(event.key === "Enter"){
        sendMsg();
    }
});

inputBtn.addEventListener("click", function (event){
    if(input.value != ""){
        sendMsg();
    }
});




function openMenu(){
    // open the user menu
    alert("Open the User Menu")
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
