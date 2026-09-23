"use client";

import { PasswordForm } from "@/components/forms/PasswordForm";
import { PageIntro } from "@/components/layout/PageIntro";
import { PushEnableCard } from "@/components/push/PushEnableCard";
import { Card } from "@/components/ui/Card";

export default function EngineerSettingsPage() {
  return (
    <div>
      <PageIntro title="Account" subtitle="Password and ticket push notifications." />
      <div className="grid max-w-lg gap-5">
        <PushEnableCard />
        <Card className="p-5">
          <PasswordForm title="Update password" />
        </Card>
      </div>
    </div>
  );
}
