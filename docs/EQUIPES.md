# Candidatures et équipes de trois · Académie Ninja

Lot « Équipes » : le système complet de recrutement à la réception de l'Académie.
Un joueur dépose sa candidature **physiquement au comptoir**, apparaît avec son
**portrait** dans la liste des candidats, choisit ses compagnons, forme un groupe
de **exactement trois membres confirmés**, reçoit un **numéro unique**
(ÉQUIPE 001, 002, …) puis un **Sensei distinct** qui entre en scène pour la
cérémonie officielle. **Tout est validé par le serveur** ; le client affiche et
n'envoie jamais une identité, un niveau ou une apparence.

Aucun système de missions d'équipe, de progression, de rang, d'examens Chunin,
d'entraînement spécial, de compétences combinées, de matchmaking complexe ou de
PvP d'équipe n'est inclus dans ce lot.

## 1. Fichiers créés / modifiés

| Fichier | Rôle |
| --- | --- |
| `server/team-system.js` | **Créé.** `TeamService` (candidature, invitations, composition, numéros, Sensei), viviers `TEAM_NPC_CANDIDATES` (Kaito, Renji) et `TEAM_SENSEI` (4 Sensei originaux), drapeau `TEAM_RECRUITMENT_TEST_MODE`, `teamStateForUser` pour le profil HTTP. |
| `server/schema.js` | 4 tables idempotentes : `team_candidates`, `teams`, `team_members`, `team_invites` (SQLite + Postgres, créées au démarrage). |
| `server/village-room.js` | `broadcastTeams()`, envoi du `team_state` à la connexion, dispatch `team_action` → `team_action_ack` (mêmes garde-fous `exact()` que les missions secondaires). |
| `server/village.js` | Instancie `TeamService`, le relie à la room (`onChange → broadcastTeams`) et au rafraîchissement 1 s. |
| `server/game.js` | `/api/game/profile` inclut `team:` (état durable sans la liste des candidats). |
| `game/scripts/team_manager.gd` | **Créé.** Menus de la réception, liste des candidats avec portraits, fiches profil, carte d'invitation non bloquante, aperçu du groupe, cérémonie (dialogue du Sensei). |
| `game/scripts/portrait.gd` | **Créé.** `NinjaPortrait` : portraits procéduraux 96×96 générés depuis l'apparence validée, cache par signature. |
| `game/scripts/team_sensei.gd` | **Créé.** Le Sensei de la cérémonie : corps `TrainingFighter` + gilet vert de Konoha, marche physique vers l'équipe, étiquette nom/titre. |
| `game/scripts/village_link.gd` | `team_action()`, validation réception `team_state` / `team_action_ack`, codes d'erreur `TEAM_*` dans la liste blanche. |
| `game/scripts/konoha_visit.gd` | Interaction **-7** (réception) → menu de la réceptionniste ; routage des événements équipe ; synchro profil HTTP ; fermeture du panneau sur journal/chat/pause/Hokage. |
| `game/scripts/academy.gd` | Panneaux de la grande salle des équipes mis à jour (« À VENIR » → système ouvert). Géométrie inchangée. |
| `tests/team-system.test.js` | **Créé.** 20 tests serveur (voir §12). |
| `game/tests/smoke.gd` | Bloc fumée client : validation d'état, portraits, carte d'invitation, cérémonie et marche du Sensei. |

## 2. Flux joueur

1. L'Académie est débloquée (2e mission de clan récompensée — condition
   existante, aucune condition parallèle).
2. Le joueur marche jusqu'au **comptoir de la réception** (rez-de-chaussée,
   `AcademyReception` en (-37.5, ·, -21.4)) et appuie sur INTERAGIR.
3. La réceptionniste ouvre le menu : **« Que souhaitez-vous faire ? »** avec
   `[DÉPOSER MA CANDIDATURE]` `[CONSULTER LES CANDIDATS]` `[MON GROUPE / MON
   ÉQUIPE]` `[RETIRER MA CANDIDATURE]` `[ANNULER]` selon l'état serveur.
4. La candidature déposée, le joueur apparaît dans la liste avec son portrait,
   son niveau durable, son clan et son affinité. Il consulte les fiches
   (portrait agrandi + personnalité + style) et invite ses compagnons.
5. Chaque invité reçoit une **carte d'invitation non bloquante** (portrait +
   nom + clan + niveau, `[ACCEPTER]` `[REFUSER]`), visible partout — c'est la
   « notification de candidature active ».
6. À **3/3 membres confirmés**, n'importe lequel des trois appuie sur
   `[FORMER L'ÉQUIPE OFFICIELLE]` **au comptoir**. Le serveur attribue le
   **numéro unique AVANT le Sensei**, puis le Sensei entre à pied, rejoint
   l'équipe et tient ses répliques personnalisées (« Vous êtes donc les membres
   de l'équipe 001. … »). Léger et non bloquant : la scène continue de tourner.

