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
let combo = 0;
let tileId = 0;
let tileIntervals = 1000;
let maxTileIntervals = 150;
let tileSpeed = 5;
let maxTileSpeed = 18;

let feedbackText = '';

// faz 1 tile novo por segundo
var invokeTile = setInterval(makeNewTile, tileIntervals);
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
    if (tileSpeed < maxTileSpeed) {
        tileSpeed+=0.05;
    }
    if (tileIntervals > maxTileIntervals) { //DIMINUI O INTERVALO DE INVOCAR CADA TILE
        tileIntervals -= 10;
    }
    clearInterval(invokeTile); // Clear the previous interval
    invokeTile = setInterval(makeNewTile, tileIntervals); // Set new interval value
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
            score+=Math.floor(combo*tileSpeed*50);
            combo++;
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
});

// Game loop
function gameLoop() {
    drawTiles();
    updateScore();
    InvokeFeedback();
    requestAnimationFrame(gameLoop);
}

moveTiles();
gameLoop();