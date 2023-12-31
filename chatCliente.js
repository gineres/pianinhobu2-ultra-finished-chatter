const socket = io();
const crownIcon = new Image();
crownIcon.src = './Illustration14.png';

//MOVIMENTAÇÃO E INTERAÇÃO--------------------------------------------------
// Initialize the canvas and player variables
var canvas = document.getElementById("gameCanvas");
var context = canvas.getContext("2d");

let playerX; //Posição vai ser definida mais tarde pelo sv
let playerY = 250;
let playerColor;
let playerUsername;
let otherPlayers = {};

let isClientConnected = true;

// Keyboard event listeners
var keys = [];
document.addEventListener("keydown", function (e) {
    keys[e.keyCode] = true;
});
document.addEventListener("keyup", function (e) {
    keys[e.keyCode] = false;
});

// Function to update the player's position
function updatePlayerPosition() {
    const meuid = localStorage.getItem('meuid');

    if (keys[37]) {
        // Left arrow key
        socket.emit('LeftKeyPressed', otherPlayers[meuid].room);
    }
    if (keys[39]) {
        // Right arrow key
        socket.emit('RightKeyPressed', otherPlayers[meuid].room);
    }
}

// Function to update the graphics
function updateGraphics() {
    const meuid = localStorage.getItem('meuid');
    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = '16px Arial';

    // Draw all players
    for (let key in otherPlayers){
        if (otherPlayers.hasOwnProperty(key)) {
            context.fillStyle = otherPlayers[key].playerColor;
            context.fillText(otherPlayers[key].username, otherPlayers[key].playerX - 20, otherPlayers[key].playerY - 20);
            context.fillRect(otherPlayers[key].playerX, otherPlayers[key].playerY, 20, 20);
            if (otherPlayers[key].isHost) {
                context.drawImage(crownIcon, otherPlayers[key].playerX, otherPlayers[key].playerY - 60, 20, 20);
                if (key === meuid) {
                    document.getElementById('setReady').innerHTML = `START MATCH`;
                }
            }
            if (otherPlayers[key].isReady && !(otherPlayers[key].isHost)) {
                context.fillText('[READY!!!]', otherPlayers[key].playerX - 20, otherPlayers[key].playerY + 40);
            }
        }
    }
}

// Game loop
function gameLoop() {
    updatePlayerPosition();
    updateGraphics();
    requestAnimationFrame(gameLoop);
}

//------------------------------------------------------------------------------
function SetReady(){
    let readyPlayers = {};
    const buttonText = document.getElementById('setReady').innerText;
    console.log(buttonText);
    const meuid = localStorage.getItem('meuid');

    for (let key in otherPlayers){
        if (otherPlayers.hasOwnProperty(key)) {
            if (otherPlayers[key].isReady) {
                readyPlayers[key] = otherPlayers[key];
            }
        }
    }
    if (buttonText === 'START MATCH') {
        const minPlayers = 2; // MÍNIMO DE JOGADORES NECESSÁRIOS
        if (Object.keys(readyPlayers).length < minPlayers) { 
            const mensagens = document.getElementById('mensagens');
            mensagens.innerHTML += `<p style="color: red">NÚMERO MÍNIMO DE PLAYERS NÃO ATINGIDO, TEM ${Object.keys(readyPlayers).length} JOGADORES PRONTOS, NECESSITA DE ${minPlayers}</p>`;
        }
        else {
            socket.emit("StartMatch", otherPlayers[meuid].room+'-match', readyPlayers);
        }
        
    }
    else {
        socket.emit("SetPlayerReady", otherPlayers[meuid].room);
    }
}

function SendMessage(){
    const meuid = localStorage.getItem('meuid');
    const messageText = document.getElementById('messageInput').value;
    socket.emit("SendMessage", messageText, otherPlayers[meuid].room);
    console.log(messageText);
    document.getElementById('messageInput').value = "";
}

//EVENTOS DO SERVIDOR -------------------------------------------------------------
socket.on('UpdatingPlayerPositions', (newPosition, sessionId) => {
    otherPlayers[sessionId].playerX = newPosition;
});

socket.on('NewUserNotification', (msg, position, color, session, isHost, isReady) => {
    const mensagens = document.getElementById('mensagens');
    mensagens.innerHTML += `<p style="color: green">${msg}</p>`;
    otherPlayers[session.sessionId] = {
        playerX: position,
        playerY: playerY,
        playerColor: color,
        username: session.username,
        room: session.room,
        isHost: isHost,
        isReady: isReady
    };
});

socket.on('GetActivePlayers', (playerList) => {
    console.log('Pegando os players ativos...');
    for (let key in playerList){
        if (playerList.hasOwnProperty(key)) {
            console.log(playerList[key]);
            otherPlayers[playerList[key].session.sessionId] = {
                playerX: playerList[key].posX,
                playerY: playerY,
                playerColor: playerList[key].color,
                username: playerList[key].session.username,
                room: playerList[key].session.room,
                isHost: playerList[key].isHost,
                isReady: playerList[key].isReady
            }
        }
    }
});

socket.on('Teste', (msg) => {
    console.log(msg);
});

socket.on('ChatRedirectLogin', (msg) => {
    isClientConnected = false;
    window.location.href = "http://localhost:3000";
});

socket.on('GameRedirect', (matchPrefix) => {
    window.location.href = `http://localhost:3000/piano.html#${matchPrefix}`;
});

socket.on('NewMessage', (msg) => {
    const mensagens = document.getElementById('mensagens');
    mensagens.innerHTML += `<p style="color: green">${msg}</p>`;
});

socket.on('UpdatePlayerReadyStatus', (isReady, sessionId) =>{
    otherPlayers[sessionId].isReady = isReady;
});

socket.on('PlayerDisconnected', (msg, sessionId) => {
    const mensagens = document.getElementById('mensagens');
    mensagens.innerHTML += `<p style="color: green">${msg}</p>`;
    delete otherPlayers[sessionId];
});

//---------------------------------------------------------------------------------

//Lida com a desconexão do jogador
window.addEventListener('beforeunload', function(event) {
    if (isClientConnected) {
        socket.emit('DisconnectFromChat');
    }
});

//Checa se o usuário tá logado, se não, muda de página para a página de login
function IsLoggedIn(){
    const meuid = localStorage.getItem('meuid');
    socket.emit("CheckChatSession", meuid);
}


//Start the game loop
gameLoop();
//Checando se o usuário tá logado
IsLoggedIn();
