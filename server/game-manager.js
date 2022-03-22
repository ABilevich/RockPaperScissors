const room = require("./classes/room");

class gameManager {
	constructor() {
		this.gameRooms = new Map();
	}

	initialize(sm) {
		this.sm = sm;
		console.log("gameManager Initialized!");
	}

	createRoom(player1, player2) {
		//make a new room object and save on map
		const newRoom = new room(player1, player2);
		this.gameRooms.set(newRoom.uuid, newRoom);
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
		gameRoom.startRound();
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
		if (timeRemaining >= 1) {
			//send mesage to playes so they chose an option
			this.notifyTimeRemaining(gameRoom.player1, timeRemaining);
			this.notifyTimeRemaining(gameRoom.player2, timeRemaining);
			setTimeout(() => this.countdown(gameRoom, timeRemaining - 1), 1000);
		} else {
			//after the x seconds pass, check the room to see if both players made am mvoe
			setTimeout(() => this.endRound(gameRoom), 1000);
		}
	}

	playerMadeMove(roomUuid, player, move) {
		console.log("playerMadeMove", roomUuid, player.name, move);
		//when players make a move, register it on the rooom
		const gameRoom = this.gameRooms.get(roomUuid);
		if (!gameRoom) return;
		gameRoom.playerMadeMove(player, move);
	}

	endRound(gameRoom) {
		//calculate round results and norify players
		gameRoom.endRound();
		const roundResults = gameRoom.calculateRoundResults();
		this.notifyRoundEnd(gameRoom.player1, roundResults);
		this.notifyRoundEnd(gameRoom.player2, roundResults);

		//check if match is allready won
		let matchEnded = false;
		if (gameRoom.currentRound > 1) {
			matchEnded = gameRoom.checkWinnCondition();
		}

		if (
			!matchEnded &&
			gameRoom.currentRound < process.env.ROUNDS_PER_GAME
		) {
			//if the game has more rounds remaining, start next round
			gameRoom.currentRound += 1;
			setTimeout(
				() => this.startRound(gameRoom),
				process.env.TIME_BETWEEN_ROUNDS
			);
		} else {
			//if no more runds remain, end game
			setTimeout(
				() => this.endGame(gameRoom),
				process.env.TIME_BETWEEN_ROUNDS
			);
		}
	}

	endGame(gameRoom) {
		const gameResults = gameRoom.calculateGameResults();
		this.notifyGameEnd(gameRoom.player1, gameResults);
		this.notifyGameEnd(gameRoom.player2, gameResults);
		gameRoom.player1.isMatching = false;
		gameRoom.player2.isMatching = false;
		this.closeRoom(gameRoom, gameResults.winner);
	}

	closeRoom(gameRoom, winner) {
		// notify both players their elo change
		this.notifyEloChange(gameRoom.player1);
		this.notifyEloChange(gameRoom.player2);
		// close delete the room
		this.gameRooms.delete(gameRoom.uuid);
	}

	// ----------- NOTIFICATIONS -----------------

	notifyMatchData(player, matchData) {
		const data = {
			message: "Match started",
			type: "ok",
			data: { ...matchData }
		};
		this.sm.notifySocket(player.socketId, "matchData", data);
	}

	notifyRoundStart(player, currentRound) {
		const data = {
			message: "Round started",
			type: "ok",
			data: { currentRound }
		};
		this.sm.notifySocket(player.socketId, "roundStart", data);
	}

	notifyTimeRemaining(player, timeRemaining) {
		const data = {
			message: "Time Remaining",
			type: "ok",
			data: { timeRemaining }
		};
		this.sm.notifySocket(player.socketId, "timeRemaining", data);
	}

	notifyRoundEnd(player, roundResults) {
		const data = {
			message: "Round Ended",
			type: "ok",
			data: { ...roundResults }
		};
		this.sm.notifySocket(player.socketId, "roundEnded", data);
	}

	notifyGameEnd(player, gameResults) {
		const data = {
			message: "Game Ended",
			type: "ok",
			data: { ...gameResults }
		};
		this.sm.notifySocket(player.socketId, "gameEnded", data);
	}

	notifyEloChange(player) {
		const data = {
			message: "Elo changed",
			type: "ok",
			data: { ...player, elo: player.elo() }
		};
		this.sm.notifySocket(player.socketId, "eloChanged", data);
	}
}
module.exports = gameManager;
