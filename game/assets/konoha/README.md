# Konoha — surfaces et volumes 0.8

Trois images **fournies par le propriétaire**, conservées dans [`art_sources/konoha`](../../../art_sources/konoha/). Leur petite définition (512 à 739 pixels de largeur) limite les détails disponibles. Les dérivés ne sont pas présentés comme de nouvelles textures HD ni comme des œuvres intégralement originales ; les droits des sources n’ont pas été vérifiés indépendamment.

## Préparation reproductible

Avec Python 3 et **Pillow 11.3.0** installé dans un environnement de développement :

```sh
python3 game/tools/prepare_konoha_textures.py
```

Aucun service externe, IA, récupération réseau ou traitement d’image à chaque frame. Graine 83021. `manifest.json` contient le commit d’apport des références, leurs tailles/hachages, le recadrage et les hachages des sept PNG. Les sources, cet inventaire et cette documentation restent hors export Android.

- `plaster` 512² : palette et léger détail mural issus de la maison, patine dessinée.
- `palace_red` 256² : teinte rouge issue de la résidence.
- `stone` 256² : teinte de la falaise avec grain procédural.
- `roof_tiles`, `roof_gold` 512² : couleurs des toits fournis, rainures et patine dessinées.
- `details_atlas` 512² RGBA : fenêtres dessinées en haut, porte en bas à gauche, emblème réellement recadré de la résidence en bas à droite. Marges transparentes entre cellules.
- `hokage_cliff` 512² RGBA : **quatre premiers visages**, choix visuel pour correspondre à l’image de la résidence. L’original à sept visages est conservé. Recadrage `(0,0,382,225)`, retrait du paysage urbain gris selon la ligne de pierre chaude ; proportions 382:225 rétablies par le maillage. La photo coupe déjà le sommet d’une coiffure : aucun détail absent n’est inventé.

## Illustrations générées pour le village complet

Le village complet ajoute des images d’environnement originales générées pour ce prototype puis réduites et importées en textures mobiles :

- `village_homes_sheet_alpha.png` : quatre façades de maisons et immeubles d’habitation, utilisées en 20 façades réparties dans les quartiers.
- `market_stalls_sheet.png` : trois étals illustrés pour densifier la place du marché.
- `river_water_texture.png` : eau peinte appliquée aux six segments de la rivière.
- `shrine_torii.png` : sanctuaire des Feuilles, posé sur une plateforme à l’est du village.
- `animal_companions_sheet_alpha.png` : chien, chat, porc et poules employés par les PNJ animaux.

Les images d’habitation et d’animaux disposent d’un détourage alpha ; les autres sont des panneaux d’environnement volontairement bornés. Les PNG générés totalisent environ **2,2 Mo** après réduction. Ils ne créent aucun objet réseau, aucune logique par image et aucun collider supplémentaire pour les panneaux ; les collisions principales restent celles des volumes de la carte.

Les PNG préparés à partir des références totalisent **1 467 280 octets**. Imports lossless, mipmaps explicites, filtrage linéaire mipmappé, transparence découpée pour l’atlas et la falaise. Ce poids PNG n’est pas une mesure de RAM ou de fluidité Android.

## Géométrie et budget

`konoha_architecture.gd` réalise des surfaces de révolution elliptiques : maisons à deux étages en retrait, toits courbes débordants, cheminées, corps circulaire rouge, ailes basses et corniches dorées. Ce ne sont pas des images collées sur les anciens cubes.

Les volumes principaux restent dans les anciennes emprises des quatre maisons. Les toits débordent sans collider ; les murs fermés et poteaux de porche ont des coques convexes à 16 côtés, les surfaces visibles jusqu’à 32 segments. Fenêtres, portes et emblème partagent **un seul maillage** et un atlas. Géométrie construite à l’entrée uniquement ; textures et matériaux mutualisés, pas d’ombres dynamiques ajoutées.

Le monument est un **ruban fixe peu profond dans le monde**, derrière la limite nord, avec soubassement et rochers latéraux en volume. Il ne tourne pas vers la caméra. **Les visages restent une image texturée, pas des sculptures 3D.** La lumière est déjà présente dans la source, donc sa matière est non éclairée ; les bâtiments reçoivent l’éclairage de la scène.

Le test moteur contrôle proportions, limites du maillage, UV/normales, matériaux, colliders et accès aux panneaux. Les captures dédiées montrent arrivée, marché, maison, résidence et dialogue. Aucun benchmark téléphone n’est déduit des tests ordinateur.
