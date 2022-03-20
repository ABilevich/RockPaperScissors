# RockPaperScissors

A simple multiplayer Rock Paper Scissors game

This app was made for a challenge presented by Rather Labs

It consists of a server that hosts a multiplayer Rock-Paper-Scissors game with elo based matchmaking.

To run the server:

```
>  npm install
>  npm run dev
```

after running the server, open a browser tab with the folowing link:

-   http://localhost:3000/

Here you will be able to match against other opened browser tabs and play.

Before starting the game, you need to chose a unique name made up of only leters.

The server also exposes an endpoint to fetch the current leaderboards:

-   http://localhost:3000/leaderboard

Author: Andres Bilevich
Contact: andresbilevich@gmail.com
