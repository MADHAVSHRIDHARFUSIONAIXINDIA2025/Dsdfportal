"use client";

import { PageIntro } from "@/components/layout/PageIntro";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Card, StatCard } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { useResource } from "@/hooks/useResource";
import Link from "next/link";

type Home = {
  stats: { assigned: number; open: number; closed: number };
  tickets: Array<{
    id: string;
    tktNo: string;
    customer: string;
    status: string;
    ticketType: string;
    priority: string;
    city: string;
    linkId?: string;
    openTime?: string;
  }>;
};

export default function EngineerHomePage() {
  const { data, loading } = useResource<Home>("/api/dashboard");
  if (loading) return <p className="text-muted">Loading your jobs...</p>;
  if (!data) return <p className="text-muted">Unable to load field data. Refresh and try again.</p>;

  return (
    <div>
      <PageIntro title="Field workspace" subtitle="Assigned tickets and attendance in one place." />
      <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
        <StatCard label="Assigned" value={data.stats.assigned} />
        <StatCard label="Open" value={data.stats.open} tone="warn" />
        <StatCard label="Closed" value={data.stats.closed} tone="ok" />
      </div>

      <div className="mt-6 grid gap-3 lg:hidden">
        <div className="flex gap-3">
          <Link href="/ext/attendance" className="flex-1 rounded-3xl bg-navy p-4 text-white">
            <p className="text-xs uppercase tracking-[0.16em] text-blue-200">Quick</p>
            <p className="mt-1 font-bold">Mark attendance</p>
          </Link>
          <Link href="/ext/tickets" className="flex-1 rounded-3xl bg-brand p-4 text-white">
            <p className="text-xs uppercase tracking-[0.16em] text-blue-100">Jobs</p>
            <p className="mt-1 font-bold">Open tickets</p>
          </Link>
        </div>
      </div>

      <div className="mt-6 hidden gap-3 lg:flex">
        <Link href="/ext/attendance" className="rounded-2xl bg-navy px-5 py-3 font-semibold text-white">
          Mark attendance
        </Link>
        <Link href="/ext/tickets" className="rounded-2xl bg-brand px-5 py-3 font-semibold text-white">
          Open tickets
        </Link>
        <Link href="/ext/settings" className="rounded-2xl border border-line bg-white px-5 py-3 font-semibold text-ink">
          Update password
        </Link>
      </div>

      <h3 className="mt-8 font-bold">Latest assignments</h3>
      <div className="mt-3 space-y-3 md:hidden">
        {data.tickets.length ? (
          data.tickets.map((ticket) => (
            <Card key={ticket.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{ticket.tktNo}</p>
                  <p className="mt-1 text-sm text-muted">{ticket.customer}</p>
                  <p className="text-xs text-muted">{ticket.city}</p>
                </div>
                <Badge tone={statusTone(ticket.status)}>{ticket.status}</Badge>
              </div>
            </Card>
          ))
        ) : (
          <EmptyState title="No tickets assigned" hint="You will get WhatsApp when a ticket is assigned." />
        )}
      </div>
      <div className="mt-3">
        <DataTable
          columns={[
            { key: "tktNo", label: "Ticket" },
            { key: "ticketType", label: "Type" },
            { key: "customer", label: "Customer" },
            { key: "city", label: "City" },
            { key: "priority", label: "Priority" },
            { key: "status", label: "Status" },
          ]}
          rows={data.tickets}
        />
      </div>
    </div>
  );
}
