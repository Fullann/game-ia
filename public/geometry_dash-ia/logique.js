// Configuration du jeu
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Variables globales
let gameState = "playing"; // 'playing', 'editing', 'bot'
let gameRunning = false;
let score = 0;
let bestScore = parseInt(localStorage.getItem("bestScore") || "0");
let gameSpeed = 3;
let currentLevel = 0;
let botMode = false;
let botDecisionDistance = 150;

// Joueur
const player = {
  x: 100,
  y: canvas.height - 150,
  width: 30,
  height: 30,
  velocityY: 0,
  jumpPower: -15,
  gravity: 0.8,
  grounded: false,
  rotation: 0,
};

// Obstacles et niveaux
let obstacles = [];
let particles = [];

// Niveaux prédéfinis
const levels = [
  // Niveau 1 - Facile
  [
    { type: "spike", x: 400, y: canvas.height - 50 },
    { type: "block", x: 600, y: canvas.height - 80 },
    { type: "spike", x: 800, y: canvas.height - 50 },
    { type: "platform", x: 1000, y: canvas.height - 120, width: 100 },
    { type: "spike", x: 1200, y: canvas.height - 50 },
  ],
  // Niveau 2 - Moyen
  [
    { type: "spike", x: 300, y: canvas.height - 50 },
    { type: "spike", x: 350, y: canvas.height - 50 },
    { type: "block", x: 500, y: canvas.height - 80 },
    { type: "block", x: 530, y: canvas.height - 110 },
    { type: "spike", x: 700, y: canvas.height - 50 },
    { type: "platform", x: 850, y: canvas.height - 100, width: 80 },
    { type: "spike", x: 1050, y: canvas.height - 50 },
    { type: "spike", x: 1100, y: canvas.height - 50 },
  ],
  // Niveau 3 - Difficile
  [
    { type: "spike", x: 250, y: canvas.height - 50 },
    { type: "block", x: 350, y: canvas.height - 80 },
    { type: "spike", x: 450, y: canvas.height - 50 },
    { type: "block", x: 550, y: canvas.height - 110 },
    { type: "spike", x: 650, y: canvas.height - 50 },
    { type: "platform", x: 750, y: canvas.height - 90, width: 60 },
    { type: "spike", x: 900, y: canvas.height - 50 },
    { type: "block", x: 1000, y: canvas.height - 140 },
    { type: "spike", x: 1150, y: canvas.height - 50 },
    { type: "spike", x: 1200, y: canvas.height - 50 },
  ],
];

// Niveau personnalisé
let customLevel = [];

let camera = { x: 0 };

// Initialisation
function init() {
  loadLevel(currentLevel);
  updateUI();
  createLevelSelector();
  gameLoop();
}

// Gestion des événements
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && gameState === "playing") {
    e.preventDefault();
    jump();
  }
  if (e.code === "KeyR") {
    restartGame();
  }
});

canvas.addEventListener("click", (e) => {
  if (gameState === "playing") {
    jump();
  } else if (gameState === "editing") {
    placeObstacle(e);
  }
});

// Fonctions du joueur
function jump() {
  if (player.grounded && gameRunning) {
    player.velocityY = player.jumpPower;
    player.grounded = false;
    createJumpParticles();
  }
}

function updatePlayer() {
  // Physique
  player.velocityY += player.gravity;
  player.y += player.velocityY;

  // Rotation
  if (!player.grounded) {
    player.rotation += 5;
  } else {
    player.rotation = 0;
  }

  // Sol
  const groundY = canvas.height - 100;
  if (player.y + player.height >= groundY) {
    player.y = groundY - player.height;
    player.velocityY = 0;
    player.grounded = true;
  }

  // Caméra suit le joueur
  camera.x = player.x - 200;
}

// Bot IA avec apprentissage simple
function updateBot() {
  if (!botMode || !gameRunning) return;

  // Regarde les obstacles à venir
  const upcomingObstacles = obstacles.filter(
    (obs) => obs.x > player.x && obs.x < player.x + botDecisionDistance
  );

  if (upcomingObstacles.length > 0) {
    const nearestObstacle = upcomingObstacles[0];
    const distanceToObstacle = nearestObstacle.x - player.x;

    // Décision de saut basée sur la distance et le type d'obstacle
    let shouldJump = false;

    if (nearestObstacle.type === "spike" && distanceToObstacle < 100) {
      shouldJump = true;
    } else if (nearestObstacle.type === "block" && distanceToObstacle < 80) {
      shouldJump = true;
    } else if (nearestObstacle.type === "platform") {
      const platformTop = nearestObstacle.y;
      const playerBottom = player.y + player.height;
      if (playerBottom > platformTop && distanceToObstacle < 100) {
        shouldJump = true;
      }
    }

    if (shouldJump && player.grounded) {
      jump();
    }
  }
}

