class SocketManager {
	constructor(io) {
		this.socketIo = io;
	}

	initialize(gameManager, matchMaker, playerManager) {
		this.gameManager = gameManager;
		this.matchMaker = matchMaker;
		this.playerManager = playerManager;
		this.setupSockets();
		console.log("SocketManager Initialized!");
	}

	setupSockets() {
		this.socketIo.on("connection", (socket) => {
			console.log("A client connected");
			socket.on("disconnect", () => this.handleUserDisconnect(socket));
			socket.on("userLogin", (userName) =>
				this.handleUserLoggin(userName, socket)
			);
			socket.on("startMatchMaking", async (userName) =>
				this.handleStartMatchmaking(userName)
			);
			socket.on("cancelMatchmaking", async (userName) =>
				this.handleCancelMatchmaking(userName)
			);
			socket.on("playerMove", async (data) =>
				this.handlePlayerMove(data)
			);
		});
	}

	// ------------------- HANDLERS -----------------------

	handleUserLoggin(userName, socket) {
		console.log("user login ", userName);
		try {
			const playerData = this.playerManager.LoginOrCreatePlayer(
				userName,
				socket.id
			);
			if (playerData) {
				this.socketIo.to(socket.id).emit("loginResponse", {
					message: `user ${userName} logged in.`,
					type: "success",
					data: { ...playerData, elo: playerData.elo() }
				});
			} else {
				this.socketIo.to(socket.id).emit("loginResponse", {
					message: `user ${userName} is allready logged in`,
					type: "error",
					data: null
				});
			}
			console.log(`player ${userName} logged in.`);
		} catch (error) {
			console.error(error);
			this.socketIo.to(socket.id).emit("loginResponse", {
				message: "Login Error",
				type: "error",
				data: null
			});
		}
	}

	handleUserDisconnect(socket) {
		const player = this.playerManager.getPlayerBySocket(socket.id);
		if (!player) return;
		this.playerManager.logOutPlayer(player); //log out player
		this.matchMaker.handleDisconnect(player); //handle his disconnect
	}

	handleStartMatchmaking(userName) {
		const player = this.playerManager.getPlayer(userName);
		if (!player || player.isMatching) return; //if player is matching, return
		console.log(`player ${userName} entered matchmaking`);
		this.matchMaker.findMatch(player); //start matchmaking
	}

	handleCancelMatchmaking(userName) {
		const player = this.playerManager.getPlayer(userName);
		if (!player || !player.isMatching) return; //if player is not matching, return
		console.log(`player ${userName} canceled matchmaking`);
		this.matchMaker.handleCancelMatchMaking(player); // stop matchmaking
	}

	handlePlayerMove(data) {
		const player = this.playerManager.getPlayer(data.playerName);
		if (!player) return; // if player does not exist, return
		this.gameManager.playerMadeMove(data.roomUuid, player, data.move); //make move
	}

	// ----------------- NOTIFICATIONS --------------------

	notifySocket(socketId, event, data) {
		this.socketIo.to(socketId).emit(event, data);
	}
}

module.exports = SocketManager;
