import { parseGatewayResponseText } from './aiSanitizer';

export type ChatApiContent =
  | string
  | Array<
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string } }
    >;

export interface ChatApiMessage {
  role: 'system' | 'user' | 'assistant';
  content: ChatApiContent;
}

function responseErrorMessage(status: number, body: string): string {
  let detail = '';
  try {
    const parsed = JSON.parse(body);
    detail = String(parsed?.error?.message || parsed?.message || '');
  } catch {
    detail = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180);
  }

  if (status === 429) {
    return 'Le service IA est momentanément très sollicité. Réessayez plus tard.';
  }
  if (status === 503) {
    return 'Le service IA est temporairement indisponible. Réessayez plus tard.';
  }
  if (status === 401 || status === 403) {
    return 'Le service IA est momentanément indisponible. Réessayez plus tard.';
  }
  return detail || 'Impossible de joindre le service IA pour le moment.';
}

/** Sends requests through ShopFlow's same-origin server proxy; no provider secret reaches the client. */
export async function requestChatCompletion(
  messages: ChatApiMessage[],
  options: { timeoutMs?: number; maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 25_000
  );
  const configuredBaseUrl = import.meta.env.VITE_SHOPFLOW_API_BASE_URL?.trim();
  const apiUrl = configuredBaseUrl
    ? `${configuredBaseUrl.replace(/\/+$/, '')}/api/ai`
    : '/api/ai';

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        messages,
        temperature: options.temperature ?? 0.45,
        max_tokens: options.maxTokens ?? 900,
      }),
    });
    const body = await response.text();
    if (!response.ok) {
      throw new Error(responseErrorMessage(response.status, body));
    }
    return parseGatewayResponseText(body);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Le service IA met trop de temps à répondre. Réessayez dans un instant.');
    }
    if (error instanceof TypeError) {
      throw new Error('Le service IA est inaccessible pour le moment. Vérifiez votre connexion.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}
