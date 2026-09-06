"use client";

import { Badge, statusTone } from "@/components/ui/Badge";
import { Card, StatCard } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageIntro } from "@/components/layout/PageIntro";
import { useResource } from "@/hooks/useResource";

type Dashboard = {
  stats: {
    customers: number;
    links: number;
    open: number;
    closed: number;
    breached: number;
    engineers: number;
  };
  tickets: Array<{
    id: string;
    tktNo: string;
    customer: string;
    status: string;
    ticketType: string;
    slaResult?: string | null;
    openTime: string;
  }>;
  flow: Array<{ label: string; implementation: number; support: number }>;
};

export default function AdminDashboardPage() {
  const { data, loading } = useResource<Dashboard>("/api/dashboard");
  if (loading || !data) return <p className="text-muted">Loading operations...</p>;

  const max = Math.max(1, ...data.flow.map((row) => Math.max(row.implementation, row.support)));

  return (
    <div>
      <PageIntro title="Operations dashboard" subtitle="Live view of links, incidents, SLA and field strength." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Customers" value={data.stats.customers} />
        <StatCard label="Links" value={data.stats.links} />
        <StatCard label="Open tickets" value={data.stats.open} tone="warn" />
        <StatCard label="Closed" value={data.stats.closed} tone="ok" />
        <StatCard label="SLA breached" value={data.stats.breached} tone="danger" />
        <StatCard label="Active FE" value={data.stats.engineers} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <h3 className="font-bold text-ink">Incoming ticket flow</h3>
          <div className="mt-4 space-y-4">
            {data.flow.length ? (
              data.flow.map((row) => (
                <div key={row.label}>
                  <p className="mb-2 text-sm font-semibold">{row.label}</p>
                  {[
                    ["Implementation", row.implementation],
                    ["Support", row.support],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="mb-2 grid grid-cols-[110px_1fr_40px] items-center gap-2">
                      <span className="text-xs text-muted">{label}</span>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(6, (Number(value) / max) * 100)}%` }} />
                      </div>
                      <span className="text-xs font-bold">{value}</span>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <EmptyState title="No ticket dates yet" />
            )}
          </div>
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-bold text-ink">Recent tickets</h3>
          <div className="mt-4 space-y-3">
            {data.tickets.length ? (
              data.tickets.map((ticket) => (
                <div key={ticket.id} className="rounded-2xl bg-canvas p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold">{ticket.tktNo}</p>
                    <Badge tone={statusTone(ticket.status)}>{ticket.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted">{ticket.customer}</p>
                  <p className="mt-1 text-xs text-muted">
                    {ticket.ticketType} · {ticket.openTime}
                    {ticket.slaResult ? ` · ${ticket.slaResult}` : ""}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState title="No tickets yet" />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
