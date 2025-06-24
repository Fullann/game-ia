class Game2048 {
  constructor() {
    this.grid = [];
    this.score = 0;
    this.best = parseInt(localStorage.getItem("best2048")) || 0;
    this.gameState = "playing"; // 'playing', 'won', 'over'
    this.history = [];
    this.aiMode = false;
    this.aiInterval = null;
    this.positionsEvaluated = 0;
    
    // Nouvelles propriétés pour l'IA optimisée
    this.searchDepth = 4;
    this.aiSpeed = 500;
    this.useCache = true;
    this.transpositionTable = new Map();
    this.maxCacheSize = 10000;
    
    this.initializeGrid();
    this.addRandomTile();
    this.addRandomTile();
    this.updateDisplay();
    this.setupKeyboardControls();
    this.setupAIControls();
  }

  setupAIControls() {
    const depthSlider = document.getElementById('depth-slider');
    const speedSlider = document.getElementById('speed-slider');
    const cacheCheckbox = document.getElementById('use-cache');
    
    depthSlider?.addEventListener('input', (e) => {
      this.searchDepth = parseInt(e.target.value);
      document.getElementById('depth-value').textContent = this.searchDepth;
    });
    
    speedSlider?.addEventListener('input', (e) => {
      this.aiSpeed = parseInt(e.target.value);
      document.getElementById('speed-value').textContent = `${this.aiSpeed}ms`;
      if (this.aiInterval) {
        this.stopAI();
        this.startAI();
      }
    });
    
    cacheCheckbox?.addEventListener('change', (e) => {
      this.useCache = e.target.checked;
      if (!this.useCache) {
        this.transpositionTable.clear();
      }
    });
  }

  initializeGrid() {
    this.grid = [];
    for (let i = 0; i < 4; i++) {
      this.grid[i] = [0, 0, 0, 0];
    }
  }

  addRandomTile() {
    const emptyCells = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (this.grid[r][c] === 0) {
          emptyCells.push({ r, c });
        }
      }
    }

    if (emptyCells.length > 0) {
      const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      this.grid[randomCell.r][randomCell.c] = Math.random() < 0.9 ? 2 : 4;
      return true;
    }
    return false;
  }

  saveState() {
    this.history.push({
      grid: this.grid.map((row) => [...row]),
      score: this.score,
      gameState: this.gameState,
    });
    // Limiter l'historique à 10 mouvements
    if (this.history.length > 10) {
      this.history.shift();
    }
    document.getElementById("undo-btn").disabled = false;
  }

  undoMove() {
    if (this.history.length === 0 || this.aiMode) return;
    const lastState = this.history.pop();
    this.grid = lastState.grid;
    this.score = lastState.score;
    this.gameState = lastState.gameState;
    this.updateDisplay();
    document.getElementById("overlay").classList.remove("show");
    if (this.history.length === 0) {
      document.getElementById("undo-btn").disabled = true;
    }
  }

  move(direction) {
    if (this.gameState !== "playing") return false;
    this.saveState();
    let moved = false;
    const newGrid = this.grid.map((row) => [...row]);

    switch (direction) {
      case "left":
        moved = this.moveLeft(newGrid);
        break;
      case "right":
        moved = this.moveRight(newGrid);
        break;
      case "up":
        moved = this.moveUp(newGrid);
        break;
      case "down":
        moved = this.moveDown(newGrid);
        break;
    }

    if (moved) {
      this.grid = newGrid;
      this.addRandomTile();
      this.updateDisplay();
      this.checkGameState();
      return true;
    } else {
      // Annuler la sauvegarde si aucun mouvement
      this.history.pop();
      return false;
    }
  }

  moveLeft(grid) {
    let moved = false;
    for (let r = 0; r < 4; r++) {
      const row = grid[r].filter((val) => val !== 0);
      for (let i = 0; i < row.length - 1; i++) {
        if (row[i] === row[i + 1]) {
          row[i] *= 2;
          this.score += row[i];
          row.splice(i + 1, 1);
        }
      }
      while (row.length < 4) {
        row.push(0);
      }
      for (let c = 0; c < 4; c++) {
        if (grid[r][c] !== row[c]) moved = true;
        grid[r][c] = row[c];
      }
    }
    return moved;
  }

  moveRight(grid) {
    let moved = false;
    for (let r = 0; r < 4; r++) {
      const row = grid[r].filter((val) => val !== 0);
      for (let i = row.length - 1; i > 0; i--) {
        if (row[i] === row[i - 1]) {
          row[i] *= 2;
          this.score += row[i];
          row.splice(i - 1, 1);
          i--;
        }
      }
      while (row.length < 4) {
        row.unshift(0);
      }
      for (let c = 0; c < 4; c++) {
        if (grid[r][c] !== row[c]) moved = true;
        grid[r][c] = row[c];
      }
    }
    return moved;
  }

  moveUp(grid) {
    let moved = false;
    for (let c = 0; c < 4; c++) {
      const column = [];
      for (let r = 0; r < 4; r++) {
        if (grid[r][c] !== 0) column.push(grid[r][c]);
      }
      for (let i = 0; i < column.length - 1; i++) {
        if (column[i] === column[i + 1]) {
          column[i] *= 2;
          this.score += column[i];
          column.splice(i + 1, 1);
        }
      }
      while (column.length < 4) {
        column.push(0);
      }
      for (let r = 0; r < 4; r++) {
        if (grid[r][c] !== column[r]) moved = true;
        grid[r][c] = column[r];
      }
    }
    return moved;
  }

  moveDown(grid) {
    let moved = false;
    for (let c = 0; c < 4; c++) {
      const column = [];
      for (let r = 0; r < 4; r++) {
        if (grid[r][c] !== 0) column.push(grid[r][c]);
      }
      for (let i = column.length - 1; i > 0; i--) {
        if (column[i] === column[i - 1]) {
          column[i] *= 2;
          this.score += column[i];
          column.splice(i - 1, 1);
          i--;
        }
      }
      while (column.length < 4) {
        column.unshift(0);
      }
      for (let r = 0; r < 4; r++) {
        if (grid[r][c] !== column[r]) moved = true;
        grid[r][c] = column[r];
      }
    }
    return moved;
  }

  checkGameState() {
    // Vérifier si 2048 est atteint
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (this.grid[r][c] === 2048 && this.gameState === "playing") {
          this.gameState = "won";
          this.showOverlay("Victoire!", "Vous avez atteint 2048!", true);
          return;
        }
      }
    }

    // Vérifier si le jeu est terminé
    if (!this.canMove()) {
      this.gameState = "over";
      this.showOverlay("Game Over", "Aucun mouvement possible!", false);
    }
  }

  canMove() {
    // Vérifier s'il y a des cases vides
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (this.grid[r][c] === 0) return true;
      }
    }

    // Vérifier s'il y a des fusions possibles
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 3; c++) {
        if (this.grid[r][c] === this.grid[r][c + 1]) return true;
      }
    }

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        if (this.grid[r][c] === this.grid[r + 1][c]) return true;
      }
    }

    return false;
  }

  showOverlay(title, message, isWin) {
    document.getElementById("overlay-title").textContent = title;
    document.getElementById("overlay-message").textContent = message;
    document.getElementById("overlay").classList.add("show");
    if (isWin) {
      document.getElementById("status").textContent = "🎉 Félicitations!";
      document.getElementById("status").className = "status game-won";
    } else {
      document.getElementById("status").textContent = "😔 Game Over";
      document.getElementById("status").className = "status game-over";
    }
  }

  updateDisplay() {
    const board = document.getElementById("board");
    // Nettoyer les tuiles existantes (sauf l'overlay)
    const tiles = board.querySelectorAll(".tile");
    tiles.forEach((tile) => tile.remove());

    // Créer les nouvelles tuiles
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const tile = document.createElement("div");
        tile.className = "tile";
        if (this.grid[r][c] !== 0) {
          tile.textContent = this.grid[r][c];
          tile.classList.add(`tile-${this.grid[r][c]}`);
        }
        board.appendChild(tile);
      }
    }

    // Mettre à jour les scores
    document.getElementById("score").textContent = this.score;
    if (this.score > this.best) {
      this.best = this.score;
      localStorage.setItem("best2048", this.best);
    }
    document.getElementById("best").textContent = this.best;
  }

  setupKeyboardControls() {
    document.addEventListener("keydown", (e) => {
      if (this.aiMode) return;
      switch (e.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault();
          this.move("left");
          break;
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault();
          this.move("right");
          break;
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          this.move("up");
          break;
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          this.move("down");
          break;
      }
    });
  }

  // Version optimisée de getBestMove avec cache
  getBestMove() {
    const startTime = Date.now();
    this.positionsEvaluated = 0;
    
    if (this.useCache && this.transpositionTable.size > this.maxCacheSize) {
      this.transpositionTable.clear();
    }
    
    let bestMove = null;
    let bestScore = -Infinity;
    const moves = this.getOrderedMoves(); // Tri des mouvements pour améliorer l'élagage
    
    for (const move of moves) {
      const testGrid = this.grid.map(row => [...row]);
      const testScore = this.score;
      
      if (this.simulateMove(testGrid, move)) {
        const score = this.minimax(
          testGrid,
          this.searchDepth - 1,
          false,
          -Infinity,
          Infinity,
          0
        );
        
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
    }
    
    const endTime = Date.now();
    document.getElementById('positions-evaluated').textContent = this.positionsEvaluated;
    document.getElementById('calculation-time').textContent = endTime - startTime;
    
    return bestMove;
  }

  // Minimax optimisé avec cache et tri des mouvements
  minimax(grid, depth, isMaximizing, alpha, beta, ply) {
    this.positionsEvaluated++;
    
    // Vérification du cache
    const gridKey = this.useCache ? this.getGridHash(grid) : null;
    if (gridKey && this.transpositionTable.has(gridKey)) {
      const cached = this.transpositionTable.get(gridKey);
      if (cached.depth >= depth) {
        return cached.score;
      }
    }
    
    if (depth === 0) {
      const score = this.evaluateGrid(grid);
      if (gridKey && this.useCache) {
        this.transpositionTable.set(gridKey, { score, depth: 0 });
      }
      return score;
    }

    if (isMaximizing) {
      let maxScore = -Infinity;
      const moves = this.getOrderedMoves();
      
      for (const move of moves) {
        const testGrid = grid.map(row => [...row]);
        if (this.simulateMove(testGrid, move)) {
          const score = this.minimax(testGrid, depth - 1, false, alpha, beta, ply + 1);
          maxScore = Math.max(maxScore, score);
          alpha = Math.max(alpha, score);
          if (beta <= alpha) break; // Élagage alpha-bêta
        }
      }
      
      const finalScore = maxScore === -Infinity ? this.evaluateGrid(grid) : maxScore;
      if (gridKey && this.useCache) {
        this.transpositionTable.set(gridKey, { score: finalScore, depth });
      }
      return finalScore;
      
    } else {
      let minScore = Infinity;
      const emptyCells = this.getEmptyCells(grid);
      
      if (emptyCells.length === 0) {
        return this.evaluateGrid(grid);
      }

      // Limiter le nombre de cases vides évaluées pour optimiser
      const cellsToEvaluate = emptyCells.slice(0, Math.min(8, emptyCells.length));
      
      for (const cell of cellsToEvaluate) {
        for (const value of [2, 4]) {
          const testGrid = grid.map(row => [...row]);
          testGrid[cell.r][cell.c] = value;
          const probability = value === 2 ? 0.9 : 0.1;
          const score = this.minimax(testGrid, depth - 1, true, alpha, beta, ply + 1) * probability;
          minScore = Math.min(minScore, score);
          beta = Math.min(beta, score);
          if (beta <= alpha) break;
        }
        if (beta <= alpha) break;
      }
      
      return minScore;
    }
  }

  // Tri des mouvements pour améliorer l'élagage
  getOrderedMoves() {
    const moves = ['up', 'left', 'down', 'right'];
    // Priorité aux mouvements vers le haut et la gauche (stratégie commune)
    return moves;
  }

  // Hash simple pour le cache
  getGridHash(grid) {
    return grid.flat().join(',');
  }

  // Fonction d'évaluation améliorée
  evaluateGrid(grid) {
    let score = 0;
    const weights = {
      empty: 270,
      monotonicity: 47,
      smoothness: 11,
      maxCorner: 700
    };
    
    // Cases vides
    const emptyCells = this.getEmptyCells(grid).length;
    score += emptyCells * weights.empty;
    
    // Monotonie
    score += this.getMonotonicity(grid) * weights.monotonicity;
    
    // Douceur
    score += this.getSmoothness(grid) * weights.smoothness;
    
    // Bonus pour la plus grande tuile dans un coin
    const maxTile = Math.max(...grid.flat());
    if (grid[0][0] === maxTile || grid[0][3] === maxTile || 
        grid[3][0] === maxTile || grid[3][3] === maxTile) {
      score += maxTile * weights.maxCorner;
    }
    
    return score;
  }

  getEmptyCells(grid) {
    const emptyCells = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (grid[r][c] === 0) {
          emptyCells.push({ r, c });
        }
      }
    }
    return emptyCells;
  }

  getMonotonicity(grid) {
    let score = 0;
    // Vérifier la monotonie horizontale
    for (let r = 0; r < 4; r++) {
      let increasing = 0, decreasing = 0;
      for (let c = 0; c < 3; c++) {
        if (grid[r][c] > grid[r][c + 1]) decreasing++;
        else if (grid[r][c] < grid[r][c + 1]) increasing++;
      }
      score += Math.max(increasing, decreasing);
    }

    // Vérifier la monotonie verticale
    for (let c = 0; c < 4; c++) {
      let increasing = 0, decreasing = 0;
      for (let r = 0; r < 3; r++) {
        if (grid[r][c] > grid[r + 1][c]) decreasing++;
        else if (grid[r][c] < grid[r + 1][c]) increasing++;
      }
      score += Math.max(increasing, decreasing);
    }

    return score;
  }

  getSmoothness(grid) {
    let score = 0;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (grid[r][c] !== 0) {
          // Vérifier les voisins horizontaux
          if (c < 3 && grid[r][c + 1] !== 0) {
            score -= Math.abs(
              Math.log2(grid[r][c]) - Math.log2(grid[r][c + 1])
            );
          }
          // Vérifier les voisins verticaux
          if (r < 3 && grid[r + 1][c] !== 0) {
            score -= Math.abs(
              Math.log2(grid[r][c]) - Math.log2(grid[r + 1][c])
            );
          }
        }
      }
    }
    return score;
  }

  simulateMove(grid, direction) {
    const originalGrid = grid.map((row) => [...row]);
    let moved = false;

    switch (direction) {
      case "left":
        moved = this.moveLeft(grid);
        break;
      case "right":
        moved = this.moveRight(grid);
        break;
      case "up":
        moved = this.moveUp(grid);
        break;
      case "down":
        moved = this.moveDown(grid);
        break;
    }

    return moved;
  }

  startAI() {
    if (this.gameState !== 'playing') return;
    
    this.aiMode = true;
    document.getElementById('ai-btn').disabled = true;
    document.getElementById('stop-ai-btn').disabled = false;
    document.getElementById('ai-stats').style.display = 'block';
    document.getElementById('ai-controls').style.display = 'block';
    document.getElementById("status").textContent = "🤖 IA en cours...";
    document.getElementById("status").className = "status ai-thinking";
    
    this.aiInterval = setInterval(() => {
      if (this.gameState !== 'playing') {
        this.stopAI();
        return;
      }
      
      const bestMove = this.getBestMove();
      if (bestMove) {
        this.move(bestMove);
      } else {
        this.stopAI();
        document.getElementById("status").textContent = "IA bloquée - Aucun mouvement possible";
      }
    }, this.aiSpeed);
  }

  stopAI() {
    this.aiMode = false;
    if (this.aiInterval) {
      clearInterval(this.aiInterval);
      this.aiInterval = null;
    }
    
    document.getElementById('ai-btn').disabled = false;
    document.getElementById('stop-ai-btn').disabled = true;
    document.getElementById('ai-stats').style.display = 'none';
    document.getElementById('ai-controls').style.display = 'none';
    document.getElementById("status").textContent = "Mode manuel - Utilisez les flèches ou WASD";
    document.getElementById("status").className = "status";
  }

  reset() {
    this.stopAI();
    this.initializeGrid();
    this.score = 0;
    this.gameState = "playing";
    this.history = [];
    this.transpositionTable.clear(); // Vider le cache lors du reset
    this.addRandomTile();
    this.addRandomTile();
    this.updateDisplay();
    document.getElementById("overlay").classList.remove("show");
    document.getElementById("undo-btn").disabled = true;
    document.getElementById("status").textContent = "Utilisez les flèches ou WASD pour jouer";
    document.getElementById("status").className = "status";
  }
}

// Instance globale du jeu
let game = new Game2048();

function resetGame() {
  game.reset();
}

function undoMove() {
  game.undoMove();
}

function startAI() {
  game.startAI();
}

function stopAI() {
  game.stopAI();
}

// Empêcher le défilement avec les flèches
window.addEventListener("keydown", function (e) {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
    e.preventDefault();
  }
});
