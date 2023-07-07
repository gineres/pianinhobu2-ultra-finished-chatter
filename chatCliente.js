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
    if (keys[37]) {
        // Left arrow key
        //playerX -= 5;
        socket.emit('LeftKeyPressed');
    }
    if (keys[39]) {
        // Right arrow key
        //playerX += 5;
        socket.emit('RightKeyPressed');
    }
}

// Function to update the graphics
function updateGraphics() {
    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all players
    //context.fillStyle = playerColor;
    //context.fillRect(playerX, playerY, 20, 20);
    /*
    if (Object.keys(otherPlayers).length !== 0) {
        otherPlayers.forEach(player => {
            context.fillStyle = player.playerColor;
            context.fillRect(player.playerX, player.playerY, 20, 20);
        });
    }*/
    for (let key in otherPlayers){
        if (otherPlayers.hasOwnProperty(key)) {
            context.fillStyle = otherPlayers[key].playerColor;
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
    /*
    if (sessionId === localStorage.getItem('meuid')) {
        playerX = newPosition;
    }*/
    //else{
        otherPlayers[sessionId].playerX = newPosition;
    //}
});

//TROCA DE MENSAGENS-------------------------------------------------------------
function SendMessage(){
    const messageText = document.getElementById('messageInput').value;
    socket.emit("SendMessage", messageText);
    console.log(messageText);
    document.getElementById('messageInput').value = "";
}

socket.on('NewUserNotification', (msg, position, color, session) => {
    const mensagens = document.getElementById('mensagens');
    mensagens.innerHTML += `<p style="color: green">${msg}</p>`;
    /*
    if (session.sessionId === localStorage.getItem('meuid')) { // ESSE CLIENTE ENTROU
        playerX = position;
        playerColor = color;
        playerUsername = session.username;
    }*/
    //else{ // OUTRA PESSOA ENTROU
        otherPlayers[session.sessionId] = {
            playerX: position,
            playerY: playerY,
            playerColor: color,
            username: session.username
        };
    //}
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
                username: playerList[key].session.username
            }
        }
    }
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