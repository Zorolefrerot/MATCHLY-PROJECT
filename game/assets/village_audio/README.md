# Musique de fond fournie pour Konoha

Original : `1001641947.mp3` dans `main`, commit `982ec60084c88b8cda263a207c2eb79fa1c289c6`. Copie inchangée dans `game/audio_sources/village_loop.mp3`, exclue de l’import/export. Malgré son extension, c’est un conteneur MP4 avec audio **AAC mono, 48 kHz, environ 78,15 s**.

`prepare_village_music.py` réutilise le traitement de niveau existant puis produit du **Vorbis mono 22 050 Hz** avec FFmpeg 7.0.2 : environ 78,13 s, 458 803 octets. La quasi-totalité est conservée, sans changement de hauteur/tempo ; environ 0,02 s de silence initial retiré et courts fondus aux extrémités. Boucle intégrale, pas un extrait raccourci ni une musique générée.

```sh
python3 game/tools/prepare_village_music.py --ffmpeg /chemin/ffmpeg --source-commit 982ec60084c88b8cda263a207c2eb79fa1c289c6
```

Le manifeste contient empreintes, durée et niveau mesurés. Sources du propriétaire, droits non vérifiés indépendamment. Analyse/décodage effectués, pas d’écoute humaine prétendue.

Un seul lecteur appartient à la visite. Il utilise le volume général `TrainingMix`, avec -12 dB supplémentaires. Le bouton **MUSIQUE : OUI/NON** permet de le couper ; le réglage d’ambiance de l’entraînement est respecté à l’entrée. La perte de focus suspend le son et la sortie du village l’arrête. Le morceau et les effets de combat restent inchangés.

Tests natifs ajoutés ; leur exécution moteur fait partie de la validation du prochain lot, pas d’une nouvelle installation intermédiaire.
