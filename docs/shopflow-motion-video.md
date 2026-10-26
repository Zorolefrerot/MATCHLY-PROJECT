# Film motion ShopFlow — déroulé et export

## Le déroulé du film

Le guide est un personnage bâton original, dessiné et animé dans Canvas à partir de gestes génériques (écrire, réfléchir, montrer, saluer). Les références visuelles filigranées ne sont pas réutilisées. Le récit suit huit scènes :

1. **Présentation** du guide et de ShopFlow.
2. **La question** : « Mais au fait… c’est quoi ShopFlow ? »
3. **La définition** : organiser ventes, articles et suivi de commerce.
4. **Exemple Android — vente** : sélectionner des bijoux et retrouver le reçu.
5. **Articles et stock** : repérer les quantités à vérifier, avec bijoux, accessoires, vêtements, chaussures et e-books.
6. **Exemple iPhone** : ouvrir la web app dans Safari à `/app/`, puis ajouter son icône à l’écran d’accueil.
7. **Suivi d’activité** : ventes, dépenses et crédits saisis.
8. **Conclusion** : rappel des catégories et du caractère illustratif des écrans.

Les écrans du film sont des **illustrations animées** : ce n’est ni une capture de l’application ni une vraie transaction. Le film est une ressource de la vitrine et reste distinct de la PWA à `/app/`.

## Voix off proposée

> Bonjour ! Mais au fait, c’est quoi ShopFlow ? ShopFlow aide les commerces à organiser leurs ventes, leurs articles et leur suivi quotidien. Une boutique peut, par exemple, gérer des colliers et des bracelets; une autre, des vêtements, des chaussures, des e-books ou des produits alimentaires. Consultez le catalogue pour vérifier les quantités, enregistrez une vente, puis retrouvez son reçu. Sur iPhone, ouvrez la web app dans Safari à l’adresse /app/ et ajoutez son icône à l’écran d’accueil. ShopFlow, le commerce mieux organisé. Les écrans sont illustratifs.

Le personnage et le film sont silencieux. Enregistrez cette voix off séparément, puis ajoutez-la au montage dans CapCut ou Shotcut si nécessaire.

## Obtenir le fichier vidéo

1. Ouvrir `/motion/` depuis la vitrine et cliquer sur **Enregistrer la vidéo**. L’enregistrement dure environ 38 secondes; gardez la page au premier plan.
2. Le navigateur télécharge un MP4 s’il prend en charge ce format. Sinon, il télécharge un WebM.
3. Si vous obtenez un WebM, importez-le dans CapCut ou Shotcut, ajoutez si vous le souhaitez la voix off ci-dessus, puis exportez en **MP4 / H.264**, vertical 1080 × 1920, 30 images/s.

### Conversion FFmpeg (facultative)

```bash
ffmpeg -i ShopFlow-motion.webm -c:v libx264 -pix_fmt yuv420p -movflags +faststart -an ShopFlow-motion.mp4
```

Cette commande crée un MP4 silencieux. Pour utiliser la voix off, faites plutôt l’assemblage audio dans CapCut ou Shotcut.
