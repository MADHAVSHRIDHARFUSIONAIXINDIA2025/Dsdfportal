import { COMPANY_LEGAL } from "@/lib/constants";
import { normalizePhone } from "@/lib/utils";

type TicketNotifyInput = {
  to: string;
  engineerName: string;
  ticketNo: string;
  ticketType: string;
  customer: string;
  linkId?: string;
  priority: string;
  city?: string;
};

export function isWhatsAppConfigured() {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

export async function sendWhatsAppText(to: string, body: string) {
  const phone = normalizePhone(to);
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const version = process.env.WHATSAPP_API_VERSION || "v21.0";

  if (!phone) throw new Error("WhatsApp number is missing");
  if (!token || !phoneNumberId) {
    console.info("[whatsapp:dry-run]", { to: phone, body });
    return { ok: false, dryRun: true, error: "WhatsApp is not configured. Add WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID." };
  }

  const template = process.env.WHATSAPP_TEMPLATE_NAME;
  const payload = template
    ? {
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
          name: template,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "en" },
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text: body.slice(0, 1024) }],
            },
          ],
        },
      }
    : {
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { preview_url: true, body },
      };

  const response = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.message || "WhatsApp send failed");
  }

  return { ok: true, dryRun: false, data };
}

export function assignmentMessage(input: TicketNotifyInput) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return [
    `${COMPANY_LEGAL}`,
    `Hello ${input.engineerName}, a ticket has been assigned to you.`,
    `Ticket: ${input.ticketNo}`,
    `Type: ${input.ticketType}`,
    `Priority: ${input.priority}`,
    `Customer: ${input.customer}`,
    input.linkId ? `Link: ${input.linkId}` : "",
    input.city ? `City: ${input.city}` : "",
    `Open field app: ${appUrl}/ext/tickets`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function notifyTicketAssignment(input: TicketNotifyInput) {
  try {
    return await sendWhatsAppText(input.to, assignmentMessage(input));
  } catch (error) {
    console.error("[whatsapp]", error);
    return { ok: false, dryRun: false, error: error instanceof Error ? error.message : "WhatsApp failed" };
  }
}

export async function notifyOnboarding(to: string, name: string, url: string) {
  const body = [
    `${COMPANY_LEGAL}`,
    `Hello ${name}, your field app access is ready.`,
    `Open this onboarding link on your phone:`,
    url,
    `Set your WhatsApp number and password to activate.`,
  ].join("\n");
  try {
    return await sendWhatsAppText(to, body);
  } catch (error) {
    console.error("[whatsapp]", error);
    return { ok: false, error: error instanceof Error ? error.message : "WhatsApp failed" };
  }
}
