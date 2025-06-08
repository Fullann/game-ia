// Configuration du jeu
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 30;

// Canvas et contexte
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const nextCanvas = document.getElementById("nextPieceCanvas");
const nextCtx = nextCanvas.getContext("2d");

// État du jeu
let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let level = 1;
let lines = 0;
let gameRunning = false;
let gamePaused = false;
let robotMode = false;
let gameLoop = null;
let dropTime = 0;
let dropInterval = 1000;

// Définition des pièces Tetris
const PIECES = [
  {
    shape: [[1, 1, 1, 1]],
    color: "#00f5ff",
  },
  {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: "#ffff00",
  },
  {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    color: "#a000f0",
  },
  {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: "#00f000",
  },
  {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: "#f00000",
  },
  {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    color: "#ff8000",
  },
  {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    color: "#0000f0",
  },
];

// Initialisation du plateau
function initBoard() {
  board = Array(BOARD_HEIGHT)
    .fill()
    .map(() => Array(BOARD_WIDTH).fill(0));
}

// Création d'une nouvelle pièce
function createPiece() {
  const pieceType = Math.floor(Math.random() * PIECES.length);
  return {
    shape: PIECES[pieceType].shape,
    color: PIECES[pieceType].color,
    x:
      Math.floor(BOARD_WIDTH / 2) -
      Math.floor(PIECES[pieceType].shape[0].length / 2),
    y: 0,
  };
}

// Rotation d'une pièce
function rotatePiece(piece) {
  const rotated = [];
  const rows = piece.shape.length;
  const cols = piece.shape[0].length;

  for (let i = 0; i < cols; i++) {
    rotated[i] = [];
    for (let j = 0; j < rows; j++) {
      rotated[i][j] = piece.shape[rows - 1 - j][i];
    }
  }

  return {
    ...piece,
    shape: rotated,
  };
}

// Vérification de collision
function isValidPosition(piece, deltaX = 0, deltaY = 0) {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const newX = piece.x + x + deltaX;
        const newY = piece.y + y + deltaY;

        if (
          newX < 0 ||
          newX >= BOARD_WIDTH ||
          newY >= BOARD_HEIGHT ||
          (newY >= 0 && board[newY][newX])
        ) {
          return false;
        }
      }
    }
  }
  return true;
}

// Placement de la pièce sur le plateau
function placePiece(piece) {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const boardY = piece.y + y;
        const boardX = piece.x + x;
        if (boardY >= 0) {
          board[boardY][boardX] = piece.color;
        }
      }
    }
  }
}

// Suppression des lignes complètes
function clearLines() {
  let linesCleared = 0;

  for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
    if (board[y].every((cell) => cell !== 0)) {
      board.splice(y, 1);
      board.unshift(Array(BOARD_WIDTH).fill(0));
      linesCleared++;
      y++; // Vérifier à nouveau la même ligne
    }
  }

  if (linesCleared > 0) {
    lines += linesCleared;
    score += linesCleared * 100 * level;
    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(100, 1000 - (level - 1) * 100);
    updateUI();
  }
}

// Dessin du plateau
function drawBoard() {
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grille
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1;
  for (let x = 0; x <= BOARD_WIDTH; x++) {
    ctx.beginPath();
    ctx.moveTo(x * BLOCK_SIZE, 0);
    ctx.lineTo(x * BLOCK_SIZE, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= BOARD_HEIGHT; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * BLOCK_SIZE);
    ctx.lineTo(canvas.width, y * BLOCK_SIZE);
    ctx.stroke();
  }

  // Blocs placés
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      if (board[y][x]) {
        drawBlock(x * BLOCK_SIZE, y * BLOCK_SIZE, board[y][x]);
      }
    }
  }

  // Pièce actuelle
  if (currentPiece) {
    drawPiece(currentPiece);
  }
}

// Dessin d'un bloc
function drawBlock(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);

  // Effet 3D
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.fillRect(x + 1, y + 1, BLOCK_SIZE - 2, 3);
  ctx.fillRect(x + 1, y + 1, 3, BLOCK_SIZE - 2);

  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fillRect(x + BLOCK_SIZE - 4, y + 1, 3, BLOCK_SIZE - 2);
  ctx.fillRect(x + 1, y + BLOCK_SIZE - 4, BLOCK_SIZE - 2, 3);
}

// Dessin d'une pièce
function drawPiece(piece) {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const blockX = (piece.x + x) * BLOCK_SIZE;
        const blockY = (piece.y + y) * BLOCK_SIZE;
        drawBlock(blockX, blockY, piece.color);
      }
    }
  }
}

