const socket = io();

const roomContainer = document.getElementById('room-container');
const createRoomBtn = document.getElementById('create-room-btn');
let roomCount = 0; // Current number of rooms

// ENTER ROOM X
roomContainer.addEventListener('click', function(event) {
    const target = event.target;
    if (target.matches('.btn')) {
        const meuid = localStorage.getItem('meuid');
        const roomNumber = target.innerText.trim().replace('Room ', '');
        console.log(`Room ${roomNumber} button was pressed.`);
        
        socket.emit("EnterRoom", roomNumber, meuid); // Servidor vai receber isso e vai colocar o sessionID da pessoa relacionada à sala (CONCEITO MAPA), assim, todas as instâncias desse ID vão entrar na mesma sala (CONCEITO SALA DE SOCKET)
    }
});

// CREATE NEW ROOM
createRoomBtn.addEventListener('click', function() {
    const meuid = localStorage.getItem('meuid');
    roomCount++;
    
    const newButton = document.createElement('button');
    newButton.className = 'btn';
    const randomColor = "#"+Math.floor(Math.random()*16777215).toString(16);
    newButton.style.color = `${randomColor}`;
    newButton.innerHTML = `Room ${roomCount}<span class="ribbon" style="background-color: ${randomColor};">0/6</span>`;
    
    roomContainer.appendChild(newButton);
    roomContainer.innerHTML += `<br> <br>`;
    socket.emit("CreateAndEnterRoom", roomCount, meuid); // ESSE ID SERÁ O HOST ATÉ QUE TODAS AS SUAS INSTÂNCIAS SE DESCONECTEM DA SALA
});

socket.on('ChatRedirect', (msg) => {
    window.location.href = "http://localhost:3000/chat.html";
});

socket.on('UpdateRooms', (rooms) => {
    for (let key in otherPlayers){
        if (otherPlayers.hasOwnProperty(key)) {
            context.fillStyle = otherPlayers[key].playerColor;
            context.fillText(otherPlayers[key].username, otherPlayers[key].playerX - 20, otherPlayers[key].playerY - 20);
            context.fillRect(otherPlayers[key].playerX, otherPlayers[key].playerY, 20, 20);
        }
    }
});

function CheckRooms(){
    socket.emit('CheckRooms');
}

CheckRooms();