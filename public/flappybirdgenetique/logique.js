const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameState = {
  paused: false,
  speed: 1,
  generation: 1,
  bestScore: 0,
  pipes: [],
  birds: [],
  populationSize: 50,
  gravity: 0.6,
  jumpForce: -12,
  pipeWidth: 60,
  pipeGap: 150,
  gameSpeed: 2,
};

// Réseau de neurones simple
class NeuralNetwork {
  constructor(inputSize, hiddenSize, outputSize) {
    this.weights1 = this.randomMatrix(inputSize, hiddenSize);
    this.weights2 = this.randomMatrix(hiddenSize, outputSize);
    this.bias1 = this.randomArray(hiddenSize);
    this.bias2 = this.randomArray(outputSize);
  }

  randomMatrix(rows, cols) {
    return Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => Math.random() * 2 - 1)
    );
  }

  randomArray(size) {
    return Array.from({ length: size }, () => Math.random() * 2 - 1);
  }

  predict(inputs) {
    // Couche cachée
    let hidden = this.weights1[0].map((_, i) => {
      let sum = 0;
      for (let j = 0; j < inputs.length; j++) {
        sum += inputs[j] * this.weights1[j][i];
      }
      return this.sigmoid(sum + this.bias1[i]);
    });

    // Couche de sortie
    let output = this.weights2[0].map((_, i) => {
      let sum = 0;
      for (let j = 0; j < hidden.length; j++) {
        sum += hidden[j] * this.weights2[j][i];
      }
      return this.sigmoid(sum + this.bias2[i]);
    });

    return output[0];
  }

  sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }

  mutate(rate = 0.1) {
    this.mutateMatrix(this.weights1, rate);
    this.mutateMatrix(this.weights2, rate);
    this.mutateArray(this.bias1, rate);
    this.mutateArray(this.bias2, rate);
  }

  mutateMatrix(matrix, rate) {
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix[i].length; j++) {
        if (Math.random() < rate) {
          matrix[i][j] += (Math.random() * 2 - 1) * 0.5;
        }
      }
    }
  }

  mutateArray(array, rate) {
    for (let i = 0; i < array.length; i++) {
      if (Math.random() < rate) {
        array[i] += (Math.random() * 2 - 1) * 0.5;
      }
    }
  }

  crossover(other) {
    let child = new NeuralNetwork(4, 8, 1);

    // Croisement des poids
    for (let i = 0; i < this.weights1.length; i++) {
      for (let j = 0; j < this.weights1[i].length; j++) {
        child.weights1[i][j] =
          Math.random() < 0.5 ? this.weights1[i][j] : other.weights1[i][j];
      }
    }

    for (let i = 0; i < this.weights2.length; i++) {
      for (let j = 0; j < this.weights2[i].length; j++) {
        child.weights2[i][j] =
          Math.random() < 0.5 ? this.weights2[i][j] : other.weights2[i][j];
      }
    }

    return child;
  }
}

class Bird {
  constructor(x, y, brain = null) {
    this.x = x;
    this.y = y;
    this.velocity = 0;
    this.alive = true;
    this.score = 0;
    this.fitness = 0;
    this.brain = brain || new NeuralNetwork(4, 8, 1);
    this.color = this.randomColor();
    this.size = 15;
  }

