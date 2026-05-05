'use client';

import { useEffect, useState } from 'react';

type State = 'unknown' | 'unsupported' | 'denied' | 'subscribed' | 'prompt';

/**
 * Small "Enable reminders" card. Hides itself if push isn't configured server-side
 * (no VAPID key) or if the user is already subscribed/declined.
 */
export function PushPrompt({ vapidPublicKey }: { vapidPublicKey: string }) {
  const [state, setState] = useState<State>('unknown');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !vapidPublicKey) {
      setState('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setState('denied');
      return;
    }
    navigator.serviceWorker.getRegistration().then(async (reg) => {
      if (!reg) return setState('prompt');
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? 'subscribed' : 'prompt');
    });
  }, [vapidPublicKey]);

  const enable = async () => {
    setError(null);
    setBusy(true);
    try {
      const reg =
        (await navigator.serviceWorker.getRegistration()) ||
        (await navigator.serviceWorker.register('/sw.js'));
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'prompt');
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(vapidPublicKey) as BufferSource,
      });
      const subJson = sub.toJSON();
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys,
        }),
      });
      if (!res.ok) throw new Error('subscribe failed');
      // Send a confirmation push so the user sees it works
      await fetch('/api/push/test', { method: 'POST' });
      setState('subscribed');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not enable reminders');
    } finally {
      setBusy(false);
    }
  };

  if (state === 'unsupported' || state === 'subscribed' || state === 'unknown') return null;

  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-[12px] uppercase tracking-wider text-ink-faint font-semibold">Reminders</p>
      <p className="font-display text-lg font-semibold leading-tight mt-0.5">
        Get a nudge when something matters
      </p>
      <p className="text-sm text-ink-soft mt-1">
        We&rsquo;ll send a notification for things like overdue parasite treatments - never spam.
      </p>
      {state === 'denied' ? (
        <p className="text-[12px] text-warn mt-2">
          Notifications are blocked. Enable them in your browser settings, then refresh.
        </p>
      ) : (
        <button
          onClick={enable}
          disabled={busy}
          className="mt-3 inline-flex h-10 px-4 rounded-full bg-moss text-cream text-sm font-medium disabled:opacity-50"
        >
          {busy ? 'Enabling…' : 'Enable reminders'}
        </button>
      )}
      {error && <p className="text-sm text-danger mt-2">{error}</p>}
    </div>
  );
}

function urlB64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
