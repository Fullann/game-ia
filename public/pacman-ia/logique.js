const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Configuration du jeu
const CELL_SIZE = 20;
const ROWS = 30;
const COLS = 30;

// États du jeu
let gameState = "stopped"; // stopped, playing, paused, gameOver
let aiEnabled = false;
let score = 0;
let lives = 3;
let level = 1;
let dotsEaten = 0;
let totalDots = 0;
let powerPelletActive = false;
let powerPelletTimer = 0;
let gameSpeed = 100;

// Labyrinthe (1 = mur, 0 = vide, 2 = point, 3 = power pellet)
const maze = [
  [
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1,
  ],
  [
    1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2,
    2, 2, 2, 2, 1,
  ],
  [
    1, 3, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1,
    1, 1, 1, 3, 1,
  ],
  [
    1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
    2, 2, 2, 2, 1,
  ],
  [
    1, 2, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1,
    1, 1, 1, 2, 1,
  ],
  [
    1, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 2, 2,
    2, 2, 2, 2, 1,
  ],
  [
    1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 2, 1,
    1, 1, 1, 1, 1,
  ],
  [
    0, 0, 0, 0, 0, 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 1,
    0, 0, 0, 0, 0,
  ],
  [
    1, 1, 1, 1, 1, 1, 2, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 2, 1,
    1, 1, 1, 1, 1,
  ],
  [
    0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0,
    0, 0, 0, 0, 0,
  ],
  [
    1, 1, 1, 1, 1, 1, 2, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 2, 1,
    1, 1, 1, 1, 1,
  ],
  [
    0, 0, 0, 0, 0, 1, 2, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 2, 1,
    0, 0, 0, 0, 0,
  ],
  [
    1, 1, 1, 1, 1, 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 1,
    1, 1, 1, 1, 1,
  ],
  [
    1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2,
    2, 2, 2, 2, 1,
  ],
  [
    1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1,
    1, 1, 1, 2, 1,
  ],
  [
    1, 3, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1,
    1, 2, 2, 3, 1,
  ],
  [
    1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1,
    1, 2, 1, 1, 1,
  ],
  [
    1, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 2, 2,
    2, 2, 2, 2, 1,
  ],
  [
    1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 2, 1,
  ],
  [
    1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
    2, 2, 2, 2, 1,
  ],
  [
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1,
  ],
];

// Ajuster les dimensions pour correspondre au labyrinthe
const actualRows = maze.length;
const actualCols = maze[0].length;
canvas.width = actualCols * CELL_SIZE;
canvas.height = actualRows * CELL_SIZE;

// Pac-Man
const pacman = {
  x: 1,
  y: 1,
  direction: "right",
  nextDirection: "right",
  moving: false,
};

// Fantômes
const ghosts = [
  {
    x: 14,
    y: 10,
    direction: "up",
    color: "#ff0000",
    scared: false,
    home: true,
  },
  {
    x: 15,
    y: 10,
    direction: "down",
    color: "#ffc0cb",
    scared: false,
    home: true,
  },
  {
    x: 14,
    y: 11,
    direction: "left",
    color: "#00ffff",
    scared: false,
    home: true,
  },
  {
    x: 15,
    y: 11,
    direction: "right",
    color: "#ffa500",
    scared: false,
    home: true,
  },
];

// IA - Pathfinding A*
class AIController {
  constructor() {
    this.strategy = "collect_dots";
    this.currentPath = [];
    this.target = null;
    this.lastUpdate = 0;
    this.dangerMap = new Map();
    this.updateInterval = 200; // Mise à jour toutes les 200ms
  }

  // Algorithme A* pour le pathfinding
  findPath(start, goal) {
    const openSet = [start];
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    const key = (pos) => `${pos.x},${pos.y}`;

    gScore.set(key(start), 0);
    fScore.set(key(start), this.heuristic(start, goal));

    while (openSet.length > 0) {
      // Trouver le nœud avec le plus petit fScore
      let current = openSet.reduce((a, b) =>
        (fScore.get(key(a)) || Infinity) < (fScore.get(key(b)) || Infinity)
          ? a
          : b
      );

      if (current.x === goal.x && current.y === goal.y) {
        // Reconstruire le chemin
        const path = [];
        let curr = current;
        while (cameFrom.has(key(curr))) {
          path.unshift(curr);
          curr = cameFrom.get(key(curr));
        }
        return path;
      }

      openSet.splice(openSet.indexOf(current), 1);
      closedSet.add(key(current));

      // Examiner les voisins
      const neighbors = this.getNeighbors(current);
      for (const neighbor of neighbors) {
        const neighborKey = key(neighbor);

        if (closedSet.has(neighborKey) || !this.isValidMove(neighbor)) {
          continue;
        }

        const tentativeGScore = gScore.get(key(current)) + 1;

        if (!openSet.some((n) => key(n) === neighborKey)) {
          openSet.push(neighbor);
        } else if (tentativeGScore >= (gScore.get(neighborKey) || Infinity)) {
          continue;
        }

        cameFrom.set(neighborKey, current);
        gScore.set(neighborKey, tentativeGScore);
        fScore.set(
          neighborKey,
          tentativeGScore + this.heuristic(neighbor, goal)
        );
      }
    }

    return []; // Aucun chemin trouvé
  }

  heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  getNeighbors(pos) {
    return [
      { x: pos.x + 1, y: pos.y },
      { x: pos.x - 1, y: pos.y },
      { x: pos.x, y: pos.y + 1 },
      { x: pos.x, y: pos.y - 1 },
    ];
  }

  isValidMove(pos) {
    if (pos.x < 0 || pos.x >= actualCols || pos.y < 0 || pos.y >= actualRows) {
      return false;
    }
    return maze[pos.y][pos.x] !== 1;
  }

  // Calcul de la carte des dangers
  updateDangerMap() {
    this.dangerMap.clear();

    for (const ghost of ghosts) {
      if (ghost.scared) continue;

      const dangerRadius = 3;
      for (let dy = -dangerRadius; dy <= dangerRadius; dy++) {
        for (let dx = -dangerRadius; dx <= dangerRadius; dx++) {
          const x = ghost.x + dx;
          const y = ghost.y + dy;

          if (x >= 0 && x < actualCols && y >= 0 && y < actualRows) {
            const distance = Math.abs(dx) + Math.abs(dy);
            const danger = Math.max(0, dangerRadius - distance + 1);
            const key = `${x},${y}`;

            if (!this.dangerMap.has(key) || this.dangerMap.get(key) < danger) {
              this.dangerMap.set(key, danger);
            }
          }
        }
      }
    }
  }

  // Évaluation du danger à une position
  getDanger(pos) {
    const key = `${pos.x},${pos.y}`;
    return this.dangerMap.get(key) || 0;
  }

  // Trouver le meilleur objectif
  findBestTarget() {
    const targets = [];

    // Chercher les power pellets en priorité si des fantômes sont proches
    const nearbyGhosts = ghosts.filter(
      (g) =>
        !g.scared && Math.abs(g.x - pacman.x) + Math.abs(g.y - pacman.y) < 8
    );

    if (nearbyGhosts.length > 0) {
      for (let y = 0; y < actualRows; y++) {
        for (let x = 0; x < actualCols; x++) {
          if (maze[y][x] === 3) {
            const distance = Math.abs(x - pacman.x) + Math.abs(y - pacman.y);
            targets.push({
              x,
              y,
              type: "power",
              distance,
              priority: 100 - distance,
            });
          }
        }
      }
    }

    // Chercher les fantômes effrayés
    if (powerPelletActive) {
      for (const ghost of ghosts) {
        if (ghost.scared) {
          const distance =
            Math.abs(ghost.x - pacman.x) + Math.abs(ghost.y - pacman.y);
          targets.push({
            x: ghost.x,
            y: ghost.y,
            type: "ghost",
            distance,
            priority: 200 - distance,
          });
        }
      }
    }

    // Chercher les points normaux
    for (let y = 0; y < actualRows; y++) {
      for (let x = 0; x < actualCols; x++) {
        if (maze[y][x] === 2) {
          const distance = Math.abs(x - pacman.x) + Math.abs(y - pacman.y);
          const danger = this.getDanger({ x, y });
          const priority = Math.max(1, 50 - distance - danger * 10);
          targets.push({ x, y, type: "dot", distance, priority });
        }
      }
    }

    // Trier par priorité
    targets.sort((a, b) => b.priority - a.priority);

    return targets.length > 0 ? targets[0] : null;
  }

