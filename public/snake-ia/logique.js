const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [{ x: 10, y: 10 }];
let food = {};
let dx = 0;
let dy = 0;
let score = 0;
let highScore = 0;
let gameRunning = false;
let aiMode = false;
let gameSpeed = 150;
let gameLoop;
let gameStarted = false; // Nouvelle variable pour savoir si le jeu a vraiment commencé

// IA Variables
let pathToFood = [];
let safetyMode = false;

function initGame() {
  snake = [{ x: 10, y: 10 }];
  dx = 0;
  dy = 0;
  score = 0;
  gameStarted = false; // Réinitialiser
  generateFood();
  updateDisplay();
}

function generateFood() {
  do {
    food = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount),
    };
  } while (
    snake.some((segment) => segment.x === food.x && segment.y === food.y)
  );
}

function drawGame() {
  // Effacer le canvas
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Dessiner la grille
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= tileCount; i++) {
    ctx.beginPath();
    ctx.moveTo(i * gridSize, 0);
    ctx.lineTo(i * gridSize, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * gridSize);
    ctx.lineTo(canvas.width, i * gridSize);
    ctx.stroke();
  }

  // Dessiner le serpent
  snake.forEach((segment, index) => {
    if (index === 0) {
      // Tête du serpent
      const gradient = ctx.createRadialGradient(
        segment.x * gridSize + gridSize / 2,
        segment.y * gridSize + gridSize / 2,
        0,
        segment.x * gridSize + gridSize / 2,
        segment.y * gridSize + gridSize / 2,
        gridSize / 2
      );
      gradient.addColorStop(0, "#4CAF50");
      gradient.addColorStop(1, "#2E7D32");
      ctx.fillStyle = gradient;
    } else {
      // Corps du serpent
      const intensity = Math.max(0.3, 1 - (index / snake.length) * 0.7);
      ctx.fillStyle = `rgba(76, 175, 80, ${intensity})`;
    }

    ctx.fillRect(
      segment.x * gridSize + 1,
      segment.y * gridSize + 1,
      gridSize - 2,
      gridSize - 2
    );
  });

  // Dessiner la nourriture
  const foodGradient = ctx.createRadialGradient(
    food.x * gridSize + gridSize / 2,
    food.y * gridSize + gridSize / 2,
    0,
    food.x * gridSize + gridSize / 2,
    food.y * gridSize + gridSize / 2,
    gridSize / 2
  );
  foodGradient.addColorStop(0, "#FF5722");
  foodGradient.addColorStop(1, "#D32F2F");
  ctx.fillStyle = foodGradient;
  ctx.fillRect(
    food.x * gridSize + 2,
    food.y * gridSize + 2,
    gridSize - 4,
    gridSize - 4
  );

  // Dessiner le chemin de l'IA (si activé)
  if (aiMode && pathToFood.length > 0) {
    ctx.strokeStyle = "rgba(255, 255, 0, 0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < pathToFood.length - 1; i++) {
      const current = pathToFood[i];
      const next = pathToFood[i + 1];
      ctx.moveTo(
        current.x * gridSize + gridSize / 2,
        current.y * gridSize + gridSize / 2
      );
      ctx.lineTo(
        next.x * gridSize + gridSize / 2,
        next.y * gridSize + gridSize / 2
      );
    }
    ctx.stroke();
  }

  // Afficher un message si le jeu n'a pas encore commencé en mode manuel
  if (!aiMode && !gameStarted && gameRunning) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = "16px Courier New";
    ctx.textAlign = "center";
    ctx.fillText("Appuyez sur une flèche pour commencer", canvas.width / 2, canvas.height / 2 + 50);
  }
}

function moveSnake() {
  // En mode manuel, ne pas bouger tant que le jeu n'a pas commencé
  if (!aiMode && !gameStarted) {
    return;
  }

  const head = { x: snake[0].x + dx, y: snake[0].y + dy };

  // Vérifier les collisions avec les murs
  if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
    gameOver();
    return;
  }

  // Vérifier les collisions avec le corps
  if (snake.some((segment) => segment.x === head.x && segment.y === head.y)) {
    gameOver();
    return;
  }

  snake.unshift(head);

  // Vérifier si la nourriture est mangée
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    generateFood();

    // Augmenter la vitesse progressivement
    if (score % 50 === 0 && gameSpeed > 50) {
      gameSpeed -= 10;
      clearInterval(gameLoop);
      gameLoop = setInterval(gameStep, gameSpeed);
    }
  } else {
    snake.pop();
  }

  updateDisplay();
}

function updateDisplay() {
  document.getElementById("score").textContent = score;
  document.getElementById("length").textContent = snake.length;
  document.getElementById("speed").textContent =
    Math.round((150 / gameSpeed) * 10) / 10 + "x";

  if (score > highScore) {
    highScore = score;
    document.getElementById("highScore").textContent = highScore;
  }
}

