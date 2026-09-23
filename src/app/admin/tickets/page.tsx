"use client";

import { PageIntro } from "@/components/layout/PageIntro";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Field, Input, SearchInput, Select, Textarea } from "@/components/ui/Field";
import { FileUpload } from "@/components/ui/FileUpload";
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
  notifications?: Array<{
    engineer: string;
    channel?: "push" | "whatsapp" | "none";
    status: string;
    error?: string;
    whatsappLink?: string | null;
  }>;
  attachments?: Array<{ name: string; url: string; size: number; uploadedBy?: string; uploadedAt?: string }>;
};

function assignmentToast(
  notices?: Array<{
    engineer: string;
    channel?: string;
    status: string;
    error?: string;
    whatsappLink?: string | null;
  }>
) {
  if (!notices?.length) return "Ticket saved";

  const hasLinks = notices.some((n) => n.whatsappLink);
  if (hasLinks) {
    const linksHtml = notices
      .filter((n) => n.whatsappLink)
      .map(
        (n) =>
          `<a href="${n.whatsappLink}" target="_blank" class="text-brand underline hover:text-blue-700">Message ${n.engineer}</a>`
      )
      .join(" | ");
    return `Ticket saved. No push — click to send WhatsApp: ${linksHtml}`;
  }

  const parts = notices.map((item) => {
    const channel = item.channel || "whatsapp";
    if (item.status === "sent" && channel === "push") return `Push sent to ${item.engineer}`;
    if (item.status === "sent") return `WhatsApp fallback sent to ${item.engineer}`;
    if (item.status === "dry-run") return `Alert not configured for ${item.engineer}`;
    if (item.status === "skipped") return `${item.engineer}: ${item.error || "skipped"}`;
    return `Alert failed for ${item.engineer}: ${item.error || "unknown error"}`;
  });
  return `Ticket saved. ${parts.join(". ")}`;
}

type Lookups = {
  customers: Array<{ id: string; name: string; companyName: string; city: string; linkId: string; pathName: string; linkType: string; aEnd: string; bEnd: string; slaHours: number }>;
  engineers: Array<{ id: string; name: string; area: string }>;
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
  attachments: [] as Array<{ name: string; url: string; size: number; uploadedBy?: string; uploadedAt?: string }>,
};

