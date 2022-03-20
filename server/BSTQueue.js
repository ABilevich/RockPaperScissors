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

		let smallest = null;

		while (current && !found) {
			if (value < current.value) {
				//save thhe smallest node along the way
				if (
					!smallest ||
					this.absDif(smallest.value, value) >
						this.absDif(current.value, value)
				)
					smallest = current;
				if (current.left) {
					//fallback = current;
					current = current.left;
				} else if (current.right) {
					const smallestChild = this.kthSmallestNode(current.right);
					if (
						!smallest ||
						this.absDif(smallest.value, value) >
							this.absDif(smallestChild.value, value)
					)
						smallest = smallestChild;
					found = smallest;
				} else {
					found = smallest;
				}
			} else if (value > current.value) {
				//save thhe smallest node along the way
				if (
					!smallest ||
					this.absDif(smallest.value, value) >
						this.absDif(current.value, value)
				)
					smallest = current;
				if (current.right) {
					//fallback = current;
					current = current.right;
				} else if (current.left) {
					const smallestChild = this.kthBiggestNode(current.left);
					if (
						!smallest ||
						this.absDif(smallest.value, value) >
							this.absDif(smallestChild.value, value)
					)
						smallest = smallestChild;
					found = smallest;
				} else {
					found = smallest;
				}
			} else {
				if (
					current.players.filter(
						(auxPlayer) => auxPlayer.name != player.name
					).length > 0
				)
					found = current;
				else {
					if (current.right) {
						const smallestRight = this.kthSmallestNode(
							current.right
						);
						if (
							!smallest ||
							this.absDif(smallest.value, value) >
								this.absDif(smallestRight.value, value)
						)
							smallest = smallestRight;
					}
					if (current.left) {
						const smallestLeft = this.kthBiggestNode(current.left);
						if (
							!smallest ||
							this.absDif(smallest.value, value) >
								this.absDif(smallestLeft.value, value)
						)
							smallest = smallestLeft;
					}
					if (smallest) found = smallest;
					else current = null;
				}
				// else if (current.right) current = current.right;
				// else if (current.left) current = current.left;
				// else if (fallback) found = fallback;
				// else current = null;
			}
		}

		if (!found) return undefined;
		return found.players.filter(
			(auxPlayer) => auxPlayer.name != player.name
		);
	}

	remove(player) {
		const value = player.elo();
		this.root = this.removeNode(this.root, value, player);
	}

	removeNode(current, value, player) {
		if (current === null) return current;

		if (value === current.value) {
			if (current.players.length > 1) {
				current.players = current.players.filter(
					(auxPlayer) => auxPlayer.name != player.name
				);
				return current;
			}

			if (current.left === null && current.right === null) {
				return null;
			} else if (current.left === null) {
				return current.right;
			} else if (current.right === null) {
				return current.left;
			} else {
				let tempNode = this.kthSmallestNode(current.right);
				current.value = tempNode.value;
				current.players = tempNode.players;

				current.right = this.removeNode(
					current.right,
					tempNode.value,
					player
				);

				return current;
			}
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
	kthBiggestNode(node) {
		while (!node.right === null) node = node.right;
		return node;
	}

	absDif(value1, value2) {
		return Math.abs(value1 - value2);
	}
}

module.exports = BSTQueue;