function gameStep() {
  if (aiMode) {
    aiMove();
  }
  moveSnake();
  drawGame();
}

function startGame() {
  if (!gameRunning) {
    aiMode = false;
    gameRunning = true;
    gameStarted = false; // Le jeu commencera quand le joueur appuiera sur une flèche
    gameSpeed = 150;
    initGame();
    gameLoop = setInterval(gameStep, gameSpeed);
    document.getElementById("aiStatus").textContent =
      "Mode Manuel - Appuyez sur une flèche pour commencer";
  }
}

function startAI() {
  if (!gameRunning) {
    aiMode = true;
    gameRunning = true;
    gameStarted = true; // L'IA commence immédiatement
    gameSpeed = 50; // IA plus rapide
    initGame();
    dx = 1; // Commencer par aller à droite
    dy = 0;
    gameLoop = setInterval(gameStep, gameSpeed);
    document.getElementById("aiStatus").textContent =
      "🤖 IA Active - Algorithme A* avec optimisations avancées";
  }
}

function pauseGame() {
  if (gameRunning) {
    clearInterval(gameLoop);
    gameRunning = false;
    document.getElementById("aiStatus").textContent += " (PAUSE)";
  } else if (gameLoop) {
    gameLoop = setInterval(gameStep, gameSpeed);
    gameRunning = true;
    document.getElementById("aiStatus").textContent = document
      .getElementById("aiStatus")
      .textContent.replace(" (PAUSE)", "");
  }
}

function resetGame() {
  clearInterval(gameLoop);
  gameRunning = false;
  aiMode = false;
  gameStarted = false;
  gameSpeed = 150;
  initGame();
  drawGame();
  document.getElementById("aiStatus").textContent =
    "Jeu réinitialisé - Choisissez votre mode";
}

function gameOver() {
  clearInterval(gameLoop);
  gameRunning = false;
  gameStarted = false;

  // Effet de game over
  ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.font = "48px Courier New";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);

  ctx.font = "24px Courier New";
  ctx.fillText(
    `Score Final: ${score}`,
    canvas.width / 2,
    canvas.height / 2 + 50
  );

  document.getElementById(
    "aiStatus"
  ).textContent = `Partie terminée! Score: ${score}`;
}

// Algorithme A* pour l'IA
function aStar(start, goal, obstacles) {
  const openSet = [start];
  const closedSet = [];
  const gScore = {};
  const fScore = {};
  const cameFrom = {};

  gScore[`${start.x},${start.y}`] = 0;
  fScore[`${start.x},${start.y}`] = heuristic(start, goal);

  while (openSet.length > 0) {
    let current = openSet.reduce((a, b) =>
      fScore[`${a.x},${a.y}`] < fScore[`${b.x},${b.y}`] ? a : b
    );

    if (current.x === goal.x && current.y === goal.y) {
      const path = [];
      while (current) {
        path.unshift(current);
        current = cameFrom[`${current.x},${current.y}`];
      }
      return path;
    }

    openSet.splice(openSet.indexOf(current), 1);
    closedSet.push(current);

    const neighbors = getNeighbors(current);
    for (const neighbor of neighbors) {
      if (
        closedSet.some((p) => p.x === neighbor.x && p.y === neighbor.y) ||
        obstacles.some((p) => p.x === neighbor.x && p.y === neighbor.y) ||
        neighbor.x < 0 ||
        neighbor.x >= tileCount ||
        neighbor.y < 0 ||
        neighbor.y >= tileCount
      ) {
        continue;
      }

      const tentativeGScore = gScore[`${current.x},${current.y}`] + 1;
      const neighborKey = `${neighbor.x},${neighbor.y}`;

      if (!openSet.some((p) => p.x === neighbor.x && p.y === neighbor.y)) {
        openSet.push(neighbor);
      } else if (tentativeGScore >= (gScore[neighborKey] || Infinity)) {
        continue;
      }

      cameFrom[neighborKey] = current;
      gScore[neighborKey] = tentativeGScore;
      fScore[neighborKey] = gScore[neighborKey] + heuristic(neighbor, goal);
    }
  }

  return [];
}

