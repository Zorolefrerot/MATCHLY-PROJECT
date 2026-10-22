import { AppLanguage, VoiceModelId } from '../types';

export interface VoiceModelOption {
  id: VoiceModelId;
  name: string;
  gender: 'female' | 'male' | 'neutral';
  descriptionFr: string;
  openAiVoice: string;
  pitch: number;
  rate: number;
}

export const VOICE_MODELS: VoiceModelOption[] = [
  {
    id: 'nova',
    name: 'Nova — Douce & Naturelle',
    gender: 'female',
    descriptionFr: 'Voix féminine chaleureuse et fluide (style ChatGPT)',
    openAiVoice: 'nova',
    pitch: 1.06,
    rate: 1.0,
  },
  {
    id: 'onyx',
    name: 'Onyx — Grave & Conseiller Pro',
    gender: 'male',
    descriptionFr: 'Voix masculine posée, claire et rassurante',
    openAiVoice: 'onyx',
    pitch: 0.88,
    rate: 0.98,
  },
  {
    id: 'shimmer',
    name: 'Shimmer — Posée & Limpide',
    gender: 'female',
    descriptionFr: 'Voix féminine calme, idéale pour les bilans chiffrés',
    openAiVoice: 'shimmer',
    pitch: 1.12,
    rate: 0.95,
  },
  {
    id: 'echo',
    name: 'Echo — Dynamique & Rapide',
    gender: 'male',
    descriptionFr: 'Voix masculine énergique pour le comptoir rapide',
    openAiVoice: 'echo',
    pitch: 0.96,
    rate: 1.06,
  },
  {
    id: 'alloy',
    name: 'Alloy — Studio Équilibrée',
    gender: 'neutral',
    descriptionFr: 'Voix neutre très nette et articulée',
    openAiVoice: 'alloy',
    pitch: 1.0,
    rate: 1.0,
  },
  {
    id: 'device_native',
    name: 'Système Hors-Ligne Instantané',
    gender: 'neutral',
    descriptionFr: 'Utilise directement le moteur vocal local du téléphone',
    openAiVoice: 'alloy',
    pitch: 1.0,
    rate: 1.0,
  },
];

/**
 * Cleans ANY Markdown + LaTeX + Emojis + Special Symbols into pure, natural human speech text
 * so the voice engine NEVER pronounces asterisks, slashes, hashes, dollar delimiters, pipes, or symbols.
 */