  // Mise à jour de l'IA
  update() {
    const now = Date.now();
    if (now - this.lastUpdate < this.updateInterval) {
      return;
    }
    this.lastUpdate = now;

    this.updateDangerMap();

    // Vérifier si on doit changer de cible
    if (
      !this.target ||
      this.currentPath.length === 0 ||
      (this.target.type === "dot" &&
        maze[this.target.y][this.target.x] !== 2) ||
      (this.target.type === "power" && maze[this.target.y][this.target.x] !== 3)
    ) {
      this.target = this.findBestTarget();
      if (this.target) {
        this.currentPath = this.findPath(
          { x: pacman.x, y: pacman.y },
          { x: this.target.x, y: this.target.y }
        );
      }
    }

    // Mise à jour de la stratégie
    if (powerPelletActive) {
      this.strategy = "hunt_ghosts";
    } else if (
      ghosts.some(
        (g) =>
          !g.scared && Math.abs(g.x - pacman.x) + Math.abs(g.y - pacman.y) < 5
      )
    ) {
      this.strategy = "avoid_danger";
    } else {
      this.strategy = "collect_dots";
    }
  }

  // Obtenir la prochaine direction
  getNextDirection() {
    if (this.currentPath.length === 0) return pacman.direction;

    const nextPos = this.currentPath[0];
    const dx = nextPos.x - pacman.x;
    const dy = nextPos.y - pacman.y;

    if (dx > 0) return "right";
    if (dx < 0) return "left";
    if (dy > 0) return "down";
    if (dy < 0) return "up";

    return pacman.direction;
  }

  // Avancer dans le chemin
  advancePath() {
    if (
      this.currentPath.length > 0 &&
      this.currentPath[0].x === pacman.x &&
      this.currentPath[0].y === pacman.y
    ) {
      this.currentPath.shift();
    }
  }
}

const ai = new AIController();

// Initialisation
function init() {
  // Compter le nombre total de points
  totalDots = 0;
  for (let y = 0; y < actualRows; y++) {
    for (let x = 0; x < actualCols; x++) {
      if (maze[y][x] === 2) totalDots++;
    }
  }

  // Réinitialiser les fantômes
  ghosts.forEach((ghost) => {
    ghost.scared = false;
    ghost.home = true;
  });

  updateDisplay();
}

// Mise à jour de l'affichage
function updateDisplay() {
  document.getElementById("score").textContent = score;
  document.getElementById("lives").textContent = lives;
  document.getElementById("level").textContent = level;
  document.getElementById("dotsLeft").textContent = totalDots - dotsEaten;
  document.getElementById("scaredGhosts").textContent = ghosts.filter(
    (g) => g.scared
  ).length;
  document.getElementById("multiplier").textContent = powerPelletActive
    ? "2x"
    : "1x";
  document.getElementById("mode").textContent = aiEnabled ? "IA" : "Manuel";

  if (aiEnabled) {
    document.getElementById("aiStatus").textContent = "IA activée";
    document.getElementById(
      "aiStrategy"
    ).textContent = `Stratégie: ${ai.strategy}`;
    document.getElementById("aiTarget").textContent = ai.target
      ? `Cible: ${ai.target.type} (${ai.target.x},${ai.target.y})`
      : "Cible: Aucune";
    document.getElementById(
      "aiPath"
    ).textContent = `Chemin: ${ai.currentPath.length} étapes`;
  } else {
    document.getElementById("aiStatus").textContent = "IA désactivée";
    document.getElementById("aiStrategy").textContent = "Stratégie: Manuelle";
    document.getElementById("aiTarget").textContent = "Cible: Manuelle";
    document.getElementById("aiPath").textContent = "Chemin: Manuel";
  }
}

