"use client";

import { PasswordForm } from "@/components/forms/PasswordForm";
import { PageIntro } from "@/components/layout/PageIntro";
import { Card } from "@/components/ui/Card";

export default function EngineerSettingsPage() {
  return (
    <div>
      <PageIntro title="Account" subtitle="Update your field app login password." />
      <Card className="max-w-lg p-5">
        <PasswordForm title="Update password" />
      </Card>
    </div>
  );
}
