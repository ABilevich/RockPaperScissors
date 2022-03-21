# RockPaperScissors

A simple multiplayer Rock Paper Scissors game

It consists of a server that hosts a multiplayer Rock-Paper-Scissors game with elo based matchmaking.

Fist of all, copy the ".env.example" file and rename it to ".env"

To run the server:

```
>  npm install
>  npm run dev
```

After running the server, open a browser tab with the following link:

-   http://localhost:3000/

Here you will be able to match against other opened browser tabs and play.

Before starting the game, you need to choose a unique name made up of only letters.

The server also exposes an endpoint to fetch the current leaderboards:

-   http://localhost:3000/leaderboard

You can also add bots by moving to the folder named "bots" and running:

```
node .\spawnBot.js
```

This bot will start with an elo of 0 and play as any player would but with random moves

After every match end, it will restart matchmaking

Note: many files contain console.logs for debugging reasons.

Author: Andres Bilevich

Contact: andresbilevich@gmail.com
