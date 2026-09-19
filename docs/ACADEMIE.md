# La grande Académie Ninja de Konoha

Lot « Académie » : un bâtiment majeur, partageable en ligne, construit entièrement
en code dans la scène du village. À l'origine, seuls l'espace physique, les
panneaux et les repères nommés étaient réservés ; **le lot suivant est livré** :
candidatures, équipes de trois numérotées et Sensei sont désormais activés à la
réception — voir [`docs/EQUIPES.md`](EQUIPES.md). La géométrie décrite ici est
inchangée.

## 1. Condition de déblocage (état réel, jamais parallèle)

- L'Académie s'ouvre **exactement quand la 2e mission de clan est terminée et la
  récompense réclamée auprès du chef de clan**. Le serveur écrit alors
  `secondaryMissions.unlocked = true` dans le profil ; le client ne fait que lire
  ce champ (`SecondaryMissionManager.unlocked`, déjà utilisé par les missions
  secondaires). Aucune nouvelle condition, aucun nouvel état serveur, aucune
  sauvegarde parallèle.
- Avant le déblocage, le bâtiment est **visible depuis les rues** mais la grande
  porte est fermée par une barrière scellée solide : « ACADÉMIE SCELLÉE ·
  Termine ta 2e mission de clan et réclame ta récompense ».
- À la transition verrouillé → débloqué, une notification unique apparaît :
  **« 🏫 L'Académie Ninja est maintenant accessible. »** (silencieuse si le
  compte est déjà débloqué au chargement).
- La première mission d'Aoi (repérage des trois panneaux) **reste intacte** : le
  panneau « Académie » a simplement déménagé avec l'académie (voir §3), les
  événements `read_academy`, l'ordre et la sauvegarde serveur sont inchangés.
  La 2e mission de clan et tout le lot missions secondaires sont inchangés.

## 2. Fichiers créés / modifiés

| Fichier | Rôle |
| --- | --- |
| `game/scripts/academy.gd` (**créé**) | `class_name Academy` (Node3D). Tout le bâtiment, la cour, le personnel, les zones de transition et le scellement. Pas de scène `.tscn` supplémentaire : le nœud est instancié par `KonohaVisit` dans le monde partagé, comme `SecondaryMissionManager`. |
| `game/scripts/konoha_visit.gd` (modifié) | Instancie `Academy`, appelle `academy.set_unlocked(secondary_manager.unlocked)` + `academy.update(...)` chaque frame physique, affiche les notifications, ajoute l'interaction `-7` « PARLER À LA RÉCEPTION ». |
| `game/scripts/konoha_map.gd` (modifié) | Le panneau repère « Académie » pointe vers la cour de la nouvelle académie ; l'ancienne maison devient « INTERNAT DES ÉLÈVES » ; la poche forestière ouest exclut le périmètre de l'académie (`ACADEMY_CLEAR`) ; la promenade d'Aya contourne le bâtiment. |
| `game/tests/smoke.gd` (modifié) | 12 nouvelles assertions académie (voir §10). |
| `game/tests/village_network.gd` (modifié) | Deux clients WSS réels se voient dans le hall partagé. |
| `docs/ACADEMIE.md`, `README.md`, `game/README.md` | Documentation du lot. |

Aucun modèle 3D, texture ou audio nouveau : tout est procédural (boîtes,
cylindres, sphères, Label3D), les matériaux passent par le cache existant
`TrainingFighter.material`. Aucun changement serveur.

## 3. Emplacement dans le village

- **Bâtiment** : x ∈ [-60, -32], z ∈ [-50, -18] (28 × 32 m, deux niveaux,
  faîtage à ~11 m) au nord-ouest du village, entre le quartier Inuzuka et la
  route transversale. Visible depuis la route centrale z = 0 et l'anneau ouest.
