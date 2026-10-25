# ShopFlow Android (APK de test)

ShopFlow embarque l'application React compilée dans un WebView Capacitor natif. Le site vitrine ne sert pas de démo intégrée : un lancement Android natif ouvre directement l'interface de l'application.

## Build local

Prérequis : Node.js 22+, JDK 21 et Android SDK configuré (`ANDROID_HOME` ou `ANDROID_SDK_ROOT`).

```bash
npm ci
npm run android:apk
```

L'APK debug installable est généré dans :

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

C'est une build de test signée avec la clé debug Android, pas un paquet Play Store de production. La publication exige une clé de signature release et la configuration de la fiche Play Store. La génération de l'APK n'a pas pu être exécutée dans l'environnement de travail actuel, car il ne contient pas de JDK ni d'Android SDK.

## Fonctions natives

- Autorisations caméra et microphone déclarées pour le scanner photo/code-barres et la dictée vocale.
- Ressources d'icône et de splash construites à partir de l'identité visuelle ShopFlow.
- Les chemins d'assets Vite sont relatifs pour fonctionner depuis les assets locaux Capacitor.
- L'application démarre directement sur l'espace app dans Android natif.

## Historique ShopFlow AI

Les discussions sont enregistrées dans le stockage local privé de l'application, séparées par nom de boutique et propriétaire. Le sélecteur en haut de l'assistant permet de retrouver une discussion, `Nouveau` en ouvre une autre sans effacer l'historique, jusqu'à 40 discussions récentes. L'historique reste sur cet appareil et fonctionne hors-ligne pour les réponses locales; il n'est pas encore synchronisé vers un compte Cloud ou un autre appareil. La réinitialisation des données de l'application supprime aussi cet historique.
