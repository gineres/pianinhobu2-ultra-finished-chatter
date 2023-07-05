//const User = require("./config.js");
//TRAZER O FIREBASE PRA O CLIENTE, E APENAS USAR O SERVIDOR PARA O CLIENTE MANDAR AS INFORMAÇÕES SE ELE TÁ LOGADO OU NÃO
const socket = io();

function Register(){
    const username = document.registerForm.elements['username'].value;
    const email = document.registerForm.elements['email'].value;
    const password = document.registerForm.elements['password'].value;
    socket.emit("Register", username, email, password);
}

function Login(){
    socket.emit("Login");
}

//Checa se o usuário tá logado, se sim, muda de página para a página do chat
function IsLoggedIn(){ //RODAR ASSIM QUE ENTRAR?
    socket.emit("CheckSession");
    //alert("tá logado!!");
}

socket.on('UserSession', (authUser) => {
    if (authUser === null) {
        alert('tá não');
    }
    else{
        alert('tá logado!');
    }
});

IsLoggedIn();