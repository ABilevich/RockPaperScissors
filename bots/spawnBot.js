const { v4: uuidv4 } = require("uuid");

var io = require("socket.io-client");
var socket = io.connect("http://localhost:3000", { reconnect: true });

//create bot with random name
const botName = uuidv4();

//setup listeners
socket.on("connect", function (socket) {
	console.log("Connected!");
});

socket.on("serverMessage", (msg) => displayServerMessage(msg));
socket.on("loginResponse", (data) => checkPlayerLoogin(data));

socket.on("matchData", (data) => handleMatchData(data));
socket.on("roundStart", (data) => handleRoundStart(data));
socket.on("roundEnded", (data) => handleRoundEnded(data));
socket.on("gameEnded", (data) => handleGameEnded(data));

console.log(`loggin in as ${botName}`);
socket.emit("userLogin", botName);

//start matching
startMatch();

//match specific data
let player1 = null;
let player2 = null;
let totalRounds = null;
let roomUuid = null;
let currentRound = null;

function displayServerMessage(data) {
	console.log("displayServerMessage", data);
}
function checkPlayerLoogin(data) {
	console.log("checkPlayerLoogin", data);
}
function handleMatchData(data) {
	console.log("handleMatchData", data);
	player1 = data.data.player1;
	player2 = data.data.player2;
	totalRounds = data.data.totalRounds;
	roomUuid = data.data.roomUuid;
}
function handleRoundStart(data) {
	console.log("Round started");

	gameIsOngoing = true;
	currentRound = data.data.currentRound;

	//Get random move
	const move = getRandomInt(1, 4);
	const moveData = {
		roomUuid,
		playerName: botName,
		move
	};
	console.log("Sending move");
	socket.emit("playerMove", moveData);
}

function handleRoundEnded(data) {
	gameIsOngoing = false;
	console.log("Round ended");
}
function handleGameEnded(data) {
	console.log("Game ended", data);
	setTimeout(() => startMatch(), process.env.WAIT_BETWEEN_MATCHES);
}

function startMatch() {
	console.log("Starting matchmaking");
	socket.emit("startMatchMaking", botName);
}

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}
