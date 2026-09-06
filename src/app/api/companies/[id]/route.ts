import { apiHandler } from "@/lib/api-handler";
import { ok, readJson } from "@/lib/http";
import { companySchema } from "@/lib/validations";
import { deleteCompany, saveCompany } from "@/lib/services/masters";

export const PATCH = apiHandler("admin", async (request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const body = companySchema.parse(await readJson(request));
  return ok(await saveCompany(body, id));
});

export const DELETE = apiHandler("admin", async (_request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  await deleteCompany(id);
  return ok({ ok: true });
});
