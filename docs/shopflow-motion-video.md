# Film motion ShopFlow — aperçu et export MP4

## Ce qui est prêt

- Le film est servi sur `/motion/` et accessible depuis le lien « Voir le film de présentation » sur la vitrine.
- Format vertical 9:16, canevas 1080 × 1920, 30 images/s, durée de 26 secondes.
- Les scènes présentent la marque, la caisse, le stock et le suivi d’activité. Ce sont des illustrations de présentation, pas une démo interactive de l’application ni des données réelles.
- Le bouton **Enregistrer la vidéo** utilise l’enregistreur intégré du navigateur. Il choisit MP4 si le navigateur le prend en charge; sinon, il télécharge du WebM.

## Exporter avec le site ou l’aperçu

1. Ouvrir la vitrine ShopFlow puis cliquer sur **Voir le film de présentation**, ou ouvrir directement `/motion/`.
2. Sur ordinateur, utiliser un Chrome ou Edge récent; sur téléphone, essayer Chrome Android ou Safari iOS.
3. Appuyer sur **Enregistrer la vidéo** et garder la page au premier plan jusqu’au téléchargement (environ 26 secondes).
4. Si le fichier est déjà `.mp4`, il est prêt. Si c’est un `.webm`, l’importer dans CapCut ou Shotcut, puis exporter en **MP4 / H.264**, 1080 × 1920, 30 images/s.

### Conversion gratuite en ligne de commande (facultatif)

Avec FFmpeg installé, dans le dossier du téléchargement :

```bash
ffmpeg -i ShopFlow-motion.webm -c:v libx264 -pix_fmt yuv420p -movflags +faststart -an ShopFlow-motion.mp4
```

`-an` indique que le film est silencieux. Pour ajouter une narration ou une musique libre de droits, importer d’abord le WebM dans CapCut/Shotcut, poser la piste audio, puis exporter en MP4.

## Avec Claude Sonnet gratuit

Claude peut aider à écrire ou modifier le code et proposer des variantes de scénario, mais **il ne rend pas un MP4 à lui seul** dans le chat. Le rendu se fait dans le navigateur grâce à cette page; la conversion éventuelle en MP4 se fait dans CapCut, Shotcut ou FFmpeg.

Prompt de travail à donner à Claude si tu veux modifier le film :

> Travaille sur le film motion existant de ShopFlow dans `motion/index.html` et `motion/motion.js`. Conserve le format vertical 1080x1920, 30 images/s et 26 secondes, le logo officiel ShopFlow et le bouton d’enregistrement MediaRecorder. Améliore uniquement le rythme, la typographie et les transitions pour un résultat commercial propre. Ne montre pas de fausse démo de l’application, n’invente pas de fonctions ou de tarifs, n’envoie aucune donnée client à un service externe et ne supprime pas l’export WebM/MP4. Donne-moi le diff et les étapes pour vérifier le rendu dans un navigateur.

## Voix off facultative

> Votre commerce mérite mieux que des informations dispersées. Avec ShopFlow, enregistrez vos ventes, consultez le stock et retrouvez vos repères d’activité au même endroit. Une expérience pensée pour Android et accessible sur iPhone en web app. ShopFlow : gérez, calculez, faites grandir.
