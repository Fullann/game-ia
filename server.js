const express = require("express");
const path = require("path");
const fs = require("fs");
const expressLayouts = require("express-ejs-layouts");
const marked = require("marked");

const app = express();
const PORT = 3000;

const allGames = [
  {
    key: "snake-ia",
    name: "Snake avec IA",
    description:
      "Un jeu de Snake classique avec une IA qui apprend à jouer grâce à un algorithme de reinforcement learning.",
    technology: "JavaScript, HTML5 Canvas, Algorithme génétique",
    youtubeUrl: "https://www.youtube.com/watch?v=example1",
    difficulty: "Intermédiaire",
    features: [
      "IA auto-joueur",
      "Apprentissage par renforcement",
      "Visualisation en temps réel",
    ],
    categorie: "ia-apprend",
  },
  {
    key: "2048-ia",
    name: "2048 avec IA",
    description:
      "Une version intelligente du jeu 2048 avec une IA utilisant l'algorithme expectimax pour optimiser les mouvements.",
    technology: "JavaScript, Algorithme Expectimax, Évaluation heuristique",
    youtubeUrl: "https://www.youtube.com/watch?v=example2",
    difficulty: "Avancé",
    features: [
      "Algorithme Expectimax",
      "Optimisation des mouvements",
      "Stratégie avancée",
    ],
    categorie: "solo-optimisable",
  },
  {
    key: "geometry_dash-ia",
    name: "Geometry Dash avec IA",
    description:
      "Un clone de Geometry Dash où l'IA apprend à naviguer à travers les obstacles en utilisant des réseaux de neurones.",
    technology: "JavaScript, Réseaux de neurones, Machine Learning",
    youtubeUrl: "https://www.youtube.com/watch?v=example3",
    difficulty: "Avancé",
    features: [
      "Réseaux de neurones",
      "Apprentissage automatique",
      "Navigation intelligente",
    ],
    categorie: "ia-apprend",
  },
  {
    key: "packman-ia",
    name: "Pacman avec IA",
    description:
      "Jeu Pacman avec une IA sophistiquée pour les fantômes utilisant des algorithmes de pathfinding et de prise de décision stratégique.",
    technology: "JavaScript, Algorithme A*, Comportement IA",
    youtubeUrl: "https://www.youtube.com/watch?v=example4",
    difficulty: "Intermédiaire",
    features: ["Pathfinding A*", "IA comportementale", "Stratégie adaptive"],
    categorie: "solo-optimisable",
  },
  {
    key: "solitaire-ia",
    name: "Solitaire avec IA",
    description:
      "Solitaire automatisé avec une IA capable de résoudre les parties en analysant les configurations de cartes.",
    technology: "JavaScript, Algorithmes de recherche, Optimisation",
    youtubeUrl: "https://www.youtube.com/watch?v=example5",
    difficulty: "Intermédiaire",
    features: [
      "Résolution automatique",
      "Analyse de configurations",
      "Optimisation des mouvements",
    ],
    categorie: "solo-optimisable",
  },
  {
    key: "tetris-ia",
    name: "Tetris avec IA",
    description:
      "Tetris intelligent avec une IA qui utilise des algorithmes génétiques pour optimiser le placement des pièces.",
    technology: "JavaScript, Algorithmes génétiques, Optimisation",
    youtubeUrl: "https://www.youtube.com/watch?v=example6",
    difficulty: "Avancé",
    features: [
      "Algorithmes génétiques",
      "Optimisation placement",
      "Score maximal",
    ],
    categorie: "solo-optimisable",
  },
  {
    key: "puzzle-ia",
    name: "Résolveur de Puzzle",
    description:
      "Un solveur automatique de puzzles utilisant des algorithmes de recherche comme A* et BFS.",
    technology: "JavaScript, Algorithme A*, Recherche en largeur",
    youtubeUrl: "https://www.youtube.com/watch?v=example7",
    difficulty: "Intermédiaire",
    features: ["Algorithme A*", "Recherche BFS/DFS", "Visualisation du chemin"],
    categorie: "algo",
  },
  {
    key: "tic-tac-toe-ia",
    name: "Tic-Tac-Toe IA",
    description:
      "Morpion contre une IA imbattable utilisant l'algorithme Minimax.",
    technology: "JavaScript, Algorithme Minimax",
    youtubeUrl: "https://www.youtube.com/watch?v=example8",
    difficulty: "Débutant",
    features: ["IA imbattable", "Interface intuitive", "Algorithme Minimax"],
    categorie: "contre-ia",
  },
  {
    key: "power4-ia",
    name: "Puissance 4 IA",
    description:
      "Puissance 4 avec une IA stratégique utilisant l'algorithme Minimax avec élagage alpha-beta.",
    technology: "JavaScript, Algorithme Minimax, Alpha-Beta",
    youtubeUrl: "https://www.youtube.com/watch?v=example9",
    difficulty: "Intermédiaire",
    features: [
      "Minimax avec Alpha-Beta",
      "Stratégie optimale",
      "Interface moderne",
    ],
    categorie: "contre-ia",
  },
  {
    key: "flappybirdgenetique",
    name: "Flappy Bird avec algorithme génétique",
    description:
      "Flappy Bird où des oiseaux virtuels apprennent à voler en utilisant des algorithmes génétiques.",
    technology: "JavaScript, HTML5 Canvas, Algorithmes génétiques",
    youtubeUrl: "https://www.youtube.com/watch?v=example10",
    difficulty: "Avancé",
    features: [
      "Algorithmes génétiques",
      "Évolution des générations",
      "Visualisation de l'apprentissage",
    ],
    categorie: "ia-apprend",
  },
  {
    key: "pongIAtournament",
    name: "Pong IA Tournament",
    description:
      "Tournoi de Pong où les raquettes apprennent à jouer en utilisant des algorithmes génétiques.",
    technology: "JavaScript, HTML5 Canvas, Algorithmes génétiques",
    youtubeUrl: "https://www.youtube.com/watch?v=example10",
    difficulty: "Avancé",
    features: [
      "Raquettes qui apprennent à jouer au Pong",
      "Tournoi évolutif avec brackets",
      "Styles de jeu émergents",
      "Analyse des stratégies gagnantes",
    ],
    categorie: "ia-apprend",
  },
  {
    key: "chasseursvsproies",
    name: "Chasseurs vs Proies",
    description:
      "Simulation évolutive où des chasseurs et des proies apprennent et s'adaptent via des algorithmes génétiques.",
    technology: "JavaScript, HTML5 Canvas, Algorithmes génétiques",
    youtubeUrl: "https://www.youtube.com/watch?v=example10",
    difficulty: "Avancé",
    features: [
      "Coévolution",
      "Stratégies émergentes",
      "Visualisation de l'adaptation",
    ],
    categorie: "ia-apprend",
  },
  {
    key: "egoisme",
    name: "Égoïsme",
    description:
      "Simulation de comportements égoïstes et coopératifs dans un environnement évolutif.",
    technology: "JavaScript, HTML5 Canvas, Algorithmes génétiques",
    youtubeUrl: "https://www.youtube.com/watch?v=example10",
    difficulty: "Avancé",
    features: [
      "Simulation sociale",
      "Évolution des stratégies",
      "Observation des comportements",
    ],
    categorie: "ia-apprend",
  },
  {
    key: "tictactoe_learn",
    name: "Tic-Tac-Toe IA Apprenante",
    description:
      "Version évolutive du morpion où l'IA apprend de ses erreurs et s'améliore génération après génération.",
    technology: "JavaScript, HTML5 Canvas, Algorithmes génétiques",
    youtubeUrl: "https://www.youtube.com/watch?v=example10",
    difficulty: "Avancé",
    features: [
      "Apprentissage automatique",
      "Évolution des stratégies",
      "Visualisation de la progression",
    ],
    categorie: "ia-apprend",
  },
  {
    key: "labyrinthe",
    name: "Algorithemes de création et résolution de labyrinthes",
    description:
      "Génération et résolution de labyrinthes complexes avec des algorithmes de recherche et d'optimisation.",
    technology: "JavaScript, HTML5 Canvas, Algorithmes génétiques",
    youtubeUrl: "https://www.youtube.com/watch?v=example10",
    difficulty: "Medium",
    features: [
      "Apprentissage automatique",
      "Évolution des stratégies",
      "Visualisation de la progression",
    ],
    categorie: "algo",
  },
];

