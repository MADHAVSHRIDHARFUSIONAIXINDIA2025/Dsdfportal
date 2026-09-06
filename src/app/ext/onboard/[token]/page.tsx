"use client";

import { APP_NAME, COMPANY_LEGAL } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { api, post } from "@/lib/client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Invite = { engineerName: string; mobile: string; empId: string };

export default function OnboardPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const toast = useToast();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<Invite>(`/api/onboard/${params.token}`)
      .then(setInvite)
      .catch((err) => setError(err instanceof Error ? err.message : "Invalid invite"));
  }, [params.token]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    try {
      await post(`/api/onboard/${params.token}`, {
        token: params.token,
        mobile: form.get("mobile"),
        password: form.get("password"),
      });
      toast.push("Welcome to the field app");
      router.replace("/ext");
      router.refresh();
    } catch (err) {
      toast.push(err instanceof Error ? err.message : "Onboarding failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-navy px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-md flex-col justify-center text-white">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-200">Engineer extension</p>
        <h1 className="mt-3 text-3xl font-bold">{APP_NAME}</h1>
        <p className="mt-2 text-sm text-blue-100/75">{COMPANY_LEGAL}</p>
        <div className="mt-8 rounded-[28px] bg-white p-5 text-ink shadow-2xl">
          {error ? <p className="font-semibold text-danger">{error}</p> : null}
          {!error && !invite ? <p className="text-muted">Checking invite...</p> : null}
          {invite ? (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <h2 className="text-xl font-bold">Join the field app</h2>
                <p className="mt-1 text-sm text-muted">
                  Welcome {invite.engineerName}
                  {invite.empId ? ` · ${invite.empId}` : ""}. Set your WhatsApp number and password.
                </p>
              </div>
              <Field label="WhatsApp mobile">
                <Input name="mobile" defaultValue={invite.mobile} required />
              </Field>
              <Field label="Create password">
                <Input name="password" type="password" minLength={8} required />
              </Field>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Activating..." : "Activate my access"}
              </Button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}
