import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import {
  ArrowUp,
  Check,
  CheckCircle2,
  Copy,
  Mic,
  MicOff,
  Plus,
  Square,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { SHOPFLOW_APP_LOGO } from '../data/initialData';
import { LANGUAGE_OPTIONS } from '../i18n/translations';
import {
  CreditEntry,
  ExpenseEntry,
  Product,
  SaleRecord,
  ShopSettings,
  VoiceModelId,
} from '../types';
import { formatMoney } from '../utils/currency';
import {
  speakCleanText,
  stopAllSpeech,
  VOICE_MODELS,
} from '../utils/speechCleaner';

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
  onUpdateVoiceSettings: (voiceModel: VoiceModelId, autoSpeak: boolean) => void;
}

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  executedBadges?: string[];
  timestamp: string;
}

const STARTER_CARDS = [
  {
    title: '📊 Bilan & Formules de Rentabilité',
    prompt:
      'Fais-moi un bilan complet de ma journée avec un tableau clair et les formules mathématiques exactes de ma marge brute et mon bénéfice net.',
  },
  {
    title: '🚀 Pub WhatsApp & Script TikTok',
    prompt:
      'Rédige une publication WhatsApp très vendeuse et un script vidéo TikTok de 30 secondes pour attirer plus de clients dans ma boutique.',
  },
  {
    title: '🧮 Simulation Hausse / Baisse de Prix',
    prompt:
      'Si je fais une promotion de -8% sur mes produits phares, combien d’unités supplémentaires dois-je vendre pour gagner plus d’argent qu’aujourd’hui ? Montre le calcul.',
  },
  {
    title: '⚡ Action Directe Caisse & Stock',
    prompt: 'Enregistre la vente de 2 sacs de riz et 1 bidon d’huile',
  },
];

/**
 * Normalizes LaTeX delimiters (`\[...\]` -> `$$...$$`, `\(...\)` -> `$...$`)
 * while protecting plain currency figures like `12 $` or `$250` from accidental math mode!
 */
function prepareMarkdownAndLatex(raw: string): string {
  let out = raw;
  // Convert \[ ... \] block math into $$ ... $$
  out = out.replace(/\\\[([\s\S]*?)\\\]/g, (_, expr) => `\n$$\n${expr.trim()}\n$$\n`);
  // Convert \( ... \) inline math into $ ... $
  out = out.replace(/\\\(([\s\S]*?)\\\)/g, (_, expr) => `$${expr.trim()}$`);
  // Escape standalone currency numbers like "250 $" so they don't pair up across sentences
  out = out.replace(/(\d[\d\s.,]*)\s+\$(?!\$)/g, '$1 \\$');
  return out;
}

function extractActionsFromReply(text: string): {
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
        // Ignore malformed block
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
  onUpdateVoiceSettings,
}) => {
  const fmt = (val: number) =>
    formatMoney(val, settings.currency, settings.usdRateFC);

  const currentLangObj =
    LANGUAGE_OPTIONS.find((l) => l.code === settings.language) ||
    LANGUAGE_OPTIONS[0];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(
    null
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  useEffect(() => {
    return () => {
      stopAllSpeech();
    };
  }, []);

  const nowTime = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(
      d.getMinutes()
    ).padStart(2, '0')}`;
  };

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
        prixVente: fmt(p.sellingPriceFC),
        gainUnitaire: fmt(p.sellingPriceFC - p.purchasePriceFC),
        vendusAujourdhui: soldToday,
      };
    });

    return `Tu es ShopFlow AI, l'assistant intelligent officiel de ShopFlow (aussi puissant, structuré, analytique et agréable à lire que ChatGPT et l'IA de Chariow).