export function cleanTextForSpeech(raw: string, lang: AppLanguage): string {
  if (!raw) return '';

  const words = {
    divBy:
      lang === 'en'
        ? ' divided by '
        : lang === 'zh'
          ? ' 除以 '
          : lang === 'sw'
            ? ' gawanya kwa '
            : ' divisé par ',
    times:
      lang === 'en'
        ? ' times '
        : lang === 'zh'
          ? ' 乘以 '
          : lang === 'sw'
            ? ' mara '
            : ' fois ',
    plus:
      lang === 'en'
        ? ' plus '
        : lang === 'zh'
          ? ' 加 '
          : lang === 'sw'
            ? ' jumlisha '
            : ' plus ',
    minus:
      lang === 'en'
        ? ' minus '
        : lang === 'zh'
          ? ' 减 '
          : lang === 'sw'
            ? ' toa '
            : ' moins ',
    equals:
      lang === 'en'
        ? ' equals '
        : lang === 'zh'
          ? ' 等于 '
          : lang === 'sw'
            ? ' sawa na '
            : ' égale ',
    percent:
      lang === 'en'
        ? ' percent '
        : lang === 'zh'
          ? ' 百分之 '
          : lang === 'sw'
            ? ' asilimia '
            : ' pourcent ',
    dollars:
      lang === 'zh' ? ' 美元 ' : ' dollars ',
    andWord:
      lang === 'en'
        ? ' and '
        : lang === 'zh'
          ? ' 和 '
          : lang === 'sw'
            ? ' na '
            : ' et ',
  };

  let text = raw;

  // 1. Remove hidden action blocks completely
  text = text.replace(/<shopflow_action>[\s\S]*?<\/shopflow_action>/gi, ' ');

  // 2. Convert inline & display math expressions cleanly BEFORE general text rules
  const cleanMathSegment = (expr: string) =>
    expr
      .replace(/\\text\{([^{}]*)\}/g, ' $1 ')
      .replace(/\\textbf\{([^{}]*)\}/g, ' $1 ')
      .replace(/\\mathrm\{([^{}]*)\}/g, ' $1 ')
      .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, ` $1${words.divBy}$2 `)
      .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, ` $1${words.divBy}$2 `)
      .replace(/\\sqrt\{([^{}]*)\}/g, ' $1 ')
      .replace(/\\times|\\cdot|\*/g, words.times)
      .replace(/\\div|\//g, words.divBy)
      .replace(/\\pm/g, words.plus)
      .replace(/\+/g, words.plus)
      .replace(/−|-/g, words.minus)
      .replace(/\\approx|\\simeq|\\leq|\\geq|=/g, words.equals)
      .replace(/\\,/g, '')
      .replace(/\\[a-zA-Z]+/g, ' ');

  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, m) => cleanMathSegment(m));
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, m) => cleanMathSegment(m));
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, m) => cleanMathSegment(m));
  // Inline $...$ where content is NOT pure currency like "$50 ... $100"
  text = text.replace(/\$([^$\n]{1,120})\$/g, (_, m) => cleanMathSegment(m));

  // Also handle any remaining unclosed LaTeX macros outside delimiters
  text = text
    .replace(/\\text\{([^{}]*)\}/g, '$1')
    .replace(/\\textbf\{([^{}]*)\}/g, '$1')
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, `$1${words.divBy}$2`)
    .replace(/\\times|\\cdot/g, words.times)
    .replace(/\\div/g, words.divBy)
    .replace(/\\approx|\\simeq/g, words.equals)
    .replace(/\\[a-zA-Z]+/g, ' ');

  // 3. Clean Markdown links, code fences, table dividers, headers, emphasis
  text = text.replace(/```[\s\S]*?```/g, (block) =>
    block.replace(/```[a-zA-Z]*\n?/g, ' ')
  );
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  text = text.replace(/^\s*\|?[\s:-]+\|[\s|:-]*$/gm, ' ');
  text = text.replace(/\|/g, ', ');

  // 4. Convert currency, percentages, equals, plus, ampersand into natural spoken words
  text = text.replace(/\$\s*(\d+(?:[.,]\d+)?)/g, `$1${words.dollars}`);
  text = text.replace(/(\d+(?:[.,]\d+)?)\s*\$/g, `$1${words.dollars}`);
  text = text.replace(/(\d)\s*%/g, `$1${words.percent}`);
  text = text.replace(/%/g, words.percent);
  text = text.replace(/\s*=\s*/g, words.equals);
  text = text.replace(/\s*\+\s*/g, words.plus);
  text = text.replace(/\s*&\s*/g, words.andWord);

  // 5. Replace multiple dashes or bullet dashes cleanly
  text = text.replace(/[-–—]{2,}/g, ', ');
  text = text.replace(/^\s*[-–—•●▪►]+\s*/gm, '');

  // 6. STRICT UNICODE ALLOWLIST: keep ONLY human letters (all languages/accents/Chinese), digits, and natural prosody punctuation!
  // Zero special symbols (*, #, \, $, %, |, {}, [], ^, _, ~, `, <>, @, emojis, arrows) can EVER pass through.
  text = text.replace(/[^\p{L}\p{N}\s.,;:?!'’()-]/gu, ' ');

  // 7. Collapse whitespace & clean punctuation spacing
  text = text.replace(/\s+,/g, ',');
  text = text.replace(/,{2,}/g, ',');
  text = text.replace(/\n+/g, '. ');
  text = text.replace(/\.\s*\./g, '.');
  text = text.replace(/\s{2,}/g, ' ').trim();

  return text;
}

let activeAudioElement: HTMLAudioElement | null = null;

export function stopAllSpeech(): void {
  if (activeAudioElement) {
    activeAudioElement.pause();
    activeAudioElement.currentTime = 0;
    activeAudioElement = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Speaks cleaned text using either Neural OpenAI Audio (alloy/nova/onyx/shimmer/echo)
 * or calibrated local SpeechSynthesis voice matching gender + language, with instant fallback!
 */
export async function speakCleanText(
  rawText: string,
  lang: AppLanguage,
  voiceModelId: VoiceModelId,
  onEnd?: () => void
): Promise<void> {
  stopAllSpeech();

  const clean = cleanTextForSpeech(rawText, lang);
  if (!clean) {
    onEnd?.();
    return;
  }

  const profile =
    VOICE_MODELS.find((v) => v.id === voiceModelId) || VOICE_MODELS[0];

  // Try Neural Cloud Voice first unless user explicitly selected local offline engine
  if (voiceModelId !== 'device_native') {
    try {
      const clipped = clean.slice(0, 750);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5500);

      const resp = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openai-audio',
          modalities: ['text', 'audio'],
          audio: { voice: profile.openAiVoice, format: 'mp3' },
          messages: [
            {
              role: 'system',
              content:
                'Read the exact user text naturally, warmly, and clearly without adding or changing a single word.',
            },
            { role: 'user', content: clipped },
          ],
        }),
      });
      clearTimeout(timeout);

      if (resp.ok) {
        const ct = resp.headers.get('content-type') || '';
        if (ct.includes('audio/')) {
          const blob = await resp.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          activeAudioElement = audio;
          audio.onended = () => {
            URL.revokeObjectURL(url);
            activeAudioElement = null;
            onEnd?.();
          };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            activeAudioElement = null;
            speakWithNativeBrowserVoice(clean, lang, profile, onEnd);
          };
          await audio.play();
          return;
        } else if (ct.includes('application/json')) {
          const data = await resp.json();
          const b64Audio = data?.choices?.[0]?.message?.audio?.data;
          if (b64Audio) {
            const audio = new Audio(`data:audio/mp3;base64,${b64Audio}`);
            activeAudioElement = audio;
            audio.onended = () => {
              activeAudioElement = null;
              onEnd?.();
            };
            await audio.play();
            return;
          }
        }
      }
    } catch {
      // Smoothly fallback to calibrated native voice below
    }
  }

  speakWithNativeBrowserVoice(clean, lang, profile, onEnd);
}

