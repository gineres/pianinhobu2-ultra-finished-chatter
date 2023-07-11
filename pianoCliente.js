const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const tileWidth = 100;
const tileHeight = 150;
const socket = io();
const meuid = localStorage.getItem('meuid');

var tiles = [];
const tileLetters = ['D', 'F', 'J', 'K'];
let score = 0;
let combo = 0;
let tileId = 0;
let tileIntervals = 1000;
let maxTileIntervals = 150;
let tileSpeed = 5;
let maxTileSpeed = 18;

let feedbackText = '';

// faz 1 tile novo por segundo
var invokeTile;

let chart;
let currentChartIndex = 0;

let playersList = {};

socket.on('GetChart', (receivedChart) => {
    chart = receivedChart;
    console.log('O CHART CHEGOU' + chart);
    socket.emit('ChartReceived', meuid, window.location.href);
});

socket.on('StartGame', (shouldStart, players) => {
    if (shouldStart) {
        playersList = Object.assign({}, players);
        invokeTile = setInterval(makeNewTile, tileIntervals);
        for (let key in playersList){
            if (playersList.hasOwnProperty(key)) {
                const scoreElement = document.getElementById("playersRanking");
                scoreElement.innerHTML += `<p id=${playersList[key].username} class="rankingSlot" style="background-color: blueviolet;">${playersList[key].username} ${playersList[key].score}</p>`;
                //<!--<p class="rankingSlot" style="background-color: blueviolet;">FULANO 20000</p>-->
            }
        }
    }
    else{
        console.log('waiting for players');
    }
});

socket.on('FinishGame', (shouldRedirect) => {
    if (shouldRedirect) {
        const matchUrl = window.location.href;
        const roomNumberIndex = matchUrl.indexOf('#') + 1;
        const roomNumber = matchUrl[roomNumberIndex];
        console.log(roomNumber);
        for (let key in playersList){
            if (playersList.hasOwnProperty(key)) {
                // EMITE DE VOLTA PRO SOCKET E NO SOCKET VAI MANDAR TODO MUNDO PRESENTE NA SALA DE VOLTA PRO CHAT
                socket.emit("EnterRoom", roomNumber, key);
                //<!--<p class="rankingSlot" style="background-color: blueviolet;">FULANO 20000</p>-->
            }
        }
    }
    else{
        console.log('waiting for players');
    }
});

socket.on('ChatRedirect', (msg) => {
    window.location.href = "http://localhost:3000/chat.html";
});

socket.on('ScoresUpdated', (players, sessionId) => {
    playersList[sessionId].score = players[sessionId].score;
    playersList[sessionId].combo = players[sessionId].combo;
    document.getElementById(playersList[sessionId].username).innerHTML = `${playersList[sessionId].username} ${playersList[sessionId].score}`;
})

function makeNewTile(){
    //console.log(chart);
    if (currentChartIndex+1 === chart.length) {
        clearInterval(invokeTile);
        socket.emit('ChartFinished', meuid, window.location.href);
        return;
    }

    var randomTile = chart[currentChartIndex];
    if (randomTile == 0) {
        tiles.push({ x: 0, y: -tileHeight, tileLetter: 'D', isActive: true });
    }
    else if (randomTile == 1) {
        tiles.push({ x: tileWidth, y: -tileHeight, tileLetter: 'F', isActive: true });
    }
    else if (randomTile == 2) {
        tiles.push({ x: tileWidth * 2, y: -tileHeight, tileLetter: 'J', isActive: true });
    }
    else if (randomTile == 3) {
        tiles.push({ x: tileWidth * 3, y: -tileHeight, tileLetter: 'K', isActive: true });
    }
    if (tileSpeed < maxTileSpeed) {
        tileSpeed+=0.05;
    }
    if (tileIntervals > maxTileIntervals) { //DIMINUI O INTERVALO DE INVOCAR CADA TILE
        tileIntervals -= 10;
    }
    clearInterval(invokeTile); // Clear the previous interval
    invokeTile = setInterval(makeNewTile, tileIntervals); // Set new interval value
    if (currentChartIndex < (chart.length - 1)) {
        currentChartIndex++;
    }
}