  randomColor() {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#FFB6C1",
      "#87CEEB",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  update() {
    if (!this.alive) return;

    this.velocity += gameState.gravity;
    this.y += this.velocity;

    // Vérifier les collisions avec les bords
    if (this.y < 0 || this.y > canvas.height - this.size) {
      this.alive = false;
      return;
    }

    // Vérifier les collisions avec les tuyaux
    for (let pipe of gameState.pipes) {
      if (
        this.x + this.size > pipe.x &&
        this.x < pipe.x + gameState.pipeWidth
      ) {
        if (
          this.y < pipe.topHeight ||
          this.y + this.size > pipe.topHeight + gameState.pipeGap
        ) {
          this.alive = false;
          return;
        }
      }
    }

    this.score++;
  }

  jump() {
    if (this.alive) {
      this.velocity = gameState.jumpForce;
    }
  }

  think() {
    if (!this.alive) return;

    let closestPipe = this.getClosestPipe();
    if (!closestPipe) return;

    let inputs = [
      (closestPipe.x - this.x) / canvas.width,
      (closestPipe.topHeight - this.y) / canvas.height,
      (closestPipe.topHeight + gameState.pipeGap - this.y) / canvas.height,
      this.velocity / 10,
    ];

    let output = this.brain.predict(inputs);
    if (output > 0.5) {
      this.jump();
    }
  }

  getClosestPipe() {
    let closest = null;
    let closestDist = Infinity;

    for (let pipe of gameState.pipes) {
      let dist = pipe.x - this.x;
      if (dist > 0 && dist < closestDist) {
        closest = pipe;
        closestDist = dist;
      }
    }

    return closest;
  }

  draw() {
    if (!this.alive) return;

    ctx.save();

    // Corps de l'oiseau
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(
      this.x + this.size / 2,
      this.y + this.size / 2,
      this.size / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Oeil
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(
      this.x + this.size / 2 + 3,
      this.y + this.size / 2 - 2,
      3,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(
      this.x + this.size / 2 + 4,
      this.y + this.size / 2 - 2,
      1.5,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Bec
    ctx.fillStyle = "#FFA500";
    ctx.beginPath();
    ctx.moveTo(this.x + this.size, this.y + this.size / 2);
    ctx.lineTo(this.x + this.size + 8, this.y + this.size / 2 - 2);
    ctx.lineTo(this.x + this.size + 8, this.y + this.size / 2 + 2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  calculateFitness() {
    this.fitness = this.score * this.score;
  }
}

class Pipe {
  constructor(x) {
    this.x = x;
    this.topHeight =
      Math.random() * (canvas.height - gameState.pipeGap - 100) + 50;
    this.passed = false;
  }

  update() {
    this.x -= gameState.gameSpeed;
  }

  draw() {
    // Tuyau du haut
    ctx.fillStyle = "#228B22";
    ctx.fillRect(this.x, 0, gameState.pipeWidth, this.topHeight);

    // Tuyau du bas
    ctx.fillRect(
      this.x,
      this.topHeight + gameState.pipeGap,
      gameState.pipeWidth,
      canvas.height - this.topHeight - gameState.pipeGap
    );

    // Bordures
    ctx.strokeStyle = "#006400";
    ctx.lineWidth = 3;
    ctx.strokeRect(this.x, 0, gameState.pipeWidth, this.topHeight);
    ctx.strokeRect(
      this.x,
      this.topHeight + gameState.pipeGap,
      gameState.pipeWidth,
      canvas.height - this.topHeight - gameState.pipeGap
    );
  }

  isOffScreen() {
    return this.x + gameState.pipeWidth < 0;
  }
}

function initializePopulation() {
  gameState.birds = [];
  for (let i = 0; i < gameState.populationSize; i++) {
    gameState.birds.push(new Bird(100, canvas.height / 2));
  }
}

function nextGeneration() {
  let aliveBirds = gameState.birds.filter((bird) => bird.alive);
  let deadBirds = gameState.birds.filter((bird) => !bird.alive);

  if (aliveBirds.length === 0) {
    // Calculer la fitness
    gameState.birds.forEach((bird) => bird.calculateFitness());

    // Trier par fitness
    gameState.birds.sort((a, b) => b.fitness - a.fitness);

    // Créer la nouvelle génération
    let newBirds = [];
    let elite = Math.floor(gameState.populationSize * 0.1);

    // Garder les meilleurs
    for (let i = 0; i < elite; i++) {
      let bird = new Bird(100, canvas.height / 2, gameState.birds[i].brain);
      newBirds.push(bird);
    }

    // Créer le reste par croisement
    for (let i = elite; i < gameState.populationSize; i++) {
      let parent1 = selectParent();
      let parent2 = selectParent();
      let childBrain = parent1.brain.crossover(parent2.brain);
      childBrain.mutate(0.1);

      let bird = new Bird(100, canvas.height / 2, childBrain);
      newBirds.push(bird);
    }

    gameState.birds = newBirds;
    gameState.generation++;
    gameState.pipes = [];

    // Mettre à jour le meilleur score
    let bestThisGen = Math.max(...deadBirds.map((bird) => bird.score));
    if (bestThisGen > gameState.bestScore) {
      gameState.bestScore = bestThisGen;
    }
  }
}

function selectParent() {
  let totalFitness = gameState.birds.reduce(
    (sum, bird) => sum + bird.fitness,
    0
  );
  let random = Math.random() * totalFitness;
  let current = 0;

  for (let bird of gameState.birds) {
    current += bird.fitness;
    if (current >= random) {
      return bird;
    }
  }

  return gameState.birds[0];
}

function updatePipes() {
  // Ajouter de nouveaux tuyaux
  if (
    gameState.pipes.length === 0 ||
    gameState.pipes[gameState.pipes.length - 1].x < canvas.width - 300
  ) {
    gameState.pipes.push(new Pipe(canvas.width));
  }

  // Mettre à jour les tuyaux existants
  gameState.pipes.forEach((pipe) => pipe.update());

  // Supprimer les tuyaux hors écran
  gameState.pipes = gameState.pipes.filter((pipe) => !pipe.isOffScreen());
}

function updateStats() {
  let aliveBirds = gameState.birds.filter((bird) => bird.alive);
  let avgScore =
    aliveBirds.length > 0
      ? Math.round(
          aliveBirds.reduce((sum, bird) => sum + bird.score, 0) /
            aliveBirds.length
        )
      : 0;

  document.getElementById("generationInfo").textContent = `Génération ${
    gameState.generation
  } - ${
    aliveBirds.length > 0 ? "Évolution en cours..." : "Nouvelle génération!"
  }`;
  document.getElementById("bestScore").textContent = gameState.bestScore;
  document.getElementById("avgScore").textContent = avgScore;
  document.getElementById("aliveCount").textContent = aliveBirds.length;
  document.getElementById(
    "birdCounter"
  ).textContent = `Oiseaux vivants: ${aliveBirds.length}`;
  document.getElementById("speed").textContent = `${gameState.speed}x`;
}

function draw() {
  // Fond avec dégradé
  let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#87CEEB");
  gradient.addColorStop(0.7, "#87CEEB");
  gradient.addColorStop(0.7, "#98FB98");
  gradient.addColorStop(1, "#98FB98");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Dessiner les nuages
  drawClouds();

  // Dessiner les tuyaux
  gameState.pipes.forEach((pipe) => pipe.draw());

  // Dessiner les oiseaux
  gameState.birds.forEach((bird) => bird.draw());

  // Dessiner le sol
  ctx.fillStyle = "#8B4513";
  ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
}

function drawClouds() {
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";

  // Nuages simples
  for (let i = 0; i < 5; i++) {
    let x = (i * 200 + Date.now() * 0.01) % (canvas.width + 100);
    let y = 50 + Math.sin(i) * 30;

    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.arc(x + 20, y, 25, 0, Math.PI * 2);
    ctx.arc(x + 40, y, 20, 0, Math.PI * 2);
    ctx.arc(x + 20, y - 15, 15, 0, Math.PI * 2);
    ctx.fill();
  }
}

function gameLoop() {
  if (!gameState.paused) {
    for (let i = 0; i < gameState.speed; i++) {
      // Faire réfléchir et mettre à jour les oiseaux
      gameState.birds.forEach((bird) => {
        bird.think();
        bird.update();
      });

      updatePipes();
      nextGeneration();
    }
  }

  draw();
  updateStats();
  requestAnimationFrame(gameLoop);
}

function togglePause() {
  gameState.paused = !gameState.paused;
}

function changeSpeed() {
  gameState.speed = gameState.speed === 1 ? 2 : gameState.speed === 2 ? 5 : gameState.speed === 5 ? 10 :  gameState.speed === 10 ? 25 : 1;
}

function resetSimulation() {
  gameState.generation = 1;
  gameState.bestScore = 0;
  gameState.pipes = [];
  initializePopulation();
}

// Initialisation
initializePopulation();
gameLoop();
