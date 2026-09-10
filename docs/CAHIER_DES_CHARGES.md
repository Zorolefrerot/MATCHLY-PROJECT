# IDREM ZENKAI — Cahier des charges initial

Statut : synthèse des choix du propriétaire. Une première version du site a depuis été implémentée ; voir README.md pour les fonctions réalisées et les limites actuelles.

## 1. Vision et périmètre

Jeu RP dans une version alternative de Naruto Shippuden, au début de la série : Tsunade est Hokage, l’Akatsuki est active. L’histoire peut diverger à travers les actions des joueurs et des événements inédits : guerres, nouvelles organisations, alliances et conflits.

- Application Android installable, destinée en priorité aux téléphones de milieu de gamme.
- Monde 3D, rendu anime/cel-shading, commandes tactiles et combats en temps réel.
- Un monde logique partagé, réservé à **20 joueurs admis au total**.
- Zones publiques reliées entre elles et zones de mission réservées aux groupes.
- Site public pour les candidatures ; espace personnel et administration utilisables depuis un téléphone.
- Un seul administrateur : le propriétaire.
- Jeu gratuit ; objectif d’utiliser des services gratuits. La disponibilité permanente du serveur de jeu reste à valider techniquement et financièrement.
- **Pas d’IA externe au lancement** : dialogues écrits et comportements programmés. Pas de génération d’images par API au lancement.

Le nom validé est **IDREM ZENKAI**. L’illustration du propriétaire a été retrouvée sur la branche principale GitHub et intégrée à cette version sous `public/idrem-zenkai.png`.

## 2. Première livraison choisie : le site

Le premier produit à construire est le site de candidature et d’administration, **pas encore le jeu Android**.

### Parcours candidat

1. Consulter la présentation du projet, son statut et les conditions de participation.
2. Créer un compte avec pseudo, adresse e-mail et mot de passe.
3. Remplir une candidature comprenant :
   - où et comment le candidat a découvert le jeu ;
   - ce qu’il souhaite faire dans le jeu ;
   - le nom de son personnage ;
   - ses motivations ;
   - une courte histoire de son personnage ;
   - un quiz Naruto de **10 questions intermédiaires** : villages, rangs, personnages, organisations et chakra.
4. Consulter son statut et le message de l’administrateur dans son espace personnel.
5. Après acceptation, effectuer son unique attribution de clan, d’affinité et de potentiel Mokuton sur le site.
6. Adapter l’histoire du personnage au résultat obtenu.
7. Recevoir les instructions d’accès à l’application lorsqu’une véritable version Android est disponible.

Le quiz aide à la sélection ; la décision reste administrative. Les questions seront modifiables. Une version des questions et des réponses attendues doit être conservée pour chaque candidature afin que des modifications ultérieures ne changent pas rétroactivement son évaluation.

### États de candidature

- En attente d’examen.
- Acceptée.
- Liste d’attente.
- Refusée.

L’administrateur peut joindre un message de décision. Les décisions sont consultées sur le site ; une notification de décision par e-mail n’est pas requise. L’e-mail sert notamment à la récupération du compte.

### Parcours administrateur

- Accéder à un tableau de bord privé et adapté au téléphone.
- Consulter les candidatures, réponses au quiz et profils.
- Accepter, refuser ou placer en liste d’attente, avec un message.
- Ne jamais dépasser 20 admissions actives, même en cas de requêtes simultanées.
- Configurer le quiz et consulter l’historique des décisions.
- Gérer les absences au cas par cas, sans exclusion automatique.

Les outils d’inventaire, quêtes, boutiques et monde seront ajoutés avec les systèmes correspondants du jeu : ne pas les présenter comme fonctionnels avant leur implémentation.

## 3. Personnages et tirages

- Un seul personnage par joueur, identité persistante.
- Départ : genin fraîchement diplômé, à Konoha pour tous.
- Apparence personnalisable à partir de modèles prédéfinis et de pièces modulaires ; nom personnalisable.
- Clan attribué une seule fois, sans relance. Résultat conservé côté serveur.

### Personnalisation — ajout validé le 10 septembre 2026

Le propriétaire a validé l’entraînement 0.4 et demandé la personnalisation suivante pour les personnages :

- Modèle masculin ou féminin, au choix de la personne qui joue ; aucune déduction depuis son identité réelle.
- Modèle de coiffure et couleur des cheveux.
- Couleur des yeux et de la peau.
- Habits du haut et du bas sélectionnables séparément, ainsi que tenues complètes.
- Vêtements adaptés aux modèles masculins et féminins ; les joueuses sont incluses dès la création du personnage.

