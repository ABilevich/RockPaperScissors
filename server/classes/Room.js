const { v4: uuidv4 } = require("uuid");

class Room {
	constructor(player1, player2) {
		this.uuid = uuidv4();
		this.player1 = player1;
		this.player2 = player2;
		this.rounds = [];
		this.currentRound = 1;
		this.timeout = null;
		this.roomStartTime = new Date();
		this.player1Wins = 0;
		this.player2Wins = 0;
	}

	startRound() {
		//create round map
		const roundData = new Map();
		//set round status to opened
		roundData.set("status", "opened");
		this.rounds[this.currentRound] = roundData;
	}

	endRound() {
		//get round data
		let roundData = this.rounds[this.currentRound];
		//set round status to closed, players can no longer change their move
		roundData.set("status", "closed");
		this.rounds[this.currentRound] = roundData;
	}

	calculateRoundResults() {
		//get existing round data
		let roundData = this.rounds[this.currentRound];

		//get both players move
		const player1Move = roundData.get(this.player1.name);
		const player2Move = roundData.get(this.player2.name);

		//get winning player
		const winningPlayer = this.getWinningPlayer(player1Move, player2Move);

		if (winningPlayer) {
			if (winningPlayer.name == this.player1.name) {
				this.player1Wins++;
			} else if (winningPlayer.name == this.player2.name) {
				this.player2Wins++;
			}
		}

		//create match results
		const roundResults = {
			player1Move: player1Move,
			player2Move: player2Move,
			winner: winningPlayer?.name
		};

		this.rounds[this.currentRound].set("winner", winningPlayer?.name);
		return roundResults;
	}

	//rock -> scissors -> paper -> rock
	// 1         2          3        1
	getWinningPlayer(player1Move, player2Move) {
		if (player1Move && !player2Move) return this.player1;
		if (player2Move && !player1Move) return this.player2;
		if (player1Move === player2Move) {
			return null; //draw
		} else if (
			player1Move + 1 === player2Move ||
			player1Move - 2 === player2Move
		) {
			return this.player1; //player1 won
		}
		return this.player2; //player2 won
	}

	playerMadeMove(player, move) {
		//get existing round data
		let roundData = this.rounds[this.currentRound];
		// if round is allready over, cancel move
		if (roundData.get("status") === "closed") return;
		//fil map with player move
		roundData.set(player.name, move);
		//save no rounds array
		this.rounds[this.currentRound] = roundData;
	}

	calculateGameResults() {
		let player1Winns = 0;
		let player2Winns = 0;
		this.rounds.forEach((round) => {
			//calculate round winner
			const roundWinner = round.get("winner");
			if (roundWinner === this.player1.name) {
				player1Winns++;
			} else if (roundWinner === this.player2.name) {
				player2Winns++;
			}
		});

		//calculate game winner
		let gameWinner = null;
		if (player1Winns > player2Winns) {
			gameWinner = this.player1;
		} else if (player2Winns > player1Winns) {
			gameWinner = this.player2;
		}

		// update both players elo
		this.updatePlayerStats(gameWinner);

		const gameResults = {
			winner: gameWinner?.name,
			rounds: Array.from(this.rounds.values())
		};
		return gameResults;
	}

	updatePlayerStats(gameWinner) {
		const gameTime = this.getRoomDuration();
		if (!gameWinner) {
			this.player1.timePlayed += gameTime;
			this.player1.winStreak = 0;
			this.player2.timePlayed += gameTime;
			this.player2.winStreak = 0;
		} else if (this.player1.name === gameWinner.name) {
			this.player1.timePlayed += gameTime;
			this.player1.winCount += 1;
			this.player1.winStreak += 1;
			this.player2.timePlayed += gameTime;
			this.player2.winStreak = 0;
		} else {
			this.player2.timePlayed += gameTime;
			this.player2.winCount += 1;
			this.player2.winStreak += 1;
			this.player1.timePlayed += gameTime;
			this.player1.winStreak = 0;
		}
	}

	getRoomDuration() {
		const now = new Date();
		let dif = now.getTime() - this.roomStartTime.getTime();
		return Math.abs(dif / 1000);
	}

	checkWinnCondition() {
		if (this.player1Wins > process.env.ROUNDS_PER_GAME / 2) return true;
		if (this.player2Wins > process.env.ROUNDS_PER_GAME / 2) return true;
		return false;
	}
}
module.exports = Room;