// Dessin de la prochaine pièce
function drawNextPiece() {
  nextCtx.fillStyle = "#222";
  nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

  if (nextPiece) {
    const blockSize = 15;
    const offsetX =
      (nextCanvas.width - nextPiece.shape[0].length * blockSize) / 2;
    const offsetY =
      (nextCanvas.height - nextPiece.shape.length * blockSize) / 2;

    for (let y = 0; y < nextPiece.shape.length; y++) {
      for (let x = 0; x < nextPiece.shape[y].length; x++) {
        if (nextPiece.shape[y][x]) {
          nextCtx.fillStyle = nextPiece.color;
          nextCtx.fillRect(
            offsetX + x * blockSize,
            offsetY + y * blockSize,
            blockSize - 1,
            blockSize - 1
          );
        }
      }
    }
  }
}

// Mise à jour de l'interface utilisateur
function updateUI() {
  document.getElementById("score").textContent = score;
  document.getElementById("level").textContent = level;
  document.getElementById("lines").textContent = lines;
  drawNextPiece();
}

// Déplacement de la pièce
function movePiece(deltaX, deltaY) {
  if (currentPiece && isValidPosition(currentPiece, deltaX, deltaY)) {
    currentPiece.x += deltaX;
    currentPiece.y += deltaY;
    return true;
  }
  return false;
}

// Rotation de la pièce
function rotateCurrentPiece() {
  if (currentPiece) {
    const rotated = rotatePiece(currentPiece);
    if (isValidPosition(rotated)) {
      currentPiece = rotated;
      return true;
    }
  }
  return false;
}

// Chute rapide
function hardDrop() {
  if (currentPiece) {
    while (movePiece(0, 1)) {
      score += 2;
    }
    updateUI();
  }
}

// Logique du robot IA
function getBestMove(piece) {
  let bestScore = -Infinity;
  let bestMove = null;

  // Essayer toutes les rotations
  let testPiece = { ...piece };
  for (let rotation = 0; rotation < 4; rotation++) {
    // Essayer toutes les positions horizontales
    for (let x = -2; x < BOARD_WIDTH + 2; x++) {
      testPiece.x = x;
      testPiece.y = 0;

      // Faire descendre la pièce jusqu'au bas
      while (isValidPosition(testPiece, 0, 1)) {
        testPiece.y++;
      }

      if (isValidPosition(testPiece)) {
        const moveScore = evaluateMove(testPiece);
        if (moveScore > bestScore) {
          bestScore = moveScore;
          bestMove = {
            x: testPiece.x,
            rotation: rotation,
            score: moveScore,
          };
        }
      }
    }
    testPiece = rotatePiece(testPiece);
  }

  return bestMove;
}

// Évaluation d'un mouvement
function evaluateMove(piece) {
  // Créer une copie du plateau
  const testBoard = board.map((row) => [...row]);

  // Placer la pièce temporairement
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const boardY = piece.y + y;
        const boardX = piece.x + x;
        if (
          boardY >= 0 &&
          boardY < BOARD_HEIGHT &&
          boardX >= 0 &&
          boardX < BOARD_WIDTH
        ) {
          testBoard[boardY][boardX] = piece.color;
        }
      }
    }
  }

  let score = 0;

  // Calculer les lignes complètes
  let completeLines = 0;
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    if (testBoard[y].every((cell) => cell !== 0)) {
      completeLines++;
    }
  }
  score += completeLines * 1000;

  // Pénalité pour la hauteur
  let maxHeight = 0;
  for (let x = 0; x < BOARD_WIDTH; x++) {
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      if (testBoard[y][x] !== 0) {
        maxHeight = Math.max(maxHeight, BOARD_HEIGHT - y);
        break;
      }
    }
  }
  score -= maxHeight * 10;

  // Pénalité pour les trous
  let holes = 0;
  for (let x = 0; x < BOARD_WIDTH; x++) {
    let foundBlock = false;
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      if (testBoard[y][x] !== 0) {
        foundBlock = true;
      } else if (foundBlock) {
        holes++;
      }
    }
  }
  score -= holes * 50;

  // Pénalité pour l'irrégularité de surface
  let bumpiness = 0;
  let heights = [];
  for (let x = 0; x < BOARD_WIDTH; x++) {
    let height = 0;
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      if (testBoard[y][x] !== 0) {
        height = BOARD_HEIGHT - y;
        break;
      }
    }
    heights.push(height);
  }

  for (let i = 0; i < heights.length - 1; i++) {
    bumpiness += Math.abs(heights[i] - heights[i + 1]);
  }
  score -= bumpiness * 5;

  return score;
}

// Exécution du mouvement du robot
function executeRobotMove() {
  if (!currentPiece || !robotMode) return;

  const bestMove = getBestMove(currentPiece);
  if (bestMove) {
    // Effectuer les rotations nécessaires
    for (let i = 0; i < bestMove.rotation; i++) {
      rotateCurrentPiece();
    }

    // Déplacer horizontalement
    const targetX = bestMove.x;
    while (currentPiece.x !== targetX && gameRunning) {
      if (currentPiece.x < targetX) {
        if (!movePiece(1, 0)) break;
      } else {
        if (!movePiece(-1, 0)) break;
      }
    }

    // Descendre rapidement
    hardDrop();
  }
}

