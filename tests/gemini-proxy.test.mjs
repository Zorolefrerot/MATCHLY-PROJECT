import assert from 'node:assert/strict';
import test from 'node:test';
import { callGeminiProxy, GEMINI_MODEL } from '../lib/gemini-proxy.mjs';

test('returns a safe unavailable response when the server secret is absent', async () => {
  const result = await callGeminiProxy({ messages: [{ role: 'user', content: 'Bonjour' }] }, '');
  assert.equal(result.status, 503);
  assert.match(result.body.error.message, /indisponible/i);
});

test('rejects malformed messages without contacting the provider', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error('fetch should not be called for invalid input');
  };
  try {
    const result = await callGeminiProxy({ messages: [{ role: 'user', content: 12 }] }, 'test-secret');
    assert.equal(result.status, 400);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('keeps model selection and provider credentials on the server', async () => {
  const originalFetch = globalThis.fetch;
  let upstreamUrl;
  let upstreamOptions;
  globalThis.fetch = async (url, options) => {
    upstreamUrl = url;
    upstreamOptions = options;
    return new Response(JSON.stringify({ choices: [{ message: { content: 'ShopFlow OK' } }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const result = await callGeminiProxy(
      { messages: [{ role: 'user', content: 'Bonjour' }], model: 'client-selected-model' },
      'server-only-test-secret'
    );
    const sentBody = JSON.parse(upstreamOptions.body);
    assert.equal(result.status, 200);
    assert.match(upstreamUrl, /generativelanguage\.googleapis\.com/);
    assert.equal(upstreamOptions.headers.Authorization, 'Bearer server-only-test-secret');
    assert.equal(sentBody.model, GEMINI_MODEL);
    assert.notEqual(sentBody.model, 'client-selected-model');
    assert.equal(JSON.stringify(result.body).includes('server-only-test-secret'), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
