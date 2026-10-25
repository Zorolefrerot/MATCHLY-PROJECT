# Film motion ShopFlow — narration et export

## Le déroulé du film

Le présentateur reprend le personnage fourni, ses poses et expressions; les poses de marche alternent pour créer une courte animation, et les lunettes sont teintées chocolat. La vidéo raconte dans cet ordre :

1. **Présentation du guide** : « Bonjour ! Je suis votre guide ShopFlow. »
2. **La question** : « Mais au fait… c’est quoi ShopFlow ? »
3. **La définition** : un outil de gestion pour organiser les ventes, les articles et le suivi quotidien d’un commerce.
4. **Exemple Android — vente** : sélectionner du riz et une boisson, enregistrer la vente, puis retrouver le reçu.
5. **Exemple — stock** : consulter le catalogue et repérer un article à vérifier.
6. **Exemple iPhone** : ouvrir la web app dans Safari à `/app/`, puis ajouter son icône à l’écran d’accueil.
7. **Conclusion** : repères sur les ventes, les dépenses et les crédits saisis.

Les écrans du film sont des **illustrations animées**, pas une capture de l’application ni de vraies transactions. Ils sont présentés comme des exemples pour expliquer le produit.

## Voix off proposée

> Bonjour ! Je suis votre guide ShopFlow. Mais au fait, c’est quoi ShopFlow ? ShopFlow est un outil de gestion qui aide les commerces à organiser leurs ventes, leurs articles et leur suivi quotidien. Par exemple, vous vendez du riz et une boisson : sélectionnez les articles, enregistrez la vente, puis retrouvez le reçu dans l’historique. Vous pouvez aussi consulter le catalogue pour repérer le stock à vérifier. Sur iPhone, ouvrez la web app dans Safari à l’adresse /app/, puis ajoutez son icône à l’écran d’accueil. ShopFlow, le commerce mieux organisé. Les scènes sont illustratives.

Le personnage à l’écran ne produit pas de son. Enregistre cette voix off séparément, puis ajoute-la au montage dans CapCut ou Shotcut.

## Obtenir le fichier vidéo

1. Ouvrir `/motion/` depuis la vitrine et cliquer sur **Enregistrer la vidéo**. L’enregistrement dure environ 38 secondes; garde la page au premier plan.
2. Le navigateur télécharge un MP4 s’il prend en charge ce format. Sinon, il télécharge un WebM.
3. Si tu obtiens un WebM, importe-le dans CapCut ou Shotcut, ajoute si tu le souhaites la voix off ci-dessus, puis exporte en **MP4 / H.264**, vertical 1080 × 1920, 30 images/s.

### Conversion FFmpeg (facultative)

```bash
ffmpeg -i ShopFlow-motion.webm -c:v libx264 -pix_fmt yuv420p -movflags +faststart -an ShopFlow-motion.mp4
```

Cette commande crée un MP4 silencieux. Pour utiliser la voix off, fais plutôt l’assemblage audio dans CapCut ou Shotcut.

## Avec Claude Sonnet gratuit

Claude peut aider à reformuler le script ou modifier le code; le chat Claude ne rend pas lui-même le MP4. Le rendu se fait dans le lecteur Motion, puis CapCut, Shotcut ou FFmpeg convertit le WebM si besoin.

Prompt de modification à donner à Claude :

> Améliore la vidéo ShopFlow dans `motion/index.html` et `motion/motion.js`. Garde le personnage fourni dans `motion/assets/`, ses lunettes chocolat, le logo ShopFlow et le bouton d’export. Respecte l’ordre du récit : présentation du guide, question « C’est quoi ShopFlow ? », réponse simple, exemple de vente Android, exemple de stock, exemple iPhone dans Safari via `/app/`, conclusion. Garde les écrans clairement illustratifs; ne montre aucune vraie donnée, n’invente pas de fonction ou de prix et ne présente pas l’iPhone comme une IPA/App Store. Varie les poses, les déplacements et les transitions. Fournis un diff et les étapes de vérification.
