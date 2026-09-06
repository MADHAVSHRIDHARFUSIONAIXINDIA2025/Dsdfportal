"use client";

import { PageIntro } from "@/components/layout/PageIntro";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
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
};

export default function EngineerTicketsPage() {
  const { data = [], reload } = useResource<Ticket[]>("/api/tickets");
  const [current, setCurrent] = useState<Ticket | null>(null);
  const toast = useToast();

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
      });
      toast.push("Ticket updated");
      setCurrent(null);
      await reload();
    } catch (error) {
      toast.push(error instanceof Error ? error.message : "Update failed", "error");
    }
  }

  return (
    <div>
      <PageIntro title="My tickets" subtitle="Update status and optical readings from site or desktop." />
      <div className="space-y-3 md:hidden">
        {data.length ? (
          data.map((ticket) => (
            <button key={ticket.id} className="w-full text-left" onClick={() => setCurrent(ticket)}>
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
        onEdit={(id) => setCurrent(data.find((row) => row.id === id) || null)}
      />
      <Sheet open={Boolean(current)} title={current?.tktNo || "Ticket"} onClose={() => setCurrent(null)}>
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
            <Button type="submit" className="w-full md:col-span-2">Update ticket</Button>
          </form>
        ) : null}
      </Sheet>
    </div>
  );
}
