"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { del, get, post } from "@/lib/client";
import { Bell, BellOff, Loader2 } from "lucide-react";

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

type Status = "loading" | "unsupported" | "denied" | "enabled" | "disabled" | "unavailable";

export function PushEnableCard() {
  const toast = useToast();
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }

    try {
      const vapid = await get<{ configured: boolean; publicKey: string }>("/api/push/vapid-public-key");
      if (!vapid.configured || !vapid.publicKey) {
        setStatus("unavailable");
        return;
      }
      const subStatus = await get<{ subscribed: boolean; count: number }>("/api/push/subscribe");
      setCount(subStatus.count);
      setStatus(subStatus.subscribed ? "enabled" : "disabled");
    } catch {
      setStatus("disabled");
    }
  }

  async function enable() {
    setBusy(true);
    try {
      const vapid = await get<{ configured: boolean; publicKey: string }>("/api/push/vapid-public-key");
      if (!vapid.publicKey) throw new Error("Push is not configured on the server");

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        toast.push("Notification permission was not granted", "error");
        return;
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
      await post("/api/push/subscribe", {
        endpoint: json.endpoint,
        expirationTime: json.expirationTime,
        keys: json.keys,
        userAgent: navigator.userAgent,
      });

      setStatus("enabled");
      setCount(1);
      toast.push("Push notifications enabled");
    } catch (error) {
      toast.push(error instanceof Error ? error.message : "Could not enable push", "error");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await del("/api/push/subscribe", { endpoint });
      } else {
        await del("/api/push/subscribe", {});
      }
      setStatus("disabled");
      setCount(0);
      toast.push("Push notifications disabled");
    } catch (error) {
      toast.push(error instanceof Error ? error.message : "Could not disable push", "error");
    } finally {
      setBusy(false);
    }
  }

  const label =
    status === "loading"
      ? "Checking…"
      : status === "unsupported"
        ? "Not supported on this browser"
        : status === "denied"
          ? "Blocked in browser settings"
          : status === "unavailable"
            ? "Server push keys not configured"
            : status === "enabled"
              ? `Enabled (${count} device${count === 1 ? "" : "s"})`
              : "Off — enable to get ticket alerts";

  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-brand-soft p-3 text-brand">
          {status === "enabled" ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-ink">Ticket push notifications</h3>
          <p className="mt-1 text-sm text-muted">
            Get a phone notification when a ticket is assigned. Tap it to open My tickets.
          </p>
          <p className="mt-2 text-xs font-semibold text-ink">{label}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {status === "enabled" ? (
              <Button type="button" variant="secondary" disabled={busy} onClick={() => void disable()}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Disable
              </Button>
            ) : status === "disabled" || status === "denied" ? (
              <Button type="button" disabled={busy || status === "denied"} onClick={() => void enable()}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Enable notifications
              </Button>
            ) : null}
          </div>
          {status === "denied" ? (
            <p className="mt-2 text-xs text-amber-700">
              Open browser site settings and allow notifications for this app, then try again.
            </p>
          ) : null}
          {status === "unsupported" ? (
            <p className="mt-2 text-xs text-muted">
              On iPhone, use Safari → Share → Add to Home Screen, open the app icon, then enable notifications here.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
