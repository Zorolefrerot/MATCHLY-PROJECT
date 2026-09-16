# Recrutement à la réception de l’Académie

Le recrutement d’équipe est une fonctionnalité du village partagé, sans menu global. Le joueur doit marcher jusqu’à la réception située autour de `[-34, 0.55, 12]` puis interagir avec la réceptionniste. Le serveur vérifie aussi la distance avant chaque mutation.

## Protocole

Le WebSocket `/api/game/village` transporte des actions strictes :

- `refresh` : état courant et profils disponibles ;
- `apply` / `withdraw` : candidature du joueur connecté ;
- `invite` : invitation d’un profil joueur ou PNJ ;
- `accept_invite` / `decline_invite` : réponse du joueur connecté ;
- `confirm_team` : validation par le responsable d’un groupe exactement rempli.

Les portraits sont des références (`portraitId`). Les joueurs réutilisent leur apparence enregistrée dans `character_appearances`; les PNJ utilisent des références d’apparence légères du catalogue serveur. Le client dessine une petite carte de portrait procédurale, sans copier d’image par profil.

## Règles persistantes

- Un joueur reste disponible tant qu’il n’a pas rejoint un groupe ou une équipe.
- Un groupe en formation ne dépasse jamais trois membres et une équipe officielle est toujours exactement composée de trois membres.
- Un joueur ne peut avoir qu’un groupe ou une équipe active ; les invitations en attente d’un même joueur sont uniques.
- La création est transactionnelle : numéro persistant et unique, portraits validés par le serveur, membres retirés des candidats.
- Le premier numéro reçoit `Daichi Kurogane`; les Sensei suivants sont sélectionnés sans réutilisation tant que le pool le permet.
- Kaito et Renji sont affichés par défaut en mode de test avec leurs profils distincts. Le mode est contrôlable par `TEAM_RECRUITMENT_TEST_MODE=true` dans l’environnement serveur ; le désactiver (`false`) réserve les PNJ aux compléments nécessaires.

Aucune mission d’équipe, aucun rang, examen Chūnin, PvP d’équipe ou matchmaking avancé n’est inclus dans cet incrément. Aoi, la mission de clan et les missions secondaires utilisent leurs flux existants.
