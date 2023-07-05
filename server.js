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

/*
app.post("/createUser", async (req, res) => {
    const data = req.body;
    console.log("Data of users ", data);
    //await User.add(data);
    try {
        const docRef = await addDoc(collection(db, "users"), data);
        console.log("Document written with ID: ", docRef.id);
        res.send({msg: "User added!"});
    } catch (e) {
        console.error("Error adding document: ", e);
    }
});

app.get("/", async (req, res) => {
    const snapshot = await getDocs(collection(db, "users"));
    const usernames = snapshot.docs.map((doc) => doc.data().username);
    console.log(usernames);
    const list = snapshot.docs.map((doc) => doc.data());
    res.send(list);
});*/

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
    const emails = snapshot.docs.map((doc) => doc.data().email);
    const passwords = snapshot.docs.map((doc) => doc.data().password);
    /*
    console.log(usernames);
    console.log(emails);
    console.log(passwords);
    */

    const usernameIndex = usernames.findIndex((currUsername) => currUsername === username);
    const emailIndex = emails.findIndex((currEmail) => currEmail === email);

    if (usernameIndex !== -1 || emailIndex !== -1) {
        if (passwords[usernameIndex] === password || passwords[emailIndex] === password) {
            return true;
        }
    }

    return false;
}

app.use(express.static(path.join(__dirname, '.')));

io.on('connection', socket => {
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

    socket.on('Login', async (username, email, password) => {
        const isLoginValid = await checkForPassword(username, email, password);
        if (isLoginValid) {
            //A FUNÇÃO É PRA PEGAR UM "SESSIONID" E ADICIONAR ESSE SESSION ID NA LISTA DE PLAYERS ATIVOS NO SERVIDOR
            console.log("paravbens voce entrou");
        }
        else {
            console.log("INFORMAÇÕES ERRADAS");
        }
        //Login();
    });

    socket.on('CheckSession', () => {
        console.log('checando sessão...');
    });

    console.log('muaisda');
});

const PORT = 3000;

//const USERS_FILE_PATH = './registeredUsers.json';


server.listen(PORT, () => console.log(`Server running on port ${PORT}`));