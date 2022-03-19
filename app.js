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

function getOrCreatePlayer(name, socketId) {
	let player = players.get(name);
	if (player) {
		if (player.isLoggedIn) {
			return null;
		}
		player.isLoggedIn = true;
		return player;
	}
	return createNewPlayer(name, socketId);
}

function getPlayerBySocket(socketId) {
	const values = Array.from(players.values());
	const player = values.filter((auxPlayer) => auxPlayer.socketId != socketId);
	if (player.length) return player[0];
	return null;
}

function usernameIsValid() {
	return true;
}

function setupSockets() {
	io.on("connection", (socket) => {
		console.log("a user connected");
		socket.on("disconnect", (data) => {
			console.log("user disconnected", data);
			const player = getPlayerBySocket(socket.id);
			if (player) mm.handleDisconnect(player);
		});
		socket.on("userLogin", (userName) => {
			if (!usernameIsValid()) io.emit("serverError", "invalid user name");
			const playerData = getOrCreatePlayer(userName, socket.id);
			if (playerData) {
				io.to(socket.id).emit("loginResponse", {
					message: `user ${userName} logged in.`,
					type: "success",
					data: playerData
				});
			} else {
				io.to(socket.id).emit("loginResponse", {
					message: `user ${userName} is allready logged in`,
					type: "error",
					data: null
				});
			}
			console.log(`player ${userName} logged in.`);
		});
		socket.on("startMatchMaking", async (userName) => {
			const player = getOrCreatePlayer(userName, socket.id);
			console.log(`player ${userName} entered matchmaking`);
			mm.findMatch(player);
		});
	});
}

function setUpExpress() {
	app.use(express.static(__dirname + "/public"));

	// app.get("/", (req, res) => {
	// 	res.sendFile(__dirname + "/public/index.html");
	// });

	server.listen(3000, () => {
		console.log("listening on port 3000");
	});
}

initializeServer();
