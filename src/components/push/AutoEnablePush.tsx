"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ensurePushSubscription, isPushSupported } from "@/lib/push-client";
import { get } from "@/lib/client";
import { Bell, Loader2, X } from "lucide-react";

/**
 * On every field-app visit:
 * - If browser already allowed notifications → subscribe silently
 * - If not yet asked → show a required prompt so users enable without opening Account
 */
export function AutoEnablePush() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void bootstrap();
  }, []);

  async function bootstrap() {
    if (!isPushSupported()) return;

    try {
      // Already allowed → turn on automatically (no Account visit needed)
      if (Notification.permission === "granted") {
        await ensurePushSubscription();
        return;
      }

      if (Notification.permission === "denied") return;

      const status = await get<{ subscribed: boolean }>("/api/push/subscribe").catch(() => ({ subscribed: false }));
      if (status.subscribed) return;

      // Not enabled yet — prompt on open (browser still requires one tap to Allow)
      setOpen(true);
    } catch {
      /* ignore */
    }
  }

  async function turnOn() {
    setBusy(true);
    setError("");
    try {
      const result = await ensurePushSubscription();
      if (!result.ok) {
        setError(
          result.reason === "denied"
            ? "Permission blocked. Allow notifications in browser settings."
            : "Could not enable notifications on this device."
        );
        if (result.reason === "denied") setOpen(false);
        return;
      }
      setOpen(false);
    } catch {
      setError("Could not enable notifications on this device.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-navy/50 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-brand-soft p-3 text-brand">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink">Turn on ticket alerts</h2>
              <p className="mt-1 text-sm text-muted">
                Get notified when a ticket is assigned. Tap Allow on the next browser prompt — you
                only need to do this once.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-xl p-1 text-muted hover:bg-slate-100"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {error ? <p className="mt-3 text-xs text-red-700">{error}</p> : null}
        <div className="mt-5 grid gap-2">
          <Button type="button" className="w-full" disabled={busy} onClick={() => void turnOn()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Enable notifications
          </Button>
          <Button type="button" variant="secondary" className="w-full" disabled={busy} onClick={() => setOpen(false)}>
            Later
          </Button>
        </div>
      </div>
    </div>
  );
}
