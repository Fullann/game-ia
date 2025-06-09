const express = require("express");
const path = require("path");
const fs = require("fs");
const expressLayouts = require("express-ejs-layouts");
const app = express();
const PORT = 3000;

// Configuration des jeux avec leurs métadonnées
const gamesConfigIA = {
  "snake-ia": {
    name: "Snake avec IA",
    description:
      "Un jeu de Snake classique avec une IA qui apprend à jouer grâce à un algorithme de reinforcement learning. L'IA utilise un réseau de neurones simple pour prendre des décisions basées sur l'état du jeu.",
    technology: "JavaScript, HTML5 Canvas, Algorithme génétique",
    youtubeUrl: "https://www.youtube.com/watch?v=example1",
    difficulty: "Intermédiaire",
    features: [
      "IA auto-joueur",
      "Apprentissage par renforcement",
      "Visualisation en temps réel",
    ],
  },
  "2048-ia": {
    name: "2048 avec IA",
    description:
      "Une version intelligente du jeu 2048 avec une IA utilisant l'algorithme expectimax pour optimiser les mouvements et atteindre des scores élevés.",
    technology: "JavaScript, Algorithme Expectimax, Évaluation heuristique",
    youtubeUrl: "https://www.youtube.com/watch?v=example2",
    difficulty: "Avancé",
    features: [
      "Algorithme Expectimax",
      "Optimisation des mouvements",
      "Stratégie avancée",
    ],
  },
  "geometry_dash-ia": {
    name: "Geometry Dash avec IA",
    description:
      "Un clone de Geometry Dash où l'IA apprend à naviguer à travers les obstacles en utilisant des réseaux de neurones et l'apprentissage par renforcement.",
    technology: "JavaScript, Réseaux de neurones, Machine Learning",
    youtubeUrl: "https://www.youtube.com/watch?v=example3",
    difficulty: "Avancé",
    features: [
      "Réseaux de neurones",
      "Apprentissage automatique",
      "Navigation intelligente",
    ],
  },
  "packman-ia": {
    name: "Pacman avec IA",
    description:
      "Jeu Pacman avec une IA sophistiquée pour les fantômes utilisant des algorithmes de pathfinding et de prise de décision stratégique.",
    technology: "JavaScript, Algorithme A*, Comportement IA",
    youtubeUrl: "https://www.youtube.com/watch?v=example4",
    difficulty: "Intermédiaire",
    features: ["Pathfinding A*", "IA comportementale", "Stratégie adaptive"],
  },
  "solitaire-ia": {
    name: "Solitaire avec IA",
    description:
      "Solitaire automatisé avec une IA capable de résoudre les parties en analysant les configurations de cartes et en optimisant les mouvements.",
    technology: "JavaScript, Algorithmes de recherche, Optimisation",
    youtubeUrl: "https://www.youtube.com/watch?v=example5",
    difficulty: "Intermédiaire",
    features: [
      "Résolution automatique",
      "Analyse de configurations",
      "Optimisation des mouvements",
    ],
  },
  "tetris-ia": {
    name: "Tetris avec IA",
    description:
      "Tetris intelligent avec une IA qui utilise des algorithmes génétiques pour optimiser le placement des pièces et maximiser le score.",
    technology: "JavaScript, Algorithmes génétiques, Optimisation",
    youtubeUrl: "https://www.youtube.com/watch?v=example6",
    difficulty: "Avancé",
    features: [
      "Algorithmes génétiques",
      "Optimisation placement",
      "Score maximal",
    ],
  },
  "puzzle-ia": {
    name: "Résolveur de Puzzle",
    description:
      "Un solveur automatique de puzzles utilisant des algorithmes de recherche comme A* et BFS. Capable de résoudre différents types de puzzles en trouvant le chemin optimal.",
    technology: "JavaScript, Algorithme A*, Recherche en largeur",
    youtubeUrl: "https://www.youtube.com/watch?v=example7",
    difficulty: "Intermédiaire",
    features: ["Algorithme A*", "Recherche BFS/DFS", "Visualisation du chemin"],
  },
  "tic-tac-toe-ia": {
    name: "Tic-Tac-Toe IA",
    description:
      "Morpion contre une IA imbattable utilisant l'algorithme Minimax. L'IA calcule tous les coups possibles pour ne jamais perdre.",
    technology: "JavaScript, Algorithme Minimax",
    youtubeUrl: "https://www.youtube.com/watch?v=example8",
    difficulty: "Débutant",
    features: ["IA imbattable", "Interface intuitive", "Algorithme Minimax"],
  },
  "power4-ia": {
    name: "Puissance 4 IA",
    description:
      "Puissance 4 avec une IA stratégique utilisant l'algorithme Minimax avec élagage alpha-beta pour des décisions optimales.",
    technology: "JavaScript, Algorithme Minimax, Alpha-Beta",
    youtubeUrl: "https://www.youtube.com/watch?v=example9",
    difficulty: "Intermédiaire",
    features: [
      "Minimax avec Alpha-Beta",
      "Stratégie optimale",
      "Interface moderne",
    ],
  },
};

