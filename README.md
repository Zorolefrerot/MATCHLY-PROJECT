# MATCHLY-PROJECT

Un bot WhatsApp simple utilisant la bibliothèque `@whiskeysockets/baileys` avec connexion par code de couplage (Pairing Code).

## Installation

1. Clonez le dépôt.
2. Installez les dépendances :
   ```bash
   npm install
   ```

## Utilisation

Pour lancer le bot et obtenir un code de couplage, utilisez la commande suivante en remplaçant par votre numéro de téléphone (au format international, sans le +) :

```bash
PHONE=243xxxxxxxxx npm start
```

Une fois le code affiché dans le terminal, ouvrez WhatsApp sur votre téléphone :
1. Allez dans **Appareils connectés**.
2. Sélectionnez **Connecter un appareil**.
3. Sélectionnez **Se connecter avec le numéro de téléphone plutôt**.
4. Entrez le code affiché dans le terminal.

## Fonctionnalités

*   Connexion par code (pas besoin de scanner un QR code).
*   Répond "pong" quand on lui envoie "ping".
*   Base solide pour ajouter d'autres commandes.
