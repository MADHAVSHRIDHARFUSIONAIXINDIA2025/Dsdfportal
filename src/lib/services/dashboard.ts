import { formatMonth, monthKey } from "@/lib/utils";
import { Customer, Engineer, Ticket } from "@/models";
import { computeSla } from "@/lib/sla";
import type { RepeatLinkRow, TicketFlowBucket } from "@/types";

export async function dashboardStats() {
  const [customers, tickets, engineers] = await Promise.all([
    Customer.find().lean(),
    Ticket.find().lean(),
    Engineer.find({ status: "Active" }).lean(),
  ]);

  const ticketStats = tickets.map((ticket) =>
    computeSla(ticket.openTime, ticket.closeTime, ticket.slaHours)
  );

  return {
    customers: customers.length,
    links: customers.filter((row) => row.linkId).length,
    open: tickets.filter((row) => row.status !== "Closed").length,
    closed: tickets.filter((row) => row.status === "Closed").length,
    breached: ticketStats.filter((row) => row.slaResult === "BREACHED").length,
    engineers: engineers.length,
  };
}

export async function ticketFlow(): Promise<TicketFlowBucket[]> {
  const tickets = await Ticket.find().lean();
  const buckets = new Map<string, { implementation: number; support: number }>();

  for (const ticket of tickets) {
    const key = monthKey(ticket.openTime);
    if (!key) continue;
    const current = buckets.get(key) || { implementation: 0, support: 0 };
    if (ticket.ticketType === "Implementation") current.implementation += 1;
    else current.support += 1;
    buckets.set(key, current);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({
      month,
      label: formatMonth(month),
      ...value,
    }));
}

export async function repeatLinks(): Promise<RepeatLinkRow[]> {
  const tickets = await Ticket.find().populate("customerId").lean();
  const groups = new Map<string, typeof tickets>();

  for (const ticket of tickets) {
    const customer = ticket.customerId as { linkId?: string; name?: string; city?: string } | null;
    const linkId = customer?.linkId;
    const month = monthKey(ticket.openTime);
    if (!linkId || !month) continue;
    const key = `${month}|${linkId}`;
    const current = groups.get(key) || [];
    current.push(ticket);
    groups.set(key, current);
  }

  const rows: RepeatLinkRow[] = [];
  for (const [key, arr] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const sorted = [...arr].sort((a, b) => String(a.openTime).localeCompare(String(b.openTime)));
    const repeats: typeof sorted = [];
    let lastResolved: Date | null = null;
    for (const ticket of sorted) {
      if (lastResolved) {
        const opened = new Date(String(ticket.openTime).replace(" ", "T"));
        if (!Number.isNaN(opened.getTime()) && opened >= lastResolved) repeats.push(ticket);
      }
      if (["Resolved", "Closed"].includes(ticket.status) && ticket.closeTime) {
        const closed = new Date(String(ticket.closeTime).replace(" ", "T"));
        if (!Number.isNaN(closed.getTime())) lastResolved = closed;
      }
    }
    if (!repeats.length) continue;
    const [month, linkId] = key.split("|");
    const customer = sorted[0].customerId as { name?: string; city?: string };
    rows.push({
      month,
      linkId,
      customer: customer?.name || "",
      city: customer?.city || "",
      repeatCount: repeats.length,
      totalTickets: sorted.length,
      firstOpen: String(sorted[0].openTime || ""),
      lastRepeatOpen: String(repeats[repeats.length - 1].openTime || ""),
      ticketNos: sorted.map((ticket) => ticket.tktNo).join(", "),
    });
  }

  return rows;
}

export async function recentTickets(limit = 8) {
  const { listTickets } = await import("@/lib/services/tickets");
  return (await listTickets()).slice(0, limit);
}

export async function exportCollection(name: string) {
  const { listCompanies } = await import("@/lib/services/masters");
  const { listCustomers } = await import("@/lib/services/customers");
  const { listEngineers } = await import("@/lib/services/engineers");
  const { listTickets } = await import("@/lib/services/tickets");
  const { listAttendance } = await import("@/lib/services/attendance");

  const loaders: Record<string, () => Promise<unknown[]>> = {
    companies: listCompanies,
    customers: listCustomers,
    engineers: listEngineers,
    tickets: listTickets,
    attendance: listAttendance,
  };

  const loader = loaders[name];
  if (!loader) throw new Error("Unknown export");
  return loader();
}
