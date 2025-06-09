class PuzzleSolver {
  constructor() {
    this.size = 4;
    this.puzzle = [];
    this.solvedState = [];
    this.moves = 0;
    this.difficulty = 25;
    this.isAnimating = false;

    this.initializePuzzle();
    this.render();
  }

  initializePuzzle() {
    // État résolu : 1-15 et 0 pour l'espace vide
    this.solvedState = Array.from({ length: 15 }, (_, i) => i + 1).concat([0]);
    this.puzzle = [...this.solvedState];
  }

  render() {
    const grid = document.getElementById("puzzleGrid");
    grid.innerHTML = "";

    this.puzzle.forEach((value, index) => {
      const tile = document.createElement("div");
      tile.className = "puzzle-tile";
      tile.onclick = () => this.moveTile(index);

      if (value === 0) {
        tile.className += " empty";
      } else {
        tile.textContent = value;
      }

      grid.appendChild(tile);
    });

    document.getElementById("movesCount").textContent = this.moves;
  }

  moveTile(index) {
    if (this.isAnimating) return;

    const emptyIndex = this.puzzle.indexOf(0);
    const row = Math.floor(index / this.size);
    const col = index % this.size;
    const emptyRow = Math.floor(emptyIndex / this.size);
    const emptyCol = emptyIndex % this.size;

    // Vérifier si le mouvement est valide (adjacent à l'espace vide)
    if (Math.abs(row - emptyRow) + Math.abs(col - emptyCol) === 1) {
      [this.puzzle[index], this.puzzle[emptyIndex]] = [
        this.puzzle[emptyIndex],
        this.puzzle[index],
      ];
      this.moves++;
      this.render();

      if (this.isSolved()) {
        setTimeout(() => this.celebrateWin(), 100);
      }
    }
  }

  isSolved() {
    return JSON.stringify(this.puzzle) === JSON.stringify(this.solvedState);
  }

  celebrateWin() {
    alert(
      "🎉 Félicitations ! Puzzle résolu en " + this.moves + " mouvements !"
    );
  }

  shufflePuzzle() {
    if (this.isAnimating) return;

    this.puzzle = [...this.solvedState];
    this.moves = 0;

    // Effectuer des mouvements aléatoires valides
    for (let i = 0; i < this.difficulty; i++) {
      const validMoves = this.getValidMoves();
      const randomMove =
        validMoves[Math.floor(Math.random() * validMoves.length)];
      const emptyIndex = this.puzzle.indexOf(0);
      [this.puzzle[randomMove], this.puzzle[emptyIndex]] = [
        this.puzzle[emptyIndex],
        this.puzzle[randomMove],
      ];
    }

    this.render();
    this.clearSolution();
  }

  getValidMoves() {
    const emptyIndex = this.puzzle.indexOf(0);
    const row = Math.floor(emptyIndex / this.size);
    const col = emptyIndex % this.size;
    const moves = [];

    if (row > 0) moves.push(emptyIndex - this.size); // Haut
    if (row < this.size - 1) moves.push(emptyIndex + this.size); // Bas
    if (col > 0) moves.push(emptyIndex - 1); // Gauche
    if (col < this.size - 1) moves.push(emptyIndex + 1); // Droite

    return moves;
  }

  resetPuzzle() {
    if (this.isAnimating) return;

    this.puzzle = [...this.solvedState];
    this.moves = 0;
    this.render();
    this.clearSolution();
  }

  clearSolution() {
    document.getElementById("solutionSteps").style.display = "none";
    document.getElementById("solvingAnimation").style.display = "none";
    document.getElementById("nodesExplored").textContent = "0";
    document.getElementById("solutionLength").textContent = "-";
    document.getElementById("timeElapsed").textContent = "0ms";

    // Nettoyer les classes de visualisation
    const tiles = document.querySelectorAll(".puzzle-tile");
    tiles.forEach((tile) => {
      tile.classList.remove("solving", "solution-path");
    });
  }

  async solvePuzzle(algorithm) {
    if (this.isAnimating || this.isSolved()) return;

    this.isAnimating = true;
    this.clearSolution();
    document.getElementById("solvingAnimation").style.display = "block";

    const startTime = performance.now();
    let solution, nodesExplored;

    if (algorithm === "astar") {
      const result = this.solveAStar();
      solution = result.path;
      nodesExplored = result.nodesExplored;
      document.getElementById("algorithmInfo").innerHTML = `
                        <h5><i class="fas fa-star me-2"></i>Algorithme A*</h5>
                        <p>A* utilise la distance de Manhattan comme heuristique pour trouver le chemin optimal efficacement.</p>
                    `;
    } else {
      const result = this.solveBFS();
      solution = result.path;
      nodesExplored = result.nodesExplored;
      document.getElementById("algorithmInfo").innerHTML = `
                        <h5><i class="fas fa-search me-2"></i>Algorithme BFS</h5>
                        <p>BFS explore tous les états possibles niveau par niveau, garantissant la solution optimale.</p>
                    `;
    }

    const endTime = performance.now();
    const timeElapsed = Math.round(endTime - startTime);

    document.getElementById("solvingAnimation").style.display = "none";
    document.getElementById("nodesExplored").textContent = nodesExplored;
    document.getElementById("timeElapsed").textContent = timeElapsed + "ms";

    if (solution) {
      document.getElementById("solutionLength").textContent = solution.length;
      await this.animateSolution(solution);
    } else {
      alert("Aucune solution trouvée !");
    }

    this.isAnimating = false;
  }

  manhattanDistance(state) {
    let distance = 0;
    for (let i = 0; i < state.length; i++) {
      if (state[i] !== 0) {
        const currentRow = Math.floor(i / this.size);
        const currentCol = i % this.size;
        const targetIndex = state[i] - 1;
        const targetRow = Math.floor(targetIndex / this.size);
        const targetCol = targetIndex % this.size;
        distance +=
          Math.abs(currentRow - targetRow) + Math.abs(currentCol - targetCol);
      }
    }
    return distance;
  }

  solveAStar() {
    const openSet = [
      {
        state: [...this.puzzle],
        g: 0,
        h: this.manhattanDistance(this.puzzle),
        f: 0,
        path: [],
      },
    ];
    const closedSet = new Set();
    let nodesExplored = 0;

    while (openSet.length > 0) {
      // Trouver l'état avec le plus petit f
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift();
      nodesExplored++;

      const stateKey = current.state.join(",");
      if (closedSet.has(stateKey)) continue;
      closedSet.add(stateKey);

      if (JSON.stringify(current.state) === JSON.stringify(this.solvedState)) {
        return { path: current.path, nodesExplored };
      }

      const neighbors = this.getNeighbors(current.state);
      for (const neighbor of neighbors) {
        const neighborKey = neighbor.state.join(",");
        if (closedSet.has(neighborKey)) continue;

        const g = current.g + 1;
        const h = this.manhattanDistance(neighbor.state);
        const f = g + h;

        openSet.push({
          state: neighbor.state,
          g: g,
          h: h,
          f: f,
          path: [...current.path, neighbor.move],
        });
      }
    }

    return { path: null, nodesExplored };
  }

  solveBFS() {
    const queue = [{ state: [...this.puzzle], path: [] }];
    const visited = new Set([this.puzzle.join(",")]);
    let nodesExplored = 0;

    while (queue.length > 0) {
      const current = queue.shift();
      nodesExplored++;

      if (JSON.stringify(current.state) === JSON.stringify(this.solvedState)) {
        return { path: current.path, nodesExplored };
      }

      const neighbors = this.getNeighbors(current.state);
      for (const neighbor of neighbors) {
        const stateKey = neighbor.state.join(",");
        if (!visited.has(stateKey)) {
          visited.add(stateKey);
          queue.push({
            state: neighbor.state,
            path: [...current.path, neighbor.move],
          });
        }
      }
    }

    return { path: null, nodesExplored };
  }

  getNeighbors(state) {
    const neighbors = [];
    const emptyIndex = state.indexOf(0);
    const validMoves = this.getValidMovesForState(state, emptyIndex);

    for (const moveIndex of validMoves) {
      const newState = [...state];
      [newState[emptyIndex], newState[moveIndex]] = [
        newState[moveIndex],
        newState[emptyIndex],
      ];
      neighbors.push({
        state: newState,
        move: { from: emptyIndex, to: moveIndex },
      });
    }

    return neighbors;
  }

  getValidMovesForState(state, emptyIndex) {
    const row = Math.floor(emptyIndex / this.size);
    const col = emptyIndex % this.size;
    const moves = [];

    if (row > 0) moves.push(emptyIndex - this.size);
    if (row < this.size - 1) moves.push(emptyIndex + this.size);
    if (col > 0) moves.push(emptyIndex - 1);
    if (col < this.size - 1) moves.push(emptyIndex + 1);

    return moves;
  }

  async animateSolution(solution) {
    const stepsContainer = document.getElementById("stepsContainer");
    stepsContainer.innerHTML = "";
    document.getElementById("solutionSteps").style.display = "block";

    for (let i = 0; i < solution.length; i++) {
      const move = solution[i];

      // Animer le mouvement
      const tiles = document.querySelectorAll(".puzzle-tile");
      tiles[move.to].classList.add("solution-path");

      // Effectuer le mouvement
      [this.puzzle[move.from], this.puzzle[move.to]] = [
        this.puzzle[move.to],
        this.puzzle[move.from],
      ];
      this.moves++;
      this.render();

      // Ajouter l'étape à la liste
      const stepDiv = document.createElement("div");
      stepDiv.className = "step-item";
      stepDiv.textContent = `Étape ${i + 1}: Déplacer la tuile ${
        this.puzzle[move.from]
      } vers la position ${move.to}`;
      stepsContainer.appendChild(stepDiv);

      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // Célébrer la résolution
    setTimeout(() => {
      alert(
        "🤖 Puzzle résolu par l'IA en " +
          solution.length +
          " mouvements optimaux !"
      );
    }, 500);
  }

  setDifficulty(moves) {
    this.difficulty = moves;

    // Mettre à jour les boutons
    document.querySelectorAll(".difficulty-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    document.querySelector(`[data-moves="${moves}"]`).classList.add("active");
  }
}

// Fonctions globales pour l'interface
let puzzleSolver;

function initGame() {
  puzzleSolver = new PuzzleSolver();
}

function shufflePuzzle() {
  puzzleSolver.shufflePuzzle();
}

function solvePuzzle(algorithm) {
  puzzleSolver.solvePuzzle(algorithm);
}

function resetPuzzle() {
  puzzleSolver.resetPuzzle();
}

function setDifficulty(moves) {
  puzzleSolver.setDifficulty(moves);
}

// Initialiser le jeu au chargement de la page
document.addEventListener("DOMContentLoaded", initGame);
