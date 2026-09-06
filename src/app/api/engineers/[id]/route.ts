import { apiHandler } from "@/lib/api-handler";
import { ok, readJson } from "@/lib/http";
import { engineerSchema } from "@/lib/validations";
import { deleteEngineer, saveEngineer } from "@/lib/services/engineers";

export const PATCH = apiHandler("admin", async (request, ctx: { params: Promise<{ id: string }> }) => {
  return ok(await saveEngineer(engineerSchema.parse(await readJson(request)), (await ctx.params).id));
});

export const DELETE = apiHandler("admin", async (_request, ctx: { params: Promise<{ id: string }> }) => {
  await deleteEngineer((await ctx.params).id);
  return ok({ ok: true });
});
