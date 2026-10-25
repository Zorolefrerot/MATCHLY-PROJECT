import { AiStoreAction } from '../components/AiAssistantView';
import {
  AppLanguage,
  CreditEntry,
  ExpenseEntry,
  Product,
  SaleRecord,
  ShopSettings,
} from '../types';
import { formatMoney } from './currency';

/**
 * Extracts clean assistant text from ANY HTTP response format returned by cloud LLM gateways:
 * - Standard OpenAI JSON completion (`choices[0].message.content`)
 * - Reasoning models where `content` is empty or preceded by `<think>...</think>`
 * - Server-Sent Events streaming chunks (`data: {"choices":[{"delta":{"content":"..."}}]}`)
 * - Plain Markdown text (stripping third-party gateway ads/footers)
 * - Throws if the payload is actually an error JSON/HTML page so raw API code NEVER reaches the user!
 */
export function parseGatewayResponseText(rawHttpBody: string): string {
  const trimmed = (rawHttpBody || '').trim();
  if (!trimmed) {
    throw new Error('Empty AI gateway response');
  }

  // Reject HTML error pages (502 Bad Gateway, Cloudflare challenge, nginx HTML)
  if (/^<!doctype html|^<html|^<head|^<body/i.test(trimmed)) {
    throw new Error('HTML error page returned by gateway');
  }

  // Case 1: Streaming SSE payload ("data: {...}\ndata: {...}")
  if (/^data:\s*\{/m.test(trimmed)) {
    let assembled = '';
    const lines = trimmed.split('\n');
    for (const line of lines) {
      const m = line.match(/^data:\s*(\{.*\})\s*$/);
      if (!m) continue;
      try {
        const chunk = JSON.parse(m[1]);
        const piece =
          chunk?.choices?.[0]?.delta?.content ??
          chunk?.choices?.[0]?.message?.content ??
          '';
        if (typeof piece === 'string') assembled += piece;
      } catch {
        // Ignore non-JSON line
      }
    }
    if (assembled.trim()) return cleanRawModelText(assembled);
    throw new Error('Empty SSE stream');
  }

  // Case 2: JSON envelope
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed?.error) {
        throw new Error(String(parsed.error?.message || 'API error'));
      }
      const msgContent = parsed?.choices?.[0]?.message?.content;
      if (typeof msgContent === 'string' && msgContent.trim()) {
        return cleanRawModelText(msgContent);
      }
      // Never dump raw unknown JSON objects straight into the user's chat!
      throw new Error('Unexpected JSON response structure');
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.includes('API error') ||
          err.message.includes('Unexpected JSON'))
      ) {
        throw err;
      }
    }
  }

  return cleanRawModelText(trimmed);
}

/**
 * Cleans all raw model quirks so the merchant NEVER sees raw code blocks, XML tags, `<think>` blocks,
 * Pollinations ads, or raw unrendered LaTeX commands inside grey `<code>` boxes!
 */
