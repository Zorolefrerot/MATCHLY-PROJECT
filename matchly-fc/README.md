# Matchly FC 27 — Édition Logo Officiel

PWA de football tactique 2D : 5 titulaires choisis dans un effectif de 15, remplacements en match, carrière, championnats, coupes, défis, matchs en ligne et vidéo d'ouverture.

## Logo et thème
Le logo officiel fourni par le créateur est utilisé dans l'en-tête, l'écran PWA, les icônes et la carrière (`public/brand/matchly-fc27-logo-512.png`, icônes dérivées dans `public/icons/`). Le thème reprend ses couleurs : bleu marine `#050B2E`, bleu électrique `#00A8FF`, magenta `#FF2EA6`, doré `#FFD21F` et blanc argenté.

## Cinématique vidéo
L'ouverture est une vraie balise `<video>` : `public/video/matchly-fc27-opening.mp4`, 30 secondes d'actions Matchly animées (passes, courses, frappes et buts) avec la piste Afro Stadium intégrée. Aucun texte ni bouton parasite : uniquement **Passer** et **Son**. Les musiques du jeu sont des compositions originales inspirées de l'énergie FC/FIFA/eFootball/DLS ; aucun morceau commercial protégé n'est redistribué.

## Règles de match ajoutées
- Chaque équipe possède **15 joueurs maximum** avec TIR/PHY/CTR : 5 titulaires à classer et 10 remplaçants.
- **3 remplacements maximum par équipe** pendant le match, synchronisés en ligne ; le gardien ne peut être remplacé que par un gardien.
- En ligne : **3 pauses maximum par joueur**, chaque pause dure **15 secondes** puis reprise automatique.
- Les **buts contre son camp** sont détectés grâce à la dernière touche et affichés comme tels.
- Un joueur poussé dans une cage est automatiquement replacé à l'extérieur, en position défensive.
- Match amical : bot en **4 niveaux** — Débutant, Professionnel, Élite, Légende.
- Statistiques des joueurs existants légèrement revalorisées (+1/+2, plafonnées).

## Équipes et déblocages
Base de **50 clubs, 50 sélections nationales et Blue Lock XI** (101 équipes), chacune avec 15 joueurs. Quelques équipes sont disponibles au départ ; les autres se débloquent par trophées, coupes, championnat, défis quotidiens, défis en ligne et défis spéciaux (dont le projet Blue Lock).

## Mode Carrière & Championnat
Créez votre club : nom, coach, **logo importé**, capitaine star au choix. Vous recevez ensuite un effectif aléatoire de jeunes joueurs peu connus (Arabie Saoudite, RD Congo, Croatie, Slovénie, États-Unis, Japon, etc.) : deux carrières ne se ressemblent pas, avec quelques joueurs parfois communs. Parcours en 5 divisions — Division 3, Division 2, Division 1, Division Master, Division Légende — avec classement, calendrier, marché des transferts, entraînement/évolution et revente pour gagner des Crédits FC.

## Responsive
Interface fluide et espacée pensée mobile-first : aucun dépassement horizontal sur smartphone, tablette ou PC (`overflow-x` verrouillé, grilles adaptatives, zones tactiles et safe-areas). Le son se coupe automatiquement dès que l'onglet/l'application passe en arrière-plan ou se ferme.

## Installation PWA
Android Chrome : menu ⋮ → *Ajouter à l'écran d'accueil*. iPhone Safari : Partager → *Sur l'écran d'accueil*. L'application se lance ensuite en plein écran depuis l'icône Matchly FC 27.

## Développement et déploiement
```bash
npm ci
npm run typecheck && npm run build
npm start # sert dist/ sur 0.0.0.0:5173
```
Render : Blueprint `render.yaml` (Root Directory `matchly-fc`, Build `npm ci && npm run build`, Start `npm start`, Health `/api/health`).