**Premier incrément technique** : créateur dans l’APK, aperçu 3D pivotant, palettes prédéfinies, couleurs du haut et du bas indépendantes, ensembles appliqués sans écraser le visage ou les cheveux, validation ou annulation des changements. Choix d’apparence conservés localement sur le téléphone. Modèles procéduraux provisoires, pas des avatars anime définitifs.

Cette personnalisation ne relance aucun tirage et ne donne aucun avantage de combat. Les yeux cosmétiques ne débloquent pas de dōjutsu. Dans le futur jeu connecté, les statistiques et droits d’équipement restent contrôlés par le serveur ; une tenue cosmétique de test ne donne pas accès à un objet de l’inventaire.

**Incrément 0.6 implémenté, à déployer/tester en production** : connexion native des joueurs admis et sauvegarde d’apparence rattachée au compte unique ([détails](COMPTE_JEU.md)). Le catalogue artistique final et les règles définitives de modification après création restent à préciser. La sauvegarde locale de l’APK ne remplace pas l’identité persistante du jeu RP ; une désinstallation peut l’effacer.

### Clans retenus

Uchiwa, Uzumaki, Senju, Hyūga, Akimichi, Yamanaka, Aburame, Inuzuka, Fushiguro, Itadori, Kurosaki, Shunsui, Yeager et Ackerman.

Les clans inspirés d’autres mangas auront des pouvoirs adaptés au chakra, aux entraînements et aux recharges de ce jeu. Leur contenu précis n’est pas encore défini.

### Rareté

- Uchiwa : 8 % au départ, maximum 3 joueurs.
- Uzumaki : 8 % au départ, maximum 3 joueurs.
- Senju : 8 % au départ, maximum 3 joueurs.
- Total initial des clans rares : 24 %.
- Les 76 % restants sont à répartir entre les onze autres clans ; leur répartition exacte n’a pas été explicitement validée.
- Un clan ayant atteint son plafond devient indisponible aux tirages suivants. La formule exacte de redistribution reste à préciser.
- Les plafonds sont des maxima, pas des nombres garantis.

### Affinités et Mokuton

Tirage élémentaire distinct du clan :

| Affinité | Probabilité |
|---|---:|
| Katon | 16 % |
| Fūton | 21 % |
| Raiton | 21 % |
| Doton | 21 % |
| Suiton | 21 % |

- D’autres éléments pourront être appris plus tard.
- **Exactement trois des vingt joueurs** doivent recevoir le potentiel Mokuton, indépendamment du clan.
- Le potentiel est connu sur le site mais doit être éveillé par la progression.
- Ce minimum/maximum garanti ne doit pas être implémenté par vingt tirages indépendants à probabilité fixe.
- Proposition technique à valider : mélanger secrètement vingt attributions dont trois positives, puis les distribuer de manière atomique et persistante. Tant que les vingt joueurs n’ont pas tous reçu leur résultat, les trois détenteurs ne sont pas nécessairement tous révélés.
- Le traitement des départs définitifs, remplacements et places Mokuton libérées reste à définir.

## 4. Équipes et coopération

- Équipe prévue : trois genin, avec des PNJ pour compléter, et un sensei PNJ.
- Les joueurs choisissent leurs coéquipiers au départ.
- L’équipe devient fixe ; les changements sont validés par le propriétaire.
- Les sensei quotidiens sont originaux ; les personnages connus interviennent lors d’entraînements, missions ou événements particuliers.
- Selon la mission, un absent peut être remplacé par un PNJ ou le groupe peut partir en effectif réduit.
- Certaines missions et épreuves importantes exigent toute l’équipe.
- Un absent ne reçoit pas les récompenses d’une mission à laquelle il ne participe pas.

## 5. Combat et progression

### Contrôles

- Combat 3D en temps réel.
- Visée mixte : verrouillage pour les attaques courantes, visée manuelle pour certains projectiles et zones.
- Marcher, courir, sprinter, sauter, esquiver. Pas de course murale ou de marche sur l’eau prévue dans le premier périmètre.
- Quatre jutsu équipés, en plus des commandes de déplacement, d’attaque de base et d’esquive.
- Changement de jutsu autorisé hors combat, sans réinitialiser les recharges.

### Règles

