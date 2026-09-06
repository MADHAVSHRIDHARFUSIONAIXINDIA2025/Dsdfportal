import { apiHandler } from "@/lib/api-handler";
import { ok } from "@/lib/http";
import { dashboardStats, recentTickets, ticketFlow } from "@/lib/services/dashboard";
import { listTickets } from "@/lib/services/tickets";

export const GET = apiHandler("user", async (_request, _ctx, user) => {
  if (user?.role === "engineer") {
    const tickets = await listTickets({ engineerId: user.engineerId });
    return ok({
      role: "engineer",
      stats: {
        assigned: tickets.length,
        open: tickets.filter((row) => row.status !== "Closed").length,
        closed: tickets.filter((row) => row.status === "Closed").length,
      },
      tickets: tickets.slice(0, 8),
    });
  }

  const [stats, tickets, flow] = await Promise.all([dashboardStats(), recentTickets(), ticketFlow()]);
  return ok({ role: "admin", stats, tickets, flow });
});