Statuts affichés partout : 🟡 En recherche d'équipe → 🟢 Groupe en formation →
🔵 Équipe créée (ÉQUIPE 0XX). Les membres d'un groupe/équipe sont **retirés de
la liste des candidats** et non sélectionnables.

## 3. Portraits (joueurs et PNJ)

- **Aucune image n'est transférée ni stockée.** Le réseau ne porte que la
  *référence* d'apparence : le dictionnaire d'indices cosmétiques à 9 champs
  déjà validé par `validAppearance` côté serveur (`model, hair, hair_color,
  eyes, skin, top, top_color, bottom, bottom_color`).
- `NinjaPortrait.texture(appearance, sensei)` dessine localement un portrait
  **96×96** (remplissages rectangulaires : fond dégradé, tenue de la couleur
  enregistrée, tête, 4 coupes de cheveux, yeux, bandeau frontal de Konoha ;
  style Sensei = gilet vert + liseré dor + ombre d'expérience). Une seule
  texture par signature d'apparence, **mise en cache** (≤ 96 entrées) : listes,
  fiches, invitations, aperçu de groupe et cérémonie réutilisent la même
  texture. Coût Android : quelques `fill_rect` par nouveau visage, jamais de
  re-dessin par panneau.
- **Joueurs** : le portrait suit l'apparence sauvegardée du compte
  (`character_appearances`). Pour un joueur en ligne, le serveur remplace
  l'instantané de candidature par l'identité vive du pair (nom, clan,
  apparence) — le portrait est toujours à jour, et jamais fourni par le client.
- **PNJ** : chaque définition (`TEAM_NPC_CANDIDATES`, `TEAM_SENSEI`) porte sa
  propre apparence valide et distincte → portrait unique garanti, cohérent avec
  le personnage 3D (mêmes indices, mêmes palettes `CharacterAppearance`).
- **Fraude impossible** : `CharacterAppearance.sanitize` borne chaque indice
  avant dessin ; aucun message client ne contient d'apparence.

## 4. Candidats PNJ — priorité aux joueurs réels

- La liste est triée **joueurs réels d'abord** (par ancienneté de candidature),
  PNJ ensuite. Les PNJ n'ont **aucune action automatique** : ils ne rejoignent
  un groupe que sur invitation explicite d'un joueur (acceptation immédiate du
  vivier), et jamais une équipe n'est créée sans trois membres confirmés par
  une action `form` à la réception.
- Vivier initial : **exactement deux PNJ** — `Kaito` (niv. 8, Senju, Suiton,
  soutien défensif, couleurs froides, calme) et `Renji` (niv. 9, Hyuga, Raiton,
  reconnaissance et combat rapproché, regard concentré). Visuels, personnalités
  et lignes d'attente distincts.
- **Mode test** : `TEAM_RECRUITMENT_TEST_MODE = true` (haut de
  `server/team-system.js`) pré-inscrit Kaito et Renji de façon idempotente pour
  que le premier essai solo du propriétaire fonctionne immédiatement. Passer le
  drapeau à `false` **arrête l'injection** (les définitions restent compatibles
  avec le vivier : mêmes colonnes que les candidats joueurs).

## 5. Sensei de Konoha (vivier original)

| Sensei | Spécialité | Personnalité |
| --- | --- | --- |
| **Daichi Kurogane** | Défense et discipline | Calme, exigeant, protecteur ; parle peu, conseils précis. **Imposé à l'ÉQUIPE 001.** |
| **Ayame Shirogane** | Tactique et vitesse | Vive et stratège. |
| **Genzō Arakawa** | Offensive et taijutsu | Direct, tonitruant. |
| **Natsumi Hoshikawa** | Soutien, perception, coordination | Douce, perceptive. |

Tous : gilet vert de Konoha (indice tissu 4 + gilet 3D ajouté), tenue de
shinobi, bandeau frontal, allure expérimentée ; noms, portraits, silhouettes,
tenues et discours **tous différents** (répliques envoyées par le serveur avec
le numéro remplacé : « Vous êtes donc les membres de l'équipe 001. », « À partir
d'aujourd'hui, je serai votre Sensei. », « Apprenez à vous connaître… »).

Règles d'attribution (serveur) : numéro attribué **d'abord** ; Équipe 001 →
Daichi ; ensuite le Sensei **libre le moins affecté** ; vivier épuisé →
**réutilisation maîtrisée** : jamais le même Sensei sur deux créations dans la
fenêtre de cérémonie (10 min), et toujours celui dont la dernière cérémonie est
la plus ancienne.

## 6. Validation serveur (tout, sans exception)

- **Présence physique** : `apply`, `invite` et `form` exigent la position du
  pair dans le rayon du comptoir (`TEAM_RECEPTION`). La liste des candidats
  (portraits) n'est **envoyée qu'aux pairs proches de la réception** ; les
  invitations en attente restent visibles partout (notification).
