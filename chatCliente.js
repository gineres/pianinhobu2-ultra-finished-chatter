const socket = io();

// Initialize the canvas and player variables
var canvas = document.getElementById("gameCanvas");
var context = canvas.getContext("2d");
var playerX = 200;
var playerY = 250;

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
        playerX -= 5;
    }
    if (keys[39]) {
        // Right arrow key
        playerX += 5;
    }
}

// Function to update the graphics
function updateGraphics() {
// Clear the canvas
context.clearRect(0, 0, canvas.width, canvas.height);

// Draw the player
context.fillStyle = "red";
context.fillRect(playerX, playerY, 20, 20);
}

// Game loop
function gameLoop() {
    updatePlayerPosition();
    updateGraphics();
    requestAnimationFrame(gameLoop);
}

function SendMessage(){
    const messageText = document.getElementById('messageInput').value;
    socket.emit("SendMessage", messageText);
    console.log(messageText);
}

//Checa se o usuário tá logado, se sim, muda de página para a página de login
function IsLoggedIn(){ //RODAR ASSIM QUE ENTRAR?
    const meuid = localStorage.getItem('meuid');
    socket.emit("CheckChatSession", meuid);
}

socket.on('NewUserNotification', (msg) => {
    const mensagens = document.getElementById('mensagens');
    mensagens.innerHTML += `<p style="color: green">${msg}</p>`;
});

socket.on('ChatRedirectLogin', (msg) => {
    window.location.href = "http://localhost:3000";
});

socket.on('NewMessage', (msg) => {
    const mensagens = document.getElementById('mensagens');
    mensagens.innerHTML += `<p style="color: green">${msg}</p>`;
});


// Start the game loop
gameLoop();
IsLoggedIn();