export default function TicketsPage() {
  const { data = [], reload, remove } = useResource<Ticket[]>("/api/tickets");
  const lookups = useResource<Lookups>("/api/lookups");
  const [open, setOpen] = useState(false);
  const [id, setId] = useState("");
  const [form, setForm] = useState(empty);
  const [q, setQ] = useState("");
  const [whatsappLinks, setWhatsappLinks] = useState<Array<{ engineer: string; link: string }>>([]);
  const [selectedCity, setSelectedCity] = useState("");
  const toast = useToast();

  const filtered = useMemo(
    () => data.filter((row) => Object.values(row).join(" ").toLowerCase().includes(q.toLowerCase())),
    [data, q]
  );

  // Filter engineers by selected customer's city
  const filteredEngineers = useMemo(() => {
    if (!selectedCity) return lookups.data?.engineers || [];
    return (lookups.data?.engineers || []).filter((eng) => 
      eng.area?.toLowerCase() === selectedCity.toLowerCase()
    );
  }, [lookups.data?.engineers, selectedCity]);

  function pickCustomer(customerId: string) {
    const customer = lookups.data?.customers.find((row) => row.id === customerId);
    setSelectedCity(customer?.city || "");
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
    const customer = lookups.data?.customers.find((c) => c.id === row?.customerId);
    setSelectedCity(customer?.city || "");
    setForm(
      row
        ? {
            ...empty,
            ...row,
            openTime: toDatetimeLocal(row.openTime),
            closeTime: toDatetimeLocal(row.closeTime),
            attachments: row.attachments || [],
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
      
      // Extract WhatsApp links if API is not configured
      const links = (saved.notifications || [])
        .filter((n) => n.whatsappLink)
        .map((n) => ({ engineer: n.engineer, link: n.whatsappLink! }));
      
      if (links.length > 0) {
        setWhatsappLinks(links);
        toast.push("Ticket saved! No push subscription — use WhatsApp links above", "ok");
      } else {
        toast.push(
          assignmentToast(saved.notifications),
          saved.notifications?.some((item) => item.status === "failed") ? "error" : "ok"
        );
      }
      
      setOpen(false);
      await reload();
    } catch (error) {
      toast.push(error instanceof Error ? error.message : "Save failed", "error");
    }
  }

  return (
    <div>
      <PageIntro title="Tickets" subtitle="Support and implementation tickets. WhatsApp is sent on engineer assignment." action={{ label: "New ticket", onClick: () => edit() }} />
      
      {whatsappLinks.length > 0 && (
        <div className="mb-4 rounded-2xl bg-green-50 border-2 border-green-200 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="font-bold text-green-900">WhatsApp API not configured</p>
              <p className="mt-1 text-sm text-green-700">Click the links below to send WhatsApp messages manually:</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {whatsappLinks.map((item, i) => (
                  <a
                    key={i}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    Message {item.engineer}
                  </a>
                ))}
              </div>
            </div>
            <button onClick={() => setWhatsappLinks([])} className="text-green-600 hover:text-green-800">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
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
          { key: "whatsappStatus", label: "Alert" },
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
          <Field label="Customer / link">
            <Select value={form.customerId} onChange={(e) => pickCustomer(e.target.value)}>
              <option value="">Select customer (optional)</option>
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
              {filteredEngineers.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name} {row.area ? `(${row.area})` : ""}
                </option>
              ))}
            </Select>
            {selectedCity && filteredEngineers.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">No engineers found in {selectedCity}</p>
            )}
          </Field>
          <Field label="Engineer 2">
            <Select value={form.eng2Id} onChange={(e) => setForm({ ...form, eng2Id: e.target.value })}>
              <option value="">Unassigned</option>
              {filteredEngineers.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name} {row.area ? `(${row.area})` : ""}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Closing time"><Input type="datetime-local" value={form.closeTime} onChange={(e) => setForm({ ...form, closeTime: e.target.value })} /></Field>
          <Field label="A-End"><Input value={form.aEnd} onChange={(e) => setForm({ ...form, aEnd: e.target.value })} /></Field>
          <Field label="B-End"><Input value={form.bEnd} onChange={(e) => setForm({ ...form, bEnd: e.target.value })} /></Field>
          <Field label="A optical power"><Input value={form.aOpticalPower} onChange={(e) => setForm({ ...form, aOpticalPower: e.target.value })} /></Field>
          <Field label="B optical power"><Input value={form.bOpticalPower} onChange={(e) => setForm({ ...form, bOpticalPower: e.target.value })} /></Field>
          <Field label="Optical status"><Select value={form.opticalStatus} onChange={(e) => setForm({ ...form, opticalStatus: e.target.value })}>{OPTICAL_STATUSES.map((item) => <option key={item}>{item}</option>)}</Select></Field>
          <Field label="SLA hours"><Input type="number" step="0.1" value={form.slaHours} onChange={(e) => setForm({ ...form, slaHours: Number(e.target.value) })} /></Field>
          <Field className="md:col-span-2" label="Resolution"><Textarea value={form.resolution} onChange={(e) => setForm({ ...form, resolution: e.target.value })} /></Field>
          <Field className="md:col-span-2" label="Remarks"><Textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></Field>
          <div className="md:col-span-2">
            <FileUpload
              attachments={form.attachments}
              onChange={(attachments) => setForm({ ...form, attachments })}
            />
          </div>
          <p className="md:col-span-2 rounded-2xl bg-brand-soft p-3 text-sm text-brand">
            Implementation tickets save only when optical status is OK. Assigning an engineer tries WhatsApp. Add the Meta token in Settings if messages are not going out.
          </p>
          <Button type="submit" className="md:col-span-2 w-full">Save ticket</Button>
        </form>
      </Sheet>
    </div>
  );
}