STYLE DE PRÉSENTATION (TRÈS IMPORTANT) :
1. Structure tes réponses de façon aérée, professionnelle et ultra-lisible comme ChatGPT : titres clairs (## ou ###), listes à puces propres, chiffres clés en **gras**, et **tableaux Markdown** dès que tu compares des produits, des prix ou des scénarios.
2. FORMULES MATHÉMATIQUES EN LATEX : Dès que tu expliques un calcul financier, une marge, un seuil de rentabilité, un pourcentage ou une équation, utilise de belles formules LaTeX avec \`$$ ... $$\` (pour une formule centrée sur sa propre ligne) ou \`$ ... $\` (en ligne). Exemple :
$$\\text{Revenu Net} = \\sum (P_{\\text{vente}} - P_{\\text{achat}}) \\times Q - \\text{Dépenses}$$
3. LANGUE : Réponds intégralement dans la langue choisie par l'utilisateur (${currentLangObj.nativeLabel}, code: ${settings.language}), ou dans la langue du message s'il t'écrit dans une autre langue (Français, English, Lingala, Kiswahili, 中文).
4. ACTIONS DIRECTES SUR LA BOUTIQUE : Si et seulement si l'utilisateur demande d'enregistrer une vente, d'ajouter un produit, de modifier un prix ou d'ajouter une dépense, place tout en haut de ta réponse :
<shopflow_action>[{"type":"sell","productId":"prod-riz-25","quantity":2}]</shopflow_action>
Actions disponibles (montants en FC entiers) :
- {"type":"sell","productId":"ID","quantity":N}
- {"type":"add_product","name":"NOM","category":"Alimentation","unit":"Pièce","stock":10,"purchasePriceFC":5000,"sellingPriceFC":8000}
- {"type":"update_price","productId":"ID","sellingPriceFC":70000}
- {"type":"add_expense","label":"MOTIF","amountFC":5000}

DONNÉES EN DIRECT DE LA BOUTIQUE (${settings.shopName} — ${settings.city}) :
- Propriétaire : ${settings.ownerName} | Devise active : ${settings.currency} (1 USD = ${settings.usdRateFC} FC)
- Ventes aujourd'hui : ${totalUnits} articles (${sales.length} ventes)
- Chiffre d'Affaires (CA) : ${fmt(totalCA)}
- Coût d'achat des articles vendus : ${fmt(totalCost)}
- Dépenses du jour : ${fmt(totalExp)} (${expenses.map((e) => `${e.label}: ${fmt(e.amountFC)}`).join(', ')})
- REVENU / BÉNÉFICE NET RÉEL : ${fmt(netProfit)}
- Stock & Catalogue : ${JSON.stringify(catalogSnapshot)}
- Crédits clients : ${JSON.stringify(
      credits.map((c) => ({
        client: c.customerName,
        reste: fmt(Math.max(0, c.totalAmountFC - c.paidAmountFC)),
        echeance: c.dueDate,
      }))
    )}`;
  };

  const queryRealLLM = async (
    historyToSend: ChatMessage[]
  ): Promise<string> => {
    const apiMessages = [
      { role: 'system', content: buildSystemPrompt() },
      ...historyToSend.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

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
            temperature: 0.65,
          }),
        }
      );
      if (resp.ok) {
        const data = await resp.json();
        const txt = data?.choices?.[0]?.message?.content;
        if (txt) return txt;
      }
    }

    const response = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai',
        messages: apiMessages,
        temperature: 0.65,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const raw = await response.text();
    try {
      const json = JSON.parse(raw);
      const msg = json?.choices?.[0]?.message?.content;
      if (typeof msg === 'string' && msg.trim()) return msg;
    } catch {
      // Plain text stream
    }
    if (raw && raw.trim()) return raw;
    throw new Error('Empty response');
  };

  const handleTogglePlayMessage = (msg: ChatMessage) => {
    if (speakingMessageId === msg.id) {
      stopAllSpeech();
      setSpeakingMessageId(null);
      return;
    }

    setSpeakingMessageId(msg.id);
    speakCleanText(msg.content, settings.language, settings.voiceModel, () => {
      setSpeakingMessageId((curr) => (curr === msg.id ? null : curr));
    });
  };

  const handleSend = async (overridePrompt?: string) => {
    const promptText = (overridePrompt ?? input).trim();
    if (!promptText || isThinking) return;

    stopAllSpeech();
    setSpeakingMessageId(null);

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
      const { cleanReply, actions } = extractActionsFromReply(rawAiText);
      const badges =
        actions.length > 0 ? onExecuteAiActions(actions) : undefined;

      const aiMsgId = `ai-${Date.now()}`;
      const finalContent = cleanReply || rawAiText;

      setMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          role: 'assistant',
          content: finalContent,
          executedBadges: badges,
          timestamp: nowTime(),
        },
      ]);

      if (settings.autoSpeakAi) {
        setSpeakingMessageId(aiMsgId);
        speakCleanText(
          finalContent,
          settings.language,
          settings.voiceModel,
          () => {
            setSpeakingMessageId((curr) => (curr === aiMsgId ? null : curr));
          }
        );
      }
    } catch {
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
            `### 📡 Mode Hors-Ligne Local\n\n` +
            `Votre appareil semble momentanément hors connexion internet. Voici le calcul exact de votre boutique en local :\n\n` +
            `$$\\text{Revenu Net} = ${Math.round(totalCA)} - ${Math.round(totalCost)} - ${Math.round(totalExp)} = ${Math.round(net)}\\text{ FC}$$\n\n` +
            `- **Chiffre d’Affaires (CA) :** **${fmt(totalCA)}**\n` +
            `- **Coût d’achat stock :** **${fmt(totalCost)}**\n` +
            `- **Dépenses :** **${fmt(totalExp)}**\n` +
            `- **Bénéfice Net Réel :** **+${fmt(net)}**`,
          timestamp: nowTime(),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const toggleVoiceDictation = () => {
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

  return (
    <div className="mx-auto flex h-[calc(100vh-135px)] max-h-[820px] min-h-[560px] max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
      {/* Clean ChatGPT-Style Top Bar with Model Badge + Voice Model Picker + Auto-Audio */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-white px-4 py-3 @md:px-6">
        <div className="flex items-center gap-2.5">
          <img
            src={SHOPFLOW_APP_LOGO}
            alt="ShopFlow AI"
            className="h-8 w-8 rounded-xl object-contain ring-1 ring-slate-200/80"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold text-slate-900">
                ShopFlow AI
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                LaTeX • Tableaux • Voix HD
              </span>
            </div>
          </div>
        </div>

        {/* Voice Model Selector & Auto-Speak Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Modèle de voix"
            value={settings.voiceModel}
            onChange={(e) => {
              const nextVoice = e.target.value as VoiceModelId;
              onUpdateVoiceSettings(nextVoice, settings.autoSpeakAi);
              speakCleanText(
                'Bonjour, je suis votre nouvelle voix ShopFlow.',
                settings.language,
                nextVoice
              );
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-hidden"
          >
            {VOICE_MODELS.map((vm) => (
              <option key={vm.id} value={vm.id}>
                🎙️ {vm.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              stopAllSpeech();
              setSpeakingMessageId(null);
              onUpdateVoiceSettings(settings.voiceModel, !settings.autoSpeakAi);
            }}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
              settings.autoSpeakAi
                ? 'border-[#0A4DFF] bg-blue-50 text-[#0A4DFF]'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
            title="Lire automatiquement les réponses à voix haute (sans prononcer les caractères spéciaux)"
          >
            {settings.autoSpeakAi ? (
              <Volume2 className="h-3.5 w-3.5" />
            ) : (
              <VolumeX className="h-3.5 w-3.5" />
            )}
            <span className="hidden @sm:inline">Voix auto</span>
          </button>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => {
                stopAllSpeech();
                setSpeakingMessageId(null);
                setMessages([]);
              }}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              title="Nouvelle discussion"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden @md:inline">Nouveau</span>
            </button>
          )}
        </div>
      </div>

      {/* Main ChatGPT Conversation Canvas */}
      <div className="flex-1 overflow-y-auto px-4 py-6 @md:px-8">
        <div className="mx-auto max-w-3xl">
          {messages.length === 0 ? (
            /* Clean Centered ChatGPT Empty State */
            <div className="flex min-h-[370px] flex-col items-center justify-center py-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-50 p-2 shadow-xs ring-1 ring-slate-200/80">
                <img
                  src={SHOPFLOW_APP_LOGO}
                  alt="ShopFlow"
                  className="h-full w-full object-contain"
                />
              </div>
              <h2 className="mt-4 text-xl font-extrabold tracking-tight text-slate-900 @md:text-2xl">
                Comment puis-je aider {settings.shopName} ?
              </h2>
              <p className="mt-1.5 max-w-md text-xs text-slate-500 @md:text-sm">
                Posez n’importe quelle question financière, demandez des formules mathématiques en LaTeX, un plan marketing ou dictez directement une vente.
              </p>

              {/* 4 Clean ChatGPT-style Starter Cards */}
              <div className="mt-7 grid w-full grid-cols-1 gap-3 text-left @sm:grid-cols-2">
                {STARTER_CARDS.map((card) => (
                  <button
                    key={card.title}
                    type="button"
                    onClick={() => handleSend(card.prompt)}
                    className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50/80"
                  >
                    <p className="text-xs font-extrabold text-slate-900">
                      {card.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500">
                      {card.prompt}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Clean ChatGPT Turn-by-Turn Stream */
            <div className="space-y-8">
              {messages.map((msg) =>
                msg.role === 'user' ? (
                  /* User Message Pill on Right (Exact ChatGPT Style) */
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[85%] rounded-3xl bg-slate-100 px-5 py-3 text-sm font-medium text-slate-900 @md:max-w-[75%]">
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  /* Assistant Full-Width Editorial Response with ShopFlow Avatar + KaTeX + GFM */
                  <div key={msg.id} className="flex items-start gap-3.5">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white p-1 shadow-2xs ring-1 ring-slate-200">
                      <img
                        src={SHOPFLOW_APP_LOGO}
                        alt="AI"
                        className="h-full w-full object-contain"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      {msg.executedBadges && msg.executedBadges.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-1.5">
                          {msg.executedBadges.map((b, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-800 ring-1 ring-emerald-200"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              {b}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="sf-chatgpt-prose">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {prepareMarkdownAndLatex(msg.content)}
                        </ReactMarkdown>
                      </div>

                      {/* Subtle Action Bar Underneath Assistant Message (Play Clean Voice / Stop / Copy) */}
                      <div className="mt-3 flex items-center gap-2 text-slate-400">
                        <button
                          type="button"
                          onClick={() => handleTogglePlayMessage(msg)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                            speakingMessageId === msg.id
                              ? 'bg-red-50 text-red-600'
                              : 'hover:bg-slate-100 hover:text-slate-700'
                          }`}
                          title="Écouter la réponse avec voix naturelle (sans caractères spéciaux)"
                        >
                          {speakingMessageId === msg.id ? (
                            <>
                              <Square className="h-3.5 w-3.5 fill-current" />
                              <span>Arrêter la voix</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-3.5 w-3.5" />
                              <span>Écouter</span>
                            </>
                          )}
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
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold hover:bg-slate-100 hover:text-slate-700"
                          title="Copier"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                              <span className="text-emerald-600">Copié</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copier</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}

              {/* Smooth Thinking Pulse Indicator */}
              {isThinking && (
                <div className="flex items-start gap-3.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white p-1 shadow-2xs ring-1 ring-slate-200">
                    <img
                      src={SHOPFLOW_APP_LOGO}
                      alt="AI"
                      className="h-full w-full animate-pulse object-contain"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1.5 text-xs font-semibold text-slate-500">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#0A4DFF]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#0A4DFF] [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#0A4DFF] [animation-delay:300ms]" />
                    <span className="ml-1">Réflexion en cours...</span>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>

      {/* Floating Rounded ChatGPT Composer Box at Bottom */}
      <div className="bg-white px-4 pt-2 pb-4 @md:px-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="mx-auto flex max-w-3xl items-center gap-2 rounded-3xl border border-slate-300 bg-slate-50 px-3 py-2 shadow-xs focus-within:border-slate-400 focus-within:bg-white"
        >
          <button
            type="button"
            onClick={toggleVoiceDictation}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
              isListening
                ? 'animate-pulse bg-red-500 text-white'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
            title="Dicter au micro"
          >
            {isListening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isThinking}
            placeholder="Envoyer un message à ShopFlow AI..."
            className="flex-1 bg-transparent px-2 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
          />

          <button
            type="submit"
            disabled={isThinking || !input.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-[#0A4DFF] disabled:bg-slate-300"
            aria-label="Envoyer"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
