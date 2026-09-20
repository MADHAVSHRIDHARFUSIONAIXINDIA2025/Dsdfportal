"use client";

import { PasswordForm } from "@/components/forms/PasswordForm";
import { PageIntro } from "@/components/layout/PageIntro";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { useResource } from "@/hooks/useResource";

type WhatsAppStatus = {
  configured: boolean;
  provider: string;
  from: string;
  hasAccountSid: boolean;
  hasAuthToken: boolean;
  hasContentSid: boolean;
  businessNumber: string;
};

export default function SettingsPage() {
  const { data } = useResource<WhatsAppStatus>("/api/whatsapp/status");

  return (
    <div>
      <PageIntro title="Settings" subtitle="Passwords and WhatsApp assignment alerts." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <PasswordForm title="Update admin password" />
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-ink">Twilio WhatsApp</h3>
            <Badge tone={data?.configured ? "green" : "amber"}>{data?.configured ? "Ready" : "Not configured"}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted">
            Ticket assignment alerts are sent to the engineer&apos;s mobile via Twilio WhatsApp with full ticket details.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-ink">
            <li>
              Set <code className="rounded bg-slate-100 px-1">TWILIO_ACCOUNT_SID</code>,{" "}
              <code className="rounded bg-slate-100 px-1">TWILIO_AUTH_TOKEN</code>,{" "}
              <code className="rounded bg-slate-100 px-1">TWILIO_WHATSAPP_FROM</code>
            </li>
            <li>
              Optional template: <code className="rounded bg-slate-100 px-1">TWILIO_CONTENT_SID</code>
            </li>
            <li>Save the engineer&apos;s WhatsApp number on their engineer record</li>
          </ul>
          <div className="mt-4 rounded-2xl bg-canvas p-3 text-xs text-muted">
            <p>Account SID set: {data?.hasAccountSid ? "Yes" : "No"}</p>
            <p>Auth token set: {data?.hasAuthToken ? "Yes" : "No"}</p>
            <p>From: {data?.from || "—"}</p>
            <p>Content template: {data?.hasContentSid ? "Yes" : "No"}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
