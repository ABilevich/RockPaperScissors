class Node {
	constructor(value, player) {
		this.value = value;
		this.players = [player];
		this.left = null;
		this.right = null;
	}
}

//this binary searchi Tree was modified so that each node has an array of all the players with the same elo
class BSTQueue {
	constructor() {
		this.root = null;
	}
	insert(player) {
		const value = player.elo();
		var newNode = new Node(value, player);
		if (this.root === null) {
			this.root = newNode;
			return this;
		}
		let current = this.root;
		while (current) {
			if (value === current.value) {
				current.players.push(player);
				return;
			}
			if (value < current.value) {
				if (current.left === null) {
					current.left = newNode;
					return this;
				}
				current = current.left;
			} else {
				if (current.right === null) {
					current.right = newNode;
					return this;
				}
				current = current.right;
			}
		}
	}

	find(value) {
		if (!this.root) return false;

		let current = this.root;
		let found = false;
		while (current && !found) {
			if (value < current.value) {
				current = current.left;
			} else if (value > current.value) {
				current = current.right;
			} else {
				found = current;
			}
		}

		if (!found) return undefined;
		return found;
	}

	has(player) {
		const players = this.find(player.elo());
		if (players) {
			const filteredPlayers = players.players.filter(
				(auxPlayer) => auxPlayer.name === player.name
			);
			return filteredPlayers.length;
		}
		return false;
	}

	//this is a custom function for with the BST was used
	//it serches for the clsoest node to the node asked, taking int account players with the same elo
	findClosest(player) {
		const value = player.elo();
		if (!this.root) return false;

		let current = this.root;
		let found = false;
		let fallback = null;

		while (current && !found) {
			if (value < current.value) {
				if (current.left) {
					fallback = current;
					current = current.left;
				} else found = current;
			} else if (value > current.value) {
				if (current.right) {
					fallback = current;
					current = current.right;
				} else found = current;
			} else {
				if (
					current.players.filter(
						(auxPlayer) => auxPlayer.name != player.name
					).length > 0
				)
					found = current;
				else if (current.right) current = current.right;
				else if (current.left) current = current.left;
				else if (fallback) found = fallback;
				else current = null;
			}
		}

		if (!found) return undefined;
		return found.players.filter(
			(auxPlayer) => auxPlayer.name != player.name
		);
	}

	// this function calls removeNode
	remove(player) {
		const value = player.elo();
		this.root = this.removeNode(this.root, value, player);
	}

	// a recursive function to insert a new value in binary search tree
	removeNode(current, value, player) {
		// base case, if the tree is empty
		if (current === null) return current;

		// when value is the same as current's value, this is the node to be deleted
		if (value === current.value) {
			// if there is more than one player on that value, remove without deleting
			if (current.players.length > 1) {
				current.players = current.players.filter(
					(auxPlayer) => auxPlayer.name != player.name
				);
				return current;
			}

			// for case 1 and 2, node without child or with one child
			if (current.left === null && current.right === null) {
				return null;
			} else if (current.left === null) {
				return current.right;
			} else if (current.right === null) {
				return current.left;
			} else {
				/// node with two children, get the inorder successor,
				//smallest in the right subtree
				let tempNode = this.kthSmallestNode(current.right);
				current.value = tempNode.value;
				current.players = tempNode.players;

				/// delete the inorder successor
				current.right = this.removeNode(
					current.right,
					tempNode.value,
					player
				);

				return current;
			}

			// recur down the tree
		} else if (value < current.value) {
			current.left = this.removeNode(current.left, value, player);
			return current;
		} else {
			current.right = this.removeNode(current.right, value, player);
			return current;
		}
	}

	/// helper function to find the smallest node

	kthSmallestNode(node) {
		while (!node.left === null) node = node.left;
		return node;
	}
}

module.exports = BSTQueue;
