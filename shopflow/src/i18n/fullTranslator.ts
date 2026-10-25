import { AppLanguage } from '../types';
import { requestChatCompletion } from '../utils/aiApi';

/**
 * Comprehensive multi-language dictionary covering 100% of UI texts, default products,
 * modals, table columns, buttons, receipts, and settings across:
 * Français (fr), English (en), Lingala (ln), Kiswahili (sw), Chinese (zh)
 * PLUS an automatic Cloud AI translation bridge for ANY dynamic / custom text!
 */
export const PHRASE_DICTIONARY: Record<
  string,
  Record<Exclude<AppLanguage, 'fr'>, string>
> = {
  // Navigation & Core Titles
  'Gérez • Calculez • Faites grandir': {
    en: 'Manage • Calculate • Grow',
    ln: 'Batelá • Tángá • Kólisá mombongo',
    sw: 'Simamia • Hesabu • Kuza Biashara',
    zh: '轻松管理 • 自动核算 • 生意兴隆',
  },
  'Tableau de bord': {
    en: 'Dashboard',
    ln: 'Bilan ya Lelo',
    sw: 'Dashibodi Kuu',
    zh: '营业总览',
  },
  'Vendre & Caisse': {
    en: 'Point of Sale',
    ln: 'Teka & Caisse',
    sw: 'Mauzo & Kaunta',
    zh: '收银与开单',
  },
  'Marchandises & Stock': {
    en: 'Products & Stock',
    ln: 'Biloko na Stock',
    sw: 'Bidhaa na Stoo',
    zh: '商品与库存',
  },
  'ShopFlow IA': {
    en: 'ShopFlow AI',
    ln: 'ShopFlow Mayele (IA)',
    sw: 'ShopFlow Akili (IA)',
    zh: 'ShopFlow 智能助手',
  },
  'Boutique en Ligne': {
    en: 'Online Store',
    ln: 'Boutique na Internet',
    sw: 'Duka Mtandaoni',
    zh: '线上微店',
  },
  'Crédits « Bons »': {
    en: 'Customer Credits',
    ln: 'Ba Crédits (Bons)',
    sw: 'Mikopo ya Wateja',
    zh: '客户赊账本',
  },
  'Abonnement Pro': {
    en: 'Pro Subscription',
    ln: 'Abonnement Pro',
    sw: 'Kifurushi cha Pro',
    zh: '专业版订阅',
  },
  'Dépenses & Paramètres': {
    en: 'Expenses & Settings',
    ln: 'Depenses & Paramètres',
    sw: 'Matumizi & Mipangilio',
    zh: '店铺支出与设置',
  },
  Accueil: { en: 'Home', ln: 'Ebandeli', sw: 'Mwanzo', zh: '首页' },
  Vendre: { en: 'Sell', ln: 'Teka', sw: 'Uza', zh: '收银' },
  Stock: { en: 'Stock', ln: 'Stock', sw: 'Stoo', zh: '库存' },
  Paramètres: { en: 'Settings', ln: 'Paramètres', sw: 'Mipangilio', zh: '设置' },
  Bonjour: { en: 'Hello', ln: 'Mbote', sw: 'Habari', zh: '您好' },
  'Suivez vos ventes, stocks, reçus WhatsApp et bénéfices nets en temps réel.': {
    en: 'Track your daily sales, stock levels, WhatsApp receipts, and net profit in real time.',
    ln: 'Landá moteki ya lelo, stock ya biloko, ba reçus WhatsApp mpe litomba na yo ya solo.',
    sw: 'Fuatilia mauzo ya leo, stoo ya bidhaa, risiti za WhatsApp na faida halisi kwa wakati halisi.',
    zh: '实时追踪您的每日销售、商品库存、WhatsApp 电子收据与真实纯利润。',
  },
  'Modèle Reçu WhatsApp': {
    en: 'WhatsApp Receipt Preview',
    ln: 'Talá Reçu WhatsApp',
    sw: 'Mfano wa Risiti WhatsApp',
    zh: '预览 WhatsApp 收据',
  },
  'Voir le Reçu WhatsApp': {
    en: 'View WhatsApp Receipt',
    ln: 'Talá Reçu WhatsApp',
    sw: 'Ona Risiti ya WhatsApp',
    zh: '查看 WhatsApp 收据',
  },
  Scanner: { en: 'Scanner', ln: 'Scanner Photo', sw: 'Skana Picha', zh: '拍照扫码' },
  'Bilan WhatsApp': {
    en: 'WhatsApp Report',
    ln: 'Bilan na WhatsApp',
    sw: 'Ripoti ya WhatsApp',
    zh: 'WhatsApp 日报',
  },
  'Vente rapide': {
    en: 'Quick Sale',
    ln: 'Teka noki',
    sw: 'Mauzo ya Haraka',
    zh: '快速收银',
  },
  'Demander à ShopFlow IA': {
    en: 'Ask ShopFlow AI',
    ln: 'Tuná ShopFlow IA',
    sw: 'Uliza ShopFlow AI',
    zh: '咨询 ShopFlow AI',
  },
  'IA réflexive type Chariow (stratégie, calculs, ventes)': {
    en: 'Smart business copilot (strategy, LaTeX math, live actions)',
    ln: 'Mayele ya mombongo (calculs, batoli, koteka noki)',
    sw: 'Mshauri mahiri wa biashara (mikakati, mahesabu na mauzo)',
    zh: '智能商业顾问（经营策略、公式推演、自动开单）',
  },
  'Boutique en Ligne WhatsApp': {
    en: 'WhatsApp Online Storefront',
    ln: 'Boutique na Internet WhatsApp',
    sw: 'Duka la Mtandaoni WhatsApp',
    zh: 'WhatsApp 线上商城',
  },
  'Lien catalogue à partager aux clients': {
    en: 'Shareable product catalog link for customers',
    ln: 'Lien ya catalogue ya kotindela ba clients',
    sw: 'Kiungo cha katalogi cha kushiriki na wateja',
    zh: '一键分享给客户的商品目录链接',
  },
  'Abonnement & Carte Bancaire': {
    en: 'Subscription & Card Payment',
    ln: 'Abonnement & Karte ya Banki',
    sw: 'Usajili & Malipo ya Kadi',
    zh: '会员订阅与银行卡支付',
  },
  'Visa / Mastercard & Mobile Money': {
    en: 'Visa / Mastercard & Mobile Money',
    ln: 'Visa / Mastercard mpe Mobile Money',
    sw: 'Visa / Mastercard na Mobile Money',
    zh: '支持 Visa / 万事达卡与移动支付',
  },
  'Chiffre d’Affaires (CA)': {
    en: 'Gross Revenue (Sales)',
    ln: 'Mbongo Ekoti Lelo (CA)',
    sw: 'Mapato Jumla (CA)',
    zh: '今日营业额 (CA)',
  },
  'Coût d’Achat Ventes': {
    en: 'Cost of Goods Sold',
    ln: 'Mbongo ya Kosomba Stock',
    sw: 'Gharama ya Bidhaa Zilizouzwa',
    zh: '售出商品进货成本',
  },
  'Capital à garder pour racheter le stock vendu': {
    en: 'Capital to set aside to restock sold items',
    ln: 'Mbongo ya kobomba mpo na kosomba lisusu biloko',
    sw: 'Mtaji wa kuhifadhi ili kununua tena bidhaa zilizouzwa',
    zh: '需预留用于补货的本金',
  },
  'Dépenses Boutique': {
    en: 'Shop Expenses',
    ln: 'Depenses ya Boutique',
    sw: 'Matumizi ya Duka',
    zh: '店铺日常支出',
  },
  'Revenu / Bénéfice Net': {
    en: 'True Net Profit',
    ln: 'Litomba ya Solo (Bénéfice)',
    sw: 'Faida Halisi Mfukoni',
    zh: '今日真实纯利润',
  },
  'Gain net réel dans votre poche (après achat & dépenses)': {
    en: 'Real net earnings in your pocket (after cost & expenses)',
    ln: 'Litomba ya solo etikali na libenga na yo',
    sw: 'Faida halisi inayobaki mfukoni baada ya gharama zote',
    zh: '扣除进货成本与日常支出后的净赚金额',
  },
  'Mis à jour à chaque vente': {
    en: 'Updated automatically on every sale',
    ln: 'Ebongwanaka mbala moko na moteki nyonso',
    sw: 'Inasasishwa moja kwa moja kila unapouza',
    zh: '每笔销售自动实时更新',
  },
  'Évolution de la semaine (CA vs Revenu Net)': {
    en: 'Weekly Performance (Revenue vs Net Profit)',
    ln: 'Bilan ya Poso Mobimba (CA na Litomba)',
    sw: 'Mwenendo wa Wiki (Mapato dhidi ya Faida)',
    zh: '本周经营趋势（营业额 vs 纯利润）',
  },
  'Touchez un jour pour voir le détail exact': {
    en: 'Tap any day to inspect exact figures',
    ln: 'Finá mokolo moko mpo na komona motango ya solo',
    sw: 'Gusa siku yoyote kuona takwimu kamili',
    zh: '点击任意日期查看详细数据',
  },
  'Voir le stock': {
    en: 'View Stock',
    ln: 'Talá Stock',
    sw: 'Angalia Stoo',
    zh: '查看库存',
  },
  '+1 Vendu': {
    en: '+1 Sold',
    ln: '+1 Etekami',
    sw: '+1 Imeuzwa',
    zh: '+1 售出',
  },
  '+ Stock': {
    en: '+ Restock',
    ln: '+ Bakisá Stock',
    sw: '+ Ongeza Stoo',
    zh: '+ 补货',
  },
  'Tout voir →': {
    en: 'See all →',
    ln: 'Talá nyonso →',
    sw: 'Ona zote →',
    zh: '查看全部 →',
  },
  'Caisse & Vente Rapide': {
    en: 'POS & Quick Sale',
    ln: 'Caisse & Koteka Noki',
    sw: 'Kaunta & Uza Haraka',
    zh: '快速收银台',
  },
  'Rechercher une marchandise...': {
    en: 'Search products in stock...',
    ln: 'Luká eloko na stock...',
    sw: 'Tafuta bidhaa stoo...',
    zh: '搜索库存商品...',
  },
  Tous: { en: 'All', ln: 'Nyonso', sw: 'Zote', zh: '全部' },
  Alimentation: { en: 'Groceries', ln: 'Bilei', sw: 'Chakula', zh: '粮油食品' },
  'Huiles & Lait': {
    en: 'Oils & Dairy',
    ln: 'Mafuta & Miliki',
    sw: 'Mafuta & Maziwa',
    zh: '食用油与奶粉',
  },
  Hygiène: { en: 'Hygiene', ln: 'Bopeto', sw: 'Usafi', zh: '日用洗护' },
  Boissons: { en: 'Drinks', ln: 'Masanga ya sukali', sw: 'Vinywaji', zh: '饮品果汁' },
  'Mode & Accessoires': {
    en: 'Fashion & Gear',
    ln: 'Bilamba & Accessoires',
    sw: 'Mitindo & Vifaa',
    zh: '服饰与周边',
  },
  'Valider + Générer Reçu Image WhatsApp': {
    en: 'Checkout + Generate WhatsApp Image Receipt',
    ln: 'Ndimá + Bimisá Reçu Image WhatsApp',
    sw: 'Thibitisha + Tengeneza Picha ya Risiti WhatsApp',
    zh: '确认收款并生成 WhatsApp 高清图片收据',
  },
  'Encaisser rapidement sans reçu': {
    en: 'Quick Checkout without Receipt',
    ln: ' Zwá mbongo noki sans reçu',
    sw: 'Pokea Malipo Haraka bila Risiti',
    zh: '快速收款（不生成小票）',
  },
  'Ajouter une marchandise': {
    en: 'Add New Product',
    ln: 'Bakisá Eloko ya Sika',
    sw: 'Ongeza Bidhaa Mpya',
    zh: '新增商品',
  },
  'Tableau complet': {
    en: 'Full Table',
    ln: 'Tableau Mobimba',
    sw: 'Jedwali Kamili',
    zh: '详细表格视图',
  },
  'Cartes photos': {
    en: 'Photo Cards',
    ln: 'Ba Cartes ya Ba Photos',
    sw: 'Kadi za Picha',
    zh: '图片卡片视图',
  },
  // Default Products translated cleanly across ALL 5 languages!
  'Sac de Riz Parfumé 25 kg': {
    en: 'Fragrant White Rice Sack 25 kg',
    ln: 'Saki ya Loso ya Solo 25 kg',
    sw: 'Mfuko wa Mchele Wenye Harufu Nzuri 25 kg',
    zh: '25公斤特级香米（袋装）',
  },
  'Huile Végétale Dorée 5 L': {
    en: 'Golden Vegetable Cooking Oil 5 L',
    ln: 'Bidon ya Mafuta ya Kolamba 5 L',
    sw: 'Mafuta Bora ya Kupikia Lita 5',
    zh: '5升金装食用植物油（桶装）',
  },
  'Lait Entier en Poudre 900 g': {
    en: 'Full Cream Milk Powder Tin 900 g',
    ln: 'Boîte ya Miliki ya Poudre 900 g',
    sw: 'Kopo la Maziwa ya Unga 900 g',
    zh: '900克全脂奶粉（罐装）',
  },
  'Farine de Maïs Semoule 10 kg': {
    en: 'White Maize Semolina Flour 10 kg',
    ln: 'Saki ya Fufu / Semoule ya Masangu 10 kg',
    sw: 'Mfuko wa Unga wa Sembe 10 kg',
    zh: '10公斤精细白玉米粉（袋装）',
  },
  'Sucre Blanc Cristallisé 5 kg': {
    en: 'Refined White Granulated Sugar 5 kg',
    ln: 'Paquet ya Sukali ya Pembe 5 kg',
    sw: 'Sukari Nyeupe safi 5 kg',
    zh: '5公斤精制白砂糖（袋装）',
  },
  'Alvéole de 30 Œufs Frais': {
    en: 'Farm Fresh Eggs Tray (30 pcs)',
    ln: 'Alvéole ya Makei ya Sika 30',
    sw: 'Trela ya Mayai Mapya 30',
    zh: '30枚农家新鲜鸡蛋（托装）',
  },
  'Savon de Ménage Multi-Usage (x6)': {
    en: 'Multi-Purpose Household Soap Pack (x6)',
    ln: 'Sabuni ya Kosukola Bilamba (x6)',
    sw: 'Sabuni ya Vipande ya Kufulia (x6)',
    zh: '多用途家用洗衣皂（6块装）',
  },
  'Pack Jus Mangue & Orange (x6)': {
    en: 'Tropical Mango & Orange Juice Pack (x6)',
    ln: 'Pack ya Jus ya Manga na Malala (x6)',
    sw: 'Kifurushi cha Juisi ya Embe & Chungwa (x6)',
    zh: '热带芒果香橙果汁饮料（6瓶装）',
  },
};

