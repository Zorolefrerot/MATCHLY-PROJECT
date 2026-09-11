# Textures d’attaques et d’ultimes — 0.11

Un atlas partagé RGBA **1024 × 1024**, seize cellules de 256 px, 16 px de marge transparente. Source IA inspectée dans `art_sources/combat/`; découpe des lignes réelles, suppression du fond noir, plumes transparentes et masque doux pour éviter des panneaux carrés visibles. Les teintes sont appliquées par Godot.

Reproduction : `PYTHONPATH=/chemin/pillow python3 game/tools/prepare_combat_textures.py` (Pillow 11.3.0). Le manifeste conserve les empreintes, la provenance, les coordonnées et la taille. Aucune génération ou connexion IA à l’exécution.

`TrainingSpectacle` : 3 couches par effet ordinaire, 7 couches Économie / 10 Standard pour l’ultime ; profondeur active, pas d’ombres, lumières, particules GPU, stroboscope, secousse imposée ou ralentissement global. Le nombre des groupes ordinaires reste borné à 14. Un seul effet d’ultime réservé est actif par manche à un instant donné.

Les effets ordinaires persistent environ 0,75 à 2,2 s ; l’ultime dure 5,8 s en trois phases. **Ces sprites ne décident aucun dégât.** Seul le code de combat d’entraînement applique un impact après les vérifications ; les animations ne créent ni frappe répétée ni mort permanente.
