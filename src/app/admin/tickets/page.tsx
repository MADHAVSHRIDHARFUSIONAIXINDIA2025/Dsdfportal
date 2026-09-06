"use client";

import { PageIntro } from "@/components/layout/PageIntro";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Field, Input, SearchInput, Select, Textarea } from "@/components/ui/Field";
import { RecordCard } from "@/components/ui/RecordCard";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { useResource } from "@/hooks/useResource";
import { OPTICAL_STATUSES, PATH_NAMES, TICKET_PRIORITIES, TICKET_STATUSES, TICKET_TYPES } from "@/lib/constants";
import { fromDatetimeLocal, toDatetimeLocal } from "@/lib/utils";
import { patch, post } from "@/lib/client";
import { useMemo, useState } from "react";

type Ticket = {
  id: string;
  customerId: string;
  customer: string;
  companyName: string;
  linkId: string;
  city: string;
  tktNo: string;
  ticketType: string;
  openTime: string;
  priority: string;
  status: string;
  eng1Id: string;
  eng2Id: string;
  eng1: string;
  eng2: string;
  closeTime: string;
  resolution: string;
  remarks: string;
  slaHours: number;
  aEnd: string;
  bEnd: string;
  aOpticalPower: string;
  bOpticalPower: string;
  opticalStatus: string;
  affectedPath: string;
  duration: string | null;
  slaResult: string | null;
  whatsappStatus?: string;
  notifications?: Array<{ engineer: string; status: string; error?: string }>;
};

function whatsappToast(notices?: Array<{ engineer: string; status: string; error?: string }>) {
  if (!notices?.length) return "Ticket saved";
  const parts = notices.map((item) => {
    if (item.status === "sent") return `WhatsApp sent to ${item.engineer}`;
    if (item.status === "dry-run") return `WhatsApp not sent to ${item.engineer} — token is not configured`;
    if (item.status === "skipped") return `${item.engineer}: ${item.error || "no mobile"}`;
    return `WhatsApp failed for ${item.engineer}: ${item.error || "unknown error"}`;
  });
  return `Ticket saved. ${parts.join(". ")}`;
}

type Lookups = {
  customers: Array<{ id: string; name: string; companyName: string; city: string; linkId: string; pathName: string; linkType: string; aEnd: string; bEnd: string; slaHours: number }>;
  engineers: Array<{ id: string; name: string }>;
};

const empty = {
  customerId: "",
  tktNo: "",
  ticketType: "Support",
  openTime: "",
  priority: "Medium",
  status: "Open",
  eng1Id: "",
  eng2Id: "",
  closeTime: "",
  resolution: "",
  remarks: "",
  slaHours: 4,
  aEnd: "",
  bEnd: "",
  aOpticalPower: "",
  bOpticalPower: "",
  opticalStatus: "Pending",
  affectedPath: "Main Path",
};

