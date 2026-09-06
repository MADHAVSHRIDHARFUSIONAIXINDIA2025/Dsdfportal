import { apiHandler } from "@/lib/api-handler";
import { ok, readJson } from "@/lib/http";
import { engineerSchema } from "@/lib/validations";
import { listEngineers, saveEngineer } from "@/lib/services/engineers";

export const GET = apiHandler("user", async () => ok(await listEngineers()));

export const POST = apiHandler("admin", async (request) => {
  return ok(await saveEngineer(engineerSchema.parse(await readJson(request))), 201);
});
