"use client";

import { PasswordForm } from "@/components/forms/PasswordForm";
import { PageIntro } from "@/components/layout/PageIntro";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { useResource } from "@/hooks/useResource";

type WhatsAppStatus = {
  configured: boolean;
  businessNumber: string;
  hasToken: boolean;
  hasPhoneNumberId: boolean;
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
            <h3 className="font-bold text-ink">WhatsApp Cloud API</h3>
            <Badge tone={data?.configured ? "green" : "amber"}>{data?.configured ? "Ready" : "Not configured"}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted">
            You do <b>not</b> need your own business number. Meta gives a free test sender.{" "}
            <b>+91 90798 86783</b> is only the personal WhatsApp that should receive the alert.
          </p>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-ink">
            <li>
              Open{" "}
              <a className="font-semibold text-brand underline" href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer">
                developers.facebook.com/apps
              </a>
            </li>
            <li>Create an app → type <b>Business</b> → add the <b>WhatsApp</b> product. Meta creates a test From number for you.</li>
            <li>
              Go to <b>WhatsApp → API Setup</b>. Click <b>Generate access token</b> and put it in{" "}
              <code className="rounded bg-slate-100 px-1">WHATSAPP_TOKEN</code>.
            </li>
            <li>
              Copy <b>Phone number ID</b> of Meta’s test number into{" "}
              <code className="rounded bg-slate-100 px-1">WHATSAPP_PHONE_NUMBER_ID</code>.
            </li>
            <li>
              Under <b>To</b>, add <b>9079886783</b> as a test recipient and confirm the SMS/WhatsApp code Meta sends.
            </li>
            <li>Save that same number on the engineer record, then restart the app.</li>
          </ol>
          <div className="mt-4 rounded-2xl bg-canvas p-3 text-xs text-muted">
            <p>Token set: {data?.hasToken ? "Yes" : "No"}</p>
            <p>Phone number ID set: {data?.hasPhoneNumberId ? "Yes" : "No"}</p>
            <p>Test recipient: {data?.businessNumber || "+91 9079886783"}</p>
            <p className="mt-2">Until you add 9079886783 as a test recipient in Meta, Cloud API cannot message that personal WhatsApp.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
