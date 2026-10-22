import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  Mic,
  MicOff,
  RotateCcw,
  Send,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { LANGUAGE_OPTIONS } from '../i18n/translations';
import {
  CreditEntry,
  ExpenseEntry,
  Product,
  SaleRecord,
  ShopSettings,
} from '../types';
import { formatMoney } from '../utils/currency';

export interface AiStoreAction {
  type: 'sell' | 'add_product' | 'update_price' | 'add_expense';
  productId?: string;
  quantity?: number;
  name?: string;
  category?: Product['category'];
  unit?: string;
  stock?: number;
  purchasePriceFC?: number;
  sellingPriceFC?: number;
  label?: string;
  amountFC?: number;
}

interface AiAssistantViewProps {
  settings: ShopSettings;
  products: Product[];
  sales: SaleRecord[];
  expenses: ExpenseEntry[];
  credits: CreditEntry[];
  onExecuteAiActions: (actions: AiStoreAction[]) => string[];
}

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  executedBadges?: string[];
  timestamp: string;
}

const EXAMPLE_IDEAS = [
  'Analyse mes ventes d’aujourd’hui et dis-moi comment augmenter mon bénéfice demain',
  'Écris-moi un texte pub WhatsApp & TikTok accrocheur pour mes produits en stock',
  'Si je baisse mes prix de 5% pour vendre deux fois plus vite, est-ce rentable ?',
  'Enregistre la vente de 2 sacs de riz et 1 bidon d’huile',
  'Avec 300 $ demain matin au dépôt, quel plan d’achat exact me conseilles-tu ?',
];

function resizeOrCleanJson(text: string): {
  cleanReply: string;
  actions: AiStoreAction[];
} {
  const actions: AiStoreAction[] = [];
  const cleanReply = text
    .replace(/<shopflow_action>([\s\S]*?)<\/shopflow_action>/gi, (_, inner) => {
      try {
        const parsed = JSON.parse(inner.trim());
        if (Array.isArray(parsed)) {
          actions.push(...parsed);
        } else if (parsed && typeof parsed === 'object') {
          actions.push(parsed);
        }
      } catch {
        // Ignore malformed JSON action block
      }
      return '';
    })
    .trim();

  return { cleanReply, actions };
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  settings,
  products,
  sales,
  expenses,
  credits,
  onExecuteAiActions,
}) => {
  const fmt = (val: number) =>
    formatMoney(val, settings.currency, settings.usdRateFC);

  const currentLangObj =
    LANGUAGE_OPTIONS.find((l) => l.code === settings.language) ||
    LANGUAGE_OPTIONS[0];

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-llm',
      role: 'assistant',
      content:
        `Bonjour **${settings.ownerName}** ! Je suis **ShopFlow Intelligence**, votre co-pilote IA connecté en temps réel à **${settings.shopName}**.\n\n` +
        `Contrairement à un simple robot à réponses fixes, je réfléchis librement sur toute votre activité :\n` +
        `• **Analyse financière & stratégie** *(marges, prix idéaux, prévisions, rentabilité)*\n` +
        `• **Marketing & Copywriting** *(textes de vente WhatsApp, scripts TikTok, offres packs)*\n` +
        `• **Actions directes dans ShopFlow** *(enregistrer une vente, créer un produit, noter une dépense)*\n` +
        `• **Multilingue natif** (*Français, English, Lingala, Kiswahili, 中文*)\n\n` +
        `Que voulez-vous analyser ou accomplir maintenant ?`,
      timestamp: 'En ligne · IA Temps Réel',
    },
  ]);

  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const nowTime = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(
      d.getMinutes()
    ).padStart(2, '0')}`;
  };

  /**
   * Builds live, exact real-time store context so the LLM reasons on true shop data
   */
  const buildSystemPrompt = () => {
    const totalCA = sales.reduce((a, s) => a + s.totalRevenueFC, 0);
    const totalCost = sales.reduce((a, s) => a + s.totalCostFC, 0);
    const totalExp = expenses.reduce((a, e) => a + e.amountFC, 0);
    const netProfit = totalCA - totalCost - totalExp;
    const totalUnits = sales.reduce((a, s) => a + s.quantity, 0);

    const catalogSnapshot = products.map((p) => {
      const soldToday = sales
        .filter((s) => s.productId === p.id)
        .reduce((acc, s) => acc + s.quantity, 0);
      return {
        id: p.id,
        nom: p.name,
        categorie: p.category,
        unite: p.unit,
        stockActuel: p.stock,
        seuilAlerte: p.minStockAlert,
        prixAchat: fmt(p.purchasePriceFC),
        prixAchatFC: p.purchasePriceFC,
        prixVente: fmt(p.sellingPriceFC),
        prixVenteFC: p.sellingPriceFC,
        gainUnitaire: fmt(p.sellingPriceFC - p.purchasePriceFC),
        vendusAujourdhui: soldToday,
      };
    });

    const creditsSnapshot = credits.map((c) => ({
      client: c.customerName,
      telephone: c.phone,
      articles: c.itemsSummary,
      total: fmt(c.totalAmountFC),
      dejaPaye: fmt(c.paidAmountFC),
      resteAPayer: fmt(Math.max(0, c.totalAmountFC - c.paidAmountFC)),
      echeance: c.dueDate,
    }));

    return `Tu es ShopFlow AI, un assistant IA expert en gestion commerciale, comptabilité simplifiée, stratégie e-commerce et marketing (du même niveau d'intelligence, de réflexion structurée et de proactivité que l'IA de Chariow), conçu spécialement pour les commerçants et entrepreneurs en RDC (Kinshasa, Lubumbashi, Goma...) et en Afrique.