// Draw tiles on the canvas
function drawTiles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];
        if (tile.isActive) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(tile.x, tile.y, tileWidth, tileHeight);
        }
        //ctx.fillStyle = '#000';
        //ctx.font = 'bold 24px Arial';
        //ctx.fillText(tileLetters[i], tile.x + tileWidth / 2 - 10, tile.y + tileHeight / 2 + 10);
    }
}

// Move tiles downwards
function moveTiles() {
    setInterval(() => {
    for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];
        tile.y += tileSpeed;
        if (tile.y >= canvas.height) {
            if (tile.isActive) {
                feedbackText = 'MISS!';
                combo=0;
            }
            tiles.shift();
        }
    }
    }, 10);

}
// Check if player hit a tile
function checkCollision(keyCode) {
    const letter = String.fromCharCode(keyCode);
    tiles.forEach(tile => {
    if (tile.tileLetter == letter) {
        if (tile.y >= canvas.height - tileHeight && tile.y <= canvas.height && tile.isActive) {
            feedbackText = 'HIT!';
            tile.isActive = false;
            score+=Math.floor((combo+1)*tileSpeed*50);
            combo++;
            socket.emit('GameEvent', meuid, window.location.href, score, combo);
        }
        return;
    }
    });
}

function InvokeFeedback(){
    ctx.font = 'bold 24px Arial';
    if (feedbackText === 'HIT!') {
        ctx.fillStyle = 'green';
    }
    else {
        ctx.fillStyle = 'red';
    }
    ctx.fillText(feedbackText, 200, 300);
}

// Update score
function updateScore() {
    const scoreElement = document.getElementById("score");
    scoreElement.innerHTML = `Score: <span id="score">${score}</span>`;
    ctx.font = 'bold 30px Arial';
    ctx.fillStyle = 'black';
    ctx.fillText('x'+combo, 10, 550);
    //document.body.appendChild(scoreElement);
}

// Handle keydown event
document.addEventListener('keydown', (event) => {
    checkCollision(event.keyCode);
    if (String.fromCharCode(event.keyCode) === 'D') {
        document.getElementById('buttonD').style.backgroundColor = 'red';
    }
    if (String.fromCharCode(event.keyCode) === 'F') {
        document.getElementById('buttonF').style.backgroundColor = 'orange';
    }
    if (String.fromCharCode(event.keyCode) === 'J') {
        document.getElementById('buttonJ').style.backgroundColor = '#32CD32';
    }
    if (String.fromCharCode(event.keyCode) === 'K') {
        document.getElementById('buttonK').style.backgroundColor = '#1F51FF';
    }
});

document.addEventListener('keyup', (event) => {
    if (String.fromCharCode(event.keyCode) === 'D') {
        document.getElementById('buttonD').style.backgroundColor = 'brown'; // Set the original background color
    }
    if (String.fromCharCode(event.keyCode) === 'F') {
        document.getElementById('buttonF').style.backgroundColor = 'rgb(172, 90, 8)'; // Set the original background color
    }
    if (String.fromCharCode(event.keyCode) === 'J') {
        document.getElementById('buttonJ').style.backgroundColor = 'rgb(67, 116, 32)'; // Set the original background color
    }
    if (String.fromCharCode(event.keyCode) === 'K') {
        document.getElementById('buttonK').style.backgroundColor = 'rgb(41, 84, 119)'; // Set the original background color
    }
});

// Game loop
function gameLoop() {
    drawTiles();
    updateScore();
    InvokeFeedback();
    requestAnimationFrame(gameLoop);
}

function CheckGameConnection(){
    socket.emit('CheckPianoConnection', meuid, window.location.href);
}

moveTiles();
gameLoop();
CheckGameConnection();