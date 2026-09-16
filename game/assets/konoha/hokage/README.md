# Galerie intérieure des Hokage

Les sept portraits affichés dans la galerie de la résidence sont des recadrages redimensionnés de `art_sources/konoha/hokage-gallery-source.jpg`, récupéré depuis la page Peakpx :

- Source : https://www.peakpx.com/en/hd-wallpaper-desktop-pttge
- Ordre conservé dans l’image source : Hashirama, Tobirama, Hiruzen, Minato, Tsunade, Kakashi, Naruto.
- Préparation : sept recadrages verticaux, chacun redimensionné en 128 × 512 en conservant le ratio des panneaux, avec une bordure de cadre de 8 px (PNG final 144 × 528).
- Les PNG sont les seuls portraits placés dans `res://assets` ; l’image originale reste dans `art_sources` et n’est pas exportée par Godot.

La licence de la page source n’a pas été vérifiée indépendamment. Cette provenance est conservée pour permettre son remplacement si nécessaire.

## Galerie historique de la Quatrième Grande Guerre Ninja

Les fichiers `war_01_*.png` à `war_10_*.png` sont des panneaux historiques locaux optimisés en 640 px de large pour Android. Ils ne dépendent d’aucune URL au runtime : neuf illustrations originales ont été générées pour ce projet à partir de scènes historiques demandées, et `war_10_peace.png` est une illustration vectorielle originale de l’aube après la guerre. Les plaques et titres sont ajoutés par `hokage_interior.gd`, afin de garder les textures légères et lisibles.

Ces panneaux ne prétendent pas être des captures officielles ni remplacer les sept portraits documentaires ci-dessus. Ils servent de fresque muséale originale, avec une attribution narrative claire : Alliance Shinobi, forces de Konoha, Naruto, Sasuke, Hokage réanimés, Madara, Obito, Jūbi, dernier duel et reconstruction de la paix.
