var socket = io();

var form = document.getElementById("form");
var input = document.getElementById("input");

let playerName = null;

var modal = document.getElementById("login-modal");
modal.style.display = "block";

form.addEventListener("submit", function (e) {
	e.preventDefault();
	if (input.value) {
		playerName = input.value;
		socket.emit("userLogin", input.value);
		input.value = "";
	}
});

socket.on("serverMessage", (msg) => displayServerMessage(msg));
socket.on("loginResponse", (data) => checkPlayerLoogin(data));

function displayServerMessage(msg) {
	var item = document.createElement("li");
	item.textContent = msg;
	messages.appendChild(item);
	window.scrollTo(0, document.body.scrollHeight);
}

function checkPlayerLoogin(data) {
	console.log("got login response");
	if (data.type == "success") {
		modal.style.display = "none";
		displayServerMessage(data.message);
	} else {
		alert(data.message);
	}
}

function startMatchmaking() {
	if (playerName) {
		socket.emit("startMatchMaking", playerName);
	} else {
		alert("you must enter a name");
	}
}
