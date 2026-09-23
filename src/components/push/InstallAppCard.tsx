"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Download, CheckCircle2, Share } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || Boolean(nav.standalone);
}

export function InstallAppCard({ compact = false }: { compact?: boolean }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    setIos(isIos());
    try {
      if (localStorage.getItem("dsdf-install-dismissed") === "1") setDismissed(true);
    } catch {
      /* ignore */
    }

    // Register SW early — helps Chrome treat the site as installable
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    const onBip = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!deferred) return;
    setBusy(true);
    try {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
    } finally {
      setBusy(false);
    }
  }

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem("dsdf-install-dismissed", "1");
    } catch {
      /* ignore */
    }
  }

  if (installed) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
        <div className="flex items-center gap-2 font-semibold">
          <CheckCircle2 className="h-4 w-4" />
          App installed on this device
        </div>
        <p className="mt-1 text-xs text-green-800">
          Open it from your home screen for the best notifications experience.
        </p>
      </div>
    );
  }

  if (compact && dismissed && !deferred) return null;

  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-brand-soft p-3 text-brand">
          <Download className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-ink">Install field app</h3>
          <p className="mt-1 text-sm text-muted">
            Browsers often hide the install popup. Use the button below, or follow the manual steps.
            On iPhone this is required for push notifications.
          </p>

          {deferred ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" disabled={busy} onClick={() => void install()}>
                Install app
              </Button>
              {compact ? (
                <Button type="button" variant="secondary" onClick={dismiss}>
                  Not now
                </Button>
              ) : null}
            </div>
          ) : null}

          {!deferred ? (
            <div className="mt-4 space-y-3 text-sm text-ink">
              {ios ? (
                <ol className="list-decimal space-y-2 pl-5">
                  <li className="flex flex-wrap items-center gap-1">
                    Tap <Share className="inline h-4 w-4" /> <b>Share</b> in Safari
                  </li>
                  <li>
                    Scroll and tap <b>Add to Home Screen</b>
                  </li>
                  <li>
                    Open the new <b>DSDF Ops</b> icon, then enable notifications in Account
                  </li>
                </ol>
              ) : (
                <ol className="list-decimal space-y-2 pl-5">
                  <li>
                    Open this site in <b>Chrome</b> (recommended)
                  </li>
                  <li>
                    Tap the <b>⋮</b> menu → <b>Install app</b> or <b>Add to Home screen</b>
                  </li>
                  <li>
                    If you don&apos;t see Install: stay on the site ~30 seconds, refresh, then check the menu again
                  </li>
                  <li>
                    You can still enable notifications in Account without installing (Android Chrome)
                  </li>
                </ol>
              )}
              {compact ? (
                <Button type="button" variant="secondary" size="sm" onClick={dismiss}>
                  Dismiss
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
