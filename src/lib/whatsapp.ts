import { COMPANY_LEGAL } from "@/lib/constants";
import { normalizePhone } from "@/lib/utils";

export type TicketNotifyInput = {
  to: string;
  engineerName: string;
  ticketNo: string;
  ticketType: string;
  customer: string;
  linkId?: string;
  priority: string;
  city?: string;
  status?: string;
  aEnd?: string;
  bEnd?: string;
  openTime?: string;
  slaHours?: number | string;
  affectedPath?: string;
  remarks?: string;
};

function twilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID || "";
  const authToken = process.env.TWILIO_AUTH_TOKEN || "";
  const from = process.env.TWILIO_WHATSAPP_FROM || "";
  const contentSid = process.env.TWILIO_CONTENT_SID || "";
  return { accountSid, authToken, from, contentSid };
}

export function isWhatsAppConfigured() {
  const { accountSid, authToken, from } = twilioConfig();
  return Boolean(accountSid && authToken && from);
}

export function toWhatsAppAddress(mobile: string) {
  const phone = normalizePhone(mobile);
  if (!phone) return "";
  return phone.startsWith("whatsapp:") ? phone : `whatsapp:+${phone}`;
}

export function assignmentMessage(input: TicketNotifyInput) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return [
    COMPANY_LEGAL,
    `Hello ${input.engineerName}, a ticket has been assigned to you.`,
    "",
    `Ticket: ${input.ticketNo}`,
    `Type: ${input.ticketType}`,
    `Priority: ${input.priority}`,
    input.status ? `Status: ${input.status}` : "",
    `Customer: ${input.customer || "—"}`,
    input.linkId ? `Link ID: ${input.linkId}` : "",
    input.city ? `City: ${input.city}` : "",
    input.aEnd || input.bEnd ? `Path: ${input.aEnd || "—"} → ${input.bEnd || "—"}` : "",
    input.affectedPath ? `Affected path: ${input.affectedPath}` : "",
    input.openTime ? `Open time: ${input.openTime}` : "",
    input.slaHours != null && input.slaHours !== "" ? `SLA: ${input.slaHours} hrs` : "",
    input.remarks ? `Remarks: ${input.remarks}` : "",
    "",
    `Open field app: ${appUrl}/ext/tickets`,
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}

export function generateWhatsAppLink(input: TicketNotifyInput) {
  const phone = normalizePhone(input.to);
  const message = assignmentMessage(input);
  return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : null;
}

function contentVariables(input: TicketNotifyInput, body: string) {
  // Maps common Content Template placeholders ({{1}}..{{12}})
  return JSON.stringify({
    "1": input.engineerName || "-",
    "2": input.ticketNo || "-",
    "3": input.ticketType || "-",
    "4": input.priority || "-",
    "5": input.customer || "-",
    "6": input.linkId || "-",
    "7": input.city || "-",
    "8": input.status || "-",
    "9": [input.aEnd, input.bEnd].filter(Boolean).join(" → ") || "-",
    "10": input.openTime || "-",
    "11": String(input.slaHours ?? "-"),
    "12": body.slice(0, 900),
  });
}

export async function sendTwilioWhatsApp(to: string, body: string, input?: TicketNotifyInput) {
  const { accountSid, authToken, from, contentSid } = twilioConfig();
  const toAddr = toWhatsAppAddress(to);

  if (!toAddr) throw new Error("WhatsApp number is missing");
  if (!accountSid || !authToken || !from) {
    console.info("[whatsapp:dry-run]", { to: toAddr, body });
    return {
      ok: false as const,
      dryRun: true as const,
      error: "Twilio WhatsApp is not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM.",
    };
  }

  const authHeader = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;
  const fromAddr = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;

  async function postMessage(payload: URLSearchParams) {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: payload.toString(),
      }
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message =
        data?.message ||
        data?.error_message ||
        (typeof data === "string" ? data : "Twilio WhatsApp send failed");
      throw new Error(message);
    }
    return data;
  }

  // Prefer Content template (required for business-initiated WhatsApp), fall back to Body
  if (contentSid) {
    try {
      const params = new URLSearchParams();
      params.set("To", toAddr);
      params.set("From", fromAddr);
      params.set("ContentSid", contentSid);
      params.set(
        "ContentVariables",
        contentVariables(
          input || {
            to,
            engineerName: "",
            ticketNo: "",
            ticketType: "",
            customer: "",
            priority: "",
          },
          body
        )
      );
      const data = await postMessage(params);
      return { ok: true as const, dryRun: false as const, data };
    } catch (error) {
      console.warn("[whatsapp] ContentSid send failed, retrying with Body:", error);
    }
  }

  const bodyParams = new URLSearchParams();
  bodyParams.set("To", toAddr);
  bodyParams.set("From", fromAddr);
  bodyParams.set("Body", body);
  const data = await postMessage(bodyParams);
  return { ok: true as const, dryRun: false as const, data };
}

/** @deprecated Meta Cloud API — use Twilio via sendTwilioWhatsApp */
export async function sendWhatsAppText(to: string, body: string) {
  return sendTwilioWhatsApp(to, body);
}

export async function notifyTicketAssignment(input: TicketNotifyInput) {
  if (!isWhatsAppConfigured()) {
    return {
      ok: false as const,
      dryRun: true as const,
      whatsappLink: generateWhatsAppLink(input),
      error: "Twilio WhatsApp not configured. Click the link to send manually.",
    };
  }

  try {
    const body = assignmentMessage(input);
    return await sendTwilioWhatsApp(input.to, body, input);
  } catch (error) {
    console.error("[whatsapp]", error);
    return {
      ok: false as const,
      dryRun: false as const,
      whatsappLink: generateWhatsAppLink(input),
      error: error instanceof Error ? error.message : "WhatsApp failed",
    };
  }
}

export async function notifyOnboarding(to: string, name: string, url: string) {
  const body = [
    COMPANY_LEGAL,
    `Hello ${name}, your field app access is ready.`,
    `Open this onboarding link on your phone:`,
    url,
    `Set your WhatsApp number and password to activate.`,
  ].join("\n");

  try {
    return await sendTwilioWhatsApp(to, body);
  } catch (error) {
    console.error("[whatsapp]", error);
    return { ok: false as const, error: error instanceof Error ? error.message : "WhatsApp failed" };
  }
}
