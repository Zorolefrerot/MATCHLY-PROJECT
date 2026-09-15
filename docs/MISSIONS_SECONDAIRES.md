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

## Une seule mission active : terminer ou abandonner

- Le serveur refuse tout `accept` tant qu'une ligne `ACCEPTED` existe pour le compte (`SECONDARY_ALREADY_ACTIVE`). L'UPDATE d'acceptation est conditionnel (`status='AVAILABLE'`) et son nombre de lignes est vérifié dans la transaction : deux acceptations simultanées ne réservent jamais la même mission.
- L'action `abandon` rend le slot au tableau du village : même mission, même PNJ, mêmes objectifs, progression vidée, révision incrémentée. Aucune récompense, aucun cooldown, aucune pénalité ; audit `secondary_mission_abandoned`.
- Côté client, le menu d'acceptation ne s'ouvre plus chez un autre habitant tant qu'une mission est active (« Une seule mission secondaire à la fois… »). Parler à son propre donneur ouvre un récapitulatif d'état avec le bouton **ABANDONNER LA MISSION**, envoyé uniquement par le lien WSS vérifié ; hors connexion, le choix est refusé avec un message.

## Flèche rouge de guidage

- Un nœud rouge émissif flotte au-dessus de la tête du joueur (environ 2,95 m), enfant du joueur : il pointe le point serveur le plus proche restant à collecter, puis le donneur (`returnPosition`) dès que tous les objectifs sont validés.
- Le maillage est un wedge explicite (ArrayMesh) prolongé d'un fût (BoxMesh), matière unshaded double face ; rotation lissée (`lerp_angle`) et légère oscillation verticale.
- La flèche est masquée sans mission active, dans la résidence du Hokage, pendant un chargement ou menu ouvert, et à moins de 0,6 m du point visé. Les points viennent du snapshot serveur : le client n'invente aucune destination.

## Badges IG et LVL du HUD

- `game/assets/ui/progress_gold_badge.png` (pièce d'or gravée « IG ») et `game/assets/ui/progress_level_badge.png` (plaque « LVL ») : carrés exacts de 128 px avec marge transparente, recadrés sur l'encre puis recentrés, pour que les rangées du HUD ne débordent ni n'étirent jamais l'image.
- Génération reproductible hors ligne : `python3 game/tools/generate_progress_badges.py` (Pillow, supersampling 4×, police DejaVu Sans Bold de l'image de développement ; aucun service réseau, aucune œuvre externe). Hachages et tailles dans `game/assets/ui/progress_manifest.json`.
- Le HUD affiche deux rangées badge + valeur (« IG : n » et « NIVEAU : n »), chacune bornée à sa propre boîte dans le panneau haut.
- Après chaque action secondaire, l'acquittement WebSocket contient `wallet` (`{idremGold, level}`) lu par le serveur dans la transaction de récompense ; le client l'affiche tel quel et ne recompose jamais le total.