export function cleanRawModelText(input: string): string {
  let out = input;

  // 1. Remove internal chain-of-thought tags (<think>...</think>) & XML action tags (<shopflow_action>...</shopflow_action>)
  out = out.replace(/<think>[\s\S]*?<\/think>/gi, '');
  out = out.replace(/<shopflow_action>[\s\S]*?<\/shopflow_action>/gi, '');
  out = out.replace(/<\/?shopflow_action[^>]*>/gi, '');

  // 2. Convert inline HTML tags frequently emitted by GPT-4o / OpenAI inside Markdown tables (<br>, <b>, <strong>, <sub>, <sup>)
  // because ReactMarkdown does not parse raw HTML and would display literal "<br>" code on screen!
  out = out.replace(/<br\s*\/?>/gi, ' • ');
  out = out.replace(/<\/?(?:strong|b)>/gi, '**');
  out = out.replace(/<\/?(?:em|i)>/gi, '*');
  out = out.replace(/<sub>([\s\S]*?)<\/sub>/gi, '_$1');
  out = out.replace(/<sup>([\s\S]*?)<\/sup>/gi, '^$1');
  out = out.replace(/<\/?(?:div|span|p|ul|li|table|tr|td|th)[^>]*>/gi, ' ');

  // 3. Reject if the model returned a raw JSON object/array instead of human prose
  const trimmedCheck = out.trim();
  if (
    (trimmedCheck.startsWith('{') && trimmedCheck.endsWith('}')) ||
    (trimmedCheck.startsWith('[') && trimmedCheck.endsWith(']'))
  ) {
    throw new Error('Model returned raw JSON instead of natural language');
  }

  // 2. Remove Pollinations / third-party sponsor footers if appended
  out = out.replace(
    /\n*-{3,}\s*\n+\s*(?:\*\*Support Pollinations|🌸\s*\*\*Ad\*\*|Powered by Pollinations|Want best roleplay|\[Support Pollinations)[\s\S]*$/i,
    ''
  );

  // 3. Unwrap ```markdown / ```md / ```text / ```txt code fences that wrap normal prose/tables!
  out = out.replace(
    /```(?:markdown|md|text|txt|plaintext)?\s*\n([\s\S]*?)```/gi,
    (_, inner) => {
      const trimmedInner = inner.trim();
      // If inside contains LaTeX commands without $$, wrap in $$...$$
      if (
        /^\\(?:frac|sum|sqrt|text|left|begin)/.test(trimmedInner) &&
        !trimmedInner.includes('$$')
      ) {
        return `\n\n$$\n${trimmedInner}\n$$\n\n`;
      }
      return `\n${trimmedInner}\n`;
    }
  );

  // 4. Convert ```latex / ```tex / ```math / ```katex code blocks directly into rendered $$ ... $$ equations!
  out = out.replace(
    /```(?:latex|tex|math|katex)\s*\n([\s\S]*?)```/gi,
    (_, expr) => {
      const cleanExpr = expr.trim().replace(/^\$\$|\$\$$/g, '').trim();
      return `\n\n$$\n${cleanExpr}\n$$\n\n`;
    }
  );

  // 5. Remove any remaining programming code blocks (```json, ```python, ```js, ```html...) completely or turn key-values into bullets!
  out = out.replace(/```[a-zA-Z0-9_-]*\s*\n([\s\S]*?)```/g, (_, codeBody) => {
    const body = codeBody.trim();
    if (body.includes('\\frac') || body.includes('\\times') || body.includes('\\text{')) {
      return `\n\n$$\n${body.replace(/^\$\$|\$\$$/g, '').trim()}\n$$\n\n`;
    }
    // Strip JSON braces/quotes cleanly if the model put a summary inside ```json
    return (
      '\n' +
      body
        .replace(/[{}\[\]"]/g, '')
        .split('\n')
        .map((l: string) => l.trim().replace(/,\s*$/, ''))
        .filter(Boolean)
        .map((l: string) => (l.includes(':') ? `- **${l.replace(':', ' :**')}` : l))
        .join('\n') +
      '\n'
    );
  });

  // 6. Unwrap inline backticks placed around math formulas: `$$...$$`, `$...$`, `\[...\]`, or `\frac{...}{...}`!
  out = out.replace(/`\s*\$\$([\s\S]*?)\$\$\s*`/g, (_, m) => `\n\n$$\n${m.trim()}\n$$\n\n`);
  out = out.replace(/`\s*\$([^`\n]+?)\$\s*`/g, (_, m) => `$${m.trim()}$`);
  out = out.replace(
    /`([^`\n]*\\(?:frac|times|div|sum|sqrt|approx|text)\b[^`\n]*)`/g,
    (_, m) => `$${m.trim()}$`
  );

  // 7. Standardize \[ ... \] and \( ... \) into clean $$ ... $$ and $ ... $ for remark-math v6!
  out = out.replace(
    /\\\[([\s\S]*?)\\\]/g,
    (_, expr) => `\n\n$$\n${expr.trim()}\n$$\n\n`
  );
  out = out.replace(/\\\(([\s\S]*?)\\\)/g, (_, expr) => `$${expr.trim()}$`);

  // 8. Ensure every single-line $$ ... $$ sits unindented on its own clean block so remark-math v6 ALWAYS renders KaTeX!
  out = out.replace(/^[ \t]*\$\$\s*([^\n$]+?)\s*\$\$[ \t]*$/gm, (_, expr) => {
    return `\n$$\n${expr.trim()}\n$$\n`;
  });
  // Also de-indent multi-line indented $$ delimiters inside bullet lists (prevents 4-space Markdown <pre><code> blocks!)
  out = out.replace(/^[ \t]+\$\$/gm, '$$');

  // 9. Trim stray tight inner spaces inside inline `$ expr $` -> `$expr$` (remark-math requires tight `$` for inline math!)
  out = out.replace(/(?<!\$)\$(?!\$)\s+([^$\n]+?)\s+\$(?!\$)/g, '$$$1$$');

  return out.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Pure local natural-language store action detector:
 * Lets the merchant say "Enregistre la vente de 2 sacs de riz et 1 bidon d'huile" or "Ajoute une dépense transport de 5000 FC"
 * WITHOUT putting ANY JSON/XML code instructions into the LLM prompt!
 */
export function detectLocalStoreActions(
  prompt: string,
  products: Product[]
): AiStoreAction[] {
  const lower = prompt.toLowerCase();
  const actions: AiStoreAction[] = [];

  // 1. Detect direct sale command ("enregistre la vente de ...", "vends 2 sacs de riz", "encaisse 3 bidons d'huile")
  const isNegatedOrQuestion =
    lower.includes('?') ||
    /\b(?:ne\b[\s\S]{0,28}\bpas\b|n['’]enregistre|pas de vente|comment|pourquoi|faut-il|dois-je|est-ce que)\b/i.test(lower);
  const isSellIntent =
    !isNegatedOrQuestion &&
    /\b(?:enregistre(?:r)?\s+(?:la\s+)?vente|vends?|encaisse(?:r)?|sell|record\s+sale)\b/i.test(lower);

  if (isSellIntent) {
    for (const p of products) {
      const keywords = p.name
        .toLowerCase()
        .split(/\s+/)
        .filter(
          (w) =>
            w.length >= 3 &&
            !['sac', 'pack', 'lot', 'boîte', 'bidon', 'parfumé', 'dorée', 'entier', 'frais', 'blanc'].includes(w)
        );
      const matched = keywords.some((kw) => lower.includes(kw));
      if (matched) {
        // Find number right before keyword if present (e.g. "2 sacs de riz", "3 huile")
        let qty = 1;
        for (const kw of keywords) {
          const rx = new RegExp(
            `(\\d+)\\s*(?:x|×|sacs?|bidons?|boîtes?|paquets?|alvéoles?|packs?|unités?)?\\s*(?:de\\s+|d['’])?${kw}`,
            'i'
          );
          const m = lower.match(rx);
          if (m) {
            qty = Math.max(1, parseInt(m[1], 10));
            break;
          }
        }
        actions.push({ type: 'sell', productId: p.id, quantity: qty });
      }
    }
  }

  // 2. Detect direct expense command ("ajoute une dépense ... de 5000")
  if (/\b(ajoute|enregistre|note)\b.*\b(dépense|charge)\b/i.test(lower)) {
    const amtMatch = lower.match(/(\d[\d\s]*)\s*(?:fc|cdf|\$|usd)?/i);
    if (amtMatch) {
      const rawNum = parseInt(amtMatch[1].replace(/\s+/g, ''), 10);
      if (rawNum > 0) {
        actions.push({
          type: 'add_expense',
          label: prompt.slice(0, 48),
          amountFC: rawNum,
        });
      }
    }
  }

  return actions;
}

