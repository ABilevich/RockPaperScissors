//express
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);

//socket.io
const { Server } = require("socket.io");
const io = new Server(server);

//classes
const matchMaker = require("./server/match-maker");
const gameManager = require("./server/game-manager");
const socketManager = require("./server/socket-manager");
const playerManager = require("./server/player-manager");

//envionment
const dotenv = require("dotenv");
dotenv.config();

let mm = null;
let gm = null;
let pm = null;
let sm = null;

function initializeServer() {
	gm = new gameManager(); //Manages the flow of the game
	mm = new matchMaker(); //Manages the matchmaking engine
	pm = new playerManager(); // Manages player acctions
	sm = new socketManager(io); // Manages socket messaging

	console.log("Setting up Sockets...");
	sm.initialize(gm, mm, pm);

	console.log("Setting up gameManager...");
	gm.initialize(sm);

	console.log("Setting up matchMaker...");
	mm.initialize(sm, gm);

	console.log("Setting up PLayerManager...");
	pm.initialize();

	console.log("Setting up server...");
	setUpServer();
}

function setUpServer() {
	app.use(express.static(__dirname + "/public"));

	//leaderboard to featch player info
	app.get("/leaderboard", function (req, res) {
		const players = pm.getPlayerList();
		res.send(JSON.stringify(players));
	});

	server.listen(process.env.PORT, () => {
		console.log(`listening on port ${process.env.PORT}`);
		console.log(`client up on http://localhost:${process.env.PORT}`);
	});
}

initializeServer();
