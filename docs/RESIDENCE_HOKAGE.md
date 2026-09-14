# Résidence du Hokage — intérieur visitable

La première version de l’intérieur est un bâtiment compact de deux niveaux, généré par `game/scripts/hokage_interior.gd` à l’ouverture du village :

1. porte principale et hall officiel ;
2. accueil, panneau de missions et symbole du village ;
3. galerie des sept portraits encadrés ;
4. escalier à marches et collision convexe continue ;
5. salle du conseil à l’étage ;
6. bureau du Hokage, carte de Konoha et balcon.

## Entrée et sortie

La façade extérieure est restaurée comme un volume fermé et continu : la porte est visible, fermée et solide, sans espace vide dans le compound. Un sceau circulaire bleu lumineux est posé au sol devant la porte. Le joueur doit rester immobile sur ce sceau pendant trois secondes ; un écran de chargement avec une image de portail bleu s’affiche, puis le joueur est téléporté vers la résidence virtuelle. Aucun bouton d’entrée ou de sortie n’est utilisé. Depuis l’intérieur, marcher vers le seuil avant ressort automatiquement devant la façade. `transition_lock` filtre les doubles événements et empêche un retour immédiat après chaque téléportation.

L’intérieur reste dans le même `SubViewport` et le même `KonohaMap` que Konoha : il n’y a pas de seconde scène ni de second système de téléportation. Pour éviter qu’il apparaisse dans un autre quartier ou rencontre les colliders extérieurs, son origine est une poche virtuelle explicitement isolée hors du sol jouable (`HOKAGE_INTERIOR_ORIGIN`). Les destinations sont des `Marker3D` nommés `HokageExteriorSpawn` et `HokageInteriorSpawn`. L’entrée (`HokageExteriorEntryTrigger`) et la sortie (`HokageInteriorExitTrigger`) sont deux `Area3D` distinctes.

Pendant le chargement et la visite intérieure, la position locale n’est pas envoyée au serveur WSS : le serveur conserve la dernière position extérieure valide. Cela évite que sa protection anti-téléportation renvoie une correction au joueur intérieur. À la sortie, la présence réseau est relâchée progressivement vers le spawn extérieur. Le même joueur, la même caméra, le HUD, la connexion WebSocket et les avatars partagés restent utilisés. La poche et son trigger de sortie sont désactivés hors visite.

## Diagnostic du renvoi vers l’extérieur

Le script fautif était `game/scripts/konoha_visit.gd`, dans l’ancien chemin de visite : il déplaçait le `TrainingFighter` avec une coordonnée intérieure codée en dur, puis continuait à publier cette pose comme une pose de village ordinaire. Or `server/village-room.js` valide les poses dans le budget de distance du pair (`peer.distanceBudget`). La position de la poche intérieure dépassait ce budget ; le serveur conservait donc la dernière pose extérieure valide et renvoyait une correction. L’ancien récepteur de correction de `konoha_visit.gd` appliquait alors cette pose réseau au joueur : le joueur semblait être renvoyé, ou disparaître pendant le conflit de poses. Ce n’était pas une collision du hall ni un second joueur.

Le même chemin mélangeait aussi un point de sortie codé en dur (`HokageInterior.EXIT_POINT`) avec un test de proximité. Il ne distinguait donc pas un vrai franchissement du seuil d’un joueur posé près du spawn, ce qui pouvait déclencher une sortie immédiate puis une nouvelle entrée. La correction centralise désormais les deux sens dans `konoha_visit.gd`, avec `HokageExteriorEntryTrigger` et `HokageInteriorExitTrigger`, les deux `Marker3D` de spawn, un verrou de transition de 0,85 seconde et la suspension des poses réseau durant le chargement et la visite intérieure. Le serveur ne reçoit qu’une pose extérieure mémorisée ; au retour, la pose est relâchée progressivement vers `HokageExteriorSpawn`.

## Collisions et mobile

Les sols, murs, portes, mobilier principal et marches utilisent des `StaticBody3D` avec des `BoxShape3D`. La rampe des escaliers ajoute une `ConvexPolygonShape3D` : il n’est pas possible de traverser les côtés ou de tomber entre les marches, tout en gardant une montée praticable. Les portraits utilisent sept PNG de 144 × 528 et des matériaux non éclairés avec mipmaps pour limiter le coût Android.

Les avatars distants et le duel multijoueur ne sont pas supprimés. L’intérieur partage leur scène réseau existante ; seule la transition de lieu est locale et aucune position d’intérieur n’est persistée comme progression.

## Images des Hokage

La source est conservée hors export dans `art_sources/konoha/hokage-gallery-source.jpg`. Elle vient de [Peakpx](https://www.peakpx.com/en/hd-wallpaper-desktop-pttge) ; la licence n’a pas été vérifiée indépendamment. Les sept panneaux sont découpés et redimensionnés dans `game/assets/konoha/hokage/`, avec provenance détaillée dans le README de ce dossier. Les portraits sont affichés comme cartes encadrées dans la galerie, pas comme des visages 3D sur le mur extérieur.

Le hall reste ouvert en permanence pendant toute la visite ; le décor intérieur conserve les deux niveaux, les salles utiles, les portraits encadrés et le balcon orienté vers Konoha.