// Boucle principale du jeu
function gameUpdate(timestamp) {
  if (!gameRunning || gamePaused) return;

  if (timestamp - dropTime > dropInterval) {
    if (currentPiece) {
      if (!movePiece(0, 1)) {
        placePiece(currentPiece);
        clearLines();

        currentPiece = nextPiece;
        nextPiece = createPiece();

        if (!isValidPosition(currentPiece)) {
          gameOver();
          return;
        }

        if (robotMode) {
          setTimeout(executeRobotMove, 100);
        }
      }
    } else {
      currentPiece = nextPiece || createPiece();
      nextPiece = createPiece();

      if (robotMode) {
        setTimeout(executeRobotMove, 100);
      }
    }

    dropTime = timestamp;
  }

  drawBoard();
  updateUI();

  if (gameRunning) {
    gameLoop = requestAnimationFrame(gameUpdate);
  }
}

// Fin de partie
function gameOver() {
  gameRunning = false;
  document.getElementById("finalScore").textContent = score;
  document.getElementById("gameOver").style.display = "block";
  document.getElementById("playBtn").textContent = "Rejouer";

  if (robotMode) {
    robotMode = false;
    document.getElementById("robotBtn").classList.remove("active");
    document.getElementById("modeIndicator").textContent = "MODE JOUEUR";
    document.getElementById("modeIndicator").className =
      "mode-indicator mode-human";
  }
}

// Démarrage/arrêt du jeu
function toggleGame() {
  if (gameRunning) {
    gameRunning = false;
    document.getElementById("playBtn").textContent = "Jouer";
  } else {
    if (score > 0) {
      resetGame();
    }
    startGame();
  }
}

// Démarrage du jeu
function startGame() {
  initBoard();
  currentPiece = createPiece();
  nextPiece = createPiece();
  score = 0;
  level = 1;
  lines = 0;
  dropInterval = 1000;
  gameRunning = true;
  gamePaused = false;
  dropTime = 0;

  document.getElementById("gameOver").style.display = "none";
  document.getElementById("playBtn").textContent = "Arrêter";

  updateUI();
  gameLoop = requestAnimationFrame(gameUpdate);

  if (robotMode) {
    setTimeout(executeRobotMove, 500);
  }
}

// Réinitialisation du jeu
function resetGame() {
  gameRunning = false;
  gamePaused = false;
  robotMode = false;

  document.getElementById("playBtn").textContent = "Jouer";
  document.getElementById("robotBtn").classList.remove("active");
  document.getElementById("modeIndicator").textContent = "MODE JOUEUR";
  document.getElementById("modeIndicator").className =
    "mode-indicator mode-human";
  document.getElementById("gameOver").style.display = "none";

  if (gameLoop) {
    cancelAnimationFrame(gameLoop);
  }
}

// Activation/désactivation du robot
function toggleRobot() {
  robotMode = !robotMode;

  if (robotMode) {
    document.getElementById("robotBtn").classList.add("active");
    document.getElementById("robotBtn").textContent = "Arrêter Robot";
    document.getElementById("modeIndicator").textContent = "MODE ROBOT IA";
    document.getElementById("modeIndicator").className =
      "mode-indicator mode-robot";

    if (!gameRunning) {
      startGame();
    }
    executeRobotMove();
  } else {
    document.getElementById("robotBtn").classList.remove("active");
    document.getElementById("robotBtn").textContent = "Robot IA";
    document.getElementById("modeIndicator").textContent = "MODE JOUEUR";
    document.getElementById("modeIndicator").className =
      "mode-indicator mode-human";
  }
}

// Pause du jeu
function pauseGame() {
  if (gameRunning) {
    gamePaused = !gamePaused;
    document.getElementById("pauseBtn").textContent = gamePaused
      ? "Reprendre"
      : "Pause";

    if (!gamePaused) {
      gameLoop = requestAnimationFrame(gameUpdate);
    }
  }
}

// Contrôles clavier
document.addEventListener("keydown", (e) => {
  if (!gameRunning || gamePaused || robotMode) return;

  switch (e.key) {
    case "ArrowLeft":
      e.preventDefault();
      movePiece(-1, 0);
      break;
    case "ArrowRight":
      e.preventDefault();
      movePiece(1, 0);
      break;
    case "ArrowDown":
      e.preventDefault();
      if (movePiece(0, 1)) {
        score += 1;
        updateUI();
      }
      break;
    case "ArrowUp":
      e.preventDefault();
      rotateCurrentPiece();
      break;
    case " ":
      e.preventDefault();
      hardDrop();
      break;
  }

  drawBoard();
});

// Initialisation
initBoard();
drawBoard();
updateUI();
