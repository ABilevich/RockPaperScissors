const Room = require("./classes/Room");

class GameManager {
	constructor(io) {
		this.socketIo = io;
		this.gameRooms = new Map();
	}

	createRoom(player1, player2) {
		//make a new room object and save on map
		const newRoom = new Room(player1, player2);
		this.gameRooms.set(newRoom.uuid, newRoom);
		console.log("created room", newRoom);
		console.log("in map", this.gameRooms.get(newRoom.uuid));
		//set roomUuid on both players
		player1.roomUuid = newRoom.uuid;
		player2.roomUuid = newRoom.uuid;
		//start game
		this.startGame(newRoom);
	}

	startGame(gameRoom) {
		const matchData = {
			player1: gameRoom.player1.name,
			player2: gameRoom.player2.name,
			totalRounds: process.env.ROUNDS_PER_GAME,
			roomUuid: gameRoom.uuid
		};
		//send players the game data
		this.notifyMatchData(gameRoom.player1, matchData);
		this.notifyMatchData(gameRoom.player2, matchData);
		//start first round on room
		this.startRound(gameRoom);
	}

	startRound(gameRoom) {
		//notify players round number and there player numbers
		this.notifyRoundStart(gameRoom.player1, gameRoom.currentRound);
		this.notifyRoundStart(gameRoom.player2, gameRoom.currentRound);
		//start countdown and notify players each second
		this.countdown(gameRoom, process.env.TIME_PER_ROUND);
	}

	countdown(gameRoom, timeRemaining) {
		//clear the timeout
		if (gameRoom.timeout) {
			clearTimeout(gameRoom.timeout);
			gameRoom.timeout = null;
		}
		if (timeRemaining > 1) {
			//send mesage to playes so they chose an option
			this.notifyTimeRemaining(gameRoom.player1, timeRemaining);
			this.notifyTimeRemaining(gameRoom.player2, timeRemaining);
			setTimeout(() => this.countdown(gameRoom, timeRemaining - 1), 1000);
		} else {
			//after the x seconds pass, check the room to see if both players made am mvoe
			setTimeout(() => this.endRound(gameRoom), 1000);
		}
	}

	endRound(gameRoom) {
		//calculate round results and norify players
		const roundResults = gameRoom.calculateRoundResults();
		this.notifyRoundEnd(gameRoom.player1, roundResults);
		this.notifyRoundEnd(gameRoom.player2, roundResults);
		if (gameRoom.currentRound < process.env.ROUNDS_PER_GAME) {
			//if the game has more rounds remaining, start next round
			gameRoom.currentRound += 1;
			this.startRound(gameRoom);
		} else {
			//if no more runds remain, end game
			this.endGame(gameRoom);
		}
	}

	endGame(gameRoom) {
		const winner = gameRoom.calculateGameResults();
		this.notifyGameEnd(gameRoom.player1, winner);
		this.notifyGameEnd(gameRoom.player2, winner);
		this.closeRoom(gameRoom, winner);
	}

	closeRoom(gameRoom, winner) {
		// update bth players elo and nority them
		gameRoom.updatePlayerStats();
		// notify both players their elo change
		this.notifyEloChange(player1);
		this.notifyEloChange(player2);
		// close delete the room
		this.gameRooms.delete(gameRoom.uuid);
	}

	playerMadeMove(roomUuid, player, move) {
		console.log("playerMadeMove", roomUuid, player.name, move);
		console.log("room is", this.gameRooms.get(roomUuid));
		//when players make a move, register it on the rooom
		const gameRoom = this.gameRooms.get(roomUuid);
		if (!gameRoom) return;
		gameRoom.playerMadeMove(player, move);
	}

	notifyMatchData(player, matchData) {
		const data = {
			message: "Match started",
			type: "ok",
			data: {
				matchData
			}
		};
		this.socketIo.to(player.socketId).emit("matchData", data);
	}

	notifyRoundStart(player, currentRound) {
		const data = {
			message: "Round started",
			type: "ok",
			data: {
				currentRound
			}
		};
		this.socketIo.to(player.socketId).emit("roundStart", data);
	}

	notifyTimeRemaining(player, timeRemaining) {
		const data = {
			message: "Time Remaining",
			type: "ok",
			data: {
				timeRemaining
			}
		};
		this.socketIo.to(player.socketId).emit("timeRemaining", data);
	}

	notifyRoundEnd(player, matchData) {
		const data = {
			message: "Round Ended",
			type: "ok",
			data: {
				matchData
			}
		};
		this.socketIo.to(player.socketId).emit("roundEnded", data);
	}

	notifyGameEnd(player, gameData) {
		const data = {
			message: "Game Ended",
			type: "ok",
			data: {
				gameData
			}
		};
		this.socketIo.to(player.socketId).emit("gameEnded", data);
	}

	notifyEloChange(player) {
		this.socketIo.to(player.socketId).emit("eloChanged", player);
	}
}
module.exports = GameManager;