const gamesConfigGenetique = {
  flappybirdgenetique: {
    name: "Flappy Bird avec algorithme génétique",
    description:
      "Flappy Bird où des oiseaux virtuels apprennent à voler en utilisant des algorithmes génétiques. Observez l'évolution des générations pour améliorer les performances.",
    technology: "JavaScript, HTML5 Canvas, Algorithmes génétiques",
    youtubeUrl: "https://www.youtube.com/watch?v=example10",
    difficulty: "Avancé",
    features: [
      "Algorithmes génétiques",
      "Évolution des générations",
      "Visualisation de l'apprentissage",
    ],
  },
  pongIAtournament: {
    name: "Pong IA Tournament",
    description:
      "Flappy Bird où des oiseaux virtuels apprennent à voler en utilisant des algorithmes génétiques. Observez l'évolution des générations pour améliorer les performances.",
    technology: "JavaScript, HTML5 Canvas, Algorithmes génétiques",
    youtubeUrl: "https://www.youtube.com/watch?v=example10",
    difficulty: "Avancé",
    features: [
      "Raquettes qui apprennent à jouer au Pong",
      "Tournoi évolutif avec brackets",
      "Styles de jeu émergents (défensif, agressif, imprévisible)",
      "Analyse des stratégies gagnantes",
    ],
  },
  chasseursvsproies: {
    name: "Chasseurs vs Proies",
    description:
      "Flappy Bird où des oiseaux virtuels apprennent à voler en utilisant des algorithmes génétiques. Observez l'évolution des générations pour améliorer les performances.",
    technology: "JavaScript, HTML5 Canvas, Algorithmes génétiques",
    youtubeUrl: "https://www.youtube.com/watch?v=example10",
    difficulty: "Avancé",
    features: [
      "Raquettes qui apprennent à jouer au Pong",
      "Tournoi évolutif avec brackets",
      "Styles de jeu émergents (défensif, agressif, imprévisible)",
      "Analyse des stratégies gagnantes",
    ],
  },
  egoisme: {
    name: "Égoïsme",
    description:
      "Flappy Bird où des oiseaux virtuels apprennent à voler en utilisant des algorithmes génétiques. Observez l'évolution des générations pour améliorer les performances.",
    technology: "JavaScript, HTML5 Canvas, Algorithmes génétiques",
    youtubeUrl: "https://www.youtube.com/watch?v=example10",
    difficulty: "Avancé",
    features: [
      "Raquettes qui apprennent à jouer au Pong",
      "Tournoi évolutif avec brackets",
      "Styles de jeu émergents (défensif, agressif, imprévisible)",
      "Analyse des stratégies gagnantes",
    ],
  },
};

// Middleware
app.use(express.static("public"));
app.use("/code", express.static("code"));
app.use(expressLayouts);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("layout", "layout");

// Route principale - Page d'accueil
app.get("/", (req, res) => {
  res.render("home", {
    games: gamesConfigIA,
    title: "Accueil - Collection de Jeux IA",
    genetique: gamesConfigGenetique,
  });
});

// Route pour afficher les détails d'un jeu
app.get("/game/:gameName", (req, res) => {
  const gameName = req.params.gameName;
  const gameInfo = gamesConfigIA[gameName] || gamesConfigGenetique[gameName];

  if (!gameInfo) {
    return res.status(404).render("error", {
      message: "Jeu non trouvé",
      error: `Le jeu "${gameName}" n'existe pas.`,
      title: "Erreur 404",
    });
  }

  // Vérifier si le fichier HTML du jeu existe
  const gameFilePath = path.join(__dirname, "code", `${gameName}.html`);
  const gameExists = fs.existsSync(gameFilePath);

  res.render("game-detail", {
    gameName,
    gameInfo,
    gameExists,
    gameUrl: `/code/${gameName}.html`,
    title: `${gameInfo.name} - Détails du Jeu`,
  });
});

// Route pour jouer directement (iframe ou redirection)
app.get("/play/:gameName", (req, res) => {
  const gameName = req.params.gameName;
  const gameFilePath = path.join(__dirname, "code", `${gameName}.html`);

  if (!fs.existsSync(gameFilePath)) {
    return res.status(404).render("error", {
      message: "Jeu non disponible",
      error: `Le fichier de jeu "${gameName}.html" n'a pas été trouvé.`,
      title: "Jeu non disponible",
    });
  }

  res.redirect(`/code/${gameName}.html`);
});

// Route pour la section génétique
app.get("/genetique", (req, res) => {
  res.render("genetique", {
    games: gamesConfigGenetique,
    title: "Jeux avec Algorithmes Génétiques",
  });
});

// API pour lister tous les jeux IA
app.get("/api/games", (req, res) => {
  res.json(gamesConfigIA);
});

// API pour lister tous les jeux génétiques
app.get("/api/games/genetique", (req, res) => {
  res.json(gamesConfigGenetique);
});

// API pour lister tous les jeux (IA + génétique)
app.get("/api/games/all", (req, res) => {
  res.json({
    ia: gamesConfigIA,
    genetique: gamesConfigGenetique,
  });
});

// Route pour ajouter un nouveau jeu (optionnel)
app.post("/api/games", express.json(), (req, res) => {
  const { name, config, type = "ia" } = req.body;
  if (name && config) {
    if (type === "genetique") {
      gamesConfigGenetique[name] = config;
    } else {
      gamesConfigIA[name] = config;
    }
    res.json({ success: true, message: "Jeu ajouté avec succès" });
  } else {
    res.status(400).json({ success: false, message: "Données invalides" });
  }
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).render("error", {
    message: "Page non trouvée",
    error: "La page que vous cherchez n'existe pas.",
    title: "Erreur 404",
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🎮 Serveur de jeux IA démarré sur http://localhost:${PORT}`);
  console.log(
    `🎯 Jeux IA configurés: ${Object.keys(gamesConfigIA).join(", ")}`
  );
  console.log(
    `🧬 Jeux génétiques configurés: ${Object.keys(gamesConfigGenetique).join(
      ", "
    )}`
  );
});

module.exports = app;
