import { useEffect, useState } from 'react';
import { Bell, BellOff, LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';

type PushStatus = 'checking' | 'off' | 'on' | 'unsupported' | 'error';

function applicationServerKey(value: string): ArrayBuffer {
  const padding = '='.repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0)).buffer as ArrayBuffer;
}

function pushIsSupported(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return window.isSecureContext && 'Notification' in window && 'serviceWorker' in navigator &&
    'PushManager' in window && (!isIos || isStandalone);
}

export function PushNotificationsControl({ userId, shopId }: { userId: string; shopId: string }) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<PushStatus>('checking');
  const [busy, setBusy] = useState(false);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    let cancelled = false;
    const inspect = async () => {
      setErrorText('');
      if (!supabase || !pushIsSupported()) {
        setStatus('unsupported');
        return;
      }
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          if (!cancelled) setStatus('off');
          return;
        }
        const { data, error } = await supabase
          .from('shopflow_push_subscriptions')
          .select('id')
          .eq('user_id', userId)
          .eq('shop_id', shopId)
          .eq('endpoint', subscription.endpoint)
          .maybeSingle();
        if (error) throw error;
        if (!cancelled) setStatus(data ? 'on' : 'off');
      } catch {
        if (!cancelled) setStatus('error');
      }
    };
    void inspect();
    return () => { cancelled = true; };
  }, [userId, shopId]);

  const enable = async () => {
    if (!supabase || busy) return;
    setBusy(true);
    setErrorText('');
    try {
      if (Notification.permission === 'denied') throw new Error('permission_denied');
      const permission = Notification.permission === 'granted'
        ? 'granted'
        : await Notification.requestPermission();
      if (permission !== 'granted') throw new Error('permission_not_granted');

      const { data: config, error: configError } = await supabase.functions.invoke('shopflow-push', {
        body: { action: 'config' },
      });
      if (configError || typeof config?.publicKey !== 'string') throw new Error('push_config_unavailable');

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey(config.publicKey),
        });
      }
      const serialized = subscription.toJSON();
      const { error: saveError } = await supabase.from('shopflow_push_subscriptions').upsert({
        user_id: userId,
        shop_id: shopId,
        endpoint: subscription.endpoint,
        subscription: serialized,
      }, { onConflict: 'user_id,shop_id,endpoint' });
      if (saveError) throw saveError;

      const { error: testError } = await supabase.functions.invoke('shopflow-push', {
        body: { action: 'test', shopId },
      });
      if (testError) throw new Error('push_test_failed');
      setStatus('on');
    } catch (error) {
      setStatus('error');
      const code = error instanceof Error ? error.message : '';
      setErrorText(t(code === 'permission_denied' || code === 'permission_not_granted'
        ? 'push.permissionDenied'
        : code === 'push_config_unavailable' || code === 'push_test_failed'
          ? 'push.setupFailed'
          : 'push.tryAgain'));
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    if (!supabase || busy) return;
    setBusy(true);
    setErrorText('');
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const { error } = await supabase.from('shopflow_push_subscriptions').delete()
          .eq('user_id', userId).eq('shop_id', shopId).eq('endpoint', subscription.endpoint);
        if (error) throw error;
        await subscription.unsubscribe();
      }
      setStatus('off');
    } catch {
      setErrorText(t('push.tryAgain'));
    } finally {
      setBusy(false);
    }
  };

  if (status === 'unsupported') {
    return <span className="max-w-52 text-[11px] leading-snug text-slate-500">{t('push.unsupported')}</span>;
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      {status === 'on' ? (
        <>
          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1.5 text-[11px] font-semibold text-emerald-800" role="status">
            <Bell className="h-3.5 w-3.5" />{t('push.enabled')}
          </span>
          <button type="button" disabled={busy} onClick={() => { void enable(); }} className="rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-bold text-slate-700 disabled:opacity-50">
            {busy ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : t('push.test')}
          </button>
          <button type="button" disabled={busy} onClick={() => { void disable(); }} aria-label={t('push.disable')} title={t('push.disable')} className="rounded-lg border border-slate-200 p-1.5 text-slate-500 disabled:opacity-50">
            <BellOff className="h-3.5 w-3.5" />
          </button>
        </>
      ) : (
        <button type="button" disabled={busy || status === 'checking'} onClick={() => { void enable(); }} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[11px] font-bold text-blue-800 disabled:opacity-50">
          {busy || status === 'checking' ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
          {t(status === 'checking' ? 'push.checking' : 'push.enable')}
        </button>
      )}
      {errorText && <span role="alert" className="basis-full text-[11px] text-rose-700">{errorText}</span>}
    </div>
  );
}
