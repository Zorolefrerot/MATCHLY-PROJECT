# MÉMO VIVE — Document de conception (Game Design Document)

> **Titre de travail :** MÉMO VIVE *(jeu de mots : « mémoire vive » = la RAM + « mémé vive »)*
> **Alternatives :** PIXEL CITY · SYS:LIFE · LA GRANDE MACHINE
> **Genre :** Aventure / action en **vue de dessus** (Zelda-like) + collection de mini-jeux
> **Inspirations :** Le Monde des Emoji (Emoji Pop), Les Mondes de Ralph (1 & 2)
> **Plateformes :** Android (APK) + jouable au clavier sur PC
> **Public :** familial, 7 ans et + · humour omniprésent
> **Langues :** français (défaut) + anglais, commutables en jeu

---

## 1. Pitch

Tu es **PIX**, un petit pixel-emoji tout juste « installé » dans un **téléphone flambant neuf**.
Ta mission : vivre à l'intérieur de l'appareil et accomplir les **missions essentielles à son
fonctionnement** — recharger la batterie, libérer la mémoire, réparer le signal, livrer les
paquets de données…

Mais un virus légendaire, **CORRUPTUS**, s'est infiltré dans une appli piratée. Là où il passe,
le monde « buggue », se fige, se corrompt. Sa signature : **l'Écran Bleu**. PIX devra explorer
le téléphone, puis le PC auquel il sera synchronisé, puis le Cloud lui-même, rallier les
habitants des applications et sauver… la Grande Machine.

---

## 2. Le héros et les personnages

| Personnage | Rôle |
|---|---|
| **PIX** | Le héros. Pixel-emoji hybride, curieux, malicieux. Personalisable (couleurs, chapeau, accessoires). |
| **CURSEUR** | Le guide. Un curseur agile qui fait office de « taxi » pour voyager vite entre les zones (comme la voiture de Ralph dans les câbles). |
| **PATCH** | L'antivirus. Général militaire bougon mais au grand cœur. Donne les missions de défense. |
| **CTRL, ALT & SUPPR** | Trio de gardiens du système. Comiques, toujours en désaccord. |
| **DEFRAG** | La concierge du disque dur (côté PC). Connaît tous les fichiers par leur nom. |
| **MADAME PIXEL** | La doyenne du GPU (côté PC), artiste qui « dessine » le monde en temps réel. |
| **HORLOGE** | Le maire de l'écran d'accueil. Sonne les heures depuis la première mise en marche. Sait des choses sur CORRUPTUS… |
| **Les Emojis** | Habitants variés — chaque emoji a sa personnalité (comme dans Le Monde des Emoji). |
| **Le Propriétaire** | L'humain invisible au-dessus de tout. Ses clics = des séismes, ses frappes clavier = une pluie de lettres. On ne voit que ses effets. |
| **CORRUPTUS** | Le grand méchant. Virus légendaire voyageant d'appareil en appareil. |

---

## 3. La boucle de jeu (core loop)

```
EXPLORER l'appareil librement (vue de dessus)
   → une ALERTE SYSTÈME tombe (mission)
      → RÉSOUDRE : exploration, plateforme, puzzle ou mini-jeu
         → RÉCOMPENSE : Mo (monnaie), améliorations, nouveaux quartiers débloqués
            → l'HISTOIRE avance (CORRUPTUS se rapproche…)
               → et on recommence
```

Le joueur est libre : les missions essentielles font avancer l'histoire, mais il peut
aussi vagabonder, parler aux habitants, jouer aux mini-jeux dans **l'arcade du GPU**
(rejouables, avec high scores) ou dans les applis elles-mêmes.

---

## 4. Les mondes — structure en 3 actes

### ACTE 1 — LE TÉLÉPHONE (le monde de départ)
Comme dans Le Monde des Emoji : l'aventure commence **dans le téléphone**, dont
l'écran d'accueil est une ville en grille d'applications.

