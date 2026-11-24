import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const vapidPublicKey = Deno.env.get('SHOPFLOW_VAPID_PUBLIC_KEY') || '';
const vapidPrivateKey = Deno.env.get('SHOPFLOW_VAPID_PRIVATE_KEY') || '';
const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

const strings: Record<string, Record<string, string>> = {
  fr: { sale: 'Nouvelle vente', stock: 'Alerte de stock', out: 'Rupture de stock', enabled: 'Notifications ShopFlow activées', test: 'Cette boutique peut maintenant vous envoyer des alertes.' },
  en: { sale: 'New sale', stock: 'Low stock alert', out: 'Out of stock', enabled: 'ShopFlow notifications enabled', test: 'This shop can now send you alerts.' },
  ln: { sale: 'Koteka ya sika', stock: 'Likebisi ya biloko', out: 'Eloko esili', enabled: 'Mayebisi ya ShopFlow efungwami', test: 'Boutique oyo ekoki kotindela yo mayebisi.' },
  sw: { sale: 'Mauzo mapya', stock: 'Tahadhari ya bidhaa', out: 'Bidhaa imeisha', enabled: 'Arifa za ShopFlow zimewashwa', test: 'Duka hili sasa linaweza kukutumia arifa.' },
  zh: { sale: '新销售', stock: '库存提醒', out: '商品已售罄', enabled: 'ShopFlow 通知已开启', test: '此店铺现在可以向你发送提醒。' },
};

function json(status: number, value: unknown) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function languageFor(value: unknown) {
  const language = typeof value === 'string' ? value.split('-')[0] : 'fr';
  return strings[language] ? language : 'fr';
}

