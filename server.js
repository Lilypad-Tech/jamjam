const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// SQLite database setup for leaderboard
const db = new sqlite3.Database('./leaderboard.db');

// Initialize the leaderboard table if not exists
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS leaderboard (player_name TEXT UNIQUE, wins INTEGER DEFAULT 0)", (err) => {
        if (err) {
            console.error("Error creating leaderboard table:", err.message);
        } else {
            console.log("Leaderboard table created successfully or already exists");
        }
    });
});

// Serve static files from the "public" directory
app.use(express.static('public'));

let players = {};
let playerChoices = {};
let gameInProgress = false;
let countdownActive = false;

// Lilypad/Pond-themed player names
const names1 = ['lily', 'frog', 'reed', 'pond', 'drift', 'lilypadian', 'lotus'];
const names2 = ['pad', 'hopper', 'leaf', 'bloom', 'water', 'ripple', 'current'];

function generatePlayerName() {
    const part1 = names1[Math.floor(Math.random() * names1.length)];
    const part2 = names2[Math.floor(Math.random() * names2.length)];
    return `${part1}-${part2}`;
}

//handle new player connecting
io.on('connection', (socket) => {
    const playerName = generatePlayerName();
    players[socket.id] = { name: playerName, wins: 0 };

    // Emit updated players list
    io.emit('players', players);

    // Send the leaderboard data when a new player connects
    updateLeaderboard(); // This sends the current leaderboard to all clients

    // Check if there are 2 or more players to start the game
    if (Object.keys(players).length >= 2 && !gameInProgress) {
        startGame();
    }

    socket.on('makeChoice', (choice) => {
        playerChoices[socket.id] = choice;

        // Notify all players of selection
        io.emit('playerSelection', { playerId: socket.id, choice });

        // Start countdown if all players have made a choice
        if (Object.keys(playerChoices).length === Object.keys(players).length) {
            startCountdown(io);
        }
    });

    socket.on('startNewGame', () => {
        resetGame();
        if (Object.keys(players).length >= 2) {
            startGame();
            io.emit('newGameStarted'); // Notify all players that a new game has started
        } else {
            io.emit('waitingForPlayers');
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('players', players);
        if (Object.keys(players).length < 2) {
            resetGame();
        }
    });
});

// Function to start the game
function startGame() {
    gameInProgress = true;
    playerChoices = {}; // Reset player choices at the start of each game
    io.emit('gameStarted');
}

// Start countdown and broadcast to all clients
function startCountdown(io) {
    if (countdownActive) return;
    countdownActive = true;

    let countdown = 3;
    const interval = setInterval(() => {
        io.emit('countdown', countdown);

        if (countdown === 0) {
            clearInterval(interval);
            countdownActive = false;
            resolveRound(); // Resolve the game round when the countdown ends
        }

        countdown--;
    }, 1000);
}

// Game logic: Determine winners and losers
function resolveRound() {
    const results = { GM: [], GN: [], GD: [] };

    // Group players by their choices
    for (const [id, choice] of Object.entries(playerChoices)) {
        results[choice].push(id);
    }

    // Determine the winner based on GM > GN > GD > GM
    let survivingPlayers = [];
    if (results.GM.length && results.GN.length) {
        survivingPlayers.push(...results.GM);
    } else if (results.GN.length && results.GD.length) {
        survivingPlayers.push(...results.GN);
    } else if (results.GD.length && results.GM.length) {
        survivingPlayers.push(...results.GD);
    } else {
        survivingPlayers.push(...Object.keys(playerChoices)); // No winner, everyone survives
    }

    let winner = survivingPlayers.length === 1 ? survivingPlayers[0] : null;

    // Update the winner's score and leaderboard
    if (winner) {
        players[winner].wins += 1;
        recordWin(players[winner].name);
    }

    // Emit updated players and show the winner
    io.emit('players', players);
    io.emit('gameOver', { winnerId: winner, winnerName: winner ? players[winner].name : 'No one' });

    // Prepare for the next round
    gameInProgress = false;
}

// Reset the game state
function resetGame() {
    playerChoices = {};
    countdownActive = false;
    gameInProgress = false;
    io.emit('resetGame');
    updateLeaderboard(); // Refresh leaderboard on reset
}

// Update leaderboard from the database
function updateLeaderboard() {
    db.all("SELECT player_name, wins FROM leaderboard ORDER BY wins DESC LIMIT 5", (err, rows) => {
        if (!err) {
            io.emit('leaderboard', rows);
        }
    });
}

// Record player win in the database
function recordWin(playerName) {
    db.run("INSERT INTO leaderboard (player_name, wins) VALUES (?, 1) ON CONFLICT(player_name) DO UPDATE SET wins = wins + 1", [playerName], (err) => {
        if (err) {
            console.error("Error updating the leaderboard:", err.message); // Log error if any
        } else {
            console.log("Leaderboard updated successfully");
            updateLeaderboard(); // Ensure leaderboard updates correctly after a win
        }
    });
}

// Start the server
server.listen(3000, () => {
    console.log('Server is listening on port 3000');
});
