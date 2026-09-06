import { apiHandler } from "@/lib/api-handler";
import { ok } from "@/lib/http";
import { listCompanies } from "@/lib/services/masters";
import { listCustomers } from "@/lib/services/customers";
import { listEngineers } from "@/lib/services/engineers";
import { listTickets } from "@/lib/services/tickets";

export const GET = apiHandler("user", async (_request, _ctx, user) => {
  const [companies, customers, engineers, tickets] = await Promise.all([
    user?.role === "admin" ? listCompanies() : Promise.resolve([]),
    user?.role === "admin" ? listCustomers() : Promise.resolve([]),
    listEngineers(),
    listTickets(user?.role === "engineer" ? { engineerId: user.engineerId } : undefined),
  ]);
  return ok({ companies, customers, engineers, tickets });
});
