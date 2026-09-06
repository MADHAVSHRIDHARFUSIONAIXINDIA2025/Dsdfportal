import { apiHandler } from "@/lib/api-handler";
import { ok, readJson } from "@/lib/http";
import { customerSchema } from "@/lib/validations";
import { deleteCustomer, saveCustomer } from "@/lib/services/customers";

export const PATCH = apiHandler("admin", async (request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  return ok(await saveCustomer(customerSchema.parse(await readJson(request)), id));
});

export const DELETE = apiHandler("admin", async (_request, ctx: { params: Promise<{ id: string }> }) => {
  await deleteCustomer((await ctx.params).id);
  return ok({ ok: true });
});
