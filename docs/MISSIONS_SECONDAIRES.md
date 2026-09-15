# Missions secondaires des habitants

Le tableau des missions secondaires est un système global, facultatif et séparé de la mission d'Aoi et de `ClanMissionManager`.

## Déblocage

Le serveur considère le système débloqué pour un compte uniquement si sa ligne `clan_missions` est `COMPLETED` et `reward_claimed=1`. Cela garantit que la deuxième mission de clan et son rapport ont réellement été récompensés. Le profil renvoie alors le message :

> Les habitants du village peuvent maintenant demander ton aide.

Un compte non débloqué ne reçoit ni marqueur rouge ni mission secondaire.

## Fonctionnement global

- `secondary_missions` contient trois slots globaux, visibles par tous les comptes débloqués.
- Les huit donneurs sont des PNJ fixes et légers, répartis dans des zones différentes.
- Les 12 types sont réutilisables : il n'existe pas de liste globale de types définitivement terminés.
- À la génération, le serveur évite le dernier PNJ du slot et les doublons de type, de PNJ et de zone dans les trois slots.
- Une mission acceptée est réservée atomiquement à un joueur. Les autres voient son marqueur disparaître.
- Une mission réussie passe en `COOLDOWN` avec `available_at = completed_at + 600000`. La prochaine lecture serveur, après exactement dix minutes, remplace le slot par un nouvel identifiant, un nouveau PNJ, une nouvelle zone et un type sélectionné à nouveau aléatoirement.
- Le délai est persisté en base et continue pendant une déconnexion ou un redémarrage.

## Sécurité

Les messages WebSocket ne contiennent jamais de coordonnées d'objectif. Le serveur conserve les objectifs, les étapes validées et le propriétaire de la mission. Il valide :

- l'accès après récompense de mission de clan ;
- le slot, l'identifiant et la révision ;
- la réservation unique ;
- la position réelle connue par `VillageRoom` ;
- chaque index d'objectif, sans doublon ;
- le retour auprès du PNJ ;
- la transaction de récompense unique de `+5` IG.

Le client ne calcule ni la progression ni le portefeuille. Les positions d'objectif sont des points publics bornés de Konoha, hors sanctuaires et zones privées.
