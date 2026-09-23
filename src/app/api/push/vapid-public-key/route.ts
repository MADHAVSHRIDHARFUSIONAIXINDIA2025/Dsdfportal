import { apiHandler } from "@/lib/api-handler";
import { ok } from "@/lib/http";
import { getVapidPublicKey, isPushConfigured } from "@/lib/push";

export const GET = apiHandler("public", async () => {
  return ok({
    configured: isPushConfigured(),
    publicKey: getVapidPublicKey(),
  });
});
