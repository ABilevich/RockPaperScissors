class player {
	constructor(name, socketId) {
		this.name = name;
		this.timePlayed = 0;
		this.winCount = 0;
		this.winStreak = 0;
		this.socketId = socketId;
		this.isLoggedIn = true;
	}

	elo() {
		return this.timePlayed + this.winCount * 10 + this.winStreak * 20;
	}
}
module.exports = player;
