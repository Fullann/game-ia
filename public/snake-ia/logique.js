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
let gameStarted = false;

// IA Variables avancées
let pathToFood = [];
let safetyMode = false;
let hamiltonianCycle = [];
let useHamiltonian = false;
let virtualSnake = [];
let lastMoves = [];
let survivalPriority = false;

// Stratégies d'IA
const AI_STRATEGIES = {
  AGGRESSIVE: 'aggressive',
  CONSERVATIVE: 'conservative',
  ADAPTIVE: 'adaptive',
  HAMILTONIAN: 'hamiltonian'
};

let currentStrategy = AI_STRATEGIES.ADAPTIVE;

function initGame() {
  snake = [{ x: 10, y: 10 }];
  dx = 0;
  dy = 0;
  score = 0;
  gameStarted = false;
  lastMoves = [];
  survivalPriority = false;
  generateFood();
  generateHamiltonianCycle();
  updateDisplay();
}

function generateFood() {
  let attempts = 0;
  do {
    food = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount),
    };
    attempts++;
  } while (
    snake.some((segment) => segment.x === food.x && segment.y === food.y) &&
    attempts < 100
  );
}

// Génération du cycle hamiltonien pour une stratégie de survie garantie
function generateHamiltonianCycle() {
  hamiltonianCycle = [];
  const visited = new Set();
  
  // Créer un cycle simple en zigzag
  for (let y = 0; y < tileCount; y++) {
    if (y % 2 === 0) {
      // Ligne paire: de gauche à droite
      for (let x = 0; x < tileCount; x++) {
        hamiltonianCycle.push({ x, y });
      }
    } else {
      // Ligne impaire: de droite à gauche
      for (let x = tileCount - 1; x >= 0; x--) {
        hamiltonianCycle.push({ x, y });
      }
    }
  }
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

  // Dessiner le serpent avec gradient amélioré
  snake.forEach((segment, index) => {
    if (index === 0) {
      // Tête du serpent avec eyes
      const gradient = ctx.createRadialGradient(
        segment.x * gridSize + gridSize / 2,
        segment.y * gridSize + gridSize / 2,
        0,
        segment.x * gridSize + gridSize / 2,
        segment.y * gridSize + gridSize / 2,
        gridSize / 2
      );
      gradient.addColorStop(0, aiMode ? "#4CAF50" : "#2196F3");
      gradient.addColorStop(1, aiMode ? "#2E7D32" : "#1976D2");
      ctx.fillStyle = gradient;
      
      ctx.fillRect(
        segment.x * gridSize + 1,
        segment.y * gridSize + 1,
        gridSize - 2,
        gridSize - 2
      );
      
      // Dessiner les yeux
      ctx.fillStyle = "white";
      const eyeSize = 3;
      ctx.fillRect(
        segment.x * gridSize + 5,
        segment.y * gridSize + 5,
        eyeSize,
        eyeSize
      );
      ctx.fillRect(
        segment.x * gridSize + gridSize - 8,
        segment.y * gridSize + 5,
        eyeSize,
        eyeSize
      );
    } else {
      // Corps du serpent avec dégradé
      const intensity = Math.max(0.2, 1 - (index / snake.length) * 0.8);
      const color = aiMode ? 
        `rgba(76, 175, 80, ${intensity})` : 
        `rgba(33, 150, 243, ${intensity})`;
      ctx.fillStyle = color;
      
      ctx.fillRect(
        segment.x * gridSize + 1,
        segment.y * gridSize + 1,
        gridSize - 2,
        gridSize - 2
      );
    }
  });

  // Dessiner la nourriture avec animation
  const time = Date.now() / 200;
  const pulse = Math.sin(time) * 0.1 + 0.9;
  const foodSize = (gridSize - 4) * pulse;
  const offset = (gridSize - foodSize) / 2;
  
  const foodGradient = ctx.createRadialGradient(
    food.x * gridSize + gridSize / 2,
    food.y * gridSize + gridSize / 2,
    0,
    food.x * gridSize + gridSize / 2,
    food.y * gridSize + gridSize / 2,
    foodSize / 2
  );
  foodGradient.addColorStop(0, "#FF5722");
  foodGradient.addColorStop(0.7, "#D32F2F");
  foodGradient.addColorStop(1, "#B71C1C");
  ctx.fillStyle = foodGradient;
  
  ctx.fillRect(
    food.x * gridSize + offset,
    food.y * gridSize + offset,
    foodSize,
    foodSize
  );

  // Dessiner le chemin de l'IA avec différentes couleurs selon la stratégie
  if (aiMode && pathToFood.length > 0) {
    const pathColor = getStrategyColor();
    ctx.strokeStyle = pathColor;
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    
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
    ctx.setLineDash([]);
  }

  // Cycle hamiltonien en arrière-plan
  if (aiMode && useHamiltonian && hamiltonianCycle.length > 0) {
    ctx.strokeStyle = "rgba(255, 165, 0, 0.2)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    
    ctx.beginPath();
    for (let i = 0; i < hamiltonianCycle.length - 1; i++) {
      const current = hamiltonianCycle[i];
      const next = hamiltonianCycle[i + 1];
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
    ctx.setLineDash([]);
  }

  // Message d'attente en mode manuel
  if (!aiMode && !gameStarted && gameRunning) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "18px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Appuyez sur une flèche pour commencer", canvas.width / 2, canvas.height / 2 + 50);
  }
}

