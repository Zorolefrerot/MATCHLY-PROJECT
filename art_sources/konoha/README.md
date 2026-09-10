# Images de référence — amélioration visuelle de Konoha

Dossier destiné aux images que le propriétaire souhaite fournir. **Aucune image n’a encore été reçue pour cette étape.** Ces sources sont hors du projet `game/` : leur ajout seul ne déclenche pas une compilation Android et elles ne sont pas incluses automatiquement dans l’APK.

## Premier lot demandé

| Nom conseillé (JPG ou PNG, garder l’extension réelle) | Contenu utile |
|---|---|
| `maison-reference.jpg` | Une maison représentative de Konoha, façade ou vue trois quarts ; toit, murs et fenêtres visibles. |
| `residence-hokage.jpg` | La résidence du Hokage entière, façade ou vue trois quarts ; silhouette du bâtiment et toiture lisibles. |
| `falaise-hokage.jpg` | La falaise et ses visages, idéalement une vue frontale nette et suffisamment large. |

Préférer des images nettes, idéalement d’au moins 1 500 pixels de large, sans interface ni texte superposé. Cette résolution est une recommandation, pas un blocage. Fournir des images personnelles ou des références dont l’utilisation est autorisée ; la gratuité du projet ne donne pas automatiquement de droits sur les œuvres sources.

## Traitement prévu après réception

- Examiner les images réellement fournies avant de choisir le découpage, les dimensions et l’usage des textures.
- Conserver les sources et leur provenance. Préparer séparément des textures allégées dans `game/assets/` ; ne pas embarquer les références haute résolution par défaut.
- Utiliser les vues de bâtiments comme références de forme et de matériaux. Une photo en perspective n’est pas automatiquement une texture de façade directement applicable.
- Retravailler aussi les silhouettes/volumes et les toitures : des textures seules ne suppriment pas l’aspect cubique des modèles.
- Étudier une falaise texturée en décor de fond pour ce premier incrément ; ne pas présenter une image plane comme des visages sculptés en 3D.
- Garder des textures de taille raisonnable, mutualiser les matériaux et vérifier le rendu sur la cible mobile. Aucune nouvelle qualité ni performance n’est annoncée comme validée avant réalisation et tests.

Les scripts, textures et modèles livrés dans l’APK 0.7 restent inchangés à ce stade.
