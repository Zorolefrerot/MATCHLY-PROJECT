# Konoha entier et vie du village

Le quartier d’accueil est maintenant remplacé par une carte complète de Konoha, construite à partir de la carte aérienne fournie et de la palette des images de village : porte principale, mur circulaire, routes jaunes, rivière bleue et ponts, forêt de la Mort, mémorial, résidence du Hokage, académie, marché, hôpital, poste de police, stade, sources chaudes et quartiers claniques.

## Quartiers visibles

Les secteurs suivants sont placés comme repères lisibles dans `game/scripts/konoha_map.gd` :

- Shun, Hattori, Hyūga, Uzumaki, Uchiwa, Nara, Akimichi, Yamanaka, Inuzuka, Aburame et Hatake ;
- forêt de la Mort, mémorial de Konoha et bâtiments publics ;
- maisons rondes à toits superposés, tours publiques, résidence rouge du Hokage et façades détaillées.

Les textures préparées depuis les références (`game/assets/konoha/`) restent utilisées par les maisons, les toits, la pierre, les fenêtres et la montagne aux visages. Les bâtiments de fond emploient une géométrie allégée afin de conserver une scène raisonnable sur téléphone.

## Habitants et animaux

`game/scripts/konoha_npc.gd` fournit des acteurs décoratifs sans collision de gameplay ni accès au compte :

- femmes, hommes, anciens, filles et garçons avec silhouettes, vêtements, cheveux et couleurs variés ;
- chiens, chats, porc et poules ;
- itinéraires actifs sur les routes et autour des quartiers ;
- paires qui s’arrêtent pour discuter ;
- marchands derrière leurs comptoirs ;
- acheteurs qui parcourent plusieurs étals, s’arrêtent et reprennent leur tournée.

Les comportements sont déterministes et locaux : ils donnent une vie persistante à la scène sans écrire de progression, d’inventaire ou de monnaie. Les achats observés au marché sont donc une mise en scène visuelle de la foule ; le système économique réel reste à implémenter séparément.

## Référence technique

- `KonohaMap.BOUNDS` définit la nouvelle zone explorable et la validation réseau l’accepte côté serveur et client.
- La présence WSS conserve une zone de chat de proximité de 18 mètres, tout en autorisant les joueurs à parcourir le village entier.
- `KonohaMap.npc_count`, `moving_npc_count`, `animal_count`, `discussion_count` et `shopping_count` servent aux contrôles Godot.
- La caméra et le brouillard visuel couvrent le nouveau périmètre ; le sol et les murs restent collidables.

Cette scène reste un prototype de visite et de présence partagée : les intérieurs, les transactions persistantes, les quêtes de quartier et la coordination multinstance Render ne sont pas prétendus terminés.
