# Sons originaux — IDREM ZENKAI

Ces sons ont été synthétisés spécifiquement pour ce prototype avec le script
`game/tools/generate_audio.py` : bruit filtré, sinusoïdes, percussions et notes
pincées. Aucun échantillon, voix, musique ou bruitage d’anime/jeu commercial.

Reproduction : `python3 game/tools/generate_audio.py` (Python standard seulement).
Mono PCM 16 bits, 22 050 Hz ; boucle de combat d’environ 17,78 s, queues de notes
repliées pour une jonction continue. Les effets courts ne bouclent pas.
La boucle est activée par le lecteur Godot ; limiteur commun contre la saturation,
8 voix d’effets maximum et une seule piste de fond. Volume et ambiance réglables
à la pause ; silence à l’accueil, à la pause et au résultat. Réglages en mémoire
pour la session uniquement. Aucun téléchargement pendant le jeu.