// Dessiner le jeu
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Dessiner le labyrinthe
  for (let y = 0; y < actualRows; y++) {
    for (let x = 0; x < actualCols; x++) {
      const cell = maze[y][x];
      const pixelX = x * CELL_SIZE;
      const pixelY = y * CELL_SIZE;

      if (cell === 1) {
        // Mur
        ctx.fillStyle = "#00f";
        ctx.fillRect(pixelX, pixelY, CELL_SIZE, CELL_SIZE);
      } else if (cell === 2) {
        // Point
        ctx.fillStyle = "#ff0";
        ctx.beginPath();
        ctx.arc(
          pixelX + CELL_SIZE / 2,
          pixelY + CELL_SIZE / 2,
          2,
          0,
          Math.PI * 2
        );
        ctx.fill();
      } else if (cell === 3) {
        // Power pellet
        ctx.fillStyle = "#ff0";
        ctx.beginPath();
        ctx.arc(
          pixelX + CELL_SIZE / 2,
          pixelY + CELL_SIZE / 2,
          6,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }
  }

  // Dessiner les fantômes
  ghosts.forEach((ghost) => {
    if (ghost.home) return;

    const pixelX = ghost.x * CELL_SIZE + CELL_SIZE / 2;
    const pixelY = ghost.y * CELL_SIZE + CELL_SIZE / 2;

    ctx.fillStyle = ghost.scared ? "#0000ff" : ghost.color;
    ctx.beginPath();
    ctx.arc(pixelX, pixelY, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // Yeux
    ctx.fillStyle = ghost.scared ? "#fff" : "#000";
    ctx.beginPath();
    ctx.arc(pixelX - 4, pixelY - 4, 2, 0, Math.PI * 2);
    ctx.arc(pixelX + 4, pixelY - 4, 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Dessiner Pac-Man
  const pacPixelX = pacman.x * CELL_SIZE + CELL_SIZE / 2;
  const pacPixelY = pacman.y * CELL_SIZE + CELL_SIZE / 2;

  ctx.fillStyle = "#ff0";
  ctx.beginPath();
  ctx.arc(pacPixelX, pacPixelY, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
  ctx.fill();

  // Bouche de Pac-Man
  ctx.fillStyle = "#000";
  ctx.beginPath();
  const mouthAngle = Math.PI / 4;
  let startAngle = 0;

  switch (pacman.direction) {
    case "right":
      startAngle = -mouthAngle;
      break;
    case "left":
      startAngle = Math.PI - mouthAngle;
      break;
    case "up":
      startAngle = Math.PI * 1.5 - mouthAngle;
      break;
    case "down":
      startAngle = Math.PI * 0.5 - mouthAngle;
      break;
  }

  ctx.arc(
    pacPixelX,
    pacPixelY,
    CELL_SIZE / 2 - 2,
    startAngle,
    startAngle + mouthAngle * 2
  );
  ctx.lineTo(pacPixelX, pacPixelY);
  ctx.fill();

  // Dessiner le chemin de l'IA (si activée)
  if (aiEnabled && ai.currentPath.length > 0) {
    ctx.strokeStyle = "rgba(0, 255, 0, 0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pacPixelX, pacPixelY);

    for (const point of ai.currentPath) {
      ctx.lineTo(
        point.x * CELL_SIZE + CELL_SIZE / 2,
        point.y * CELL_SIZE + CELL_SIZE / 2
      );
    }
    ctx.stroke();
  }
}

// Vérifier si un mouvement est valide
function isValidMove(x, y) {
  if (x < 0 || x >= actualCols || y < 0 || y >= actualRows) {
    return false;
  }
  return maze[y][x] !== 1;
}

// Déplacer Pac-Man
function movePacman() {
  let newX = pacman.x;
  let newY = pacman.y;

  // Déterminer la direction (IA ou joueur)
  const direction = aiEnabled ? ai.getNextDirection() : pacman.nextDirection;

  switch (direction) {
    case "up":
      newY--;
      break;
    case "down":
      newY++;
      break;
    case "left":
      newX--;
      break;
    case "right":
      newX++;
      break;
  }

  if (isValidMove(newX, newY)) {
    pacman.x = newX;
    pacman.y = newY;
    pacman.direction = direction;

    if (aiEnabled) {
      ai.advancePath();
    }

    // Vérifier les collisions avec les points
    if (maze[newY][newX] === 2) {
      maze[newY][newX] = 0;
      score += 10;
      dotsEaten++;

      if (dotsEaten >= totalDots) {
        levelComplete();
      }
    } else if (maze[newY][newX] === 3) {
      maze[newY][newX] = 0;
      score += 50;
      activatePowerPellet();
    }
  }
}

// Activer le power pellet
function activatePowerPellet() {
  powerPelletActive = true;
  powerPelletTimer = 10000; // 10 secondes

  // Rendre tous les fantômes effrayés
  ghosts.forEach((ghost) => {
    if (!ghost.home) {
      ghost.scared = true;
    }
  });
}

// Déplacer les fantômes
function moveGhosts() {
  ghosts.forEach((ghost) => {
    if (ghost.home) {
      // Logique pour sortir de la maison
      if (Math.random() < 0.02) {
        ghost.home = false;
        ghost.x = 14;
        ghost.y = 9;
      }
      return;
    }

    const directions = ["up", "down", "left", "right"];
    const validDirections = directions.filter((dir) => {
      const newPos = getNewPosition(ghost, dir);
      return isValidMove(newPos.x, newPos.y);
    });

    if (validDirections.length === 0) return;

    let nextDirection;

    if (ghost.scared) {
      // Fuir Pac-Man
      const pacmanDistance =
        Math.abs(ghost.x - pacman.x) + Math.abs(ghost.y - pacman.y);
      const directionScores = validDirections.map((dir) => {
        const newPos = getNewPosition(ghost, dir);
        const newDistance =
          Math.abs(newPos.x - pacman.x) + Math.abs(newPos.y - pacman.y);
        return { direction: dir, score: newDistance };
      });

      directionScores.sort((a, b) => b.score - a.score);
      nextDirection = directionScores[0].direction;
    } else {
      // Poursuivre Pac-Man avec un peu d'aléatoire
      if (Math.random() < 0.7) {
        const directionScores = validDirections.map((dir) => {
          const newPos = getNewPosition(ghost, dir);
          const distance =
            Math.abs(newPos.x - pacman.x) + Math.abs(newPos.y - pacman.y);
          return { direction: dir, score: -distance };
        });

        directionScores.sort((a, b) => b.score - a.score);
        nextDirection = directionScores[0].direction;
      } else {
        nextDirection =
          validDirections[Math.floor(Math.random() * validDirections.length)];
      }
    }

    const newPos = getNewPosition(ghost, nextDirection);
    ghost.x = newPos.x;
    ghost.y = newPos.y;
    ghost.direction = nextDirection;
  });
}

function getNewPosition(entity, direction) {
  let newX = entity.x;
  let newY = entity.y;

  switch (direction) {
    case "up":
      newY--;
      break;
    case "down":
      newY++;
      break;
    case "left":
      newX--;
      break;
    case "right":
      newX++;
      break;
  }

  return { x: newX, y: newY };
}

// Vérifier les collisions
function checkCollisions() {
  ghosts.forEach((ghost) => {
    if (ghost.home) return;

    if (ghost.x === pacman.x && ghost.y === pacman.y) {
      if (ghost.scared) {
        // Manger un fantôme
        score += 200;
        ghost.home = true;
        ghost.scared = false;
        ghost.x = 14;
        ghost.y = 10;
      } else {
        // Pac-Man touché
        lives--;
        if (lives <= 0) {
          gameOver();
        } else {
          resetPositions();
        }
      }
    }
  });
}

// Réinitialiser les positions
function resetPositions() {
  pacman.x = 1;
  pacman.y = 1;
  pacman.direction = "right";

  ghosts.forEach((ghost, index) => {
    ghost.x = 14 + (index % 2);
    ghost.y = 10 + Math.floor(index / 2);
    ghost.home = true;
    ghost.scared = false;
  });

  powerPelletActive = false;
  powerPelletTimer = 0;
}

// Fin de niveau
function levelComplete() {
  level++;
  gameSpeed = Math.max(50, gameSpeed - 10);
  score += 1000;

  // Réinitialiser le labyrinthe
  for (let y = 0; y < actualRows; y++) {
    for (let x = 0; x < actualCols; x++) {
      if (maze[y][x] === 0) {
        // Restaurer les points selon le labyrinthe original
        if (isOriginalDot(x, y)) {
          maze[y][x] = 2;
        } else if (isOriginalPowerPellet(x, y)) {
          maze[y][x] = 3;
        }
      }
    }
  }

  dotsEaten = 0;
  resetPositions();
}

function isOriginalDot(x, y) {
  // Positions des points dans le labyrinthe original
  const originalMaze = [
    [
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1,
    ],
    [
      1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2,
      2, 2, 2, 2, 1,
    ],
    [
      1, 3, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1,
      1, 1, 1, 3, 1,
    ],
    [
      1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
      2, 2, 2, 2, 1,
    ],
    [
      1, 2, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1,
      1, 1, 1, 2, 1,
    ],
    [
      1, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 2, 2,
      2, 2, 2, 2, 1,
    ],
    [
      1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 2, 1,
      1, 1, 1, 1, 1,
    ],
    [
      0, 0, 0, 0, 0, 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 1,
      0, 0, 0, 0, 0,
    ],
    [
      1, 1, 1, 1, 1, 1, 2, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 2, 1,
      1, 1, 1, 1, 1,
    ],
    [
      0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0,
      0, 0, 0, 0, 0,
    ],
    [
      1, 1, 1, 1, 1, 1, 2, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 2, 1,
      1, 1, 1, 1, 1,
    ],
    [
      0, 0, 0, 0, 0, 1, 2, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 2, 1,
      0, 0, 0, 0, 0,
    ],
    [
      1, 1, 1, 1, 1, 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 1,
      1, 1, 1, 1, 1,
    ],
    [
      1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2,
      2, 2, 2, 2, 1,
    ],
    [
      1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1,
      1, 1, 1, 2, 1,
    ],
    [
      1, 3, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1,
      1, 2, 2, 3, 1,
    ],
    [
      1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1,
      1, 2, 1, 1, 1,
    ],
    [
      1, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 2, 2,
      2, 2, 2, 2, 1,
    ],
    [
      1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 2, 1,
    ],
    [
      1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
      2, 2, 2, 2, 1,
    ],
    [
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1,
    ],
  ];
  return originalMaze[y][x] === 2;
}

function isOriginalPowerPellet(x, y) {
  return (
    (x === 1 && y === 2) ||
    (x === 28 && y === 2) ||
    (x === 1 && y === 15) ||
    (x === 28 && y === 15)
  );
}

// Game Over
function gameOver() {
  gameState = "gameOver";

  const gameOverDiv = document.createElement("div");
  gameOverDiv.className = "game-over";
  gameOverDiv.innerHTML = `
                <h2>GAME OVER</h2>
                <p>Score Final: ${score}</p>
                <p>Niveau Atteint: ${level}</p>
                <button class="button" onclick="restartGame()">Recommencer</button>
            `;
  document.body.appendChild(gameOverDiv);
}

function restartGame() {
  const gameOverDiv = document.querySelector(".game-over");
  if (gameOverDiv) {
    gameOverDiv.remove();
  }

  // Réinitialiser toutes les variables
  score = 0;
  lives = 3;
  level = 1;
  dotsEaten = 0;
  powerPelletActive = false;
  powerPelletTimer = 0;
  gameSpeed = 100;
  gameState = "stopped";

  // Restaurer le labyrinthe original
  for (let y = 0; y < actualRows; y++) {
    for (let x = 0; x < actualCols; x++) {
      if (isOriginalDot(x, y)) {
        maze[y][x] = 2;
      } else if (isOriginalPowerPellet(x, y)) {
        maze[y][x] = 3;
      } else if (maze[y][x] === 0) {
        maze[y][x] = 0;
      }
    }
  }

  resetPositions();
  init();
}

// Boucle de jeu principale
function gameLoop() {
  if (gameState === "playing") {
    // Mise à jour de l'IA
    if (aiEnabled) {
      ai.update();
    }

    // Déplacer Pac-Man
    movePacman();

    // Déplacer les fantômes
    moveGhosts();

    // Vérifier les collisions
    checkCollisions();

    // Gérer le power pellet
    if (powerPelletActive) {
      powerPelletTimer -= gameSpeed;
      if (powerPelletTimer <= 0) {
        powerPelletActive = false;
        ghosts.forEach((ghost) => {
          ghost.scared = false;
        });
      }
    }

    // Mettre à jour l'affichage
    updateDisplay();
  }

  // Dessiner le jeu
  draw();

  // Programmer la prochaine frame
  setTimeout(gameLoop, gameSpeed);
}

// Contrôles clavier
document.addEventListener("keydown", (e) => {
  if (!aiEnabled && gameState === "playing") {
    switch (e.key) {
      case "ArrowUp":
        pacman.nextDirection = "up";
        e.preventDefault();
        break;
      case "ArrowDown":
        pacman.nextDirection = "down";
        e.preventDefault();
        break;
      case "ArrowLeft":
        pacman.nextDirection = "left";
        e.preventDefault();
        break;
      case "ArrowRight":
        pacman.nextDirection = "right";
        e.preventDefault();
        break;
    }
  }
});

// Événements des boutons
document.getElementById("startBtn").addEventListener("click", () => {
  if (gameState === "stopped" || gameState === "paused") {
    gameState = "playing";
    document.getElementById("startBtn").textContent = "En cours...";
  }
});

document.getElementById("pauseBtn").addEventListener("click", () => {
  if (gameState === "playing") {
    gameState = "paused";
    document.getElementById("startBtn").textContent = "Reprendre";
  } else if (gameState === "paused") {
    gameState = "playing";
    document.getElementById("startBtn").textContent = "En cours...";
  }
});

document.getElementById("resetBtn").addEventListener("click", () => {
  restartGame();
});

document.getElementById("aiToggle").addEventListener("click", () => {
  aiEnabled = !aiEnabled;
  const button = document.getElementById("aiToggle");

  if (aiEnabled) {
    button.textContent = "Désactiver IA";
    button.classList.add("active");
  } else {
    button.textContent = "Activer IA";
    button.classList.remove("active");
  }

  updateDisplay();
});

// Initialiser le jeu
init();
gameLoop();
