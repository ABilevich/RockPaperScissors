//express
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);

//socket.io
const { Server } = require("socket.io");
const io = new Server(server);

const MatchMaker = require("./server/MatchMaker");
const GameManager = require("./server/GameManager");
const Player = require("./server/classes/Player");
const { isNullOrUndefined } = require("util");
const { EOL } = require("os");

const dotenv = require("dotenv");
const { timeStamp } = require("console");
const { all } = require("express/lib/application");
dotenv.config();

let mm = null;
let gm = null;

const players = new Map();

function initializeServer() {
	console.log("Setting up express...");
	setUpExpress();
	console.log("Setting up Sockets...");
	setupSockets();
	console.log("Setting up GameManager...");
	gm = new GameManager(io);
	console.log("Setting up MatchMaker...");
	mm = new MatchMaker(io, gm);
}

function createNewPlayer(name, socketId) {
	console.log(`Created player: ${name}`);
	const newPlayer = new Player(name, socketId);
	players.set(newPlayer.name, newPlayer);
	return newPlayer;
}

function getPlayer(name) {
	return players.get(name);
}

function LoginOrCreatePlayer(name, socketId) {
	let player = players.get(name);
	if (player) {
		if (player.isLoggedIn) return null;
		player.isLoggedIn = true; //log him in
		player.socketId = socketId; // update socket id
		return player;
	}
	return createNewPlayer(name, socketId);
}

function getPlayerBySocket(socketId) {
	const values = Array.from(players.values());
	const filteredPlayers = values.filter(
		(auxPlayer) => auxPlayer.socketId === socketId
	);
	if (filteredPlayers.length) return filteredPlayers[0];
	return null;
}

function usernameIsValid(str) {
	const isBoot =
		/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
			str
		);
	const isValidUser = /^[a-zA-Z]+$/.test(str);
	return isBoot || isValidUser; //check if username letters or uuid
}

function setupSockets() {
	io.on("connection", (socket) => {
		console.log("A client connected");
		socket.on("disconnect", () => handleUserDisconnect(socket));
		socket.on("userLogin", (userName) =>
			handleUserLoggin(userName, socket)
		);
		socket.on("startMatchMaking", async (userName) =>
			handleStartMatchmaking(userName, socket)
		);
		socket.on("cancelMatchmaking", async (userName) =>
			handleCancelMatchmaking(userName, socket)
		);
		socket.on("playerMove", async (data) => handlePlayerMove(data));
	});
}

function handleUserLoggin(userName, socket) {
	//validate username
	if (!usernameIsValid(userName)) {
		io.to(socket.id).emit("loginResponse", {
			message: `user ${userName} is invalid`,
			type: "error",
			data: null
		});
		return;
	}

	//get existing player and log him in ore create new player
	const playerData = LoginOrCreatePlayer(userName, socket.id);

	if (playerData) {
		io.to(socket.id).emit("loginResponse", {
			message: `user ${userName} logged in.`,
			type: "success",
			data: { ...playerData, elo: playerData.elo() }
		});
	} else {
		io.to(socket.id).emit("loginResponse", {
			message: `user ${userName} is allready logged in`,
			type: "error",
			data: null
		});
	}
	console.log(`player ${userName} logged in.`);
}

function handleUserDisconnect(socket) {
	const player = getPlayerBySocket(socket.id);
	if (player) {
		player.isLoggedIn = false; //log out user
		mm.handleDisconnect(player); //handle his disconnect
	}
}

function handleStartMatchmaking(userName, socket) {
	const player = getPlayer(userName);
	if (player.isMatching) return; //if player is matching, return
	console.log(`player ${userName} entered matchmaking`);
	mm.findMatch(player);
}

function handleCancelMatchmaking(userName, socket) {
	const player = getPlayer(userName);
	if (!player.isMatching) return; //if player is not matching, return
	console.log(`player ${userName} canceled matchmaking`);
	mm.handleCancelMatchMaking(player);
}

function handlePlayerMove(data) {
	const player = players.get(data.playerName);
	if (!player) return;
	gm.playerMadeMove(data.roomUuid, player, data.move);
}

function setUpExpress() {
	app.use(express.static(__dirname + "/public"));

	//leaderbiard to featch player info
	app.get("/leaderboard", function (req, res) {
		const allPlayers = Array.from(players.values());
		const modifiedPlayerList = allPlayers.map((player) => ({
			elo: player.elo(),
			name: player.name,
			timePlayed: player.timePlayed,
			winCount: player.winCount,
			winStreak: player.winStreak
		}));
		modifiedPlayerList.sort((p1, p2) => {
			return p1.elo - p2.elo;
		});
		res.send(JSON.stringify(modifiedPlayerList));
	});

	server.listen(process.env.PORT, () => {
		console.log(`listening on port ${process.env.PORT}`);
	});
}

initializeServer();