- **Identité/portrait** : nom, clan, niveau et apparence viennent de la session
  et de la base (`player_progress` pour le niveau durable), jamais du message
  client. Les messages `team_action` n'ont que 4 clés exactes
  (`type, action, targetKey, revision`) ; toute clé supplémentaire est rejetée.
- **Règles métier** : une seule candidature par joueur (clé primaire) ; un
  joueur déjà en groupe/équipe ne peut être ni invité ni se réinscrire ; une
  seule invitation en attente par destinataire (`UNIQUE to_key`) ; invitations
  croisées refusées ; **plafond de 3 compté en base dans la transaction** (deux
  acceptations simultanées ne peuvent pas créer un 4e membre) ; `form` exige
  exactement 3 membres confirmés ; équipe officielle non retirable.
- **Numéros** : `MAX(number)+1` sur des équipes jamais supprimées → unique et
  **jamais réutilisé** ; attribué avant le Sensei, écrit avec garde
  `status='forming'` (condition de course rejetée proprement).
- Chaque action passe dans `db.transaction` (BEGIN IMMEDIATE / verrou Postgres)
  et l'état renvoyé est **relu depuis la base** après mutation. Audit écrit dans
  la table `audit` (`team_apply`, `team_invite`, `team_formed`, …).

## 7. Sauvegarde (architecture existante, rien de parallèle)

- Nouvelles tables du `schema.js` créées au démarrage par `openStore`
  (SQLite local ou Postgres, mêmes SQL idempotents) : `team_candidates`
  (identité + référence d'apparence), `teams` (numéro, statut, Sensei,
  cérémonie), `team_members`, `team_invites`.
- Le profil HTTP `/api/game/profile` ajoute `team:` à côté de
  `secondaryMissions:` ; le WSS envoie `team_state` à la connexion, après
  chaque action et à chaque changement global (rafraîchissement 1 s), comme les
  missions secondaires. Aucune nouvelle sauvegarde locale : l'apparence du
  joueur reste dans `character_appearances` / `user://appearance-v1.json`.

## 8. Échelle

- 20 joueurs qui déposent leur candidature → **ÉQUIPE 001 à 006** (18 membres)
  et les 2 derniers restent 🟡 candidats ; les PNJ restent en bas de liste.
- État public compact (références, pas d'images) ; `maxPayload` WSS inchangé
  (les actions client font ~90 octets).

## 9. Android

- Portraits 96×96 en cache, zéro fichier image, zéro téléchargement.
- Une seule scène de cérémonie (un `TrainingFighter` réutilisé + 7 boîtes de
  gilet, matériaux partagés), libérée après 120 s.
- Panneaux en `ScrollContainer`, boutons ≥ 46 px de haut, carte d'invitation
  petite et non bloquante (elle n'arrête ni la marche ni le combat).

## 10. Désactiver le mode test

`server/team-system.js`, première section :

```js
export const TEAM_RECRUITMENT_TEST_MODE = false;
```

Les PNJ déjà inscrits en base ne sont plus ré-injectés ; pour repartir d'une
liste vierge, supprimer leurs lignes (`DELETE FROM team_candidates WHERE
kind='npc'` — seulement s'ils ne sont dans aucune équipe).

## 11. Ce qui n'est PAS dans ce lot

Missions d'équipe, progression/rang d'équipe, examens Chunin, entraînements
spéciaux, système de Sensei avancé, compétences combinées, matchmaking
complexe, PvP d'équipe, dissolution d'équipe officielle.

## 12. Tests

`tests/team-system.test.js` (20 tests, `npm test`) : déblocage + présence
physique ; candidature serveur + portrait du compte + double candidature ;
mode test Kaito/Renji (portraits uniques, joueurs d'abord, idempotence) ;
fiches complètes ; liste visible seulement à la réception ; invitation /
acceptation / refus ; invitations doubles et croisées ; plafond de 3 (y compris
acceptations simultanées) ; groupe provisoire à 1-2 ; ÉQUIPE 001 + Daichi +
répliques + cérémonie ; membres retirés de la liste, jamais deux équipes ;
ÉQUIPE 002 + Sensei différent ; 20 joueurs → 6 équipes + reste candidats ;
peu de joueurs → aucune équipe forcée ; PNJ sur invitation explicite ; retrait
de candidature ; trois joueurs arrivés ensemble (validation par l'un des trois) ;
numéros uniques + cibles/actions invalides ; Sensei jamais doublé dans la
fenêtre + profil HTTP ; verrouillage HTTP + vivier Sensei original et différencié.

Bloc fumée GDScript (`game/tests/smoke.gd`) : validation du protocole d'état,
génération/cache/unicté des portraits, carte d'invitation, menus de la
réception, liste avec portraits, cérémonie (Sensei qui **marche**, jamais de
téléport) et fermeture propre.
