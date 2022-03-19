//express
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);

//socket.io
const { Server } = require("socket.io");
const io = new Server(server);

const MatchMaker = require("./server/MatchMaker");
const Player = require("./server/Player");
const { isNullOrUndefined } = require("util");
const { EOL } = require("os");

const dotenv = require("dotenv");
dotenv.config();

let mm = null;

const players = new Map();

function initializeServer() {
	setDefaultState();
	console.log("Setting up express...");
	setUpExpress();
	console.log("Setting up Sockets...");
	setupSockets();
	console.log("Setting up MatchMaker...");
	mm = new MatchMaker(io);
	mm.initialize();
}

function setDefaultState() {
	createNewPlayer("Nik", null);
	createNewPlayer("Jack", null);
	createNewPlayer("Ana", null);
}

function createNewPlayer(name, socketId) {
	console.log("created player " + name);
	const newPlayer = new Player(name, socketId);
	players.set(newPlayer.name, newPlayer);
	return newPlayer;
}

function getPlayer(name) {
	return players.get(name);
}

function LoginOrCreatePlayer(name, socketId) {
	let player = players.get(name);
	console.log("login player: ".player);
	if (player) {
		if (player.isLoggedIn) {
			return null;
		}
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
	return /^[a-zA-Z]+$/.test(str);
}

function setupSockets() {
	io.on("connection", (socket) => {
		console.log("a user connected");
		socket.on("disconnect", () => handleUserDisconnect(socket));
		socket.on("userLogin", (userName) =>
			handleUserLoggin(userName, socket)
		);
		socket.on("startMatchMaking", async (userName) =>
			handleStartMatchmaking(userName, socket)
		);
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
	console.log(Array.from(players.values()));

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
	console.log("socket disconnected", socket);
	console.log(Array.from(players.values()));
	const player = getPlayerBySocket(socket.id);
	if (player) {
		player.isLoggedIn = false; //log out user
		mm.handleDisconnect(player); //handle his disconnect
	}
}

function handleStartMatchmaking(userName, socket) {
	const player = getPlayer(userName);
	console.log(`player ${userName} entered matchmaking`);
	mm.findMatch(player);
}

function setUpExpress() {
	app.use(express.static(__dirname + "/public"));

	server.listen(process.env.PORT, () => {
		console.log(`listening on port ${process.env.PORT}`);
	});
}

initializeServer();