function short(value: unknown, max: number) {
  return String(value ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
}

async function sendToSubscriptions(
  shopId: string,
  recipientIds: string[],
  title: string,
  body: string,
  data: Record<string, unknown>,
) {
  if (!vapidPublicKey || !vapidPrivateKey) throw new Error('push_vapid_not_configured');
  webpush.setVapidDetails('https://shopflow-drc.onrender.com', vapidPublicKey, vapidPrivateKey);
  if (!recipientIds.length) return { sent: 0, removed: 0 };

  const { data: subscriptions, error } = await admin
    .from('shopflow_push_subscriptions')
    .select('id,user_id,subscription')
    .eq('shop_id', shopId)
    .in('user_id', recipientIds);
  if (error) throw error;

  let sent = 0;
  let removed = 0;
  const message = JSON.stringify({ title, body, data: { ...data, url: '/app/' } });
  await Promise.all((subscriptions || []).map(async (row) => {
    try {
      await webpush.sendNotification(row.subscription, message, { TTL: 3600 });
      sent += 1;
    } catch (error) {
      const status = Number((error as { statusCode?: number })?.statusCode);
      if (status === 404 || status === 410) {
        const { error: deleteError } = await admin.from('shopflow_push_subscriptions').delete().eq('id', row.id);
        if (!deleteError) removed += 1;
      }
    }
  }));
  return { sent, removed };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  const authorization = request.headers.get('Authorization') || '';
  if (!authorization.startsWith('Bearer ')) return json(401, { error: 'authentication_required' });
  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authorization } },
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return json(401, { error: 'invalid_session' });

  let payload: Record<string, unknown>;
  try { payload = await request.json(); } catch { return json(400, { error: 'invalid_json' }); }
  const action = String(payload.action || '');
  if (action === 'config') {
    if (!vapidPublicKey) return json(503, { error: 'push_not_configured' });
    return json(200, { publicKey: vapidPublicKey });
  }

  const shopId = String(payload.shopId || '');
  if (!/^[0-9a-f-]{36}$/i.test(shopId)) return json(400, { error: 'invalid_shop' });
  const { data: membership, error: membershipError } = await admin
    .from('shopflow_shop_members')
    .select('shop_id,role')
    .eq('shop_id', shopId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (membershipError || !membership) return json(403, { error: 'shop_access_denied' });

  if (action === 'test') {
    const language = languageFor(user.user_metadata?.shopflow_language);
    const copy = strings[language];
    try {
      const result = await sendToSubscriptions(shopId, [user.id], copy.enabled, copy.test, { type: 'test' });
      return json(200, result);
    } catch {
      return json(503, { error: 'push_delivery_failed' });
    }
  }

  if (action !== 'event') return json(400, { error: 'invalid_action' });
  const eventType = String(payload.eventType || '');
  const recordId = short(payload.recordId, 120);
  if (!recordId || !['new_sale', 'low_stock'].includes(eventType)) return json(400, { error: 'invalid_event' });
  const recordType = eventType === 'new_sale' ? 'sale' : 'product';
  const { data: record, error: recordError } = await admin
    .from('shopflow_records')
    .select('record_id,payload,updated_at')
    .eq('shop_id', shopId)
    .eq('record_type', recordType)
    .eq('record_id', recordId)
    .is('deleted_at', null)
    .maybeSingle();
  if (recordError || !record) return json(404, { error: 'record_not_found' });

  const data = record.payload as Record<string, unknown>;
  const { data: settingsRow } = await admin
    .from('shopflow_records')
    .select('payload')
    .eq('shop_id', shopId)
    .eq('record_type', 'settings')
    .eq('record_id', 'current')
    .is('deleted_at', null)
    .maybeSingle();
  const language = languageFor((settingsRow?.payload as Record<string, unknown> | undefined)?.language);
  const copy = strings[language];
  let title = '';
  let body = '';
  let eventKey = '';
  if (eventType === 'new_sale') {
    title = copy.sale;
    const name = short(data.productName || data.product_name || 'Article', 90);
    const quantity = Math.max(0, Number(data.quantity) || 0);
    const total = Math.max(0, Number(data.totalRevenueFC) || 0);
    body = `${name} · ${quantity} · ${total.toLocaleString(language)} FC`;
    eventKey = `sale:${recordId}`;
  } else {
    const stock = Number(data.stock);
    const minimum = Number(data.minStockAlert);
    if (!Number.isFinite(stock) || !Number.isFinite(minimum) || stock > minimum) return json(200, { skipped: 'stock_not_low' });
    const name = short(data.name || 'Article', 90);
    title = stock <= 0 ? copy.out : copy.stock;
    body = `${name} · ${Math.max(0, stock)} ${short(data.unit || 'pcs', 16)}`;
    eventKey = `stock:${recordId}:${String(data.stock)}:${record.updated_at}`;
  }

  const { data: members, error: memberError } = await admin
    .from('shopflow_shop_members')
    .select('user_id')
    .eq('shop_id', shopId);
  if (memberError) return json(500, { error: 'recipients_unavailable' });
  const recipientIds = [...new Set((members || []).map((member) => member.user_id as string))];
  if (!recipientIds.length) return json(200, { sent: 0 });
  const inboxRows = recipientIds.map((userId) => ({
    user_id: userId,
    shop_id: shopId,
    event_key: eventKey,
    notification_type: eventType,
    title,
    body,
    data: { recordId, eventType },
  }));
  const { data: inserted, error: inboxError } = await admin
    .from('shopflow_push_notifications')
    .upsert(inboxRows, { onConflict: 'user_id,shop_id,event_key', ignoreDuplicates: true })
    .select('user_id');
  if (inboxError) return json(500, { error: 'notification_store_failed' });
  const newRecipients = [...new Set((inserted || []).map((row) => row.user_id as string))];
  if (!newRecipients.length) return json(200, { sent: 0, duplicate: true });
  try {
    const result = await sendToSubscriptions(shopId, newRecipients, title, body, { type: eventType, recordId });
    return json(200, result);
  } catch {
    return json(503, { error: 'push_delivery_failed' });
  }
});
