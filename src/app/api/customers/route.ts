import { apiHandler } from "@/lib/api-handler";
import { ok, readJson } from "@/lib/http";
import { customerSchema } from "@/lib/validations";
import { listCustomers, saveCustomer } from "@/lib/services/customers";

export const GET = apiHandler("admin", async () => ok(await listCustomers()));

export const POST = apiHandler("admin", async (request) => {
  const body = customerSchema.parse(await readJson(request));
  return ok(await saveCustomer(body), 201);
});