RÈGLES ESSENTIELLES :
1. Réfléchis véritablement à chaque question posée par l'utilisateur (qu'il s'agisse de ses chiffres, d'une simulation mathématique, d'une stratégie business, d'une idée de pub TikTok/WhatsApp, de négociation client ou d'une question générale). Ne donne jamais de réponse générique vague : utilise ses VRAIS chiffres ci-dessous quand c'est pertinent, fais les vrais calculs étape par étape et propose des conseils concrets et actionnables.
2. Langue préférée actuelle des paramètres : ${currentLangObj.nativeLabel} (code: ${settings.language}). Si le commerçant écrit dans une autre langue (Français, Anglais, Lingala, Swahili, Chinois), réponds-lui naturellement dans la langue qu'il utilise !
3. Devise d'affichage active de la boutique : ${settings.currency} (Taux interne : 1 USD = ${settings.usdRateFC} FC). Exprime toujours les montants dans la devise active (${settings.currency}) sauf demande contraire.
4. ACTIONS DIRECTES SUR L'APPLICATION : Si et seulement si l'utilisateur te demande explicitement d'exécuter une action dans sa boutique (ex: enregistrer une vente, ajouter une nouvelle marchandise, modifier un prix ou noter une dépense), insère TOUT EN HAUT de ta réponse un bloc exactement au format suivant contenant un tableau JSON valide (les montants internes doivent être en FC entiers) :
<shopflow_action>[{"type":"sell","productId":"prod-riz-25","quantity":2}]</shopflow_action>
Types d'actions supportés :
- {"type":"sell","productId":"ID_PRODUIT","quantity":NOMBRE}
- {"type":"add_product","name":"NOM","category":"Alimentation","unit":"Pièce","stock":10,"purchasePriceFC":5000,"sellingPriceFC":8000}
- {"type":"update_price","productId":"ID_PRODUIT","sellingPriceFC":70000}
- {"type":"add_expense","label":"MOTIF","amountFC":5000}
Après ce bloc <shopflow_action>, écris toujours ta réponse humaine claire et chaleureuse.

DONNÉES EN DIRECT DE LA BOUTIQUE À CET INSTANT PRÉCIS :
- Nom boutique : ${settings.shopName} (${settings.shopSpecialties})
- Propriétaire : ${settings.ownerName} | Ville : ${settings.city}
- Résumé financier d'aujourd'hui :
  * Articles vendus aujourd'hui : ${totalUnits} unités (${sales.length} ventes)
  * Chiffre d'Affaires (CA du jour) : ${fmt(totalCA)} (${totalCA} FC)
  * Coût d'achat des marchandises vendues : ${fmt(totalCost)} (${totalCost} FC)
  * Dépenses boutique du jour : ${fmt(totalExp)} (${totalExp} FC) — Détail : ${JSON.stringify(expenses.map((e) => `${e.label}: ${fmt(e.amountFC)}`))}
  * REVENU / BÉNÉFICE NET RÉEL DU JOUR : ${fmt(netProfit)} (${netProfit} FC)
