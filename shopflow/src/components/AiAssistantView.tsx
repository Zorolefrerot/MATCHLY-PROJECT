import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  Mic,
  MicOff,
  Send,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  CreditEntry,
  ExpenseEntry,
  Product,
  SaleRecord,
  ShopSettings,
} from '../types';
import { formatMoney } from '../utils/currency';

interface AiAssistantViewProps {
  settings: ShopSettings;
  products: Product[];
  sales: SaleRecord[];
  expenses: ExpenseEntry[];
  credits: CreditEntry[];
  onExecuteAiSale: (product: Product, quantity: number) => void;
  onExecuteAiExpense: (label: string, amountFC: number) => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  actionBadge?: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  "Combien j'ai vendu et gagné aujourd'hui ?",
  'Vendu 2 sacs de riz et 1 huile',
  'Que racheter avec 250 $ au dépôt demain ?',
  'Quel produit me rapporte le plus ?',
  "Qui me doit de l'argent à crédit ?",
];

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  settings,
  products,
  sales,
  expenses,
  credits,
  onExecuteAiSale,
  onExecuteAiExpense,
}) => {
  const fmt = (val: number) =>
    formatMoney(val, settings.currency, settings.usdRateFC);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-ai',
      sender: 'ai',
      text:
        `Bonjour ${settings.ownerName} 👋 ! Je suis l’IA **ShopFlow Coach** de *${settings.shopName}*.\n\n` +
        `Vous pouvez :\n` +
        `• Me poser vos questions (*« Combien j’ai vendu aujourd’hui ? »*, *« Quel est mon bénéfice ? »*)\n` +
        `• Enregistrer une vente par simple phrase ou au micro (*« Vendu 2 sacs de riz et 1 huile »*)\n` +
        `• Me demander quoi racheter au dépôt selon votre budget !`,
      timestamp: 'En direct',
    },
  ]);

  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const nowTime = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(
      d.getMinutes()
    ).padStart(2, '0')}`;
  };

  const generateSmartResponse = (rawText: string): { reply: string; badge?: string } => {
    const q = rawText.toLowerCase().trim();

    const totalCA = sales.reduce((a, s) => a + s.totalRevenueFC, 0);
    const totalCost = sales.reduce((a, s) => a + s.totalCostFC, 0);
    const totalExp = expenses.reduce((a, e) => a + e.amountFC, 0);
    const netProfit = totalCA - totalCost - totalExp;
    const totalUnits = sales.reduce((a, s) => a + s.quantity, 0);

    // 1. Check if merchant is dictating a SALE command ("vendu 2 riz et 1 huile", "j'ai vendu...", "vente...")
    if (/(vendu|vendre|encaisse|acheté par client)/i.test(q)) {
      const matchedItems: { product: Product; qty: number }[] = [];

      // Split segments by "et", ",", "+"
      const parts = q.split(/\s+(?:et|\+|avec)\s+|,/);
      for (const part of parts) {
        const qtyMatch = part.match(/(\d+)/);
        const qty = qtyMatch ? Math.max(1, parseInt(qtyMatch[1], 10)) : 1;

        const foundProduct = products.find((prod) => {
          const keywords = prod.name
            .toLowerCase()
            .split(/\s+/)
            .filter((w) => w.length >= 3 && !['sac', 'pack', 'lot', 'par'].includes(w));
          return keywords.some((kw) => part.includes(kw));
        });

        if (foundProduct && foundProduct.stock >= qty) {
          matchedItems.push({ product: foundProduct, qty });
        }
      }

      if (matchedItems.length > 0) {
        let addedCA = 0;
        let addedProfit = 0;
        const lines: string[] = [];

        for (const item of matchedItems) {
          onExecuteAiSale(item.product, item.qty);
          const itemCA = item.product.sellingPriceFC * item.qty;
          const itemGain =
            (item.product.sellingPriceFC - item.product.purchasePriceFC) *
            item.qty;
          addedCA += itemCA;
          addedProfit += itemGain;
          lines.push(
            `• **${item.qty}× ${item.product.name}** → CA : ${fmt(itemCA)} (Gain : +${fmt(itemGain)})`
          );
        }

        return {
          badge: `✅ ${matchedItems.length} vente(s) enregistrée(s) automatiquement`,
          reply:
            `C’est noté et enregistré dans votre caisse ! 🎉\n\n` +
            `${lines.join('\n')}\n\n` +
            `• **CA ajouté :** +${fmt(addedCA)}\n` +
            `• **Revenu net gagné :** +${fmt(addedProfit)}\n` +
            `• **Nouveau Revenu Net du jour :** **${fmt(netProfit + addedProfit)}**\n` +
            `Le stock a été mis à jour automatiquement.`,
        };
      }
    }

    // 2. Check if merchant dictates an EXPENSE ("dépense transport 5000", "payé moto 8000")
    if (/(dépense|depense|transport|moto|courant|sachet)/i.test(q) && /\d+/.test(q)) {
      const numMatch = q.match(/(\d+(?:[.,]\d+)?)/);
      const rawVal = numMatch ? parseFloat(numMatch[1].replace(',', '.')) : 0;
      if (rawVal > 0) {
        const amountFC =
          settings.currency === 'USD' || q.includes('$')
            ? Math.round(rawVal * settings.usdRateFC)
            : Math.round(rawVal);
        onExecuteAiExpense(`Dépense vocale (${rawText})`, amountFC);
        return {
          badge: `🧾 Dépense déduite (${fmt(amountFC)})`,
          reply:
            `J’ai enregistré la dépense de **${fmt(amountFC)}** dans vos charges du jour.\n` +
            `Votre **Revenu Net Réel** mis à jour est maintenant de **${fmt(netProfit - amountFC)}**.`,
        };
      }
    }

    // 3. Restocking / Budget Advice ("racheter", "dépôt", "approvisionner", "budget")
    if (/(racheter|dépôt|depot|approvision|stock|acheter quoi|conseil)/i.test(q)) {
      const budgetMatch = q.match(/(\d+)\s*(\$|usd|dollars?|fc)?/i);
      let budgetFC = 250 * settings.usdRateFC;
      if (budgetMatch) {
        const num = parseInt(budgetMatch[1], 10);
        const unitStr = (budgetMatch[2] || '').toLowerCase();
        if (unitStr.includes('$') || unitStr.includes('usd') || num <= 2000) {
          budgetFC = num * settings.usdRateFC;
        } else {
          budgetFC = num;
        }
      }

      // Prioritize low-stock + high-margin items
      const ranked = [...products].sort((a, b) => {
        const aUrgency = a.stock <= a.minStockAlert ? 1 : 0;
        const bUrgency = b.stock <= b.minStockAlert ? 1 : 0;
        if (aUrgency !== bUrgency) return bUrgency - aUrgency;
        return (
          b.sellingPriceFC -
          b.purchasePriceFC -
          (a.sellingPriceFC - a.purchasePriceFC)
        );
      });

      let remaining = budgetFC;
      let expectedGain = 0;
      const planLines: string[] = [];

      for (const prod of ranked.slice(0, 4)) {
        const targetQty = Math.min(
          8,
          Math.floor(remaining / Math.max(1, prod.purchasePriceFC))
        );
        if (targetQty > 0) {
          const cost = targetQty * prod.purchasePriceFC;
          const gain =
            targetQty * (prod.sellingPriceFC - prod.purchasePriceFC);
          remaining -= cost;
          expectedGain += gain;
          planLines.push(
            `• **${targetQty} ${prod.unit}s de ${prod.name}** (Coût : ${fmt(cost)} → Gain futur : +${fmt(gain)})`
          );
        }
      }

      return {
        badge: '📦 Plan d’achat optimisé par IA',
        reply:
          `Avec un budget de **${fmt(budgetFC)}** pour le dépôt, voici la commande la plus rentable (priorité aux stocks bas et fortes marges) :\n\n` +
          `${planLines.join('\n')}\n\n` +
          `💰 **Total investi :** ${fmt(budgetFC - remaining)}\n` +
          `🚀 **Bénéfice net attendu à la revente :** **+${fmt(expectedGain)}** !`,
      };
    }

    // 4. Customer Credits / Debts ("crédit", "dette", "doit", "bon")
    if (/(crédit|credit|dette|doit|bon|client)/i.test(q)) {
      const unpaid = credits.filter((c) => c.totalAmountFC > c.paidAmountFC);
      const totalDebt = unpaid.reduce(
        (s, c) => s + (c.totalAmountFC - c.paidAmountFC),
        0
      );
      const list = unpaid
        .map(
          (c) =>
            `• **${c.customerName}** : reste **${fmt(
              c.totalAmountFC - c.paidAmountFC
            )}** (échéance : ${c.dueDate})`
        )
        .join('\n');

      return {
        reply:
          `Actuellement, **${unpaid.length} clients** vous doivent un total de **${fmt(totalDebt)}** :\n\n` +
          `${list || 'Aucun crédit impayé !'}\n\n` +
          `💡 Conseil IA : Relancez d’abord les échéances proches via le bouton *Rappel WhatsApp* dans l’onglet Crédits.`,
      };
    }

    // 5. Most profitable products ("meilleur", "rapporte", "produit", "rentable")
    if (/(meilleur|rapporte|plus rentable|top produit)/i.test(q)) {
      const productProfits = products
        .map((p) => {
          const sold = sales
            .filter((s) => s.productId === p.id)
            .reduce((sum, s) => sum + s.quantity, 0);
          return {
            name: p.name,
            sold,
            profitToday: (p.sellingPriceFC - p.purchasePriceFC) * sold,
            unitMargin: p.sellingPriceFC - p.purchasePriceFC,
          };
        })
        .sort((a, b) => b.profitToday - a.profitToday);

      const top3 = productProfits
        .slice(0, 3)
        .map(
          (item, i) =>
            `${i + 1}. **${item.name}** : ${item.sold} vendus aujourd’hui → **+${fmt(item.profitToday)}** de revenu`
        )
        .join('\n');

      return {
        reply:
          `Voici vos **3 marchandises championnes** aujourd’hui :\n\n` +
          `${top3}\n\n` +
          `Assurez-vous de ne jamais tomber en rupture sur ces articles !`,
      };
    }

    // Default / Today's sales & profit summary ("combien j'ai vendu aujourd'hui", etc.)
    const lowStockNames = products
      .filter((p) => p.stock <= p.minStockAlert)
      .map((p) => p.name);

    return {
      reply:
        `Voici votre bilan exact à cet instant (${nowTime()}) 📊 :\n\n` +
        `• **Articles vendus :** ${totalUnits} unités (${sales.length} ventes)\n` +
        `• **Chiffre d’Affaires (CA) :** **${fmt(totalCA)}**\n` +
        `• **Coût d’achat des articles vendus :** ${fmt(totalCost)} *(à garder pour le stock)*\n` +
        `• **Dépenses de la journée :** − ${fmt(totalExp)}\n` +
        `• ✅ **VOTRE REVENU NET RÉEL :** **+${fmt(netProfit)}**\n\n` +
        (lowStockNames.length > 0
          ? `⚠️ Attention : stock bas sur *${lowStockNames.join(', ')}*.`
          : `✅ Tous vos stocks sont à bon niveau.`),
    };
  };

  const handleSend = (customPrompt?: string) => {
    const textToSend = (customPrompt ?? input).trim();
    if (!textToSend) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: nowTime(),
    };

    const { reply, badge } = generateSmartResponse(textToSend);

    const aiMsg: ChatMessage = {
      id: `a-${Date.now() + 1}`,
      sender: 'ai',
      text: reply,
      actionBadge: badge,
      timestamp: nowTime(),
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    if (!customPrompt) setInput('');
  };

  const toggleVoiceInput = () => {
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown })
        .webkitSpeechRecognition;

    if (!SpeechRec) {
      // Graceful fallback simulation when browser has no SpeechRecognition API
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        handleSend("Combien j'ai vendu et gagné aujourd'hui ?");
      }, 900);
      return;
    }

    try {
      const recognition = new SpeechRec() as {
        lang: string;
        interimResults: boolean;
        onresult: (event: { results: { transcript: string }[][] }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
      };
      recognition.lang = 'fr-FR';
      recognition.interimResults = false;
      setIsListening(true);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        handleSend(transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Render simple markdown bold **text** cleanly
  const renderFormattedText = (text: string) =>
    text.split('\n').map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={i} className={line === '' ? 'h-2' : 'leading-relaxed'}>
          {parts.map((part, idx) =>
            part.startsWith('**') && part.endsWith('**') ? (
              <strong key={idx} className="font-extrabold">
                {part.slice(2, -2)}
              </strong>
            ) : (
              <span key={idx}>{part}</span>
            )
          )}
        </p>
      );
    });

  return (
    <div className="mx-auto flex h-[calc(100vh-150px)] max-h-[760px] min-h-[540px] max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-emerald-700 to-teal-700 px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-xs">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold @md:text-base">
                ShopFlow IA — Coach & Caisse Vocale
              </h1>
              <span className="rounded-full bg-emerald-400/25 px-2 py-0.5 text-[10px] font-extrabold text-emerald-100">
                PRO IA
              </span>
            </div>
            <p className="text-xs text-emerald-100">
              Connecté en direct à votre stock, vos ventes et vos crédits
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold @md:flex">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-300" />
          <span>Calcul & Saisie auto</span>
        </div>
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/70 p-4 @md:p-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs shadow-2xs @md:max-w-[75%] @md:text-sm ${
                msg.sender === 'user'
                  ? 'rounded-br-sm bg-emerald-600 text-white'
                  : 'rounded-bl-sm border border-slate-200 bg-white text-slate-800'
              }`}
            >
              {msg.actionBadge && (
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-800 ring-1 ring-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{msg.actionBadge}</span>
                </div>
              )}

              <div className="space-y-0.5">{renderFormattedText(msg.text)}</div>

              <div
                className={`mt-1.5 text-right text-[10px] ${
                  msg.sender === 'user' ? 'text-emerald-100' : 'text-slate-400'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick 1-Tap Suggestion Chips */}
      <div className="border-t border-slate-100 bg-white px-4 pt-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
          <span>Questions & commandes rapides à tester en 1 clic :</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSend(prompt)}
              className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-100"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar + Voice Microphone */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 border-t border-slate-100 bg-white p-3 @md:p-4"
      >
        <button
          type="button"
          onClick={toggleVoiceInput}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition ${
            isListening
              ? 'animate-pulse bg-red-500 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
          }`}
          title="Dicter au micro"
        >
          {isListening ? (
            <MicOff className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Posez une question ou tapez ex: « Vendu 2 riz et 1 huile »..."
          className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-hidden @md:text-sm"
        />

        <button
          type="submit"
          className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700"
        >
          <Send className="h-4 w-4" />
          <span className="hidden @sm:inline">Envoyer</span>
        </button>
      </form>
    </div>
  );
};
