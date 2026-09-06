"use client";

import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { patch } from "@/lib/client";
import { useState } from "react";

export function PasswordForm({ title = "Change password" }: { title?: string }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const confirm = String(form.get("confirm") || "");
    if (password !== confirm) {
      toast.push("Password and confirm password do not match", "error");
      return;
    }
    setLoading(true);
    try {
      await patch("/api/auth/password", {
        currentPassword: form.get("currentPassword"),
        password,
      });
      toast.push("Password updated");
      event.currentTarget.reset();
    } catch (error) {
      toast.push(error instanceof Error ? error.message : "Update failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={updatePassword} className="grid gap-4">
      <h3 className="font-bold text-ink">{title}</h3>
      <Field label="Current password">
        <Input name="currentPassword" type="password" autoComplete="current-password" required />
      </Field>
      <Field label="New password">
        <Input name="password" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      <Field label="Confirm new password">
        <Input name="confirm" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Update password"}
      </Button>
    </form>
  );
}