| Zone | Ambiance | Gameplay dominant |
|---|---|---|
| **L'Écran d'accueil** | Place centrale + rues en grille, applis = bâtiments, l'Horloge géante au centre | Hub, dialogues, boutique |
| **La Batterie** | Réservoir vital vert, au sud-est | Gestion d'énergie, missions de charge |
| **Le Mode économie** | Pénurie : quartiers éteints, éclairage réduit | Exploration sombre |
| **Les Capteurs** (GPS, gyroscope, photo) | Observatoires en hauteur | Mini-quêtes |
| **L'Antenne 4G / WiFi** | Tour qui capte le Cloud — un signal corrompu en descend parfois… | Teasing du Acte 3 |
| **Les Notifications** | Messagers qui traversent le ciel | Événements, alertes |

### ACTE 2 — LE PC (la ville-machine industrielle)
Le Propriétaire connecte son téléphone à un PC et synchronise ses données : PIX est
« uploadé » dans la grande machine. Chaque composant est un **quartier** :

| Zone | Ambiance | Gameplay dominant |
|---|---|---|
| **Le Bureau** | Place centrale, icônes = immeubles | Hub, dialogues |
| **La RAM (Mémoire Vive)** | Quartier néon arc-en-ciel, **volatile : change entre deux visites !** | Parcours dynamique |
| **Le CPU** | Usine chaude dominée par l'Horloge géante (les GHz) | Plateforme précis, ennemis |
| **Le GPU** | Casino / arcade magenta-cyber ; c'est ici que le monde est « dessiné » | Arcade, mini-jeux |
| **Le Disque dur** | Entrepôts poussiéreux, archives, souvenirs anciens | Exploration-énigme |
| **La Corbeille** | Décharge sombre — les fichiers « supprimés » n'y sont pas vraiment morts… | Exploration émotionnelle |
| **Le Ventilateur** | Moulin géant qui règle la « météo thermique » | Plateforme rotative |
| **La Carte réseau** | Autoroute de câbles lumineux | Course / vitesse |
| **Les Ports USB** | Gares de transit des périphériques | Mini-quêtes |

### ACTE 3 — LE CLOUD ET LE WEB (le ciel de données)
- Le **Navigateur (Navik)** = le port d'où l'on embarque vers Internet
- Le **moteur de recherche** = gare centrale de tri (et fast-travel)
- Chaque **site web** = une île au style propre (réseau social, streaming, jeux, encyclopédie…)
- Le **Cloud** = cité céleste reliant le téléphone et le PC
- Zone interdite et dangereuse : **le Web Sombre** (optionnel, haut niveau)

---

## 5. Missions essentielles (exemples concrets)

1. **« Batterie critique ! »** *(mission du prototype — acte 1)* — cinq éclats d'énergie se
   sont échappés dans les rues de l'écran d'accueil : les récupérer et les rapporter à la
   Batterie. → Exploration + collecte + livraison.
2. **« Le grand ralentissement »** — la machine rame : enquête pour trouver le processus fautif.
   → Enquête, interrogations d'emojis, indices dans les journaux système.
3. **« Livraison express »** — acheminer un paquet de données du réseau jusqu'au bon port.
   → Course dans les câbles à la Ralph, avec embranchements et raccourcis.
4. **« La Grande Mise à Jour »** — protéger le téléchargement d'une mise à jour.
   → Mini *tower defense* contre des vagues de virus.
5. **« Perte de signal »** — réparer la connexion WiFi. → Plateforme sur les antennes.
6. **« Le fichier perdu »** — la photo d'anniversaire du Propriétaire a été supprimée par erreur.
   → Exploration de la Corbeille **contre la purge automatique** (chronométré, émotion garantie).
7. **« Urgence surchauffe ! »** *(acte 2, PC)* — le CPU flambe, le ventilateur est bloqué.
   → Plateforme rotative + boss **Golem de Poussière**.
8. **« Ménage de printemps »** *(acte 2)* — la RAM est saturée. → Mini-jeu de tri/timing.

Chaque mission terminée a un **effet visible sur le monde** : la batterie se met à briller,
les rues s'illuminent, le « temps » redevient fluide. Le joueur voit qu'il est **utile à
la machine**.

---

