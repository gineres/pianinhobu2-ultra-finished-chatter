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

async function checkForPassword(username, email, password){
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

    socket.on('Login', async (username, email, password, sessionId) => {
        const isLoginValid = await checkForPassword(username, email, password);
        if (isLoginValid) {
            //A FUNÇÃO É PRA PEGAR UM "SESSIONID" E ADICIONAR ESSE SESSION ID NA LISTA DE PLAYERS ATIVOS NO SERVIDOR
            const session = {
                sessionId: sessionId,
                username: username,
                room: undefined
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

            console.log(rooms);
            //console.log('você está conectado!');
            const playerRoom = 'room'+sessions[sessionId].room;
            socket.emit('GetActivePlayers', rooms[playerRoom].activePlayers);
            //checar se já tem outro socket ativo com a mesma sessão, se sim, usar socket.disconnect() nele e copiar as informações de cor e posição pra o novo socket
            //Solução 2: colocar todos os sockets de uma mesma sessão dentro de uma sala (com o ID da sessão), e todos os usuários dessa sala vão se comportar de maneiras idênticas, porque são o mesmo usuário
            //por enquanto, ignorar isso e fazer sockets individuais funcionarem

            if (Object.keys(rooms[playerRoom].players).length === 1) {
                isHost = true;
            }

            const player = {
                session: sessions[session.sessionId],
                socketId: socket.id,
                posX: 200,
                color: "#"+Math.floor(Math.random()*16777215).toString(16), //Sorteando cor aleatória
                isHost: isHost
            }

            rooms[playerRoom].activePlayers[player.socketId] = player;
            socket.join(playerRoom);
            //socket.emit('Chat first text');
            if (rooms[playerRoom].players[sessionId] === 'notify') {
                io.to(playerRoom).emit('NewUserNotification', session.username + " just entered the room!", player.posX, player.color, player.session, player.isHost);
                rooms[playerRoom].players[sessionId] = 'dontNotify';
            }
            else{
                io.to(playerRoom).emit('NewUserNotification', '', player.posX, player.color, player.session, player.isHost);
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

    //GAME
});

const PORT = 3000;

//const USERS_FILE_PATH = './registeredUsers.json';


server.listen(PORT, () => console.log(`Server running on port ${PORT}`));