//express
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);

//socket.io
const { Server } = require("socket.io");
const io = new Server(server);

//classes
const MatchMaker = require("./server/match-maker");
const GameManager = require("./server/game-manager");
const SocketManager = require("./server/socket-manager");
const PlayerManager = require("./server/player-manager");

//envionment
const dotenv = require("dotenv");
dotenv.config();

let matchMaker = null;
let gameManager = null;
let playerManager = null;
let socketManager = null;

function initializeServer() {
	gameManager = new GameManager(); //Manages the flow of the game
	matchMaker = new MatchMaker(); //Manages the matchmaking engine
	playerManager = new PlayerManager(); // Manages player acctions
	socketManager = new SocketManager(io); // Manages socket messaging

	console.log("Setting up Sockets...");
	socketManager.initialize(gameManager, matchMaker, playerManager);

	console.log("Setting up GameManager...");
	gameManager.initialize(socketManager);

	console.log("Setting up MatchMaker...");
	matchMaker.initialize(socketManager, gameManager);

	console.log("Setting up PLayerManager...");
	playerManager.initialize();

	console.log("Setting up server...");
	setUpServer();
}

function setUpServer() {
	app.use(express.static(__dirname + "/public"));

	//leaderboard to featch player info
	app.get("/leaderboard", function (req, res) {
		const players = playerManager.getPlayerList();
		res.send(JSON.stringify(players));
	});

	server.listen(process.env.PORT, () => {
		console.log(`listening on port ${process.env.PORT}`);
		console.log(`client up on http://localhost:${process.env.PORT}`);
	});
}

initializeServer();
