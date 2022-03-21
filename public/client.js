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

socket.on("playerCantCancel", () => handleCantCancel());
socket.on("playerCanCancel", () => handleCanCancel());

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
	document.getElementById("start-mm-button").style.visibility = "hidden";
	document.getElementById("cancel-mm-button").style.visibility = "hidden";
	updateGameMessage("Got game data");
	console.log("Game data", data);
	player1 = data.data.player1;
	player2 = data.data.player2;
	totalRounds = data.data.totalRounds;
	roomUuid = data.data.roomUuid;
}
function handleRoundStart(data) {
	displayServerMessage("Round started");
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
	displayServerMessage("Round ended");

	let oponentMove = null;
	let oponentName = null;
	if (player1 == playerName) {
		oponentMove = data.data.player2Move;
		oponentName = player2;
	} else {
		oponentMove = data.data.player1Move;
		oponentName = player1;
	}

	console.log("oponent move is: ", oponentMove);
	console.log("got round end data: ", data);
	gameIsOngoing = false;
	if (data.data.winner) {
		if (data.data.winner === playerName) {
			updateGameMessage(
				`Round ended, ${oponentName} chose ${parseMove(
					oponentMove
				)}, you won this round!`
			);
		} else {
			updateGameMessage(
				`Round ended, ${oponentName} chose ${parseMove(
					oponentMove
				)} and won this round!`
			);
		}
	} else {
		updateGameMessage(`Round ended: it was a draw!`);
	}
}
function handleGameEnded(data) {
	displayServerMessage("Game ended");
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
	setTimeout(() => this.clearDisplay(), 1000);
	document.getElementById("start-mm-button").style.visibility = "visible";
	document.getElementById("cancel-mm-button").style.visibility = "visible";
}
function handleElochanged(data) {
	displayServerMessage("Your Elo changed!");
	fillPlayerData(data.data);
}

function handleCantCancel() {
	document.getElementById("cancel-mm-button").style.visibility = "hidden";
}

function handleCanCancel() {
	document.getElementById("cancel-mm-button").style.visibility = "visible";
}

//-------------------------- EMMITS  -----------------------------------
function startMatchmaking() {
	document.getElementById("start-mm-button").style.visibility = "hidden";
	if (playerName) {
		socket.emit("startMatchMaking", playerName);
	} else {
		alert("you must enter a name");
	}
}

function cancelMatchMaking() {
	document.getElementById("start-mm-button").style.visibility = "visible";
	if (playerName) {
		socket.emit("cancelMatchmaking", playerName);
	}
}

function emitPlayerMove(move) {
	document.getElementById("game-buttons").style.visibility = "hidden";
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

function clearDisplay() {
	document.getElementById("gameText").innerText = "";
	document.getElementById("roundCounter").innerText = "";
}

function parseMove(move) {
	switch (move) {
		case ROCK:
			return "rock";
		case PAPER:
			return "paper";
		case SCISSORS:
			return "scissors";
		default:
			return "nothing";
	}
}
