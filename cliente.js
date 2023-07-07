//const User = require("./config.js");
//TRAZER O FIREBASE PRA O CLIENTE, E APENAS USAR O SERVIDOR PARA O CLIENTE MANDAR AS INFORMAÇÕES SE ELE TÁ LOGADO OU NÃO
const socket = io();
const meuIdSpan = document.getElementById('meuid');
let hourglassInterval; //variavel do reloginho

function hourglass() { //FUNCAO PRA RODAR O RELOGINHO BONITINHO
    var a;
    a = document.getElementById("div1");
    a.setAttribute('class', 'fa');
    a.innerHTML = "&#xf251;";
    setTimeout(function () {
        a.innerHTML = "&#xf252;";
      }, 1000);
    setTimeout(function () {
        a.innerHTML = "&#xf253;";
      }, 2000);
}

function Register(){
    const username = document.registerForm.elements['username'].value;
    const email = document.registerForm.elements['email'].value;
    const password = document.registerForm.elements['password'].value;
    socket.emit("Register", username, email, password);
    hourglass();
    hourglassInterval = setInterval(hourglass, 3000); //coloca o intervalo dentro da variavel
}

function Login(){
    const username = document.loginForm.elements['username'].value;
    const email = document.loginForm.elements['email'].value;
    const password = document.loginForm.elements['password'].value;
    const meuid = localStorage.getItem('meuid');
    socket.emit("Login", username, email, password, meuid);
    hourglass();
    hourglassInterval = setInterval(hourglass, 3000);
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

socket.on('ChatRedirect', (msg) => {
    window.location.href = "http://localhost:3000/chat.html";
});

socket.on('LoginEvents', (msg) => {
    if (msg === 'SUCCESS') { //SE O LOGIN DER CERTO, VAI PRO CHAT
        window.location.href = "http://localhost:3000/chat.html";
    }
    else { // SE NAO MOSTRA O ERORO
        const messages = document.getElementById('messages');
        messages.innerHTML += `<p style="color: red">${msg}</p>`;
        clearInterval(hourglassInterval);
        const divElement = document.getElementById('div1');
        divElement.removeAttribute('class');
    }
});

socket.on('RegisterEvents', (msg) => {
    if (msg === 'SUCCESS') { //SE O LOGIN DER CERTO, VAI PRO LOGIN
        window.location.href = "http://localhost:3000/";
    }
    else { // SE NAO MOSTRA O ERORO
        const messages = document.getElementById('messages');
        messages.innerHTML += `<p style="color: red">${msg}</p>`;
        clearInterval(hourglassInterval);
        const divElement = document.getElementById('div1');
        divElement.removeAttribute('class');
    }
});

ver_meuid();

IsLoggedIn();