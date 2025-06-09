# 🎮 Collection de Jeux avec IA

Une application Node.js qui présente une collection de jeux intégrant des algorithmes d'intelligence artificielle.

## 🚀 Installation

1. **Installer les dépendances**
```bash
npm install
```

## 📁 Structure du projet

```
ai-games-collection/
├── server.js              # Serveur principal
├── package.json           # Dépendances
├── README.md             # Ce fichier
├── views/                # Templates EJS
│   ├── home.ejs          # Page d'accueil
│   ├── game-detail.ejs   # Détails d'un jeu
│   └── error.ejs         # Page d'erreur
├── code/                 # Vos jeux HTML
│   ├── snake-ai.html     # Exemple : jeu Snake avec IA
│   ├── chess-ai.html     # Exemple : échecs vs IA
│   └── ...               # Autres jeux
└── public/               # Fichiers statiques (CSS, JS, images)
```

## 🎯 Utilisation

1. **Démarrer le serveur**
```bash
npm start
# ou pour le développement avec auto-reload
npm run dev
```

2. **Accéder à l'application**
Ouvrir http://localhost:3000 dans votre navigateur

## 🎮 Ajouter un nouveau jeu

1. **Créer le fichier HTML du jeu**
Placer votre jeu dans `/code/nom-du-jeu.html`

2. **Ajouter la configuration dans server.js**
```javascript
const gamesConfig = {
  // ... autres jeux
  'nom-du-jeu': {
    name: 'Nom Affiché du Jeu',
    description: 'Description détaillée du jeu et de son IA...',
    technology: 'Technologies utilisées (ex: JavaScript, TensorFlow.js)',
    youtubeUrl: 'https://www.youtube.com/watch?v=VOTRE_VIDEO',
    difficulty: 'Débutant|Intermédiaire|Avancé',
    features: ['Fonctionnalité 1', 'Fonctionnalité 2', 'Fonctionnalité 3']
  }
};
```

3. **Redémarrer le serveur**
Le nouveau jeu apparaîtra automatiquement sur la page d'accueil.

## 🔧 Configuration

### Personnaliser les jeux existants

Modifiez l'objet `gamesConfig` dans `server.js` pour :
- Changer les descriptions
- Mettre à jour les liens YouTube
- Modifier les technologies listées
- Ajuster les niveaux de difficulté

### Changer le port

```javascript
const PORT = process.env.PORT || 3000; // Modifier ici
```

### Personnaliser l'apparence

- Modifier les templates EJS dans `/views/`
- Ajouter du CSS personnalisé dans `/public/`
- Utiliser Bootstrap 5 (déjà inclus) pour le design

## 📋 Fonctionnalités

- ✅ **Page d'accueil** avec liste de tous les jeux
- ✅ **Pages de détail** pour chaque jeu avec description complète
- ✅ **Intégration YouTube** pour les démonstrations vidéo
- ✅ **Lancement direct** des jeux HTML
- ✅ **Design responsive** avec Bootstrap
- ✅ **API REST** pour la gestion des jeux
- ✅ **Gestion d'erreurs** et pages 404
- ✅ **Interface moderne** avec icônes Font Awesome

## 🎨 Exemples de jeux à créer

- **Snake avec IA** - Algorithme génétique ou Q-Learning
- **Échecs vs IA** - Algorithme Minimax avec élagage alpha-beta
- **Résolveur de Puzzle** - Algorithmes A* ou BFS
- **Tic-Tac-Toe IA** - Minimax simple
- **Jeu de Dames** - IA avec évaluation heuristique
- **2048 avec IA** - Monte Carlo Tree Search
- **Pacman IA** - Algorithmes de pathfinding

## 🚨 Notes importantes

- Assurez-vous que vos fichiers HTML de jeux sont autonomes
- Utilisez des chemins relatifs dans vos jeux HTML
- Testez chaque jeu individuellement avant de l'ajouter
- Les vidéos YouTube peuvent être remplacées par des liens vers votre documentation

## 🛠️ Développement

Pour contribuer ou modifier :

1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Tester vos modifications
4. Soumettre une pull request

## 📞 Support

Si vous rencontrez des problèmes :
- Vérifiez que tous les fichiers sont dans les bons dossiers
- Assurez-vous que Node.js est installé (version 14+)
- Vérifiez les logs du serveur pour les erreurs

Bon développement ! 🎮✨