// Fonction pour charger la description depuis un fichier README
function loadReadmeDescription(gameKey) {
  const readmePath = path.join(__dirname, "readmes", `${gameKey}.md`);
  try {
    if (fs.existsSync(readmePath)) {
      const readmeContent = fs.readFileSync(readmePath, "utf8");
      return {
        hasReadme: true,
        content: readmeContent,
        html: marked.parse(readmeContent), 
      };
    }
  } catch (error) {
    console.error(
      `Erreur lors du chargement du README pour ${gameKey}:`,
      error
    );
  }
  return {
    hasReadme: false,
    content: null,
    html: null,
  };
}

// Fonction pour enrichir les données des jeux avec les README
function enrichGamesWithReadme(games) {
  return games.map((game) => ({
    ...game,
    readme: loadReadmeDescription(game.key),
  }));
}

// Middleware
app.use(express.static("public"));
app.use("/code", express.static("code"));
app.use(expressLayouts);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("layout", "layout");

// Page d'accueil - Home
app.get("/", (req, res) => {
  const enrichedGames = enrichGamesWithReadme(allGames);
  res.render("home", {
    games: enrichedGames,
    title: "Accueil - Collection de Jeux IA",
  });
});

// Détail d'un jeu
app.get("/game/:gameName", (req, res) => {
  const gameName = req.params.gameName;
  const gameInfo = allGames.find((g) => g.key === gameName);

  if (!gameInfo) {
    return res.status(404).render("error", {
      message: "Jeu non trouvé",
      error: `Le jeu "${gameName}" n'existe pas.`,
      title: "Erreur 404",
    });
  }

  const gameFilePath = path.join(__dirname, "code", `${gameName}.html`);
  const gameExists = fs.existsSync(gameFilePath);

  // Charger le README spécifique au jeu
  const readme = loadReadmeDescription(gameName);
  const enrichedGameInfo = {
    ...gameInfo,
    readme,
  };
  
  res.render("game-detail", {
    gameName,
    gameInfo: enrichedGameInfo,
    gameExists,
    gameUrl: `/code/${gameName}.html`,
    title: `${gameInfo.name} - Détails du Jeu`,
  });
});

