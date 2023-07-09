const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const tileWidth = 100;
const tileHeight = 150;
const socket = io();

var tiles = [];

/*
{ x: 0, y: -tileHeight },
{ x: tileWidth, y: -tileHeight },
{ x: tileWidth * 2, y: -tileHeight },
{ x: tileWidth * 3, y: -tileHeight }*/

//const tileColors = ['#000000', '#000000', '#000000', '#000000'];
const tileLetters = ['D', 'F', 'J', 'K'];
let score = 0;
let tileId = 0;

// faz 1 tile novo por segundo
var invokeTile = setInterval(makeNewTile, 1000);
function makeNewTile(){
    var randomTile = Math.floor(Math.random() * 4);
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
        tile.y += 5;
        if (tile.y >= canvas.height) {
        tiles.shift();
        //tile.y = -tileHeight;
        //score--;
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
            tile.isActive = false;
            score++;
        }
        return;
    }
    });
    /*
    const index = tileLetters.indexOf(letter);
    if (index !== -1) {
    const tile = tiles[index];
    if (tile.y >= canvas.height - tileHeight && tile.y <= canvas.height) {
        //tile.y = -tileHeight;
        score++;
    }
    }*/
}

// Update score
function updateScore() {
    const scoreElement = document.getElementById("score");
    scoreElement.innerHTML = `Score: <span id="score">${score}</span>`;
    //document.body.appendChild(scoreElement);
}

// Handle keydown event
document.addEventListener('keydown', (event) => {
    checkCollision(event.keyCode);
});

// Game loop
function gameLoop() {
    drawTiles();
    updateScore();
    requestAnimationFrame(gameLoop);
}

moveTiles();
gameLoop();