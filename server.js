const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, doc } = require('firebase/firestore');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const firebaseConfig = {
    apiKey: "AIzaSyD6-DFwjTAnGB4TEh24FVBtU7AenDGDedg",
    authDomain: "socketpianotiles.firebaseapp.com",
    projectId: "socketpianotiles",
    storageBucket: "socketpianotiles.appspot.com",
    messagingSenderId: "177266839377",
    appId: "1:177266839377:web:a17f5a30890ee5a2048d70",
    measurementId: "G-WJDDX0VBKM"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

function asyncEmit(message, socket, socketEvent){
    socket.emit(socketEvent, message);
}

let activePlayers = {};
let sessions = {};
let rooms = {};
let matches = {};

async function checkForUsernameAndEmail(username, email){
    const snapshot = await getDocs(collection(db, "users"));
    const usernames = snapshot.docs.map((doc) => doc.data().username);
    const emails = snapshot.docs.map((doc) => doc.data().email);
    console.log(usernames);
    console.log(emails);

    const isUsernameTaken = usernames.some((currUsername) => currUsername === username);
    const isEmailTaken = emails.some((currEmail) => currEmail === email);

    if (isUsernameTaken || isEmailTaken) {
        return false;
    }

    return true;
}

async function checkForPassword(username, password){
    const snapshot = await getDocs(collection(db, "users"));
    const usernames = snapshot.docs.map((doc) => doc.data().username);
    const passwords = snapshot.docs.map((doc) => doc.data().password);
    
    console.log(usernames);
    console.log(passwords);

    const usernameIndex = usernames.findIndex((currUsername) => currUsername === username);

    if (usernameIndex !== -1) {
        if (passwords[usernameIndex] === password) {
            return true;
        }
    }

    return false;
}

app.use(express.static(path.join(__dirname, '.')));

io.on('connection', socket => {
    console.log('New socket connection!');

    // AUTHENTICATION
    socket.on('Register', async (username, email, password) => {
        const isUserValid = await checkForUsernameAndEmail(username, email);
        if ( isUserValid ) {
            const data = {username: username, email: email, password: password};
            try {
                const docRef = await addDoc(collection(db, "users"), data);
                console.log("Document written with ID: " + docRef.id);
                asyncEmit("SUCCESS",socket,"RegisterEvents");
            } catch (e) {
                console.error("Error adding document: " + e);
                asyncEmit("PROBLEMA NO SISTEMA",socket,"RegisterEvents");
            }
        }
        else {
            asyncEmit("Email or username already registered",socket,"RegisterEvents");
        }
    });

    socket.on('Login', async (username, password, sessionId) => {
        const isLoginValid = await checkForPassword(username, password);
        if (isLoginValid) {
            //A FUNÇÃO É PRA PEGAR UM "SESSIONID" E ADICIONAR ESSE SESSION ID NA LISTA DE PLAYERS ATIVOS NO SERVIDOR
            const session = {
                sessionId: sessionId,
                username: username,
                room: undefined,
                playerInstances: []
            }
            sessions[session.sessionId] = session; //adiciona sessão com ID único

            //console.log("SUCCESS",socket,"LoginEvents");
            asyncEmit("SUCCESS",socket,"LoginEvents");
            //io.emit('players', players);
            //socket.emit('Message', 'paravbens voce entrou'); NAO FUNCIONA
        }
        else {
            asyncEmit("INFORMAÇÕES ERRADAS",socket,"LoginEvents");
            //console.log("INFORMAÇÕES ERRADAS",socket,"LoginEvents");
        }
    });

    // Checando sessão na tela de login
    socket.on('CheckSession', (sessionId) => {
        console.log('Checando sessão...');
        let session = sessions[sessionId];

        if (session !== undefined) {
            console.log('Usuário está conectado!');
            socket.emit('SelectRoomRedirect');
            //socket.emit('ChatRedirect');
        }
        else{
            console.log('Usuário não conectado.');
        }
    });

    //ROOM SELECT
    socket.on('CreateAndEnterRoom', (roomCount, sessionId) => {
        rooms['room'+roomCount] = {
            players: {},
            activePlayers: {}
        };
        rooms['room'+roomCount].players[sessionId] = 'notify'; //o usuário é novo!
        sessions[sessionId].room = roomCount;
        socket.emit('ChatRedirect', rooms['room'+roomCount].players[sessionId]);
        //socket.join("room"+roomCount); NÃO FUNCIONA PQ VAI MUDAR DE URL
    });

    socket.on('EnterRoom', (roomNumber, sessionId) => {
        console.log('......'+roomNumber+'.........');
        if (rooms['room'+roomNumber].players[sessionId] !== undefined) {
            rooms['room'+roomNumber].players[sessionId] = 'dontNotify';  //o usuário tá com mais de uma aba aberta, não precisa notificar a entrada dele de novo
            socket.emit('ChatRedirect', rooms['room'+roomNumber].players[sessionId]); //preciso fazer essa mesma coisa na checagem de conexão, o ideal é q se a pessoa tiver
            //conectada ela nem tenha a possibilidade de estar na pagina de room selection
        }
        else{
            rooms['room'+roomNumber].players[sessionId] = 'notify';  //o usuário é novo!
            sessions[sessionId].room = roomNumber;
            socket.emit('ChatRedirect', rooms['room'+roomNumber].players[sessionId]);
        }
    });

    socket.on('CheckRooms', () =>{
        socket.emit('UpdateRooms', rooms);
    });

    //CHAT - LOBBY
    socket.on('CheckChatSession', (sessionId) => {
        let session = sessions[sessionId];

        if (session !== undefined) {
            let isHost = false;
            let isReady = false;

            console.log(rooms);
            //console.log('você está conectado!');
            const playerRoom = 'room'+sessions[sessionId].room;
            socket.emit('GetActivePlayers', rooms[playerRoom].activePlayers);
            //checar se já tem outro socket ativo com a mesma sessão, se sim, usar socket.disconnect() nele e copiar as informações de cor e posição pra o novo socket
            //Solução 2: colocar todos os sockets de uma mesma sessão dentro de uma sala (com o ID da sessão), e todos os usuários dessa sala vão se comportar de maneiras idênticas, porque são o mesmo usuário
            //por enquanto, ignorar isso e fazer sockets individuais funcionarem

            if (Object.keys(rooms[playerRoom].players).length === 1) {
                isHost = true;
                isReady = true;
            }

            const player = {
                session: sessions[session.sessionId],
                socketId: socket.id,
                posX: 200,
                color: "#"+Math.floor(Math.random()*16777215).toString(16), //Sorteando cor aleatória
                isHost: isHost,
                isReady: isReady
            }

            activePlayers[socket.id] = player;
            sessions[sessionId].playerInstances.push(socket.id);

            rooms[playerRoom].activePlayers[player.socketId] = player;
            socket.join(playerRoom);
            //socket.emit('Chat first text');
            if (rooms[playerRoom].players[sessionId] === 'notify') {
                io.to(playerRoom).emit('NewUserNotification', session.username + " just entered the room!", player.posX, player.color, player.session, player.isHost, player.isReady);
                rooms[playerRoom].players[sessionId] = 'dontNotify';
            }
            else{
                io.to(playerRoom).emit('NewUserNotification', '', player.posX, player.color, player.session, player.isHost, player.isReady);
            }
        }

        else{
            console.log('VOCÊ FOI DESCONECTADO');
            socket.emit('ChatRedirectLogin', 'VOCÊ FOI DESCONECTADO');
        }
    });

    socket.on('SendMessage', (msg, room) => {
        //console.log(socket.rooms.has("room1"));
        //filtrar se o texto tem "to [username]: antes, se sim, envia mensagem privada, se não, envia msg global"
        //const remetente = activePlayers[socket.id].session.username;

        const remetente = rooms['room'+room].activePlayers[socket.id].session.username;
        const formattedText = `${remetente}: ${msg}`;
        io.to('room'+room).emit('NewMessage', formattedText);
    });

    
    socket.on('LeftKeyPressed', (room) => {
        const user = rooms['room'+room].activePlayers[socket.id];
        user.posX -= 5;
        io.to('room'+room).emit('UpdatingPlayerPositions', user.posX, user.session.sessionId);
    });

    socket.on('RightKeyPressed', (room) => {
        const user = rooms['room'+room].activePlayers[socket.id];
        user.posX += 5;
        io.to('room'+room).emit('UpdatingPlayerPositions', user.posX, user.session.sessionId);
    });

    socket.on('SetPlayerReady', (room) =>{
        const user = rooms['room'+room].activePlayers[socket.id];
        if (user.isReady) {
            user.isReady = false;
        }
        else {
            user.isReady = true;
        }
        io.to('room'+room).emit('UpdatePlayerReadyStatus', user.isReady, user.session.sessionId);
    });

    socket.on('DisconnectFromChat', () => {
        const roomNumber = activePlayers[socket.id].session.room;
        const sessionId = activePlayers[socket.id].session.sessionId;
        const username = sessions[sessionId].username;

        const index = sessions[sessionId].playerInstances.indexOf(socket.id);
        sessions[sessionId].playerInstances.splice(index,1);

        delete rooms['room'+roomNumber].activePlayers[socket.id];
        delete activePlayers[socket.id];
        delete rooms['room'+roomNumber].players[sessionId];

        if (sessions[sessionId].playerInstances.length === 0) {
            io.to('room'+roomNumber).emit('PlayerDisconnected', username + ' se desconectou.', sessionId);
        }
    });

    socket.on('StartMatch', (matchPrefix, readyPlayers) => {
        matches[matchPrefix] = {
            players: {},
            chart: []
        };

        for (let key in readyPlayers){
            if (readyPlayers.hasOwnProperty(key)) {
                sessions[key].playerInstances.forEach(socketId => {
                    matches[matchPrefix].players[key] = {
                        username: sessions[key].username,
                        score: 0,
                        combo: 0,
                        sockets: [],
                        chartFinished: false,
                        chartReceived: false
                    }
                    io.to(socketId).emit('GameRedirect', matchPrefix);
                });
            }
        }
    });

    //GAME
    socket.on('CheckPianoConnection', (sessionId, matchUrl) => {
        const matchId = matchUrl.substring(matchUrl.indexOf('#') + 1);

        // gera o chart uma única vez
        if (matches[matchId].chart.length === 0) {
            // gerar o chart
            for (let index = 0; index < 100; index++) {
                var randomTile = Math.floor(Math.random() * 4);
                matches[matchId].chart.push(randomTile);
            }
        }

        if (matches[matchId].players[sessionId]) {
            matches[matchId].players[sessionId].sockets.push(socket.id);
            socket.emit('GetChart', matches[matchId].chart);
            socket.join(matchId);
            socket.emit('GetPlayers', matches[matchId].players);
            //io.to(matchId).emit('UpdatePresentPlayers');
            // CONNECT PLAYER AND PROVIDE HIM THE FINITE CHART
            // PROVIDE LIST OF PLAYERS AND ETC EVERYTIME SOMEONE CONNECTS (TO THE ROOM)
            // ADD PLAYERS TO THE ROOM TO BE ABLE TO PROVIDE SCORES AND STUFF
        } else {
            // Kick the user
        }
    });

    socket.on('ChartFinished', (sessionId, matchUrl) => {
        const matchId = matchUrl.substring(matchUrl.indexOf('#') + 1);
        if (matches[matchId].players[sessionId]) {
            matches[matchId].players[sessionId].chartFinished = true;
        }
        

        //Check if all players in the match finished the chart, while not, other players are left waiting for until 30 seconds
        //if yes, send a signal to all players in the room to show the final results
    });

    socket.on('ChartReceived', (sessionId, matchUrl) => {
        let allChartsReceived = true;
        const matchId = matchUrl.substring(matchUrl.indexOf('#') + 1);
        if (matches[matchId].players[sessionId]) {
            matches[matchId].players[sessionId].chartReceived = true;
        }

        for (let key in matches[matchId].players){
            if (matches[matchId].players.hasOwnProperty(key)) {
                if (!(matches[matchId].players[key].chartReceived)) {
                    allChartsReceived = false;
                    break;
                }
            }
        }

        if (allChartsReceived) {
            io.to(matchId).emit('StartGame', true); //'waiting for players'
        } else {
            io.to(matchId).emit('StartGame', false);
        }

        console.log();

        //Check if all players in the match received the chart, while not, other players are left waiting for until 30 seconds
        //if yes, send a signal to all players in the room to start the game
    });

    socket.on('GameEvent', (sessionId, matchUrl, score, combo) => {
        //
    });
});

const PORT = 3000;

//const USERS_FILE_PATH = './registeredUsers.json';


server.listen(PORT, () => console.log(`Server running on port ${PORT}`));