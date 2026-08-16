"use strict";

/**
 * /help — menu généré automatiquement à partir des fichiers de commands/.
 */

const CATEGORY_LABELS = {
  general: "📌 GÉNÉRAL",
  utilitaires: "🛠️ UTILITAIRES",
  utilitaire: "🛠️ UTILITAIRES",
  utils: "🛠️ UTILITAIRES",
  admin: "👑 ADMIN"
};

const CATEGORY_ORDER = ["general", "utilitaires", "admin"];

function labelFor(category) {
  return CATEGORY_LABELS[category] || `📁 ${String(category).toUpperCase()}`;
}

function normalize(category) {
  if (category === "utilitaire" || category === "utils") return "utilitaires";
  return category;
}

module.exports = {
  name: "help",
  aliases: ["menu", "aide", "commandes"],
  category: "general",
  description: "Afficher le menu",
  usage: "/help [commande]",
  admin: false,

  async execute({ args, commands, config, reply }) {
    const prefix = config.prefix;

    // Détail d'une commande précise : /help ping
    if (args.length) {
      const target = commands.get(args[0]);
      if (!target) {
        await reply(`❓ Commande introuvable : ${prefix}${args[0]}`);
        return;
      }
      const lines = [
        `📖 ${prefix}${target.name}`,
        "",
        `Description : ${target.description}`,
        `Utilisation : ${target.usage}`,
        `Catégorie   : ${normalize(target.category)}`,
        `Accès       : ${target.admin ? "administrateur uniquement" : "tout le monde"}`
      ];
      if (target.aliases.length) lines.push(`Alias       : ${target.aliases.join(", ")}`);
      await reply(lines.join("\n"));
      return;
    }

    // Menu complet
    const groups = commands.byCategory();
    const keys = Array.from(groups.keys()).map(normalize);
    const uniqueKeys = Array.from(new Set(keys));
    const ordered = [
      ...CATEGORY_ORDER.filter((key) => uniqueKeys.includes(key)),
      ...uniqueKeys.filter((key) => !CATEGORY_ORDER.includes(key)).sort()
    ];

    const merged = new Map();
    for (const [category, list] of groups) {
      const key = normalize(category);
      if (!merged.has(key)) merged.set(key, []);
      merged.get(key).push(...list);
    }

    const out = [`🤖 ${config.botName}`, ""];
    let total = 0;

    for (const key of ordered) {
      const list = (merged.get(key) || []).sort((a, b) => a.name.localeCompare(b.name, "fr"));
      if (!list.length) continue;
      out.push(labelFor(key), "");
      for (const command of list) {
        out.push(`${prefix}${command.name} — ${command.description}`);
        total += 1;
      }
      out.push("");
    }

    out.push(`📊 ${total} commande(s) disponible(s).`);
    out.push(`💡 Détail d'une commande : ${prefix}help <commande>`);

    await reply(out.join("\n"));
  }
};
