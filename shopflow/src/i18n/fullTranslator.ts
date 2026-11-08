import { AppLanguage } from '../types';

/**
 * Reviewed, on-device phrase translations for application UI.
 * User-entered product and shop data is intentionally never sent to a translator.
 * Add translations here when new interface copy is introduced.
 */
export const PHRASE_DICTIONARY: Record<
  string,
  Record<Exclude<AppLanguage, 'fr'>, string>
> = {
  // Navigation & Core Titles
  'Gérez • Calculez • Faites grandir': {
    en: 'Manage • Calculate • Grow',
    ln: 'Batelá • Tángá • Kólisá mombongo',
  },
  'Tableau de bord': {
    en: 'Dashboard',
    ln: 'Bilan ya Lelo',
  },
  'Vendre & Caisse': {
    en: 'Point of Sale',
    ln: 'Teka & Caisse',
  },
  'Marchandises & Stock': {
    en: 'Products & Stock',
    ln: 'Biloko na Stock',
  },
  'ShopFlow IA': {
    en: 'ShopFlow AI',
    ln: 'ShopFlow Mayele (IA)',
  },
  'Boutique en Ligne': {
    en: 'Online Store',
    ln: 'Boutique na Internet',
  },
  'Crédits « Bons »': {
    en: 'Customer Credits',
    ln: 'Ba Crédits (Bons)',
  },
  'Abonnement Pro': {
    en: 'Pro Subscription',
    ln: 'Abonnement Pro',
  },
  'Dépenses & Paramètres': {
    en: 'Expenses & Settings',
    ln: 'Depenses & Paramètres',
  },
  Accueil: { en: 'Home', ln: 'Ebandeli' },
  Vendre: { en: 'Sell', ln: 'Teka' },
  Stock: { en: 'Stock', ln: 'Stock' },
  Paramètres: { en: 'Settings', ln: 'Paramètres' },
  Bonjour: { en: 'Hello', ln: 'Mbote' },
  'Suivez vos ventes, stocks, reçus WhatsApp et bénéfices nets en temps réel.': {
    en: 'Track your daily sales, stock levels, WhatsApp receipts, and net profit in real time.',
    ln: 'Landá moteki ya lelo, stock ya biloko, ba reçus WhatsApp mpe litomba na yo ya solo.',
  },
  'Modèle Reçu WhatsApp': {
    en: 'WhatsApp Receipt Preview',
    ln: 'Talá Reçu WhatsApp',
  },
  'Voir le Reçu WhatsApp': {
    en: 'View WhatsApp Receipt',
    ln: 'Talá Reçu WhatsApp',
  },
  'Vente rapide': {
    en: 'Quick Sale',
    ln: 'Teka noki',
  },
  'Demander à ShopFlow IA': {
    en: 'Ask ShopFlow AI',
    ln: 'Tuná ShopFlow IA',
  },
  'Boutique en Ligne WhatsApp': {
    en: 'WhatsApp Online Storefront',
    ln: 'Boutique na Internet WhatsApp',
  },
  'Lien catalogue à partager aux clients': {
    en: 'Shareable product catalog link for customers',
    ln: 'Lien ya catalogue ya kotindela ba clients',
  },
  'Assistant IA ShopFlow · réponses en ligne selon connexion et disponibilité.': {
    en: 'ShopFlow AI assistant · online answers depend on connection and availability.',
    ln: 'Assistant IA ShopFlow · biyano ya Internet etali connexion mpe disponibilité.',
  },
  'Abonnement & Formules': {
    en: 'Subscription & Plans',
    ln: 'Abonnement & Ba Formule',
  },
  'Chiffre d’Affaires (CA)': {
    en: 'Gross Revenue (Sales)',
    ln: 'Mbongo Ekoti Lelo (CA)',
  },
  'Coût d’Achat Ventes': {
    en: 'Cost of Goods Sold',
    ln: 'Mbongo ya Kosomba Stock',
  },
  'Capital à garder pour racheter le stock vendu': {
    en: 'Capital to set aside to restock sold items',
    ln: 'Mbongo ya kobomba mpo na kosomba lisusu biloko',
  },
  'Dépenses Boutique': {
    en: 'Shop Expenses',
    ln: 'Depenses ya Boutique',
  },
  'Revenu / Bénéfice Net': {
    en: 'True Net Profit',
    ln: 'Litomba ya Solo (Bénéfice)',
  },
  'Gain net réel dans votre poche (après achat & dépenses)': {
    en: 'Real net earnings in your pocket (after cost & expenses)',
    ln: 'Litomba ya solo etikali na libenga na yo',
  },
  'Mis à jour à chaque vente': {
    en: 'Updated automatically on every sale',
    ln: 'Ebongwanaka mbala moko na moteki nyonso',
  },
  'Évolution de la semaine (CA vs Revenu Net)': {
    en: 'Weekly Performance (Revenue vs Net Profit)',
    ln: 'Bilan ya Poso Mobimba (CA na Litomba)',
  },
  'Touchez un jour pour voir le détail exact': {
    en: 'Tap any day to inspect exact figures',
    ln: 'Finá mokolo moko mpo na komona motango ya solo',
  },
  'Voir le stock': {
    en: 'View Stock',
    ln: 'Talá Stock',
  },
  '+1 Vendu': {
    en: '+1 Sold',
    ln: '+1 Etekami',
  },
  '+ Stock': {
    en: '+ Restock',
    ln: '+ Bakisá Stock',
  },
  'Tout voir →': {
    en: 'See all →',
    ln: 'Talá nyonso →',
  },
  'Caisse & Vente Rapide': {
    en: 'POS & Quick Sale',
    ln: 'Caisse & Koteka Noki',
  },
  'Rechercher une marchandise...': {
    en: 'Search products in stock...',
    ln: 'Luká eloko na stock...',
  },
  Tous: { en: 'All', ln: 'Nyonso' },
  Alimentation: { en: 'Groceries', ln: 'Bilei' },
  'Huiles & Lait': {
    en: 'Oils & Dairy',
    ln: 'Mafuta & Miliki',
  },
  Hygiène: { en: 'Hygiene', ln: 'Bopeto' },
  Boissons: { en: 'Drinks', ln: 'Masanga ya sukali' },
  'Mode & Accessoires': {
    en: 'Fashion & Gear',
    ln: 'Bilamba & Accessoires',
  },
  Bijoux: { en: 'Jewelry', ln: 'Bijoux' },
  Accessoires: { en: 'Accessories', ln: 'Accessoires' },
  Vêtements: { en: 'Clothing', ln: 'Bilamba' },
  Chaussures: { en: 'Shoes', ln: 'Sapato' },
  'E-books': { en: 'E-books', ln: 'Mikanda ya numérique' },
  'Valider + Générer Reçu Image WhatsApp': {
    en: 'Checkout + Generate WhatsApp Image Receipt',
    ln: 'Ndimá + Bimisá Reçu Image WhatsApp',
  },
  'Encaisser rapidement sans reçu': {
    en: 'Quick Checkout without Receipt',
    ln: ' Zwá mbongo noki sans reçu',
  },
  'Ajouter une marchandise': {
    en: 'Add New Product',
    ln: 'Bakisá Eloko ya Sika',
  },
  'Tableau complet': {
    en: 'Full Table',
    ln: 'Tableau Mobimba',
  },
  'Cartes photos': {
    en: 'Photo Cards',
    ln: 'Ba Cartes ya Ba Photos',
  },
  // Sample products, translated across the app languages.
  'Collier doré délicat': {
    en: 'Delicate gold-tone necklace',
    ln: 'Collier ya wolo ya pete',
  },
  'Bracelet perlé': {
    en: 'Beaded bracelet',
    ln: 'Bracelet ya ba perles',
  },
  'Sac à main structuré': {
    en: 'Structured handbag',
    ln: 'Saki ya loboko ya makasi',
  },
  'Lunettes de soleil': {
    en: 'Sunglasses',
    ln: 'Lunettes ya moi',
  },
  'Blouse en coton': {
    en: 'Cotton blouse',
    ln: 'Blouse ya coton',
  },
  'Mocassins classiques': {
    en: 'Classic loafers',
    ln: 'Sapato ya lolenge classique',
  },
  'E-book pratique pour entrepreneurs': {
    en: 'Practical e-book for entrepreneurs',
    ln: 'E-book pona ba entrepreneurs',
  },
  'Panier de fruits et légumes': {
    en: 'Fruit and vegetable basket',
    ln: 'Panier ya mbuma na ndunda',
  },
  'Huile Végétale Dorée 5 L': {
    en: 'Golden Vegetable Cooking Oil 5 L',
    ln: 'Bidon ya Mafuta ya Kolamba 5 L',
  },
  'Lait Entier en Poudre 900 g': {
    en: 'Full Cream Milk Powder Tin 900 g',
    ln: 'Boîte ya Miliki ya Poudre 900 g',
  },
  'Farine de Maïs Semoule 10 kg': {
    en: 'White Maize Semolina Flour 10 kg',
    ln: 'Saki ya Fufu / Semoule ya Masangu 10 kg',
  },
  'Sucre Blanc Cristallisé 5 kg': {
    en: 'Refined White Granulated Sugar 5 kg',
    ln: 'Paquet ya Sukali ya Pembe 5 kg',
  },
  'Alvéole de 30 Œufs Frais': {
    en: 'Farm Fresh Eggs Tray (30 pcs)',
    ln: 'Alvéole ya Makei ya Sika 30',
  },
  'Savon de Ménage Multi-Usage (x6)': {
    en: 'Multi-Purpose Household Soap Pack (x6)',
    ln: 'Sabuni ya Kosukola Bilamba (x6)',
  },
  'Pack Jus Mangue & Orange (x6)': {
    en: 'Tropical Mango & Orange Juice Pack (x6)',
    ln: 'Pack ya Jus ya Manga na Malala (x6)',
  },
  // Settings and subscription copy
  'Formules ShopFlow': { en: 'ShopFlow plans', ln: 'Ba formule ya ShopFlow' },
  'Prix indicatifs en USD · 1 USD = 2 400 FC.': { en: 'Indicative prices in USD · 1 USD = 2,400 FC.', ln: 'Mituya ya ndakisa na USD · 1 USD = 2 400 FC.' },
  'Prix indicatifs en FC · 1 USD = 2 400 FC.': { en: 'Indicative prices in FC · 1 USD = 2,400 FC.', ln: 'Mituya ya ndakisa na FC · 1 USD = 2 400 FC.' },
  'Accès test activé.': { en: 'Test access is enabled.', ln: 'Kokota na komeka efungwami.' },
  'Votre boutique reste accessible sans échéance ni paiement. Aucune formule payante ni aucun paiement réel ne sont activés depuis cet écran.': {
    en: 'Your shop remains accessible with no expiry or payment. No paid plan or real payment can be activated from this screen.',
    ln: 'Boutique na yo ekotikala kofungwama kozanga mokolo ya suka mpe kofuta. Formule ya kofuta to kofuta ya solo ekoki kofungwama te na lokasa oyo.',
  },
  'Période de tarification': { en: 'Billing period', ln: 'Eleko ya kofuta' },
  'Mensuel': { en: 'Monthly', ln: 'Ya sanza na sanza' },
  'Annuel · 2 mois offerts': { en: 'Yearly · 2 months free', ln: 'Ya mbula · sanza 2 ofele' },
  'an': { en: 'year', ln: 'mbula' },
  'mois': { en: 'month', ln: 'sanza' },
  'Équivaut à': { en: 'Equivalent to', ln: 'Ekokani na' },
  'mois · 2 mois offerts': { en: 'per month · 2 months free', ln: 'na sanza · sanza 2 ofele' },
  'Gestion des articles et du stock': { en: 'Item and stock management', ln: 'Koyangela biloko mpe stock' },
  'Ventes et suivi du chiffre d’affaires': { en: 'Sales and revenue tracking', ln: 'Boteki mpe kolanda mbongo ekoti' },
  'Utilisation hors ligne': { en: 'Offline use', ln: 'Kosalela kozanga Internet' },
  'Gestion des articles, ventes et dépenses': { en: 'Manage items, sales and expenses', ln: 'Koyangela biloko, boteki mpe mbongo ebimi' },
  'Assistant IA selon disponibilité': { en: 'AI assistant, subject to availability', ln: 'Assistant ya IA soki ezali' },
  'Catalogue et demandes clients sur WhatsApp': { en: 'Catalog and customer requests on WhatsApp', ln: 'Catalogue mpe masengi ya bakiliya na WhatsApp' },
  'Crédits clients et relances WhatsApp': { en: 'Customer credit and WhatsApp reminders', ln: 'Ba crédit ya bakiliya mpe bokundoli na WhatsApp' },
  'Gestion de plusieurs boutiques': { en: 'Manage multiple shops', ln: 'Koyangela ba boutique ebele' },
  'Données et réglages séparés par boutique': { en: 'Separate data and settings for each shop', ln: 'Ba données mpe paramètres ekeseni mpo na boutique moko na moko' },
  'Boutique active :': { en: 'Active shop:', ln: 'Boutique oyo ezali kosalelama:' },
  'Les montants annuels correspondent à 10 mois payés sur 12 et restent informatifs pendant la phase de test.': {
    en: 'Annual amounts represent 10 paid months out of 12 and remain informational during testing.',
    ln: 'Mituya ya mbula ezali sanza 10 ya kofuta kati na sanza 12; ezali kaka mpo na koyebisa na eleko ya komeka.',
  },
  'Accès de test sans échéance • aucun paiement requis': {
    en: 'Test access with no expiry • no payment required',
    ln: 'Kokota na komeka kozanga mokolo ya suka • kofuta esengeli te',
  },
  'Accès de test sans échéance • aucun paiement requis • aucune donnée locale ne sera effacée': {
    en: 'Test access with no expiry • no payment required • no local data will be erased',
    ln: 'Kokota na komeka kozanga mokolo ya suka • kofuta esengeli te • ba données ya masini ekolongolama te',
  },
  '/ mois': { en: '/ month', ln: '/ sanza' },
  '/ an': { en: '/ year', ln: '/ mbula' },
  '/ mois · 2 mois offerts': { en: '/ month · 2 months free', ln: '/ sanza · sanza 2 ofele' },
  'Accès de test sans échéance · aucun paiement réel': {
    en: 'Test access with no expiry · no real payments',
    ln: 'Kokota na komeka kozanga mokolo ya suka · kofuta ya solo ezali te',
  },
  'Langue de l’application': { en: 'App language', ln: 'Lokota ya application' },
  'Choisissez français, anglais ou lingala. Les traductions de l’interface sont intégrées localement; les noms et textes que vous saisissez restent inchangés.': {
    en: 'Choose French, English or Lingala. Interface translations are built in locally; names and text you enter remain unchanged.',
    ln: 'Poná Lifalansɛ, Lingelesi to Lingala. Bobongoli ya interface ezali na kati ya application; bankombo mpe makomi oyo okomi ebongwanaka te.',
  },
  'Langue choisie : Français': { en: 'Language set to French', ln: 'Lokota: Lifalansɛ' },
  'Langue choisie : English': { en: 'Language set to English', ln: 'Lokota: Lingelesi' },
  'Langue choisie : Lingala (RDC)': { en: 'Language set to Lingala (DRC)', ln: 'Lokota: Lingala (RDC)' },
  'Language set to Français': { en: 'Language set to French', ln: 'Lokota: Lifalansɛ' },
  'Language set to English': { en: 'Language set to English', ln: 'Lokota: Lingelesi' },
  'Language set to Lingala (RDC)': { en: 'Language set to Lingala (DRC)', ln: 'Lokota: Lingala (RDC)' },
};