- Catalogue complet & Stocks en direct :
${JSON.stringify(catalogSnapshot)}
- Carnet de crédits clients (« Bons ») :
${JSON.stringify(creditsSnapshot)}`;
  };

  /**
   * Calls a real LLM endpoint (custom API key if configured, or live CORS cloud LLM gateway out of the box!)
   */
  const queryRealLLM = async (
    historyToSend: ChatMessage[]
  ): Promise<string> => {
    const systemMessage = {
      role: 'system',
      content: buildSystemPrompt(),
    };

    const apiMessages = [
      systemMessage,
      ...historyToSend.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // 1. If owner provided their own OpenAI / OpenRouter / Groq key in Settings
    if (settings.customAiApiKey && settings.customAiApiKey.trim().length > 10) {
      const resp = await fetch(
        settings.customAiEndpoint ||
          'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${settings.customAiApiKey.trim()}`,
          },
          body: JSON.stringify({
            model: settings.customAiModel || 'gpt-4o-mini',
            messages: apiMessages,
            temperature: 0.7,
          }),
        }
      );
      if (resp.ok) {
        const data = await resp.json();
        const txt = data?.choices?.[0]?.message?.content;
        if (txt) return txt;
      }
    }

    // 2. Primary Zero-Config Real Cloud LLM (OpenAI-compatible CORS gateway)
    const response = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai',
        messages: apiMessages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await response.json();
      const content = json?.choices?.[0]?.message?.content;
      if (typeof content === 'string' && content.trim()) {
        return content;
      }
    }

    const rawText = await response.text();
    if (rawText && rawText.trim()) {
      return rawText;
    }

    throw new Error('Empty AI response');
  };

  const handleSend = async (overridePrompt?: string) => {
    const promptText = (overridePrompt ?? input).trim();
    if (!promptText || isThinking) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: promptText,
      timestamp: nowTime(),
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    if (!overridePrompt) setInput('');
    setIsThinking(true);

    try {
      const rawAiText = await queryRealLLM(updatedHistory);
      const { cleanReply, actions } = resizeOrCleanJson(rawAiText);
      const badges =
        actions.length > 0 ? onExecuteAiActions(actions) : undefined;

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: cleanReply || rawAiText,
          executedBadges: badges,
          timestamp: `${nowTime()} · ShopFlow AI`,
        },
      ]);
    } catch {
      // Offline emergency fallback if device has zero internet connectivity
      const totalCA = sales.reduce((a, s) => a + s.totalRevenueFC, 0);
      const totalCost = sales.reduce((a, s) => a + s.totalCostFC, 0);
      const totalExp = expenses.reduce((a, e) => a + e.amountFC, 0);
      const net = totalCA - totalCost - totalExp;

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-offline-${Date.now()}`,
          role: 'assistant',
          content:
            `⚠️ **Connexion internet indisponible ou momentanément saturée.**\n\n` +
            `En attendant le retour du réseau pour ma réflexion IA complète, voici vos chiffres locaux exacts calculés hors-ligne :\n` +
            `• **Chiffre d’Affaires (CA) :** ${fmt(totalCA)} (${sales.length} ventes)\n` +
            `• **Coût d’achat marchandise :** ${fmt(totalCost)}\n` +
            `• **Dépenses :** ${fmt(totalExp)}\n` +
            `• **Bénéfice Net Réel :** **+${fmt(net)}**\n\n` +
            `Réessayez votre question dans quelques secondes dès que la connexion 4G/Wi-Fi est active !`,
          timestamp: `${nowTime()} · Mode Secours Hors-Ligne`,
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const toggleVoiceInput = () => {
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown })
        .webkitSpeechRecognition;

    if (!SpeechRec) return;

    try {
      const recognition = new SpeechRec() as {
        lang: string;
        interimResults: boolean;
        onresult: (event: { results: { transcript: string }[][] }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
      };
      recognition.lang =
        settings.language === 'en'
          ? 'en-US'
          : settings.language === 'zh'
            ? 'zh-CN'
            : settings.language === 'sw'
              ? 'sw-KE'
              : 'fr-FR';
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

  const speakMessage = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(
      text.replace(/\*\*/g, '').replace(/[#•]/g, '')
    );
    utter.lang =
      settings.language === 'en'
        ? 'en-US'
        : settings.language === 'zh'
          ? 'zh-CN'
          : 'fr-FR';
    window.speechSynthesis.speak(utter);
  };

  const renderMarkdown = (text: string) =>
    text.split('\n').map((line, i) => {
      if (line.trim().startsWith('### ')) {
        return (
          <h4 key={i} className="mt-2 font-extrabold text-slate-900">
            {line.replace(/^###\s+/, '')}
          </h4>
        );
      }
      if (line.trim().startsWith('## ')) {
        return (
          <h3 key={i} className="mt-2.5 text-sm font-black text-slate-950">
            {line.replace(/^##\s+/, '')}
          </h3>
        );
      }
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={i} className={line.trim() === '' ? 'h-2' : 'leading-relaxed'}>
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
    <div className="mx-auto flex h-[calc(100vh-150px)] max-h-[780px] min-h-[560px] max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {/* Header inspired by modern AI copilots (ShopFlow Royal Blue -> Emerald) */}
      <div className="flex items-center justify-between bg-gradient-to-r from-[#081844] via-[#0A4DFF] to-emerald-600 px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-xs">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold @md:text-base">
                ShopFlow Intelligence
              </h1>
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                IA RÉFLEXIVE TEMPS RÉEL
              </span>
            </div>
            <p className="text-xs text-sky-100">
              Analyse librement toute question business, financière ou marketing · {currentLangObj.flag} {currentLangObj.nativeLabel}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMessages((prev) => [prev[0]])}
          className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/25"
          title="Nouvelle discussion"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden @sm:inline">Nouveau chat</span>
        </button>
      </div>

      {/* Conversation Stream */}
      <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/80 p-4 @md:p-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[90%] rounded-2xl px-4 py-3.5 text-xs shadow-2xs @md:max-w-[78%] @md:text-sm ${
                msg.role === 'user'
                  ? 'rounded-br-sm bg-[#0A4DFF] text-white'
                  : 'rounded-bl-sm border border-slate-200 bg-white text-slate-800'
              }`}
            >
              {msg.executedBadges && msg.executedBadges.length > 0 && (
                <div className="mb-2.5 flex flex-wrap gap-1.5">
                  {msg.executedBadges.map((b, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-800 ring-1 ring-emerald-200"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      {b}
                    </span>
                  ))}
                </div>
              )}

              <div className="space-y-0.5">{renderMarkdown(msg.content)}</div>

              <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-black/5 pt-1.5">
                <span
                  className={`text-[10px] ${
                    msg.role === 'user' ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </span>

                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => speakMessage(msg.content)}
                      className="text-slate-400 transition hover:text-emerald-600"
                      title="Écouter la réponse"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(msg.content);
                          setCopiedId(msg.id);
                          setTimeout(() => setCopiedId(null), 1500);
                        } catch {
                          // Ignore
                        }
                      }}
                      className="text-slate-400 transition hover:text-slate-700"
                      title="Copier le texte"
                    >
                      {copiedId === msg.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Thinking State Indicator */}
        {isThinking && (
          <div className="flex justify-start">
            <div className="flex items-center gap-3 rounded-2xl rounded-bl-sm border border-blue-100 bg-white px-4 py-3 text-xs font-semibold text-slate-700 shadow-2xs">
              <Loader2 className="h-4 w-4 animate-spin text-[#0A4DFF]" />
              <span>
                ShopFlow IA réfléchit et analyse les données de votre boutique...
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Optional Ideas Strip */}
      <div className="border-t border-slate-100 bg-white px-4 pt-2.5">
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
          <Sparkles className="h-3.5 w-3.5 text-[#0A4DFF]" />
          <span>Exemples libres (ou posez n’importe quelle question de votre choix) :</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {EXAMPLE_IDEAS.map((idea) => (
            <button
              key={idea}
              type="button"
              disabled={isThinking}
              onClick={() => handleSend(idea)}
              className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-[#081844] disabled:opacity-50"
            >
              {idea}
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar */}
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
              : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-[#0A4DFF]'
          }`}
          title="Parler au micro"
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
          disabled={isThinking}
          placeholder="Posez n’importe quelle question (stratégie, calculs, pub WhatsApp, vente, Lingala/Swahili/中文)..."
          className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#0A4DFF] focus:bg-white focus:outline-hidden @md:text-sm"
        />

        <button
          type="submit"
          disabled={isThinking || !input.trim()}
          className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-[#0A4DFF] px-5 text-xs font-bold text-white shadow-xs transition hover:bg-[#0839C8] disabled:bg-slate-300"
        >
          <Send className="h-4 w-4" />
          <span className="hidden @sm:inline">Envoyer</span>
        </button>
      </form>
    </div>
  );
};
