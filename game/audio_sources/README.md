# Enregistrements fournis par le propriétaire

Copies exactes des neuf fichiers déposés à la racine de `main` dans
`Zorolefrerot/MATCHLY-PROJECT`, commit
`e166940b8aff1bfdb9fa9eb4d874fb7a04bfa58b`. Le fichier `sources.json` enregistre les
chemins et SHA-256 de cet import. La branche `main` n’a pas été modifiée.

Bien que les fichiers portent l’extension `.mp3`, FFmpeg détecte **AAC dans un
conteneur MP4**. Il faut réellement les décoder, pas seulement renommer leur
extension. `.gdignore` exclut ce dossier de l’import Godot ; il est aussi exclu
de l’APK. Seuls les WAV préparés dans `game/assets/audio/` sont utilisés en jeu.

`dodge.mp3` et `melee.mp3` sont identiques octet pour octet dans les fichiers
fournis. Les deux associations sont volontairement conservées.

Les enregistrements ont été fournis par le propriétaire ; leur provenance
artistique et leurs licences n’ont pas été vérifiées. Ils ne sont pas présentés
comme des créations originales de l’assistant. Seul le signal `warning` reste
une synthèse originale, sans échantillon externe.

Pour un remplacement ultérieur, mettre à jour les fichiers et leur provenance
dans `sources.json` avant de relancer `game/tools/prepare_audio.py`. Le script
refuse des sources dont les empreintes ne correspondent plus au manifeste.
