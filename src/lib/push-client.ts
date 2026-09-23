import { get, post } from "@/lib/client";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/**
 * Register SW + subscribe + save on server.
 * Call from a user gesture when permission is still "default" (e.g. login button).
 * Safe to call when permission is already "granted" (silent re-subscribe).
 */
export async function ensurePushSubscription(): Promise<{ ok: boolean; reason?: string }> {
  if (!isPushSupported()) {
    return { ok: false, reason: "unsupported" };
  }
  if (Notification.permission === "denied") {
    return { ok: false, reason: "denied" };
  }

  const vapid = await get<{ configured: boolean; publicKey: string }>("/api/push/vapid-public-key");
  if (!vapid.configured || !vapid.publicKey) {
    return { ok: false, reason: "unavailable" };
  }

  if (Notification.permission === "default") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { ok: false, reason: "denied" };
    }
  }

  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid.publicKey),
    }));

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return { ok: false, reason: "invalid" };
  }

  await post("/api/push/subscribe", {
    endpoint: json.endpoint,
    expirationTime: json.expirationTime,
    keys: json.keys,
    userAgent: navigator.userAgent,
  });

  return { ok: true };
}
