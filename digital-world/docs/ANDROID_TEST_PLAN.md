# Recette à exécuter sur appareils Android réels

Aucun résultat matériel ne doit être déduit des tests headless.

- Installer l'APK signé ; noter marque, SoC, RAM, version Android, ABI et taille écran.
- Lancement hors ligne en mode avion, paysage, absence de demande réseau/stockage.
- Tester ratios 16:9, 19.5:9, tablette et encoche ; vérifier lisibilité, zones sûres et taille des cibles. Les marges sont actuellement fixes, pas une adaptation certifiée à toutes les encoches.
- Maintenir le joystick avec un doigt, tourner la caméra avec un second et sauter avec un troisième. Vérifier qu'aucun axe ne reste bloqué après une relâche, pause ou suspension.
- Vérifier marcher/courir, diagonales, saut, chute, atterrissage, impossibilité de traverser bâtiments et porte fermée.
- Placer la caméra contre chaque façade, coin et porte ; surveiller tout clipping résiduel.
- Terminer la mission sans commandes de debug : découvrir la place, parler à NOVA, terminal, trois fragments, réparation, retour, +50 énergie/badge une seule fois.
- Parler à PATCH et MÉMO ; ouvrir/fermer l'atelier ; examiner le portail verrouillé.
- Traverser une faille NULL, recevoir un coup, mourir, réapparaître au checkpoint sans perdre les fragments.
- Quitter/reprendre à chaque étape, y compris après deux fragments et pendant un dialogue ; seul un dialogue terminé doit faire avancer sa phase.
- Interrompre l'app par écran d'accueil, appel, verrouillage et arrêt forcé ; reprendre au point sûr.
- Vérifier volume musique/effets, silence à zéro, persistance des réglages, pause/retour Android.
- Profiler 10 minutes en économie : viser une frame GPU/CPU ≤33,3 ms et 30 FPS stables. Noter les baisses, chauffe et mémoire maximale. Refaire en mode normal.
- Tester nouveau jeu avec confirmation, sauvegarde corrompue et stockage saturé.

Publication production non couverte : clé privée durable, sauvegarde des clés, AAB, icônes finales, politique de confidentialité, classement et recette Play Store.
