class node {
	constructor(value, player) {
		this.value = value;
		this.players = [player];
		this.left = null;
		this.right = null;
	}
}

//this binary searchi Tree was modified so that each node has an array of all the players with the same elo
class bstQueue {
	constructor() {
		this.root = null;
	}
	insert(player) {
		const value = player.elo();
		var newNode = new node(value, player);
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

		let closest = null;

		while (current && !found) {
			if (value < current.value) {
				//save the closest node along the way
				if (
					!closest ||
					this.absDif(closest.value, value) >
						this.absDif(current.value, value)
				)
					closest = current;
				if (current.left) {
					//fallback = current;
					current = current.left;
				} else if (current.right) {
					const closestChild = this.kthSmallestNode(current.right);
					if (
						!closest ||
						this.absDif(closest.value, value) >
							this.absDif(closestChild.value, value)
					)
						closest = closestChild;
					found = closest;
				} else {
					found = closest;
				}
			} else if (value > current.value) {
				//save thhe closest node along the way
				if (
					!closest ||
					this.absDif(closest.value, value) >
						this.absDif(current.value, value)
				)
					closest = current;
				if (current.right) {
					//fallback = current;
					current = current.right;
				} else if (current.left) {
					const closestChild = this.kthBiggestNode(current.left);
					if (
						!closest ||
						this.absDif(closest.value, value) >
							this.absDif(closestChild.value, value)
					)
						closest = closestChild;
					found = closest;
				} else {
					found = closest;
				}
			} else {
				//if the current node has exactly the same elo, chek if there is another player (not me)
				if (this.getValidOponents(player, current.players).length > 0)
					found = current;
				else {
					//if not, chekc the right child and go all de way left (the closest to the right)
					if (current.right) {
						const closestRight = this.kthSmallestNode(
							current.right
						);
						if (
							!closest ||
							this.absDif(closest.value, value) >
								this.absDif(closestRight.value, value)
						)
							closest = closestRight;
					}
					// and chekc the left child and go all de way right (the biggest to the left)
					if (current.left) {
						const closestLeft = this.kthBiggestNode(current.left);
						if (
							!closest ||
							this.absDif(closest.value, value) >
								this.absDif(closestLeft.value, value)
						)
							closest = closestLeft;
					}
					// if there is a closest defined, thats is the closest one
					if (closest) found = closest;
					else current = null;
				}
			}
		}

		if (!found) return undefined;
		return this.getValidOponents(player, found.players);
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

	/// helper function to find the closest node
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

	getValidOponents(player, oponents) {
		if (player.isBot) {
			return oponents.filter(
				(oponent) => !oponent.isBot && player.name != oponent.name
			);
		} else {
			return oponents.filter((oponent) => player.name != oponent.name);
		}
	}
}

module.exports = bstQueue;
