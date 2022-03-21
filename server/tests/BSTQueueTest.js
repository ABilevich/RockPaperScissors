const BSTQueue = require("../BSTQueue");
const Player = require("../classes/Player");
const { v4: uuidv4 } = require("uuid");

const BSTQueue = new BSTQueue();

function createNewPlayer(name, elo) {
	console.log("created player " + name);
	const newPlayer = {
		uuid: uuidv4(),
		name,
		elo
	};
	return newPlayer;
}

// const player1 = createNewPlayer("pepe", 1);
// const player2 = createNewPlayer("juan", 1);
// const player3 = createNewPlayer("felipe", 1);

// BSTQueue.insert(player1.elo, player1);
// BSTQueue.insert(player2.elo, player2);
// BSTQueue.insert(player3.elo, player3);
// BSTQueue.remove(player2.elo, player2);
// BSTQueue.remove(player1.elo, player1);

const player4 = createNewPlayer("felipe", 4);
const player2 = createNewPlayer("juan", 2);
const player1 = createNewPlayer("pepe", 1);
const player5 = createNewPlayer("nacho", 5);
const player3 = createNewPlayer("martin", 3);
const player6 = createNewPlayer("nacho2", 3.5);

BSTQueue.insert(player1.elo, player1);
BSTQueue.insert(player2.elo, player2);
BSTQueue.insert(player3.elo, player3);
BSTQueue.insert(player4.elo, player4);
BSTQueue.insert(player5.elo, player5);
BSTQueue.insert(player6.elo, player6);

console.log(BSTQueue.find(player1.elo));

console.log(BSTQueue.findClosest(player6.elo, player6));

//This file isnt working, its only here because it was used to test the tree originaly
