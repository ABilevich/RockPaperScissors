const player = require("./classes/player");

class playerManager {
	constructor() {
		this.players = new Map();
	}

	initialize() {
		console.log("playerManager Initialized!");
	}

	// ------------------ GETTERS ----------------

	getPlayer(name) {
		return this.players.get(name);
	}

	getPlayerBySocket(socketId) {
		const values = Array.from(this.players.values());
		const filteredPlayers = values.filter(
			(auxPlayer) => auxPlayer.socketId === socketId
		);
		if (filteredPlayers.length) return filteredPlayers[0];
		return null;
	}

	getPlayerList() {
		const allPlayers = Array.from(this.players.values());
		const modifiedPlayerList = allPlayers.map((player) => ({
			elo: player.elo(),
			name: player.name,
			timePlayed: player.timePlayed,
			winCount: player.winCount,
			winStreak: player.winStreak
		}));
		modifiedPlayerList.sort((p1, p2) => {
			return p2.elo - p1.elo;
		});
		return modifiedPlayerList;
	}

	// ------------------ LOGIN FLOW ----------------
	createNewPlayer(name, socketId) {
		console.log(`Created player: ${name}`);
		const isBot = this.checkIsBot(name);
		const newPlayer = new player(name, isBot, socketId);
		this.players.set(newPlayer.name, newPlayer);
		return newPlayer;
	}

	LoginOrCreatePlayer(name, socketId) {
		//validate username
		if (!this.usernameIsValid(name)) throw new Error("Username is invalid");

		//get existing player and log him in or create new player
		let player = this.players.get(name);
		if (player) {
			if (player.isLoggedIn) return null;
			player.isLoggedIn = true; //log him in
			player.socketId = socketId; // update socket id
			return player;
		}
		return this.createNewPlayer(name, socketId);
	}

	logOutPlayer(player) {
		player.isLoggedIn = false; //log out user
	}

	// ------------------- CHECKS ------------------
	usernameIsValid(str) {
		const isBot = this.checkIsBot(str);
		const isValidUser = /^[a-zA-Z]+$/.test(str);
		return isBot || isValidUser; //check if username letters or uuid
	}

	checkIsBot(name) {
		return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
			name
		);
	}
}

module.exports = playerManager;
