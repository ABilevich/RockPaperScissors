const bstQueue = require("../bst-queue");
const { v4: uuidv4 } = require("uuid");

const bstQueue = new bstQueue();

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

// bstQueue.insert(player1.elo, player1);
// bstQueue.insert(player2.elo, player2);
// bstQueue.insert(player3.elo, player3);
// bstQueue.remove(player2.elo, player2);
// bstQueue.remove(player1.elo, player1);

const player4 = createNewPlayer("felipe", 4);
const player2 = createNewPlayer("juan", 2);
const player1 = createNewPlayer("pepe", 1);
const player5 = createNewPlayer("nacho", 5);
const player3 = createNewPlayer("martin", 3);
const player6 = createNewPlayer("nacho2", 3.5);

bstQueue.insert(player1.elo, player1);
bstQueue.insert(player2.elo, player2);
bstQueue.insert(player3.elo, player3);
bstQueue.insert(player4.elo, player4);
bstQueue.insert(player5.elo, player5);
bstQueue.insert(player6.elo, player6);

console.log(bstQueue.find(player1.elo));

console.log(bstQueue.findClosest(player6.elo, player6));

//This file isnt working, its only here because it was used to test the tree originaly
