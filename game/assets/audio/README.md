# Audio du prototype 0.3.0

Neuf enregistrements du propriétaire remplacent les sons provisoires : Katon,
Raiton, Fūton, Doton, impact de terre, frappe, impact de coup, esquive et musique
de combat. Le `warning` est un petit signal original de 0,12 s, créé par l’agent.

## Préparation

```bash
python3 game/tools/prepare_audio.py --ffmpeg /chemin/vers/ffmpeg
# Pour régénérer SEULEMENT le signal d’avertissement :
python3 game/tools/generate_audio.py
```

FFmpeg 7.0.2 a été utilisé. Aucune installation de FFmpeg sur Render ou dans le
jeu : les WAV prêts à lire sont versionnés. Les sources exactes sont conservées
séparément dans `game/audio_sources/`, exclues de l’import et de l’export Godot.
Les données d’origine, empreintes, durées, silences retirés et gains appliqués
figurent dans `manifest.json` (document de développement non embarqué).

- Décodage réel des fichiers AAC/MP4 nommés `.mp3` ; conversion en PCM mono
  16 bits/22 050 Hz pour le lecteur existant, sans changement de hauteur.
- Horodatages conservés lors du décodage (les trous internes sont remplis de
  silence, pas supprimés) ; seuls les silences extérieurs sous -50 dB sont
  retirés, avec une marge avant/après. Aucun extrait court arbitraire.
- Fondus très courts aux extrémités ; pour le fond musical, 40 ms au début et
  80 ms à la fin évitent un clic de raccord. Ce n’est pas un raccord musical
  parfait garanti : la boucle entière est conservée.
- Volume harmonisé, plafond de crête et amplification limitée à +6 dB. La piste
  de fond reste plus discrète que les actions ; réglages accessibles en pause.
- Les fichiers `melee` et `dodge` étaient identiques ; ils restent identiques.
- Un même effet déjà en cours est redémarré à la nouvelle action plutôt que
  superposé plusieurs fois. Maximum 8 voix d’effets, une piste musicale et
  limiteur commun. Le warning a un léger avantage de volume.
- Aucun accès réseau ni microphone. Silence à l’accueil, en pause et au résultat.

Les sources fournies ne sont pas revendiquées comme des sons originaux de
l’agent ; leurs droits restent à vérifier avant une diffusion publique.
Les tests de fichiers et du moteur ne remplacent pas une écoute sur téléphone.