function getStrategyColor() {
  switch (currentStrategy) {
    case AI_STRATEGIES.AGGRESSIVE: return "rgba(255, 0, 0, 0.6)";
    case AI_STRATEGIES.CONSERVATIVE: return "rgba(0, 255, 0, 0.6)";
    case AI_STRATEGIES.ADAPTIVE: return "rgba(255, 255, 0, 0.6)";
    case AI_STRATEGIES.HAMILTONIAN: return "rgba(255, 165, 0, 0.6)";
    default: return "rgba(255, 255, 255, 0.6)";
  }
}

function moveSnake() {
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

    // Adaptation de la stratégie selon la taille
    adaptStrategy();

    // Augmenter la vitesse progressivement
    if (score % 50 === 0 && gameSpeed > 30) {
      gameSpeed -= 5;
      clearInterval(gameLoop);
      gameLoop = setInterval(gameStep, gameSpeed);
    }
  } else {
    snake.pop();
  }

  // Enregistrer les derniers mouvements pour détecter les boucles
  if (aiMode) {
    lastMoves.push({ x: dx, y: dy });
    if (lastMoves.length > 20) {
      lastMoves.shift();
    }
  }

  updateDisplay();
}

function adaptStrategy() {
  const spaceUsed = snake.length / (tileCount * tileCount);
  
  if (spaceUsed < 0.3) {
    currentStrategy = AI_STRATEGIES.AGGRESSIVE;
  } else if (spaceUsed < 0.6) {
    currentStrategy = AI_STRATEGIES.ADAPTIVE;
  } else if (spaceUsed < 0.8) {
    currentStrategy = AI_STRATEGIES.CONSERVATIVE;
  } else {
    currentStrategy = AI_STRATEGIES.HAMILTONIAN;
    useHamiltonian = true;
  }
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
    gameStarted = false;
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
    gameStarted = true;
    gameSpeed = 60;
    currentStrategy = AI_STRATEGIES.AGGRESSIVE;
    useHamiltonian = false;
    initGame();
    dx = 1;
    dy = 0;
    gameLoop = setInterval(gameStep, gameSpeed);
    updateAIStatus();
  }
}

function updateAIStatus() {
  const strategyNames = {
    [AI_STRATEGIES.AGGRESSIVE]: "Agressif",
    [AI_STRATEGIES.CONSERVATIVE]: "Conservateur", 
    [AI_STRATEGIES.ADAPTIVE]: "Adaptatif",
    [AI_STRATEGIES.HAMILTONIAN]: "Hamiltonien"
  };
  
  document.getElementById("aiStatus").textContent =
    `🤖 IA Active - Stratégie: ${strategyNames[currentStrategy]} ${survivalPriority ? '(Mode Survie)' : ''}`;
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
  useHamiltonian = false;
  survivalPriority = false;
  currentStrategy = AI_STRATEGIES.ADAPTIVE;
  initGame();
  drawGame();
  document.getElementById("aiStatus").textContent =
    "Jeu réinitialisé - Choisissez votre mode";
}

