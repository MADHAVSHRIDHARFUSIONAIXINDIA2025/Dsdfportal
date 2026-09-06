import { apiHandler } from "@/lib/api-handler";
import { ok } from "@/lib/http";
import { isWhatsAppConfigured } from "@/lib/whatsapp";

export const GET = apiHandler("admin", async () => {
  return ok({
    configured: isWhatsAppConfigured(),
    businessNumber: process.env.WHATSAPP_BUSINESS_NUMBER || "",
    hasToken: Boolean(process.env.WHATSAPP_TOKEN),
    hasPhoneNumberId: Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID),
  });
});
