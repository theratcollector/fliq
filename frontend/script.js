const username = "Oskar";
const friendName = "Daniel";
var isOnline = false;

document.getElementById("greeting").textContent = username;
document.getElementById("chatUserName").textContent = friendName;
document.getElementById("chat1-name").textContent = friendName;
document.getElementById("chat2-name").textContent = friendName + "2";


const presence = document.getElementById("presence1");
const presence2 = document.getElementById("presence2")
const selectionIndicator = document.getElementById("selectionIndicator")
var currentFilter = true;

presence.textContent = isOnline ? "Online" : "Offline";
presence.style.color = isOnline ? "#40AA5C" : "#ACAFC0";

presence2.textContent = isOnline ? "Online" : "Offline";
presence2.style.color = isOnline ? "#40AA5C" : "#ACAFC0";

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
    alert("Sende message to chat partner");
}
