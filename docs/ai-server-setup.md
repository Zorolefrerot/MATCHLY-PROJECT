# Configuration sécurisée de l’IA ShopFlow

ShopFlow utilise le proxy serveur `/api/ai`. La clé Gemini et le modèle sont conservés côté serveur : ils ne sont ni saisis dans l’application ni inclus dans le code destiné aux utilisateurs. Le modèle fixé par le serveur est `gemini-3.5-flash-lite`.

## Créer et installer la clé

1. Créez une clé Gemini dans [Google AI Studio](https://aistudio.google.com/apikey).
2. Dans Render, ouvrez le service web ShopFlow, puis **Environment**.
3. Ajoutez `GEMINI_API_KEY` et collez la clé dans sa valeur secrète. Ne la mettez jamais dans le code, dans une variable `VITE_*`, dans GitHub Actions, ni dans une conversation.
4. Enregistrez et redéployez le service.

Le blueprint `render.yaml` transforme le site statique en service web Node afin qu’il puisse héberger à la fois la vitrine, `/app/` et le proxy. Le plan gratuit Render peut se mettre en veille; le premier démarrage peut donc être lent. La clé ne doit pas être ajoutée au bundle PWA.

Pour Vercel, définir également `GEMINI_API_KEY` comme variable d’environnement serveur du projet. Pour que les APK/iOS natifs appellent le proxy hébergé, définir la variable GitHub Actions publique (non secrète) `SHOPFLOW_API_BASE_URL` sur l’origine HTTPS publique du service, puis relancer le workflow Android ou iOS. La PWA hébergée sur le même domaine n’en a pas besoin.

## Limites et confidentialité

Le niveau gratuit Gemini est soumis à des quotas et limites de débit qui peuvent varier selon le projet et le modèle : ce n’est pas illimité. Les appels de tous les utilisateurs partagent le même quota de la clé serveur. Google indique que le contenu du niveau gratuit peut être utilisé pour améliorer ses produits; évitez donc d’envoyer des données personnelles ou confidentielles de clients. Consultez les quotas et conditions actuels dans AI Studio et la documentation Gemini avant un usage professionnel.
