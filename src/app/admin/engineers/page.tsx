"use client";

import { PageIntro } from "@/components/layout/PageIntro";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Field, Input, Select } from "@/components/ui/Field";
import { RecordCard } from "@/components/ui/RecordCard";
import { Sheet } from "@/components/ui/Sheet";
import { TableSkeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useResource } from "@/hooks/useResource";
import { displayPhone } from "@/lib/utils";
import { patch, post } from "@/lib/client";
import { useState } from "react";

type Engineer = {
  id: string;
  name: string;
  empId: string;
  post: string;
  department: string;
  mobile: string;
  joiningDate: string;
  status: string;
  area: string;
  onboardStatus: string;
  hasPassword?: boolean;
};

const empty = { name: "", empId: "", post: "", department: "", mobile: "", joiningDate: "", status: "Active", area: "", password: "", confirmPassword: "" };

export default function EngineersPage() {
  const { data = [], loading, reload, remove } = useResource<Engineer[]>("/api/engineers");
  const [open, setOpen] = useState(false);
  const [id, setId] = useState("");
  const [form, setForm] = useState(empty);
  const [inviteUrl, setInviteUrl] = useState("");
  const toast = useToast();

  function edit(row?: Engineer) {
    setId(row?.id || "");
    setForm(row ? { ...empty, ...row, password: "", confirmPassword: "" } : empty);
    setInviteUrl("");
    setOpen(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    try {
      if (form.password && form.password !== form.confirmPassword) {
        throw new Error("Password and confirm password do not match");
      }
      if (form.password && form.password.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }
      const payload = { ...form, password: form.password || undefined, confirmPassword: undefined };
      const saved = id ? await patch<Engineer>(`/api/engineers/${id}`, payload) : await post<Engineer>("/api/engineers", payload);
      toast.push(form.password ? "Engineer and password saved" : "Engineer saved");
      setId(saved.id);
      setForm((current) => ({ ...current, password: "", confirmPassword: "" }));
      await reload();
    } catch (error) {
      toast.push(error instanceof Error ? error.message : "Save failed", "error");
    }
  }

  async function invite() {
    const target = id;
    if (!target) return;
    try {
      const result = await post<{ url: string }>(`/api/engineers/${target}/invite?whatsapp=1`, {});
      setInviteUrl(result.url);
      await navigator.clipboard.writeText(result.url);
      toast.push("Onboarding link copied");
      await reload();
    } catch (error) {
      toast.push(error instanceof Error ? error.message : "Invite failed", "error");
    }
  }

  return (
    <div>
      <PageIntro title="Engineers" subtitle="Set a login password here, or send the /ext onboarding link." action={{ label: "Add engineer", onClick: () => edit() }} />
      
      {loading ? (
        <>
          <div className="md:hidden">
            <CardSkeleton count={5} />
          </div>
          <div className="hidden md:block">
            <TableSkeleton rows={5} columns={7} />
          </div>
        </>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {data.map((row) => (
              <RecordCard
                key={row.id}
                title={row.name}
                meta={[row.empId && `Emp ${row.empId}`, displayPhone(row.mobile), row.area, row.post]}
                badges={[row.status, row.hasPassword ? "Password set" : row.onboardStatus]}
                onEdit={() => edit(row)}
                onDelete={() => remove(row.id)}
              />
            ))}
          </div>
          <DataTable
            columns={[
              { key: "name", label: "Name" },
              { key: "empId", label: "Emp ID" },
              { key: "mobile", label: "Mobile" },
              { key: "area", label: "Area" },
              { key: "onboardStatus", label: "Onboard" },
              { key: "passwordStatus", label: "Password" },
              { key: "status", label: "Status" },
            ]}
            rows={data.map((row) => ({ ...row, passwordStatus: row.hasPassword ? "Set" : "Not set" }))}
            onEdit={(rowId) => edit(data.find((row) => row.id === rowId))}
            onDelete={remove}
          />
        </>
      )}
      <Sheet open={open} title={id ? "Update engineer" : "Add engineer"} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="grid gap-4">
          <Field label="Name *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="Employee ID"><Input value={form.empId} onChange={(e) => setForm({ ...form, empId: e.target.value })} /></Field>
          <Field label="WhatsApp mobile *"><Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} required /></Field>
          <Field label={id ? "New password" : "Login password"}>
            <Input
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={id ? "Leave blank to keep current password" : "Min 8 characters"}
              minLength={form.password ? 8 : undefined}
            />
          </Field>
          <Field label="Confirm password">
            <Input
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder={id ? "Repeat only if changing password" : "Repeat password"}
            />
          </Field>
          <Field label="Post"><Input value={form.post} onChange={(e) => setForm({ ...form, post: e.target.value })} /></Field>
          <Field label="Department"><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></Field>
          <Field label="Area"><Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} /></Field>
          <Field label="Joining date"><Input type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} /></Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option>Active</option>
              <option>Inactive</option>
            </Select>
          </Field>
          <Button type="submit" className="w-full">Save engineer</Button>
          {id ? (
            <Button variant="secondary" className="w-full" onClick={invite}>
              Generate onboarding link
            </Button>
          ) : null}
          {inviteUrl ? (
            <p className="break-all rounded-2xl bg-brand-soft p-3 text-xs text-brand">{inviteUrl}</p>
          ) : null}
        </form>
      </Sheet>
    </div>
  );
}
