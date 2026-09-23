"use client";

import { PageIntro } from "@/components/layout/PageIntro";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { FileUpload } from "@/components/ui/FileUpload";
import { JCAdd } from "@/components/ui/JCAdd";
import { Sheet } from "@/components/ui/Sheet";
import { TableSkeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useResource } from "@/hooks/useResource";
import { OPTICAL_STATUSES, TICKET_STATUSES } from "@/lib/constants";
import { fromDatetimeLocal, toDatetimeLocal } from "@/lib/utils";
import { patch } from "@/lib/client";
import { useState } from "react";

type Ticket = {
  id: string;
  tktNo: string;
  ticketType: string;
  customer: string;
  city: string;
  linkId: string;
  status: string;
  priority: string;
  aEnd: string;
  bEnd: string;
  aOpticalPower: string;
  bOpticalPower: string;
  opticalStatus: string;
  closeTime: string;
  resolution: string;
  remarks: string;
  customerId: string;
  openTime: string;
  eng1Id: string;
  eng2Id: string;
  slaHours: number;
  affectedPath: string;
  attachments?: Array<{ name: string; url: string; size: number; uploadedBy?: string; uploadedAt?: string }>;
};

type JCRecord = {
  id: string;
  engineer: string;
  latitude: string;
  longitude: string;
  imageUrl: string;
  remarks: string;
  createdAt: string;
};

export default function EngineerTicketsPage() {
  const { data = [], loading, reload } = useResource<Ticket[]>("/api/tickets");
  const [current, setCurrent] = useState<Ticket | null>(null);
  const [attachments, setAttachments] = useState<Array<{ name: string; url: string; size: number; uploadedBy?: string; uploadedAt?: string }>>([]);
  const [jcRecords, setJcRecords] = useState<JCRecord[]>([]);
  const toast = useToast();

  async function openTicket(ticket: Ticket) {
    setCurrent(ticket);
    setAttachments(ticket.attachments || []);
    setJcRecords([]);

    // Load JC history for this link (shared across all tickets on the same link)
    if (!ticket.customerId) return;
    try {
      const res = await fetch(`/api/jc?customerId=${ticket.customerId}`);
      if (res.ok) {
        setJcRecords(await res.json());
      }
    } catch (error) {
      console.error("Failed to load JC records:", error);
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!current) return;
    const form = new FormData(event.currentTarget);
    try {
      await patch(`/api/tickets/${current.id}`, {
        ...current,
        status: form.get("status"),
        opticalStatus: form.get("opticalStatus"),
        aOpticalPower: form.get("aOpticalPower"),
        bOpticalPower: form.get("bOpticalPower"),
        closeTime: fromDatetimeLocal(String(form.get("closeTime") || "")),
        resolution: form.get("resolution"),
        remarks: form.get("remarks"),
        attachments,
      });
      toast.push("Ticket updated");
      setCurrent(null);
      setAttachments([]);
      await reload();
    } catch (error) {
      toast.push(error instanceof Error ? error.message : "Update failed", "error");
    }
  }

  return (
    <div>
      <PageIntro title="My tickets" subtitle="Update status and optical readings from site or desktop." />
      {loading ? (
        <>
          <div className="md:hidden">
            <CardSkeleton count={4} />
          </div>
          <div className="hidden md:block">
            <TableSkeleton rows={5} columns={7} />
          </div>
        </>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {data.length ? (
              data.map((ticket) => (
                <button key={ticket.id} className="w-full text-left" onClick={() => openTicket(ticket)}>
                  <Card className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">{ticket.ticketType}</p>
                        <h3 className="mt-1 text-lg font-bold">{ticket.tktNo}</h3>
                        <p className="mt-1 text-sm text-muted">{ticket.customer}</p>
                        <p className="text-xs text-muted">{ticket.linkId} · {ticket.city}</p>
                      </div>
                      <Badge tone={statusTone(ticket.status)}>{ticket.status}</Badge>
                    </div>
                  </Card>
                </button>
              ))
            ) : (
              <EmptyState title="Nothing assigned" hint="New jobs appear here and on WhatsApp." />
            )}
          </div>
          <DataTable
            columns={[
              { key: "tktNo", label: "Ticket" },
              { key: "ticketType", label: "Type" },
              { key: "customer", label: "Customer" },
              { key: "linkId", label: "Link" },
              { key: "city", label: "City" },
              { key: "status", label: "Status" },
              { key: "opticalStatus", label: "Optical" },
            ]}
            rows={data}
            onEdit={(id) => {
              const ticket = data.find((row) => row.id === id);
              if (ticket) openTicket(ticket);
            }}
          />
        </>
      )}
      <Sheet open={Boolean(current)} title={current?.tktNo || "Ticket"} onClose={() => { setCurrent(null); setAttachments([]); setJcRecords([]); }}>
        {current ? (
          <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
            <p className="text-sm text-muted md:col-span-2">{current.customer} · {current.aEnd} → {current.bEnd}</p>
            <Field label="Status">
              <Select name="status" defaultValue={current.status}>
                {TICKET_STATUSES.map((item) => <option key={item}>{item}</option>)}
              </Select>
            </Field>
            <Field label="Optical status">
              <Select name="opticalStatus" defaultValue={current.opticalStatus}>
                {OPTICAL_STATUSES.map((item) => <option key={item}>{item}</option>)}
              </Select>
            </Field>
            <Field label="A optical power"><Input name="aOpticalPower" defaultValue={current.aOpticalPower} /></Field>
            <Field label="B optical power"><Input name="bOpticalPower" defaultValue={current.bOpticalPower} /></Field>
            <Field label="Close time"><Input name="closeTime" type="datetime-local" defaultValue={toDatetimeLocal(current.closeTime)} /></Field>
            <Field className="md:col-span-2" label="Resolution"><Textarea name="resolution" defaultValue={current.resolution} /></Field>
            <Field className="md:col-span-2" label="Remarks"><Textarea name="remarks" defaultValue={current.remarks} /></Field>
            <div className="md:col-span-2">
              <FileUpload
                attachments={attachments}
                onChange={setAttachments}
              />
            </div>
            <div className="md:col-span-2">
              <JCAdd
                ticketId={current.id}
                customerId={current.customerId}
                records={jcRecords}
                onAdd={(newRecord) => setJcRecords([newRecord, ...jcRecords])}
              />
            </div>
            <Button type="submit" className="w-full md:col-span-2">Update ticket</Button>
          </form>
        ) : null}
      </Sheet>
    </div>
  );
}
