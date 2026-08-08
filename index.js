const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const fs = require("fs");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
    const { version, isLatest } = await fetchLatestBaileysVersion();

    console.log(`Using WhatsApp version: ${version.join(".")}, isLatest: ${isLatest}`);

    const sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false, // Disable QR as we want pairing code
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.creds, pino({ level: "silent" })),
        },
        browser: ["Ubuntu", "Chrome", "20.0.04"],
    });

    // Pairing code logic
    if (!sock.authState.creds.registered) {
        // Use the PHONE environment variable or a default placeholder
        const phoneNumber = process.env.PHONE; 
        
        if (!phoneNumber) {
            console.log("--- CONFIGURATION REQUISE ---");
            console.log("Veuillez lancer le bot avec votre numéro de téléphone :");
            console.log("Exemple: PHONE=33612345678 node index.js");
            process.exit(0);
        }

        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`\nVotre code de couplage est : ${code}\n`);
            } catch (error) {
                console.error("Erreur lors de la demande du code de couplage:", error);
            }
        }, 3000);
    }

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            const shouldReconnect = (lastDisconnect.error instanceof Boom) ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true;
            console.log("Connexion fermée. Raison:", lastDisconnect.error, "Reconnexion:", shouldReconnect);
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === "open") {
            console.log("Bot connecté avec succès !");
        }
    });

    sock.ev.on("messages.upsert", async (m) => {
        console.log("Message reçu :", JSON.stringify(m, undefined, 2));
        const msg = m.messages[0];
        if (!msg.key.fromMe && m.type === "notify") {
            const from = msg.key.remoteJid;
            const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

            if (text === "ping") {
                await sock.sendMessage(from, { text: "pong" });
            }
        }
    });
}

startBot();
