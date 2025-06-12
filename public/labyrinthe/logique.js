class MazeGenerator {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.size = 25;
    this.cellSize = 0;
    this.maze = [];
    this.start = null;
    this.end = null;
    this.isGenerating = false;
    this.isSolving = false;
    this.animationSpeed = 5;

    // Statistiques
    this.stats = {
      genTime: 0,
      astarTime: 0,
      bfsTime: 0,
      pathLength: 0,
      astarExplored: 0,
      bfsExplored: 0,
    };

    this.updateCanvasSize();
  }

  updateCanvasSize() {
    const maxSize = Math.min(600, window.innerWidth - 40);
    this.canvas.width = maxSize;
    this.canvas.height = maxSize;
    this.cellSize = Math.floor(maxSize / this.size);
  }

  initMaze() {
    this.maze = [];
    for (let i = 0; i < this.size; i++) {
      this.maze[i] = [];
      for (let j = 0; j < this.size; j++) {
        this.maze[i][j] = {
          visited: false,
          walls: { top: true, right: true, bottom: true, left: true },
          isPath: false,
          isExplored: false,
          isStart: false,
          isEnd: false,
        };
      }
    }

    // Définir l'entrée et la sortie
    this.start = { x: 0, y: 0 };
    this.end = { x: this.size - 1, y: this.size - 1 };
    this.maze[0][0].isStart = true;
    this.maze[this.size - 1][this.size - 1].isEnd = true;
  }

  drawMaze() {
    this.ctx.fillStyle = "#333";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const cell = this.maze[i][j];
        const x = j * this.cellSize;
        const y = i * this.cellSize;

        // Dessiner la cellule
        if (cell.isStart) {
          this.ctx.fillStyle = "#2196F3";
        } else if (cell.isEnd) {
          this.ctx.fillStyle = "#F44336";
        } else if (cell.isPath) {
          this.ctx.fillStyle = "#4CAF50";
        } else if (cell.isExplored) {
          this.ctx.fillStyle = "#FF9800";
        } else if (cell.visited) {
          this.ctx.fillStyle = "white";
        } else {
          this.ctx.fillStyle = "#333";
        }

        this.ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);

        // Dessiner les murs
        this.ctx.fillStyle = "#333";
        this.ctx.lineWidth = 2;

        if (cell.walls.top) {
          this.ctx.fillRect(x, y, this.cellSize, 2);
        }
        if (cell.walls.right) {
          this.ctx.fillRect(x + this.cellSize - 2, y, 2, this.cellSize);
        }
        if (cell.walls.bottom) {
          this.ctx.fillRect(x, y + this.cellSize - 2, this.cellSize, 2);
        }
        if (cell.walls.left) {
          this.ctx.fillRect(x, y, 2, this.cellSize);
        }
      }
    }
  }

  getNeighbors(x, y) {
    const neighbors = [];
    const directions = [
      { dx: 0, dy: -1, wall: "top", opposite: "bottom" },
      { dx: 1, dy: 0, wall: "right", opposite: "left" },
      { dx: 0, dy: 1, wall: "bottom", opposite: "top" },
      { dx: -1, dy: 0, wall: "left", opposite: "right" },
    ];

    for (const dir of directions) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;
      if (nx >= 0 && nx < this.size && ny >= 0 && ny < this.size) {
        neighbors.push({
          x: nx,
          y: ny,
          wall: dir.wall,
          opposite: dir.opposite,
        });
      }
    }
    return neighbors;
  }

  async generateMaze() {
    if (this.isGenerating) return;
    this.isGenerating = true;
    this.updateStatus("Génération du labyrinthe en cours...");

    const startTime = performance.now();

    this.initMaze();

    const stack = [];
    const startX = Math.floor(Math.random() * this.size);
    const startY = Math.floor(Math.random() * this.size);

    let current = { x: startX, y: startY };
    this.maze[current.y][current.x].visited = true;

    while (true) {
      const neighbors = this.getNeighbors(current.x, current.y).filter(
        (n) => !this.maze[n.y][n.x].visited
      );

      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        stack.push(current);

        // Supprimer les murs entre les cellules
        this.maze[current.y][current.x].walls[next.wall] = false;
        this.maze[next.y][next.x].walls[next.opposite] = false;

        current = { x: next.x, y: next.y };
        this.maze[current.y][current.x].visited = true;
      } else if (stack.length > 0) {
        current = stack.pop();
      } else {
        break;
      }

      // Animation
      if (Math.random() < 0.1) {
        // Réduire la fréquence pour les performances
        this.drawMaze();
        await this.delay(101 - this.animationSpeed * 10);
      }
    }

    this.drawMaze();

    const endTime = performance.now();
    this.stats.genTime = Math.round(endTime - startTime);
    this.updateStats();

    this.isGenerating = false;
    this.updateStatus(
      "Labyrinthe généré ! Choisissez un algorithme de résolution."
    );
    this.updateButtons();
  }

  async solveMazeAStar() {
    if (this.isSolving) return;
    this.isSolving = true;
    this.updateStatus("Résolution avec A* en cours...");

    const startTime = performance.now();

    // Réinitialiser les états
    this.clearPath();

    const openSet = [
      { x: this.start.x, y: this.start.y, g: 0, h: 0, f: 0, parent: null },
    ];
    const closedSet = new Set();
    const visited = new Set();

    while (openSet.length > 0) {
      // Trouver le nœud avec le plus petit f
      let current = openSet[0];
      let currentIndex = 0;

      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < current.f) {
          current = openSet[i];
          currentIndex = i;
        }
      }

      openSet.splice(currentIndex, 1);
      closedSet.add(`${current.x},${current.y}`);

      // Marquer comme exploré pour la visualisation
      if (
        !(current.x === this.start.x && current.y === this.start.y) &&
        !(current.x === this.end.x && current.y === this.end.y)
      ) {
        this.maze[current.y][current.x].isExplored = true;
      }

      if (current.x === this.end.x && current.y === this.end.y) {
        // Reconstruire le chemin
        const path = [];
        let pathNode = current;
        while (pathNode !== null) {
          path.unshift({ x: pathNode.x, y: pathNode.y });
          pathNode = pathNode.parent;
        }

        // Animer le chemin
        for (const point of path) {
          if (
            !(point.x === this.start.x && point.y === this.start.y) &&
            !(point.x === this.end.x && point.y === this.end.y)
          ) {
            this.maze[point.y][point.x].isPath = true;
            this.maze[point.y][point.x].isExplored = false;
          }
          this.drawMaze();
          await this.delay(51 - this.animationSpeed * 5);
        }

        const endTime = performance.now();
        this.stats.astarTime = Math.round(endTime - startTime);
        this.stats.pathLength = path.length;
        this.stats.astarExplored = closedSet.size;
        this.updateStats();

        this.isSolving = false;
        this.updateStatus("Labyrinthe résolu avec A* !");
        this.updateButtons();
        return;
      }

      // Explorer les voisins
      const neighbors = this.getValidNeighbors(current.x, current.y);

      for (const neighbor of neighbors) {
        const key = `${neighbor.x},${neighbor.y}`;
        if (closedSet.has(key)) continue;

        const g = current.g + 1;
        const h =
          Math.abs(neighbor.x - this.end.x) + Math.abs(neighbor.y - this.end.y);
        const f = g + h;

        const existingNode = openSet.find(
          (n) => n.x === neighbor.x && n.y === neighbor.y
        );

        if (!existingNode) {
          openSet.push({
            x: neighbor.x,
            y: neighbor.y,
            g: g,
            h: h,
            f: f,
            parent: current,
          });
        } else if (g < existingNode.g) {
          existingNode.g = g;
          existingNode.f = g + existingNode.h;
          existingNode.parent = current;
        }
      }

      // Animation
      this.drawMaze();
      await this.delay(51 - this.animationSpeed * 5);
    }

    this.isSolving = false;
    this.updateStatus("Aucun chemin trouvé avec A*");
    this.updateButtons();
  }

  async solveMazeBFS() {
    if (this.isSolving) return;
    this.isSolving = true;
    this.updateStatus("Résolution avec BFS en cours...");

    const startTime = performance.now();

    // Réinitialiser les états
    this.clearPath();

    const queue = [
      {
        x: this.start.x,
        y: this.start.y,
        path: [{ x: this.start.x, y: this.start.y }],
      },
    ];
    const visited = new Set();
    visited.add(`${this.start.x},${this.start.y}`);

    while (queue.length > 0) {
      const current = queue.shift();

      // Marquer comme exploré pour la visualisation
      if (
        !(current.x === this.start.x && current.y === this.start.y) &&
        !(current.x === this.end.x && current.y === this.end.y)
      ) {
        this.maze[current.y][current.x].isExplored = true;
      }

      if (current.x === this.end.x && current.y === this.end.y) {
        // Animer le chemin
        for (const point of current.path) {
          if (
            !(point.x === this.start.x && point.y === this.start.y) &&
            !(point.x === this.end.x && point.y === this.end.y)
          ) {
            this.maze[point.y][point.x].isPath = true;
            this.maze[point.y][point.x].isExplored = false;
          }
          this.drawMaze();
          await this.delay(51 - this.animationSpeed * 5);
        }

        const endTime = performance.now();
        this.stats.bfsTime = Math.round(endTime - startTime);
        this.stats.pathLength = current.path.length;
        this.stats.bfsExplored = visited.size;
        this.updateStats();

        this.isSolving = false;
        this.updateStatus("Labyrinthe résolu avec BFS !");
        this.updateButtons();
        return;
      }

      // Explorer les voisins
      const neighbors = this.getValidNeighbors(current.x, current.y);

      for (const neighbor of neighbors) {
        const key = `${neighbor.x},${neighbor.y}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push({
            x: neighbor.x,
            y: neighbor.y,
            path: [...current.path, { x: neighbor.x, y: neighbor.y }],
          });
        }
      }

      // Animation
      this.drawMaze();
      await this.delay(51 - this.animationSpeed * 5);
    }

    this.isSolving = false;
    this.updateStatus("Aucun chemin trouvé avec BFS");
    this.updateButtons();
  }

  getValidNeighbors(x, y) {
    const neighbors = [];
    const directions = [
      { dx: 0, dy: -1, wall: "top" },
      { dx: 1, dy: 0, wall: "right" },
      { dx: 0, dy: 1, wall: "bottom" },
      { dx: -1, dy: 0, wall: "left" },
    ];

    for (const dir of directions) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;

      if (
        nx >= 0 &&
        nx < this.size &&
        ny >= 0 &&
        ny < this.size &&
        !this.maze[y][x].walls[dir.wall]
      ) {
        neighbors.push({ x: nx, y: ny });
      }
    }

    return neighbors;
  }

  clearPath() {
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        this.maze[i][j].isPath = false;
        this.maze[i][j].isExplored = false;
      }
    }
    this.drawMaze();
  }

  clear() {
    this.ctx.fillStyle = "#333";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.maze = [];
    this.stats = {
      genTime: 0,
      astarTime: 0,
      bfsTime: 0,
      pathLength: 0,
      astarExplored: 0,
      bfsExplored: 0,
    };
    this.updateStats();
    this.updateStatus("Prêt à générer un labyrinthe");
    this.updateButtons();
  }

  updateStatus(message) {
    document.getElementById("status").textContent = message;
  }

  updateButtons() {
    const hasValidMaze =
      this.maze.length > 0 && !this.isGenerating && !this.isSolving;

    document.getElementById("generateBtn").disabled =
      this.isGenerating || this.isSolving;
    document.getElementById("solveAStarBtn").disabled = !hasValidMaze;
    document.getElementById("solveBFSBtn").disabled = !hasValidMaze;
    document.getElementById("clearBtn").disabled =
      this.isGenerating || this.isSolving;
    document.getElementById("sizeSlider").disabled =
      this.isGenerating || this.isSolving;
    document.getElementById("speedSlider").disabled =
      this.isGenerating || this.isSolving;
  }

  updateStats() {
    document.getElementById("genTime").textContent = this.stats.genTime || "-";
    document.getElementById("astarTime").textContent =
      this.stats.astarTime || "-";
    document.getElementById("bfsTime").textContent = this.stats.bfsTime || "-";
    document.getElementById("pathLength").textContent =
      this.stats.pathLength || "-";
    document.getElementById("astarExplored").textContent =
      this.stats.astarExplored || "-";
    document.getElementById("bfsExplored").textContent =
      this.stats.bfsExplored || "-";
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  setSize(size) {
    this.size = size;
    this.updateCanvasSize();
  }

  setAnimationSpeed(speed) {
    this.animationSpeed = speed;
  }
}

// Initialisation
const canvas = document.getElementById("mazeCanvas");
const mazeGen = new MazeGenerator(canvas);

// Gestionnaires d'événements
document.getElementById("sizeSlider").addEventListener("input", (e) => {
  const size = parseInt(e.target.value);
  mazeGen.setSize(size);
  document.getElementById("sizeValue").textContent = `${size}x${size}`;
});

document.getElementById("speedSlider").addEventListener("input", (e) => {
  const speed = parseInt(e.target.value);
  mazeGen.setAnimationSpeed(speed);
  document.getElementById("speedValue").textContent = speed;
});

document.getElementById("generateBtn").addEventListener("click", () => {
  mazeGen.generateMaze();
});

document.getElementById("solveAStarBtn").addEventListener("click", () => {
  mazeGen.solveMazeAStar();
});

document.getElementById("solveBFSBtn").addEventListener("click", () => {
  mazeGen.solveMazeBFS();
});

document.getElementById("clearBtn").addEventListener("click", () => {
  mazeGen.clear();
});

// Responsivité
window.addEventListener("resize", () => {
  mazeGen.updateCanvasSize();
  if (mazeGen.maze.length > 0) {
    mazeGen.drawMaze();
  }
});

// Initialisation des boutons
mazeGen.updateButtons();
mazeGen.updateStats();

// Génération automatique d'un premier labyrinthe
setTimeout(() => {
  mazeGen.generateMaze();
}, 1000);
