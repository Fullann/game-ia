class BattleshipGame {
  constructor() {
    this.gridSize = 10;
    this.ships = [
      { name: "carrier", length: 5, count: 1 },
      { name: "battleship", length: 4, count: 1 },
      { name: "cruiser", length: 3, count: 1 },
      { name: "submarine", length: 3, count: 1 },
      { name: "destroyer", length: 2, count: 1 },
    ];

    this.playerGrid = this.createEmptyGrid();
    this.enemyGrid = this.createEmptyGrid();
    this.playerShips = [];
    this.enemyShips = [];

    this.gamePhase = "placement"; // placement, playing, ended
    this.currentPlayer = "player";
    this.selectedShip = null;
    this.shipOrientation = "horizontal";

    // IA et analyse
    this.aiDifficulty = "medium";
    this.aiStrategy = "random";
    this.aiHits = 0;
    this.aiShots = 0;
    this.huntMode = false;
    this.huntTargets = [];
    this.probabilityGrid = this.createEmptyGrid();
    this.playerPatterns = {
      corners: 0,
      edges: 0,
      center: 0,
      clusters: 0,
    };

    this.initializeGame();
    this.setupEventListeners();
  }

  createEmptyGrid() {
    return Array(this.gridSize)
      .fill()
      .map(() => Array(this.gridSize).fill(0));
  }

  initializeGame() {
    this.createGridElements();
    this.createShipPlacementUI();
    this.updateGameStatus();
    this.placeEnemyShips();
  }

  createGridElements() {
    const playerGrid = document.getElementById("playerGrid");
    const enemyGrid = document.getElementById("enemyGrid");

    playerGrid.innerHTML = "";
    enemyGrid.innerHTML = "";

    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        // Grille joueur
        const playerCell = document.createElement("div");
        playerCell.className = "cell";
        playerCell.dataset.row = row;
        playerCell.dataset.col = col;
        playerCell.dataset.grid = "player";
        playerGrid.appendChild(playerCell);

        // Grille ennemie
        const enemyCell = document.createElement("div");
        enemyCell.className = "cell";
        enemyCell.dataset.row = row;
        enemyCell.dataset.col = col;
        enemyCell.dataset.grid = "enemy";
        enemyGrid.appendChild(enemyCell);
      }
    }
  }

  createShipPlacementUI() {
    const shipsContainer = document.querySelector(".ships-to-place");
    shipsContainer.innerHTML = "";

    this.ships.forEach((ship) => {
      const shipElement = document.createElement("div");
      shipElement.className = "ship-item";
      shipElement.dataset.ship = ship.name;
      shipElement.innerHTML = `
                <span class="ship-name">${this.getShipDisplayName(
                  ship.name
                )} (${ship.length})</span>
                <div class="ship-preview" data-length="${ship.length}"></div>
            `;
      shipsContainer.appendChild(shipElement);
    });
  }

  getShipDisplayName(shipName) {
    const names = {
      carrier: "Porte-avions",
      battleship: "Cuirassé",
      cruiser: "Croiseur",
      submarine: "Sous-marin",
      destroyer: "Destroyer",
    };
    return names[shipName] || shipName;
  }

  setupEventListeners() {
    // Contrôles de jeu
    document
      .getElementById("randomizeShips")
      .addEventListener("click", () => this.randomizePlayerShips());
    document
      .getElementById("startGame")
      .addEventListener("click", () => this.startGame());
    document
      .getElementById("resetGame")
      .addEventListener("click", () => this.resetGame());
    document
      .getElementById("rotateShip")
      .addEventListener("click", () => this.rotateShip());

    // Sélection de difficulté
    document.getElementById("difficulty").addEventListener("change", (e) => {
      this.aiDifficulty = e.target.value;
      this.updateAIStrategy();
    });

    // Placement des navires
    document.addEventListener("click", (e) => this.handleCellClick(e));
    document.addEventListener("mouseover", (e) => this.handleCellHover(e));
    document.addEventListener("mouseout", (e) => this.handleCellLeave(e));

    // Sélection des navires
    document.addEventListener("click", (e) => {
      if (e.target.closest(".ship-item")) {
        this.selectShip(e.target.closest(".ship-item"));
      }
    });

    // Raccourci clavier pour rotation
    document.addEventListener("keydown", (e) => {
      if (e.key === "r" || e.key === "R") {
        this.rotateShip();
      }
    });
  }

  selectShip(shipElement) {
    if (this.gamePhase !== "placement") return;
    if (shipElement.classList.contains("placed")) return;

    document
      .querySelectorAll(".ship-item")
      .forEach((item) => item.classList.remove("selected"));
    shipElement.classList.add("selected");

    this.selectedShip = shipElement.dataset.ship;
  }

  rotateShip() {
    if (this.gamePhase !== "placement") return;
    this.shipOrientation =
      this.shipOrientation === "horizontal" ? "vertical" : "horizontal";
  }

  handleCellClick(e) {
    if (!e.target.classList.contains("cell")) return;

    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);
    const grid = e.target.dataset.grid;

    if (this.gamePhase === "placement" && grid === "player") {
      this.placeShip(row, col);
    } else if (
      this.gamePhase === "playing" &&
      grid === "enemy" &&
      this.currentPlayer === "player"
    ) {
      this.playerShoot(row, col);
    }
  }

  handleCellHover(e) {
    if (!e.target.classList.contains("cell") || this.gamePhase !== "placement")
      return;
    if (!this.selectedShip || e.target.dataset.grid !== "player") return;

    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);

    this.showShipPreview(row, col, true);
  }

  handleCellLeave(e) {
    if (!e.target.classList.contains("cell") || this.gamePhase !== "placement")
      return;
    if (e.target.dataset.grid !== "player") return;

    this.clearShipPreview();
  }

  showShipPreview(row, col, show) {
    this.clearShipPreview();
    if (!show || !this.selectedShip) return;

    const ship = this.ships.find((s) => s.name === this.selectedShip);
    const isValid = this.canPlaceShip(
      row,
      col,
      ship.length,
      this.shipOrientation
    );

    for (let i = 0; i < ship.length; i++) {
      const currentRow = this.shipOrientation === "horizontal" ? row : row + i;
      const currentCol = this.shipOrientation === "horizontal" ? col + i : col;

      if (
        currentRow >= 0 &&
        currentRow < this.gridSize &&
        currentCol >= 0 &&
        currentCol < this.gridSize
      ) {
        const cell = document.querySelector(
          `[data-grid="player"][data-row="${currentRow}"][data-col="${currentCol}"]`
        );
        if (cell) {
          cell.classList.add(isValid ? "ship-preview" : "invalid-preview");
        }
      }
    }
  }

  clearShipPreview() {
    document
      .querySelectorAll(".ship-preview, .invalid-preview")
      .forEach((cell) => {
        cell.classList.remove("ship-preview", "invalid-preview");
      });
  }

  canPlaceShip(row, col, length, orientation) {
    for (let i = 0; i < length; i++) {
      const currentRow = orientation === "horizontal" ? row : row + i;
      const currentCol = orientation === "horizontal" ? col + i : col;

      if (
        currentRow < 0 ||
        currentRow >= this.gridSize ||
        currentCol < 0 ||
        currentCol >= this.gridSize ||
        this.playerGrid[currentRow][currentCol] !== 0
      ) {
        return false;
      }
    }
    return true;
  }

  placeShip(row, col) {
    if (!this.selectedShip) return;

    const ship = this.ships.find((s) => s.name === this.selectedShip);
    if (!this.canPlaceShip(row, col, ship.length, this.shipOrientation)) return;

    // Placer le navire
    const shipData = {
      name: ship.name,
      length: ship.length,
      positions: [],
      hits: 0,
      sunk: false,
    };

    for (let i = 0; i < ship.length; i++) {
      const currentRow = this.shipOrientation === "horizontal" ? row : row + i;
      const currentCol = this.shipOrientation === "horizontal" ? col + i : col;

      this.playerGrid[currentRow][currentCol] = 1;
      shipData.positions.push({ row: currentRow, col: currentCol });

      const cell = document.querySelector(
        `[data-grid="player"][data-row="${currentRow}"][data-col="${currentCol}"]`
      );
      cell.classList.add("ship");
    }

    this.playerShips.push(shipData);

    // Marquer le navire comme placé
    const shipElement = document.querySelector(
      `[data-ship="${this.selectedShip}"]`
    );
    shipElement.classList.add("placed");
    shipElement.classList.remove("selected");

    this.selectedShip = null;
    this.clearShipPreview();
    this.updateShipStatus();

    // Vérifier si tous les navires sont placés
    if (this.playerShips.length === this.ships.length) {
      document.getElementById("startGame").disabled = false;
    }
  }

  randomizePlayerShips() {
    this.playerGrid = this.createEmptyGrid();
    this.playerShips = [];

    // Effacer l'affichage
    document.querySelectorAll('[data-grid="player"] .cell').forEach((cell) => {
      cell.className = "cell";
    });

    document.querySelectorAll(".ship-item").forEach((item) => {
      item.classList.remove("placed", "selected");
    });

    // Placer aléatoirement
    this.ships.forEach((ship) => {
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 100) {
        const row = Math.floor(Math.random() * this.gridSize);
        const col = Math.floor(Math.random() * this.gridSize);
        const orientation = Math.random() < 0.5 ? "horizontal" : "vertical";

        if (this.canPlaceShip(row, col, ship.length, orientation)) {
          const shipData = {
            name: ship.name,
            length: ship.length,
            positions: [],
            hits: 0,
            sunk: false,
          };

          for (let i = 0; i < ship.length; i++) {
            const currentRow = orientation === "horizontal" ? row : row + i;
            const currentCol = orientation === "horizontal" ? col + i : col;

            this.playerGrid[currentRow][currentCol] = 1;
            shipData.positions.push({ row: currentRow, col: currentCol });

            const cell = document.querySelector(
              `[data-grid="player"][data-row="${currentRow}"][data-col="${currentCol}"]`
            );
            cell.classList.add("ship");
          }

          this.playerShips.push(shipData);

          const shipElement = document.querySelector(
            `[data-ship="${ship.name}"]`
          );
          shipElement.classList.add("placed");

          placed = true;
        }
        attempts++;
      }
    });

    this.updateShipStatus();
    document.getElementById("startGame").disabled = false;
  }

  placeEnemyShips() {
    this.enemyGrid = this.createEmptyGrid();
    this.enemyShips = [];

    this.ships.forEach((ship) => {
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 100) {
        const row = Math.floor(Math.random() * this.gridSize);
        const col = Math.floor(Math.random() * this.gridSize);
        const orientation = Math.random() < 0.5 ? "horizontal" : "vertical";

        if (this.canPlaceEnemyShip(row, col, ship.length, orientation)) {
          const shipData = {
            name: ship.name,
            length: ship.length,
            positions: [],
            hits: 0,
            sunk: false,
          };

          for (let i = 0; i < ship.length; i++) {
            const currentRow = orientation === "horizontal" ? row : row + i;
            const currentCol = orientation === "horizontal" ? col + i : col;

            this.enemyGrid[currentRow][currentCol] = 1;
            shipData.positions.push({ row: currentRow, col: currentCol });
          }

          this.enemyShips.push(shipData);
          placed = true;
        }
        attempts++;
      }
    });

    this.analyzePlayerPatterns();
  }

  canPlaceEnemyShip(row, col, length, orientation) {
    for (let i = 0; i < length; i++) {
      const currentRow = orientation === "horizontal" ? row : row + i;
      const currentCol = orientation === "horizontal" ? col + i : col;

      if (
        currentRow < 0 ||
        currentRow >= this.gridSize ||
        currentCol < 0 ||
        currentCol >= this.gridSize ||
        this.enemyGrid[currentRow][currentCol] !== 0
      ) {
        return false;
      }
    }
    return true;
  }

  analyzePlayerPatterns() {
    // Analyser les patterns de placement du joueur pour l'IA adaptative
    this.playerShips.forEach((ship) => {
      ship.positions.forEach((pos) => {
        // Coins
        if (
          (pos.row === 0 || pos.row === this.gridSize - 1) &&
          (pos.col === 0 || pos.col === this.gridSize - 1)
        ) {
          this.playerPatterns.corners++;
        }
        // Bords
        else if (
          pos.row === 0 ||
          pos.row === this.gridSize - 1 ||
          pos.col === 0 ||
          pos.col === this.gridSize - 1
        ) {
          this.playerPatterns.edges++;
        }
        // Centre
        else if (pos.row >= 3 && pos.row <= 6 && pos.col >= 3 && pos.col <= 6) {
          this.playerPatterns.center++;
        }
      });
    });

    // Détecter les clusters
    for (let row = 0; row < this.gridSize - 1; row++) {
      for (let col = 0; col < this.gridSize - 1; col++) {
        let shipCount = 0;
        for (let dr = 0; dr <= 1; dr++) {
          for (let dc = 0; dc <= 1; dc++) {
            if (this.playerGrid[row + dr][col + dc] === 1) {
              shipCount++;
            }
          }
        }
        if (shipCount >= 2) {
          this.playerPatterns.clusters++;
        }
      }
    }
  }

  startGame() {
    if (this.playerShips.length !== this.ships.length) return;

    this.gamePhase = "playing";
    document.getElementById("shipPlacement").style.display = "none";
    document.getElementById("startGame").disabled = true;
    this.updateGameStatus();
    this.updateAIStrategy();
    this.calculateProbabilities();
  }

  resetGame() {
    this.gamePhase = "placement";
    this.currentPlayer = "player";
    this.selectedShip = null;
    this.shipOrientation = "horizontal";
    this.huntMode = false;
    this.huntTargets = [];
    this.aiHits = 0;
    this.aiShots = 0;
    this.playerPatterns = { corners: 0, edges: 0, center: 0, clusters: 0 };

    document.getElementById("shipPlacement").style.display = "block";
    document.getElementById("startGame").disabled = true;

    this.initializeGame();
  }

  playerShoot(row, col) {
    if (this.enemyGrid[row][col] === 2 || this.enemyGrid[row][col] === 3)
      return; // Déjà tiré

    const cell = document.querySelector(
      `[data-grid="enemy"][data-row="${row}"][data-col="${col}"]`
    );
    let hit = false;

    if (this.enemyGrid[row][col] === 1) {
      // Touché
      this.enemyGrid[row][col] = 2;
      cell.classList.add("hit");
      cell.textContent = "💥";
      hit = true;

      // Vérifier si un navire est coulé
      const ship = this.enemyShips.find((ship) =>
        ship.positions.some((pos) => pos.row === row && pos.col === col)
      );

      if (ship) {
        ship.hits++;
        if (ship.hits === ship.length) {
          ship.sunk = true;
          this.markShipAsSunk(ship, "enemy");
        }
      }
    } else {
      // Manqué
      this.enemyGrid[row][col] = 3;
      cell.classList.add("miss");
      cell.textContent = "💧";
    }

    this.updateShipStatus();

    if (this.checkGameEnd()) return;

    if (!hit) {
      this.currentPlayer = "ai";
      this.updateGameStatus();
      setTimeout(() => this.aiTurn(), 1000);
    }
  }

  async aiTurn() {
    document.getElementById("aiThinking").textContent = "IA réfléchit...";

    await new Promise((resolve) =>
      setTimeout(resolve, 500 + Math.random() * 1000)
    );

    const move = this.getAIMove();
    if (!move) return;

    const { row, col } = move;
    const cell = document.querySelector(
      `[data-grid="player"][data-row="${row}"][data-col="${col}"]`
    );
    let hit = false;

    this.aiShots++;

    if (this.playerGrid[row][col] === 1) {
      // Touché
      this.playerGrid[row][col] = 2;
      cell.classList.add("hit");
      cell.textContent = "💥";
      hit = true;
      this.aiHits++;

      // Mode chasse activé
      this.huntMode = true;
      this.addHuntTargets(row, col);

      // Vérifier si un navire est coulé
      const ship = this.playerShips.find((ship) =>
        ship.positions.some((pos) => pos.row === row && pos.col === col)
      );

      if (ship) {
        ship.hits++;
        if (ship.hits === ship.length) {
          ship.sunk = true;
          this.markShipAsSunk(ship, "player");
          this.huntMode = false;
          this.huntTargets = [];
        }
      }
    } else {
      // Manqué
      this.playerGrid[row][col] = 3;
      cell.classList.add("miss");
      cell.textContent = "💧";
    }

    this.updateShipStatus();
    this.updateAIStats();
    this.calculateProbabilities();

    document.getElementById("aiThinking").textContent = "";

    if (this.checkGameEnd()) return;

    if (!hit) {
      this.currentPlayer = "player";
      this.updateGameStatus();
    } else {
      setTimeout(() => this.aiTurn(), 1000);
    }
  }

  getAIMove() {
    switch (this.aiDifficulty) {
      case "easy":
        return this.getRandomMove();
      case "medium":
        return this.getMediumMove();
      case "hard":
        return this.getHardMove();
      case "adaptive":
        return this.getAdaptiveMove();
      default:
        return this.getRandomMove();
    }
  }

  getRandomMove() {
    const availableMoves = [];
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        if (
          this.playerGrid[row][col] !== 2 &&
          this.playerGrid[row][col] !== 3
        ) {
          availableMoves.push({ row, col });
        }
      }
    }

    if (availableMoves.length === 0) return null;
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  getMediumMove() {
    // Mode chasse : si on a touché, attaquer les cases adjacentes
    if (this.huntMode && this.huntTargets.length > 0) {
      return this.huntTargets.shift();
    }

    // Sinon, tir aléatoire
    return this.getRandomMove();
  }

  getHardMove() {
    // Mode chasse prioritaire
    if (this.huntMode && this.huntTargets.length > 0) {
      return this.huntTargets.shift();
    }

    // Utiliser la grille de probabilités
    let bestMove = null;
    let bestProbability = -1;

    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        if (
          this.playerGrid[row][col] !== 2 &&
          this.playerGrid[row][col] !== 3
        ) {
          const probability = this.probabilityGrid[row][col];
          if (probability > bestProbability) {
            bestProbability = probability;
            bestMove = { row, col };
          }
        }
      }
    }

    return bestMove || this.getRandomMove();
  }

  getAdaptiveMove() {
    // Combiner la stratégie hard avec l'analyse des patterns du joueur
    if (this.huntMode && this.huntTargets.length > 0) {
      return this.huntTargets.shift();
    }

    // Ajuster les probabilités selon les patterns détectés
    const adjustedProbabilities = this.createEmptyGrid();

    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        if (
          this.playerGrid[row][col] !== 2 &&
          this.playerGrid[row][col] !== 3
        ) {
          let probability = this.probabilityGrid[row][col];

          // Ajustements basés sur les patterns
          if (this.playerPatterns.corners > 2) {
            // Le joueur aime les coins
            if (
              (row === 0 || row === this.gridSize - 1) &&
              (col === 0 || col === this.gridSize - 1)
            ) {
              probability *= 1.5;
            }
          }

          if (this.playerPatterns.edges > 5) {
            // Le joueur aime les bords
            if (
              row === 0 ||
              row === this.gridSize - 1 ||
              col === 0 ||
              col === this.gridSize - 1
            ) {
              probability *= 1.3;
            }
          }

          if (this.playerPatterns.center > 5) {
            // Le joueur aime le centre
            if (row >= 3 && row <= 6 && col >= 3 && col <= 6) {
              probability *= 1.4;
            }
          }

          adjustedProbabilities[row][col] = probability;
        }
      }
    }

    // Trouver le meilleur mouvement
    let bestMove = null;
    let bestProbability = -1;

    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        if (adjustedProbabilities[row][col] > bestProbability) {
          bestProbability = adjustedProbabilities[row][col];
          bestMove = { row, col };
        }
      }
    }

    return bestMove || this.getRandomMove();
  }

  addHuntTargets(row, col) {
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];

    directions.forEach(([dr, dc]) => {
      const newRow = row + dr;
      const newCol = col + dc;

      if (
        newRow >= 0 &&
        newRow < this.gridSize &&
        newCol >= 0 &&
        newCol < this.gridSize &&
        this.playerGrid[newRow][newCol] !== 2 &&
        this.playerGrid[newRow][newCol] !== 3
      ) {
        this.huntTargets.push({ row: newRow, col: newCol });
      }
    });

    // Trier par priorité (cases adjacentes à plusieurs hits)
    this.huntTargets.sort((a, b) => {
      const priorityA = this.getHuntPriority(a.row, a.col);
      const priorityB = this.getHuntPriority(b.row, b.col);
      return priorityB - priorityA;
    });
  }

  getHuntPriority(row, col) {
    let priority = 0;
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];

    directions.forEach(([dr, dc]) => {
      const newRow = row + dr;
      const newCol = col + dc;

      if (
        newRow >= 0 &&
        newRow < this.gridSize &&
        newCol >= 0 &&
        newCol < this.gridSize &&
        this.playerGrid[newRow][newCol] === 2
      ) {
        priority++;
      }
    });

    return priority;
  }

  calculateProbabilities() {
    this.probabilityGrid = this.createEmptyGrid();

    // Calculer la densité de probabilité pour chaque case
    const remainingShips = this.playerShips.filter((ship) => !ship.sunk);

    remainingShips.forEach((ship) => {
      const remainingLength = ship.length - ship.hits;

      // Tester toutes les positions possibles
      for (let row = 0; row < this.gridSize; row++) {
        for (let col = 0; col < this.gridSize; col++) {
          // Horizontal
          if (this.canFitShip(row, col, remainingLength, "horizontal")) {
            for (let i = 0; i < remainingLength; i++) {
              this.probabilityGrid[row][col + i]++;
            }
          }

          // Vertical
          if (this.canFitShip(row, col, remainingLength, "vertical")) {
            for (let i = 0; i < remainingLength; i++) {
              this.probabilityGrid[row + i][col]++;
            }
          }
        }
      }
    });

    this.updateProbabilityHeatmap();
  }

  canFitShip(row, col, length, orientation) {
    for (let i = 0; i < length; i++) {
      const currentRow = orientation === "horizontal" ? row : row + i;
      const currentCol = orientation === "horizontal" ? col + i : col;

      if (
        currentRow < 0 ||
        currentRow >= this.gridSize ||
        currentCol < 0 ||
        currentCol >= this.gridSize ||
        this.playerGrid[currentRow][currentCol] === 3
      ) {
        // Miss
        return false;
      }
    }
    return true;
  }

  updateProbabilityHeatmap() {
    const heatmapContainer = document.getElementById("probabilityHeatmap");
    heatmapContainer.innerHTML = "";

    let maxProbability = 0;
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        maxProbability = Math.max(
          maxProbability,
          this.probabilityGrid[row][col]
        );
      }
    }

    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const cell = document.createElement("div");
        cell.className = "heatmap-cell";

        const probability = this.probabilityGrid[row][col];
        const intensity = maxProbability > 0 ? probability / maxProbability : 0;

        // Couleur basée sur l'intensité
        const red = Math.floor(255 * intensity);
        const blue = Math.floor(255 * (1 - intensity));
        cell.style.backgroundColor = `rgb(${red}, 0, ${blue})`;

        if (probability > 0) {
          cell.textContent = probability;
        }

        heatmapContainer.appendChild(cell);
      }
    }

    document.getElementById("maxProbability").textContent = `${maxProbability}`;
  }

  markShipAsSunk(ship, grid) {
    ship.positions.forEach((pos) => {
      const cell = document.querySelector(
        `[data-grid="${grid}"][data-row="${pos.row}"][data-col="${pos.col}"]`
      );
      cell.classList.add("sunk");
      cell.textContent = "💀";
    });
  }

  updateShipStatus() {
    const playerShipsContainer = document.getElementById("playerShips");
    const enemyShipsContainer = document.getElementById("enemyShips");

    playerShipsContainer.innerHTML = "";
    enemyShipsContainer.innerHTML = "";

    this.ships.forEach((shipType) => {
      // Navires du joueur
      const playerShip = this.playerShips.find((s) => s.name === shipType.name);
      if (playerShip) {
        const shipDiv = document.createElement("div");
        shipDiv.className = `ship-status ${playerShip.sunk ? "sunk" : "alive"}`;
        shipDiv.innerHTML = `
                    <span>${this.getShipDisplayName(shipType.name)}</span>
                    <span>${playerShip.sunk ? "Coulé" : "En vie"}</span>
                `;
        playerShipsContainer.appendChild(shipDiv);
      }

      // Navires ennemis
      const enemyShip = this.enemyShips.find((s) => s.name === shipType.name);
      if (enemyShip) {
        const shipDiv = document.createElement("div");
        shipDiv.className = `ship-status ${enemyShip.sunk ? "sunk" : "alive"}`;
        shipDiv.innerHTML = `
                    <span>${this.getShipDisplayName(shipType.name)}</span>
                    <span>${enemyShip.sunk ? "Coulé" : "En vie"}</span>
                `;
        enemyShipsContainer.appendChild(shipDiv);
      }
    });
  }

  updateGameStatus() {
    const phaseText = {
      placement: "Phase: Placement des navires",
      playing: "Phase: Combat en cours",
      ended: "Phase: Partie terminée",
    };

    const playerText = {
      player: "Tour: Joueur",
      ai: "Tour: IA",
    };

    document.getElementById("gamePhase").textContent =
      phaseText[this.gamePhase];
    document.getElementById("currentPlayer").textContent =
      playerText[this.currentPlayer];
  }

  updateAIStrategy() {
    const strategies = {
      easy: "Tirs aléatoires",
      medium: "Chasse après touché",
      hard: "Analyse de densité",
      adaptive: "Apprentissage adaptatif",
    };

    this.aiStrategy = strategies[this.aiDifficulty];
    document.getElementById("aiStrategy").textContent = this.aiStrategy;
  }

  updateAIStats() {
    const accuracy =
      this.aiShots > 0 ? Math.round((this.aiHits / this.aiShots) * 100) : 0;
    document.getElementById("aiAccuracy").textContent = `${accuracy}%`;

    const patternsCount = Object.values(this.playerPatterns).reduce(
      (sum, count) => sum + count,
      0
    );
    document.getElementById("patternsFound").textContent = patternsCount;
  }

  checkGameEnd() {
    const playerShipsSunk = this.playerShips.every((ship) => ship.sunk);
    const enemyShipsSunk = this.enemyShips.every((ship) => ship.sunk);

    if (playerShipsSunk) {
      this.gamePhase = "ended";
      this.updateGameStatus();
      alert("L'IA a gagné ! Tous vos navires ont été coulés.");
      return true;
    }

    if (enemyShipsSunk) {
      this.gamePhase = "ended";
      this.updateGameStatus();
      alert("Félicitations ! Vous avez coulé tous les navires ennemis !");
      return true;
    }

    return false;
  }
}

// Initialiser le jeu
document.addEventListener("DOMContentLoaded", () => {
  new BattleshipGame();
});