// Jouer à un jeu
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

// Section génétique (affiche tous les jeux de la catégorie "ia-apprend")
app.get("/genetique", (req, res) => {
  const genetiqueGames = allGames.filter((g) => g.categorie === "ia-apprend");
  const enrichedGames = enrichGamesWithReadme(genetiqueGames);
  res.render("genetique", {
    games: enrichedGames,
    title: "Jeux avec Algorithmes Génétiques",
  });
});

// API - tous les jeux
app.get("/api/games", (req, res) => {
  const enrichedGames = enrichGamesWithReadme(allGames);
  res.json(enrichedGames);
});

// API - jeux par catégorie
app.get("/api/games/:categorie", (req, res) => {
  const { categorie } = req.params;
  const filtered = allGames.filter((g) => g.categorie === categorie);
  const enrichedGames = enrichGamesWithReadme(filtered);
  res.json(enrichedGames);
});

// API - README d'un jeu spécifique
app.get("/api/readme/:gameName", (req, res) => {
  const { gameName } = req.params;
  const readme = loadReadmeDescription(gameName);
  if (readme.hasReadme) {
    res.json(readme);
  } else {
    res.status(404).json({ error: "README non trouvé pour ce jeu" });
  }
});

// API - ajout d'un jeu (optionnel, POST)
app.post("/api/games", express.json(), (req, res) => {
  const {
    key,
    name,
    description,
    technology,
    youtubeUrl,
    difficulty,
    features,
    categorie,
  } = req.body;
  if (!key || !name || !categorie) {
    return res
      .status(400)
      .json({ success: false, message: "Champs obligatoires manquants." });
  }
  if (allGames.find((g) => g.key === key)) {
    return res
      .status(400)
      .json({ success: false, message: "Ce jeu existe déjà." });
  }
  allGames.push({
    key,
    name,
    description,
    technology,
    youtubeUrl,
    difficulty,
    features,
    categorie,
  });
  res.json({ success: true, message: "Jeu ajouté avec succès." });
});

// 404
app.use((req, res) => {
  res.status(404).render("error", {
    message: "Page non trouvée",
    error: "La page que vous cherchez n'existe pas.",
    title: "Erreur 404",
  });
});

// Start
app.listen(PORT, () => {
  console.log(`🎮 Serveur de jeux IA démarré sur http://localhost:${PORT}`);
  console.log(`🎯 Jeux configurés: ${allGames.map((g) => g.key).join(", ")}`);
  console.log(`📝 Dossier README: ./readmes/`);
});

module.exports = app;
