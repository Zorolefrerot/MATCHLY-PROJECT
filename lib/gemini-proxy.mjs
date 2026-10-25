export const GEMINI_MODEL = 'gemini-3.5-flash-lite';
const GEMINI_OPENAI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const MAX_IMAGE_DATA_URL_LENGTH = 2_400_000;
const MAX_TEXT_LENGTH = 80_000;

function errorResult(status, message) {
  return {
    status,
    body: { error: { message } },
  };
}

function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > 12) {
    return 'La requête IA est invalide.';
  }

  for (const message of messages) {
    if (!message || !['system', 'user', 'assistant'].includes(message.role)) {
      return 'La requête IA est invalide.';
    }

    if (typeof message.content === 'string') {
      if (message.content.length > MAX_TEXT_LENGTH) return 'La requête IA est trop volumineuse.';
      continue;
    }

    if (!Array.isArray(message.content) || message.content.length > 6) {
      return 'La requête IA est invalide.';
    }

    for (const part of message.content) {
      if (part?.type === 'text' && typeof part.text === 'string' && part.text.length <= MAX_TEXT_LENGTH) {
        continue;
      }
      const dataUrl = part?.type === 'image_url' ? part.image_url?.url : undefined;
      if (
        typeof dataUrl === 'string' &&
        dataUrl.length <= MAX_IMAGE_DATA_URL_LENGTH &&
        /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(dataUrl)
      ) {
        continue;
      }
      return 'La requête IA contient un contenu non pris en charge.';
    }
  }

  return null;
}

/** Server-side Gemini call. The browser never receives the provider key or model setting. */
export async function callGeminiProxy(payload, apiKey = process.env.GEMINI_API_KEY) {
  if (!apiKey) {
    return errorResult(503, 'Le service IA est temporairement indisponible.');
  }

  const validationError = validateMessages(payload?.messages);
  if (validationError) return errorResult(400, validationError);

  const maxTokens = Number.isFinite(payload?.max_tokens)
    ? Math.max(64, Math.min(2_000, Math.floor(payload.max_tokens)))
    : 900;
  const temperature = Number.isFinite(payload?.temperature)
    ? Math.max(0, Math.min(1, payload.temperature))
    : 0.45;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(GEMINI_OPENAI_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: GEMINI_MODEL,
        messages: payload.messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    const rawBody = await response.text();
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      body = { error: { message: 'Réponse invalide du service IA.' } };
    }
    return { status: response.status, body };
  } catch (error) {
    if (error?.name === 'AbortError') {
      return errorResult(504, 'Le service IA met trop de temps à répondre.');
    }
    return errorResult(502, 'Impossible de joindre le service IA pour le moment.');
  } finally {
    clearTimeout(timeout);
  }
}
