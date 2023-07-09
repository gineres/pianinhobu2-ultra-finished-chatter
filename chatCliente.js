const socket = io();

//MOVIMENTAÇÃO E INTERAÇÃO--------------------------------------------------
// Initialize the canvas and player variables
var canvas = document.getElementById("gameCanvas");
var context = canvas.getContext("2d");

let playerX; //Posição vai ser definida mais tarde pelo sv
let playerY = 250;
let playerColor;
let playerUsername;
let otherPlayers = {};

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
    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = '16px Arial';

    // Draw all players
    for (let key in otherPlayers){
        if (otherPlayers.hasOwnProperty(key)) {
            context.fillStyle = otherPlayers[key].playerColor;
            context.fillText(otherPlayers[key].username, otherPlayers[key].playerX - 20, otherPlayers[key].playerY - 20);
            context.fillRect(otherPlayers[key].playerX, otherPlayers[key].playerY, 20, 20);
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


//Checa se o usuário tá logado, se sim, muda de página para a página de login
function IsLoggedIn(){ //RODAR ASSIM QUE ENTRAR?
    const meuid = localStorage.getItem('meuid');
    socket.emit("CheckChatSession", meuid);
}

socket.on('UpdatingPlayerPositions', (newPosition, sessionId) => {
    otherPlayers[sessionId].playerX = newPosition;
});

//TROCA DE MENSAGENS-------------------------------------------------------------
function SendMessage(){
    const meuid = localStorage.getItem('meuid');
    const messageText = document.getElementById('messageInput').value;
    socket.emit("SendMessage", messageText, otherPlayers[meuid].room);
    console.log(messageText);
    document.getElementById('messageInput').value = "";
}

socket.on('NewUserNotification', (msg, position, color, session) => {
    const mensagens = document.getElementById('mensagens');
    mensagens.innerHTML += `<p style="color: green">${msg}</p>`;
    otherPlayers[session.sessionId] = {
        playerX: position,
        playerY: playerY,
        playerColor: color,
        username: session.username,
        room: session.room
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
                room: playerList[key].session.room
            }
        }
    }
});

socket.on('Teste', (msg) => {
    console.log(msg);
});

socket.on('ChatRedirectLogin', (msg) => {
    window.location.href = "http://localhost:3000";
});

socket.on('NewMessage', (msg) => {
    const mensagens = document.getElementById('mensagens');
    mensagens.innerHTML += `<p style="color: green">${msg}</p>`;
});
//---------------------------------------------------------------------------------


//Start the game loop
gameLoop();
//Checando se o usuário tá logado
IsLoggedIn();