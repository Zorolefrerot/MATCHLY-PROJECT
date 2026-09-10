# Effets 0.4 — Katon / Raiton

- `flame_atlas.png` : création procédurale originale, huit images RGBA 128 × 192, rangées horizontalement. Flammes orange/jaune à cœur clair, contours transparents ; aucune image externe.
- Reproduction sans dépendance : `python3 game/tools/generate_flame_texture.py`.
- `scripts/flame.gd` partage cette texture entre les trois couches du projectile, la courte traînée et les flammes d’impact. Animation 18 images/s, pas de particules GPU ni de lumière dynamique.
- `scripts/bolt.gd` construit trois maillages regroupés : halo bleu, canal cyan, cœur blanc. Ramifications et petites couronnes électriques ; trois formes successives maximum, disparition en 0,36 s. Le nombre de branches est réduit en Économie.
- Tout est placé dans le monde 3D, soumis à la profondeur et sans ombre. Pas d’éclaircissement plein écran ni de secousse de caméra. Les groupes secondaires restent plafonnés à 14.

Les sons, les dégâts, les coûts, les recharges et les collisions ne sont pas pilotés par ces visuels. `training.gd` conserve la durée et la vitesse du projectile, ainsi que le rayon instantané du Raiton. Une animation d’éclair ne frappe donc jamais plusieurs fois.
