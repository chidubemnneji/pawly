import webpush from 'web-push';

const PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT ?? 'mailto:hello@pawly.app';

if (PUBLIC && PRIVATE) {
  webpush.setVapidDetails(SUBJECT, PUBLIC, PRIVATE);
}

export const pushReady = !!(PUBLIC && PRIVATE);
export const VAPID_PUBLIC_KEY = PUBLIC ?? '';

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

/**
 * Send a push to a single subscription. Returns true if delivered, false on
 * any error (including 410 Gone, which the caller should use to delete the sub).
 */
export async function sendPush(
  subscription: { endpoint: string; p256dh: string; authSecret: string },
  payload: PushPayload,
): Promise<{ ok: boolean; gone: boolean }> {
  if (!pushReady) return { ok: false, gone: false };
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.authSecret },
      },
      JSON.stringify(payload),
    );
    return { ok: true, gone: false };
  } catch (err) {
    const status = (err as { statusCode?: number })?.statusCode;
    return { ok: false, gone: status === 404 || status === 410 };
  }
}