function gameOver() {
  clearInterval(gameLoop);
  gameRunning = false;
  gameStarted = false;

  // Effet de game over amélioré
  ctx.fillStyle = "rgba(255, 0, 0, 0.4)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.font = "48px Arial";
  ctx.textAlign = "center";
  ctx.shadowColor = "black";
  ctx.shadowBlur = 10;
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);

  ctx.font = "24px Arial";
  ctx.fillText(
    `Score Final: ${score}`,
    canvas.width / 2,
    canvas.height / 2 + 50
  );
  
  ctx.fillText(
    `Longueur: ${snake.length}`,
    canvas.width / 2,
    canvas.height / 2 + 80
  );

  ctx.shadowBlur = 0;

  document.getElementById("aiStatus").textContent = 
    `Partie terminée! Score: ${score} | Longueur: ${snake.length}`;
}

// Algorithmes d'IA améliorés

// A* amélioré avec heuristiques multiples
function improvedAStar(start, goal, obstacles, heuristicWeight = 1) {
  const openSet = [start];
  const closedSet = [];
  const gScore = {};
  const fScore = {};
  const cameFrom = {};

  gScore[`${start.x},${start.y}`] = 0;
  fScore[`${start.x},${start.y}`] = 
    heuristicWeight * manhattanDistance(start, goal) +
    0.5 * euclideanDistance(start, goal);

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
      fScore[neighborKey] = gScore[neighborKey] + 
        heuristicWeight * manhattanDistance(neighbor, goal) +
        0.5 * euclideanDistance(neighbor, goal);
    }
  }

  return [];
}

function manhattanDistance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function euclideanDistance(a, b) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

function getNeighbors(point) {
  return [
    { x: point.x + 1, y: point.y },
    { x: point.x - 1, y: point.y },
    { x: point.x, y: point.y + 1 },
    { x: point.x, y: point.y - 1 },
  ];
}

// Simulation virtuelle pour prévoir les mouvements
function simulateMove(virtualSnake, direction, steps = 5) {
  const simulation = virtualSnake.map(segment => ({ ...segment }));
  
  for (let i = 0; i < steps; i++) {
    const head = { 
      x: simulation[0].x + direction.x, 
      y: simulation[0].y + direction.y 
    };
    
    // Vérifier les collisions
    if (
      head.x < 0 || head.x >= tileCount ||
      head.y < 0 || head.y >= tileCount ||
      simulation.some(segment => segment.x === head.x && segment.y === head.y)
    ) {
      return false; // Collision détectée
    }
    
    simulation.unshift(head);
    simulation.pop();
  }
  
  return true; // Mouvement sûr
}

// Détection de boucles infinies
function detectLoop() {
  if (lastMoves.length < 8) return false;
  
  const recent = lastMoves.slice(-8);
  const pattern = recent.slice(0, 4);
  const repeat = recent.slice(4, 8);
  
  return pattern.every((move, i) => 
    move.x === repeat[i].x && move.y === repeat[i].y
  );
}

// Évaluation de la sécurité d'une position (moins restrictive pour les bords)
function evaluatePositionSafety(position, depth = 4) {
  let safetyScore = 0;
  const visited = new Set();
  const queue = [{ pos: position, dist: 0 }];
  
  // Bonus pour les positions près des bords si elles ont des sorties
  const nearBorder = (position.x <= 1 || position.x >= tileCount - 2 || 
                     position.y <= 1 || position.y >= tileCount - 2);
  
  while (queue.length > 0) {
    const { pos, dist } = queue.shift();
    const key = `${pos.x},${pos.y}`;
    
    if (visited.has(key) || dist > depth) continue;
    visited.add(key);
    
    // Score de base
    safetyScore += (depth - dist + 1);
    
    // Bonus pour les positions près des bords avec suffisamment d'espace
    if (nearBorder && dist === 0) {
      safetyScore += 5;
    }
    
    const neighbors = getNeighbors(pos);
    for (const neighbor of neighbors) {
      if (
        neighbor.x >= 0 && neighbor.x < tileCount &&
        neighbor.y >= 0 && neighbor.y < tileCount &&
        !visited.has(`${neighbor.x},${neighbor.y}`) &&
        !snake.some(segment => segment.x === neighbor.x && segment.y === neighbor.y)
      ) {
        queue.push({ pos: neighbor, dist: dist + 1 });
      }
    }
  }
  
  return safetyScore;
}

