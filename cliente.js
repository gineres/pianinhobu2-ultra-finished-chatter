//const User = require("./config.js");
//TRAZER O FIREBASE PRA O CLIENTE, E APENAS USAR O SERVIDOR PARA O CLIENTE MANDAR AS INFORMAÇÕES SE ELE TÁ LOGADO OU NÃO
const socket = io();
const meuIdSpan = document.getElementById('meuid');

function Register(){
    const username = document.registerForm.elements['username'].value;
    const email = document.registerForm.elements['email'].value;
    const password = document.registerForm.elements['password'].value;
    socket.emit("Register", username, email, password);
}

function Login(){
    const username = document.loginForm.elements['username'].value;
    const email = document.loginForm.elements['email'].value;
    const password = document.loginForm.elements['password'].value;
    const meuid = localStorage.getItem('meuid');
    socket.emit("Login", username, email, password, meuid);
}

//Checa se o usuário tá logado, se sim, muda de página para a página do chat
function IsLoggedIn(){ //RODAR ASSIM QUE ENTRAR?
    const meuid = localStorage.getItem('meuid');
    socket.emit("CheckSession", meuid);
    //alert("tá logado!!");
}

function ver_meuid() {
    // obtendo id do localstorage (chave: 'meuid')
    const meuid = localStorage.getItem('meuid');

    if (meuid) {
    // mostrando o id no span chamado "meuid"
    meuIdSpan.innerText = meuid;
    }
}

function alterar_meuid() {
    // gera um id aleatório, para testes
    const novoId = crypto.randomUUID()

    // salva esse id no localStorage (chave: 'meuid')
    localStorage.setItem('meuid', novoId);
    // troca o id no span chamadao meuid
    meuIdSpan.innerText = novoId;
}

socket.on('ChatRedirect', () => {
    window.location.href = "http://localhost:3000/chat.html";
});

// esse código abaixo roda na primeira vez que a página é carregada,
// já mostrando o id do usuário que está no localStorage
ver_meuid();

IsLoggedIn();