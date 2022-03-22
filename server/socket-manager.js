class socketManager {
	constructor(io) {
		this.socketIo = io;
	}

	initialize(gm, mm, pm) {
		this.gm = gm;
		this.mm = mm;
		this.pm = pm;
		this.setupSockets();
		console.log("socketManager Initialized!");
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
			const playerData = this.pm.LoginOrCreatePlayer(userName, socket.id);
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
				message: "Invalid name",
				type: "error",
				data: null
			});
		}
	}

	handleUserDisconnect(socket) {
		const player = this.pm.getPlayerBySocket(socket.id);
		if (!player) return;
		this.pm.logOutPlayer(player); //log out player
		this.mm.handleDisconnect(player); //handle his disconnect
	}

	handleStartMatchmaking(userName) {
		const player = this.pm.getPlayer(userName);
		if (!player || player.isMatching) return; //if player is matching, return
		console.log(`player ${userName} entered matchmaking`);
		this.mm.findMatch(player); //start matchmaking
	}

	handleCancelMatchmaking(userName) {
		const player = this.pm.getPlayer(userName);
		if (!player || !player.isMatching) return; //if player is not matching, return
		console.log(`player ${userName} canceled matchmaking`);
		this.mm.handleCancelMatchMaking(player); // stop matchmaking
	}

	handlePlayerMove(data) {
		const player = this.pm.getPlayer(data.playerName);
		if (!player) return; // if player does not exist, return
		this.gm.playerMadeMove(data.roomUuid, player, data.move); //make move
	}

	// ----------------- NOTIFICATIONS --------------------

	notifySocket(socketId, event, data) {
		this.socketIo.to(socketId).emit(event, data);
	}
}

module.exports = socketManager;