function heuristic(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function getNeighbors(point) {
  return [
    { x: point.x + 1, y: point.y },
    { x: point.x - 1, y: point.y },
    { x: point.x, y: point.y + 1 },
    { x: point.x, y: point.y - 1 },
  ];
}

function isSafeMove(head, direction) {
  const newHead = {
    x: head.x + direction.x,
    y: head.y + direction.y,
  };

  // Vérifier les limites
  if (
    newHead.x < 0 ||
    newHead.x >= tileCount ||
    newHead.y < 0 ||
    newHead.y >= tileCount
  ) {
    return false;
  }

  // Vérifier les collisions avec le corps (sauf la queue qui va bouger)
  const bodyToCheck = snake.slice(0, -1);
  return !bodyToCheck.some(
    (segment) => segment.x === newHead.x && segment.y === newHead.y
  );
}

function hasEscapeRoute(position) {
  // Vérifier s'il y a au moins un chemin vers un espace libre
  const visited = new Set();
  const queue = [position];
  let freeSpaces = 0;

  while (queue.length > 0 && freeSpaces < snake.length) {
    const current = queue.shift();
    const key = `${current.x},${current.y}`;

    if (visited.has(key)) continue;
    visited.add(key);
    freeSpaces++;

    const neighbors = getNeighbors(current);
    for (const neighbor of neighbors) {
      if (
        neighbor.x >= 0 &&
        neighbor.x < tileCount &&
        neighbor.y >= 0 &&
        neighbor.y < tileCount &&
        !visited.has(`${neighbor.x},${neighbor.y}`) &&
        !snake.some(
          (segment) => segment.x === neighbor.x && segment.y === neighbor.y
        )
      ) {
        queue.push(neighbor);
      }
    }
  }

  return freeSpaces >= snake.length;
}

function aiMove() {
  const head = snake[0];
  const obstacles = snake.slice(1); // Corps du serpent sans la tête

  // Calculer le chemin vers la nourriture
  pathToFood = aStar(head, food, obstacles);

  let nextMove = null;

  if (pathToFood.length > 1) {
    const nextPosition = pathToFood[1];
    const direction = {
      x: nextPosition.x - head.x,
      y: nextPosition.y - head.y,
    };

    // Vérifier si le mouvement est sûr et a une route d'échappement
    if (isSafeMove(head, direction) && hasEscapeRoute(nextPosition)) {
      nextMove = direction;
      safetyMode = false;
    } else {
      safetyMode = true;
    }
  }

  // Si pas de chemin sûr vers la nourriture, mode survie
  if (!nextMove || safetyMode) {
    const possibleMoves = [
      { x: 1, y: 0 }, // Droite
      { x: -1, y: 0 }, // Gauche
      { x: 0, y: 1 }, // Bas
      { x: 0, y: -1 }, // Haut
    ];

    // Trouver le mouvement le plus sûr
    let bestMove = null;
    let maxSpace = -1;

    for (const move of possibleMoves) {
      if (isSafeMove(head, move)) {
        const newPosition = {
          x: head.x + move.x,
          y: head.y + move.y,
        };

        if (hasEscapeRoute(newPosition)) {
          // Calculer l'espace disponible
          const visited = new Set();
          const queue = [newPosition];
          let spaceCount = 0;

          while (queue.length > 0) {
            const current = queue.shift();
            const key = `${current.x},${current.y}`;

            if (visited.has(key)) continue;
            visited.add(key);
            spaceCount++;

            if (spaceCount > maxSpace) {
              maxSpace = spaceCount;
              bestMove = move;
            }

            const neighbors = getNeighbors(current);
            for (const neighbor of neighbors) {
              if (
                neighbor.x >= 0 &&
                neighbor.x < tileCount &&
                neighbor.y >= 0 &&
                neighbor.y < tileCount &&
                !visited.has(`${neighbor.x},${neighbor.y}`) &&
                !snake.some(
                  (segment) =>
                    segment.x === neighbor.x && segment.y === neighbor.y
                )
              ) {
                queue.push(neighbor);
              }
            }
          }
        }
      }
    }

    nextMove = bestMove || possibleMoves.find((move) => isSafeMove(head, move));
  }

  // Appliquer le mouvement
  if (nextMove) {
    dx = nextMove.x;
    dy = nextMove.y;
  }
}

// Contrôles clavier
document.addEventListener("keydown", (e) => {
  if (!aiMode && gameRunning) {
    let moved = false;
    switch (e.key) {
      case "ArrowUp":
        if (dy !== 1) {
          dx = 0;
          dy = -1;
          moved = true;
        }
        break;
      case "ArrowDown":
        if (dy !== -1) {
          dx = 0;
          dy = 1;
          moved = true;
        }
        break;
      case "ArrowLeft":
        if (dx !== 1) {
          dx = -1;
          dy = 0;
          moved = true;
        }
        break;
      case "ArrowRight":
        if (dx !== -1) {
          dx = 1;
          dy = 0;
          moved = true;
        }
        break;
    }
    
    // Démarrer le jeu dès que le joueur appuie sur une flèche
    if (moved && !gameStarted) {
      gameStarted = true;
      document.getElementById("aiStatus").textContent =
        "Mode Manuel - Utilisez les flèches du clavier";
    }
  }
});

// Initialiser le jeu
initGame();
drawGame();