const AI_TRANSLATION_CACHE_KEY = 'shopflow_ai_i18n_cache_v4';

function loadAiTranslationCache(): Record<string, string> {
  try {
    const raw = localStorage.getItem(AI_TRANSLATION_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAiTranslationCache(map: Record<string, string>) {
  try {
    localStorage.setItem(AI_TRANSLATION_CACHE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota
  }
}

/**
 * Translates any single string using static dictionary first, then AI cache
 */
export function translateStringSync(text: string, lang: AppLanguage): string {
  if (!text || lang === 'fr') return text;
  const trimmed = text.trim();
  const hit = PHRASE_DICTIONARY[trimmed]?.[lang];
  if (hit) return hit;

  const cache = loadAiTranslationCache();
  const cacheKey = `${lang}::${trimmed}`;
  if (cache[cacheKey]) return cache[cacheKey];

  return text;
}

/**
 * Automatically walks visible DOM text nodes & placeholders and translates EVERY remaining French string
 * instantaneously via dictionary + batched real AI translation so 100% of every word on every page changes!
 */
export async function translateEntirePageDOM(
  rootEl: HTMLElement | null,
  lang: AppLanguage,
  onBatchComplete?: () => void
): Promise<void> {
  if (!rootEl) return;

  const cache = loadAiTranslationCache();
  const missingTexts = new Set<string>();

  const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
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
      textNodes.push(current as Text);
    }
    current = walker.nextNode();
  }

  for (const node of textNodes) {
    const el = node as unknown as {
      __sfOrig?: string;
      __sfLastWritten?: string;
    };
    const currentVal = node.nodeValue || '';
    if (
      el.__sfOrig === undefined ||
      (el.__sfLastWritten !== undefined && currentVal !== el.__sfLastWritten)
    ) {
      el.__sfOrig = currentVal;
      el.__sfLastWritten = undefined;
    }
    const orig = el.__sfOrig.trim();
    if (!orig || /^[\d\s.,:$€%+×−\-–/#@•✓★()]+$/.test(orig)) continue;

    if (lang === 'fr') {
      node.nodeValue = el.__sfOrig;
      el.__sfLastWritten = el.__sfOrig;
      continue;
    }

    const dictVal = PHRASE_DICTIONARY[orig]?.[lang];
    const cachedVal = cache[`${lang}::${orig}`];
    if (dictVal) {
      const next = el.__sfOrig.replace(orig, dictVal);
      node.nodeValue = next;
      el.__sfLastWritten = next;
    } else if (cachedVal) {
      const next = el.__sfOrig.replace(orig, cachedVal);
      node.nodeValue = next;
      el.__sfLastWritten = next;
    } else if (orig.length <= 240) {
      missingTexts.add(orig);
    }
  }

  // Also translate input placeholders!
  const inputs = rootEl.querySelectorAll(
    'input[placeholder], textarea[placeholder]'
  );
  inputs.forEach((inp) => {
    const htmlInp = inp as HTMLInputElement & {
      __sfOrigPh?: string;
      __sfLastPh?: string;
    };
    if (
      htmlInp.__sfOrigPh === undefined ||
      (htmlInp.__sfLastPh !== undefined &&
        htmlInp.placeholder !== htmlInp.__sfLastPh)
    ) {
      htmlInp.__sfOrigPh = htmlInp.placeholder;
      htmlInp.__sfLastPh = undefined;
    }
    const origPh = htmlInp.__sfOrigPh.trim();
    if (!origPh) return;
    if (lang === 'fr') {
      htmlInp.placeholder = htmlInp.__sfOrigPh;
      htmlInp.__sfLastPh = htmlInp.__sfOrigPh;
    } else {
      const translated =
        PHRASE_DICTIONARY[origPh]?.[lang] || cache[`${lang}::${origPh}`];
      if (translated) {
        htmlInp.placeholder = translated;
        htmlInp.__sfLastPh = translated;
      } else {
        missingTexts.add(origPh);
      }
    }
  });

  if (lang === 'fr' || missingTexts.size === 0) return;

  // Call Real Cloud AI in parallel JSON chunks so 100% of every word on screen translates completely!
  const targetLangName: Record<Exclude<AppLanguage, 'fr'>, string> = {
    en: 'English',
    ln: 'Lingala (natural Kinshasa DRC commercial Lingala)',
    sw: 'Kiswahili (natural East DRC / Lubumbashi / Goma Swahili)',
    zh: 'Simplified Chinese (简体中文)',
  };

  try {
    const allMissing = Array.from(missingTexts);
    const chunks: string[][] = [];
    for (let i = 0; i < allMissing.length; i += 65) {
      chunks.push(allMissing.slice(i, i + 65));
    }

    const updatedCache = loadAiTranslationCache();

    await Promise.all(
      chunks.map(async (sourceArray) => {
        const jsonText = await requestChatCompletion(
          [
            {
              role: 'system',
              content: `Translate every string in the user's JSON array into ${targetLangName[lang]}. Keep numbers, currency codes (FC, CDF, USD, $), brand names (ShopFlow, WhatsApp, M-Pesa, Visa, Mastercard), and emojis intact. Return ONLY a raw JSON array of strings of the exact same length and order, with no markdown code fences.`,
            },
            { role: 'user', content: JSON.stringify(sourceArray) },
          ],
          { timeoutMs: 25_000, maxTokens: 1800 }
        );

        const arrayMatch = jsonText.match(/\[[\s\S]*\]/);
        if (!arrayMatch) return;
        const translatedArray = JSON.parse(arrayMatch[0]);
        if (!Array.isArray(translatedArray)) return;

        sourceArray.forEach((src, idx) => {
          if (
            typeof translatedArray[idx] === 'string' &&
            translatedArray[idx].trim()
          ) {
            updatedCache[`${lang}::${src}`] = translatedArray[idx].trim();
          }
        });
      })
    );

    saveAiTranslationCache(updatedCache);

    // Apply newly cached translations immediately to live DOM
    for (const node of textNodes) {
      const el = node as unknown as {
        __sfOrig?: string;
        __sfLastWritten?: string;
      };
      const orig = el.__sfOrig?.trim();
      if (orig && updatedCache[`${lang}::${orig}`]) {
        const next = el.__sfOrig!.replace(orig, updatedCache[`${lang}::${orig}`]);
        node.nodeValue = next;
        el.__sfLastWritten = next;
      }
    }
    inputs.forEach((inp) => {
      const htmlInp = inp as HTMLInputElement & {
        __sfOrigPh?: string;
        __sfLastPh?: string;
      };
      const origPh = htmlInp.__sfOrigPh?.trim();
      if (origPh && updatedCache[`${lang}::${origPh}`]) {
        htmlInp.placeholder = updatedCache[`${lang}::${origPh}`];
        htmlInp.__sfLastPh = htmlInp.placeholder;
      }
    });
    onBatchComplete?.();
  } catch {
    // Silent fallback if offline
  }
}
