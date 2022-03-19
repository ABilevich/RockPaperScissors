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
			player.isLoggedIn = false; //log out user
			if (player) mm.handleDisconnect(player); //handle his disconnect
		});
		socket.on("userLogin", (userName) => {
			if (!usernameIsValid()) io.emit("serverError", "invalid user name");
			const playerData = LoginOrCreatePlayer(userName, socket.id);
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
			const player = getPlayer(userName);
			console.log(`player ${userName} entered matchmaking`);
			mm.findMatch(player);
		});
	});
}

function setUpExpress() {
	app.use(express.static(__dirname + "/public"));

	server.listen(process.env.PORT, () => {
		console.log(`listening on port ${process.env.PORT}`);
	});
}

initializeServer();
