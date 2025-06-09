class TicTacToeAI {
  constructor() {
    this.board = Array(9).fill("");
    this.currentPlayer = "X";
    this.gameMode = "humanVsAi";
    this.gameActive = true;
    this.aiThinking = false;
    this.autoPlayInterval = null;
    this.isPaused = false;

    this.stats = {
      playerWins: 0,
      aiWins: 0,
      draws: 0,
      gamesPlayed: 0,
    };

    this.initializeEventListeners();
    this.updateDisplay();
  }

  initializeEventListeners() {
    // Mode de jeu
    document
      .getElementById("humanVsAi")
      .addEventListener("click", () => this.setGameMode("humanVsAi"));
    document
      .getElementById("aiVsAi")
      .addEventListener("click", () => this.setGameMode("aiVsAi"));

    // Plateau de jeu
    document
      .getElementById("board")
      .addEventListener("click", (e) => this.handleCellClick(e));

    // Contrôles
    document
      .getElementById("resetBtn")
      .addEventListener("click", () => this.resetGame());
    document
      .getElementById("pauseBtn")
      .addEventListener("click", () => this.togglePause());
  }

  setGameMode(mode) {
    this.gameMode = mode;
    this.resetGame();

    // Mise à jour des boutons
    document
      .querySelectorAll(".game-modes button")
      .forEach((btn) => btn.classList.remove("active"));
    document.getElementById(mode).classList.add("active");

    // Affichage du bouton pause pour IA vs IA
    document.getElementById("pauseBtn").style.display =
      mode === "aiVsAi" ? "inline-block" : "none";
  }

  handleCellClick(e) {
    if (
      !e.target.classList.contains("cell") ||
      !this.gameActive ||
      this.aiThinking
    )
      return;

    const index = parseInt(e.target.dataset.index);
    if (this.board[index] !== "") return;

    if (this.gameMode === "humanVsAi" && this.currentPlayer === "X") {
      this.makeMove(index, "X");
      if (this.gameActive) {
        setTimeout(() => this.aiMove(), 500);
      }
    }
  }

  makeMove(index, player) {
    this.board[index] = player;
    this.updateCellDisplay(index, player);

    const winner = this.checkWinner();
    if (winner) {
      this.endGame(winner);
    } else if (this.board.every((cell) => cell !== "")) {
      this.endGame("draw");
    } else {
      this.currentPlayer = this.currentPlayer === "X" ? "O" : "X";
      this.updateStatus();
    }
  }

  aiMove() {
    if (!this.gameActive) return;

    this.aiThinking = true;
    this.updateStatus();

    setTimeout(() => {
      const bestMove = this.minimax(this.board, this.currentPlayer, 0).index;
      this.makeMove(bestMove, this.currentPlayer);
      this.aiThinking = false;
      this.updateStatus();
    }, 800);
  }

  minimax(board, player, depth) {
    const winner = this.checkWinnerForBoard(board);

    if (winner === "X") return { score: -10 + depth };
    if (winner === "O") return { score: 10 - depth };
    if (board.every((cell) => cell !== "")) return { score: 0 };

    const moves = [];
    const availableMoves = board
      .map((cell, index) => (cell === "" ? index : null))
      .filter((val) => val !== null);

    for (let move of availableMoves) {
      const newBoard = [...board];
      newBoard[move] = player;

      const result = this.minimax(
        newBoard,
        player === "X" ? "O" : "X",
        depth + 1
      );
      moves.push({ index: move, score: result.score });
    }

    let bestMove;
    if (player === "O") {
      bestMove = moves.reduce((best, move) =>
        move.score > best.score ? move : best
      );
    } else {
      bestMove = moves.reduce((best, move) =>
        move.score < best.score ? move : best
      );
    }

    return bestMove;
  }

  checkWinner() {
    return this.checkWinnerForBoard(this.board);
  }

  checkWinnerForBoard(board) {
    const winPatterns = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // Lignes
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // Colonnes
      [0, 4, 8],
      [2, 4, 6], // Diagonales
    ];

    for (let pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  }

  endGame(result) {
    this.gameActive = false;
    this.stats.gamesPlayed++;

    if (result === "draw") {
      this.stats.draws++;
      document.getElementById("status").textContent = "🤝 Égalité !";
    } else if (result === "X") {
      if (this.gameMode === "humanVsAi") {
        this.stats.playerWins++;
        document.getElementById("status").textContent = "🎉 Vous avez gagné !";
      } else {
        document.getElementById("status").textContent = "🤖 IA X a gagné !";
      }
    } else {
      this.stats.aiWins++;
      if (this.gameMode === "humanVsAi") {
        document.getElementById("status").textContent = "🤖 L'IA a gagné !";
      } else {
        document.getElementById("status").textContent = "🤖 IA O a gagné !";
      }
    }

    this.updateStats();
    this.highlightWinner(result);

    if (this.gameMode === "aiVsAi" && !this.isPaused) {
      setTimeout(() => this.resetGame(), 2000);
    }
  }

  highlightWinner(winner) {
    if (winner === "draw") return;

    const winPatterns = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (let pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (
        this.board[a] === winner &&
        this.board[b] === winner &&
        this.board[c] === winner
      ) {
        [a, b, c].forEach((index) => {
          document
            .querySelector(`[data-index="${index}"]`)
            .classList.add("winner-highlight");
        });
        break;
      }
    }
  }

  resetGame() {
    this.board = Array(9).fill("");
    this.currentPlayer = "X";
    this.gameActive = true;
    this.aiThinking = false;

    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }

    this.updateDisplay();

    if (this.gameMode === "aiVsAi" && !this.isPaused) {
      setTimeout(() => this.startAiVsAi(), 1000);
    }
  }

  startAiVsAi() {
    if (!this.gameActive || this.isPaused) return;

    this.autoPlayInterval = setInterval(() => {
      if (this.gameActive && !this.isPaused) {
        this.aiMove();
      } else {
        clearInterval(this.autoPlayInterval);
        this.autoPlayInterval = null;
      }
    }, 1500);
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    const btn = document.getElementById("pauseBtn");

    if (this.isPaused) {
      btn.textContent = "▶️ Reprendre";
      if (this.autoPlayInterval) {
        clearInterval(this.autoPlayInterval);
        this.autoPlayInterval = null;
      }
    } else {
      btn.textContent = "⏸️ Pause";
      if (this.gameMode === "aiVsAi" && this.gameActive) {
        this.startAiVsAi();
      }
    }
  }

  updateDisplay() {
    // Mise à jour du plateau
    document.querySelectorAll(".cell").forEach((cell, index) => {
      cell.textContent = this.board[index];
      cell.className = "cell";
      if (this.board[index]) {
        cell.classList.add(this.board[index].toLowerCase());
      }
    });

    this.updateStatus();
  }

  updateCellDisplay(index, player) {
    const cell = document.querySelector(`[data-index="${index}"]`);
    cell.textContent = player;
    cell.classList.add(player.toLowerCase());
  }

  updateStatus() {
    const statusEl = document.getElementById("status");

    if (!this.gameActive) return;

    if (this.aiThinking) {
      statusEl.innerHTML =
        '<span class="ai-thinking">🤖 L\'IA réfléchit...</span>';
    } else if (this.gameMode === "humanVsAi") {
      statusEl.textContent =
        this.currentPlayer === "X"
          ? "👤 À vous de jouer ! (X)"
          : "🤖 Tour de l'IA (O)";
    } else {
      statusEl.textContent = `🤖 Tour de l'IA ${this.currentPlayer}`;
    }
  }

  updateStats() {
    document.getElementById("playerWins").textContent = this.stats.playerWins;
    document.getElementById("aiWins").textContent = this.stats.aiWins;
    document.getElementById("draws").textContent = this.stats.draws;
    document.getElementById("gamesPlayed").textContent = this.stats.gamesPlayed;
  }
}

// Initialisation du jeu
const game = new TicTacToeAI();
