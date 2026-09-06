import { apiHandler } from "@/lib/api-handler";
import { ok, readJson } from "@/lib/http";
import { companySchema } from "@/lib/validations";
import { listCompanies, saveCompany } from "@/lib/services/masters";

export const GET = apiHandler("admin", async () => ok(await listCompanies()));

export const POST = apiHandler("admin", async (request) => {
  const body = companySchema.parse(await readJson(request));
  return ok(await saveCompany(body), 201);
});
