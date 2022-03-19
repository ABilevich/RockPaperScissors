const BSTQueue = require("./BSTQueue");
const Player = require("./classes/Player");

class MatchMaker {
	constructor(io, gm) {
		this.socketIo = io;
		this.gameQueue = new BSTQueue();
		this.gm = gm;
	}

	initialize() {
		console.log("MatchMaker running" + process.env.STARTING_RETRIES);
	}

	isPlayerOnQueue(player) {
		return player.isOnQueue; //saving state on payer object for fast response
		// return this.gameQueue.has(player);
	}

	addPlayerToQueue(player) {
		//check if player is allready on queue
		if (this.isPlayerOnQueue(player)) return;
		//add player to queue
		this.gameQueue.insert(player);
		player.isOnQueue = true;
	}

	removePlayerFromQueue(player) {
		this.gameQueue.remove(player);
		player.isOnQueue = false;
	}

	findOponentInQueue(player, forced = false) {
		console.log("finding oponent for: ", player.name);
		const bestMatches = this.gameQueue.findClosest(player);
		console.log("-->bestMatches", bestMatches);
		if (bestMatches && bestMatches.length) {
			const bestMatch = bestMatches[0];
			console.log(
				`best oponent found is ${
					bestMatch.name
				} with elo ${bestMatch.elo()}`
			);
			//if the search was forced, match with best case regardless of eloDif
			if (forced) {
				console.log("forcing match with ", bestMatch.name);
				return bestMatch;
			}
			//if eloDif is acceptable, start match
			if (
				this.calcEloDif(player, bestMatch) <
				process.env.MAX_ELO_DIFERENCE
			) {
				console.log("starting match with ", bestMatch.name);
				return bestMatch;
			} else {
				console.log(
					`didnt find any mathes with desired elo, closest:  ${
						bestMatch.name
					} with elo ${bestMatch.elo()}`
				);
			}
		} else {
			console.log("didnt find any match");
			return false;
		}
	}

	findBetterOponentOrStartMatch(player, oponent) {
		const betterOponent = this.findOponentInQueue(player);
		console.log("----> better oponent: ", betterOponent);
		if (
			betterOponent && //if there is another potential oponent
			this.calcEloDif(player, betterOponent) <
				this.calcEloDif(player, oponent) //with a closer elo diference
		) {
			this.notifyPlayer(player, `Found even better oponent!`);
			console.log(
				`found better oponnent for ${player.name} -> ${oponent.name}`
			);
			this.removePlayerFromQueue(betterOponent);

			this.notifyPlayer(oponent, `Oponent unavailable...`);
			//old player will lose its matchmaking, so lets start it again
			setTimeout(() => this.findMatch(oponent), process.env.RETRY_TIMER);

			this.startMatch(player, betterOponent);
		} else {
			console.log(
				`starting match with original ooponent ${player.name} -> ${oponent.name}`
			);
			this.startMatch(player, oponent);
		}
	}

	calcEloDif(player1, player2) {
		return Math.abs(player1.elo() - player2.elo());
	}

	startMatch(player1, player2) {
		this.notifyPlayer(player1, `Starting match agains ${player2.name}`);
		this.notifyPlayer(player2, `Starting match agains ${player1.name}`);
		console.log(
			`starting match between ${player1.name} and ${player2.name}`
		);

		//this.simulateMatch(player1, player2);
		this.gm.createRoom(player1, player2);
	}

	startForcedMatch(player) {
		console.log(`starting forced match for ${player.name}`);
		const oponent = this.findOponentInQueue(player, true);
		if (!oponent) {
			console.log(`no oponents available for ${player.name}`);
			setTimeout(() => this.findMatch(player), process.env.RETRY_TIMER);
		} else {
			this.notifyPlayer(player, `Starting match agains ${oponent.name}`);
			this.notifyPlayer(oponent, `Starting match agains ${player.name}`);
			this.removePlayerFromQueue(oponent);
			this.simulateMatch(player, oponent);
		}
		//TODO
	}

