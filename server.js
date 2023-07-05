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

let players = [];

let activePlayers = {};
let sessions = {};

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
    console.log('SOCKET NOVO NA AREA');
    
    // AUTHENTICATION
    socket.on('Register', async (username, email, password) => {
        const isUserValid = await checkForUsernameAndEmail(username, email);
        if ( isUserValid ) {
            const data = {username: username, email: email, password: password};
            try {
                const docRef = await addDoc(collection(db, "users"), data);
                console.log("Document written with ID: ", docRef.id);
            } catch (e) {
                console.error("Error adding document: ", e);
            }
        }
        else {
            console.log("Email or username already registered");
        }
    });

    socket.on('Login', async (username, email, password, sessionId) => {
        const isLoginValid = await checkForPassword(username, email, password);
        if (isLoginValid) {
            //A FUNÇÃO É PRA PEGAR UM "SESSIONID" E ADICIONAR ESSE SESSION ID NA LISTA DE PLAYERS ATIVOS NO SERVIDOR
            const session = {
                sessionId: sessionId,
                username: username
            }
            sessions[session.sessionId] = session; //adiciona sessão com ID único

            console.log("OVCE ENTROU");
            //io.emit('players', players);
            //socket.emit('Message', 'paravbens voce entrou'); NAO FUNCIONA
        }
        else {
            console.log("INFORMAÇÕES ERRADAS");
        }
    });

    socket.on('CheckSession', (sessionId) => {
        console.log('checando sessão...');
        let session = sessions[sessionId];

        if (session !== undefined) {
            console.log('você está conectado!');
            socket.emit('ChatRedirect', 'Você entrou na sala!');
        }
        else{
            console.log('do nothing');
        }
    });

    //CHAT - LOBBY
    socket.on('CheckChatSession', (sessionId) => {
        let session = sessions[sessionId];

        if (session !== undefined) {
            console.log('você está conectado!');
            const player = {
                session: sessions[session.sessionId],
                posX: 100,
                socketId: socket.id,
            }

            activePlayers[player.socketId] = player;
            //socket.emit('Chat first text');
            io.emit('NewUserNotification', session.username + " just entered the room!");
        }
        else{
            console.log('VOCÊ FOI DESCONECTADO');
            socket.emit('ChatRedirectLogin', 'VOCÊ FOI DESCONECTADO');
        }
    });

    socket.on('SendMessage', (msg) => {
        //filtrar se o texto tem "to [username]: antes, se sim, envia mensagem privada, se não, envia msg global"
        const remetente = activePlayers[socket.id].session.username;
        const formattedText = `${remetente}: ${msg}`;
        io.emit('NewMessage', formattedText);
    });

    //GAME
});

const PORT = 3000;

//const USERS_FILE_PATH = './registeredUsers.json';


server.listen(PORT, () => console.log(`Server running on port ${PORT}`));