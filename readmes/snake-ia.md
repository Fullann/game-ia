# Snake avec IA - Documentation détaillée

## 🎯 Vue d'ensemble

Ce projet implémente le jeu classique **Snake** avec une intelligence artificielle qui apprend à jouer en utilisant des **algorithmes génétiques**. L'IA évolue génération après génération pour optimiser sa stratégie de jeu.

## 🧬 Algorithmes utilisés

### Algorithme Génétique
L'IA utilise un algorithme génétique pour faire évoluer sa stratégie :

- **Population** : 50 serpents par génération
- **Sélection** : Les meilleurs performers sont sélectionnés pour la reproduction
- **Croisement** : Combinaison des stratégies gagnantes
- **Mutation** : Introduction de variations aléatoires pour explorer de nouvelles stratégies

### Réseau de neurones
Chaque serpent possède un réseau de neurones simple :
- **Entrées** : 8 capteurs de distance (obstacles et nourriture)
- **Couches cachées** : 2 couches de 16 neurones chacune
- **Sorties** : 4 directions possibles (haut, bas, gauche, droite)

## 🎮 Fonctionnalités

### Mode Observation
- Regardez l'IA apprendre en temps réel
- Statistiques en direct de la génération actuelle
- Graphiques de progression des performances

### Mode Interactif
- Jouez vous-même contre l'IA entraînée
- Comparez votre score avec celui de l'IA
- Mode défi avec différents niveaux de difficulté

### Visualisation
- Affichage des capteurs de l'IA
- Heatmap des zones explorées
- Graphique d'évolution des scores par génération

## 📊 Métriques de performance

L'IA est évaluée selon plusieurs critères :
- **Score** : Nombre de pommes mangées
- **Temps de survie** : Durée avant collision
- **Efficacité** : Ratio distance parcourue / score
- **Exploration** : Pourcentage de la grille visitée

## 🔧 Paramètres configurables

Vous pouvez ajuster plusieurs paramètres :
- Taille de la population
- Taux de mutation
- Vitesse de simulation
- Complexité du réseau de neurones

## 🚀 Utilisation

1. **Démarrage automatique** : L'IA commence à apprendre dès le chargement
2. **Contrôles** :
   - `Espace` : Pause/Reprendre
   - `R` : Redémarrer la simulation
   - `+/-` : Ajuster la vitesse
3. **Observation** : Suivez l'évolution des performances dans le panneau de statistiques

## 📈 Résultats attendus

Après environ 50 générations, l'IA devrait :
- Atteindre des scores moyens de 15-20 pommes
- Éviter efficacement les murs et sa propre queue
- Développer des stratégies de spirale pour maximiser l'espace
- Optimiser ses déplacements vers la nourriture

## 🔬 Aspects techniques

### Architecture du code
```
snake-ia/
├── neural-network.js    # Implémentation du réseau de neurones
├── genetic-algorithm.js # Logique de l'algorithme génétique
├── game-engine.js       # Moteur de jeu Snake
├── visualization.js     # Interface et graphiques
└── config.js           # Paramètres configurables
```

### Optimisations implémentées
- Simulation accélérée pour l'entraînement
- Parallélisation des calculs de fitness
- Élitisme pour préserver les meilleures solutions
- Décroissance adaptative du taux de mutation

## 🎓 Objectifs pédagogiques

Ce projet illustre :
- Les **algorithmes génétiques** et leur application aux jeux
- L'**apprentissage par renforcement** sans supervision
- L'importance de la **fonction de fitness** dans l'évolution
- Les **réseaux de neurones** comme système de décision
- L'**optimisation** et les métaheuristiques

## 🏆 Défis et