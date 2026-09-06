import { apiHandler } from "@/lib/api-handler";
import { ok, readJson } from "@/lib/http";
import { ticketSchema } from "@/lib/validations";
import { listTickets, saveTicket } from "@/lib/services/tickets";

export const GET = apiHandler("user", async (_request, _ctx, user) => {
  const engineerId = user?.role === "engineer" ? user.engineerId : undefined;
  return ok(await listTickets(engineerId ? { engineerId } : undefined));
});

export const POST = apiHandler("admin", async (request) => {
  return ok(await saveTicket(ticketSchema.parse(await readJson(request))), 201);
});