## 6. Les applications = mondes-portails + mini-jeux

> ⚠️ **Marques :** Facebook, YouTube, Candy Crush, Zuma… sont des marques déposées.
> On garde le look « reconnaissable » mais avec des **noms parodiques** — indispensable
> si le jeu est un jour publié.

| Appli parodique | Inspirée de | Le monde | Le mini-jeu |
|---|---|---|---|
| **VidiTube** | YouTube | Quartier de salles de cinéma, écrans géants | Synchroniser les paquets pour éviter le *buffering* (rythme/timing) + gérer une chaîne à 1M d'abonnés |
| **AmiBook** | Facebook | Place du village social, mur de publications | Réconcilier des emojis brouillés, tri vrai/faux info |
| **Bonbon Smash** | Candy Crush | Usine de bonbons colorés | **Match-3** complet avec objectifs par niveaux |
| **Marbouilles** | Zuma | Temple avec des rails de billes | **Tireur de billes** : stopper la chaîne avant le trou |
| **ChronoMail** | Gmail/Outlook | Bureau de tri postal | Trier urgent / spam / important sous pression |
| **Blabla** | WhatsApp | Salon de discussion | Dialogues à choix, quêtes sociales |
| **ClipClip** | TikTok | Scène de studio | Mini-jeu de rythme / danse |
| **Musiko** | Spotify | Club de musique | Jeu de rythme musical |
| **Navik** | Chrome | Le port/navigateur | **Portail vers Internet** : îles-web à explorer |
| **La Boutique** | Play Store | Grand marché | Dépenser les Mo en améliorations |

Tous les mini-jeux seront **rejouables à volonté** dans l'**arcade du GPU** (acte 2),
avec high scores.

---

## 7. Ennemis et boss

- **Pop-ups publicitaires** — surgissent et bloquent le passage ; il faut trouver leur
  « petite croix » (mini-épreuve de réflexes) pour les fermer.
- **Vers** — suivent les câbles, se déplacent en groupes.
- **Chevaux de Troie** — déguisés en fichiers amis jusqu'à ce qu'on s'approche trop près.
- **Ransomwares** — prennent des fichiers en otage (quêtes de sauvetage).
- **Spambots** — tirent des salves de publicités.
- **Zones corrompues** — glitches qui s'étendent (comme dans Ralph 2) : déforment le décor
  et désactivent certaines capacités.
- **Boss** : Golem de Poussière (ventilateur) · Cheval de Troie géant · Reine des Spambots ·
  **CORRUPTUS final** qui fusionne en **Écran Bleu vivant géant**.

---

## 8. Progression et améliorations

- **Monnaie : les Mo** (méga-octets) — gagnés en missions, mini-jeux et caches secrètes.
- **La Boutique** :
  - `Chapeau Pixel` → cosmétique (déjà dans le prototype)
  - `+RAM` → inventaire et « mémoire de quêtes » élargis
  - `VPN` → cape d'invisibilité temporaire
  - `AdBlock` → bouclier contre les pop-ups
  - `GPU+` → double saut et effets visuels
  - `Overclock` → sprint
  - `Lampe Mode Sommeil` → éclairer les zones éteintes
- **Vies = points de restauration système** (thème cohérent : « restaurer » une sauvegarde).
- **Carte du système** qui se colore quartier par quartier.

---

## 9. Scénario en 3 actes

**Acte 1 — Premier démarrage.** Le téléphone s'allume pour la première fois : PIX naît
sur l'écran d'accueil. CURSEUR lui enseigne le métier ; HORLOGE murmure de vieilles
légendes. Des glitches inexplicables apparaissent… et l'antenne WiFi capte un signal
CORROMPU qui descend du Cloud. PIX recharge la batterie, stabilise la machine — mais
quelque chose s'est déjà glissé dedans.

**Acte 2 — La Synchronisation.** Le Propriétaire connecte le téléphone à son PC et
synchronise ses données : PIX est propulsé dans la ville-machine (CPU, RAM, GPU, disque
dur, corbeille…). CORRUPTUS voyage par la synchronisation et tente de figer le PC :
l'**écran bleu** est évité de justesse. On découvre que CORRUPTUS remonte vers le Cloud.

