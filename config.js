const firebase = require('firebase');
const firebaseConfig = {
    apiKey: "AIzaSyD6-DFwjTAnGB4TEh24FVBtU7AenDGDedg",
    authDomain: "socketpianotiles.firebaseapp.com",
    projectId: "socketpianotiles",
    storageBucket: "socketpianotiles.appspot.com",
    messagingSenderId: "177266839377",
    appId: "1:177266839377:web:a17f5a30890ee5a2048d70",
    measurementId: "G-WJDDX0VBKM"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const User = db.collection("Users");
module.exports = User;