/**
 * Rich, instant local business analyst backup when external network is unreachable or rate-limited:
 * Produces genuine ChatGPT-quality Markdown + KaTeX equations + GFM tables on the live store numbers!
 */
export function generateSmartLocalBusinessResponse(
  userPrompt: string,
  settings: ShopSettings,
  products: Product[],
  sales: SaleRecord[],
  expenses: ExpenseEntry[],
  credits: CreditEntry[],
  executedBadges?: string[]
): string {
  const fmt = (v: number) =>
    formatMoney(v, settings.currency, settings.usdRateFC);

  const totalCA = sales.reduce((a, s) => a + s.totalRevenueFC, 0);
  const totalCost = sales.reduce((a, s) => a + s.totalCostFC, 0);
  const grossMargin = totalCA - totalCost;
  const totalExp = expenses.reduce((a, e) => a + e.amountFC, 0);
  const netProfit = grossMargin - totalExp;
  const marginPct =
    totalCA > 0 ? ((grossMargin / totalCA) * 100).toFixed(1) : '0.0';
  const netPct = totalCA > 0 ? ((netProfit / totalCA) * 100).toFixed(1) : '0.0';

  const q = userPrompt.toLowerCase();

  // Never invent product names or prices when a new shop has no catalogue yet.
  if (
    products.length === 0 &&
    sales.length === 0 &&
    expenses.length === 0 &&
    credits.length === 0 &&
    (!executedBadges || executedBadges.length === 0)
  ) {
    if (q.includes('whatsapp') || q.includes('tiktok') || q.includes('pub')) {
      return (
        `## Message prêt à personnaliser\n\n` +
        `Bonjour ! Bienvenue chez **${settings.shopName || 'notre boutique'}**. ` +
        `Nous sommes heureux de vous servir. Écrivez-nous pour connaître les articles disponibles et leurs prix.\n\n` +
        `*Ajoutez vos premiers articles et coordonnées dans ShopFlow avant de publier des prix ou des disponibilités.*`
      );
    }
    if (q.includes('prix') || q.includes('promo') || q.includes('%')) {
      return (
        `## Calcul du prix de vente\n\n` +
        `Aucun article ni coût d’achat n’est encore enregistré : je ne peux donc pas calculer un prix réel sans inventer de chiffres.\n\n` +
        `En général : **prix de vente = coût d’achat + marge souhaitée**. Ajoutez d’abord l’article et son coût dans Stock, puis je pourrai vous aider à faire une simulation.`
      );
    }
    return (
      `## Votre espace est prêt\n\n` +
      `Aucun produit, vente, crédit ou frais n’est encore enregistré. Je ne vais pas inventer de chiffres. ` +
      `Ajoutez votre premier article dans **Stock**, puis utilisez **Caisse** pour enregistrer une vente.\n\n` +
      `Je peux aussi expliquer les fonctions de ShopFlow ou vous aider à rédiger un texte général. Pour des réponses de culture générale, un service IA en ligne gratuit peut être sollicité ; s’il est indisponible, ce mode local reste limité aux données et outils présents sur l’appareil.`
    );
  }

  // Action confirmation response
  if (executedBadges && executedBadges.length > 0) {
    return (
      `## Opération exécutée avec succès\n\n` +
      `J’ai immédiatement mis à jour la caisse et le stock de **${settings.shopName}** :\n\n` +
      executedBadges.map((b) => `- **${b}**`).join('\n') +
      `\n\n### Nouveau point financier en direct\n\n` +
      `| Indicateur | Montant actuel |\n` +
      `| --- | --- |\n` +
      `| **Chiffre d’Affaires (CA)** | **${fmt(totalCA)}** |\n` +
      `| **Coût d’achat marchandise** | **${fmt(totalCost)}** |\n` +
      `| **Dépenses enregistrées** | **${fmt(totalExp)}** |\n` +
      `| **Bénéfice Net Réel** | **${fmt(netProfit)}** |\n`
    );
  }

  // Promo / price simulation question
  if (q.includes('promo') || q.includes('%') || q.includes('baisse') || q.includes('prix') || q.includes('price') || q.includes('discount')) {
    const pctMatch = q.match(/(\d+(?:[.,]\d+)?)\s*%/);
    const discountPct = pctMatch
      ? Math.min(25, Math.max(2, parseFloat(pctMatch[1].replace(',', '.'))))
      : 8;
    const topProd = products[0];
    if (!topProd) {
      return 'Je ne peux pas simuler une promotion sans article ni prix enregistrés. Ajoutez d’abord un produit et son coût d’achat dans Stock pour éviter un résultat inventé.';
    }
    const pv = topProd.sellingPriceFC;
    const pa = topProd.purchasePriceFC;
    const oldGain = pv - pa;
    const newPv = Math.round(pv * (1 - discountPct / 100));
    const newGain = newPv - pa;
    if (oldGain <= 0 || newGain <= 0) {
      return (
        `## Promotion à éviter\n\n` +
        `Avec les prix enregistrés pour **${topProd.name}**, une remise de **-${discountPct}%** ferait disparaître la marge ou vendre sous le coût d’achat. Vérifiez les coûts et prix avant de lancer une promotion.`
      );
    }
    const ratio = (oldGain / newGain).toFixed(2);
    const extraPct = Math.round((oldGain / newGain - 1) * 100);

    return (
      `## Simulation de Promotion à -${discountPct}% sur **${topProd.name}**\n\n` +
      `Pour savoir si une remise de **-${discountPct}%** est rentable sans perdre d’argent, comparons la marge unitaire avant et après promotion :\n\n` +
      `$$\n\\text{Ratio de volume requis} = \\frac{M_{\\text{actuelle}}}{M_{\\text{promo}}} = \\frac{${pv} - ${pa}}{${newPv} - ${pa}} = \\frac{${oldGain}}{${newGain}} \\approx ${ratio}\n$$\n\n` +
      `| Scénario | Prix de vente | Coût d’achat | Bénéfice / unité | Volume pour même gain |\n` +
      `| --- | --- | --- | --- | --- |\n` +
      `| **Tarif normal actuel** | **${fmt(pv)}** | ${fmt(pa)} | **+${fmt(oldGain)}** | **10 unités** |\n` +
      `| **Promo (-${discountPct}%)** | **${fmt(newPv)}** | ${fmt(pa)} | **+${fmt(newGain)}** | **${Math.ceil(10 * (oldGain / newGain))} unités (+${extraPct}%)** |\n\n` +
      `### Conseil stratégique pour ${settings.shopName}\n` +
      `- Appliquez **-${discountPct}% uniquement à partir de 3 unités achetées** (offre pack famille) plutôt que sur 1 pièce isolée : vous augmentez le panier moyen tout en protégeant votre marge nette !`
    );
  }

  // WhatsApp / TikTok marketing prompt
  if (q.includes('whatsapp') || q.includes('tiktok') || q.includes('pub') || q.includes('marketing') || q.includes('client')) {
    const stars = products.slice(0, 3);
    if (stars.length === 0) {
      return (
        `## Texte à personnaliser\n\n` +
        `Bonjour, bienvenue chez **${settings.shopName || 'ma boutique'}** ! ` +
        `Contactez-nous pour connaître les produits disponibles et leurs prix.\n\n` +
        `Ajoutez vos articles et vos coordonnées dans l’application avant d’annoncer des prix, des stocks ou des services de livraison.`
      );
    }
    return (
      `## Plan Marketing Express — **${settings.shopName}**\n\n` +
      `### 1. Message Statut & Groupe WhatsApp (prêt à copier)\n\n` +
      `> **ARRIVAGE FRAIS CHEZ ${settings.shopName.toUpperCase()} (${settings.city}) !**\n` +
      `> Profitez de nos meilleurs prix de la semaine sur vos produits essentiels :\n` +
      stars.map((p) => `> - **${p.name}** : **${fmt(p.sellingPriceFC)}** seulement !`).join('\n') +
      `\n> Livraison rapide à domicile dès aujourd’hui — écrivez-nous directement sur WhatsApp au **${settings.whatsappNumber}** !\n\n` +
      `### 2. Script Vidéo TikTok / Reels (30 secondes)\n` +
      `- **0–5 s (Accroche visuelle) :** Montrez les stocks bien rangés en boutique : *« Arrêtez de payer votre panier alimentaire trop cher à ${settings.city} ! »*\n` +
      `- **5–20 s (Preuve & Prix clairs) :** Montrez **${stars[0]?.name}** à **${fmt(stars[0]?.sellingPriceFC || 0)}** et **${stars[1]?.name}** à **${fmt(stars[1]?.sellingPriceFC || 0)}** avec reçu propre sur WhatsApp.\n` +
      `- **20–30 s (Appel à l’action) :** *« Cliquez sur le lien WhatsApp en bio, livraison express chez vous ! »*`
    );
  }

  // Common in-app how-to questions have reliable local answers.
  if (/\b(ajouter|créer|enregistrer|add|create)\b/.test(q) && /\b(article|produit|stock|item|product)\b/.test(q)) {
    return '## Ajouter un article\n\nOuvrez **Stock**, touchez **Ajouter un article**, puis renseignez le nom, l’unité, la quantité, le coût d’achat et le prix de vente. Une photo est facultative. Les changements sont enregistrés sur cet appareil.';
  }
  if (/\b(caisse|vente|encaisser|checkout|sell)\b/.test(q) && /\b(comment|aide|utiliser|faire|how|help)\b/.test(q)) {
    return '## Enregistrer une vente\n\nOuvrez **Caisse**, sélectionnez les articles et leurs quantités, choisissez le moyen de paiement, puis validez. Le stock est mis à jour et le reçu est accessible depuis l’historique.';
  }
  if (/\b(reçu|receipt|imprimer|print)\b/.test(q) && /\b(comment|format|papier|imprimer|print|how)\b/.test(q)) {
    return '## Reçu et impression\n\nAprès une vente, ouvrez son reçu depuis l’historique. Choisissez **Rouleau 58 mm**, **Rouleau 80 mm** ou **A4**, puis touchez **Imprimer**. La taille peut dépendre aussi du pilote de votre imprimante.';
  }

  if (/\b(crédit|crédits|impayé|impayés|credit|credits|unpaid)\b/.test(q)) {
    const unpaid = credits.filter((credit) => credit.totalAmountFC > credit.paidAmountFC);
    const total = unpaid.reduce((sum, credit) => sum + credit.totalAmountFC - credit.paidAmountFC, 0);
    return unpaid.length
      ? `## Crédits à recouvrer\n\n**Total restant : ${fmt(total)}**\n\n${unpaid.map((credit) => `- **${credit.customerName}** : ${fmt(Math.max(0, credit.totalAmountFC - credit.paidAmountFC))} (échéance : ${credit.dueDate})`).join('\n')}`
      : 'Aucun crédit impayé n’est enregistré dans la boutique.';
  }
  if (/\b(stock|inventaire|inventory)\b/.test(q) && products.length > 0 && !/\b(vente|ventes|bilan|sales|revenue)\b/.test(q)) {
    return `## État du stock\n\n${products.map((product) => `- **${product.name}** : ${product.stock} ${product.unit} (seuil d’alerte : ${product.minStockAlert})`).join('\n')}`;
  }

  const asksBusinessMetrics = /\b(bilan|analyse|chiffre|ventes?|marge|bénéfice|profit|revenu|stock|crédit|charge|dépense|report|sales|revenue|margin|profit|inventory|credit|expense|report)\b/.test(q);
  if (!asksBusinessMetrics) {
    return (
      `**Mode local :** le service IA en ligne est indisponible. Je peux toujours calculer les indicateurs enregistrés et expliquer les fonctions de ShopFlow, mais je ne peux pas garantir une réponse générale à cette question sans connexion.\n\n` +
      `Vous pouvez demander un bilan des ventes, un état du stock, les crédits en cours ou une aide sur la caisse.`
    );
  }

  // Local financial analysis based only on saved records.
  const lowStock = products.filter((p) => p.stock <= p.minStockAlert);
  const unpaidTotal = credits.reduce(
    (s, c) => s + Math.max(0, c.totalAmountFC - c.paidAmountFC),
    0
  );

  return (
    `## Bilan Analytique Complet — **${settings.shopName}**\n\n` +
    `Voici un résumé des enregistrements présents sur cet appareil :\n\n` +
    `$$\n\\text{Bénéfice Net Réel} = ${fmt(totalCA)} - ${fmt(totalCost)} - ${fmt(totalExp)} = ${fmt(netProfit)}\n$$\n\n` +
    `| Indicateur Financier | Montant | Part du CA |\n` +
    `| --- | --- | --- |\n` +
    `| **Chiffre d’Affaires (CA)** | **${fmt(totalCA)}** | **100 %** |\n` +
    `| **Marge Brute Commerciale** | **${fmt(grossMargin)}** | **${marginPct} %** |\n` +
    `| **Charges & Dépenses enregistrées** | **-${fmt(totalExp)}** | **${totalCA > 0 ? ((totalExp / totalCA) * 100).toFixed(1) : '0.0'} %** |\n` +
    `| **Résultat après dépenses enregistrées** | **${fmt(netProfit)}** | **${netPct} %** |\n\n` +
    `### Actions prioritaires recommandées\n` +
    (lowStock.length > 0
      ? `- **Réapprovisionnement urgent (${lowStock.length} articles bas) :** ${lowStock
          .map((p) => `**${p.name}** (${p.stock} restants)`)
          .join(', ')}.\n`
      : `- **Stock sain :** Aucun produit n’est sous le seuil critique.\n`) +
    `- **Recouvrement crédits clients :** **${fmt(unpaidTotal)}** restent à encaisser dans le cahier de crédits WhatsApp.`
  );
}