**Acte 3 — Le Ciel de Données.** Poursuite dans le Cloud et le web. PIX rallie les héros
de toutes les applications (les stars des mini-jeux rejoignent l'équipe, comme dans
Ralph 2). Bataille finale contre CORRUPTUS devenu Écran Bleu géant. Victoire = la
**Grande Mise à Jour** du système. Épilogue : PIX choisit de rester vivre dans la
machine — « chez lui ».

---

## 10. Direction artistique et audio

- **2D colorée**, néons sur fond sombre « circuit imprimé » pour les zones techniques.
- Palette par quartier : batterie vert électrique · écran d'accueil bleu nuit + néons ·
  CPU rouge/orange · RAM arc-en-ciel · disque dur sépia poussiéreux · GPU magenta ·
  Cloud blanc doré.
- Habitants : emojis ronds, icônes carrées, fenêtres, curseurs.
- **Humour système partout** : fichiers nommés `rapport_FINAL_v3_VRAIMENTfinal.docx`,
  l'emoji « larmes de joie » qui rit dans un coin, un PNG transparent qui se croit invisible…
- Audio : musiques électroniques par zone, sons système détournés, jingles distincts par
  mini-jeu. Le prototype génère déjà ses effets sonores par code (aucun fichier requis).

---

## 11. Technique

- **Moteur : Godot 4** (rendu *GL Compatibility* pour tourner sur un maximum de téléphones).
- **Vue de dessus**, contrôles : clavier (ZQSD/WASD/flèches + E) et **joystick virtuel
  tactile + bouton d'action** sur mobile.
- **Sauvegardes** : fichier local (`user://save.json`) — langage, Mo, mission, objets.
- **Assets 100 % générés par code** au démarrage (pixel-art dessiné en GDScript) :
  pas de dépendance, style cohérent, puis remplacement progressif par de vrais sprites.
- **APK Android : workflow GitHub Actions** (`.github/workflows/jeu-godot-android.yml`)
  qui vérifie les scripts, teste le démarrage, compile l'APK, l'aligne, le signe avec une
  clé de test stable et le publie en **release GitHub** — même principe que le pipeline
  ShopFlow du dépôt. Paquet : `cd.memovive.game`.
- Le jeu vit dans le dossier **`jeu/`** sans toucher au site ShopFlow existant.

---

## 12. Feuille de route

| Phase | Contenu | Statut |
|---|---|---|
| **0/1 — Prototype (acte 1)** | Écran d'accueil complet (10 bâtiments d'applis + antenne + Horloge), déplacement vue de dessus clavier + tactile, dialogues FR/EN, PNJ animés, mission « Batterie critique » (5 éclats → livraison), boutique + Chapeau Pixel, sauvegarde, pipeline APK | ✅ Livré |
| **2 — Aventure téléphone** | Ennemis (pop-ups, vers), 2-3 mini-jeux jouables (Bonbon Smash, Marbouilles, ChronoMail), quartier Batterie étendu, capteurs, mode économie | ⏳ |
| **3 — Le PC (acte 2)** | Synchronisation scénarisée, quartiers CPU/RAM/GPU/disque/corbeille, arcade du GPU, boss | ⏳ |
| **4 — Cloud & fin (acte 3)** | Navik, îles-web, Cloud, boss final CORRUPTUS, APK signé + page de téléchargement | ⏳ |
| **5 — Polish** | Musiques, effets, personnalisation de PIX, icônes Android dédiées | ⏳ |

---

## 13. Décisions actées

| Décision | Choix |
|---|---|
| Vue / caméra | **Vue de dessus** (Zelda-like) ; mini-jeux dans la vue qui convient |
| Moteur | **Godot 4** |
| Monde de départ | **Le téléphone** (comme Le Monde des Emoji), puis PC, puis Cloud |
| Langues | **Français (défaut) + anglais**, commutables dans le menu pause |
| Noms d'applis | Parodies (AmiBook, VidiTube, Bonbon Smash, Marbouilles…) |
