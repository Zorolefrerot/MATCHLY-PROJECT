# Résidence du Hokage — intérieur visitable

La première version de l’intérieur est un bâtiment compact de deux niveaux, généré par `game/scripts/hokage_interior.gd` à l’ouverture du village :

1. porte principale et hall officiel ;
2. accueil, panneau de missions et symbole du village ;
3. galerie des sept portraits encadrés ;
4. escalier à marches et collision convexe continue ;
5. salle du conseil à l’étage ;
6. bureau du Hokage, carte de Konoha et balcon.

## Entrée et sortie

`KonohaVisit` possède maintenant un bouton dédié **VISITER LA RÉSIDENCE**, indépendant de l’action générique `village_interact` (`E`) utilisée par les panneaux et Aoi. Le bouton est disponible dans le HUD pour rendre la transition testable sans dépendre d’une collision ou d’une distance exacte devant la façade. Il téléporte directement le joueur vers le hall interne ; une fois à l’intérieur, le même bouton affiche **SORTIR DE LA RÉSIDENCE** et replace le joueur devant la porte extérieure.

L’intérieur est placé dans une poche de scène séparée, dans le périmètre réseau accepté du village mais à distance du décor extérieur, afin de ne pas superposer les colliders du palais. Le même joueur, la même caméra, le HUD, la connexion WebSocket et les avatars partagés restent utilisés. La poche est désactivée hors visite.

## Collisions et mobile

Les sols, murs, portes, mobilier principal et marches utilisent des `StaticBody3D` avec des `BoxShape3D`. La rampe des escaliers ajoute une `ConvexPolygonShape3D` : il n’est pas possible de traverser les côtés ou de tomber entre les marches, tout en gardant une montée praticable. Les portraits utilisent sept PNG de 256 × 512 et des matériaux non éclairés avec mipmaps pour limiter le coût Android.

Les avatars distants et le duel multijoueur ne sont pas supprimés. L’intérieur partage leur scène réseau existante ; seule la transition de lieu est locale et aucune position d’intérieur n’est persistée comme progression.

## Images des Hokage

La source est conservée hors export dans `art_sources/konoha/hokage-gallery-source.jpg`. Elle vient de [Peakpx](https://www.peakpx.com/en/hd-wallpaper-desktop-pttge) ; la licence n’a pas été vérifiée indépendamment. Les sept panneaux sont découpés et redimensionnés dans `game/assets/konoha/hokage/`, avec provenance détaillée dans le README de ce dossier. Les portraits sont affichés comme cartes encadrées dans la galerie, pas comme des visages 3D sur le mur extérieur.

L’opening reste volontairement hors périmètre de cette livraison.