// Algorithme principal d'IA avec logique améliorée
function aiMove() {
  const head = snake[0];
  const obstacles = snake.slice(1);
  
  // Réduire la sensibilité à la détection de boucles
  if (detectLoop() && snake.length > 15) { // Ne s'activer que pour les serpents plus longs
    survivalPriority = true;
  }
  
  // Mettre à jour le statut de l'IA
  updateAIStatus();
  
  let nextMove = null;
  
  // Choisir la stratégie selon le mode
  switch (currentStrategy) {
    case AI_STRATEGIES.AGGRESSIVE:
      nextMove = aggressiveStrategy(head, obstacles);
      break;
    case AI_STRATEGIES.CONSERVATIVE:
      nextMove = conservativeStrategy(head, obstacles);
      break;
    case AI_STRATEGIES.ADAPTIVE:
      nextMove = adaptiveStrategy(head, obstacles);
      break;
    case AI_STRATEGIES.HAMILTONIAN:
      nextMove = hamiltonianStrategy(head);
      break;
  }
  
  // Mode survie seulement si vraiment nécessaire
  if (!nextMove && (survivalPriority || snake.length > 20)) {
    nextMove = survivalStrategy(head);
    if (nextMove) {
      survivalPriority = false; // Réinitialiser après avoir trouvé une solution
    }
  }
  
  // Si toujours pas de mouvement, forcer une direction sûre
  if (!nextMove) {
    const possibleMoves = [
      { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }
    ];
    
    for (const move of possibleMoves) {
      const newPos = { x: head.x + move.x, y: head.y + move.y };
      if (newPos.x >= 0 && newPos.x < tileCount && 
          newPos.y >= 0 && newPos.y < tileCount &&
          !snake.some(segment => segment.x === newPos.x && segment.y === newPos.y)) {
        nextMove = move;
        break;
      }
    }
  }
  
  // Appliquer le mouvement
  if (nextMove) {
    dx = nextMove.x;
    dy = nextMove.y;
  }
}

// Vérification améliorée de sécurité avec tolerance pour les bords
function isPathSafeToFood(head, foodPos) {
  // Si la nourriture est proche, être moins strict
  const distanceToFood = manhattanDistance(head, foodPos);
  if (distanceToFood <= 3) {
    return true; // Accepter les risques pour la nourriture proche
  }
  
  // Simuler le chemin vers la nourriture
  const tempObstacles = snake.slice(1, -2); // Ignorer les 2 derniers segments qui vont bouger
  const pathTest = improvedAStar(head, foodPos, tempObstacles, 0.8);
  
  if (pathTest.length < 2) return false;
  
  const nextPos = pathTest[1];
  const direction = {
    x: nextPos.x - head.x,
    y: nextPos.y - head.y
  };
  
  // Vérifier que le chemin garde des options ouvertes
  const safetyAfterMove = evaluatePositionSafety(nextPos, 3);
  const minSafety = Math.max(8, snake.length * 0.3); // Seuil adaptatif
  
  return safetyAfterMove >= minSafety;
}

function aggressiveStrategy(head, obstacles) {
  // Chemin direct vers la nourriture avec évaluation intelligente
  pathToFood = improvedAStar(head, food, obstacles, 1.0);
  
  if (pathToFood.length > 1) {
    const nextPos = pathToFood[1];
    const direction = {
      x: nextPos.x - head.x,
      y: nextPos.y - head.y
    };
    
    // Vérifier si le chemin vers la nourriture est sûr
    if (isPathSafeToFood(head, food) && simulateMove(snake, direction, 2)) {
      return direction;
    }
  }
  
  return null;
}