- Chaque technique a sa propre recharge indépendante ; plus elle est puissante, plus la recharge est longue.
- Pas de délai commun imposé entre deux techniques différentes disponibles.
- Consommation de chakra ; régénération automatique, plus lente en combat.
- PvP uniquement en duel accepté ou dans les événements prévus. Une désertion ou une guerre ne doit pas implicitement autoriser les agressions libres partout.
- Défaite : blessures et conséquences temporaires, éventuellement échec de mission, sans perte définitive du personnage.
- Hors combat, le personnage déconnecté quitte le monde en sécurité.
- En combat, il reste vulnérable pendant une période de reconnexion à définir ; après expiration, défaite en duel ou mise hors combat en mission.

### Apprentissage

- Départ : techniques de base et un jutsu élémentaire simple correspondant à l’affinité.
- Expérience pour les capacités générales ; sensei, parchemins, quêtes et entraînements pour apprendre des jutsu.
- Exercices pour apprendre, puis utilisation pertinente en mission pour améliorer la maîtrise.
- La maîtrise améliore l’efficacité chiffrée adaptée au jutsu : dégâts, protection ou durée, avec plafonds.
- Sharingan : éveil et tomoe par progression et entraînement.
- Mangekyō : progression très exigeante après maîtrise des trois tomoe, missions et entraînements ; pas de dégradation de la vision. Limites de chakra et de recharge.
- Jinchūriki : uniquement des PNJ, pas d’attribution de bijū aux joueurs.

### Ennemis

Logique locale/serveur programmée, sans modèle de langage : rôles de mêlée, distance et soutien, coordination, renforts, retraite et boss à plusieurs comportements/phases. Déploiement progressif selon la faisabilité.

## 6. Rangs et institutions

- Examens chūnin à dates fixes, avec sessions exceptionnelles organisées par le propriétaire.
- Admission selon des critères de progression explicites, sans recommandation obligatoire du sensei.
- Promotion : minimum d’épreuves réussies et évaluation de stratégie, coopération et leadership selon des critères visibles.
- Promotion jōnin : expérience, résultats en mission et évaluation spéciale avant nomination.
- Dirigeants initialement PNJ ; certains rôles pourront être occupés par des joueurs.
- Hokage joueur sélectionné au mérite, nomination validée par le propriétaire.
- Désertion volontaire encadrée ou issue d’événements RP, avec conséquences connues.
- Akatsuki : candidature d’un déserteur admissible et épreuves de recrutement. Admission validée par l’administrateur tant que son chef est PNJ.

Sans IA externe, le quotidien des dirigeants PNJ reposera sur des dialogues et règles préparés. Leurs décisions importantes nécessitent une validation administrative. Le contrôle direct de leurs dialogues par un administrateur n’a pas été retenu comme mode principal.

## 7. Narration, communication et événements

- Texte uniquement entre joueurs : proximité, équipe, messages privés ; séparation RP/hors-RP.
- Les actions écrites sont descriptives et ne modifient pas directement l’état du jeu.
- PNJ : menus rapides pour boutiques et services ; dialogues à embranchements pour histoires et relations.
- Mémoire structurée des rencontres, promesses, missions et actes importants.
- Réputation transmise par des mécanismes définis : témoins, rapports, rumeurs ; pas de connaissance universelle des secrets.
- Grandes aventures écrites, missions dynamiques issues de modèles programmés et quêtes administratives avec objectifs et récompenses configurables.
- Événements locaux programmés ; organisations et conflits initiés par les joueurs ; grands bouleversements validés par le propriétaire.
- Une future intégration IA reste possible, mais n’est pas nécessaire à la première version.

## 8. Économie

- Armes, tenues et accessoires dotés de statistiques ; rôle important dans la progression.
- Équipements obtenus par boutiques et récompenses de mission, pas par butin aléatoire d’ennemis ni artisanat dans le périmètre initial.
- Ryō gagnés par missions, événements, petits travaux et ventes entre joueurs.
- Échanges directs avec double confirmation et marché commun.
- Expérience et ryō individuels pour chaque participant effectif.
- Objets spéciaux : tirage au sort entre les participants ayant choisi « Participer », avec possibilité de passer. Règle annoncée avant la mission.

## 9. Administration cible

Le propriétaire dispose seul des fonctions suivantes, progressivement ajoutées :

