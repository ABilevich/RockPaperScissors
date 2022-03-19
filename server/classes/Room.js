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
	}

	calculateRoundResults() {
		//get existing round data
		let roundData = this.rounds[this.currentRound];

		//get both players move
		const player1Move = roundData.get(this.player1.name);
		const player2Move = roundData.get(this.player1.name);

		//get winning player
		const winningPlayer = this.getWinningPlayer(player1Move, player2Move);

		//create match results
		const matchRsults = {
			player1Move: player1Move,
			player2Move: player2Move,
			winner: winningPlayer
		};

		this.rounds[this.currentRound].set("winner", winningPlayer.name);
		return matchRsults;
	}

	//rock -> scissors -> paper -> rock
	// 1         2          3        1
	getWinningPlayer(player1Move, player2Move) {
		if (player1Move === player2Move) {
			return null; //draw
		} else if (
			player1Move === player2Move + 1 ||
			player1Move - 2 === player2Move
		) {
			return this.player1; //player1 won
		}
		return this.player2; //player2 won
	}

	playerMadeMove(player, move) {
		//get existing round data
		let roundData = this.rounds[this.currentRound];
		//if its first move, create moove map
		if (!roundData) roundData = new Map();
		//fil map with player move
		roundData.set(player.name, move);
		//save no rounds array
		this.rounds[this.currentRound] = roundData;
	}

	calculateGameResults() {
		let player1Winns = 0;
		let player2Winns = 0;
		for (const round of this.rounds) {
			let winner = round.get("winner");
			if (winner === this.player1.name) {
				player1Winns++;
			} else if (winner === this.player2.name) {
				player2Winns++;
			}
		}
		let winner = null;
		if (player1Winns > player2Winns) {
			winner = this.player1;
		} else if (player2Winns > player1Winns) {
			winner = this.player2;
		} else {
			winner = null;
		}

		this.updatePlayerStats(winner);

		return winner;
	}

	updatePlayerStats() {
		const gameTime = this.getRoomDuration();
		if (this.player1.name === winner) {
			this.player1.timePlayed += gameTime;
			this.player1.winCount += 1;
			this.player1.winStreak += 1;
			this.player2.timePlayed += gameTime;
			this.player2.winStreak = 0;
		} else if (this.player2.name === winner) {
			this.player2.timePlayed += gameTime;
			this.player2.winCount += 1;
			this.player2.winStreak += 1;
			this.player1.timePlayed += gameTime;
			this.player1.winStreak = 0;
		} else {
			this.player1.timePlayed += gameTime;
			this.player2.timePlayed += gameTime;
		}
	}

	getRoomDuration() {
		const now = new Date();
		let dif = now.getTime() - this.roomStartTime.getTime();
		return Math.abs(dif / 1000);
	}
}
module.exports = Room;
