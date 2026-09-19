# Recrutement à la réception de l’Académie

Le recrutement d’équipe est une fonctionnalité du village partagé, sans menu global. Le joueur marche jusqu’au comptoir physique de l’Académie, situé autour de `(-37.5, 0.55, -21.4)`, puis interagit avec la réception. Le serveur vérifie la présence avant chaque mutation.

## Protocole unique

Le WebSocket `/api/game/village` utilise exclusivement les paquets `team_action` et les réponses `team_state` / `team_action_ack` :

- `team_action { action: "refresh" }` : état courant ;
- `apply` / `withdraw` : candidature du joueur connecté ;
- `invite` : invitation d’un joueur ou d’un PNJ affiché au comptoir ;
- `accept` / `decline` : réponse à l’invitation reçue ;
- `form` : validation officielle d’un groupe exactement rempli.

Chaque paquet porte exactement `type`, `action`, `targetKey` et `revision`. Le client n’envoie jamais le nom, le niveau, le clan ou l’apparence d’un profil. Les anciennes routes et tables de recrutement ne font plus partie du protocole actif.

## Règles persistantes

- La candidature est enregistrée dans `team_candidates` et relue après reconnexion.
- La liste n’est transmise qu’à proximité de la réception. Les joueurs réels sont triés avant le vivier limité à Kaito et Renji.
- Chaque fiche serveur contient nom, clan, niveau durable, affinité, style, `portraitId` et indices d’apparence. Le client génère le portrait localement.
- Une invitation joueur est adressée uniquement à sa clé `p<id>` et reste visible dans son HUD, y compris hors du comptoir. Une invitation croisée ou double est refusée.
- Un groupe en formation peut compter un ou deux membres, mais `form` exige exactement trois membres. Un groupe ou une équipe officielle retire ses membres de la liste.
- Le numéro est attribué de façon monotone et unique. Le premier reçoit Daichi Kurogane ; un Sensei est attribué seulement lors de la validation officielle.
- La cérémonie fournit les lignes de dialogue au client : `TeamManager` affiche le Sensei dans le monde et ses répliques en bulles.

## Cycle serveur et reconnexion

`TeamService` charge les tables `team_*` avant le premier `team_state` envoyé par `VillageRoom`. Le même service traite les actions, les broadcasts et le profil HTTP. Le rafraîchissement périodique ne crée aucune nouvelle candidature et réutilise les données persistées. Une reconnexion reçoit donc le même statut, le même groupe ou la même équipe officielle, son numéro et son Sensei.

Aucun système de combat, de déplacement, de caméra, de sauvegarde locale ou de matchmaking supplémentaire n’est ajouté à ce parcours. Aoi, la mission de clan et les missions secondaires gardent leurs flux existants.
