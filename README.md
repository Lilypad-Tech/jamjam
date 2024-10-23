# JamJam - The Official Game

JamJam is a multiplayer web-based game, inspired by Rock-Paper-Scissors, where players compete using "GM" (Good Morning), "GN" (Good Night), and "GD" (Good Day) in a fun, turn-based environment. This project uses Node.js and Socket.IO to handle real-time multiplayer functionality, with a SQLite database for tracking player scores and leaderboard entries.

## Features
- Turn-based multiplayer gameplay
- SQLite-based leaderboard
- Real-time updates using Socket.IO
- Simple, Lilypad-themed UI

## Prerequisites

To run this project locally or on a server, you'll need the following installed:

- **Node.js** (version 12.x or higher)
- **npm** (comes with Node.js)
- **SQLite3**

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/jamjam.git
cd jamjam
```

### 2. Install Dependencies
Run the following command to install all the necessary dependencies:

```
npm install
```

### 3. Create or Use an Existing SQLite Database
The game uses a SQLite database (`leaderboard.db`) to store player scores. If the file doesn't exist, it will be created automatically in the project directory. Ensure the directory has the correct write permissions if running on a server.

### 4. Running the Game Locally
You can start the game server locally by running:

```bash
node server.js
```

This will start the game on port `3000` by default. Open a browser and go to `http://localhost:3000` to play the game.
