const ROCK = 1;
const SCISSORS = 2;
const PAPER = 3;

var socket = io();

// ------------------------- LOGIN SETUP---------------------------------
var form = document.getElementById("form");
var input = document.getElementById("input");

let playerName = null;

//match specific data
let player1 = null;
let player2 = null;
let totalRounds = null;
let roomUuid = null;
let currentRound = null;

let gameIsOngoing = false;

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

// ----------------- SETTING SOCKET LISTENERS----------------------------
socket.on("serverMessage", (msg) => displayServerMessage(msg));
socket.on("loginResponse", (data) => checkPlayerLoogin(data));

socket.on("matchData", (data) => handleMatchData(data));
socket.on("roundStart", (data) => handleRoundStart(data));
socket.on("timeRemaining", (data) => handleTimeRemaining(data));
socket.on("roundEnded", (data) => handleRoundEnded(data));
socket.on("gameEnded", (data) => handleGameEnded(data));
socket.on("eloChanged", (data) => handleElochanged(data));

// --------------------- SOCKET HANDLERS -------------------------------
function displayServerMessage(msg) {
	let item = document.createElement("li");
	item.textContent = msg;
	messages.appendChild(item);
	window.scrollTo(0, document.body.scrollHeight);
	//auto scroll to bottom
	let elem = document.getElementById("console");
	elem.scrollTop = elem.scrollHeight;
}

function checkPlayerLoogin(data) {
	console.log("got login response");
	if (data.type == "success") {
		modal.style.display = "none";
		fillPlayerData(data.data);
		displayServerMessage(data.message);
	} else {
		alert(data.message);
	}
}

function handleMatchData(data) {
	updateGameMessage("Got game data");
	console.log("Game data", data);
	player1 = data.data.player1;
	player2 = data.data.player2;
	totalRounds = data.data.totalRounds;
	roomUuid = data.data.roomUuid;
}
function handleRoundStart(data) {
	document.getElementById("game-buttons").style.visibility = "visible";
	gameIsOngoing = true;
	currentRound = data.data.currentRound;
	updateRoundCounter();
}

function handleTimeRemaining(data) {
	updateGameMessage(
		"Make your choice!! Time remaining: " + data.data.timeRemaining
	);
}

function handleRoundEnded(data) {
	console.log("got round end data: ", data);
	gameIsOngoing = false;
	if (data.data.winner) {
		if (data.data.winner === playerName) {
			updateGameMessage(`Round ended: you won this round!`);
		} else {
			updateGameMessage(
				`Round ended: ${data.data.winner} won this round!`
			);
		}
	} else {
		updateGameMessage(`Round ended: it was a draw!`);
	}
}
function handleGameEnded(data) {
	document.getElementById("game-buttons").style.visibility = "hidden";
	console.log("got game end data: ", data);
	if (data.data.winner) {
		if (data.data.winner === playerName) {
			updateGameMessage(`Game ended: you won!!`);
		} else {
			updateGameMessage(`Game ended: ${data.data.winner} won!`);
		}
	} else {
		updateGameMessage(`Game ended: it was a draw!`);
	}
}
function handleElochanged(data) {
	fillPlayerData(data.data);
}

//-------------------------- EMMITS  -----------------------------------
function startMatchmaking() {
	if (playerName) {
		socket.emit("startMatchMaking", playerName);
	} else {
		alert("you must enter a name");
	}
}

function cancelMatchMaking() {
	if (playerName) {
		socket.emit("cancelMatchmaking", playerName);
	}
}

function emitPlayerMove(move) {
	const data = {
		roomUuid,
		playerName,
		move
	};
	socket.emit("playerMove", data);
}

// ---------------------- OTHER METHDS --------------------------------
function fillPlayerData(playerData) {
	document.getElementById("userNameText").innerText = playerData.name;
	document.getElementById("timePlayedText").innerText =
		playerData.timePlayed.toFixed(1);
	document.getElementById("winCountText").innerText = playerData.winCount;
	document.getElementById("winStreakText").innerText = playerData.winStreak;
	document.getElementById("eloText").innerText = playerData.elo.toFixed(1);
}

function updateGameMessage(message) {
	document.getElementById("gameText").innerText = message;
}

function updateRoundCounter() {
	document.getElementById(
		"roundCounter"
	).innerText = `Rund ${currentRound} of ${totalRounds}`;
}

function choseRock() {
	if (gameIsOngoing) emitPlayerMove(ROCK);
}

function chosePaper() {
	if (gameIsOngoing) emitPlayerMove(PAPER);
}

function choseScissoors() {
	if (gameIsOngoing) emitPlayerMove(SCISSORS);
}
