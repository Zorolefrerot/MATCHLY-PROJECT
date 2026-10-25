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

export interface ChatApiConfig {
  endpoint: string;
  apiKey: string;
  model: string;
}

function responseErrorMessage(status: number, body: string): string {
  let detail = '';
  try {
    const parsed = JSON.parse(body);
    detail = String(parsed?.error?.message || parsed?.message || '');
  } catch {
    detail = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180);
  }

  if (status === 401 || status === 403) {
    return 'Clé API refusée. Vérifiez la clé et les autorisations de votre fournisseur.';
  }
  if (status === 404) {
    return 'Modèle ou adresse API introuvable. Vérifiez le modèle sélectionné.';
  }
  if (status === 429) {
    return 'Limite de requêtes atteinte. Réessayez plus tard ou vérifiez le quota du fournisseur.';
  }
  return detail || `Le fournisseur IA a répondu avec l’erreur HTTP ${status}.`;
}

/** Calls an OpenAI-compatible chat completion endpoint without sending secrets to this repository. */
export async function requestChatCompletion(
  config: ChatApiConfig,
  messages: ChatApiMessage[],
  options: { timeoutMs?: number; maxTokens?: number } = {}
): Promise<string> {
  const endpoint = config.endpoint.trim();
  const apiKey = config.apiKey.trim();
  const model = config.model.trim();

  if (!endpoint || !apiKey || !model) {
    throw new Error('Renseignez le fournisseur, le modèle et la clé API dans Paramètres → IA.');
  }

  let parsedEndpoint: URL;
  try {
    parsedEndpoint = new URL(endpoint);
  } catch {
    throw new Error('L’adresse API n’est pas valide.');
  }
  if (parsedEndpoint.protocol !== 'https:' && parsedEndpoint.hostname !== 'localhost') {
    throw new Error('Pour protéger votre clé, l’adresse API doit utiliser HTTPS.');
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 25_000
  );

  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
    if (parsedEndpoint.hostname === 'openrouter.ai') {
      headers['HTTP-Referer'] = window.location.origin;
      headers['X-Title'] = 'ShopFlow';
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.45,
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
      throw new Error('Le fournisseur IA ne répond pas encore. Réessayez dans un instant.');
    }
    if (error instanceof TypeError) {
      throw new Error('Connexion API impossible. Vérifiez Internet et que le fournisseur autorise les requêtes depuis le navigateur.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function testChatApi(config: ChatApiConfig): Promise<string> {
  const response = await requestChatCompletion(
    config,
    [{ role: 'user', content: 'Réponds uniquement : ShopFlow API OK.' }],
    { timeoutMs: 18_000, maxTokens: 40 }
  );
  return response;
}
