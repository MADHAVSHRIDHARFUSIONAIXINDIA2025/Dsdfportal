"use client";

import { PasswordForm } from "@/components/forms/PasswordForm";
import { PageIntro } from "@/components/layout/PageIntro";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { useResource } from "@/hooks/useResource";

type NotifyStatus = {
  push: {
    configured: boolean;
    hasPublicKey: boolean;
    hasPrivateKey: boolean;
    subject: string;
  };
  whatsapp: {
    configured: boolean;
    provider: string;
    from: string;
    hasAccountSid: boolean;
    hasAuthToken: boolean;
    hasContentSid: boolean;
    businessNumber: string;
    role: string;
  };
};

export default function SettingsPage() {
  const { data } = useResource<NotifyStatus>("/api/notifications/status");

  return (
    <div>
      <PageIntro title="Settings" subtitle="Password and ticket assignment alerts." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <PasswordForm title="Update admin password" />
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-ink">Web Push (primary)</h3>
            <Badge tone={data?.push.configured ? "green" : "amber"}>
              {data?.push.configured ? "Ready" : "Not configured"}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-muted">
            Engineers enable notifications once in the field app (Account). On assignment they get a
            phone notification they can tap to open My tickets.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-ink">
            <li>
              Set <code className="rounded bg-slate-100 px-1">VAPID_PUBLIC_KEY</code> and{" "}
              <code className="rounded bg-slate-100 px-1">VAPID_PRIVATE_KEY</code>
            </li>
            <li>
              Optional <code className="rounded bg-slate-100 px-1">VAPID_SUBJECT</code> (mailto:…)
            </li>
            <li>Engineer must tap Enable notifications in /ext settings</li>
          </ul>
          <div className="mt-4 rounded-2xl bg-canvas p-3 text-xs text-muted">
            <p>Public key set: {data?.push.hasPublicKey ? "Yes" : "No"}</p>
            <p>Private key set: {data?.push.hasPrivateKey ? "Yes" : "No"}</p>
            <p>Subject: {data?.push.subject || "—"}</p>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-ink">Twilio WhatsApp (fallback)</h3>
            <Badge tone={data?.whatsapp.configured ? "green" : "amber"}>
              {data?.whatsapp.configured ? "Ready" : "Not configured"}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-muted">
            Used only when the engineer has no push subscription (or push fails). Keep engineer mobile
            numbers filled for fallback.
          </p>
          <div className="mt-4 rounded-2xl bg-canvas p-3 text-xs text-muted">
            <p>Account SID set: {data?.whatsapp.hasAccountSid ? "Yes" : "No"}</p>
            <p>Auth token set: {data?.whatsapp.hasAuthToken ? "Yes" : "No"}</p>
            <p>From: {data?.whatsapp.from || "—"}</p>
            <p>Content template: {data?.whatsapp.hasContentSid ? "Yes" : "No"}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