function speakWithNativeBrowserVoice(
  cleanText: string,
  lang: AppLanguage,
  profile: VoiceModelOption,
  onEnd?: () => void
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }

  const utter = new SpeechSynthesisUtterance(cleanText);
  const targetLangPrefix =
    lang === 'en' ? 'en' : lang === 'zh' ? 'zh' : lang === 'sw' ? 'sw' : 'fr';

  utter.lang =
    lang === 'en'
      ? 'en-US'
      : lang === 'zh'
        ? 'zh-CN'
        : lang === 'sw'
          ? 'sw-KE'
          : 'fr-FR';
  utter.pitch = profile.pitch;
  utter.rate = profile.rate;

  const voices = window.speechSynthesis.getVoices();
  const matchingLangVoices = voices.filter((v) =>
    v.lang.toLowerCase().startsWith(targetLangPrefix)
  );

  if (matchingLangVoices.length > 0) {
    const preferFemale = profile.gender === 'female';
    const preferMale = profile.gender === 'male';
    const picked =
      matchingLangVoices.find((v) => {
        const n = v.name.toLowerCase();
        if (preferFemale) {
          return /julie|hortense|amelie|audrey|denise|eloise|samantha|victoria|female|google français/i.test(
            n
          );
        }
        if (preferMale) {
          return /paul|thomas|henri|daniel|alex|male/i.test(n);
        }
        return false;
      }) ||
      matchingLangVoices[
        preferMale && matchingLangVoices.length > 1 ? 1 : 0
      ];

    if (picked) utter.voice = picked;
  }

  utter.onend = () => onEnd?.();
  utter.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utter);
}