	simulateMatch(player1, player2) {
		console.log(`${player1.name} won!`);
		player1.timePlayed += 10;
		player1.winCount += 1;
		player1.winStreak += 1;
		this.notifyPlayer(player1, `You Won!! new elo is now ${player1.elo()}`);
		this.notifyPlayer(player2, `You Lost... elo is now ${player2.elo()}`);
	}

	async findMatch(player, retries = process.env.STARTING_RETRIES) {
		//if it's the firt time, add myself to queue
		if (retries === process.env.STARTING_RETRIES) {
			if (this.isPlayerOnQueue(player)) {
				//if player is allready in matchmaking
				this.notifyPlayer(player, "Matchmaking already started");
				return;
			}
			this.notifyPlayer(player, "Starting matchmaking");
			console.log(`adding ${player.name} to player queue`);
			this.addPlayerToQueue(player);
			//wait in case anyone is looking fr an ooponent
			await this.waitFor(process.env.RETRY_TIMER);
			if (!this.isPlayerOnQueue(player)) return; //if in that time, the player canceled matchmaking, exit.
		}

		console.log(
			`player is on queue ${player.name}`,
			this.isPlayerOnQueue(player)
		);
		//if someone else selected me for a match, return
		if (!this.isPlayerOnQueue(player)) {
			console.log(
				`${player.name} disconnected or someone else found a match for him, stpping search`
			);
			return;
		}

		//try to find an oponent
		const oponent = this.findOponentInQueue(player);
		//if an opnent is found
		if (oponent) {
			console.log(`found oponnent for ${player.name} -> ${oponent.name}`);
			//remove that oponent from the queue
			this.removePlayerFromQueue(oponent);
			//remove myself so no one matches with me
			this.removePlayerFromQueue(player);
			//notify both players
			this.notifyPlayer(player, `Found potential oponent...`);
			this.notifyPlayer(oponent, `Found potential oponent...`);
			//recheck after POTENTIAL_OPONENT_TIMER, if no better oponent is found, match will start
			setTimeout(
				() => this.findBetterOponentOrStartMatch(player, oponent),
				process.env.POTENTIAL_OPONENT_TIMER
			);
			return;
		}

		//if no openent is found, and retries are available, try again after RETRY_TIMER milis
		if (retries) {
			this.notifyPlayer(
				player,
				`Couldn't find oponent... retriyng in ${
					process.env.RETRY_TIMER / 1000
				} seconds`
			);
			console.log(
				`coudent find oponent for ${player.name}... retrying in ${
					process.env.RETRY_TIMER / 1000
				} seconds`
			);
			player.retryTimeout = setTimeout(
				() => this.findMatch(player, retries - 1),
				process.env.RETRY_TIMER
			);
		} else {
			//if no retries are available, remove me from matchmaking and force a match with any player
			this.removePlayerFromQueue(player);
			this.notifyPlayer(player, `Looking for any oponent...`);
			this.startForcedMatch(player);
		}
	}

	handleCancelMatchMaking(player) {
		if (this.isPlayerOnQueue(player)) {
			if (player.retryTimeout) clearTimeout(player.retryTimeout); //stop retry timeoout
			this.removePlayerFromQueue(player);
			this.notifyPlayer(player, "Matchmaking stoped...");
		} else {
			this.notifyPlayer(
				player,
				"Cant stop matchmaking, match already started..."
			);
		}
	}

	notifyPlayer(player, message) {
		console.log(player, message);
		this.socketIo.to(player.socketId).emit("serverMessage", message);
	}

	handleDisconnect(player) {
		if (player.retryTimeout) clearTimeout(player.retryTimeout); //stop retry timeoout
		this.removePlayerFromQueue(player);
		//TODO: if match had allready started, notify
	}

	waitFor(time) {
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve(2);
			}, time);
		});
	}
}

module.exports = MatchMaker;
