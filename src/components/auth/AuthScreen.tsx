"use client";

import { APP_NAME, COMPANY_LEGAL } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { api, post } from "@/lib/client";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AuthScreen({
  role,
  redirectTo,
  title,
  subtitle,
}: {
  role: "admin" | "engineer";
  redirectTo: string;
  title: string;
  subtitle: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [needsSetup, setNeedsSetup] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (role !== "admin") return;
    api<{ needsSetup: boolean }>("/api/setup")
      .then((data) => setNeedsSetup(data.needsSetup))
      .catch((error) => toast.push(error instanceof Error ? error.message : "Cannot reach server", "error"));
  }, [role]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    try {
      if (needsSetup) {
        await post("/api/setup", {
          name: form.get("name"),
          email: form.get("identifier"),
          password: form.get("password"),
        });
        toast.push("Admin account created. Sign in now.");
        setNeedsSetup(false);
        return;
      }
      const result = await post<{ user: { role: string } }>("/api/auth/login", {
        identifier: form.get("identifier"),
        password: form.get("password"),
      });
      router.replace(result.user.role === "admin" ? "/admin" : "/ext");
      router.refresh();
    } catch (error) {
      toast.push(error instanceof Error ? error.message : "Login failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-navy px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-md flex-col justify-center">
        <div className="mb-8 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-200">
            {role === "admin" ? "Admin Panel" : "Field Extension"}
          </p>
          <h1 className="mt-3 text-3xl font-bold">{APP_NAME}</h1>
          <p className="mt-2 text-sm text-blue-100/75">{COMPANY_LEGAL}</p>
        </div>
        <form onSubmit={onSubmit} className="rounded-[28px] bg-white p-5 shadow-2xl">
          <h2 className="text-xl font-bold text-ink">{needsSetup ? "Create first admin" : title}</h2>
          <p className="mt-1 text-sm text-muted">{needsSetup ? "This workspace has no admin yet." : subtitle}</p>
          <div className="mt-5 space-y-4">
            {needsSetup ? (
              <Field label="Full name">
                <Input name="name" required placeholder="Operations Admin" />
              </Field>
            ) : null}
            <Field label={role === "admin" || needsSetup ? "Email" : "Mobile"}>
              <Input
                name="identifier"
                required
                placeholder={role === "admin" || needsSetup ? "admin@dsdf.com" : "9876543210"}
                autoComplete="username"
              />
            </Field>
            <Field label="Password">
              <Input name="password" type="password" required minLength={needsSetup ? 8 : 6} autoComplete="current-password" />
            </Field>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : needsSetup ? "Create admin" : "Continue"}
            </Button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-blue-100/70">
          {role === "admin" ? (
            <a href="/ext/login" className="underline">
              Engineer field app
            </a>
          ) : (
            <a href="/login" className="underline">
              Admin panel
            </a>
          )}
        </p>
      </div>
    </div>
  );
}
