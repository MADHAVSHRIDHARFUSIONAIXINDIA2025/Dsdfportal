"use client";

import { PageIntro } from "@/components/layout/PageIntro";
import { Button } from "@/components/ui/Button";
import { Card, StatCard } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Field, Input, Select } from "@/components/ui/Field";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/client";
import { ATTENDANCE_STATUSES } from "@/lib/constants";
import { useResource } from "@/hooks/useResource";
import { useState } from "react";
import type { RepeatLinkRow, TicketFlowBucket } from "@/types";

type Engineer = { id: string; name: string };
type AttRow = { id: string; attDate: string; engineer: string; inTime: string; outTime: string; status: string; remarks: string };

export default function ReportsPage() {
  const flow = useResource<TicketFlowBucket[]>("/api/reports?kind=flow");
  const repeats = useResource<RepeatLinkRow[]>("/api/reports?kind=repeats");
  const engineers = useResource<Engineer[]>("/api/engineers");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [engineerId, setEngineerId] = useState("");
  const [status, setStatus] = useState("");
  const [att, setAtt] = useState<AttRow[]>([]);

  async function loadAttendance(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams({ kind: "attendance", from, to, engineerId, status });
    setAtt(await api<AttRow[]>(`/api/reports?${params}`));
  }

  const counts = att.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <PageIntro title="Reports" subtitle="Excel exports, ticket flow, repeat links and attendance." />
      <div className="mb-6 flex flex-wrap gap-2">
        {["tickets", "customers", "engineers", "attendance"].map((name) => (
          <a key={name} href={`/api/export/${name}`}>
            <Button variant="secondary">{name} CSV</Button>
          </a>
        ))}
      </div>

      <Card className="mb-6 p-5">
        <h3 className="font-bold">Incoming ticket flow</h3>
        <div className="mt-4 space-y-3">
          {flow.loading ? (
            <TableSkeleton rows={4} columns={2} />
          ) : (
            (flow.data || []).map((row) => (
              <div key={row.month} className="rounded-2xl bg-canvas p-3">
                <p className="font-semibold">{row.label}</p>
                <p className="text-sm text-muted">Implementation {row.implementation} · Support {row.support}</p>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="mb-6 p-5">
        <h3 className="font-bold">Repeated links after resolution</h3>
        <p className="mt-1 text-sm text-muted">Same-month tickets that reopen after a resolved/closed ticket.</p>
        <div className="mt-4">
          {repeats.loading ? (
            <TableSkeleton rows={5} columns={5} />
          ) : (
            <DataTable
              columns={[
                { key: "month", label: "Month" },
                { key: "linkId", label: "Link" },
                { key: "customer", label: "Customer" },
                { key: "repeatCount", label: "Repeats" },
                { key: "ticketNos", label: "Tickets" },
              ]}
              rows={(repeats.data || []).map((row) => ({ ...row, id: `${row.month}-${row.linkId}` }))}
            />
          )}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-bold">Present / absent report</h3>
        <form onSubmit={loadAttendance} className="mt-4 grid gap-3 md:grid-cols-5">
          <Field label="From"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Field label="To"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
          <Field label="Engineer">
            <Select value={engineerId} onChange={(e) => setEngineerId(e.target.value)}>
              <option value="">All</option>
              {(engineers.data || []).map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All</option>
              {ATTENDANCE_STATUSES.map((item) => <option key={item}>{item}</option>)}
            </Select>
          </Field>
          <Button type="submit" className="self-end">Show report</Button>
        </form>
        {att.length ? (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
              <StatCard label="Present" value={counts.Present || 0} tone="ok" />
              <StatCard label="Absent" value={counts.Absent || 0} tone="danger" />
              <StatCard label="Leave" value={counts.Leave || 0} />
              <StatCard label="Half day" value={counts["Half Day"] || 0} tone="warn" />
              <StatCard label="Total" value={att.length} />
            </div>
            <div className="mt-4">
              <DataTable
                columns={[
                  { key: "attDate", label: "Date" },
                  { key: "engineer", label: "Engineer" },
                  { key: "status", label: "Status" },
                  { key: "remarks", label: "Remarks" },
                ]}
                rows={att}
              />
            </div>
          </>
        ) : null}
      </Card>
    </div>
  );
}