function conservativeStrategy(head, obstacles) {
  // Version moins restrictive du mode conservateur
  pathToFood = improvedAStar(head, food, obstacles, 0.9);
  
  if (pathToFood.length > 1) {
    const nextPos = pathToFood[1];
    const direction = {
      x: nextPos.x - head.x,
      y: nextPos.y - head.y
    };
    
    const newPosition = {
      x: head.x + direction.x,
      y: head.y + direction.y
    };
    
    // Critères moins stricts pour la sécurité
    const distanceToFood = manhattanDistance(head, food);
    const safetyThreshold = distanceToFood <= 5 ? snake.length * 0.4 : snake.length * 0.6;
    
    if (simulateMove(snake, direction, 3) && 
        evaluatePositionSafety(newPosition, 3) >= safetyThreshold) {
      return direction;
    }
  }
  
  return null;
}

function adaptiveStrategy(head, obstacles) {
  // Combiner agressif et conservateur selon la situation
  const spaceUsed = snake.length / (tileCount * tileCount);
  
  if (spaceUsed < 0.5) {
    return aggressiveStrategy(head, obstacles);
  } else {
    return conservativeStrategy(head, obstacles);
  }
}

function hamiltonianStrategy(head) {
  // Suivre le cycle hamiltonien
  const currentIndex = hamiltonianCycle.findIndex(
    pos => pos.x === head.x && pos.y === head.y
  );
  
  if (currentIndex !== -1) {
    const nextIndex = (currentIndex + 1) % hamiltonianCycle.length;
    const nextPos = hamiltonianCycle[nextIndex];
    
    return {
      x: nextPos.x - head.x,
      y: nextPos.y - head.y
    };
  }
  
  // Si pas sur le cycle, essayer de rejoindre le cycle
  const closestCyclePos = hamiltonianCycle.reduce((closest, pos) => {
    const distToCurrent = manhattanDistance(head, pos);
    const distToClosest = manhattanDistance(head, closest);
    return distToCurrent < distToClosest ? pos : closest;
  });
  
  const path = improvedAStar(head, closestCyclePos, snake.slice(1));
  if (path.length > 1) {
    const nextPos = path[1];
    return {
      x: nextPos.x - head.x,
      y: nextPos.y - head.y
    };
  }
  
  return null;
}

function survivalStrategy(head) {
  const possibleMoves = [
    { x: 1, y: 0 },   // Droite
    { x: -1, y: 0 },  // Gauche
    { x: 0, y: 1 },   // Bas
    { x: 0, y: -1 }   // Haut
  ];
  
  let bestMove = null;
  let bestScore = -1;
  
  // D'abord, essayer d'aller vers la nourriture si c'est possible
  const distanceToFood = manhattanDistance(head, food);
  
  for (const move of possibleMoves) {
    const newPos = {
      x: head.x + move.x,
      y: head.y + move.y
    };
    
    // Vérifier les limites et collisions
    if (
      newPos.x < 0 || newPos.x >= tileCount ||
      newPos.y < 0 || newPos.y >= tileCount ||
      snake.some(segment => segment.x === newPos.x && segment.y === newPos.y)
    ) {
      continue;
    }
    
    // Évaluer la sécurité de cette position
    let safetyScore = evaluatePositionSafety(newPos, 4);
    const simulationSafe = simulateMove(snake, move, 4);
    
    // Bonus si le mouvement nous rapproche de la nourriture
    const newDistanceToFood = manhattanDistance(newPos, food);
    if (newDistanceToFood < distanceToFood) {
      safetyScore += 15; // Bonus pour se rapprocher de la nourriture
    }
    
    // Bonus supplémentaire si on peut atteindre la nourriture facilement
    if (distanceToFood <= 3 && newDistanceToFood <= 2) {
      safetyScore += 25;
    }
    
    const totalScore = safetyScore + (simulationSafe ? 50 : 0);
    
    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestMove = move;
    }
  }
  
  return bestMove;
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