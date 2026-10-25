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
} from '../types';
import {
  cleanRawModelText,
  detectLocalStoreActions,
  generateSmartLocalBusinessResponse,
  parseGatewayResponseText,
} from '../utils/aiSanitizer';
import { formatMoney } from '../utils/currency';
import {
  speakCleanText,
  stopAllSpeech,
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
  onUpdateVoiceSettings: (autoSpeak: boolean) => void;
}

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  executedBadges?: string[];
  timestamp: string;
}

interface SavedConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
}

interface ConversationStore {
  activeConversationId: string;
  conversations: SavedConversation[];
}

const createConversation = (): SavedConversation => ({
  id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: 'Nouvelle discussion',
  messages: [],
  updatedAt: new Date().toISOString(),
});

const loadConversationStore = (storageKey: string, legacyStorageKey: string): ConversationStore => {
  try {
    const raw = localStorage.getItem(storageKey) ?? localStorage.getItem(legacyStorageKey);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ConversationStore>;
      const conversations = Array.isArray(parsed.conversations)
        ? parsed.conversations.filter(
            (conversation): conversation is SavedConversation =>
              Boolean(
                conversation &&
                  typeof conversation.id === 'string' &&
                  typeof conversation.title === 'string' &&
                  Array.isArray(conversation.messages)
              )
          )
        : [];
      if (conversations.length > 0) {
        // Keep the active thread (or most recently used one) when migrating from the old multi-chat UI.
        const active = conversations.find(
          (conversation) => conversation.id === parsed.activeConversationId
        );
        const mostRecentWithMessages = [...conversations]
          .filter((conversation) => conversation.messages.length > 0)
          .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))[0];
        const selected =
          (active?.messages.length ? active : mostRecentWithMessages) ??
          active ??
          [...conversations].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))[0];
        return {
          activeConversationId: selected.id,
          conversations: [selected],
        };
      }
    }
  } catch {
    // Fall through to a clean local conversation if storage is unavailable or corrupt.
  }

  const initialConversation = createConversation();
  return {
    activeConversationId: initialConversation.id,
    conversations: [initialConversation],
  };
};