export default function TicketsPage() {
  const { data = [], reload, remove } = useResource<Ticket[]>("/api/tickets");
  const lookups = useResource<Lookups>("/api/lookups");
  const [open, setOpen] = useState(false);
  const [id, setId] = useState("");
  const [form, setForm] = useState(empty);
  const [q, setQ] = useState("");
  const toast = useToast();

  const filtered = useMemo(
    () => data.filter((row) => Object.values(row).join(" ").toLowerCase().includes(q.toLowerCase())),
    [data, q]
  );

  function pickCustomer(customerId: string) {
    const customer = lookups.data?.customers.find((row) => row.id === customerId);
    setForm((current) => ({
      ...current,
      customerId,
      aEnd: customer?.aEnd || current.aEnd,
      bEnd: customer?.bEnd || current.bEnd,
      slaHours: customer?.slaHours || current.slaHours,
      affectedPath: customer?.linkType === "Linear" ? "Main Path" : customer?.pathName || "Main Path",
    }));
  }

  function edit(row?: Ticket) {
    setId(row?.id || "");
    setForm(
      row
        ? {
            ...empty,
            ...row,
            openTime: toDatetimeLocal(row.openTime),
            closeTime: toDatetimeLocal(row.closeTime),
          }
        : empty
    );
    setOpen(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const payload = {
      ...form,
      openTime: fromDatetimeLocal(form.openTime),
      closeTime: fromDatetimeLocal(form.closeTime),
    };
    try {
      const saved = id
        ? await patch<Ticket>(`/api/tickets/${id}`, payload)
        : await post<Ticket>("/api/tickets", payload);
      toast.push(whatsappToast(saved.notifications), saved.notifications?.some((item) => item.status === "failed") ? "error" : "ok");
      setOpen(false);
      await reload();
    } catch (error) {
      toast.push(error instanceof Error ? error.message : "Save failed", "error");
    }
  }

  return (
    <div>
      <PageIntro title="Tickets" subtitle="Support and implementation tickets. WhatsApp is sent on engineer assignment." action={{ label: "New ticket", onClick: () => edit() }} />
      <SearchInput className="mb-4" placeholder="Search TKT / customer / status / ends..." value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="space-y-3 md:hidden">
        {filtered.map((row) => (
          <RecordCard
            key={row.id}
            title={row.tktNo}
            meta={[row.customer, row.linkId, `${row.eng1 || "Unassigned"}${row.eng2 ? ` + ${row.eng2}` : ""}`]}
            badges={[row.status, row.ticketType, row.slaResult || "", row.whatsappStatus || ""]}
            onEdit={() => edit(row)}
            onDelete={() => remove(row.id)}
          />
        ))}
      </div>
      <DataTable
        columns={[
          { key: "tktNo", label: "TKT" },
          { key: "ticketType", label: "Type" },
          { key: "customer", label: "Customer" },
          { key: "status", label: "Status" },
          { key: "eng1", label: "FE 1" },
          { key: "slaResult", label: "SLA" },
          { key: "whatsappStatus", label: "WhatsApp" },
        ]}
        rows={filtered}
        onEdit={(rowId) => edit(data.find((row) => row.id === rowId))}
        onDelete={remove}
      />
      <Sheet open={open} title={id ? "Update ticket" : "New ticket"} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
          <Field label="Ticket type">
            <Select value={form.ticketType} onChange={(e) => setForm({ ...form, ticketType: e.target.value })}>
              {TICKET_TYPES.map((item) => <option key={item}>{item}</option>)}
            </Select>
          </Field>
          <Field label="Customer / link *">
            <Select value={form.customerId} onChange={(e) => pickCustomer(e.target.value)} required>
              <option value="">Select customer</option>
              {(lookups.data?.customers || []).map((row) => (
                <option key={row.id} value={row.id}>
                  {row.companyName} | {row.name} | {row.city} | {row.linkId}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Company TKT no. *"><Input value={form.tktNo} onChange={(e) => setForm({ ...form, tktNo: e.target.value })} required /></Field>
          <Field label="Affected path">
            <Select value={form.affectedPath} onChange={(e) => setForm({ ...form, affectedPath: e.target.value })}>
              {PATH_NAMES.map((item) => <option key={item}>{item}</option>)}
            </Select>
          </Field>
          <Field label="Open time"><Input type="datetime-local" value={form.openTime} onChange={(e) => setForm({ ...form, openTime: e.target.value })} /></Field>
          <Field label="Priority"><Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{TICKET_PRIORITIES.map((item) => <option key={item}>{item}</option>)}</Select></Field>
          <Field label="Status"><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{TICKET_STATUSES.map((item) => <option key={item}>{item}</option>)}</Select></Field>
          <Field label="Engineer 1">
            <Select value={form.eng1Id} onChange={(e) => setForm({ ...form, eng1Id: e.target.value })}>
              <option value="">Unassigned</option>
              {(lookups.data?.engineers || []).map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
            </Select>
          </Field>
          <Field label="Engineer 2">
            <Select value={form.eng2Id} onChange={(e) => setForm({ ...form, eng2Id: e.target.value })}>
              <option value="">Unassigned</option>
              {(lookups.data?.engineers || []).map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
            </Select>
          </Field>
          <Field label="Closing time"><Input type="datetime-local" value={form.closeTime} onChange={(e) => setForm({ ...form, closeTime: e.target.value })} /></Field>
          <Field label="A-End *"><Input value={form.aEnd} onChange={(e) => setForm({ ...form, aEnd: e.target.value })} required /></Field>
          <Field label="B-End *"><Input value={form.bEnd} onChange={(e) => setForm({ ...form, bEnd: e.target.value })} required /></Field>
          <Field label="A optical power"><Input value={form.aOpticalPower} onChange={(e) => setForm({ ...form, aOpticalPower: e.target.value })} /></Field>
          <Field label="B optical power"><Input value={form.bOpticalPower} onChange={(e) => setForm({ ...form, bOpticalPower: e.target.value })} /></Field>
          <Field label="Optical status"><Select value={form.opticalStatus} onChange={(e) => setForm({ ...form, opticalStatus: e.target.value })}>{OPTICAL_STATUSES.map((item) => <option key={item}>{item}</option>)}</Select></Field>
          <Field label="SLA hours"><Input type="number" step="0.1" value={form.slaHours} onChange={(e) => setForm({ ...form, slaHours: Number(e.target.value) })} /></Field>
          <Field className="md:col-span-2" label="Resolution"><Textarea value={form.resolution} onChange={(e) => setForm({ ...form, resolution: e.target.value })} /></Field>
          <Field className="md:col-span-2" label="Remarks"><Textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></Field>
          <p className="md:col-span-2 rounded-2xl bg-brand-soft p-3 text-sm text-brand">
            Implementation tickets save only when optical status is OK. Assigning an engineer tries WhatsApp. Add the Meta token in Settings if messages are not going out.
          </p>
          <Button type="submit" className="md:col-span-2 w-full">Save ticket</Button>
        </form>
      </Sheet>
    </div>
  );
}