const LEGACY_AI_TRANSLATION_CACHE_KEY = 'shopflow_ai_i18n_cache_v4';

/** Remove translations previously generated by the retired client-side AI fallback. */
export function clearLegacyAITranslationCache(): void {
  try {
    localStorage.removeItem(LEGACY_AI_TRANSLATION_CACHE_KEY);
  } catch {
    // Storage can be unavailable in private browsing; translation still works locally.
  }
}

/** Returns a reviewed local phrase translation; user-entered data is left unchanged. */
export function translateStringSync(text: string, lang: AppLanguage): string {
  if (!text || lang === 'fr') return text;
  return PHRASE_DICTIONARY[text.trim()]?.[lang] || text;
}

/**
 * Applies the reviewed phrase dictionary to visible text and placeholders.
 * This path is fully local: it never sends UI or user-entered text over the network.
 * Uncatalogued phrases remain in their source language until a reviewed translation is added.
 */
export async function translateDOMWithLocalDictionary(
  rootEl: HTMLElement | null,
  lang: AppLanguage,
  onComplete?: () => void
): Promise<void> {
  if (!rootEl) return;

  const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    const parentTag = current.parentElement?.tagName.toLowerCase();
    const insideKatex = current.parentElement?.closest('.katex');
    if (
      parentTag !== 'script' &&
      parentTag !== 'style' &&
      !insideKatex &&
      current.nodeValue &&
      current.nodeValue.trim().length > 1
    ) {
      const node = current as Text & { __sfOrig?: string; __sfLastWritten?: string };
      const value = node.nodeValue || '';
      if (
        node.__sfOrig === undefined ||
        (node.__sfLastWritten !== undefined && value !== node.__sfLastWritten)
      ) {
        node.__sfOrig = value;
        node.__sfLastWritten = undefined;
      }
      const original = node.__sfOrig;
      const trimmed = original.trim();
      if (lang === 'fr') {
        node.nodeValue = original;
        node.__sfLastWritten = original;
      } else if (trimmed && !/^[\d\s.,:$€%+×−\-–/#@•✓★()]+$/.test(trimmed)) {
        const translated = PHRASE_DICTIONARY[trimmed]?.[lang];
        if (translated) {
          node.nodeValue = original.replace(trimmed, translated);
          node.__sfLastWritten = node.nodeValue;
        } else {
          node.nodeValue = original;
          node.__sfLastWritten = original;
        }
      }
    }
    current = walker.nextNode();
  }

  rootEl.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
    'input[placeholder], textarea[placeholder]'
  ).forEach((input) => {
    const field = input as HTMLInputElement & { __sfOrigPh?: string; __sfLastPh?: string };
    if (field.__sfOrigPh === undefined || (field.__sfLastPh && input.placeholder !== field.__sfLastPh)) {
      field.__sfOrigPh = input.placeholder;
      field.__sfLastPh = undefined;
    }
    const original = field.__sfOrigPh;
    const translated = lang === 'fr' ? original : PHRASE_DICTIONARY[original.trim()]?.[lang];
    input.placeholder = translated || original;
    field.__sfLastPh = input.placeholder;
  });

  onComplete?.();
}
