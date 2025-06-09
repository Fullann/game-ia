class PegSolitaire {
  constructor() {
    this.board = this.initializeBoard();
    this.selectedPeg = null;
    this.moveHistory = [];
    this.possibleMoves = [];
    this.aiSolving = false;
    this.aiTimeoutId = null;
    this.moveCount = 0;
    this.initializeGame();
  }

  initializeBoard() {
    // Plateau traditionnel du solitaire anglais (33 cases valides)
    const board = Array(7)
      .fill(null)
      .map(() => Array(7).fill(0));

    // 0 = case invalide, 1 = pion, 2 = case vide
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 7; col++) {
        if ((row < 2 || row > 4) && (col < 2 || col > 4)) {
          board[row][col] = 0; // Cases invalides
        } else {
          board[row][col] = 1; // Pions
        }
      }
    }

    // Case centrale vide
    board[3][3] = 2;

    return board;
  }

  initializeGame() {
    this.renderBoard();
    this.updateStatus();
    this.updateCounters();
  }

  renderBoard() {
    const boardElement = document.getElementById("board");
    boardElement.innerHTML = "";

    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 7; col++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.row = row;
        cell.dataset.col = col;

        if (this.board[row][col] === 0) {
          cell.classList.add("invalid");
        } else if (this.board[row][col] === 1) {
          cell.classList.add("peg", "valid");
        } else {
          cell.classList.add("empty", "valid");
        }

        if (
          this.selectedPeg &&
          this.selectedPeg.row === row &&
          this.selectedPeg.col === col
        ) {
          cell.classList.add("selected");
        }

        if (
          this.possibleMoves.some(
            (move) => move.to.row === row && move.to.col === col
          )
        ) {
          cell.classList.add("possible-move");
        }

        cell.addEventListener("click", () => this.handleCellClick(row, col));
        boardElement.appendChild(cell);
      }
    }
  }

  handleCellClick(row, col) {
    if (this.aiSolving) return;

    if (this.board[row][col] === 1) {
      // Sélection d'un pion
      this.selectPeg(row, col);
    } else if (this.board[row][col] === 2 && this.selectedPeg) {
      // Tentative de mouvement
      this.tryMove(row, col);
    }
  }

  selectPeg(row, col) {
    this.selectedPeg = { row, col };
    this.possibleMoves = this.getPossibleMoves(row, col);
    this.renderBoard();

    if (this.possibleMoves.length === 0) {
      this.updateStatus(
        "Ce pion ne peut pas bouger. Choisissez un autre pion."
      );
    } else {
      this.updateStatus(
        `Pion sélectionné. ${this.possibleMoves.length} mouvement(s) possible(s).`
      );
    }
  }

  getPossibleMoves(row, col) {
    const moves = [];
    const directions = [
      [-2, 0],
      [2, 0],
      [0, -2],
      [0, 2],
    ]; // haut, bas, gauche, droite

    for (const [dRow, dCol] of directions) {
      const newRow = row + dRow;
      const newCol = col + dCol;
      const middleRow = row + dRow / 2;
      const middleCol = col + dCol / 2;

      if (
        this.isValidPosition(newRow, newCol) &&
        this.board[newRow][newCol] === 2 &&
        this.board[middleRow][middleCol] === 1
      ) {
        moves.push({
          from: { row, col },
          to: { row: newRow, col: newCol },
          middle: { row: middleRow, col: middleCol },
        });
      }
    }

    return moves;
  }

  tryMove(row, col) {
    const move = this.possibleMoves.find(
      (m) => m.to.row === row && m.to.col === col
    );
    if (move) {
      this.makeMove(move);
    }
  }

  makeMove(move) {
    // Sauvegarder l'état pour l'historique
    this.moveHistory.push({
      board: this.board.map((row) => [...row]),
      moveCount: this.moveCount,
    });

    // Effectuer le mouvement
    this.board[move.from.row][move.from.col] = 2;
    this.board[move.middle.row][move.middle.col] = 2;
    this.board[move.to.row][move.to.col] = 1;

    this.selectedPeg = null;
    this.possibleMoves = [];
    this.moveCount++;

    this.renderBoard();
    this.updateCounters();
    this.checkGameState();

    document.getElementById("undo-btn").disabled = false;
  }

  undoMove() {
    if (this.moveHistory.length === 0 || this.aiSolving) return;

    const lastState = this.moveHistory.pop();
    this.board = lastState.board;
    this.moveCount = lastState.moveCount;
    this.selectedPeg = null;
    this.possibleMoves = [];

    this.renderBoard();
    this.updateCounters();
    this.updateStatus("Mouvement annulé");

    if (this.moveHistory.length === 0) {
      document.getElementById("undo-btn").disabled = true;
    }
  }

  isValidPosition(row, col) {
    return (
      row >= 0 && row < 7 && col >= 0 && col < 7 && this.board[row][col] !== 0
    );
  }

  getAllPossibleMoves() {
    const allMoves = [];
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 7; col++) {
        if (this.board[row][col] === 1) {
          allMoves.push(...this.getPossibleMoves(row, col));
        }
      }
    }
    return allMoves;
  }

  checkGameState() {
    const pegCount = this.getPegCount();
    const possibleMoves = this.getAllPossibleMoves();

    if (pegCount === 1) {
      this.updateStatus("🎉 Félicitations ! Vous avez gagné !");
      document.getElementById("status").classList.add("game-won");
    } else if (possibleMoves.length === 0) {
      this.updateStatus(`😔 Partie terminée ! Il reste ${pegCount} pions.`);
      document.getElementById("status").classList.add("game-over");
    } else {
      this.updateStatus(`${possibleMoves.length} mouvement(s) possible(s)`);
    }
  }

  getPegCount() {
    let count = 0;
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 7; col++) {
        if (this.board[row][col] === 1) count++;
      }
    }
    return count;
  }

  updateStatus(message = "Cliquez sur un pion pour commencer") {
    const statusElement = document.getElementById("status");
    statusElement.textContent = message;
    statusElement.className = "status";
  }

  updateCounters() {
    document.getElementById("peg-count").textContent = this.getPegCount();
    document.getElementById("move-count").textContent = this.moveCount;
  }

  // IA utilisant un algorithme de recherche en profondeur avec heuristiques
  async solveWithAI() {
    if (this.aiSolving) return;

    this.aiSolving = true;
    document.getElementById("ai-btn").disabled = true;
    document.getElementById("stop-ai-btn").disabled = false;
    document.getElementById("status").classList.add("ai-solving");
    this.updateStatus("🤖 IA en cours de résolution...");

    const solution = this.findSolution();

    if (solution && this.aiSolving) {
      await this.executeSolution(solution);
    } else if (this.aiSolving) {
      this.updateStatus("❌ Aucune solution trouvée par l'IA");
    }

    this.stopAI();
  }

  findSolution() {
    const maxDepth = 40;
    const visited = new Set();

    const solve = (board, depth) => {
      if (depth > maxDepth) return null;

      const pegCount = this.countPegs(board);
      if (pegCount === 1) return [];

      const boardKey = this.boardToString(board);
      if (visited.has(boardKey)) return null;
      visited.add(boardKey);

      const moves = this.getAllMovesForBoard(board);

      // Trier les mouvements par heuristique (privilégier les mouvements vers le centre)
      moves.sort((a, b) => this.evaluateMove(b) - this.evaluateMove(a));

      for (const move of moves) {
        const newBoard = this.applyMoveToBoard(board, move);
        const solution = solve(newBoard, depth + 1);

        if (solution !== null) {
          return [move, ...solution];
        }
      }

      return null;
    };

    return solve(this.board, 0);
  }

  evaluateMove(move) {
    // Heuristique: privilégier les mouvements qui rapprochent vers le centre
    const centerRow = 3,
      centerCol = 3;
    const distanceToCenter =
      Math.abs(move.to.row - centerRow) + Math.abs(move.to.col - centerCol);
    return 10 - distanceToCenter;
  }

  countPegs(board) {
    let count = 0;
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 7; col++) {
        if (board[row][col] === 1) count++;
      }
    }
    return count;
  }

  boardToString(board) {
    return board.map((row) => row.join("")).join("");
  }

  getAllMovesForBoard(board) {
    const moves = [];
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 7; col++) {
        if (board[row][col] === 1) {
          moves.push(...this.getPossibleMovesForBoard(board, row, col));
        }
      }
    }
    return moves;
  }

  getPossibleMovesForBoard(board, row, col) {
    const moves = [];
    const directions = [
      [-2, 0],
      [2, 0],
      [0, -2],
      [0, 2],
    ];

    for (const [dRow, dCol] of directions) {
      const newRow = row + dRow;
      const newCol = col + dCol;
      const middleRow = row + dRow / 2;
      const middleCol = col + dCol / 2;

      if (
        this.isValidPositionForBoard(board, newRow, newCol) &&
        board[newRow][newCol] === 2 &&
        board[middleRow][middleCol] === 1
      ) {
        moves.push({
          from: { row, col },
          to: { row: newRow, col: newCol },
          middle: { row: middleRow, col: middleCol },
        });
      }
    }

    return moves;
  }

  isValidPositionForBoard(board, row, col) {
    return row >= 0 && row < 7 && col >= 0 && col < 7 && board[row][col] !== 0;
  }

  applyMoveToBoard(board, move) {
    const newBoard = board.map((row) => [...row]);
    newBoard[move.from.row][move.from.col] = 2;
    newBoard[move.middle.row][move.middle.col] = 2;
    newBoard[move.to.row][move.to.col] = 1;
    return newBoard;
  }

  async executeSolution(solution) {
    for (let i = 0; i < solution.length && this.aiSolving; i++) {
      await new Promise((resolve) => {
        this.aiTimeoutId = setTimeout(() => {
          this.makeMove(solution[i]);
          this.updateStatus(`🤖 IA: Mouvement ${i + 1}/${solution.length}`);
          resolve();
        }, 800);
      });
    }

    if (this.aiSolving) {
      this.updateStatus("🎉 L'IA a résolu le puzzle !");
    }
  }

  stopAI() {
    this.aiSolving = false;
    if (this.aiTimeoutId) {
      clearTimeout(this.aiTimeoutId);
      this.aiTimeoutId = null;
    }
    document.getElementById("ai-btn").disabled = false;
    document.getElementById("stop-ai-btn").disabled = true;
    document.getElementById("status").classList.remove("ai-solving");
  }

  reset() {
    this.stopAI();
    this.board = this.initializeBoard();
    this.selectedPeg = null;
    this.moveHistory = [];
    this.possibleMoves = [];
    this.moveCount = 0;
    document.getElementById("undo-btn").disabled = true;
    this.initializeGame();
  }
}

// Instance globale du jeu
let game = new PegSolitaire();

function resetGame() {
  game.reset();
}

function undoMove() {
  game.undoMove();
}

function solveWithAI() {
  game.solveWithAI();
}

function stopAI() {
  game.stopAI();
}