- **Cour** au sud : parvis dallé x ∈ [-61, -40], z ∈ [-18, -6], allée centrale
  jusqu'à la route z = 0 (bande de raccord), arbres, bancs, lanternes de pierre,
  poteaux/cibles d'entraînement, deux bannières « 学 » encadrant la porte.
- **Panneau repère** (lecture de la mission d'accueil) : dans la cour,
  `Vector3(-46, 0, -13)`.
- Périmètre vérifié contre tout l'existant : districts, sanctuaires, routes,
  source chaude, objectifs et donneurs de missions secondaires (la Docteure Hana
  se tient désormais dans la cour, cohérent avec sa zone « académie »), poche
  forestière (exclue), routes de PNJ (Aya détournée). Aucune superposition.

## 4. Entrée / sortie — pas de téléportation pirate

Structure réelle, sur le modèle fiable des zones de la résidence du Hokage mais
**sans poche privée** : l'académie est dans les limites du village, on y entre en
marchant.

- Grande porte de 6 m (x ∈ [-49, -43]) : montants vermillon, linteau, enseigne
  « ACADÉMIE NINJA », emblème doré « 学 », portique à auvent et lanternes.
- `AcademyEntrance` (Area3D, demi-épaisseur intérieure du seuil) →
  `AcademyInteriorSpawn` (Marker3D) ; `AcademyExit` (demi-épaisseur extérieure) →
  `AcademyExteriorSpawn`. Les zones **détectent seulement** : la marche traverse
  le seuil physiquement, aucune zone ne déplace le joueur.
- **Anti-ré-déclenchement** : verrou de transition 0,9 s + drapeaux
  `pending_enter`/`pending_exit` consommés une fois ; une sortie suivie d'une
  ré-entrée immédiate fonctionne sans boucle.
- Les marqueurs de spawn servent **uniquement de filet de sécurité** : chute sous
  la carte (y < -0,5) ou désynchronisation grave rectangulaire (le bandeau de
  porte z ∈ [-18,6, -17,6] est neutre pour éviter toute bascule parasite). Le
  joueur ne disparaît jamais, n'est jamais éjecté, ne reste jamais coincé.
- Tant que l'académie est scellée, la barrière solide remplit l'embrasure : la
  zone d'entrée est physiquement inaccessible.

## 5. Organisation intérieure (7 salles/zones + cour)

Navigation logique **ENTRÉE → HALL → (RÉCEPTION | INFORMATIONS | ENTRAÎNEMENT |
ADMINISTRATION/ESCALIERS)**, puis **COULOIR → (SALLES 1-3 | SALLE DES ÉQUIPES |
SALLE DES PROFESSEURS)**. Chaque pièce a son enseigne lisible des deux côtés.

**Rez-de-chaussée** (sol 0,16, murs 4,4 m, plafond = dalle de l'étage) :
1. **Hall d'accueil** (z ∈ [-30, -18]) : tapis central bordé d'or, 4 colonnes
   vermillon, poutres, 4 lanternes suspendues, bancs d'attente, emblème « 忍 »,
   panneau « AVIS AUX VISITEURS ». Assez vaste pour plusieurs joueurs.
2. **Réception** (est) : comptoir solide, documents, registres, rayonnage,
   chaise, pupitre « CANDIDATURES · COMPTOIR ACTIF » (place physique du recrutement),
   PNJ fixe **« Réceptionniste de l'Académie »** — interaction = informations
   générales seulement (`-7`).
3. **Salle des informations** (ouest) : grande carte de Konoha sur table, carte
   murale, règlement de l'Académie, portraits de shinobi, tableau
   « ÉQUIPES · ACTIVITÉS · réception active », étagère à parchemins.
4. **Zone d'entraînement** (nord-ouest, 14 × 20 m) : tatamis, 5 mannequins,
   3 cibles murales, râtelier d'armes décoratives, circulation libre, **aucun
   système de combat**, PNJ « Instructeur · Kenjutsu ».
5. **Administration + escalier** (nord-est) : deux bureaux, registres, PNJ
   « Administrateur », escalier physique le long du mur est.

**Premier étage** (sol 4,7, murs 3,4, plafond sous toiture) :
6. **Couloir** de 3,2 m de large (z ∈ [-33,2, -30]) : tapis, lanternes murales,
   linteaux et enseignes au-dessus de chaque porte.
7. **Trois salles de cours** au sud : SALLE 1 · FONDAMENTS (professeur + élève),
   SALLE 2 · HISTOIRE SHINOBI (professeure), SALLE 3 · LIBRE. Chacune : tableau,
   bureau du professeur, 6 pupitres avec chaises, étagère à parchemins.
8. **Grande salle des équipes** (nord-ouest, 14 × 16 m) : estrade
   « ENREGISTREMENT DES ÉQUIPES · AU COMPTOIR », panneaux « LISTE DES
   CANDIDATS · RÉCEPTION » et « INVITATIONS · HUD », bancs, bannières.
   **Le comptoir et les équipes sont actifs** — la liste, les invitations,
   le groupe provisoire et la cérémonie utilisent le protocole `team_action`.
9. **Salle des professeurs** (nord-est) : bibliothèque, trois bureaux, table de
   travail ; arrivée d'escalier au nord.

**Extérieur** : cour avec petit espace d'entraînement (poteaux + cibles), bancs,
arbres, lanternes, bannières, panneau d'information, 1 élève en discussion.

## 6. Étages et escalier — 100 % physique

- Escalier droit de 14 marches (largeur 3,2 m, montée 0,324 m, giron 0,78 m,
  pente ≈ 22°) : marches visuelles + **un seul collisionneur incliné** (idiome
  déjà validé dans la résidence du Hokage), mains courantes solides, garde-corps.
- Trémie d'escalier à l'étage avec garde-corps solides sur trois côtés ; le
  quatrième donne sur le palier nord. **Aucun téléport entre étages.**
- Palier → salle des professeurs / grande salle des équipes / couloir ; panneau
  « ESCALIER · PASSER AU NORD » visible du couloir.

## 7. PNJ (7, apparence et rôles variés)

Réutilisent `KonohaNPC` (poses fixes « discussion », étiquette de rôle) :
réceptionniste (femme), instructeur (homme), administrateur (ancien),
professeur · Fondaments (homme), professeure · Histoire Shinobi (femme),
élève en salle 1 (fille), élève dans la cour (garçon). Teintes et catégories
différentes — jamais le même modèle répété.

## 8. Collisions

- Murs, cloisons, dalles, toiture, portique, barrière de scellement, comptoir,
  bureaux, pupitres, bancs, estrade, garde-corps, mains courantes, troncs,
  poteaux : `StaticBody3D` couche 1 (boîtes/cylindres simples).
- Décor léger (parchemins, panneaux, tableaux, tapis, lanternes, cibles) :
  visuel non solide, comme dans la résidence.
- Le joueur (capsule r 0,33, `floor_snap_length` 0,35) franchit les ressauts de
  12-16 cm du parvis et du seuil sans saut ; la pente d'escalier est marchable.
- Impossible de traverser un mur, de sortir de la carte (l'académie est dans les
  limites `BOUNDS` et dans la validation serveur |x| ≤ 148, |z| ≤ 158, y ≤ 12)
  ou de tomber : la chute sous la carte est rattrapée par le marqueur intérieur.

## 9. Optimisations Android

- **3 OmniLight3D seulement** (hall, entraînement, couloir) ; fenêtres shoji et
  lanternes en matériaux **émissifs unshaded** (lumière du jour gratuite).
- **Cache de matériaux** par couleur dans `Academy` (une instance par teinte,
  contre un matériau neuf par boîte ailleurs).
- Collisions primitives (boîtes/cylindres), un collisionneur unique pour
  l'escalier, décor léger non solide, aucune particule, aucune texture
  supplémentaire, réutilisation des mesh procéduraux et des `KonohaNPC`.
- 7 PNJ décoratifs en pose fixe (pas d'errance), zéro calcul par frame hors
  `update()` (deux comparaisons de drapeaux + verrou de transition).

## 10. Tests obligatoires (couverts)

`game/tests/smoke.gd` ( assertions dédiées) :
1. académie scellée au départ (barrière visible, `unlocked` faux) ;
2. la barrière **bloque physiquement** la marche vers la porte ;
3. l'état réel des missions (`unlocked: true`, écrit par la récompense de la
   2e mission de clan) ouvre l'académie avec **une seule notification** ;
4. la marche traverse la porte et arrive dans le hall partagé (z < -19, y > 0,
   au sol) — arrivée correcte, pas de téléport scripté ;
5. le mur ouest reste solide (rayon bloqué) et l'embrasure ouverte reste libre
   (rayon passant) une fois déscellée ;
6. l'escalier physique mène à l'étage (y > 3,6, au sol) sans téléport ;
7. le marqueur `AcademyInteriorSpawn` est bien dans l'emprise intérieure ;
8. la sortie en marchant replace **exactement dans la cour** (z ∈ ]-17, -6[,
   au sol), jamais à travers un mur ;
9. **ré-entrée immédiate** sans boucle de transition ;
10. le scellement suit l'état serveur **dans les deux sens** ;
11. quitter l'emprise efface l'état intérieur partagé ;
12. le panneau repère « Académie » reste lisible à son nouvel emplacement
    (boucle existante des trois panneaux de la mission d'Aoi).

`game/tests/village_network.gd` : deux clients WSS réels placés dans le hall
voient chacun l'avatar de l'autre aux coordonnées de l'académie (**espace
partagé, jamais d'instance privée**) et l'état de l'académie suit l'état réel
des missions sur chaque client.

`npm test` inclut les tests persistants du `TeamService` : candidature,
profils, invitations, groupes provisoires, équipe officielle, Sensei et
reconnexion. Les contrôles Godot/Android (smoke complet, réseau, compilation
APK) passent par GitHub Actions sur cette branche.

## 11. Repères physiques du système d'équipes

Repères nommés utilisés par le parcours physique « candidatures / compagnons /
équipes / Sensei » :

| Identifiant | Type | Emplacement |
| --- | --- | --- |
| `Academy` | Node3D (`class_name Academy`) | monde du village |
| `AcademyEntrance` / `AcademyExit` | Area3D | seuil de la grande porte |
| `AcademyInteriorSpawn` / `AcademyExteriorSpawn` | Marker3D | repli de sécurité |
| `AcademyReception` | Area3D | devant le comptoir (interaction `-7`) |
| `AcademyClassroom1/2/3` | Marker3D | portes des salles de cours |
| `AcademyTrainingArea` | Marker3D | zone d'entraînement RDC |
| `AcademyInformationBoard` | Marker3D | salle des informations |
| `AcademyTeamRegistrationArea` | Marker3D | estrade d'enregistrement (étage) |
| `AcademyTeamArea` | Marker3D | grande salle des équipes (étage) |

La salle des équipes (14 × 16 m), son estrade, ses panneaux d'annonce et le
pupitre « CANDIDATURES » de la réception constituent l'espace physique réservé à
la réception des candidatures, la recherche de compagnons, la liste des
candidats, la formation d'équipes et les annonces.

## 12. Limites assumées

- Pas de portes battantes : l'embrasure ouverte est le choix fiable (aucun
  système de charnière existant à réutiliser).
- Les PNJ sont en pose fixe (idle/discussion) : pas d'élèves assis animés ni de
  rondes, conformément au budget Android.
- L'éclairage est statique : pas de cycle jour/nuit dans l'académie.
- La validation Godot finale (smoke 12 assertions, test réseau, APK) passe par
  le workflow CI ; l'édition d'épinglage de branche du workflow reste à faire
  par le propriétaire (permission `workflows` requise).