// Gestion des obstacles
function updateObstacles() {
  obstacles.forEach((obstacle) => {
    obstacle.x -= gameSpeed;
  });

  // Supprimer les obstacles hors écran
  obstacles = obstacles.filter((obs) => obs.x > -100);

  // Ajouter de nouveaux obstacles
  if (obstacles.length > 0) {
    const lastObstacle = obstacles[obstacles.length - 1];
    if (lastObstacle.x < canvas.width) {
      generateMoreObstacles();
    }
  }
}

function generateMoreObstacles() {
  const baseX =
    Math.max(...obstacles.map((o) => o.x)) + 200 + Math.random() * 200;
  const obstacleTypes = ["spike", "block", "platform"];
  const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];

  let newObstacle = {
    type: type,
    x: baseX,
    y: canvas.height - 50,
  };

  if (type === "block") {
    newObstacle.y = canvas.height - 80;
  } else if (type === "platform") {
    newObstacle.y = canvas.height - 100 - Math.random() * 50;
    newObstacle.width = 60 + Math.random() * 40;
  }

  obstacles.push(newObstacle);
}

// Détection de collision
function checkCollisions() {
  obstacles.forEach((obstacle) => {
    if (isColliding(player, obstacle)) {
      gameOver();
    }
  });
}

function isColliding(rect1, obstacle) {
  const buffer = 5; // Marge pour rendre le jeu plus indulgent

  if (obstacle.type === "platform") {
    return (
      rect1.x < obstacle.x + obstacle.width - buffer &&
      rect1.x + rect1.width > obstacle.x + buffer &&
      rect1.y < obstacle.y + 20 - buffer &&
      rect1.y + rect1.height > obstacle.y + buffer
    );
  }

  return (
    rect1.x < obstacle.x + 30 - buffer &&
    rect1.x + rect1.width > obstacle.x + buffer &&
    rect1.y < obstacle.y + 30 - buffer &&
    rect1.y + rect1.height > obstacle.y + buffer
  );
}

// Système de particules
function createJumpParticles() {
  for (let i = 0; i < 5; i++) {
    particles.push({
      x: player.x + player.width / 2,
      y: player.y + player.height,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * -3 - 1,
      life: 30,
      maxLife: 30,
    });
  }
}

function updateParticles() {
  particles.forEach((particle) => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.2;
    particle.life--;
  });

  particles = particles.filter((p) => p.life > 0);
}

// Rendu
function render() {
  // Effacer l'écran
  ctx.fillStyle = "rgba(26, 26, 46, 0.1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grille d'arrière-plan
  drawBackground();

  ctx.save();
  ctx.translate(-camera.x, 0);

  // Sol
  ctx.fillStyle = "#2d3436";
  ctx.fillRect(0, canvas.height - 100, canvas.width + camera.x + 200, 100);

  // Ligne de sol
  ctx.strokeStyle = "#00ff88";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - 100);
  ctx.lineTo(canvas.width + camera.x + 200, canvas.height - 100);
  ctx.stroke();

  // Obstacles
  obstacles.forEach(drawObstacle);

  // Joueur
  drawPlayer();

  // Particules
  particles.forEach(drawParticle);

  ctx.restore();
}

function drawBackground() {
  ctx.strokeStyle = "rgba(0, 255, 136, 0.1)";
  ctx.lineWidth = 1;

  // Lignes verticales
  for (let x = -camera.x % 50; x < canvas.width; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // Lignes horizontales
  for (let y = 0; y < canvas.height; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
  ctx.rotate((player.rotation * Math.PI) / 180);

  // Corps principal
  ctx.fillStyle = "#00ff88";
  ctx.fillRect(
    -player.width / 2,
    -player.height / 2,
    player.width,
    player.height
  );

  // Contour brillant
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.strokeRect(
    -player.width / 2,
    -player.height / 2,
    player.width,
    player.height
  );

  // Effet de lueur
  ctx.shadowColor = "#00ff88";
  ctx.shadowBlur = 10;
  ctx.fillRect(
    -player.width / 2,
    -player.height / 2,
    player.width,
    player.height
  );

  ctx.restore();
}

function drawObstacle(obstacle) {
  ctx.save();

  switch (obstacle.type) {
    case "spike":
      ctx.fillStyle = "#ff6b6b";
      ctx.beginPath();
      ctx.moveTo(obstacle.x + 15, obstacle.y);
      ctx.lineTo(obstacle.x, obstacle.y + 30);
      ctx.lineTo(obstacle.x + 30, obstacle.y + 30);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();
      break;

    case "block":
      ctx.fillStyle = "#636e72";
      ctx.fillRect(obstacle.x, obstacle.y, 30, 30);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.strokeRect(obstacle.x, obstacle.y, 30, 30);
      break;

    case "platform":
      ctx.fillStyle = "#a29bfe";
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, 20);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, 20);
      break;
  }

  ctx.restore();
}

