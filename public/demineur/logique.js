class MinesweeperGame {
  constructor() {
    this.width = 9;
    this.height = 9;
    this.mineCount = 10;
    this.grid = [];
    this.gameState = "ready"; // ready, playing, won, lost
    this.firstClick = true;
    this.timer = 0;
    this.timerInterval = null;
    this.flagCount = 0;
    this.revealedCount = 0;
    this.isRobotSolving = false;
    this.robotPaused = false;
    this.robotSteps = [];

    this.initializeGame();
    this.setupEventListeners();
  }

  initializeGame() {
    this.createGrid();
    this.generateNewGame();
  }

  setupEventListeners() {
    document
      .getElementById("newGame")
      .addEventListener("click", () => this.generateNewGame());
    document
      .getElementById("solveRobot")
      .addEventListener("click", () => this.solveWithRobot());
    document
      .getElementById("pauseRobot")
      .addEventListener("click", () => this.toggleRobotPause());
    document
      .getElementById("hintButton")
      .addEventListener("click", () => this.showHint());
    document
      .getElementById("gameStatus")
      .addEventListener("click", () => this.generateNewGame());

    document.getElementById("difficulty").addEventListener("change", (e) => {
      const customSettings = document.getElementById("customSettings");
      if (e.target.value === "custom") {
        customSettings.style.display = "flex";
      } else {
        customSettings.style.display = "none";
        this.setDifficulty(e.target.value);
      }
    });

    // Événements pour les paramètres personnalisés
    ["customWidth", "customHeight", "customMines"].forEach((id) => {
      document
        .getElementById(id)
        .addEventListener("change", () => this.setCustomDifficulty());
    });
  }

  setDifficulty(level) {
    const difficulties = {
      beginner: { width: 9, height: 9, mines: 10 },
      intermediate: { width: 16, height: 16, mines: 40 },
      expert: { width: 30, height: 16, mines: 99 },
    };

    const config = difficulties[level];
    this.width = config.width;
    this.height = config.height;
    this.mineCount = config.mines;
    this.generateNewGame();
  }

  setCustomDifficulty() {
    const width = parseInt(document.getElementById("customWidth").value) || 16;
    const height =
      parseInt(document.getElementById("customHeight").value) || 16;
    const mines = parseInt(document.getElementById("customMines").value) || 40;

    this.width = Math.max(5, Math.min(30, width));
    this.height = Math.max(5, Math.min(24, height));
    this.mineCount = Math.max(1, Math.min(width * height - 1, mines));

    this.generateNewGame();
  }

  createGrid() {
    const gridElement = document.getElementById("minesweeperGrid");
    gridElement.style.gridTemplateColumns = `repeat(${this.width}, 1fr)`;
    gridElement.innerHTML = "";

    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.row = row;
        cell.dataset.col = col;

        cell.addEventListener("click", (e) => this.handleLeftClick(e));
        cell.addEventListener("contextmenu", (e) => this.handleRightClick(e));
        cell.addEventListener("mousedown", (e) => this.handleMiddleClick(e));

        gridElement.appendChild(cell);
      }
    }
  }

  generateNewGame() {
    this.stopRobot();
    this.gameState = "ready";
    this.firstClick = true;
    this.timer = 0;
    this.flagCount = 0;
    this.revealedCount = 0;
    this.robotSteps = [];

    this.stopTimer();
    this.updateTimer();
    this.updateMineCount();
    this.updateGameStatus("😊");

    // Initialiser la grille
    this.grid = Array(this.height)
      .fill()
      .map(() =>
        Array(this.width)
          .fill()
          .map(() => ({
            isMine: false,
            isRevealed: false,
            isFlagged: false,
            isQuestioned: false,
            neighborMines: 0,
          }))
      );

    this.createGrid();
    this.clearRobotInfo();

    document.getElementById("solveRobot").disabled = false;
    document.getElementById("hintButton").disabled = false;
  }

  placeMines(excludeRow, excludeCol) {
    const positions = [];
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        if (row !== excludeRow || col !== excludeCol) {
          positions.push({ row, col });
        }
      }
    }

    // Mélanger les positions
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    // Placer les mines
    for (let i = 0; i < this.mineCount; i++) {
      const { row, col } = positions[i];
      this.grid[row][col].isMine = true;
    }

    // Calculer les nombres
    this.calculateNumbers();
  }

  calculateNumbers() {
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        if (!this.grid[row][col].isMine) {
          this.grid[row][col].neighborMines = this.countNeighborMines(row, col);
        }
      }
    }
  }

  countNeighborMines(row, col) {
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const newRow = row + dr;
        const newCol = col + dc;
        if (
          this.isValidCell(newRow, newCol) &&
          this.grid[newRow][newCol].isMine
        ) {
          count++;
        }
      }
    }
    return count;
  }

  isValidCell(row, col) {
    return row >= 0 && row < this.height && col >= 0 && col < this.width;
  }

  handleLeftClick(e) {
    if (
      this.isRobotSolving ||
      this.gameState === "won" ||
      this.gameState === "lost"
    )
      return;

    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);

    if (this.grid[row][col].isFlagged || this.grid[row][col].isRevealed) return;

    if (this.firstClick) {
      this.placeMines(row, col);
      this.firstClick = false;
      this.gameState = "playing";
      this.startTimer();
    }

    this.revealCell(row, col);
  }

  handleRightClick(e) {
    e.preventDefault();
    if (
      this.isRobotSolving ||
      this.gameState === "won" ||
      this.gameState === "lost"
    )
      return;

    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);

    if (this.grid[row][col].isRevealed) return;

    const cell = this.grid[row][col];
    const cellElement = e.target;

    if (!cell.isFlagged && !cell.isQuestioned) {
      cell.isFlagged = true;
      cellElement.className = "cell flagged";
      cellElement.textContent = "🚩";
      this.flagCount++;
    } else if (cell.isFlagged) {
      cell.isFlagged = false;
      cell.isQuestioned = true;
      cellElement.className = "cell questioned";
      cellElement.textContent = "?";
      this.flagCount--;
    } else {
      cell.isQuestioned = false;
      cellElement.className = "cell";
      cellElement.textContent = "";
    }

    this.updateMineCount();
  }

  handleMiddleClick(e) {
    if (e.button !== 1) return; // Bouton du milieu
    e.preventDefault();

    if (
      this.isRobotSolving ||
      this.gameState === "won" ||
      this.gameState === "lost"
    )
      return;

    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);

    if (!this.grid[row][col].isRevealed) return;

    this.chordReveal(row, col);
  }

  chordReveal(row, col) {
    const cell = this.grid[row][col];
    if (cell.neighborMines === 0) return;

    let flagCount = 0;
    const neighbors = [];

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const newRow = row + dr;
        const newCol = col + dc;
        if (this.isValidCell(newRow, newCol)) {
          const neighbor = this.grid[newRow][newCol];
          if (neighbor.isFlagged) {
            flagCount++;
          } else if (!neighbor.isRevealed) {
            neighbors.push({ row: newRow, col: newCol });
          }
        }
      }
    }

    if (flagCount === cell.neighborMines) {
      neighbors.forEach(({ row, col }) => {
        this.revealCell(row, col);
      });
    }
  }

  revealCell(row, col) {
    const cell = this.grid[row][col];
    if (cell.isRevealed || cell.isFlagged) return;

    cell.isRevealed = true;
    this.revealedCount++;

    const cellElement = document.querySelector(
      `[data-row="${row}"][data-col="${col}"]`
    );
    cellElement.className = "cell revealed";

    if (cell.isMine) {
      cellElement.className = "cell mine";
      cellElement.textContent = "💣";
      this.gameOver();
    } else {
      if (cell.neighborMines > 0) {
        cellElement.textContent = cell.neighborMines;
        cellElement.classList.add(`num-${cell.neighborMines}`);
      } else {
        // Révéler automatiquement les cellules adjacentes
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const newRow = row + dr;
            const newCol = col + dc;
            if (this.isValidCell(newRow, newCol)) {
              this.revealCell(newRow, newCol);
            }
          }
        }
      }

      this.checkWin();
    }
  }

  gameOver() {
    this.gameState = "lost";
    this.stopTimer();
    this.updateGameStatus("😵");

    // Révéler toutes les mines
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        const cell = this.grid[row][col];
        if (cell.isMine && !cell.isFlagged) {
          const cellElement = document.querySelector(
            `[data-row="${row}"][data-col="${col}"]`
          );
          cellElement.className = "cell mine";
          cellElement.textContent = "💣";
        }
      }
    }

    document.getElementById("solveRobot").disabled = true;
    document.getElementById("hintButton").disabled = true;
  }

  checkWin() {
    const totalCells = this.width * this.height;
    if (this.revealedCount === totalCells - this.mineCount) {
      this.gameState = "won";
      this.stopTimer();
      this.updateGameStatus("😎");

      // Placer automatiquement les drapeaux sur les mines restantes
      for (let row = 0; row < this.height; row++) {
        for (let col = 0; col < this.width; col++) {
          const cell = this.grid[row][col];
          if (cell.isMine && !cell.isFlagged) {
            const cellElement = document.querySelector(
              `[data-row="${row}"][data-col="${col}"]`
            );
            cellElement.className = "cell flagged";
            cellElement.textContent = "🚩";
          }
        }
      }

      document.getElementById("solveRobot").disabled = true;
      document.getElementById("hintButton").disabled = true;
    }
  }

  async solveWithRobot() {
    if (this.isRobotSolving) return;

    this.isRobotSolving = true;
    this.robotPaused = false;
    document.getElementById("solveRobot").disabled = true;
    document.getElementById("pauseRobot").disabled = false;
    document.getElementById("robotStatus").textContent =
      "Robot en cours de résolution...";

    let moveCount = 0;
    let safeMovesFound = 0;
    let probabilityCalculations = 0;

    while (this.gameState === "playing" && this.isRobotSolving) {
      if (this.robotPaused) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        continue;
      }

      const move = this.findBestMove();
      probabilityCalculations++;

      if (!move) {
        document.getElementById("robotStatus").textContent =
          "Robot bloqué - Aucun mouvement sûr trouvé";
        break;
      }

      moveCount++;
      if (move.type === "safe") {
        safeMovesFound++;
      }

      // Animation visuelle
      const cellElement = document.querySelector(
        `[data-row="${move.row}"][data-col="${move.col}"]`
      );
      cellElement.classList.add("robot-analyzing");

      await new Promise((resolve) => setTimeout(resolve, 300));

      if (move.type === "reveal") {
        cellElement.classList.remove("robot-analyzing");
        cellElement.classList.add("robot-safe");
        await new Promise((resolve) => setTimeout(resolve, 200));
        cellElement.classList.remove("robot-safe");
        this.revealCell(move.row, move.col);
      } else if (move.type === "flag") {
        cellElement.classList.remove("robot-analyzing");
        cellElement.classList.add("robot-mine");
        await new Promise((resolve) => setTimeout(resolve, 200));
        cellElement.classList.remove("robot-mine");
        this.flagCell(move.row, move.col);
      }

      // Mettre à jour les statistiques
      document.getElementById("probCount").textContent =
        probabilityCalculations;
      document.getElementById("safeMovesCount").textContent = safeMovesFound;
      document.getElementById(
        "robotSteps"
      ).textContent = `Mouvement ${moveCount}: ${
        move.type === "reveal" ? "Révélé" : "Marqué"
      } (${move.row}, ${move.col}) - Probabilité: ${(
        move.probability * 100
      ).toFixed(1)}%`;

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.stopRobot();

    if (this.gameState === "won") {
      document.getElementById(
        "robotStatus"
      ).textContent = `Robot a gagné en ${moveCount} mouvements !`;
    } else if (this.gameState === "lost") {
      document.getElementById(
        "robotStatus"
      ).textContent = `Robot a perdu après ${moveCount} mouvements.`;
    }
  }

  findBestMove() {
    // Stratégie du robot : analyse des probabilités
    const moves = [];

    // 1. Chercher les mouvements évidents (sûrs à 100%)
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        const cell = this.grid[row][col];
        if (!cell.isRevealed || cell.neighborMines === 0) continue;

        const neighbors = this.getNeighbors(row, col);
        const unrevealedNeighbors = neighbors.filter(
          (n) => !this.grid[n.row][n.col].isRevealed
        );
        const flaggedNeighbors = neighbors.filter(
          (n) => this.grid[n.row][n.col].isFlagged
        );

        if (flaggedNeighbors.length === cell.neighborMines) {
          // Toutes les mines sont marquées, révéler le reste
          unrevealedNeighbors.forEach((n) => {
            if (!this.grid[n.row][n.col].isFlagged) {
              moves.push({
                row: n.row,
                col: n.col,
                type: "reveal",
                probability: 0,
              });
            }
          });
        } else if (
          unrevealedNeighbors.length ===
          cell.neighborMines - flaggedNeighbors.length
        ) {
          // Toutes les cellules non révélées sont des mines
          unrevealedNeighbors.forEach((n) => {
            if (!this.grid[n.row][n.col].isFlagged) {
              moves.push({
                row: n.row,
                col: n.col,
                type: "flag",
                probability: 1,
              });
            }
          });
        }
      }
    }

    if (moves.length > 0) {
      return moves[0];
    }

    // 2. Si aucun mouvement évident, calculer les probabilités
    const probabilities = this.calculateProbabilities();
    let bestMove = null;
    let bestProbability = 1;

    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        const cell = this.grid[row][col];
        if (cell.isRevealed || cell.isFlagged) continue;

        const probability = probabilities[row][col];
        if (probability < bestProbability) {
          bestProbability = probability;
          bestMove = { row, col, type: "reveal", probability };
        }
      }
    }

    return bestMove;
  }

  calculateProbabilities() {
    // Calcul simplifié des probabilités basé sur les contraintes locales
    const probabilities = Array(this.height)
      .fill()
      .map(() => Array(this.width).fill(0.5));

    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        const cell = this.grid[row][col];
        if (!cell.isRevealed || cell.neighborMines === 0) continue;

        const neighbors = this.getNeighbors(row, col);
        const unrevealedNeighbors = neighbors.filter(
          (n) =>
            !this.grid[n.row][n.col].isRevealed &&
            !this.grid[n.row][n.col].isFlagged
        );
        const flaggedNeighbors = neighbors.filter(
          (n) => this.grid[n.row][n.col].isFlagged
        );

        if (unrevealedNeighbors.length > 0) {
          const remainingMines = cell.neighborMines - flaggedNeighbors.length;
          const probability = remainingMines / unrevealedNeighbors.length;

          unrevealedNeighbors.forEach((n) => {
            probabilities[n.row][n.col] = Math.max(
              probabilities[n.row][n.col],
              probability
            );
          });
        }
      }
    }

    return probabilities;
  }

  getNeighbors(row, col) {
    const neighbors = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const newRow = row + dr;
        const newCol = col + dc;
        if (this.isValidCell(newRow, newCol)) {
          neighbors.push({ row: newRow, col: newCol });
        }
      }
    }
    return neighbors;
  }

  flagCell(row, col) {
    const cell = this.grid[row][col];
    if (cell.isRevealed || cell.isFlagged) return;

    cell.isFlagged = true;
    this.flagCount++;

    const cellElement = document.querySelector(
      `[data-row="${row}"][data-col="${col}"]`
    );
    cellElement.className = "cell flagged";
    cellElement.textContent = "🚩";

    this.updateMineCount();
  }

  showHint() {
    if (this.gameState !== "playing") return;

    const move = this.findBestMove();
    if (move) {
      const cellElement = document.querySelector(
        `[data-row="${move.row}"][data-col="${move.col}"]`
      );
      cellElement.classList.add("hint");
      setTimeout(() => {
        cellElement.classList.remove("hint");
      }, 3000);

      document.getElementById("robotStatus").textContent = `Indice: ${
        move.type === "reveal" ? "Cliquez sur" : "Marquez"
      } la case (${move.row}, ${move.col}) - Probabilité de mine: ${(
        move.probability * 100
      ).toFixed(1)}%`;
    }
  }

  toggleRobotPause() {
    if (!this.isRobotSolving) return;

    this.robotPaused = !this.robotPaused;
    document.getElementById("pauseRobot").textContent = this.robotPaused
      ? "Reprendre Robot"
      : "Pause Robot";
    document.getElementById("robotStatus").textContent = this.robotPaused
      ? "Robot en pause..."
      : "Robot en cours de résolution...";
  }

  stopRobot() {
    this.isRobotSolving = false;
    this.robotPaused = false;
    document.getElementById("solveRobot").disabled = false;
    document.getElementById("pauseRobot").disabled = true;
    document.getElementById("pauseRobot").textContent = "Pause Robot";
  }

  clearRobotInfo() {
    document.getElementById("robotStatus").textContent = "";
    document.getElementById("robotSteps").textContent = "";
    document.getElementById("probCount").textContent = "0";
    document.getElementById("safeMovesCount").textContent = "0";
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.timer++;
      this.updateTimer();
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateTimer() {
    document.getElementById("timer").textContent = this.timer
      .toString()
      .padStart(3, "0");
  }

  updateMineCount() {
    document.getElementById("mineCount").textContent = Math.max(
      0,
      this.mineCount - this.flagCount
    );
  }

  updateGameStatus(emoji) {
    document.getElementById("gameStatus").textContent = emoji;
  }
}

// Initialiser le jeu
document.addEventListener("DOMContentLoaded", () => {
  new MinesweeperGame();
});
