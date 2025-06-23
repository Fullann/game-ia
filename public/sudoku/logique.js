class SudokuGame {
  constructor() {
    this.grid = Array(9)
      .fill()
      .map(() => Array(9).fill(0));
    this.solution = Array(9)
      .fill()
      .map(() => Array(9).fill(0));
    this.givenCells = new Set();
    this.timer = 0;
    this.timerInterval = null;
    this.isRobotSolving = false;

    this.initializeGame();
    this.setupEventListeners();
  }

  initializeGame() {
    this.createGrid();
    this.generateNewGame();
  }

  createGrid() {
    const gridElement = document.getElementById("sudokuGrid");
    gridElement.innerHTML = "";

    for (let i = 0; i < 81; i++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.index = i;
      cell.addEventListener("click", (e) => this.handleCellClick(e));
      cell.addEventListener("keydown", (e) => this.handleKeyDown(e));
      cell.tabIndex = 0;
      gridElement.appendChild(cell);
    }
  }

  setupEventListeners() {
    document
      .getElementById("newGame")
      .addEventListener("click", () => this.generateNewGame());
    document
      .getElementById("solveRobot")
      .addEventListener("click", () => this.solveWithRobot());
    document
      .getElementById("clearGrid")
      .addEventListener("click", () => this.clearUserInputs());
    document
      .getElementById("checkSolution")
      .addEventListener("click", () => this.checkSolution());
  }

  generateNewGame() {
    this.stopTimer();
    this.isRobotSolving = false;
    document.getElementById("robotStatus").textContent = "";
    document.getElementById("robotSteps").textContent = "";

    // Générer une grille complète valide
    this.grid = Array(9)
      .fill()
      .map(() => Array(9).fill(0));
    this.fillGrid();
    this.solution = this.grid.map((row) => [...row]);

    // Retirer des cases selon la difficulté
    const difficulty = document.getElementById("difficulty").value;
    this.removeNumbers(difficulty);

    this.updateDisplay();
    this.startTimer();
    document.getElementById("status").textContent = "En cours...";
  }

  fillGrid() {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    return this.fillGridRecursive(0, 0, numbers);
  }

  fillGridRecursive(row, col, numbers) {
    if (row === 9) return true;
    if (col === 9) return this.fillGridRecursive(row + 1, 0, numbers);

    const shuffledNumbers = [...numbers].sort(() => Math.random() - 0.5);

    for (let num of shuffledNumbers) {
      if (this.isValidMove(row, col, num)) {
        this.grid[row][col] = num;
        if (this.fillGridRecursive(row, col + 1, numbers)) {
          return true;
        }
        this.grid[row][col] = 0;
      }
    }
    return false;
  }

  removeNumbers(difficulty) {
    const difficultySettings = {
      easy: { min: 40, max: 45 },
      medium: { min: 30, max: 35 },
      hard: { min: 25, max: 30 },
      expert: { min: 20, max: 25 },
    };

    const settings = difficultySettings[difficulty];
    const numbersToKeep =
      Math.floor(Math.random() * (settings.max - settings.min + 1)) +
      settings.min;

    const positions = [];
    for (let i = 0; i < 81; i++) {
      positions.push(i);
    }

    // Mélanger les positions
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    // Garder seulement les positions nécessaires
    this.givenCells.clear();
    for (let i = 0; i < numbersToKeep; i++) {
      this.givenCells.add(positions[i]);
    }

    // Effacer les autres cases
    for (let i = 0; i < 81; i++) {
      if (!this.givenCells.has(i)) {
        const row = Math.floor(i / 9);
        const col = i % 9;
        this.grid[row][col] = 0;
      }
    }
  }

  isValidMove(row, col, num) {
    // Vérifier la ligne
    for (let c = 0; c < 9; c++) {
      if (this.grid[row][c] === num) return false;
    }

    // Vérifier la colonne
    for (let r = 0; r < 9; r++) {
      if (this.grid[r][col] === num) return false;
    }

    // Vérifier le bloc 3x3
    const blockRow = Math.floor(row / 3) * 3;
    const blockCol = Math.floor(col / 3) * 3;
    for (let r = blockRow; r < blockRow + 3; r++) {
      for (let c = blockCol; c < blockCol + 3; c++) {
        if (this.grid[r][c] === num) return false;
      }
    }

    return true;
  }

  handleCellClick(e) {
    if (this.isRobotSolving) return;

    const index = parseInt(e.target.dataset.index);
    if (this.givenCells.has(index)) return;

    e.target.focus();
  }

  handleKeyDown(e) {
    if (this.isRobotSolving) return;

    const index = parseInt(e.target.dataset.index);
    if (this.givenCells.has(index)) return;

    const row = Math.floor(index / 9);
    const col = index % 9;

    if (e.key >= "1" && e.key <= "9") {
      const num = parseInt(e.key);
      if (this.isValidMove(row, col, num)) {
        this.grid[row][col] = num;
        e.target.textContent = num;
        e.target.className = "cell user-input";
        this.checkWin();
      } else {
        e.target.className = "cell error";
        setTimeout(() => {
          e.target.className = "cell";
        }, 500);
      }
    } else if (e.key === "Backspace" || e.key === "Delete") {
      this.grid[row][col] = 0;
      e.target.textContent = "";
      e.target.className = "cell";
    }
  }

  async solveWithRobot() {
    if (this.isRobotSolving) return;

    this.isRobotSolving = true;
    document.getElementById("robotStatus").textContent =
      "Robot en cours de résolution...";
    document.getElementById("robotSteps").textContent = "";

    const steps = [];
    const success = await this.solveWithBacktracking(0, 0, steps);

    if (success) {
      document.getElementById("robotStatus").textContent =
        "Robot a résolu la grille !";
      document.getElementById(
        "robotSteps"
      ).textContent = `Résolu en ${steps.length} étapes avec backtracking optimisé.`;
      this.stopTimer();
      document.getElementById("status").textContent = "Résolu par le robot !";
    } else {
      document.getElementById("robotStatus").textContent =
        "Impossible de résoudre cette grille.";
    }

    this.isRobotSolving = false;
  }

  async solveWithBacktracking(row, col, steps, delay = 50) {
    if (row === 9) return true;
    if (col === 9) return this.solveWithBacktracking(row + 1, 0, steps, delay);

    const index = row * 9 + col;
    if (this.givenCells.has(index)) {
      return this.solveWithBacktracking(row, col + 1, steps, delay);
    }

    for (let num = 1; num <= 9; num++) {
      if (this.isValidMove(row, col, num)) {
        this.grid[row][col] = num;
        steps.push({ row, col, num });

        // Animation visuelle
        const cell = document.querySelector(`[data-index="${index}"]`);
        cell.textContent = num;
        cell.className = "cell robot-solving";

        await new Promise((resolve) => setTimeout(resolve, delay));

        if (await this.solveWithBacktracking(row, col + 1, steps, delay)) {
          return true;
        }

        // Backtrack
        this.grid[row][col] = 0;
        cell.textContent = "";
        cell.className = "cell";
      }
    }

    return false;
  }

  clearUserInputs() {
    if (this.isRobotSolving) return;

    for (let i = 0; i < 81; i++) {
      if (!this.givenCells.has(i)) {
        const row = Math.floor(i / 9);
        const col = i % 9;
        this.grid[row][col] = 0;

        const cell = document.querySelector(`[data-index="${i}"]`);
        cell.textContent = "";
        cell.className = "cell";
      }
    }
  }

  checkSolution() {
    let isComplete = true;
    let hasErrors = false;

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const value = this.grid[row][col];
        if (value === 0) {
          isComplete = false;
        } else if (this.solution[row][col] !== value) {
          hasErrors = true;
          const index = row * 9 + col;
          const cell = document.querySelector(`[data-index="${index}"]`);
          cell.className = "cell error";
          setTimeout(() => {
            if (!this.givenCells.has(index)) {
              cell.className = "cell user-input";
            }
          }, 1000);
        }
      }
    }

    if (hasErrors) {
      document.getElementById("status").textContent = "Il y a des erreurs !";
    } else if (isComplete) {
      this.checkWin();
    } else {
      document.getElementById("status").textContent =
        "Grille incomplète mais correcte.";
    }
  }

  checkWin() {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (this.grid[row][col] === 0) return;
      }
    }

    this.stopTimer();
    document.getElementById(
      "status"
    ).textContent = `Félicitations ! Résolu en ${this.formatTime(this.timer)}`;
  }

  updateDisplay() {
    for (let i = 0; i < 81; i++) {
      const row = Math.floor(i / 9);
      const col = i % 9;
      const cell = document.querySelector(`[data-index="${i}"]`);
      const value = this.grid[row][col];

      if (value !== 0) {
        cell.textContent = value;
        if (this.givenCells.has(i)) {
          cell.className = "cell given";
        } else {
          cell.className = "cell user-input";
        }
      } else {
        cell.textContent = "";
        cell.className = "cell";
      }
    }
  }

  startTimer() {
    this.timer = 0;
    this.timerInterval = setInterval(() => {
      this.timer++;
      document.getElementById("timer").textContent = `Temps: ${this.formatTime(
        this.timer
      )}`;
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
}

// Initialiser le jeu
document.addEventListener("DOMContentLoaded", () => {
  new SudokuGame();
});