const STARTER_CARDS = [
  {
    title: '📊 Comprendre mon activité',
    prompt: 'Explique-moi comment suivre mon chiffre d’affaires et mon bénéfice net dans ShopFlow.',
  },
  {
    title: '🚀 Préparer un message WhatsApp',
    prompt: 'Aide-moi à rédiger un message WhatsApp pour présenter ma boutique, sans inventer de produits ni de prix.',
  },
  {
    title: '🧮 Calculer un prix de vente',
    prompt: 'Quelle formule utiliser pour fixer un prix de vente rentable ?',
  },
  {
    title: '📦 Ajouter mon premier article',
    prompt: 'Comment ajouter mon premier article et définir son stock dans ShopFlow ?',
  },
];

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

  const conversationStorageKey = 'shopflow_ai_conversation_v1';
  const legacyConversationStorageKey = `shopflow_ai_conversations_v1:${encodeURIComponent(
    `${settings.shopName}:${settings.ownerName}`.trim().toLocaleLowerCase()
  )}`;
  const [conversationStore, setConversationStore] = useState<ConversationStore>(
    () => loadConversationStore(conversationStorageKey, legacyConversationStorageKey)
  );
  const activeConversation = conversationStore.conversations.find(
    (conversation) => conversation.id === conversationStore.activeConversationId
  );
  const messages = activeConversation?.messages ?? [];
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(
    null
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [input]);

  useEffect(() => {
    try {
      localStorage.setItem(conversationStorageKey, JSON.stringify(conversationStore));
    } catch {
      // Keep the active session usable even if the device storage quota is exceeded.
    }
  }, [conversationStorageKey, conversationStore]);

  const appendConversationMessage = (
    conversationId: string,
    message: ChatMessage
  ) => {
    setConversationStore((previous) => ({
      ...previous,
      conversations: previous.conversations.map((conversation) => {
        if (conversation.id !== conversationId) return conversation;
        const isFirstUserMessage =
          message.role === 'user' &&
          !conversation.messages.some((item) => item.role === 'user');
        const shortTitle = message.content.replace(/\s+/g, ' ').trim();
        return {
          ...conversation,
          title: isFirstUserMessage
            ? shortTitle.length > 42
              ? `${shortTitle.slice(0, 39)}…`
              : shortTitle
            : conversation.title,
          messages: [...conversation.messages, message],
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  };


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

  /**
   * 100% Natural Human Context Prompt (ZERO JSON, ZERO XML tags, ZERO code backticks!)
   * so cloud LLMs NEVER reply with programming code, JSON objects, or HTML tags!
   */
  const buildSystemPrompt = (actionSummary?: string) => {
    const totalCA = sales.reduce((a, s) => a + s.totalRevenueFC, 0);
    const totalCost = sales.reduce((a, s) => a + s.totalCostFC, 0);
    const totalExp = expenses.reduce((a, e) => a + e.amountFC, 0);
    const netProfit = totalCA - totalCost - totalExp;
    const totalUnits = sales.reduce((a, s) => a + s.quantity, 0);

    const stockLines = products
      .map((p) => {
        const soldToday = sales
          .filter((s) => s.productId === p.id)
          .reduce((acc, s) => acc + s.quantity, 0);
        return `- ${p.name} (${p.unit}) : en stock = ${p.stock} (alerte à ${p.minStockAlert}), achat = ${fmt(p.purchasePriceFC)}, vente = ${fmt(p.sellingPriceFC)}, bénéfice unitaire = ${fmt(p.sellingPriceFC - p.purchasePriceFC)}, vendus (historique enregistré) = ${soldToday}`;
      })
      .join('\n');

    const creditLines = credits
      .map(
        (c) =>
          `- ${c.customerName} : reste à payer ${fmt(Math.max(0, c.totalAmountFC - c.paidAmountFC))} (échéance : ${c.dueDate})`
      )
      .join('\n');

    return [
      `Tu es ShopFlow AI, le conseiller commercial et financier intelligent intégré à l'application ShopFlow.`,
      `Tu t'adresses à un commerçant (${settings.ownerName}, gérant de "${settings.shopName}" à ${settings.city}), JAMAIS à un développeur.`,
      ``,
      `RÈGLES ABSOLUES DE PRÉSENTATION :`,
      `1. N'envoie JAMAIS de code informatique, JAMAIS de JSON, JAMAIS de balises HTML (pas de <br>) et JAMAIS de blocs de code avec trois accents graves.`,
      `2. Rédige avec la clarté et l'élégance de ChatGPT : titres clairs (## et ###), paragraphes courts, mots clés en **gras**, listes à puces et tableaux Markdown propres.`,
      `3. Quand tu présentes une formule mathématique, écris-la directement entre doubles dollars sur ses propres lignes sans accents graves autour, par exemple :`,
      `$$`,
      `\\text{Bénéfice Net} = \\text{Chiffre d'Affaires} - \\text{Coût d'Achat} - \\text{Dépenses}`,
      `$$`,
      `4. Réponds dans la langue active de l'utilisateur (${currentLangObj.nativeLabel}) ou dans la langue de sa question.`,
      actionSummary
        ? `5. L'action suivante vient déjà d'être enregistrée automatiquement dans la caisse : ${actionSummary}. Confirme-la clairement au commerçant.`
        : ``,
      ``,
      `CHIFFRES EN DIRECT DE LA BOUTIQUE :`,
      `- Devise affichée : ${settings.currency} (1 USD = ${settings.usdRateFC} FC)`,
      `- Ventes enregistrées localement : ${totalUnits} unités en ${sales.length} transactions`,
      `- Chiffre d'Affaires (CA) : ${fmt(totalCA)}`,
      `- Coût d'achat marchandise vendue : ${fmt(totalCost)}`,
      `- Dépenses du jour : ${fmt(totalExp)}`,
      `- Bénéfice Net Réel : ${fmt(netProfit)}`,
      ``,
      `CATALOGUE & STOCK ACTUEL :`,
      stockLines,
      ``,
      `CRÉDITS CLIENTS EN COURS :`,
      creditLines,
    ]
      .filter(Boolean)
      .join('\n');
  };

  const queryCloudAI = async (
    historyToSend: ChatMessage[],
    actionSummary?: string
  ): Promise<string> => {
    const apiMessages = [
      { role: 'system', content: buildSystemPrompt(actionSummary) },
      ...historyToSend.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // Deux tentatives via une passerelle externe ; le calcul local prend le relais si elles échouent.
    const candidateModels = ['openai', 'mistral'];
    let lastErr: unknown = null;

    for (const modelName of candidateModels) {
      let timer: number | undefined;
      try {
        const controller = new AbortController();
        timer = window.setTimeout(() => controller.abort(), 9000);
        const response = await fetch('https://text.pollinations.ai/openai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            model: modelName,
            seed: Math.floor(Math.random() * 900000) + 100000,
            messages: apiMessages,
            temperature: 0.55,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const raw = await response.text();
        return parseGatewayResponseText(raw);
      } catch (err) {
        lastErr = err;
      } finally {
        if (timer !== undefined) clearTimeout(timer);
      }
    }

    throw lastErr || new Error('Cloud AI unavailable');
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

    const conversationId = conversationStore.activeConversationId;
    const updatedHistory = [...messages, userMsg];
    appendConversationMessage(conversationId, userMsg);
    if (!overridePrompt) setInput('');
    setIsThinking(true);

    // 1. Execute direct local POS / Stock / Expense actions immediately & reliably without asking the LLM for JSON code!
    const localActions = detectLocalStoreActions(promptText, products);
    const badges =
      localActions.length > 0 ? onExecuteAiActions(localActions) : undefined;
    const actionSummary =
      badges && badges.length > 0 ? badges.join(', ') : undefined;

    // Keep stock, sales and expenses actions local and deterministic; never wait for a model to confirm a completed transaction.
    if (actionSummary && badges) {
      const aiMsgId = `ai-local-${Date.now()}`;
      const localConfirmation =
        `## Opération enregistrée localement\n\n` +
        badges.map((badge) => `- **${badge}**`).join('\n') +
        `\n\nLa caisse et le stock ont été mis à jour sur cet appareil. Vérifiez les détails dans **Caisse** ou **Stock**.`;
      appendConversationMessage(conversationId, {
        id: aiMsgId,
        role: 'assistant',
        content: localConfirmation,
        executedBadges: badges,
        timestamp: nowTime(),
      });
      if (settings.autoSpeakAi) {
        setSpeakingMessageId(aiMsgId);
        speakCleanText(localConfirmation, settings.language, settings.voiceModel, () => {
          setSpeakingMessageId((curr) => (curr === aiMsgId ? null : curr));
        });
      }
      setIsThinking(false);
      return;
    }

    try {
      const cleanAiText = await queryCloudAI(updatedHistory, actionSummary);
      const aiMsgId = `ai-${Date.now()}`;

      appendConversationMessage(conversationId, {
        id: aiMsgId,
        role: 'assistant',
        content: cleanAiText,
        executedBadges: badges,
        timestamp: nowTime(),
      });

      if (settings.autoSpeakAi) {
        setSpeakingMessageId(aiMsgId);
        speakCleanText(
          cleanAiText,
          settings.language,
          settings.voiceModel,
          () => {
            setSpeakingMessageId((curr) => (curr === aiMsgId ? null : curr));
          }
        );
      }
    } catch {
      // Seamless local analytical fallback with full KaTeX formulas & GFM tables (never shows errors or code!)
      const smartLocal = generateSmartLocalBusinessResponse(
        promptText,
        settings,
        products,
        sales,
        expenses,
        credits,
        badges
      );
      const aiMsgId = `ai-smart-${Date.now()}`;

      appendConversationMessage(conversationId, {
        id: aiMsgId,
        role: 'assistant',
        content: `**Mode local de secours :** le service IA en ligne ne répond pas pour le moment. Cette réponse est calculée à partir des données enregistrées sur cet appareil ; les demandes générales peuvent être limitées.

${smartLocal}`,
        executedBadges: badges,
        timestamp: nowTime(),
      });

      if (settings.autoSpeakAi) {
        setSpeakingMessageId(aiMsgId);
        speakCleanText(
          smartLocal,
          settings.language,
          settings.voiceModel,
          () => {
            setSpeakingMessageId((curr) => (curr === aiMsgId ? null : curr));
          }
        );
      }
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
    <div className="mx-auto flex min-h-[calc(100vh-135px)] max-w-5xl flex-col rounded-3xl border border-slate-200 bg-white shadow-xs">
      {/* Single persistent conversation and optional speech playback */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-white px-4 py-3 @md:px-6">
        <div className="flex items-center gap-2.5">
          <img
            src={SHOPFLOW_APP_LOGO}
            alt="ShopFlow AI"
            className="h-8 w-8 rounded-xl object-contain ring-1 ring-slate-200/80"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tight text-slate-900">
                ShopFlow <span className="text-[#0A4DFF]">AI</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                En ligne si disponible · secours local
              </span>
            </div>
            <p className="mt-0.5 text-[10px] font-medium text-slate-500">
              Une conversation enregistrée sur cet appareil
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (settings.autoSpeakAi) stopAllSpeech();
            onUpdateVoiceSettings(!settings.autoSpeakAi);
          }}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
            settings.autoSpeakAi
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
          title="Activer ou couper la lecture vocale automatique des réponses"
        >
          {settings.autoSpeakAi ? (
            <><Volume2 className="h-3.5 w-3.5 text-emerald-600" /><span>Lecture auto ON</span></>
          ) : (
            <><VolumeX className="h-3.5 w-3.5 text-slate-400" /><span>Lecture auto OFF</span></>
          )}
        </button>
      </div>

      {/* Main Conversation Canvas */}
      <div className="min-h-[320px] flex-1 overflow-y-auto px-4 py-6 @md:px-10">
        {messages.length === 0 ? (
          <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center py-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 p-2.5 shadow-2xs ring-1 ring-slate-200/80">
              <img
                src={SHOPFLOW_APP_LOGO}
                alt="ShopFlow AI"
                className="h-full w-full object-contain"
              />
            </div>

            <h2 className="mt-4 text-xl font-black tracking-tight text-slate-900 @md:text-2xl">
              Comment puis-je aider{' '}
              <span className="text-[#0A4DFF]">{settings.shopName}</span> ?
            </h2>
            <p className="mt-1.5 max-w-lg text-xs leading-relaxed text-slate-500 @md:text-sm">
              Je peux consulter les données de votre boutique enregistrées sur cet appareil.
              Les actions simples fonctionnent localement ; les réponses générales
              peuvent nécessiter une connexion à un service IA externe gratuit.
            </p>

            <div className="mt-7 grid w-full grid-cols-1 gap-3 text-left @sm:grid-cols-2">
              {STARTER_CARDS.map((card, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(card.prompt)}
                  className="group rounded-2xl border border-slate-200/90 bg-white p-4 transition hover:border-[#0A4DFF] hover:bg-slate-50/70 hover:shadow-xs"
                >
                  <p className="text-xs font-extrabold text-slate-900 group-hover:text-[#0A4DFF]">
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
          <div className="space-y-8">
            {messages.map((msg) =>
              msg.role === 'user' ? (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-3xl bg-slate-100 px-5 py-3 text-sm font-medium text-slate-900 @md:max-w-[75%]">
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ) : (
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
                        {cleanRawModelText(msg.content)}
                      </ReactMarkdown>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-slate-400">
                      <button
                        type="button"
                        onClick={() => handleTogglePlayMessage(msg)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                          speakingMessageId === msg.id
                            ? 'bg-red-50 text-red-600'
                            : 'hover:bg-slate-100 hover:text-slate-700'
                        }`}
                        title="Écouter avec voix naturelle"
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

      {/* Floating ChatGPT Composer Bar */}
      <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3.5 @md:px-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="mx-auto flex max-w-3xl items-end gap-2 rounded-3xl border border-slate-300/90 bg-slate-50/70 px-3.5 py-2 shadow-2xs focus-within:border-[#0A4DFF] focus-within:bg-white"
        >
          <button
            type="button"
            onClick={toggleVoiceDictation}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
              isListening
                ? 'animate-pulse bg-red-600 text-white'
                : 'text-slate-500 hover:bg-slate-200/70 hover:text-slate-900'
            }`}
            title="Parler au micro"
          >
            {isListening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </button>

          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Posez une question à ShopFlow AI..."
            className="min-h-[36px] flex-1 resize-none overflow-hidden bg-transparent py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            aria-label="Votre message pour ShopFlow AI"
          />

          <button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0A4DFF] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
            title="Envoyer"
          >
            <ArrowUp className="h-4 w-4 stroke-[2.5]" />
          </button>
        </form>
      </div>
    </div>
  );
};
