import { apiHandler } from "@/lib/api-handler";
import { ok } from "@/lib/http";
import { isWhatsAppConfigured } from "@/lib/whatsapp";

export const GET = apiHandler("admin", async () => {
  return ok({
    configured: isWhatsAppConfigured(),
    provider: "twilio",
    from: process.env.TWILIO_WHATSAPP_FROM || "",
    hasAccountSid: Boolean(process.env.TWILIO_ACCOUNT_SID),
    hasAuthToken: Boolean(process.env.TWILIO_AUTH_TOKEN),
    hasContentSid: Boolean(process.env.TWILIO_CONTENT_SID),
    businessNumber: process.env.WHATSAPP_BUSINESS_NUMBER || "",
  });
});