function drawParticle(particle) {
  const alpha = particle.life / particle.maxLife;
  ctx.fillStyle = `rgba(0, 255, 136, ${alpha})`;
  ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
}

// Gestion du jeu
function gameLoop() {
  if (gameRunning) {
    updatePlayer();
    updateBot();
    updateObstacles();
    updateParticles();
    checkCollisions();

    // Score
    score += 1;
    player.x += gameSpeed;

    // Augmenter la difficulté
    if (score % 500 === 0) {
      gameSpeed += 0.2;
    }
  }

  render();
  updateUI();
  requestAnimationFrame(gameLoop);
}

function startGame() {
  gameRunning = true;
  resetPlayer();
  score = 0;
  gameSpeed = 3;
  loadLevel(currentLevel);
  document.getElementById("gameOver").style.display = "none";
}

function gameOver() {
  gameRunning = false;

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("bestScore", bestScore.toString());
  }

  document.getElementById("finalScore").textContent = score;
  document.getElementById("gameOver").style.display = "block";
}

function restartGame() {
  startGame();
}

function resetPlayer() {
  player.x = 100;
  player.y = canvas.height - 150;
  player.velocityY = 0;
  player.grounded = false;
  player.rotation = 0;
  camera.x = 0;
}

// Système de niveaux
function loadLevel(levelIndex) {
  obstacles = [];
  if (levelIndex < levels.length) {
    obstacles = [...levels[levelIndex]];
  } else {
    obstacles = [...customLevel];
  }
}

function createLevelSelector() {
  const selector = document.getElementById("levelSelector");
  selector.innerHTML = "";

  levels.forEach((_, index) => {
    const btn = document.createElement("div");
    btn.className = "level-item";
    btn.textContent = `Niveau ${index + 1}`;
    btn.onclick = () => selectLevel(index);
    selector.appendChild(btn);
  });

  if (customLevel.length > 0) {
    const btn = document.createElement("div");
    btn.className = "level-item";
    btn.textContent = "Custom";
    btn.onclick = () => selectLevel(levels.length);
    selector.appendChild(btn);
  }

  updateLevelSelector();
}

function selectLevel(index) {
  currentLevel = index;
  loadLevel(currentLevel);
  updateLevelSelector();
  if (gameRunning) {
    restartGame();
  }
}

function updateLevelSelector() {
  const items = document.querySelectorAll(".level-item");
  items.forEach((item, index) => {
    item.classList.toggle("active", index === currentLevel);
  });
}

// Éditeur de niveau
let selectedObstacleType = "spike";

function enterEditMode() {
  gameState = "editing";
  gameRunning = false;
  botMode = false;
  document.getElementById("editorPanel").style.display = "flex";
  obstacles = [...customLevel];
  updateUI();
}

function exitEditMode() {
  gameState = "playing";
  document.getElementById("editorPanel").style.display = "none";
  updateUI();
}

function placeObstacle(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left + camera.x;
  const y = e.clientY - rect.top;

  const newObstacle = {
    type: selectedObstacleType,
    x: x,
    y: Math.max(y, canvas.height - 200),
  };

  if (selectedObstacleType === "platform") {
    newObstacle.width = 80;
  }

  customLevel.push(newObstacle);
  obstacles = [...customLevel];
}

function toggleBotMode() {
  botMode = !botMode;
  if (botMode) {
    gameState = "bot";
    startGame();
  } else {
    gameState = "playing";
  }
  updateUI();
}

function updateUI() {
  document.getElementById("score").textContent = score;
  document.getElementById("bestScore").textContent = bestScore;

  const modeText = botMode
    ? "Bot IA"
    : gameState === "editing"
    ? "Éditeur"
    : "Joueur";
  document.getElementById("gameMode").textContent = modeText;

  document.getElementById("botBtn").classList.toggle("active", botMode);
  document
    .getElementById("editBtn")
    .classList.toggle("active", gameState === "editing");
}

// Event listeners pour les boutons
document.getElementById("playBtn").onclick = startGame;
document.getElementById("editBtn").onclick = () => {
  if (gameState === "editing") {
    exitEditMode();
  } else {
    enterEditMode();
  }
};
document.getElementById("botBtn").onclick = toggleBotMode;

// Éditeur
document.querySelectorAll(".obstacle-btn").forEach((btn) => {
  btn.onclick = () => {
    document
      .querySelectorAll(".obstacle-btn")
      .forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedObstacleType = btn.dataset.type;
  };
});

document.getElementById("clearLevel").onclick = () => {
  customLevel = [];
  obstacles = [];
};

document.getElementById("saveLevel").onclick = () => {
  if (customLevel.length > 0) {
    createLevelSelector();
    alert("Niveau personnalisé sauvegardé!");
  }
};

document.getElementById("exitEditor").onclick = exitEditMode;

// Redimensionnement
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// Démarrage
init();
