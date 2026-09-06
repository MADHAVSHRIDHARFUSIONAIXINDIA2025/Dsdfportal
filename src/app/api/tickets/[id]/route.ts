import { apiHandler } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";
import { ok, readJson } from "@/lib/http";
import { ticketSchema } from "@/lib/validations";
import { deleteTicket, saveTicket } from "@/lib/services/tickets";

export const PATCH = apiHandler("user", async (request, ctx: { params: Promise<{ id: string }> }, user) => {
  const body = ticketSchema.parse(await readJson(request));
  if (user?.role === "engineer") {
    if (body.eng1Id !== user.engineerId && body.eng2Id !== user.engineerId) {
      throw new AppError("You can only update tickets assigned to you", 403);
    }
  }
  return ok(await saveTicket(body, (await ctx.params).id));
});

export const DELETE = apiHandler("admin", async (_request, ctx: { params: Promise<{ id: string }> }) => {
  await deleteTicket((await ctx.params).id);
  return ok({ ok: true });
});