- admissions, liste d’attente, signalements et sanctions ;
- équipes, rôles, quêtes, récompenses et événements ;
- validation des décisions majeures des dirigeants PNJ ;
- corrections d’inventaire et de progression ;
- configuration des boutiques ;
- journaux techniques et historique des modifications sensibles ;
- configuration éventuelle des services IA futurs, exclusivement côté serveur.

## 10. Exigences de sécurité et de fiabilité

- Les contrôles d’accès, tirages, inventaires, récompenses et admissions sont autoritaires côté serveur.
- Transactions et contraintes de base de données pour empêcher les doubles tirages, les dépassements de capacité et les échanges dupliqués.
- Aucune clé privée dans le navigateur, l’APK ou le dépôt Git.
- Authentification éprouvée ; mots de passe jamais stockés en clair ni visibles par l’administrateur.
- Réinitialisation par lien temporaire à usage unique ; service d’envoi d’e-mails à configurer et tester.
- Création initiale du compte propriétaire via une procédure privée, jamais par un choix de rôle à l’inscription.
- Sessions sécurisées, contrôle des permissions, protection contre les soumissions abusives et validation des entrées.
- Sauvegardes et historique administratif ; données de candidature et adresses e-mail non publiques.
- Politique de confidentialité, règles RP, sanctions, conservation/suppression des données et public d’âge visé à préciser avant ouverture publique.

## 11. Plan de réalisation proposé

### Étape 1 — Interface du site

Identité IDREM ZENKAI, accueil, inscription/connexion, formulaire, espace candidat et tableau de bord responsive. Les données fictives éventuelles doivent être explicitement indiquées ; une maquette ne constitue pas une authentification opérationnelle.

### Étape 2 — Fonctionnement réel

Connexion à une base persistante et à une solution d’authentification, récupération du compte, sauvegarde des candidatures, quiz versionné, décisions et contrôle des vingt places.

### Étape 3 — Attributions sécurisées

Tirages atomiques et non relançables, plafonds par clan, réserve Mokuton garantissant trois attributions sur vingt, historique des résultats et tests de concurrence. Finaliser les règles de redistribution et de remplacement avant publication.

### Étape 4 — Mise en ligne du site

Choisir et vérifier les offres gratuites réellement disponibles, configurer secrets et e-mails hors Git, tester sur téléphone, sauvegarder les données et ouvrir les candidatures après validation du propriétaire.

### Étape 5 — Prototype Android ultérieur

Godot 4.5.1 et compilation gratuite GitHub Actions mis en place. L’entraînement solo 0.4 (arène, commandes tactiles, combat et effets) a été **validé par le propriétaire le 10 septembre 2026**.

Incrément suivant : création/personnalisation locale du personnage décrite en section 3, en conservant l’entraînement validé. Le raccordement aux comptes, la synchronisation multijoueur et une mission coopérative restent des travaux ultérieurs. Les APK ne doivent pas être annoncés comme disponibles avant compilation et tests réels.

## 12. Contraintes et points encore ouverts

- Les offres gratuites ont des limites et peuvent évoluer ; ni le serveur de jeu 24 h/24 ni l’envoi d’e-mails ne sont garantis sans frais.
- Hébergement web, base de données, serveur multijoueur et compilation Android sont des besoins distincts.
- La 3D détaillée exige des modèles, animations, décors et effets adaptés au mobile ; le code seul ne fournit pas ces ressources.
- Naruto et les autres univers cités sont protégés. Vérifier les autorisations et licences pour les noms, personnages, modèles, musiques et images avant diffusion. La gratuité n’accorde pas automatiquement les droits.
- À préciser pendant la conception : logo accessible, ressources artistiques, contenu final du quiz, règles RP, âges admis, statistiques, jutsu par clan, temporisations, conditions exactes des rangs et gestion des départs définitifs.
- Les aspects non définis doivent rester signalés comme propositions, pas présentés comme des choix déjà validés.

## 13. Critères de réussite du premier site

- Un candidat peut créer son compte, se reconnecter et récupérer son accès.
- Sa candidature est persistante, privée et visible par le propriétaire uniquement.
- Le propriétaire peut traiter une candidature et le candidat voit le statut et le message.
- La vingt-et-unième admission active est bloquée côté serveur.
- Seul un admis peut recevoir ses attributions ; une actualisation ou deux appels simultanés ne donnent pas de relance.
- Les plafonds des clans rares et les trois attributions Mokuton sur une cohorte complète de vingt sont vérifiés par des tests.
- Le site fonctionne sur un écran de téléphone et ne présente pas des fonctions Android inexistantes comme disponibles.
