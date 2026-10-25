# Film motion ShopFlow — présentation et export TikTok

## Intention et contenu

Le film est accessible sur `/motion/` et depuis le bouton **Voir le film de présentation** de la vitrine. Cette édition est pensée comme une présentation officielle verticale pour TikTok, Reels et Shorts : 9:16, 1080 × 1920, 30 images/s, 36 secondes.

Un jeune présentateur illustré avec des lunettes teintées chocolat accompagne le récit. Le montage varie les transitions et les mouvements, puis montre :

1. **L’essentiel de ShopFlow** : caisse, articles/stock et suivi des informations saisies.
2. **Android** : un parcours de vente illustratif, l’enregistrement et le reçu dans l’historique; puis un aperçu du catalogue et d’un repère de stock.
3. **iPhone** : la web app ouverte dans Safari à `/app/`, avec le chemin **Partager → Ajouter à l’écran d’accueil**. Il est précisé qu’il s’agit d’une web app, pas d’une IPA/App Store.
4. **Conclusion** : le positionnement de ShopFlow et les deux chemins mobile.

Les interfaces animées sont des **illustrations** : elles ne sont pas des captures de données réelles ni une démo interactive de l’application. Aucun montant ou résultat de transaction réel n’est montré.

## Exporter la vidéo depuis le lecteur

1. Ouvrir `/motion/` depuis la vitrine ShopFlow.
2. Cliquer sur **Enregistrer la vidéo** et garder l’onglet au premier plan jusqu’à la fin (36 secondes).
3. Si le navigateur sait encoder le MP4, `ShopFlow-motion.mp4` est téléchargé directement. Sinon, le fichier sera `ShopFlow-motion.webm`.
4. Pour convertir le WebM, l’importer dans CapCut ou Shotcut et exporter en **MP4 / H.264**, 1080 × 1920, 30 images/s.
5. Ajouter facultativement la voix off ci-dessous et une musique dont tu as les droits. Pour une présentation parlée, garder les sous-titres français lisibles et laisser visible la mention « scènes illustratives ».

### Conversion FFmpeg (facultative)

```bash
ffmpeg -i ShopFlow-motion.webm -c:v libx264 -pix_fmt yuv420p -movflags +faststart -an ShopFlow-motion.mp4
```

Cette commande crée une vidéo MP4 silencieuse. Pour la voix off, importer le WebM dans CapCut/Shotcut, ajouter la piste, puis exporter en MP4.

## Script voix off proposé (environ 36 secondes)

> Bonjour ! Je vous présente ShopFlow, l’outil qui rassemble les essentiels du commerce. Sur Android, enregistrez les ventes, retrouvez les reçus et gardez un œil sur vos articles en stock. Suivez aussi les dépenses et les crédits saisis pour retrouver vos repères d’activité. Sur iPhone, ouvrez la web app dans Safari à l’adresse /app/, puis ajoutez-la à l’écran d’accueil. ShopFlow : gérez, calculez, faites grandir. Les scènes de cette vidéo sont illustratives.

Le présentateur est un personnage visuel dessiné dans l’animation; cette voix off est un texte à enregistrer ou à faire lire par un outil de voix si tu en as un.

## Avec Claude Sonnet gratuit

Claude peut aider à réécrire le scénario ou modifier le code, mais **le chat Claude ne rend pas lui-même le fichier MP4**. Le rendu se fait avec le lecteur Motion dans le navigateur; le WebM peut ensuite être converti avec CapCut, Shotcut ou FFmpeg. Il n’y a pas besoin d’une clé IA pour lire ni enregistrer le film.

Prompt pour demander une amélioration ciblée à Claude :

> Améliore le film motion ShopFlow dans `motion/index.html` et `motion/motion.js` pour une publication verticale TikTok. Garde 1080x1920, 30 images/s, environ 36 secondes, le logo officiel et le présentateur aux lunettes teintées chocolat. Le message doit expliquer simplement la caisse, les reçus et le stock sur Android, puis l’accès à la web app iPhone dans Safari via `/app/`. Conserve la mention que les scènes sont des illustrations, pas de vraies transactions, et ne présente pas l’iPhone comme une IPA ou une application App Store. Varie le rythme, les gestes et les transitions; garde le bouton d’export MediaRecorder MP4/WebM. N’invente pas de fonctions, tarifs ou chiffres. Donne le diff et indique comment vérifier le rendu.
